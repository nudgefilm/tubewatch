"use client";

import { useState } from "react";
import type { ManusReportJson } from "@/lib/manus/types";

type Props = { report: ManusReportJson; generatedAt: string };

/* ── design tokens ─────────────────────────────────────────── */
const LIME   = "#AAFF00";
const ORANGE = "#FF7A00";
const ORBG   = "rgba(255,122,0,.12)";
const BLK    = "#0D0D0D";
const DARK   = "#1A1A1A";
const DARK2  = "#1C1C1C";
const DARK3  = "#2A2A2A";
const G100   = "#F5F5F5";
const G200   = "#E8E8E8";
const G400   = "#999999";
const G600   = "#555555";
const MONO   = "'JetBrains Mono','Fira Code',monospace";
const SANS   = "'Inter','Noto Sans KR',sans-serif";

/* ── helpers ──────────────────────────────────────────────── */
function fmt(n: number | undefined | null): string {
  if (n == null) return "-";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString("ko-KR");
}

function SecLabel({ txt, section, dark }: { txt: string; section?: string; dark?: boolean }) {
  const c = dark ? "#999" : G400;
  return (
    <div style={{ fontFamily: MONO, fontSize: "11px", color: c, letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
      <span style={{ display: "block", width: "28px", height: "1px", background: c }} />
      {txt}{section ? ` · ${section}` : ""}
    </div>
  );
}

function DotBadge({ status }: { status: "up" | "dn" | "fl" | "wn" }) {
  const map = {
    up: { bg: "#DCFCE7", c: "#16A34A", t: "▲ 양호" },
    dn: { bg: "#FEE2E2", c: "#DC2626", t: "▼ 주의" },
    fl: { bg: "#F3F4F6", c: "#6B7280", t: "→ 보통" },
    wn: { bg: "#FEF3C7", c: "#D97706", t: "⚠ 둔화" },
  };
  const s = map[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", background: s.bg, color: s.c, marginBottom: "8px" }}>
      {s.t}
    </span>
  );
}

function SiDot({ t }: { t: "g" | "r" | "y" | "b" }) {
  const c = { g: LIME, r: "#FF6B6B", y: "#FFA500", b: "#88CCFF" }[t];
  return <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: c, marginRight: "5px", verticalAlign: "middle", flexShrink: 0 }} />;
}

function PriBadge({ p }: { p?: string }) {
  if (!p) return null;
  const up = (p ?? "").toUpperCase();
  if (up === "긴급" || up === "URGENT")
    return <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: "#FEE2E2", color: "#DC2626", letterSpacing: ".5px", whiteSpace: "nowrap" }}>URGENT</span>;
  if (up === "높음" || up === "HIGH")
    return <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: "#FEF3C7", color: "#B45309", letterSpacing: ".5px", whiteSpace: "nowrap" }}>HIGH</span>;
  return <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: "#EFF6FF", color: "#1D4ED8", letterSpacing: ".5px", whiteSpace: "nowrap" }}>NORMAL</span>;
}

function DkBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div style={{ height: "8px", width: "100%", background: "#333", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color ?? "#16A34A", borderRadius: "4px" }} />
    </div>
  );
}

