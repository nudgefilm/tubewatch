"use client";

import type { ManusReportJson } from "@/lib/manus/types";

type Props = {
  report: ManusReportJson;
  generatedAt: string;
};

// ── helpers ────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n == null) return "-";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString("ko-KR");
}

function gradeColor(g: string): string {
  if (!g) return "#6b7280";
  if (g.startsWith("A")) return "#10b981";
  if (g.startsWith("B")) return "#3b82f6";
  if (g.startsWith("C")) return "#f59e0b";
  return "#ef4444";
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color = gradeColor(grade);
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="900" fill={color} fontFamily="inherit">
        {score}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="inherit">
        / 100
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fontSize="20" fontWeight="900" fill={color} fontFamily="inherit">
        {grade || "-"}
      </text>
    </svg>
  );
}

function Bar({ pct, color }: { pct: number; color?: string }) {
  const c = color ?? (pct >= 80 ? "#10b981" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#f59e0b" : "#ef4444");
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: c }} />
    </div>
  );
}

function SecHead({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6 pb-4 border-b border-gray-100">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-black text-white mt-0.5">
        {String(n).padStart(2, "0")}
      </div>
      <div>
        <h2 className="text-base font-bold tracking-tight text-gray-900">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-white/10 px-4 py-3 text-center">
      <p className="text-[10px] text-white/60 mb-1">{label}</p>
      <p className="text-lg font-black text-white tabular-nums">{value}</p>
      {unit && <p className="text-[9px] text-white/40">{unit}</p>}
    </div>
  );
}

function PriBadge({ p }: { p?: string }) {
  if (!p) return null;
  const up = p.toUpperCase();
  if (up === "긴급" || up === "URGENT")
    return <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">URGENT</span>;
  if (up === "높음" || up === "HIGH")
    return <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">HIGH</span>;
  return <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-200">NORMAL</span>;
}

// ── Section 1: Scorecard ───────────────────────────────────────

