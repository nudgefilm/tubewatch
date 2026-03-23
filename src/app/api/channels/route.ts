import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { parseChannelRegistrationInput } from "@/lib/channels/parseChannelRegistrationInput";
import { getChannelInfo } from "@/lib/youtube/getChannelInfo";

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

export async function POST(request: Request) {
  let body: { channel_url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const raw =
    typeof body.channel_url === "string" ? body.channel_url.trim() : "";
  if (!raw) {
    return NextResponse.json(
      { error: "채널 URL 또는 채널 ID를 입력해 주세요." },
      { status: 400 }
    );
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

  let supabase: ReturnType<typeof createSupabaseWithBearer>;
  try {
    supabase = createSupabaseWithBearer(request);
  } catch {
    return NextResponse.json(
      { error: "서버 설정 오류입니다." },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  let info;
  try {
    info = await getChannelInfo(lookup);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[api/channels] getChannelInfo", msg);
    return NextResponse.json(
      { error: "채널 정보를 찾을 수 없습니다. URL·핸들·채널 ID를 확인해 주세요." },
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
