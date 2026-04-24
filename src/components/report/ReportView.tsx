"use client";

import type { ManusReportJson } from "@/lib/manus/types";

type Props = {
  report: ManusReportJson;
  generatedAt: string;
};

// ── 공통 헬퍼 ──────────────────────────────────────────────────

function SectionHeader({
  n,
  total,
  title,
  sub,
}: {
  n: number;
  total: number;
  title: string;
  sub?: string;
}) {
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

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function GradeColor({ grade }: { grade: string }) {
  if (grade.startsWith("A")) return "text-emerald-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-amber-400";
  return "text-red-500";
}

function fmt(n: number | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

// ── 섹션 1: 채널 종합 스코어 ───────────────────────────────────

function Scorecard({ data }: { data: ManusReportJson["section1_scorecard"] }) {
  const grade = data?.grade ?? "-";
  const score = data?.overall_score ?? 0;
  const gradeColor = GradeColor({ grade });

  const breakdownEntries: Array<{ key: string; label: string }> = [
    { key: "growth_velocity", label: "성장 속도" },
    { key: "niche_authority", label: "니치 권위" },
    { key: "viral_potential", label: "바이럴 잠재력" },
    { key: "upload_regularity", label: "업로드 규칙성" },
    { key: "engagement_quality", label: "인게이지먼트 품질" },
    { key: "content_consistency", label: "콘텐츠 일관성" },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={1} total={7} title="채널 종합 스코어" />

      {/* 메인 스코어 */}
      <div className="mb-8 flex items-end gap-5">
        <div className="leading-none">
          <span className={`text-[64px] font-black tabular-nums leading-none ${gradeColor}`}>
            {score}
          </span>
          <span className="ml-1.5 text-2xl font-light text-muted-foreground">/100</span>
        </div>
        <div className="mb-2">
          <span className={`text-3xl font-black tabular-nums ${gradeColor}`}>{grade}</span>
        </div>
      </div>

      {/* 세부 점수 바 */}
      <div className="mb-6 space-y-3">
        {breakdownEntries.map(({ key, label }) => {
          const item = data?.score_breakdown?.[key];
          if (!item) return null;
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold tabular-nums ${GradeColor({ grade: item.grade ?? "" })}`}>
                    {item.grade ?? "-"}
                  </span>
                  <span className="w-8 text-right text-xs font-semibold tabular-nums text-foreground">
                    {item.score ?? 0}
                  </span>
                </div>
              </div>
              <ScoreBar score={item.score ?? 0} />
              {item.comment && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/70 leading-relaxed">{item.comment}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 강점 / 약점 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-emerald-500">강점</p>
          <ul className="space-y-1.5">
            {(data?.strengths ?? []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 inline-block" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-red-500">약점</p>
          <ul className="space-y-1.5">
            {(data?.weaknesses ?? []).map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500 inline-block" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── 섹션 2: 성장 지표 분석 ─────────────────────────────────────

function GrowthMetrics({ data }: { data: ManusReportJson["section2_growth_metrics"] }) {
  const trend = data?.growth_trend;
  const stats = data?.view_statistics;
  const dist = data?.view_distribution;
  const eng = data?.engagement_metrics;
  const sub = data?.subscriber_efficiency;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={2} total={7} title="성장 지표 분석" sub="최근 50개 영상 데이터 기반" />

      {/* growth_trend 비교 카드 */}
      {trend && (
        <div className="mb-5 rounded-lg border border-border bg-background p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            조회수 트렌드 (최근 10개 vs 이전 10개)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">최근 10개 평균</p>
              <p className="text-lg font-black tabular-nums text-foreground">{fmt(trend.recent_10_avg_views)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">이전 10개 평균</p>
              <p className="text-lg font-black tabular-nums text-muted-foreground">{fmt(trend.previous_10_avg_views)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">성장률</p>
              <p className={`text-lg font-black tabular-nums ${(trend.growth_rate_pct ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {trend.growth_rate_pct != null
                  ? `${trend.growth_rate_pct > 0 ? "+" : ""}${trend.growth_rate_pct}%`
                  : "-"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">최근 30일 업로드</p>
              <p className="text-lg font-black tabular-nums text-foreground">{trend.monthly_upload_last_30d ?? "-"}개</p>
            </div>
          </div>
          {trend.trend_comment && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground leading-relaxed">
              {trend.trend_comment}
            </p>
          )}
        </div>
      )}

      {/* view_statistics 4개 stat 카드 */}
      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">평균 조회수</p>
            <p className="text-base font-black tabular-nums text-foreground">{fmt(stats.average_views)}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">중앙값</p>
            <p className="text-base font-black tabular-nums text-foreground">{fmt(stats.median_views)}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">최고 조회수</p>
            <p className="text-base font-black tabular-nums text-emerald-500">{fmt(stats.max_views?.views)}</p>
            {stats.max_views?.title && (
              <p className="mt-0.5 text-[9px] text-muted-foreground/60 truncate">{stats.max_views.title}</p>
            )}
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">최저 조회수</p>
            <p className="text-base font-black tabular-nums text-red-500">{fmt(stats.min_views?.views)}</p>
            {stats.min_views?.title && (
              <p className="mt-0.5 text-[9px] text-muted-foreground/60 truncate">{stats.min_views.title}</p>
            )}
          </div>
        </div>
      )}

      {/* view_distribution + engagement */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {dist && (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              조회수 분포
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">50만 이상</span>
                <span className="font-bold text-foreground tabular-nums">{dist.over_500k ?? 0}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">5만 미만</span>
                <span className="font-bold text-foreground tabular-nums">{dist.under_50k ?? 0}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">바이럴 비율</span>
                <span className="font-bold text-primary tabular-nums">{dist.viral_ratio_pct ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">평균 이상 비율</span>
                <span className="font-bold text-foreground tabular-nums">{dist.above_average_ratio_pct ?? 0}%</span>
              </div>
            </div>
          </div>
        )}
        {eng && (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              인게이지먼트
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">평균 좋아요율</span>
                <span className="font-bold text-foreground tabular-nums">{eng.avg_like_rate ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">평균 댓글율</span>
                <span className="font-bold text-foreground tabular-nums">{eng.avg_comment_rate ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">영상당 평균 좋아요</span>
                <span className="font-bold text-foreground tabular-nums">{fmt(eng.avg_likes_per_video)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">영상당 평균 댓글</span>
                <span className="font-bold text-foreground tabular-nums">{fmt(eng.avg_comments_per_video)}</span>
              </div>
            </div>
            {sub?.comment && (
              <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground leading-relaxed">
                {sub.comment}
              </p>
            )}
          </div>
        )}
      </div>

      {/* top10_videos */}
      {(data?.top10_videos ?? []).length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            TOP 10 영상
          </p>
          <div className="space-y-1.5">
            {(data?.top10_videos ?? []).map((v, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2 bg-muted/30">
                <span className="w-5 shrink-0 text-center text-xs font-black text-primary tabular-nums">
                  {v.rank ?? i + 1}
                </span>
                <span className="flex-1 min-w-0 text-xs text-foreground truncate">{v.title ?? "-"}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                  {fmt(v.views)}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground/60">{v.date ?? ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── 섹션 3: 데이터 시그널 ─────────────────────────────────────

function DataSignals({ data }: { data: ManusReportJson["section3_data_signals"] }) {
  const highPatterns = data?.high_performance_patterns ?? [];
  const lowPatterns = data?.low_performance_patterns ?? [];
  const keywords = data?.keyword_analysis;
  const titleAnalysis = data?.title_pattern_analysis;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={3} total={7} title="데이터 시그널" sub="고성과 패턴 · 저성과 패턴 · 키워드 분석" />

      {/* 고성과 패턴 */}
      {highPatterns.length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-500">
            고성과 패턴
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {highPatterns.map((p, i) => (
              <div key={i} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{p.pattern ?? "-"}</p>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-500">
                    평균 {fmt(p.avg_views)}
                  </span>
                </div>
                {p.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">{p.description}</p>
                )}
                {p.insight && (
                  <div className="mt-2 border-l-2 border-emerald-500/40 pl-2.5">
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{p.insight}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 저성과 패턴 */}
      {lowPatterns.length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-red-500">
            저성과 패턴
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {lowPatterns.map((p, i) => (
              <div key={i} className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{p.pattern ?? "-"}</p>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-red-500">
                    평균 {fmt(p.avg_views)}
                  </span>
                </div>
                {p.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">{p.description}</p>
                )}
                {p.insight && (
                  <div className="mt-2 border-l-2 border-red-500/40 pl-2.5">
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{p.insight}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 키워드 분석 */}
      {keywords && (
        <div className="mb-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            고 CTR 키워드
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(keywords.high_ctr_keywords ?? []).map((kw, i) => (
              <span
                key={i}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 제목 패턴 분석 */}
      {titleAnalysis && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            제목 패턴 분석
          </p>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">평균 제목 길이</p>
                <p className="font-bold text-foreground tabular-nums">{titleAnalysis.avg_title_length ?? "-"}자</p>
              </div>
              <div>
                <p className="text-muted-foreground">최적 길이</p>
                <p className="font-bold text-foreground">{titleAnalysis.optimal_title_length ?? "-"}</p>
              </div>
              {titleAnalysis.hashtag_usage && (
                <div>
                  <p className="text-muted-foreground">평균 태그 수</p>
                  <p className="font-bold text-foreground tabular-nums">
                    {titleAnalysis.hashtag_usage.avg_tags ?? 0}개
                  </p>
                </div>
              )}
            </div>
            {(titleAnalysis.effective_structures ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  효과적인 제목 구조
                </p>
                <ul className="space-y-1">
                  {(titleAnalysis.effective_structures ?? []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-black text-primary">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── 섹션 4: 채널 패턴 ─────────────────────────────────────────

function ChannelPatterns({ data }: { data: ManusReportJson["section4_channel_patterns"] }) {
  const evolution = data?.content_evolution;
  const upload = data?.upload_patterns;
  const audience = data?.audience_behavior;

  const phases = evolution
    ? (["phase1", "phase2", "phase3", "phase4", "phase5"] as const).map((k) => ({
        key: k,
        data: evolution[k],
      })).filter((p) => p.data != null)
    : [];

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={4} total={7} title="채널 패턴" sub="콘텐츠 진화 타임라인 · 업로드 패턴 · 시청자 행동" />

      {/* 콘텐츠 진화 타임라인 */}
      {phases.length > 0 && (
        <div className="mb-6">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            콘텐츠 진화 타임라인
          </p>
          <div className="relative space-y-0">
            {phases.map((p, i) => (
              <div key={p.key} className="flex gap-4">
                {/* 타임라인 선 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < phases.length - 1 && (
                    <div className="w-px flex-1 bg-border" style={{ minHeight: "24px" }} />
                  )}
                </div>
                <div className="pb-5">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-foreground">{p.data?.theme ?? "-"}</p>
                    <span className="text-[10px] text-muted-foreground/60">{p.data?.period ?? ""}</span>
                    {p.data?.avg_views_estimate != null && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                        평균 {fmt(p.data.avg_views_estimate)}
                      </span>
                    )}
                  </div>
                  {p.data?.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{p.data.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드 패턴 */}
      {upload && (
        <div className="mb-5 rounded-lg border border-border bg-background p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            업로드 패턴
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">평균 업로드 주기</p>
              <p className="font-bold text-foreground tabular-nums">
                {upload.avg_upload_interval_days != null ? `${upload.avg_upload_interval_days}일` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">최근 30일 업로드</p>
              <p className="font-bold text-foreground tabular-nums">
                {upload.recent_30d_uploads != null ? `${upload.recent_30d_uploads}개` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">업로드 일관성</p>
              <p className="font-bold text-foreground">{upload.upload_consistency ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">최적 업로드 빈도</p>
              <p className="font-bold text-primary">{upload.optimal_upload_frequency ?? "-"}</p>
            </div>
            {upload.peak_upload_period && (
              <div className="col-span-2">
                <p className="text-muted-foreground">최고 활동 기간</p>
                <p className="font-bold text-foreground">{upload.peak_upload_period}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 시청자 행동 */}
      {audience && (
        <div className="grid gap-3 sm:grid-cols-3">
          {audience.viral_trigger && (
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                바이럴 트리거
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{audience.viral_trigger}</p>
            </div>
          )}
          {audience.comment_driver && (
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                댓글 유도 요소
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{audience.comment_driver}</p>
            </div>
          )}
          {audience.engagement_peak_content && (
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                참여 최고 콘텐츠
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{audience.engagement_peak_content}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── 섹션 5: Channel DNA ───────────────────────────────────────

function ChannelDNA({ data }: { data: ManusReportJson["section5_channel_dna"] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={5} total={7} title="Channel DNA" sub="채널 핵심 정체성 진단" />

      {/* 코어 아이덴티티 강조 박스 */}
      {data?.core_identity && (
        <div className="mb-5 rounded-lg border border-primary/15 bg-primary/[0.03] p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-primary/60">
            CORE IDENTITY
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{data.core_identity}</p>
        </div>
      )}

      {/* 브랜드 키워드 */}
      {(data?.brand_keywords ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            브랜드 키워드
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(data?.brand_keywords ?? []).map((kw, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 콘텐츠 필러 */}
      {(data?.content_pillars ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            콘텐츠 필러
          </p>
          <div className="space-y-3">
            {(data?.content_pillars ?? []).map((pillar, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{pillar.pillar ?? "-"}</p>
                  <div className="flex items-center gap-2">
                    {pillar.avg_performance && (
                      <span className="text-[10px] text-muted-foreground">{pillar.avg_performance}</span>
                    )}
                    {pillar.contribution_pct != null && (
                      <span className="text-xs font-black text-primary tabular-nums">
                        {pillar.contribution_pct}%
                      </span>
                    )}
                  </div>
                </div>
                {pillar.contribution_pct != null && (
                  <div className="mb-2">
                    <ScoreBar score={pillar.contribution_pct} />
                  </div>
                )}
                {pillar.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{pillar.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 크리에이터 페르소나 + 타겟 오디언스 나란히 */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        {data?.creator_persona && (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              크리에이터 페르소나
            </p>
            <div className="space-y-2 text-xs">
              {data.creator_persona.character && (
                <div>
                  <p className="text-muted-foreground">캐릭터</p>
                  <p className="font-medium text-foreground">{data.creator_persona.character}</p>
                </div>
              )}
              {data.creator_persona.storytelling_style && (
                <div>
                  <p className="text-muted-foreground">스토리텔링 스타일</p>
                  <p className="font-medium text-foreground">{data.creator_persona.storytelling_style}</p>
                </div>
              )}
              {data.creator_persona.relationship_with_audience && (
                <div>
                  <p className="text-muted-foreground">시청자와의 관계</p>
                  <p className="font-medium text-foreground">{data.creator_persona.relationship_with_audience}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {data?.target_audience && (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              타겟 오디언스
            </p>
            <div className="space-y-2 text-xs">
              {data.target_audience.primary && (
                <div>
                  <p className="text-muted-foreground">1차 타겟</p>
                  <p className="font-medium text-foreground">{data.target_audience.primary}</p>
                </div>
              )}
              {data.target_audience.secondary && (
                <div>
                  <p className="text-muted-foreground">2차 타겟</p>
                  <p className="font-medium text-foreground">{data.target_audience.secondary}</p>
                </div>
              )}
              {data.target_audience.tertiary && (
                <div>
                  <p className="text-muted-foreground">3차 타겟</p>
                  <p className="font-medium text-foreground">{data.target_audience.tertiary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* UVP 인용구 스타일 */}
      {data?.unique_value_proposition && (
        <blockquote className="mb-4 rounded-r-lg border-l-4 border-primary bg-primary/[0.03] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-1">
            Unique Value Proposition
          </p>
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            &ldquo;{data.unique_value_proposition}&rdquo;
          </p>
        </blockquote>
      )}

      {data?.competitive_differentiation && (
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            경쟁 차별화
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.competitive_differentiation}</p>
        </div>
      )}
    </section>
  );
}

// ── 섹션 6: 콘텐츠 기획 ──────────────────────────────────────

function ContentPlans({ data }: { data: ManusReportJson["section6_content_plans"] }) {
  const opportunities = [...(data?.immediate_opportunities ?? [])].sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99)
  );
  const series = data?.series_concepts ?? [];
  const shortForm = data?.short_form_strategy;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={6} total={7} title="콘텐츠 기획" sub="즉시 기회 · 시리즈 기획 · 숏폼 전략" />

      {/* immediate_opportunities: numbered 카드 */}
      {opportunities.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            즉시 실행 기회
          </p>
          <div className="space-y-3">
            {opportunities.map((opp, i) => (
              <div key={i} className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 bg-muted/30">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {opp.priority ?? i + 1}
                  </span>
                  <p className="text-xs font-bold text-foreground">{opp.title ?? "-"}</p>
                  {opp.expected_views && (
                    <span className="ml-auto shrink-0 text-[10px] font-semibold text-primary tabular-nums">
                      예상 {opp.expected_views}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {opp.concept && <p className="text-xs text-muted-foreground leading-relaxed">{opp.concept}</p>}
                  <div className="flex flex-wrap gap-3 text-[11px]">
                    {opp.format && (
                      <span>
                        <span className="text-muted-foreground/60">포맷 </span>
                        <span className="font-medium text-foreground">{opp.format}</span>
                      </span>
                    )}
                    {opp.title_formula && (
                      <span>
                        <span className="text-muted-foreground/60">제목 공식 </span>
                        <span className="font-medium text-foreground">{opp.title_formula}</span>
                      </span>
                    )}
                  </div>
                  {opp.rationale && (
                    <div className="border-l-2 border-primary/30 pl-2.5">
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{opp.rationale}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* series_concepts */}
      {series.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            시리즈 기획
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {series.map((s, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-bold text-foreground mb-2">{s.series_name ?? "-"}</p>
                {s.concept && <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{s.concept}</p>}
                <div className="flex flex-wrap gap-3 text-[11px]">
                  {s.episode_count != null && (
                    <span>
                      <span className="text-muted-foreground/60">에피소드 </span>
                      <span className="font-semibold text-foreground tabular-nums">{s.episode_count}개</span>
                    </span>
                  )}
                  {s.target_views_per_episode && (
                    <span>
                      <span className="text-muted-foreground/60">목표 조회수 </span>
                      <span className="font-semibold text-primary">{s.target_views_per_episode}</span>
                    </span>
                  )}
                  {s.content_calendar && (
                    <span>
                      <span className="text-muted-foreground/60">업로드 </span>
                      <span className="font-semibold text-foreground">{s.content_calendar}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* short_form_strategy */}
      {shortForm && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            숏폼 전략
          </p>
          <div className="rounded-lg border border-border bg-background p-4 space-y-2 text-xs">
            {shortForm.posting_frequency && (
              <div>
                <span className="text-muted-foreground">게시 빈도: </span>
                <span className="font-medium text-foreground">{shortForm.posting_frequency}</span>
              </div>
            )}
            {shortForm.hashtag_strategy && (
              <div>
                <span className="text-muted-foreground">해시태그: </span>
                <span className="font-medium text-foreground">{shortForm.hashtag_strategy}</span>
              </div>
            )}
            {(shortForm.recommended_formats ?? []).length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1">추천 포맷</p>
                <ul className="space-y-0.5">
                  {(shortForm.recommended_formats ?? []).map((f, i) => (
                    <li key={i} className="text-foreground/80">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── 섹션 7: 실행 계획 ─────────────────────────────────────────

type PriorityLevel = "긴급" | "높음" | string;

function PlanBadge({ priority }: { priority?: PriorityLevel }) {
  if (priority === "긴급")
    return (
      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border bg-red-500/10 text-red-500 border-red-500/20">
        URGENT
      </span>
    );
  if (priority === "높음")
    return (
      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border bg-amber-400/10 text-amber-500 border-amber-400/20">
        HIGH
      </span>
    );
  return (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border bg-muted text-muted-foreground border-border">
      {priority ?? "NORMAL"}
    </span>
  );
}

function ActionPlan({ data }: { data: ManusReportJson["section7_action_plan"] }) {
  const kpi = data?.kpi_targets;
  const kpiRows: Array<{ label: string; key: keyof NonNullable<typeof kpi> }> = [
    { label: "1개월", key: "1_month" },
    { label: "3개월", key: "3_months" },
    { label: "6개월", key: "6_months" },
    { label: "12개월", key: "12_months" },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <SectionHeader n={7} total={7} title="실행 계획" sub="즉시 · 단기 · 장기 로드맵 및 KPI 목표" />

      {/* 즉시 실행 */}
      {(data?.immediate_actions?.tasks ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-red-500">
            즉시 실행 ({data?.immediate_actions?.timeframe ?? ""})
          </p>
          <div className="space-y-2">
            {(data?.immediate_actions?.tasks ?? []).map((t, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2.5">
                <PlanBadge priority={t.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{t.task ?? "-"}</p>
                  {t.detail && <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{t.detail}</p>}
                  {t.expected_impact && (
                    <p className="mt-0.5 text-[11px] text-primary/80">기대 효과: {t.expected_impact}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 단기 계획 */}
      {(data?.short_term_plan?.tasks ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-500">
            단기 계획 ({data?.short_term_plan?.timeframe ?? ""})
          </p>
          <div className="space-y-2">
            {(data?.short_term_plan?.tasks ?? []).map((t, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2.5">
                <PlanBadge priority={t.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{t.task ?? "-"}</p>
                  {t.detail && <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{t.detail}</p>}
                  {t.expected_impact && (
                    <p className="mt-0.5 text-[11px] text-primary/80">기대 효과: {t.expected_impact}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 장기 계획 */}
      {(data?.long_term_plan?.tasks ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            장기 계획 ({data?.long_term_plan?.timeframe ?? ""})
          </p>
          <div className="space-y-2">
            {(data?.long_term_plan?.tasks ?? []).map((t, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2.5">
                <PlanBadge priority={t.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{t.task ?? "-"}</p>
                  {t.detail && <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{t.detail}</p>}
                  {t.kpi && <p className="mt-0.5 text-[11px] text-primary/80">KPI: {t.kpi}</p>}
                  {t.timeline && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">타임라인: {t.timeline}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI 타겟 테이블 */}
      {kpi && (
        <div className="mb-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            KPI 목표
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">기간</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground">구독자</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground">업로드</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground">영상당 평균</th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.map(({ label, key }) => {
                  const row = kpi[key];
                  if (!row) return null;
                  return (
                    <tr key={key} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium text-foreground">{label}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-primary">
                        {fmt(row.subscribers)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {row.upload_count != null ? `${row.upload_count}개` : "-"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {fmt(row.avg_views_per_video)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 리스크 관리 테이블 */}
      {(data?.risk_management ?? []).length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            리스크 관리
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">리스크</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">대응 방안</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground">발생 가능성</th>
                </tr>
              </thead>
              <tbody>
                {(data?.risk_management ?? []).map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-foreground/80">{r.risk ?? "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.mitigation ?? "-"}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{r.probability ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
      {/* channel_info 헤더 섹션 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Channel Report
          </p>
          <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">
            {info?.channel_name ?? "채널명 없음"}
          </h1>
          {info?.channel_description && (
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
              {info.channel_description}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {info?.founded && <span>개설 {info.founded}</span>}
            {info?.subscribers != null && (
              <>
                <span>·</span>
                <span>구독자 {fmt(info.subscribers)}명</span>
              </>
            )}
            {info?.total_videos != null && (
              <>
                <span>·</span>
                <span>총 영상 {fmt(info.total_videos)}개</span>
              </>
            )}
            {info?.total_views != null && (
              <>
                <span>·</span>
                <span>총 조회수 {fmt(info.total_views)}</span>
              </>
            )}
            {info?.analysis_date && (
              <>
                <span>·</span>
                <span>분석 기준일 {info.analysis_date}</span>
              </>
            )}
          </div>
        </div>

        {/* 7개 섹션 */}
        <div className="space-y-6">
          <Scorecard data={report.section1_scorecard} />
          <GrowthMetrics data={report.section2_growth_metrics} />
          <DataSignals data={report.section3_data_signals} />
          <ChannelPatterns data={report.section4_channel_patterns} />
          <ChannelDNA data={report.section5_channel_dna} />
          <ContentPlans data={report.section6_content_plans} />
          <ActionPlan data={report.section7_action_plan} />
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            이 리포트는 <span className="font-semibold text-foreground">TubeWatch™</span>가 생성했습니다.
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/50">{date}</p>
        </div>
      </div>
    </div>
  );
}
