import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_SECTIONS = ["hero", "growth", "signals", "patterns", "action_plan"] as const;
type Section = (typeof VALID_SECTIONS)[number];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ checks: [] });

  const reportId = req.nextUrl.searchParams.get("reportId");
  if (!reportId) return NextResponse.json({ checks: [] });

  const { data } = await supabase
    .from("report_action_checks")
    .select("section, checked")
    .eq("user_id", user.id)
    .eq("report_id", reportId);

  return NextResponse.json({ checks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { reportId, section, checked } = body as { reportId: string; section: Section; checked: boolean };

  if (!reportId || !VALID_SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { error } = await supabase
    .from("report_action_checks")
    .upsert(
      { user_id: user.id, report_id: reportId, section, checked },
      { onConflict: "user_id,report_id,section" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
