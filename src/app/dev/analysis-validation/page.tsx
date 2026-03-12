import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validateMultipleResults,
  type AnalysisRow,
  type ValidationResult,
  type ValidationIssueType,
} from "@/lib/analysis/validation/analysisQualityCheck";
import ValidationTable from "./ValidationTable";

const QUERY_FIELDS = [
  "id",
  "channel_title",
  "status",
  "gemini_status",
  "sample_video_count",
  "feature_snapshot",
  "feature_total_score",
  "channel_summary",
  "strengths",
  "weaknesses",
  "bottlenecks",
  "growth_action_plan",
  "content_patterns",
  "recommended_topics",
  "target_audience",
  "created_at",
].join(", ");

function computeSummary(results: ValidationResult[]): {
  total: number;
  avgScore: number;
  issueBreakdown: Record<ValidationIssueType, number>;
} {
  const total = results.length;
  const avgScore =
    total > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / total)
      : 0;

  const issueBreakdown: Record<ValidationIssueType, number> = {
    missing_metric: 0,
    empty_insight: 0,
    inconsistency: 0,
    generic_text: 0,
    channel_size_mismatch: 0,
  };

  for (const result of results) {
    for (const issue of result.issues) {
      issueBreakdown[issue.type]++;
    }
  }

  return { total, avgScore, issueBreakdown };
}

export default async function AnalysisValidationPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: rows, error: queryError } = await supabase
    .from("analysis_results")
    .select(QUERY_FIELDS)
    .eq("status", "analyzed")
    .eq("gemini_status", "success")
    .order("created_at", { ascending: false })
    .limit(20);

  if (queryError) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-xl font-bold text-gray-900">Analysis Quality Validation</h1>
        <p className="mt-4 text-sm text-red-600">
          데이터를 불러오는 중 오류가 발생했습니다: {queryError.message}
        </p>
      </main>
    );
  }

  const analysisRows = (rows ?? []) as unknown as AnalysisRow[];
  const validationResults = validateMultipleResults(analysisRows);
  const summary = computeSummary(validationResults);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
          Internal QA
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Analysis Quality Validation
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          최근 분석 결과의 품질과 일관성을 검증합니다. 이 페이지는 내부 QA 전용입니다.
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="검증 대상"
          value={`${summary.total}건`}
          tone="text-gray-900"
        />
        <SummaryCard
          label="평균 품질 점수"
          value={`${summary.avgScore}`}
          tone={summary.avgScore >= 70 ? "text-emerald-600" : summary.avgScore >= 40 ? "text-amber-600" : "text-red-500"}
        />
        <SummaryCard
          label="불일치 경고"
          value={`${summary.issueBreakdown.inconsistency}건`}
          tone={summary.issueBreakdown.inconsistency > 0 ? "text-red-500" : "text-gray-900"}
        />
        <SummaryCard
          label="총 이슈"
          value={`${validationResults.reduce((s, r) => s + r.issues.length, 0)}건`}
          tone="text-gray-900"
        />
      </div>

      {/* Issue type breakdown */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">이슈 유형 분포</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <IssueBadge
            label="메트릭 누락"
            count={summary.issueBreakdown.missing_metric}
            tone="bg-orange-50 text-orange-700 border-orange-200"
          />
          <IssueBadge
            label="인사이트 비어있음"
            count={summary.issueBreakdown.empty_insight}
            tone="bg-amber-50 text-amber-700 border-amber-200"
          />
          <IssueBadge
            label="메트릭-인사이트 불일치"
            count={summary.issueBreakdown.inconsistency}
            tone="bg-red-50 text-red-700 border-red-200"
          />
          <IssueBadge
            label="추상적 표현"
            count={summary.issueBreakdown.generic_text}
            tone="bg-violet-50 text-violet-700 border-violet-200"
          />
        </div>
      </div>

      {/* Results table */}
      {validationResults.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
          검증 대상 분석 결과가 없습니다.
        </div>
      ) : (
        <ValidationTable results={validationResults} />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function IssueBadge({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: string;
}): JSX.Element {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${tone}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold tabular-nums">{count}</span>
    </div>
  );
}
