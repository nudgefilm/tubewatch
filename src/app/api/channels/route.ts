import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseChannelRegistrationInput } from "@/lib/channels/parseChannelRegistrationInput";
import { getChannelInfo } from "@/lib/youtube/getChannelInfo";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import { getEffectiveLimits } from "@/lib/server/subscription/getEffectiveLimits";

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
  // Sidebar·채널 목록 렌더에 필요한 컬럼만 조회 (subscriber_count 등 미사용 컬럼 제외)
  const { data, error } = await supabase
    .from("user_channels")
    .select("id, channel_title, channel_url, channel_id, thumbnail_url, created_at")
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

  console.log("[Channels API] request body:", JSON.stringify(body));

  if (!raw) {
    return NextResponse.json(
      { error: "channel_url 또는 channel_id를 입력해 주세요." },
      { status: 400 }
    );
  }

  const authed = await getAuthenticatedClient(request);
  console.log("[Channels API] user:", authed ? { id: authed.user.id } : null);
  if (!authed) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { supabase, user } = authed;

  const { count: currentCount } = await supabase
    .from("user_channels")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  console.log("[Channels API] current count:", currentCount);

  const isAdmin = await isAdminUser(user.id);
  if (!isAdmin) {
    const limits = await getEffectiveLimits(supabase, user.id);
    if ((currentCount ?? 0) >= limits.channelLimit) {
      return NextResponse.json(
        { error: `채널은 최대 ${limits.channelLimit}개까지 등록할 수 있습니다.` },
        { status: 403 }
      );
    }
  }

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
    console.error("[Channels API] error: getChannelInfo failed:", msg);
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

  const insertPayload = {
    user_id: user.id,
    channel_url: canonicalUrl,
    channel_id: info.channel_id,
    channel_title: info.channel_title,
    thumbnail_url: info.thumbnail_url,
    subscriber_count: info.subscriber_count,
    video_count: info.video_count,
    // view_count: user_channels 테이블에 해당 컬럼 없음 — 제거
  };
  console.log("[Channels API] insert payload:", JSON.stringify(insertPayload));

  const { data: inserted, error: insErr } = await supabase
    .from("user_channels")
    .insert(insertPayload)
    .select()
    .single();

  console.log("[Channels API] insert result:", inserted ? { id: inserted.id, user_id: inserted.user_id, channel_id: inserted.channel_id } : null);
  if (insErr) {
    console.error("[Channels API] error: insert failed code:", insErr.code, "msg:", insErr.message, "details:", insErr.details);
  }

  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json(
        { error: "이미 등록된 채널입니다." },
        { status: 409 }
      );
    }
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

  // ─── 연관 데이터 순차 삭제 (admin client — RLS DELETE 정책 없는 테이블)
  // 삭제 순서: FK 의존성 높은 테이블 → 낮은 테이블 → user_channels
  const cascadeSteps: Array<{ table: string; field: string }> = [
    { table: "credit_reservations",    field: "channel_id" },
    { table: "credit_logs",            field: "channel_id" },
    { table: "analysis_module_results", field: "channel_id" },
    { table: "analysis_jobs",          field: "user_channel_id" },
    { table: "analysis_runs",          field: "channel_id" },
    { table: "analysis_results",       field: "user_channel_id" },
  ];

  for (const { table, field } of cascadeSteps) {
    const { error: stepErr } = await supabaseAdmin
      .from(table)
      .delete()
      .eq("user_id", user.id)
      .eq(field, idRaw);
    if (stepErr) {
      console.error(`[api/channels] cascade delete failed on ${table}:`, stepErr);
      return NextResponse.json(
        { error: `채널 데이터 삭제 중 오류가 발생했습니다. (${table})` },
        { status: 500 }
      );
    }
  }

  // user_channels 본행 삭제 (user client — RLS 적용)
  const { error: delErr } = await supabase
    .from("user_channels")
    .delete()
    .eq("user_id", user.id)
    .eq("id", idRaw);

  if (delErr) {
    console.error("[api/channels] delete user_channels", delErr);
    return NextResponse.json(
      { error: "채널 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "채널이 삭제되었습니다." });
}