/* ══ SECTION 1: HERO / SCORECARD ══════════════════════════════ */
function HeroSection({ info, scorecard, date }: {
  info: ManusReportJson["channel_info"];
  scorecard: ManusReportJson["section1_scorecard"];
  date: string;
}) {
  const score = scorecard?.overall_score ?? 0;
  const grade = scorecard?.grade ?? "-";
  const name  = info?.channel_name ?? "채널명";
  const desc  = info?.channel_description ?? "";
  const meta  = [
    info?.founded && `채널 개설 ${info.founded}`,
    info?.total_videos != null && `영상 ${fmt(info.total_videos)}개`,
    info?.subscribers != null && `구독자 ${fmt(info.subscribers)}명`,
    info?.analysis_date && `분석 기준일 ${info.analysis_date}`,
  ].filter(Boolean).join(" · ");

  const kpiLg = [
    { v: fmt(info?.total_views), vClass: "lime", l: "총 조회수 (누적)", d: "누적 조회" },
    { v: fmt(info?.subscribers), vClass: "",     l: "구독자 수",        d: "현재 구독자" },
  ];

  const breakdown = scorecard?.score_breakdown;
  const smallKpi = [
    { v: breakdown?.growth_velocity?.score ?? "-",    l: "성장 속도 점수",  d: breakdown?.growth_velocity?.grade ?? "" },
    { v: breakdown?.upload_regularity?.score ?? "-",  l: "업로드 규칙성",   d: breakdown?.upload_regularity?.grade ?? "" },
    { v: breakdown?.viral_potential?.score ?? "-",    l: "바이럴 잠재력",   d: breakdown?.viral_potential?.grade ?? "" },
    { v: breakdown?.engagement_quality?.score ?? "-", l: "참여 품질",       d: breakdown?.engagement_quality?.grade ?? "" },
    { v: breakdown?.niche_authority?.score ?? "-",    l: "니치 권위",       d: breakdown?.niche_authority?.grade ?? "" },
    { v: breakdown?.content_consistency?.score ?? "-",l: "콘텐츠 일관성",   d: breakdown?.content_consistency?.grade ?? "" },
  ];

  return (
    <section style={{ background: BLK, paddingBottom: 0 }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "64px 48px 0" }}>
        {/* eyebrow */}
        <div style={{ fontFamily: MONO, fontSize: "15px", fontWeight: 700, color: "#DDDDDD", letterSpacing: "3px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "40px", padding: "14px 0", borderBottom: `1px solid ${DARK3}` }}>
          <span style={{ display: "block", width: "40px", height: "1px", background: "#555" }} />
          Channel Report · {date} · 섹션 1 / 7
          <span style={{ display: "block", width: "40px", height: "1px", background: "#555" }} />
        </div>

        {/* channel header + score box */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "48px", alignItems: "center", paddingBottom: "36px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "8px", fontFamily: SANS }}>
              {name}<br />
              <em style={{ fontStyle: "normal", color: LIME }}>{desc.slice(0, 60) || "채널 분석 리포트"}</em>
            </h1>
            {meta && <p style={{ fontSize: "14px", color: "#AAAAAA", fontFamily: MONO }}>{meta}</p>}
          </div>
          <div style={{ border: `2px solid ${ORANGE}`, background: ORBG, padding: "28px 36px", textAlign: "center", minWidth: "180px", flexShrink: 0 }}>
            <div style={{ fontSize: "60px", fontWeight: 900, color: LIME, lineHeight: 1, fontFamily: MONO }}>{score}</div>
            <div style={{ fontSize: "11px", color: "#AAAAAA", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "8px", fontFamily: MONO }}>Channel Score</div>
            <div style={{ marginTop: "14px", display: "inline-block", fontSize: "22px", fontWeight: 900, background: ORANGE, color: "#fff", padding: "7px 22px", borderRadius: "4px", fontFamily: MONO, letterSpacing: "2px" }}>{grade}</div>
          </div>
        </div>

        {/* large KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: DARK3, border: `1px solid ${DARK3}`, marginBottom: "1px" }}>
          {kpiLg.map((k, i) => (
            <div key={i} style={{ background: DARK, padding: "28px" }}>
              <div style={{ fontSize: "36px", fontWeight: 900, color: k.vClass === "lime" ? LIME : "#fff", fontFamily: MONO, letterSpacing: "-1px", lineHeight: 1, marginBottom: "14px" }}>{k.v}</div>
              <div style={{ fontSize: "13px", color: "#AAAAAA", fontFamily: MONO, letterSpacing: ".3px", marginBottom: "8px" }}>{k.l}</div>
              <div style={{ fontSize: "13px", fontFamily: MONO, color: "#888" }}>{k.d}</div>
            </div>
          ))}
        </div>

        {/* small KPI cards (6) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "1px", background: DARK3, border: `1px solid ${DARK3}`, borderTop: "none", marginBottom: "48px" }}>
          {smallKpi.map((k, i) => (
            <div key={i} style={{ background: "#1E1E1E", padding: "20px 16px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", fontFamily: MONO, letterSpacing: "-.5px", lineHeight: 1, marginBottom: "10px" }}>{String(k.v)}</div>
              <div style={{ fontSize: "11px", color: "#AAAAAA", fontFamily: MONO, letterSpacing: ".3px", marginBottom: "6px", lineHeight: 1.4 }}>{k.l}</div>
              <div style={{ fontSize: "11px", fontFamily: MONO, color: LIME, lineHeight: 1.4 }}>{k.d}</div>
            </div>
          ))}
        </div>

        {/* strengths / weaknesses */}
        {(scorecard?.strengths?.length || scorecard?.weaknesses?.length) ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: DARK3, border: `1px solid ${DARK3}`, marginBottom: "0" }}>
            {scorecard.strengths?.length ? (
              <div style={{ background: DARK, padding: "24px 28px" }}>
                <div style={{ fontFamily: MONO, fontSize: "11px", color: LIME, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "12px", borderBottom: `2px solid ${DARK3}` }}>// STRENGTH · 강점</div>
                {scorecard.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "14px", marginBottom: "14px", paddingBottom: "14px", borderBottom: `1px solid #222` }}>
                    <span style={{ fontFamily: MONO, fontSize: "11px", color: "#888", flexShrink: 0, minWidth: "20px" }}>0{i + 1}</span>
                    <span style={{ fontSize: "14px", color: "#F0F0F0", lineHeight: 1.7 }}>{s}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ background: DARK, padding: "24px 28px" }} />}
            {scorecard.weaknesses?.length ? (
              <div style={{ background: DARK, padding: "24px 28px" }}>
                <div style={{ fontFamily: MONO, fontSize: "11px", color: "#FF6B6B", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "12px", borderBottom: `2px solid ${DARK3}` }}>// WEAKNESS · 약점</div>
                {scorecard.weaknesses.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: "14px", marginBottom: "14px", paddingBottom: "14px", borderBottom: `1px solid #222` }}>
                    <span style={{ fontFamily: MONO, fontSize: "11px", color: "#888", flexShrink: 0, minWidth: "20px" }}>0{i + 1}</span>
                    <span style={{ fontSize: "14px", color: "#F0F0F0", lineHeight: 1.7 }}>{w}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ background: DARK, padding: "24px 28px" }} />}
          </div>
        ) : null}
        <div style={{ borderBottom: `1px solid ${DARK3}`, paddingBottom: "48px" }} />
      </div>
    </section>
  );
}

