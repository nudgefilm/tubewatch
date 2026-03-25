import { Sparkles } from "lucide-react";
import type { ActionPlanSpecItem } from "./types";

type ActionPriorityCardProps = {
  spec: ActionPlanSpecItem;
  priorityLabel: string;
};

export default function ActionPriorityCard({
  spec,
  priorityLabel,
}: ActionPriorityCardProps): JSX.Element {
  const bgClass =
    spec.priority === "P1"
      ? "border-amber-200 bg-amber-50/50"
      : spec.priority === "P2"
        ? "border-sky-200 bg-sky-50/50"
        : "border-slate-200 bg-slate-50/50";

  return (
    <div
      className={`min-w-0 p-4 rounded-xl border bg-card ${bgClass}`}
      data-priority={spec.priority}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {spec.priority}
        </span>
        <span className="text-xs font-medium text-slate-500">{priorityLabel}</span>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
          {spec.impact_area}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{spec.action_title}</h3>

      <dl className="mt-3 space-y-2 text-xs text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">필요 이유</dt>
          <dd className="mt-0.5 leading-relaxed">{spec.need_reason}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">근거 데이터</dt>
          <dd className="mt-0.5 leading-relaxed">{spec.evidence_data}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">예상 효과 시나리오</dt>
          <dd className="mt-0.5 leading-relaxed text-slate-700">{spec.expected_effect_scenario}</dd>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            <span className="text-slate-500">난이도</span>{" "}
            <span className="font-medium text-slate-800">{spec.difficulty}</span>
          </span>
          <span>
            <span className="text-slate-500">신뢰도</span>{" "}
            <span className="font-medium text-slate-800">{spec.confidence_label}</span>
          </span>
        </div>
        <div>
          <dt className="font-medium text-slate-500">신뢰도 근거</dt>
          <dd className="mt-0.5 leading-relaxed text-[11px] text-slate-500">
            {spec.confidence_note}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">실행 예시</dt>
          <dd className="mt-0.5 leading-relaxed">{spec.execution_example}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">적용 범위</dt>
          <dd className="mt-0.5 leading-relaxed text-[11px] text-slate-500">{spec.scope}</dd>
        </div>
      </dl>

      <details className="mt-3 rounded-md border border-slate-100 bg-slate-50/50 p-2.5 [&_summary::-webkit-details-marker]:hidden">
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
