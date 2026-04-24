"use client";

import type { ManusReportJson, SignalStatus, TrendType, TaskPriority } from "@/lib/manus/types";

type Props = {
  report: ManusReportJson;
  generatedAt: string;
};

// ── 공통 헬퍼 ──────────────────────────────────────────────────
function TrendBadge({ type, label }: { type: TrendType; label?: string }) {
  const map: Record<TrendType, { icon: string; cls: string }> = {
    up:      { icon: "▲", cls: "text-emerald-500" },
    down:    { icon: "▼", cls: "text-red-500" },
    neutral: { icon: "→", cls: "text-muted-foreground" },
  };
  const { icon, cls } = map[type];
  return <span className={`font-medium ${cls}`}>{icon}{label ? ` ${label}` : ""}</span>;
}

function StatusDot({ status }: { status: SignalStatus }) {
  const cls =
    status === "good" ? "bg-emerald-500" :
    status === "warn" ? "bg-amber-400" : "bg-red-500";
  return <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

function PriorityBadge({ p }: { p: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
    HIGH:   "bg-amber-400/10 text-amber-500 border-amber-400/20",
    NORMAL: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${map[p]}`}>
      {p}
    </span>
  );
}

function SectionHeader({ n, total, title, sub }: { n: number; total: number; title: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-2 border-b border-border pb-4">
      <div>
        <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
        {n} / {total}
      </span>
    </div>
  );
}

// ── 섹션 1: 스코어카드 ─────────────────────────────────────────
function Scorecard({ data }: { data: ManusReportJson["section1_scorecard"] }) {
  const gradeColor =
    data.grade.startsWith("A") ? "text-emerald-500" :
    data.grade.startsWith("B") ? "text-blue-500" :
    data.grade.startsWith("C") ? "text-amber-400" : "text-red-500";

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={1} total={7} title="채널 종합 스코어" />

      {/* 메인 스코어 */}
      <div className="mb-6 flex items-end gap-5">
        <div className="leading-none">
          <span className={`text-[64px] font-black tabular-nums leading-none ${gradeColor}`}>
            {data.channel_score.toFixed(1)}
          </span>
          <span className="ml-1.5 text-2xl font-light text-muted-foreground">/100</span>
        </div>
        <div className="mb-2 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black tabular-nums ${gradeColor}`}>{data.grade}</span>
            <span className="text-sm text-muted-foreground">{data.grade_label}</span>
          </div>
        </div>
      </div>

      {/* 지표 그리드 */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {data.metrics.map((m, i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-3">
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-base font-bold tabular-nums text-foreground">{m.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">{m.sub_label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 섹션 2: 9개 성장 지표 ──────────────────────────────────────
function GrowthBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 60 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function GrowthMetrics({ data }: { data: ManusReportJson["section2_growth_metrics"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={2} total={7} title="성장 지표" sub="9개 핵심 지표 정밀 진단" />
      <div className="grid gap-3 sm:grid-cols-3">
        {data.map((m) => {
          const numericVal = parseFloat(m.value.replace(/[^0-9.]/g, "")) || 0;
          return (
            <div key={m.id} className="rounded-lg border border-border bg-background p-4 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">{m.title}</span>
                <TrendBadge type={m.status_type} />
              </div>
              <div>
                <p className="text-xl font-black tabular-nums text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
              <GrowthBar value={numericVal} />
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{m.diagnosis}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 섹션 3: 30개 데이터 시그널 ────────────────────────────────
function SignalGroup({
  title,
  items,
}: {
  title: string;
  items: ManusReportJson["section3_data_signals"]["content"];
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{title}</p>
      <div className="space-y-1.5">
        {items.map((s) => (
          <div key={s.id} className="flex items-start gap-2.5 rounded-md px-3 py-2 bg-muted/30">
            <StatusDot status={s.status} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-foreground">{s.label}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">{s.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataSignals({ data }: { data: ManusReportJson["section3_data_signals"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={3} total={7} title="데이터 시그널" sub="30개 채널 신호 — 콘텐츠 · 퍼포먼스 · 정체성" />
      <div className="grid gap-5 sm:grid-cols-3">
        <SignalGroup title="콘텐츠 신호" items={data.content} />
        <SignalGroup title="퍼포먼스 신호" items={data.performance} />
        <SignalGroup title="정체성 신호" items={data.identity} />
      </div>
    </section>
  );
}

// ── 섹션 4: 7개 채널 운영 패턴 ───────────────────────────────
function ChannelPatterns({ data }: { data: ManusReportJson["section4_channel_patterns"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={4} total={7} title="채널 운영 패턴" sub="7개 패턴 발견 및 해석" />
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((p) => (
          <div key={p.id} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{p.id}</span>
              <p className="text-xs font-bold text-foreground">{p.title}</p>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{p.pattern}</p>
            <div className="mt-2 border-l-2 border-primary/30 pl-2.5">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{p.interpretation}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 섹션 5: Channel DNA ───────────────────────────────────────
function ChannelDNA({ data }: { data: ManusReportJson["section5_channel_dna"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={5} total={7} title="Channel DNA" sub="채널 핵심 정체성 진단" />

      {/* 코어 아이덴티티 */}
      <div className="mb-5 rounded-lg border border-primary/15 bg-primary/[0.03] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60 mb-2">CORE IDENTITY</p>
        <p className="text-sm text-foreground/80 leading-relaxed">{data.core_identity}</p>
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">POSITIONING</p>
          <p className="text-sm font-bold text-foreground">&ldquo;{data.positioning}&rdquo;</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 강점 */}
        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-emerald-500">강점</p>
          <div className="space-y-2">
            {data.strengths.map((s) => (
              <div key={s.id} className="rounded-lg border-l-[3px] border-emerald-500 bg-emerald-500/5 px-3 py-2.5">
                <p className="text-xs font-bold text-foreground">{s.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
        {/* 약점 */}
        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-red-500">약점</p>
          <div className="space-y-2">
            {data.weaknesses.map((w) => (
              <div key={w.id} className="rounded-lg border-l-[3px] border-red-500 bg-red-500/5 px-3 py-2.5">
                <p className="text-xs font-bold text-foreground">{w.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 섹션 6: 완성형 콘텐츠 기획안 ─────────────────────────────
function ReactionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-12 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 shrink-0 text-right text-[10px] tabular-nums font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ContentPlans({ data }: { data: ManusReportJson["section6_content_plans"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={6} total={7} title="완성형 콘텐츠 기획안" sub="다음 영상 기획문서 2개" />
      <div className="grid gap-5 sm:grid-cols-2">
        {data.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-border bg-background overflow-hidden">
            {/* 플랜 헤더 */}
            <div className="border-b border-border px-4 py-3 flex items-center gap-2 bg-muted/30">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black text-primary-foreground">
                PLAN #{String(plan.id).padStart(2, "0")}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* 제목 후보 */}
              <div className="space-y-1.5">
                {plan.titles.map((t, i) => (
                  <div key={i} className="rounded-md border border-border px-3 py-2">
                    <p className="text-[10px] font-bold text-primary">{t.type}</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground leading-snug">{t.title}</p>
                  </div>
                ))}
              </div>

              {/* 기획 의도 */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">{plan.intent}</p>

              {/* 구성 흐름 */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">구성 흐름</p>
                {plan.structure.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-black text-primary">{i + 1}</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              {/* 타겟 반응 */}
              <div className="rounded-md bg-muted/30 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">예상 타겟 반응</p>
                <p className="text-[11px] text-foreground/80">{plan.target_response}</p>
              </div>

              {/* 반응 예측 */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">반응 예측 (10점)</p>
                <ReactionBar label="관심도" value={plan.audience_reaction.interest} />
                <ReactionBar label="공유도" value={plan.audience_reaction.shareability} />
                <ReactionBar label="참여도" value={plan.audience_reaction.engagement} />
                <ReactionBar label="정보성" value={plan.audience_reaction.informativeness} />
              </div>

              {/* 태그 */}
              <div className="flex flex-wrap gap-1">
                {plan.tags.map((tag, i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 섹션 7: 30일 실행 계획 ───────────────────────────────────
function ActionPlan({ data }: { data: ManusReportJson["section7_action_plan"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={7} total={7} title={`${data.month} 30일 실행 계획`} sub="주차별 구체적 실행 로드맵" />

      <div className="grid gap-3 sm:grid-cols-2">
        {data.weeks.map((w) => (
          <div key={w.week} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">{w.week}주차</span>
              {w.title && <span className="text-xs text-muted-foreground">{w.title}</span>}
            </div>
            <div className="space-y-2">
              {w.tasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <PriorityBadge p={t.priority} />
                  <span className="text-[11px] text-foreground/80 leading-relaxed">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 이달의 목표 */}
      <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-primary/60">이달의 목표</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.success_criteria.map((c, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-xs tabular-nums">
                <span className="text-muted-foreground/60">{c.current}</span>
                <span className="mx-1 text-muted-foreground/30">→</span>
                <span className="font-black text-primary">{c.target}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 메인 ReportView ───────────────────────────────────────────
export default function ReportView({ report, generatedAt }: Props) {
  const info = report.channel_info;
  const date = new Date(generatedAt).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* 스티키 헤더 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black tracking-tight text-foreground">TubeWatch™</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
              월간 종합 채널 분석 리포트
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{date} 생성</p>
        </div>
      </header>

      {/* 채널 배너 */}
      <div className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Channel Report
              </p>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{info.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>개설 {info.created_date}</span>
            <span>·</span>
            <span>구독자 {info.subscribers.toLocaleString()}명</span>
            <span>·</span>
            <span>총 영상 {info.total_videos.toLocaleString()}개</span>
            <span>·</span>
            <span>분석 기준일 {info.analysis_date}</span>
          </div>
        </div>
      </div>

      {/* 7개 섹션 */}
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <Scorecard data={report.section1_scorecard} />
        <GrowthMetrics data={report.section2_growth_metrics} />
        <DataSignals data={report.section3_data_signals} />
        <ChannelPatterns data={report.section4_channel_patterns} />
        <ChannelDNA data={report.section5_channel_dna} />
        <ContentPlans data={report.section6_content_plans} />
        <ActionPlan data={report.section7_action_plan} />
      </main>

      {/* 푸터 */}
      <footer className="mt-8 border-t border-border px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          본 리포트는 <span className="font-semibold text-foreground">TubeWatch™ × Manus AI</span>가 생성한 채널 분석 결과입니다.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/40">
          © TubeWatch™ {new Date().getFullYear()} · 월 1회 발행
        </p>
      </footer>
    </div>
  );
}