/* ══ SECTION 2: 9개 성장 지표 ═════════════════════════════════ */
function GrowthSection({ data }: { data: ManusReportJson["section2_growth_metrics"] }) {
  if (!data) return null;
  const trend = data.growth_trend;
  const stats = data.view_statistics;
  const dist  = data.view_distribution;
  const eng   = data.engagement_metrics;
  const sub   = data.subscriber_efficiency;

  type Status = "up" | "dn" | "fl" | "wn";
  function s(v: number | null | undefined, goodThresh: number, badThresh: number): Status {
    if (v == null) return "fl";
    if (v >= goodThresh) return "up";
    if (v <= badThresh) return "dn";
    return "fl";
  }

  const metrics = [
    { n: "① 구독자 성장률",        st: s(trend?.growth_rate_pct, 5, 0),                    val: trend?.growth_rate_pct != null ? `${trend.growth_rate_pct > 0 ? "+" : ""}${trend.growth_rate_pct}%` : "-", name: "구독자 성장률",        diag: trend?.trend_comment ?? "성장 추세 분석 중" },
    { n: "② 조회율 (조회수/구독자)", st: s(sub?.view_to_subscriber_ratio_pct, 50, 10),       val: sub?.view_to_subscriber_ratio_pct != null ? `${sub.view_to_subscriber_ratio_pct}%` : "-",                 name: "구독자 대비 조회수 비율", diag: sub?.comment ?? "" },
    { n: "③ 좋아요율",             st: s(eng?.avg_like_rate, 1.5, 0.5),                     val: eng?.avg_like_rate != null ? `${eng.avg_like_rate}%` : "-",                                                name: "평균 좋아요율",          diag: "업계 평균 1.2% 기준 대비 분석" },
    { n: "④ 댓글 참여율",          st: s(eng?.avg_comment_rate, 1.0, 0.3),                  val: eng?.avg_comment_rate != null ? `${eng.avg_comment_rate}%` : "-",                                          name: "평균 댓글 참여율",        diag: "질문형 아웃트로로 개선 가능" },
    { n: "⑤ 업로드 일관성",        st: "fl" as Status,                                       val: trend?.monthly_upload_last_30d != null ? `${trend.monthly_upload_last_30d}회/월` : "-",                    name: "최근 30일 업로드 횟수",  diag: "정기 업로드 루틴 확립 권장" },
    { n: "⑥ 최근 모멘텀",          st: s(trend?.growth_rate_pct, 10, 0),                    val: trend?.growth_rate_pct != null ? `${trend.growth_rate_pct > 0 ? "+" : ""}${trend.growth_rate_pct}%` : "-", name: "최근 성장 모멘텀",        diag: "최근 영상 평균 vs 이전 영상 평균 비교" },
    { n: "⑦ 상위 조회수 집중도",    st: s(dist?.viral_ratio_pct, 20, 5),                    val: dist?.viral_ratio_pct != null ? `${dist.viral_ratio_pct}%` : "-",                                          name: "바이럴 비율",             diag: `50만↑ ${dist?.over_500k ?? 0}개 · 5만↓ ${dist?.under_50k ?? 0}개` },
    { n: "⑧ CTR 잠재력",           st: s(dist?.above_average_ratio_pct, 40, 20),            val: dist?.above_average_ratio_pct != null ? `${dist.above_average_ratio_pct}%` : "-",                          name: "평균 이상 조회 비율",     diag: "제목·썸네일 클릭 유도력 지표" },
    { n: "⑨ 장기 지속성",          st: "fl" as Status,                                       val: stats?.average_views != null ? `평균 ${fmt(stats.average_views)}회` : "-",                                 name: "평균 조회수",             diag: `중앙값 ${fmt(stats?.median_views)} · 최고 ${fmt(stats?.max_views?.views)}` },
  ];

  return (
    <section style={{ padding: "72px 0", background: "#fff" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <SecLabel txt="Growth Metrics" section="섹션 2 / 7" />
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>9개 성장 지표</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "40px" }}>각 지표별 현재 수치와 진단을 확인하세요. 수치는 최근 50개 영상 기준입니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", background: "transparent", border: `1px solid ${G200}` }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ background: "#fff", padding: "24px 20px", borderRight: `1px solid ${G200}`, borderBottom: `1px solid ${G200}` }}>
              <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: ".5px", marginBottom: "10px" }}>{m.n}</div>
              <DotBadge status={m.st} />
              <div style={{ fontSize: "26px", fontWeight: 800, fontFamily: MONO, letterSpacing: "-.5px", marginBottom: "6px", color: m.st === "up" ? "#16A34A" : m.st === "dn" ? "#DC2626" : G600 }}>{m.val}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: BLK, marginBottom: "6px", fontFamily: SANS }}>{m.name}</div>
              <div style={{ fontSize: "13px", color: G600, lineHeight: 1.6, fontFamily: SANS }}>{m.diag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 3: 데이터 시그널 ═════════════════════════════════
   중복 방지: 각 그룹을 명확히 분리
   - Content Signal: 제목 패턴·태그·구조
   - Performance Signal: 고성과 패턴
   - Identity Signal: 저성과 패턴·주제별 성과
*/
function DataSignalsSection({ data }: { data: ManusReportJson["section3_data_signals"] }) {
  if (!data) return null;
  const high  = data.high_performance_patterns ?? [];
  const low   = data.low_performance_patterns ?? [];
  const kw    = data.keyword_analysis;
  const title = data.title_pattern_analysis;

  /* Content Signal — 제목/태그/구조 전용, 퍼포먼스 데이터 제외 */
  const group1 = ([
    title?.avg_title_length != null
      ? { n: "01", t: "평균 제목 길이", v: `${title.avg_title_length}자`, dot: "g" as const }
      : null,
    title?.optimal_title_length
      ? { n: "02", t: "최적 제목 길이", v: title.optimal_title_length, dot: "g" as const }
      : null,
    title?.hashtag_usage?.avg_tags != null
      ? { n: "03", t: "평균 해시태그 수", v: `${title.hashtag_usage.avg_tags}개`, dot: "b" as const }
      : null,
    title?.hashtag_usage?.effective_tags
      ? { n: "04", t: "효과적 태그", v: title.hashtag_usage.effective_tags.slice(0, 40), dot: "g" as const }
      : null,
    ...(title?.effective_structures ?? []).slice(0, 6).map((s, i) => ({
      n: String(5 + i).padStart(2, "0"),
      t: "효과적 제목 구조",
      v: s.slice(0, 45),
      dot: "g" as const,
    })),
  ] as ({ n: string; t: string; v: string; dot: "g" | "b" | "r" | "y" } | null)[])
    .filter((x): x is { n: string; t: string; v: string; dot: "g" | "b" | "r" | "y" } => x !== null)
    .slice(0, 10);

  /* Performance Signal — 고성과 패턴 + CTR 키워드 */
  const group2 = [
    ...high.slice(0, 7).map((p, i) => ({
      n: String(i + 1).padStart(2, "0"),
      t: p.pattern ?? "-",
      v: p.avg_views != null ? `평균 ${fmt(p.avg_views)}회` : (p.insight ?? p.description ?? "").slice(0, 35),
      dot: "g" as const,
    })),
    ...(kw?.high_ctr_keywords ?? []).slice(0, 3).map((k, i) => ({
      n: String(high.slice(0, 7).length + i + 1).padStart(2, "0"),
      t: "고 CTR 키워드",
      v: `#${k}`,
      dot: "y" as const,
    })),
  ].slice(0, 10);

  /* Identity Signal — 저성과 패턴 + 주제별 성과 */
  const topicItems = kw?.topic_performance
    ? Object.entries(kw.topic_performance).map(([topic, perf], i) => ({
        n: String(low.length + i + 1).padStart(2, "0"),
        t: `주제: ${topic}`,
        v: perf?.avg_views != null
          ? `평균 ${fmt(perf.avg_views)}회 · ${perf.share_pct ?? 0}%`
          : `${perf?.video_count ?? 0}개 영상`,
        dot: "b" as const,
      }))
    : [];
  const group3 = [
    ...low.slice(0, 7).map((p, i) => ({
      n: String(i + 1).padStart(2, "0"),
      t: p.pattern ?? "-",
      v: (p.insight ?? p.description ?? "").slice(0, 35),
      dot: "r" as const,
    })),
    ...topicItems,
  ].slice(0, 10);

  const total = group1.length + group2.length + group3.length;
  const heading = total >= 30 ? "30개 데이터 시그널" : "데이터 시그널";

  const groups = [
    { id: "ct", titleColor: "#88CCFF", label: "// Content Signal · 콘텐츠",      items: group1 },
    { id: "pf", titleColor: LIME,      label: "// Performance Signal · 퍼포먼스", items: group2 },
    { id: "id", titleColor: "#FFAA55", label: "// Identity Signal · 채널 정체성", items: group3 },
  ];

  return (
    <section style={{ background: DARK, padding: "72px 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <SecLabel txt="Data Signals" section="섹션 3 / 7" dark />
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", color: "#fff", fontFamily: SANS }}>{heading}</h2>
        <p style={{ fontSize: "16px", color: "#BBBBBB", marginBottom: "40px" }}>콘텐츠 · 퍼포먼스 · 채널 정체성 3개 그룹 핵심 시그널</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2px", background: DARK3, border: `1px solid ${DARK3}` }}>
          {groups.map((g) => (
            <div key={g.id} style={{ background: "#1E1E1E", padding: "28px 24px" }}>
              <div style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px", paddingBottom: "14px", borderBottom: `2px solid #2E2E2E`, color: g.titleColor }}>{g.label}</div>
              {g.items.length === 0 && <p style={{ fontSize: "13px", color: "#666" }}>데이터 준비 중</p>}
              {g.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: i < g.items.length - 1 ? `1px solid #252525` : "none" }}>
                  <span style={{ fontFamily: MONO, fontSize: "10px", color: LIME, flexShrink: 0, minWidth: "18px", paddingTop: "3px", fontWeight: 700 }}>{item.n}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#F0F0F0", marginBottom: "3px", fontFamily: SANS }}>{item.t}</div>
                    <div style={{ fontFamily: MONO, fontSize: "12px", color: "#CCCCCC" }}>
                      <SiDot t={item.dot} />{item.v}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 4: 채널 운영 패턴 (최대 7개) ════════════════════ */
function ChannelPatternsSection({ data }: { data: ManusReportJson["section4_channel_patterns"] }) {
  if (!data) return null;
  const upload = data.upload_patterns;
  const thumb  = data.thumbnail_and_title_patterns;
  const aud    = data.audience_behavior;
  const evo    = data.content_evolution;
  const series = data.series_performance;

  const phases = evo
    ? (["phase1","phase2","phase3","phase4","phase5"] as const).map(k => evo[k]).filter(Boolean)
    : [];

  type Pat = { n: string; name: string; char: string; interp: string };
  const patterns: Pat[] = [];

  /* 01: 업로드 주기 패턴 */
  if (upload?.avg_upload_interval_days != null || upload?.recent_30d_uploads != null) {
    patterns.push({
      n: "01", name: "업로드 주기 패턴",
      char: [
        upload.avg_upload_interval_days != null && `평균 ${upload.avg_upload_interval_days}일 간격`,
        upload.recent_30d_uploads != null && `최근 30일 ${upload.recent_30d_uploads}건`,
        upload.upload_consistency,
      ].filter(Boolean).join(" · "),
      interp: upload.optimal_upload_frequency
        ? `최적 업로드 빈도: ${upload.optimal_upload_frequency}`
        : "정기 업로드 루틴 확립 권장",
    });
  }

  /* 02: 업로드 최적 시점 */
  if (upload?.peak_upload_period || upload?.optimal_upload_frequency) {
    patterns.push({
      n: "02", name: "업로드 최적 시점",
      char: [
        upload.peak_upload_period && `피크 시점: ${upload.peak_upload_period}`,
        upload.optimal_upload_frequency && `권장 빈도: ${upload.optimal_upload_frequency}`,
      ].filter(Boolean).join(" · "),
      interp: "조회수 피크 시점에 업로드 집중 시 초기 노출 극대화 가능",
    });
  }

  /* 03: 제목 전략 패턴 */
  if (thumb?.effective_title_formulas?.length) {
    patterns.push({
      n: "03", name: "제목 전략 패턴",
      char: (thumb.effective_title_formulas ?? []).slice(0, 3).join(" · "),
      interp: "성과가 높은 제목 구조. 신규 영상 기획 시 적극 활용 권장",
    });
  }

  /* 04: 썸네일 전략 패턴 */
  if (thumb?.effective_thumbnail_elements?.length) {
    patterns.push({
      n: "04", name: "썸네일 전략 패턴",
      char: (thumb.effective_thumbnail_elements ?? []).slice(0, 3).join(" · "),
      interp: "클릭률 향상에 기여한 썸네일 요소. 일관성 있게 적용 권장",
    });
  }

  /* 05: 바이럴 트리거 패턴 */
  if (aud?.viral_trigger) {
    patterns.push({
      n: "05", name: "바이럴 트리거 패턴",
      char: aud.viral_trigger.slice(0, 80),
      interp: aud.engagement_peak_content ?? "바이럴 요인을 신규 콘텐츠에 의도적으로 배치 권장",
    });
  }

  /* 06: 댓글·참여 유도 패턴 */
  if (aud?.comment_driver) {
    patterns.push({
      n: "06", name: "댓글 · 참여 유도 패턴",
      char: aud.comment_driver.slice(0, 80),
      interp: "참여 유도 질문을 영상 말미에 삽입하면 댓글 참여율 개선 가능",
    });
  }

  /* 07: 콘텐츠 진화 타임라인 */
  if (phases.length > 0) {
    const lastPhase = phases[phases.length - 1];
    patterns.push({
      n: "07", name: "콘텐츠 진화 타임라인",
      char: phases.map((ph, i) => `${i + 1}단계: ${ph?.theme ?? "-"}`).join(" → "),
      interp: lastPhase?.description ?? "채널 콘텐츠 방향이 수렴 중. 현재 포맷 유지 권장",
    });
  }

  /* 08 optional: 시리즈 성과 패턴 (7개 미만이면 추가) */
  if (patterns.length < 7 && series && Object.keys(series).length > 0) {
    const entries = Object.values(series).filter(Boolean);
    patterns.push({
      n: String(patterns.length + 1).padStart(2, "0"),
      name: "시리즈 성과 패턴",
      char: entries.slice(0, 3).map(s => `${s?.name ?? "-"} (평균 ${fmt(s?.avg_views)})`).join(" · "),
      interp: `${entries.length}개 시리즈 운영 중. 핵심 시리즈에 집중 권장`,
    });
  }

  if (patterns.length === 0) return null;

  const heading = `${patterns.length}개 채널 운영 패턴`;

  return (
    <section style={{ padding: "72px 0", background: "#fff" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <SecLabel txt="Channel Patterns" section="섹션 4 / 7" />
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>{heading}</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "40px" }}>데이터에서 발견된 운영 패턴과 그 의미를 분석합니다.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {patterns.map((p) => (
            <div key={p.n} style={{ display: "grid", gridTemplateColumns: "56px 1fr 1fr", border: `1px solid ${G200}`, overflow: "hidden" }}>
              <div style={{ background: BLK, color: LIME, fontFamily: MONO, fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", minWidth: "56px" }}>{p.n}</div>
              <div style={{ padding: "18px 20px", borderRight: `1px solid ${G200}` }}>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "5px", fontFamily: SANS }}>{p.name}</div>
                <div style={{ fontSize: "14px", color: G600, lineHeight: 1.6 }}>{p.char}</div>
              </div>
              <div style={{ padding: "18px 20px", background: "#F0FFF0", borderLeft: "3px solid #AAFF00" }}>
                <div style={{ fontFamily: MONO, fontSize: "10px", color: "#4A7C00", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 700 }}>해석</div>
                <div style={{ fontSize: "14px", color: "#2D5A00", lineHeight: 1.6, fontWeight: 500 }}>{p.interp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 5: Channel DNA ══════════════════════════════════ */
function ChannelDNASection({ data }: { data: ManusReportJson["section5_channel_dna"] }) {
  if (!data) return null;
  return (
    <section style={{ background: "#161616", padding: "72px 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <SecLabel txt="Channel DNA" section="섹션 5 / 7" dark />
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", color: "#fff", fontFamily: SANS }}>채널 DNA 진단</h2>
        <p style={{ fontSize: "16px", color: "#BBBBBB", marginBottom: "40px" }}>채널 고유의 정체성과 성장 구조를 분석합니다.</p>

        {/* core identity */}
        {data.core_identity && (
          <div style={{ border: `1px solid #2E2E2E`, background: DARK2, padding: "32px 36px", marginBottom: "28px", position: "relative" }}>
            <div style={{ position: "absolute", top: "-11px", left: "20px", fontFamily: MONO, fontSize: "11px", background: DARK2, color: LIME, padding: "0 10px", letterSpacing: "1px", fontWeight: 600 }}>CORE IDENTITY</div>
            <div style={{ fontSize: "17px", color: "#F0F0F0", lineHeight: 1.9 }}>{data.core_identity}</div>
            {data.unique_value_proposition && (
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: `1px solid ${DARK3}`, fontFamily: MONO, fontSize: "14px", color: "#CCCCCC" }}>
                <span style={{ color: ORANGE, marginRight: "10px", letterSpacing: "1px" }}>POSITIONING</span>
                &ldquo;{data.unique_value_proposition}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* brand keywords */}
        {(data.brand_keywords ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "28px" }}>
            {(data.brand_keywords ?? []).map((kw, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: "12px", background: "#252525", color: "#CCCCCC", padding: "4px 12px", borderRadius: "2px" }}>{kw}</span>
            ))}
          </div>
        )}

        {/* creator persona + target audience */}
        {(data.creator_persona || data.target_audience) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: DARK3, border: `1px solid ${DARK3}`, marginBottom: "28px" }}>
            {data.creator_persona && (
              <div style={{ background: DARK2, padding: "28px" }}>
                <div style={{ fontFamily: MONO, fontSize: "11px", color: LIME, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px", paddingBottom: "12px", borderBottom: `1px solid ${DARK3}` }}>// CREATOR PERSONA</div>
                {([["캐릭터", data.creator_persona.character], ["스토리텔링", data.creator_persona.storytelling_style], ["관계", data.creator_persona.relationship_with_audience]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "11px", color: "#888", marginBottom: "3px" }}>{k}</div>
                    <div style={{ fontSize: "14px", color: "#F0F0F0", lineHeight: 1.7 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {data.target_audience && (
              <div style={{ background: DARK2, padding: "28px" }}>
                <div style={{ fontFamily: MONO, fontSize: "11px", color: "#FFAA55", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px", paddingBottom: "12px", borderBottom: `1px solid ${DARK3}` }}>// TARGET AUDIENCE</div>
                {([["1차 타겟", data.target_audience.primary], ["2차 타겟", data.target_audience.secondary], ["3차 타겟", data.target_audience.tertiary]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "11px", color: "#888", marginBottom: "3px" }}>{k}</div>
                    <div style={{ fontSize: "14px", color: "#F0F0F0", lineHeight: 1.7 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* content pillars */}
        {(data.content_pillars ?? []).length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily: MONO, fontSize: "11px", color: "#999", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "28px", height: "1px", background: "#999", display: "block" }} />콘텐츠 필러
            </div>
            {(data.content_pillars ?? []).map((pillar, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", background: "#1E1E1E", border: `1px solid ${DARK3}`, marginBottom: "4px" }}>
                <span style={{ fontFamily: MONO, fontSize: "11px", color: "#888", minWidth: "20px" }}>0{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#F0F0F0" }}>{pillar.pillar}</span>
                  {pillar.description && <span style={{ fontSize: "13px", color: "#AAAAAA", marginLeft: "8px" }}>{pillar.description.slice(0, 50)}</span>}
                </div>
                {pillar.contribution_pct != null && (
                  <div style={{ flexShrink: 0, minWidth: "100px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "12px", color: LIME, textAlign: "right", marginBottom: "4px" }}>{pillar.contribution_pct}%</div>
                    <DkBar pct={pillar.contribution_pct} color={LIME} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* code block */}
        <div style={{ background: "#0F0F0F", border: `1px solid ${DARK3}`, borderLeft: `3px solid ${LIME}`, padding: "24px 28px", fontFamily: MONO, fontSize: "13px", lineHeight: 2 }}>
          {([
            ["c", "// tubewatch — channel dna analysis v2.1"],
            ["k", "channel",         "s", `"${data.core_identity?.slice(0, 40) ?? "채널 분석 완료"}"`],
            ["k", "pillars",         "v", String(data.content_pillars?.length ?? 0),   "c", "// 콘텐츠 필러"],
            ["k", "keywords",        "v", String(data.brand_keywords?.length ?? 0),    "c", "// 브랜드 키워드"],
            ["k", "uvp",             "s", `"${(data.unique_value_proposition ?? "").slice(0, 50)}"`],
            ["k", "differentiation", "s", `"${(data.competitive_differentiation ?? "").slice(0, 40)}"`],
          ] as string[][]).map((row, i) => (
            <div key={i} style={{ display: "flex", gap: "16px" }}>
              <span style={{ color: "#555", minWidth: "20px", textAlign: "right" }}>{i + 1}</span>
              <span>
                {row[0] === "c" && <span style={{ color: "#888" }}>{row[1]}</span>}
                {row[0] === "k" && (
                  <>
                    <span style={{ color: LIME }}>{row[1]}</span>
                    {"    "}
                    {row[2] === "s" && <span style={{ color: "#FFAA55" }}>{row[3]}</span>}
                    {row[2] === "v" && <span style={{ color: "#88AAFF" }}>{row[3]}</span>}
                    {row[4] === "c" && <span style={{ color: "#888" }}>{"  "}{row[5]}</span>}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 6: 완성형 콘텐츠 기획안 (상위 2개) ══════════════ */
function ContentPlansSection({ data }: { data: ManusReportJson["section6_content_plans"] }) {
  if (!data) return null;
  /* 우선순위 상위 2개만 표시 */
  const opps = [...(data.immediate_opportunities ?? [])]
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
    .slice(0, 2);
  const series    = data.series_concepts ?? [];
  const shortForm = data.short_form_strategy;

  return (
    <section style={{ padding: "72px 0", background: "#fff" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <SecLabel txt="Content Plan" section="섹션 6 / 7" />
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>완성형 콘텐츠 기획안</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "40px" }}>AI 분석 기반 · 채널 데이터 흐름에서 도출한 완성형 기획문서입니다.</p>

        {opps.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: opps.length >= 2 ? "1fr 1fr" : "1fr", gap: "24px", marginBottom: "32px" }}>
            {opps.map((opp, i) => (
              <div key={i} style={{ border: `1px solid ${G200}`, overflow: "hidden" }}>
                <div style={{ background: BLK, padding: "20px 24px" }}>
                  <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1px" }}>PLAN #{String(opp.priority ?? i + 1).padStart(2, "0")} · {opp.format ?? "기획안"}</div>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: "#fff", lineHeight: 1.35, marginTop: "8px" }}>{opp.title ?? "-"}</div>
                </div>
                <div style={{ padding: "24px" }}>
                  {opp.concept && (
                    <>
                      <div style={{ fontFamily: MONO, fontSize: "10px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>기획 의도</div>
                      <div style={{ fontSize: "15px", color: G600, lineHeight: 1.75, marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${G200}` }}>{opp.concept}</div>
                    </>
                  )}
                  {opp.title_formula && (
                    <>
                      <div style={{ fontFamily: MONO, fontSize: "10px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>제목 공식</div>
                      <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${G200}` }}>
                        {(["A", "B"] as const).map((l, j) => (
                          <div key={j} style={{ display: "flex", gap: "10px", fontSize: "14px", marginBottom: "8px", lineHeight: 1.6 }}>
                            <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, background: BLK, color: LIME, padding: "2px 7px", flexShrink: 0, height: "fit-content" }}>{l}</span>
                            <span>{j === 0 ? opp.title_formula : (opp.rationale ?? "").slice(0, 50)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {opp.expected_views && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ fontFamily: MONO, fontSize: "11px", background: G100, color: G600, padding: "3px 10px", borderRadius: "2px" }}>예상 조회수: {opp.expected_views}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {series.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "28px", height: "1px", background: G400, display: "block" }} />시리즈 기획
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px" }}>
              {series.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${G200}`, padding: "20px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>{s.series_name ?? "-"}</div>
                  {s.concept && <div style={{ fontSize: "14px", color: G600, marginBottom: "12px", lineHeight: 1.6 }}>{s.concept}</div>}
                  <div style={{ display: "flex", gap: "12px", fontFamily: MONO, fontSize: "12px", color: G600 }}>
                    {s.episode_count != null && <span>에피소드 {s.episode_count}개</span>}
                    {s.target_views_per_episode && <span style={{ color: ORANGE }}>목표 {s.target_views_per_episode}</span>}
                    {s.content_calendar && <span>{s.content_calendar}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shortForm && (
          <div style={{ border: `1px solid ${G200}`, padding: "20px 24px" }}>
            <div style={{ fontFamily: MONO, fontSize: "10px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>숏폼 전략</div>
            <div style={{ fontSize: "14px", color: G600, lineHeight: 1.7 }}>
              {shortForm.posting_frequency && <span><strong>빈도:</strong> {shortForm.posting_frequency} · </span>}
              {shortForm.hashtag_strategy && <span><strong>해시태그:</strong> {shortForm.hashtag_strategy}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ SECTION 7: 30일 실행 계획 (4탭) ════════════════════════ */
function ActionPlanSection({ data }: { data: ManusReportJson["section7_action_plan"] }) {
  const [activeTab, setActiveTab] = useState<"immediate" | "short" | "long" | "kpi">("immediate");
  if (!data) return null;
  const kpi = data.kpi_targets;

  type Task = { task?: string; detail?: string; priority?: string; expected_impact?: string; kpi?: string; timeline?: string };

  const tabs = [
    { id: "immediate" as const, label: "즉시 실행", sub: data.immediate_actions?.timeframe ?? "1주 이내", color: "#DC2626" },
    { id: "short"     as const, label: "단기 계획", sub: data.short_term_plan?.timeframe ?? "2~4주",    color: "#D97706" },
    { id: "long"      as const, label: "장기 계획", sub: data.long_term_plan?.timeframe ?? "1~3개월",   color: G600 },
    { id: "kpi"       as const, label: "KPI 목표",  sub: "성과 지표 달성 예측",                          color: "#16A34A" },
  ];

  const taskMap: Record<"immediate" | "short" | "long", Task[]> = {
    immediate: data.immediate_actions?.tasks ?? [],
    short:     data.short_term_plan?.tasks ?? [],
    long:      data.long_term_plan?.tasks ?? [],
  };

  return (
    <section style={{ padding: "72px 0", background: "#fff" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <SecLabel txt="Action Plan" section="섹션 7 / 7" />
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>30일 실행 계획</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "32px" }}>우선순위별 액션 아이템과 목표 수치를 확인하세요.</p>

        {/* tabs */}
        <div style={{ display: "flex", borderBottom: `2px solid ${G200}`, marginBottom: "32px", gap: "0" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 24px",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${BLK}` : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? BLK : G400,
                marginBottom: "-2px",
                transition: "all .15s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              <span style={{ display: "block", fontFamily: MONO, fontSize: "10px", color: activeTab === tab.id ? G600 : G400, fontWeight: 400, marginTop: "2px" }}>{tab.sub}</span>
            </button>
          ))}
        </div>

        {/* task lists */}
        {(activeTab === "immediate" || activeTab === "short" || activeTab === "long") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {taskMap[activeTab].length === 0 && (
              <p style={{ fontSize: "14px", color: G400, padding: "20px 0" }}>해당 구간 액션 아이템이 없습니다.</p>
            )}
            {taskMap[activeTab].map((t, i) => {
              const up = (t.priority ?? "").toUpperCase();
              const borderColor = up === "긴급" || up === "URGENT" ? "#DC2626" : up === "높음" || up === "HIGH" ? "#D97706" : "#1D4ED8";
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "18px 22px", border: `1px solid ${G200}`, borderLeft: `3px solid ${borderColor}` }}>
                  <PriBadge p={t.priority} />
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "5px", fontFamily: SANS }}>{t.task ?? "-"}</div>
                    {t.detail && <div style={{ fontSize: "14px", color: G600, lineHeight: 1.7 }}>{t.detail}</div>}
                    {t.expected_impact && <div style={{ fontSize: "13px", color: "#D97706", marginTop: "4px" }}>기대 효과: {t.expected_impact}</div>}
                    {t.kpi && <div style={{ fontSize: "13px", color: ORANGE, marginTop: "4px", fontFamily: MONO }}>KPI: {t.kpi}</div>}
                    {t.timeline && <div style={{ fontSize: "12px", color: G400, marginTop: "4px", fontFamily: MONO }}>타임라인: {t.timeline}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* KPI tab */}
        {activeTab === "kpi" && kpi && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: G200, border: `1px solid ${G200}`, marginBottom: "32px" }}>
              {(["1_month","3_months","6_months","12_months"] as const).map((key) => {
                const row = kpi[key];
                if (!row) return <div key={key} style={{ background: "#fff", padding: "22px 18px" }} />;
                const label = { "1_month": "1개월 목표", "3_months": "3개월 목표", "6_months": "6개월 목표", "12_months": "12개월 목표" }[key];
                return (
                  <div key={key} style={{ background: "#fff", padding: "22px 18px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: ".5px", marginBottom: "12px" }}>{label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: MONO, color: BLK, marginBottom: "4px" }}>{fmt(row.subscribers)}</div>
                    <div style={{ fontSize: "12px", color: G600 }}>구독자 목표</div>
                    {row.upload_count != null && <div style={{ fontSize: "12px", color: G400, marginTop: "6px", fontFamily: MONO }}>업로드 {row.upload_count}회</div>}
                    {row.avg_views_per_video != null && <div style={{ fontSize: "12px", color: G400, fontFamily: MONO }}>평균 조회 {fmt(row.avg_views_per_video)}</div>}
                  </div>
                );
              })}
            </div>

            {/* progress bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(["1_month","3_months","6_months","12_months"] as const).map((key) => {
                const row = kpi[key]; if (!row) return null;
                const pct = { "1_month": 25, "3_months": 50, "6_months": 75, "12_months": 100 }[key];
                const label = { "1_month": "1개월", "3_months": "3개월", "6_months": "6개월", "12_months": "12개월" }[key];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "12px", color: G600, minWidth: "70px", fontFamily: MONO }}>{label}</div>
                    <div style={{ flex: 1, height: "8px", background: G200, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#16A34A", borderRadius: "4px" }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, minWidth: "160px", textAlign: "right" }}>
                      구독자 {fmt(row.subscribers)} · 업로드 {row.upload_count != null ? `${row.upload_count}회` : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* risk */}
        {activeTab !== "kpi" && (data.risk_management ?? []).length > 0 && (
          <div style={{ border: `1px solid #F59E0B`, background: "#FFFBEB", padding: "18px 22px", display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "24px" }}>
            <div style={{ fontSize: "18px", flexShrink: 0 }}>⚠</div>
            <div style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.75 }}>
              <strong>리스크 관리: </strong>
              {(data.risk_management ?? []).slice(0, 2).map(r => r.risk).filter(Boolean).join(" · ")}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ 다음달 리포트 예고 ════════════════════════════════════════ */
function NextMonthSection({ channelName, date }: { channelName: string; date: string }) {
  const previews = [
    { icon: "📊", title: "심층 경쟁 채널 비교 분석", desc: "유사 채널 10개 대비 포지셔닝 및 격차 진단" },
    { icon: "🎯", title: "알고리즘 최적화 액션 리포트", desc: "쇼츠·롱폼 비율, 업로드 타이밍 A/B 전략 제안" },
    { icon: "📈", title: "월간 성장 추이 비교", desc: "이번 달 vs 지난 달 핵심 지표 변화량 추적" },
    { icon: "💡", title: "트렌드 키워드 기회 분석", desc: "다음 달 시장 트렌드와 채널 적합도 교차 분석" },
  ];

  return (
    <section style={{ background: "#111111", padding: "72px 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
        <div style={{ fontFamily: MONO, fontSize: "11px", color: "#555", letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ display: "block", width: "28px", height: "1px", background: "#555" }} />
          Next Month Preview
        </div>
        <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", color: "#fff", fontFamily: SANS }}>다음달 리포트 예고</h2>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "40px" }}>{channelName} 채널의 다음 분석 리포트에 포함될 항목을 미리 확인하세요.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "2px", background: "#1E1E1E", border: `1px solid #1E1E1E` }}>
          {previews.map((p, i) => (
            <div key={i} style={{ background: "#161616", padding: "28px 32px", borderBottom: i < 2 ? `1px solid #1E1E1E` : "none" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>{p.icon}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#EEEEEE", marginBottom: "8px", fontFamily: SANS }}>{p.title}</div>
              <div style={{ fontSize: "14px", color: "#888", lineHeight: 1.7 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "32px", padding: "24px 28px", border: `1px solid #2A2A2A`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "12px", color: "#555", marginBottom: "4px" }}>다음 리포트 발행 예정</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#CCCCCC" }}>매월 자동 생성 · TubeWatch Pro</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: "11px", color: "#444", textAlign: "right" }}>
            현재 리포트: {date}<br />
            <span style={{ color: LIME }}>Pro 플랜 구독 중</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══ MAIN ════════════════════════════════════════════════════ */
export default function ReportView({ report, generatedAt }: Props) {
  const date = new Date(generatedAt)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit" })
    .replace(". ", ".").replace(".", "년 ").replace(".", "월");

  const channelName = report.channel_info?.channel_name ?? "채널";

  function handleDownload() {
    window.print();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box}
        .report-root{font-family:'Inter','Noto Sans KR',sans-serif;background:#fff;color:#0D0D0D;line-height:1.7;-webkit-font-smoothing:antialiased}
        @media print{
          .report-nav{display:none!important}
          section{page-break-inside:avoid}
        }
      `}</style>

      <div className="report-root">
        {/* NAV */}
        <nav className="report-nav" style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${G200}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: "58px" }}>
          <a href="#" style={{ fontWeight: 900, fontSize: "19px", letterSpacing: "-.5px", color: BLK, textDecoration: "none" }}>
            TubeWatch<span style={{ color: LIME }}>™</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span style={{ fontFamily: MONO, fontSize: "13px", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>Monthly Report</span>
            <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 300 }}>{date} · Pro</span>
            <button
              onClick={handleDownload}
              style={{
                fontFamily: MONO, fontSize: "12px", fontWeight: 700, letterSpacing: ".5px",
                padding: "8px 18px", border: `1px solid ${BLK}`, borderRadius: "3px",
                background: BLK, color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "opacity .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = ".7")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              ↓ 리포트 다운로드
            </button>
          </div>
        </nav>

        <HeroSection        info={report.channel_info}            scorecard={report.section1_scorecard}  date={date} />
        <GrowthSection      data={report.section2_growth_metrics} />
        <hr style={{ border: "none", borderTop: `1px solid ${G200}`, margin: 0 }} />
        <DataSignalsSection data={report.section3_data_signals}   />
        <ChannelPatternsSection data={report.section4_channel_patterns} />
        <hr style={{ border: "none", borderTop: `1px solid ${G200}`, margin: 0 }} />
        <ChannelDNASection  data={report.section5_channel_dna}    />
        <ContentPlansSection data={report.section6_content_plans} />
        <hr style={{ border: "none", borderTop: `1px solid ${G200}`, margin: 0 }} />
        <ActionPlanSection  data={report.section7_action_plan}    />
        <NextMonthSection   channelName={channelName}              date={date} />

        {/* FOOTER */}
        <footer style={{ background: "#0A0A0A", padding: "32px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: "16px", color: "#fff" }}>TubeWatch<span style={{ color: LIME }}>™</span></div>
          <div style={{ fontFamily: MONO, fontSize: "11px", color: "#888", textAlign: "right", lineHeight: 1.8 }}>
            분석 기준일: {report.channel_info?.analysis_date ?? date} · 튜브워치 엔진 v2.1<br />
            © 2026 TubeWatch. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
