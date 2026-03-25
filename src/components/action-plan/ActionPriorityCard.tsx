import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ActionPlanSpecItem } from "./types";
import {
  confidencePercent,
  difficultyPercent,
  humanizeScope,
} from "@/lib/action-plan/buildActionPlanPresentation";

type ActionPriorityCardProps = {
  spec: ActionPlanSpecItem;
  priorityLabel: string;
  /** 스냅샷 기반 숫자 근거 한 줄 */
  numericEvidence: string;
  /** P1 강조 vs P2/P3 정보 밀도 낮춤 */
  visualWeight?: "emphasis" | "muted";
};

function vizLabel(spec: ActionPlanSpecItem): string {
  switch (spec.impact_area) {
    case "업로드·일관성":
      return "활동 리듬";
    case "조회·도달":
      return "도달";
    case "반응·참여":
      return "참여";
    case "SEO·메타":
      return "메타";
    case "콘텐츠 구조":
      return "구조";
    default:
      return "전략";
  }
}

export default function ActionPriorityCard({
  spec,
  priorityLabel,
  numericEvidence,
  visualWeight = "emphasis",
}: ActionPriorityCardProps): JSX.Element {
  const bgClass =
    spec.priority === "P1"
      ? "border-amber-200/90 bg-amber-50/40"
      : spec.priority === "P2"
        ? "border-sky-200/90 bg-sky-50/40"
        : "border-slate-200 bg-slate-50/40";

  const diffPct = difficultyPercent(spec.difficulty);
  const confPct = confidencePercent(spec.confidence_label);

  const emphasisRing =
    spec.priority === "P1"
      ? "ring-amber-400/40"
      : spec.priority === "P2"
        ? "ring-sky-300/35"
        : "ring-slate-300/35";

  const weightClass =
    visualWeight === "emphasis"
      ? `p-5 shadow-md ring-1 ${emphasisRing} sm:p-6`
      : "p-3.5 shadow-sm opacity-[0.94] saturate-[0.96] ring-0";

  const titleClass =
    visualWeight === "emphasis"
      ? "text-sm font-semibold leading-snug text-slate-900"
      : "text-[13px] font-medium leading-snug text-slate-800";

  const dlClass = visualWeight === "emphasis" ? "mt-3 space-y-3 text-xs" : "mt-2.5 space-y-2 text-[11px]";
  const clampExec = visualWeight === "emphasis" ? "line-clamp-4" : "line-clamp-2";
  const clampEffect = visualWeight === "emphasis" ? "line-clamp-3" : "line-clamp-2";

  return (
    <div
      className={`min-w-0 rounded-xl border bg-card ${weightClass} ${bgClass}`}
      data-priority={spec.priority}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {spec.priority}
        </span>
        <span className="text-xs font-medium text-slate-600">{priorityLabel}</span>
        <Badge variant="outline" className="ml-auto border-slate-200 text-[10px] text-slate-600">
          {spec.impact_area}
        </Badge>
      </div>

      <h3 className={titleClass}>{spec.action_title}</h3>

      <div
        className={`rounded-lg border border-slate-100 bg-white/60 ${visualWeight === "emphasis" ? "mt-3 p-3" : "mt-2.5 p-2.5"}`}
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {vizLabel(spec)} · 실행 난이도
        </p>
        <Progress value={diffPct} className={`mt-1.5 ${visualWeight === "emphasis" ? "h-2" : "h-1.5"}`} />
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          신뢰도
        </p>
        <Progress value={confPct} className="mt-1.5 h-1.5 bg-slate-100" />
      </div>

      <dl className={`${dlClass} text-slate-700`}>
        <div>
          <dt className="font-medium text-slate-500">문제 요약</dt>
          <dd className="mt-0.5 line-clamp-3 font-medium leading-relaxed text-slate-900">
            {spec.action_title}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">근거 데이터 (숫자)</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{numericEvidence}</dd>
          <dd className="mt-1 text-[11px] leading-relaxed text-slate-500">{spec.evidence_data}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">원인</dt>
          <dd className="mt-0.5 line-clamp-3 leading-relaxed">{spec.need_reason}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">실행 방법</dt>
          <dd className={`mt-0.5 ${clampExec} leading-relaxed`}>{spec.execution_example}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">기대 효과</dt>
          <dd className={`mt-0.5 ${clampEffect} leading-relaxed text-slate-800`}>
            {spec.expected_effect_scenario}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">리스크</dt>
          <dd className="mt-0.5 leading-relaxed">
            신뢰도 {spec.confidence_label} · {spec.confidence_note}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">적용 범위</dt>
          <dd className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            {humanizeScope(spec.scope)}
          </dd>
        </div>
      </dl>

      <details
        className={`rounded-md border border-slate-100 bg-slate-50/50 p-2.5 [&_summary::-webkit-details-marker]:hidden ${visualWeight === "muted" ? "mt-2" : "mt-3"}`}
      >
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-normal text-slate-500">
          <Sparkles className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
          <span>실행 보조</span>
          <span className="text-[10px] text-slate-400">(선택 · 외부 도구 초안)</span>
          <span className="ml-auto text-[10px] text-slate-400">펼치기</span>
        </summary>
        <div className="mt-2 space-y-2 border-t border-slate-100/80 pt-2 text-[11px] text-slate-600">
          <div>
            <p className="text-slate-400">도구명</p>
            <p className="mt-0.5 text-slate-700">{spec.smart_assist.toolName}</p>
          </div>
          <div>
            <p className="text-slate-400">추천 사유</p>
            <p className="mt-0.5 leading-relaxed">{spec.smart_assist.reason}</p>
          </div>
          <div>
            <p className="text-slate-400">프롬프트 예시</p>
            <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-100/90 bg-white/80 p-2 font-mono text-[10px] leading-relaxed text-slate-700">
              {spec.smart_assist.promptExample}
            </pre>
          </div>
          <div>
            <p className="text-slate-400">참고 효과</p>
            <p className="mt-0.5 leading-relaxed text-slate-600">{spec.smart_assist.effect}</p>
          </div>
        </div>
      </details>
    </div>
  );
}
