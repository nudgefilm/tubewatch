import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/config/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = createSupabaseServerClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "로그인 필요" },
        { status: 401 }
      );
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { ok: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const userChannelId = body?.user_channel_id;

    if (!userChannelId || typeof userChannelId !== "string") {
      return NextResponse.json(
        { ok: false, error: "user_channel_id 필요" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("user_channels")
      .update({
        last_analyzed_at: null,
        last_analysis_requested_at: null,
      })
      .eq("id", userChannelId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: `업데이트 실패: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "분석 상태가 초기화되었습니다.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
