import Link from "next/link";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ActionPlanPageData } from "./types";
import ActionPriorityCard from "./ActionPriorityCard";
import {
  buildActionPlanStrategy,
  buildChecklistSteps,
  buildTrackingKpis,
  numericEvidenceLine,
} from "@/lib/action-plan/buildActionPlanPresentation";

const PRIORITY_LABEL: Record<"P1" | "P2" | "P3", string> = {
  P1: "지금 바로",
  P2: "이번 주",
  P3: "다음 단계",
};

type ActionPlanViewProps = {
  data: ActionPlanPageData;
};

export default function ActionPlanView({ data }: ActionPlanViewProps): JSX.Element {
  const { channels, selectedChannel, actions, specItems, checklist } = data;
  const hasChannels = channels.length > 0;
  const hasResult = data.latestResult !== null;
  const showActions = hasResult && actions.length > 0 && specItems.length > 0;

  const strategy = buildActionPlanStrategy(data);
  const tracking = buildTrackingKpis(data);
  const steps = buildChecklistSteps(data);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-12 lg:py-10">
      <section className="border-b border-slate-200/80 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Action Plan</h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedChannel?.channel_title ?? "채널 미선택"} · TubeWatch 엔진 분석 기반 실행 전략
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/channels"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              채널 관리
            </Link>
            <Link
              href="/analysis"
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
            >
              분석 리포트
            </Link>
          </div>
        </div>
      </section>

      {hasChannels && channels.length > 1 ? (
        <section className="py-8">
          <div className="rounded-xl border border-slate-200 bg-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              채널 선택
            </h2>
            <ul className="flex flex-wrap gap-2">
              {channels.map((ch) => {
                const isSelected = selectedChannel?.id === ch.id;
                return (
                  <li key={ch.id}>
                    <Link
                      href={`/action-plan?channelId=${encodeURIComponent(ch.id)}`}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {ch.thumbnail_url ? (
                        <img
                          src={ch.thumbnail_url}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                          width={24}
                          height={24}
                        />
                      ) : null}
                      <span className="max-w-[140px] truncate">{ch.channel_title || "이름 없음"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 상단 전략 요약 — 항상 표시 (데이터 부족 시 안내) */}
      <section className="py-6">
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50/90 to-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" aria-hidden />
              <CardTitle className="text-base font-semibold text-slate-900">전략 요약</CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {showActions ? "실행 가능" : "데이터 부족"}
              </Badge>
            </div>
            <CardDescription className="text-slate-600">
              요약 → 진단 → 실행 흐름으로 읽어 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                현재 문제
              </p>
              <p className="mt-1 font-medium leading-snug text-slate-900">{strategy.problemLine}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                전략 방향
              </p>
              <p className="mt-1 leading-relaxed text-slate-700">{strategy.strategyLine}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                기대 변화
              </p>
              <p className="mt-1 leading-relaxed text-slate-700">{strategy.outcomeLine}</p>
            </div>
            <div className="pt-0">
              <p className="text-[11px] font-medium text-slate-400">우선순위 가중치</p>
              <Progress value={showActions ? 72 : 22} className="mt-1.5 h-2" />
            </div>
          </CardContent>
        </Card>
      </section>

      {showActions ? (
        <>
          <section className="py-6">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              실행 우선순위
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              P1 → P2 → P3 · 각 카드에 난이도·신뢰도 막대와 근거 숫자가 포함됩니다.
            </p>
            <div className="grid gap-6 lg:grid-cols-3">
              {specItems.map((spec, i) => (
                <ActionPriorityCard
                  key={`${spec.priority}-${spec.action_title}-${i}`}
                  spec={spec}
                  priorityLabel={PRIORITY_LABEL[spec.priority]}
                  numericEvidence={numericEvidenceLine(actions[i], data.latestResult)}
                />
              ))}
            </div>
          </section>

          <section className="py-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              성과 추적 (기록용)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {tracking.map((row, i) => (
                <Card key={i} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">{row.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">적용 전</span>
                      <span className="font-medium text-slate-800">{row.beforeLabel}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">적용 후</span>
                      <span className="font-medium text-slate-800">{row.afterLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="py-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              실행 체크리스트
            </h2>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4"
                >
                  <Badge variant="outline" className="w-fit shrink-0">
                    Step {s.step}
                  </Badge>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-slate-900">{s.description}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      예상 결과: {s.expected} · 기간: {s.horizon}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="py-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              빠른 참고
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs font-medium text-slate-500">해야 할 것</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {checklist.dos.map((line, i) => (
                    <li key={`do-${i}`} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs font-medium text-slate-500">하지 말 것</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {checklist.donts.map((line, i) => (
                    <li key={`dont-${i}`} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/50 p-3">
              <p className="text-xs font-medium text-slate-500">핵심 1개 액션</p>
              <p className="mt-1 font-semibold text-slate-900">{checklist.core_single_action}</p>
            </div>
          </section>
        </>
      ) : (
        <section className="py-10">
          <Card className="border-dashed border-slate-300 bg-slate-50/80">
            <CardHeader>
              <CardTitle className="text-base text-slate-800">표본 부족</CardTitle>
              <CardDescription>
                최근 성공 분석이 없거나 액션을 만들 수 없습니다. /analysis에서 분석을 완료하면 이 페이지가
                채워집니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={12} className="h-2" />
              <p className="mt-3 text-sm text-slate-600">
                신호 약함 — 우선 채널을 선택하고 분석을 실행해 주세요.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
