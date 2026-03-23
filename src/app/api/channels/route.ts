import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseChannelRegistrationInput } from "@/lib/channels/parseChannelRegistrationInput";
import { getChannelInfo } from "@/lib/youtube/getChannelInfo";
import { createClient as createServerClient } from "@/lib/supabase/server";

function createSupabaseWithBearer(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env not configured");
  }
  const authHeader = request.headers.get("authorization");
  return createClient(url, key, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

type AuthedClient = { supabase: SupabaseClient; user: { id: string } };

async function getAuthenticatedClient(
  request: Request
): Promise<AuthedClient | null> {
  const serverSupabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await serverSupabase.auth.getUser();
  if (!error && user) {
    return { supabase: serverSupabase as SupabaseClient, user };
  }

  try {
    const supabase = createSupabaseWithBearer(request);
    const {
      data: { user: u2 },
      error: e2,
    } = await supabase.auth.getUser();
    if (!e2 && u2) {
      return { supabase: supabase as SupabaseClient, user: u2 };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  );
}

/** 목록: 로그인 사용자의 user_channels */
export async function GET(request: Request) {
  const authed = await getAuthenticatedClient(request);
  if (!authed) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { supabase, user } = authed;
  const { data, error } = await supabase
    .from("user_channels")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[api/channels] GET", error);
    return NextResponse.json(
      { error: "채널 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}

/** 등록: channel_url 또는 channel_id(UC…) */
export async function POST(request: Request) {
  let body: { channel_url?: unknown; channel_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const channelUrl =
    typeof body.channel_url === "string" ? body.channel_url.trim() : "";
  const channelIdField =
    typeof body.channel_id === "string" ? body.channel_id.trim() : "";
  const raw = channelUrl || channelIdField;

  if (!raw) {
    return NextResponse.json(
      { error: "channel_url 또는 channel_id를 입력해 주세요." },
      { status: 400 }
    );
  }

  const authed = await getAuthenticatedClient(request);
  if (!authed) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { supabase, user } = authed;

  const lookup = parseChannelRegistrationInput(raw);
  if (!lookup) {
    return NextResponse.json(
      {
        error:
          "인식할 수 없는 형식입니다. youtube.com/@핸들, /channel/UC…, 또는 UC로 시작하는 채널 ID를 입력해 주세요.",
      },
      { status: 400 }
    );
  }

  let info;
  try {
    info = await getChannelInfo(lookup);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[api/channels] getChannelInfo", msg);
    return NextResponse.json(
      {
        error:
          "채널 정보를 찾을 수 없습니다. URL·핸들·채널 ID를 확인해 주세요.",
      },
      { status: 422 }
    );
  }

  const canonicalUrl = `https://www.youtube.com/channel/${info.channel_id}`;

  const { data: existing } = await supabase
    .from("user_channels")
    .select("id")
    .eq("user_id", user.id)
    .eq("channel_id", info.channel_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "이미 등록된 채널입니다." },
      { status: 409 }
    );
  }

  const { data: inserted, error: insErr } = await supabase
    .from("user_channels")
    .insert({
      user_id: user.id,
      channel_url: canonicalUrl,
      channel_id: info.channel_id,
      channel_title: info.channel_title,
      thumbnail_url: info.thumbnail_url,
      subscriber_count: info.subscriber_count,
      video_count: info.video_count,
      view_count: info.view_count,
    })
    .select()
    .single();

  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json(
        { error: "이미 등록된 채널입니다." },
        { status: 409 }
      );
    }
    console.error("[api/channels] insert", insErr);
    return NextResponse.json(
      { error: "채널 등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "채널이 등록되었습니다.",
    data: inserted,
  });
}

/** 삭제: 본문의 channel_id 또는 id = user_channels 행 id (UUID) */
export async function DELETE(request: Request) {
  let body: { channel_id?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const idRaw =
    typeof body.id === "string"
      ? body.id.trim()
      : typeof body.channel_id === "string"
        ? body.channel_id.trim()
        : "";

  if (!idRaw) {
    return NextResponse.json(
      { error: "삭제할 채널 id(channel_id)가 필요합니다." },
      { status: 400 }
    );
  }

  if (!isUuidLike(idRaw)) {
    return NextResponse.json(
      { error: "유효하지 않은 채널 식별자입니다." },
      { status: 400 }
    );
  }

  const authed = await getAuthenticatedClient(request);
  if (!authed) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { supabase, user } = authed;

  const { data: row, error: findErr } = await supabase
    .from("user_channels")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", idRaw)
    .maybeSingle();

  if (findErr) {
    console.error("[api/channels] delete find", findErr);
    return NextResponse.json(
      { error: "채널을 확인하지 못했습니다." },
      { status: 500 }
    );
  }

  if (!row) {
    return NextResponse.json(
      { error: "삭제할 채널을 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    );
  }

  const { error: delErr } = await supabase
    .from("user_channels")
    .delete()
    .eq("user_id", user.id)
    .eq("id", idRaw);

  if (delErr) {
    console.error("[api/channels] delete", delErr);
    return NextResponse.json(
      { error: "채널 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "채널이 삭제되었습니다." });
}
