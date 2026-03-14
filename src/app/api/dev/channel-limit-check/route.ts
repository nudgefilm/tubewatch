import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config/admin";
import { getUserChannelLimit } from "@/lib/admin/adminTools";

export const dynamic = "force-dynamic";

type ChannelLimitCheckResponse = {
  userId: string;
  currentChannels: number;
  maxChannels: number;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }

    const { data: channels, error: countError } = await supabase
      .from("user_channels")
      .select("id")
      .eq("user_id", user.id);

    if (countError) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const currentChannels = channels?.length ?? 0;
    const maxChannels = await getUserChannelLimit(
      supabase,
      user.id,
      user.email
    );

    const body: ChannelLimitCheckResponse = {
      userId: user.id,
      currentChannels,
      maxChannels,
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
