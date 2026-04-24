import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ReportView from "@/components/report/ReportView";
import ReportPolling from "@/components/report/ReportPolling";
import type { ManusReportJson } from "@/lib/manus/types";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const { data } = await supabaseAdmin
    .from("manus_reports")
    .select("result_json")
    .eq("access_token", token)
    .eq("status", "completed")
    .maybeSingle();

  const report = data?.result_json as ManusReportJson | null;
  const name = report?.channel_info?.name ?? "채널";

  return {
    title: `${name} 종합 분석 리포트 | TubeWatch™`,
    description: `${name} 채널의 TubeWatch™ 월간 종합 분석 리포트입니다.`,
  };
}

export default async function ReportPage({ params }: Props) {
  const { token } = await params;

  const { data } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status, result_json, error_message, created_at")
    .eq("access_token", token)
    .maybeSingle();

  if (!data) notFound();

  if (data.status === "pending" || data.status === "processing") {
    return <ReportPolling reportId={data.id} />;
  }

  if (data.status === "failed" || !data.result_json) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <p className="text-sm font-medium text-destructive">리포트 생성에 실패했습니다</p>
        {data.error_message && (
          <p className="text-xs text-muted-foreground">{data.error_message}</p>
        )}
      </div>
    );
  }

  return (
    <ReportView
      report={data.result_json as ManusReportJson}
      generatedAt={data.created_at}
    />
  );
}
