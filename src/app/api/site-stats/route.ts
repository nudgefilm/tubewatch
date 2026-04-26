import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    todayVisitors,
    totalVisitors,
    channelsCount,
    analysisCount,
    subscriberData,
    videoCountData,
  ] = await Promise.all([
    supabaseAdmin.from("site_visits").select("*", { count: "exact", head: true }).eq("visit_date", todayKST),
    supabaseAdmin.from("site_visits").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("user_channels").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("analysis_results").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("user_channels").select("subscriber_count"),
    supabaseAdmin.from("analysis_results").select("sample_video_count"),
  ]);

  const totalSubscribers = ((subscriberData.data ?? []) as { subscriber_count: number | null }[])
    .reduce((sum, row) => sum + (row.subscriber_count ?? 0), 0);

  const totalVideos = ((videoCountData.data ?? []) as { sample_video_count: number | null }[])
    .reduce((sum, row) => sum + (row.sample_video_count ?? 0), 0);

  return NextResponse.json({
    todayVisitors: todayVisitors.count ?? 0,
    totalVisitors: totalVisitors.count ?? 0,
    channelsCount: channelsCount.count ?? 0,
    analysisCount: analysisCount.count ?? 0,
    totalSubscribers,
    totalVideos,
  });
}