function ScorecardSec({ data }: { data: ManusReportJson["section1_scorecard"] }) {
  if (!data) return null;
  const score = data.overall_score ?? 0;
  const grade = data.grade ?? "-";

  const keys = [
    { key: "growth_velocity", label: "성장 속도" },
    { key: "niche_authority", label: "니치 권위" },
    { key: "viral_potential", label: "바이럴 잠재력" },
    { key: "upload_regularity", label: "업로드 규칙성" },
    { key: "engagement_quality", label: "인게이지먼트 품질" },
    { key: "content_consistency", label: "콘텐츠 일관성" },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={1} title="채널 종합 스코어카드" sub="전체 채널 건강도 종합 평가" />

      <div className="flex flex-wrap items-center gap-8 mb-6">
        <ScoreRing score={score} grade={grade} />
        <div className="flex-1 min-w-0 space-y-3">
          {keys.map(({ key, label }) => {
            const item = data.score_breakdown?.[key];
            if (!item) return null;
            const c = gradeColor(item.grade ?? "");
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tabular-nums" style={{ color: c }}>{item.grade}</span>
                    <span className="w-7 text-right font-semibold tabular-nums text-gray-700">{item.score ?? 0}</span>
                  </div>
                </div>
                <Bar pct={item.score ?? 0} color={c} />
                {item.comment && <p className="mt-0.5 text-[10px] text-gray-400 leading-relaxed">{item.comment}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 border-t border-gray-100 pt-5">
        {(data.strengths ?? []).length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">강점</p>
            <ul className="space-y-2">
              {(data.strengths ?? []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 inline-block" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(data.weaknesses ?? []).length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-500">약점</p>
            <ul className="space-y-2">
              {(data.weaknesses ?? []).map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 inline-block" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Section 2: Growth Metrics ──────────────────────────────────

function GrowthSec({ data }: { data: ManusReportJson["section2_growth_metrics"] }) {
  if (!data) return null;
  const trend = data.growth_trend;
  const stats = data.view_statistics;
  const dist = data.view_distribution;
  const eng = data.engagement_metrics;
  const sub = data.subscriber_efficiency;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={2} title="성장 지표 분석" sub="최근 50개 영상 기반 핵심 성장 지표" />

      {trend && (
        <div className="mb-5 rounded-xl bg-gray-50 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">조회수 트렌드</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">최근 10개 평균</p>
              <p className="text-lg font-black tabular-nums text-gray-900">{fmt(trend.recent_10_avg_views)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">이전 10개 평균</p>
              <p className="text-lg font-black tabular-nums text-gray-400">{fmt(trend.previous_10_avg_views)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">성장률</p>
              <p className={`text-lg font-black tabular-nums ${(trend.growth_rate_pct ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {trend.growth_rate_pct != null ? `${trend.growth_rate_pct > 0 ? "+" : ""}${trend.growth_rate_pct}%` : "-"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">최근 30일 업로드</p>
              <p className="text-lg font-black tabular-nums text-gray-900">{trend.monthly_upload_last_30d ?? "-"}개</p>
            </div>
          </div>
          {trend.trend_comment && (
            <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500 leading-relaxed">{trend.trend_comment}</p>
          )}
        </div>
      )}

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "평균 조회수", v: fmt(stats.average_views), c: "text-gray-900" },
            { label: "중앙값", v: fmt(stats.median_views), c: "text-gray-900" },
            { label: "최고 조회수", v: fmt(stats.max_views?.views), c: "text-emerald-600" },
            { label: "최저 조회수", v: fmt(stats.min_views?.views), c: "text-red-500" },
          ].map((m, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <p className="text-[10px] text-gray-400 mb-1">{m.label}</p>
              <p className={`text-base font-black tabular-nums ${m.c}`}>{m.v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {dist && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">조회수 분포</p>
            <div className="space-y-1.5 text-xs">
              {[
                { l: "50만 이상", v: `${dist.over_500k ?? 0}개` },
                { l: "5만 미만", v: `${dist.under_50k ?? 0}개` },
                { l: "바이럴 비율", v: `${dist.viral_ratio_pct ?? 0}%`, bold: true },
                { l: "평균 이상 비율", v: `${dist.above_average_ratio_pct ?? 0}%` },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-500">{row.l}</span>
                  <span className={`font-bold tabular-nums ${row.bold ? "text-blue-600" : "text-gray-700"}`}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {eng && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">인게이지먼트</p>
            <div className="space-y-1.5 text-xs">
              {[
                { l: "평균 좋아요율", v: `${eng.avg_like_rate ?? 0}%` },
                { l: "평균 댓글율", v: `${eng.avg_comment_rate ?? 0}%` },
                { l: "영상당 평균 좋아요", v: fmt(eng.avg_likes_per_video) },
                { l: "영상당 평균 댓글", v: fmt(eng.avg_comments_per_video) },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-500">{row.l}</span>
                  <span className="font-bold tabular-nums text-gray-700">{row.v}</span>
                </div>
              ))}
            </div>
            {sub?.comment && (
              <p className="mt-3 border-t border-gray-200 pt-2 text-[10px] text-gray-400 leading-relaxed">{sub.comment}</p>
            )}
          </div>
        )}
      </div>

      {(data.top10_videos ?? []).length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">TOP 10 영상</p>
          <div className="space-y-1.5">
            {(data.top10_videos ?? []).map((v, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-gray-50">
                <span className="w-5 shrink-0 text-center text-xs font-black text-blue-600 tabular-nums">{v.rank ?? i + 1}</span>
                <span className="flex-1 min-w-0 text-xs text-gray-700 truncate">{v.title ?? "-"}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">{fmt(v.views)}</span>
                <span className="shrink-0 text-[10px] text-gray-300">{v.date ?? ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Section 3: Data Signals ────────────────────────────────────

function DataSignalsSec({ data }: { data: ManusReportJson["section3_data_signals"] }) {
  if (!data) return null;
  const high = data.high_performance_patterns ?? [];
  const low = data.low_performance_patterns ?? [];
  const kw = data.keyword_analysis;
  const title = data.title_pattern_analysis;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={3} title="데이터 시그널" sub="고성과 · 저성과 패턴 · 키워드 · 제목 분석" />

      {high.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500">고성과 패턴</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {high.map((p, i) => (
              <div key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-gray-800 leading-tight">{p.pattern ?? "-"}</p>
                  {p.avg_views != null && <span className="shrink-0 text-[10px] font-semibold text-emerald-600 tabular-nums">평균 {fmt(p.avg_views)}</span>}
                </div>
                {p.description && <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5">{p.description}</p>}
                {p.insight && <div className="border-l-2 border-emerald-400 pl-2.5"><p className="text-[11px] text-gray-500 leading-relaxed">{p.insight}</p></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {low.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-red-500">저성과 패턴</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {low.map((p, i) => (
              <div key={i} className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-gray-800 leading-tight">{p.pattern ?? "-"}</p>
                  {p.avg_views != null && <span className="shrink-0 text-[10px] font-semibold text-red-500 tabular-nums">평균 {fmt(p.avg_views)}</span>}
                </div>
                {p.description && <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5">{p.description}</p>}
                {p.insight && <div className="border-l-2 border-red-400 pl-2.5"><p className="text-[11px] text-gray-500 leading-relaxed">{p.insight}</p></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {kw && (
        <div className="mb-6">
          {(kw.high_ctr_keywords ?? []).length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">고 CTR 키워드</p>
              <div className="flex flex-wrap gap-1.5">
                {(kw.high_ctr_keywords ?? []).map((k, i) => (
                  <span key={i} className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{k}</span>
                ))}
              </div>
            </div>
          )}
          {kw.topic_performance && Object.keys(kw.topic_performance).length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">주제별 성과</p>
              <div className="space-y-2">
                {Object.entries(kw.topic_performance).map(([topic, perf], i) => (
                  <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-800">{topic}</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        {perf?.video_count != null && <span className="text-gray-400 tabular-nums">{perf.video_count}개</span>}
                        {perf?.share_pct != null && <span className="font-bold text-blue-600 tabular-nums">{perf.share_pct}%</span>}
                        {perf?.avg_views != null && <span className="text-gray-400 tabular-nums">평균 {fmt(perf.avg_views)}</span>}
                      </div>
                    </div>
                    {perf?.share_pct != null && <Bar pct={perf.share_pct} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {title && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">제목 패턴 분석</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div><p className="text-gray-400">평균 제목 길이</p><p className="font-bold text-gray-800 tabular-nums">{title.avg_title_length ?? "-"}자</p></div>
              <div><p className="text-gray-400">최적 길이</p><p className="font-bold text-gray-800">{title.optimal_title_length ?? "-"}</p></div>
              {title.hashtag_usage && <div><p className="text-gray-400">평균 태그 수</p><p className="font-bold text-gray-800 tabular-nums">{title.hashtag_usage.avg_tags ?? 0}개</p></div>}
            </div>
            {title.hashtag_usage?.effective_tags && (
              <p className="mb-3 text-[11px] text-gray-500">효과적인 태그: <span className="font-semibold text-gray-700">{title.hashtag_usage.effective_tags}</span></p>
            )}
            {(title.effective_structures ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-300">효과적인 제목 구조</p>
                <ul className="space-y-1.5">
                  {(title.effective_structures ?? []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-black text-blue-600 mt-0.5">{i + 1}</span>
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

// ── Section 4: Channel Patterns ────────────────────────────────

function ChannelPatternsSec({ data }: { data: ManusReportJson["section4_channel_patterns"] }) {
  if (!data) return null;
  const upload = data.upload_patterns;
  const audience = data.audience_behavior;
  const evolution = data.content_evolution;
  const seriesPerf = data.series_performance;
  const thumbTitle = data.thumbnail_and_title_patterns;

  const phases = evolution
    ? (["phase1", "phase2", "phase3", "phase4", "phase5"] as const)
        .map((k) => ({ key: k, d: evolution[k] }))
        .filter((p) => p.d != null)
    : [];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={4} title="채널 운영 패턴" sub="업로드 · 포맷 · 시청자 반응 · 시리즈 · 콘텐츠 진화" />

      {phases.length > 0 && (
        <div className="mb-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">콘텐츠 진화 타임라인</p>
          <div className="space-y-0">
            {phases.map((p, i) => (
              <div key={p.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-black text-white">{i + 1}</div>
                  {i < phases.length - 1 && <div className="w-px flex-1 bg-gray-200" style={{ minHeight: "20px" }} />}
                </div>
                <div className="pb-5">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-gray-800">{p.d?.theme ?? "-"}</p>
                    {p.d?.period && <span className="text-[10px] text-gray-400">{p.d.period}</span>}
                    {p.d?.avg_views_estimate != null && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 tabular-nums">평균 {fmt(p.d.avg_views_estimate)}</span>
                    )}
                  </div>
                  {p.d?.description && <p className="text-[11px] text-gray-500 leading-relaxed">{p.d.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upload && (
        <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-700">업로드 패턴</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            {upload.avg_upload_interval_days != null && <div><p className="text-gray-400">평균 업로드 주기</p><p className="font-bold text-gray-800">{upload.avg_upload_interval_days}일</p></div>}
            {upload.recent_30d_uploads != null && <div><p className="text-gray-400">최근 30일 업로드</p><p className="font-bold text-gray-800">{upload.recent_30d_uploads}개</p></div>}
            {upload.upload_consistency && <div><p className="text-gray-400">업로드 일관성</p><p className="font-bold text-gray-800">{upload.upload_consistency}</p></div>}
            {upload.optimal_upload_frequency && <div><p className="text-gray-400">최적 업로드 빈도</p><p className="font-bold text-blue-600">{upload.optimal_upload_frequency}</p></div>}
            {upload.peak_upload_period && <div className="col-span-2"><p className="text-gray-400">최고 활동 기간</p><p className="font-bold text-gray-800">{upload.peak_upload_period}</p></div>}
          </div>
        </div>
      )}

      {audience && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">시청자 반응 패턴</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {audience.viral_trigger && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">바이럴 트리거</p>
                <p className="text-xs text-gray-600 leading-relaxed">{audience.viral_trigger}</p>
              </div>
            )}
            {audience.comment_driver && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">댓글 유도 요소</p>
                <p className="text-xs text-gray-600 leading-relaxed">{audience.comment_driver}</p>
              </div>
            )}
            {audience.engagement_peak_content && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">참여 최고 콘텐츠</p>
                <p className="text-xs text-gray-600 leading-relaxed">{audience.engagement_peak_content}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {seriesPerf && Object.keys(seriesPerf).length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">시리즈 성과</p>
          <div className="space-y-2">
            {Object.entries(seriesPerf).map(([key, s], i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-gray-800">{s?.name ?? key}</p>
                  <div className="flex items-center gap-2">
                    {s?.status && <span className="text-[10px] text-gray-400">{s.status}</span>}
                    {s?.avg_views != null && <span className="text-xs font-semibold tabular-nums text-blue-600">평균 {fmt(s.avg_views)}</span>}
                  </div>
                </div>
                <div className="flex gap-3 text-[11px] text-gray-400">
                  {s?.video_count != null && <span>영상 {s.video_count}개</span>}
                  {s?.peak_video && <span>· 최고: {s.peak_video}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {thumbTitle && (
        (thumbTitle.effective_title_formulas ?? []).length > 0 || (thumbTitle.effective_thumbnail_elements ?? []).length > 0
      ) && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">제목 / 썸네일 패턴</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3 text-xs">
            {(thumbTitle.effective_title_formulas ?? []).length > 0 && (
              <div>
                <p className="text-gray-400 mb-1">효과적인 제목 공식</p>
                <ul className="space-y-1">
                  {(thumbTitle.effective_title_formulas ?? []).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-gray-600"><span className="text-blue-500 shrink-0">·</span>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {(thumbTitle.effective_thumbnail_elements ?? []).length > 0 && (
              <div>
                <p className="text-gray-400 mb-1">효과적인 썸네일 요소</p>
                <ul className="space-y-1">
                  {(thumbTitle.effective_thumbnail_elements ?? []).map((e, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-gray-600"><span className="text-blue-500 shrink-0">·</span>{e}</li>
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

// ── Section 5: Channel DNA ─────────────────────────────────────

function ChannelDNASec({ data }: { data: ManusReportJson["section5_channel_dna"] }) {
  if (!data) return null;
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={5} title="Channel DNA 진단" sub="핵심 정체성 · 포지셔닝 · 콘텐츠 필러" />

      {data.core_identity && (
        <div className="mb-5 rounded-xl border-l-4 border-blue-500 bg-blue-50/40 px-4 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">CORE IDENTITY</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.core_identity}</p>
        </div>
      )}

      {data.unique_value_proposition && (
        <blockquote className="mb-5 rounded-xl bg-gray-900 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Unique Value Proposition</p>
          <p className="text-sm font-semibold text-white leading-relaxed">&ldquo;{data.unique_value_proposition}&rdquo;</p>
        </blockquote>
      )}

      {(data.brand_keywords ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">브랜드 키워드</p>
          <div className="flex flex-wrap gap-1.5">
            {(data.brand_keywords ?? []).map((kw, i) => (
              <span key={i} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {(data.content_pillars ?? []).length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">콘텐츠 필러</p>
          <div className="space-y-2.5">
            {(data.content_pillars ?? []).map((pillar, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-gray-800">{pillar.pillar ?? "-"}</p>
                  <div className="flex items-center gap-2">
                    {pillar.avg_performance && <span className="text-[10px] text-gray-400">{pillar.avg_performance}</span>}
                    {pillar.contribution_pct != null && <span className="text-xs font-black text-blue-600 tabular-nums">{pillar.contribution_pct}%</span>}
                  </div>
                </div>
                {pillar.contribution_pct != null && <div className="mb-2"><Bar pct={pillar.contribution_pct} /></div>}
                {pillar.description && <p className="text-[11px] text-gray-500 leading-relaxed">{pillar.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        {data.creator_persona && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">크리에이터 페르소나</p>
            <div className="space-y-2 text-xs">
              {data.creator_persona.character && <div><p className="text-gray-400">캐릭터</p><p className="font-medium text-gray-700">{data.creator_persona.character}</p></div>}
              {data.creator_persona.storytelling_style && <div><p className="text-gray-400">스토리텔링 스타일</p><p className="font-medium text-gray-700">{data.creator_persona.storytelling_style}</p></div>}
              {data.creator_persona.relationship_with_audience && <div><p className="text-gray-400">시청자와의 관계</p><p className="font-medium text-gray-700">{data.creator_persona.relationship_with_audience}</p></div>}
            </div>
          </div>
        )}
        {data.target_audience && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">타겟 오디언스</p>
            <div className="space-y-2 text-xs">
              {data.target_audience.primary && <div><p className="text-gray-400">1차 타겟</p><p className="font-medium text-gray-700">{data.target_audience.primary}</p></div>}
              {data.target_audience.secondary && <div><p className="text-gray-400">2차 타겟</p><p className="font-medium text-gray-700">{data.target_audience.secondary}</p></div>}
              {data.target_audience.tertiary && <div><p className="text-gray-400">3차 타겟</p><p className="font-medium text-gray-700">{data.target_audience.tertiary}</p></div>}
            </div>
          </div>
        )}
      </div>

      {data.competitive_differentiation && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">경쟁 차별화</p>
          <p className="text-xs text-gray-600 leading-relaxed">{data.competitive_differentiation}</p>
        </div>
      )}
    </section>
  );
}

// ── Section 6: Content Plans ───────────────────────────────────

function ContentPlansSec({ data }: { data: ManusReportJson["section6_content_plans"] }) {
  if (!data) return null;
  const opps = [...(data.immediate_opportunities ?? [])].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  const series = data.series_concepts ?? [];
  const shortForm = data.short_form_strategy;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={6} title="완성형 콘텐츠 기획안" sub="즉시 실행 기회 · 시리즈 기획 · 숏폼 전략" />

      {opps.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">즉시 실행 기회</p>
          <div className="space-y-4">
            {opps.map((opp, i) => (
              <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 bg-gray-50">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-black text-white">
                    {String(opp.priority ?? i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-xs font-bold text-gray-800">{opp.title ?? "-"}</p>
                  {opp.expected_views && (
                    <span className="shrink-0 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">예상 {opp.expected_views}</span>
                  )}
                </div>
                <div className="p-4 space-y-2.5">
                  {opp.concept && <p className="text-xs text-gray-500 leading-relaxed">{opp.concept}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                    {opp.format && <span><span className="text-gray-400">포맷 </span><span className="font-medium text-gray-700">{opp.format}</span></span>}
                    {opp.title_formula && <span><span className="text-gray-400">제목 공식 </span><span className="font-medium text-gray-700">{opp.title_formula}</span></span>}
                  </div>
                  {opp.rationale && (
                    <div className="border-l-2 border-blue-300 pl-3">
                      <p className="text-[11px] text-gray-500 leading-relaxed">{opp.rationale}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {series.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">시리즈 기획</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {series.map((s, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-800 mb-2">{s.series_name ?? "-"}</p>
                {s.concept && <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{s.concept}</p>}
                <div className="flex flex-wrap gap-3 text-[11px]">
                  {s.episode_count != null && <span><span className="text-gray-400">에피소드 </span><span className="font-semibold text-gray-700 tabular-nums">{s.episode_count}개</span></span>}
                  {s.target_views_per_episode && <span><span className="text-gray-400">목표 조회수 </span><span className="font-semibold text-blue-600">{s.target_views_per_episode}</span></span>}
                  {s.content_calendar && <span><span className="text-gray-400">업로드 </span><span className="font-semibold text-gray-700">{s.content_calendar}</span></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shortForm && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">숏폼 전략</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 text-xs">
            {shortForm.posting_frequency && <div><span className="text-gray-400">게시 빈도: </span><span className="font-medium text-gray-700">{shortForm.posting_frequency}</span></div>}
            {shortForm.hashtag_strategy && <div><span className="text-gray-400">해시태그 전략: </span><span className="font-medium text-gray-700">{shortForm.hashtag_strategy}</span></div>}
            {(shortForm.recommended_formats ?? []).length > 0 && (
              <div>
                <p className="text-gray-400 mb-1">추천 포맷</p>
                <ul className="space-y-0.5">
                  {(shortForm.recommended_formats ?? []).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-gray-600"><span className="text-blue-500 shrink-0">·</span>{f}</li>
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

// ── Section 7: Action Plan ─────────────────────────────────────

function ActionPlanSec({ data }: { data: ManusReportJson["section7_action_plan"] }) {
  if (!data) return null;
  const kpi = data.kpi_targets;

  type Task = { task?: string; detail?: string; priority?: string; expected_impact?: string; kpi?: string; timeline?: string };
  function TaskRows({ tasks, timeframe, labelColor, label }: { tasks: Task[]; timeframe?: string; labelColor: string; label: string }) {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-5">
        <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>
          {label}{timeframe ? ` (${timeframe})` : ""}
        </p>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <PriBadge p={t.priority} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{t.task ?? "-"}</p>
                {t.detail && <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">{t.detail}</p>}
                {t.expected_impact && <p className="mt-0.5 text-[11px] text-blue-600/80">기대 효과: {t.expected_impact}</p>}
                {t.kpi && <p className="mt-0.5 text-[11px] text-blue-600/80">KPI: {t.kpi}</p>}
                {t.timeline && <p className="mt-0.5 text-[10px] text-gray-400">타임라인: {t.timeline}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <SecHead n={7} title="30일 실행 계획" sub="즉시 · 단기 · 장기 로드맵 및 KPI 목표" />

      <TaskRows tasks={data.immediate_actions?.tasks ?? []} timeframe={data.immediate_actions?.timeframe} labelColor="text-red-500" label="즉시 실행" />
      <TaskRows tasks={data.short_term_plan?.tasks ?? []} timeframe={data.short_term_plan?.timeframe} labelColor="text-amber-500" label="단기 계획" />
      <TaskRows tasks={data.long_term_plan?.tasks ?? []} timeframe={data.long_term_plan?.timeframe} labelColor="text-gray-400" label="장기 계획" />

      {kpi && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">KPI 목표</p>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">기간</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-500">구독자</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-500">업로드</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-500">영상당 평균</th>
                </tr>
              </thead>
              <tbody>
                {(["1_month", "3_months", "6_months", "12_months"] as const).map((key) => {
                  const row = kpi[key];
                  if (!row) return null;
                  const label = { "1_month": "1개월", "3_months": "3개월", "6_months": "6개월", "12_months": "12개월" }[key];
                  return (
                    <tr key={key} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 font-medium text-gray-700">{label}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-blue-600">{fmt(row.subscribers)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-500">{row.upload_count != null ? `${row.upload_count}개` : "-"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-500">{fmt(row.avg_views_per_video)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(data.risk_management ?? []).length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">리스크 관리</p>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">리스크</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">대응 방안</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-500">가능성</th>
                </tr>
              </thead>
              <tbody>
                {(data.risk_management ?? []).map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2 text-gray-700">{r.risk ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-500">{r.mitigation ?? "-"}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{r.probability ?? "-"}</td>
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

// ── Main ───────────────────────────────────────────────────────

export default function ReportView({ report, generatedAt }: Props) {
  const info = report.channel_info;
  const score = report.section1_scorecard?.overall_score ?? 0;
  const grade = report.section1_scorecard?.grade ?? "-";
  const gc = gradeColor(grade);

  const date = new Date(generatedAt).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const statCards = [
    info?.subscribers != null && { label: "구독자", value: fmt(info.subscribers), unit: "명" },
    info?.total_videos != null && { label: "총 영상", value: fmt(info.total_videos), unit: "개" },
    info?.total_views != null && { label: "총 조회수", value: fmt(info.total_views), unit: "회" },
    info?.founded && { label: "채널 개설", value: info.founded, unit: "시작일" },
  ].filter(Boolean) as Array<{ label: string; value: string; unit: string }>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── 헤더 (다크) ────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
          <div className="bg-gray-900 px-6 pt-6 pb-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                TubeWatch™ — 월간 채널 분석 리포트
              </span>
              <span className="text-[10px] text-gray-600">{date}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">
              {info?.channel_name ?? "채널명 없음"}
            </h1>
            {info?.channel_description && (
              <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2">{info.channel_description}</p>
            )}
            {statCards.length > 0 && (
              <div className={`grid gap-2 grid-cols-2 ${statCards.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
                {statCards.map((s, i) => (
                  <StatCard key={i} label={s.label} value={s.value} unit={s.unit} />
                ))}
              </div>
            )}
          </div>

          {/* 채널 스코어 요약 바 */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tabular-nums" style={{ color: gc }}>{score}</span>
              <div>
                <p className="text-[10px] text-gray-500 leading-none">종합 점수</p>
                <p className="text-xl font-black leading-tight" style={{ color: gc }}>{grade}</p>
              </div>
            </div>
            <div className="flex-1 max-w-48">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: gc }} />
              </div>
              <p className="mt-1 text-[10px] text-gray-500 text-right">{score} / 100</p>
            </div>
            {info?.analysis_date && (
              <p className="text-[10px] text-gray-600 hidden sm:block">분석 기준일 {info.analysis_date}</p>
            )}
          </div>
        </div>

        {/* ── 섹션들 ────────────────────────────────────────────── */}
        <div className="space-y-5">
          <ScorecardSec data={report.section1_scorecard} />
          <GrowthSec data={report.section2_growth_metrics} />
          <DataSignalsSec data={report.section3_data_signals} />
          <ChannelPatternsSec data={report.section4_channel_patterns} />
          <ChannelDNASec data={report.section5_channel_dna} />
          <ContentPlansSec data={report.section6_content_plans} />
          <ActionPlanSec data={report.section7_action_plan} />
        </div>

        {/* ── 푸터 ─────────────────────────────────────────────── */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400">
            이 리포트는 <span className="font-semibold text-gray-700">TubeWatch™</span>가 생성했습니다.
          </p>
          <p className="mt-1 text-[10px] text-gray-300">{date} · 튜브워치 엔진 v2.1</p>
        </div>
      </div>
    </div>
  );
}
