"use client";

import type { ManusReportJson, SignalStatus, TrendType, TaskPriority } from "@/lib/manus/types";

type Props = {
  report: ManusReportJson;
  generatedAt: string;
};

// ── 스타일 헬퍼 ──────────────────────────────────────────────
function trendIcon(type: TrendType) {
  if (type === "up") return <span className="text-emerald-500">▲</span>;
  if (type === "down") return <span className="text-red-500">▼</span>;
  return <span className="text-muted-foreground">→</span>;
}

function statusDot(status: SignalStatus) {
  const cls =
    status === "good"
      ? "bg-emerald-500"
      : status === "warn"
      ? "bg-amber-400"
      : "bg-red-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

function priorityBadge(priority: TaskPriority) {
  const map: Record<TaskPriority, string> = {
    URGENT: "bg-red-500/10 text-red-500 border border-red-500/20",
    HIGH: "bg-amber-400/10 text-amber-500 border border-amber-400/20",
    NORMAL: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${map[priority]}`}>
      {priority}
    </span>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 border-b border-border pb-3">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── 섹션 1: 스코어카드 ────────────────────────────────────────
function Scorecard({ data }: { data: ManusReportJson["section1_scorecard"] }) {
  const gradeColor =
    data.grade.startsWith("A")
      ? "text-emerald-500"
      : data.grade.startsWith("B")
      ? "text-blue-500"
      : data.grade.startsWith("C")
      ? "text-amber-400"
      : "text-red-500";

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-end gap-4">
        <div>
          <span className={`text-5xl font-bold tabular-nums ${gradeColor}`}>
            {data.channel_score.toFixed(1)}
          </span>
          <span className="ml-2 text-lg text-muted-foreground">/ 100</span>
        </div>
        <div className="mb-1">
          <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${gradeColor} bg-current/10`}>
            {data.grade}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">{data.grade_label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.metrics.map((m, i) => (
          <div key={i} className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{m.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{m.sub_label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 섹션 2: 9개 성장 지표 ─────────────────────────────────────
function GrowthMetrics({ data }: { data: ManusReportJson["section2_growth_metrics"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader title="성장 지표" sub="9개 핵심 지표 진단" />
      <div className="grid gap-3 sm:grid-cols-3">
        {data.map((m) => (
          <div key={m.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{m.title}</span>
              {trendIcon(m.status_type)}
            </div>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{m.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{m.label}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground/80 leading-relaxed">{m.diagnosis}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 섹션 3: 30개 데이터 시그널 ───────────────────────────────
function SignalGroup({
  title,
  items,
}: {
  title: string;
  items: ManusReportJson["section3_data_signals"]["content"];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-foreground/60 uppercase tracking-wider">{title}</p>
      <div className="space-y-1.5">
        {items.map((s) => (
          <div key={s.id} className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
            <span className="mt-0.5 shrink-0">{statusDot(s.status)}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground">{s.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{s.value}</span>
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
      <SectionHeader title="데이터 시그널" sub="30개 채널 신호 분석" />
      <div className="grid gap-6 sm:grid-cols-3">
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
      <SectionHeader title="채널 운영 패턴" sub="7개 패턴 발견 및 해석" />
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((p) => (
          <div key={p.id} className="rounded-lg border border-border p-4">
            <p className="text-xs font-semibold text-primary">{p.title}</p>
            <p className="mt-2 text-xs text-foreground">{p.pattern}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{p.interpretation}</p>
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
      <SectionHeader title="Channel DNA" sub="채널 정체성 진단" />
      <div className="mb-4 rounded-lg bg-primary/5 border border-primary/10 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{data.core_identity}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">&ldquo;{data.positioning}&rdquo;</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-emerald-500 uppercase tracking-wider">강점</p>
          <div className="space-y-2">
            {data.strengths.map((s) => (
              <div key={s.id} className="rounded-md bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                <p className="text-xs font-medium text-foreground">{s.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-red-500 uppercase tracking-wider">약점</p>
          <div className="space-y-2">
            {data.weaknesses.map((w) => (
              <div key={w.id} className="rounded-md bg-red-500/5 border border-red-500/10 px-3 py-2">
                <p className="text-xs font-medium text-foreground">{w.title}</p>
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
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex-1 rounded-full bg-muted h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="w-4 shrink-0 text-[10px] tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

function ContentPlans({ data }: { data: ManusReportJson["section6_content_plans"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader title="완성형 콘텐츠 기획안" sub="다음 영상 기획문서 2개" />
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                PLAN #{String(plan.id).padStart(2, "0")}
              </span>
            </div>
            {/* 제목 후보 */}
            <div className="space-y-1.5">
              {plan.titles.map((t, i) => (
                <div key={i} className="rounded bg-muted/50 px-2.5 py-1.5">
                  <span className="text-[10px] font-semibold text-primary">{t.type}</span>
                  <p className="mt-0.5 text-xs font-medium text-foreground">{t.title}</p>
                </div>
              ))}
            </div>
            {/* 기획 의도 */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">{plan.intent}</p>
            {/* 구성 흐름 */}
            <div className="space-y-1">
              {plan.structure.map((step, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5 text-[10px] font-bold text-primary">{i + 1}</span>
                  <span className="text-[11px] text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
            {/* 타겟 반응 */}
            <p className="text-[11px] text-muted-foreground/80">{plan.target_response}</p>
            {/* 반응 예측 바 */}
            <div className="space-y-1.5 rounded-md bg-muted/30 px-3 py-2">
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
        ))}
      </div>
    </section>
  );
}

// ── 섹션 7: 30일 실행 계획 ───────────────────────────────────
function ActionPlan({ data }: { data: ManusReportJson["section7_action_plan"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader title={`${data.month} 30일 실행 계획`} sub="주차별 실행 로드맵" />
      <div className="grid gap-4 sm:grid-cols-2">
        {data.weeks.map((w) => (
          <div key={w.week} className="rounded-lg border border-border p-4">
            <p className="mb-2 text-xs font-semibold text-foreground">
              <span className="text-primary">{w.week}주차</span>
              {w.title && <span className="ml-1.5 font-normal text-muted-foreground">— {w.title}</span>}
            </p>
            <div className="space-y-1.5">
              {w.tasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  {priorityBadge(t.priority)}
                  <span className="text-[11px] text-foreground/80 leading-relaxed">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 성공 기준 */}
      <div className="mt-4 rounded-lg bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold text-foreground">이달의 목표</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.success_criteria.map((c, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className="mt-0.5 text-xs tabular-nums">
                <span className="text-muted-foreground">{c.current}</span>
                <span className="mx-1 text-muted-foreground/40">→</span>
                <span className="font-semibold text-primary">{c.target}</span>
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
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight text-foreground">TubeWatch™</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">월간 종합 채널 분석 리포트</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{info.name}</p>
            <p className="text-[10px] text-muted-foreground">{date} 생성</p>
          </div>
        </div>
      </header>

      {/* 채널 정보 배너 */}
      <div className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{info.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{info.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>개설 {info.created_date}</span>
            <span>구독자 {info.subscribers.toLocaleString()}명</span>
            <span>영상 {info.total_videos.toLocaleString()}개</span>
            <span>분석일 {info.analysis_date}</span>
          </div>
        </div>
      </div>

      {/* 섹션들 */}
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
      <footer className="border-t border-border mt-8 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          본 리포트는 TubeWatch™ × Manus AI가 생성한 분석 결과입니다.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/50">© TubeWatch™ {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
