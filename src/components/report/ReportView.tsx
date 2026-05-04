"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import type { ManusReportJson } from "@/lib/manus/types";

type Props = { report: ManusReportJson; generatedAt: string; reportId?: string; isChannelReport?: boolean };

const LIME   = "#AAFF00";
const ORANGE = "#FF7A00";
const ORBG   = "rgba(255,122,0,.12)";
const BLK    = "#0D0D0D";
const DARK   = "#1A1A1A";
const DARK2  = "#1C1C1C";
const DARK3  = "#2A2A2A";
const G200   = "#E8E8E8";
const G400   = "#999999";
const G600   = "#555555";
const MONO   = "'JetBrains Mono','Fira Code',monospace";
const SANS   = "'Inter','Noto Sans KR',sans-serif";

function firstSentence(s: string): string {
  const idx = s.indexOf(".");
  return idx !== -1 ? s.slice(0, idx + 1) : s;
}

function trunc(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.lastIndexOf(" ", n);
  return (cut > n * 0.6 ? s.slice(0, cut) : s.slice(0, n)) + "…";
}

function fmt(n: number | undefined | null): string {
  if (n == null) return "-";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString("ko-KR");
}

function fmtDuration(founded?: string): string {
  if (!founded) return "-";
  const match = founded.match(/(\d{4})[.\-/]?(\d{2})?/);
  if (!match) return founded;
  const year = parseInt(match[1]);
  const month = parseInt(match[2] ?? "1");
  const now = new Date();
  const diff = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (diff < 12) return `약 ${diff}개월`;
  return `약 ${(diff / 12).toFixed(1)}년`;
}

function SecLabel({ txt, section, dark }: { txt: string; section?: string; dark?: boolean }) {
  const c = dark ? "#999" : G400;
  return (
    <div style={{ fontFamily: MONO, fontSize: "12px", color: c, letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
      <span style={{ display: "block", width: "28px", height: "1px", background: c }} />
      {txt}{section ? ` · ${section}` : ""}
    </div>
  );
}

type Arrow = { symbol: "▲" | "▼" | "→"; text: string; color: string };
const annUp   = (t: string): Arrow => ({ symbol: "▲", text: t, color: "#16A34A" });
const annDown = (t: string): Arrow => ({ symbol: "▼", text: t, color: "#DC2626" });
const annFlat = (t: string): Arrow => ({ symbol: "→", text: t, color: G400 });

function Ann({ a }: { a: Arrow }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: "12px", color: a.color, marginTop: "5px", display: "flex", gap: "4px" }}>
      <span style={{ fontWeight: 700 }}>{a.symbol}</span><span>{a.text}</span>
    </div>
  );
}

function DotBadge({ status }: { status: "up" | "dn" | "fl" | "wn" }) {
  const m = { up: { bg: "#DCFCE7", c: "#16A34A", t: "▲ 양호" }, dn: { bg: "#FEE2E2", c: "#DC2626", t: "▼ 주의" }, fl: { bg: "#F3F4F6", c: "#6B7280", t: "→ 보통" }, wn: { bg: "#FEF3C7", c: "#D97706", t: "⚠ 둔화" } }[status];
  return <span style={{ display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", background: m.bg, color: m.c, marginBottom: "8px" }}>{m.t}</span>;
}

function SiDot({ t }: { t: "g" | "r" | "y" | "b" }) {
  return <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: { g: LIME, r: "#FF6B6B", y: "#FFA500", b: "#88CCFF" }[t], marginRight: "5px", verticalAlign: "middle", flexShrink: 0 }} />;
}

function PriBadge({ p }: { p?: string }) {
  const up = (p ?? "").toUpperCase();
  if (up === "긴급" || up === "URGENT") return <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: "#FEE2E2", color: "#DC2626", letterSpacing: ".5px", whiteSpace: "nowrap" }}>URGENT</span>;
  if (up === "높음" || up === "HIGH") return <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: "#FEF3C7", color: "#B45309", letterSpacing: ".5px", whiteSpace: "nowrap" }}>HIGH</span>;
  if (!p) return null;
  return <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: "#EFF6FF", color: "#1D4ED8", letterSpacing: ".5px", whiteSpace: "nowrap" }}>NORMAL</span>;
}

function DkBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div style={{ height: "6px", width: "100%", background: "#333", borderRadius: "3px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color ?? LIME, borderRadius: "3px" }} />
    </div>
  );
}

/* 현재 → 목표 진행 바 */
function ProgressBar({ label, current, target, unit = "", color = "#16A34A" }: { label: string; current: number; target: number; unit?: string; color?: string }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
      <div style={{ fontSize: "13px", color: G600, minWidth: "80px", fontFamily: MONO, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, position: "relative" }}>
        <div style={{ height: "8px", background: G200, borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px" }} />
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: "12px", color: G400, whiteSpace: "nowrap", minWidth: "160px", textAlign: "right" }}>
        {fmt(current)}{unit} → <span style={{ color: "#16A34A", fontWeight: 700 }}>{fmt(target)}{unit}+</span>
      </div>
    </div>
  );
}

function gradeToSub(score: number): string {
  if (score >= 85) return "최상위 성장 채널";
  if (score >= 70) return "안정 성장 단계";
  if (score >= 55) return "성장 중기 단계";
  if (score >= 40) return "성장 초기 단계";
  return "도약 준비 단계";
}

function ActionCheckbox() {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", border: `2.5px solid ${ORANGE}`, borderRadius: "3px", background: ORANGE, flexShrink: 0 }}
    >
      <Check size={12} color="#fff" strokeWidth={3} />
    </span>
  );
}

function nextTargetScore(score: number): number | null {
  if (score < 40) return 40;
  if (score < 55) return 55;
  if (score < 70) return 70;
  if (score < 85) return 85;
  if (score < 100) return 100;
  return null;
}

/* ══ SECTION 1: HERO ══════════════════════════════════════════ */
function HeroSection({ info, scorecard, growth, signals, date }: {
  info: ManusReportJson["channel_info"];
  scorecard: ManusReportJson["section1_scorecard"];
  growth: ManusReportJson["section2_growth_metrics"];
  signals: ManusReportJson["section3_data_signals"];
  date: string;
}) {
  const score = scorecard?.overall_score ?? 0;
  const grade = scorecard?.grade ?? "-";
  const name  = info?.channel_name ?? "채널명";
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    if (score === 0) return;
    const duration = 1400;
    const startTime = performance.now();
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);
  const desc  = info?.channel_description ?? "";
  const meta  = [
    info?.founded && `채널 개설 ${info.founded}`,
    info?.total_videos != null && `영상 ${fmt(info.total_videos)}개`,
    info?.subscribers != null && `구독자 ${fmt(info.subscribers)}명`,
    info?.analysis_date && `분석 기준일 ${info.analysis_date}`,
  ].filter(Boolean).join(" · ");

  const gRate  = growth?.growth_trend?.growth_rate_pct;
  const trend  = growth?.growth_trend;
  const stats  = growth?.view_statistics;
  const eng    = growth?.engagement_metrics;
  const titleLen = signals?.title_pattern_analysis?.avg_title_length;

  const viewsAnn: Arrow = gRate != null
    ? gRate > 0 ? annUp(`전월 대비 +${gRate}%`) : gRate < 0 ? annDown(`전월 대비 ${gRate}%`) : annFlat("전월 대비 변화 없음")
    : annFlat("누적 조회");

  const subEff = growth?.subscriber_efficiency;
  const subAnn: Arrow = subEff?.view_to_subscriber_ratio_pct != null
    ? subEff.view_to_subscriber_ratio_pct >= 50 ? annUp(`구독자 대비 조회율 ${subEff.view_to_subscriber_ratio_pct}%`) : annDown(`구독자 대비 조회율 ${subEff.view_to_subscriber_ratio_pct}%`)
    : subEff?.comment ? annFlat(subEff.comment.slice(0, 28)) : annFlat("현재 구독자");

  /* 소형 KPI 6개 — 원본 HTML 기준: 실 채널 지표 */
  const avgViews = stats?.average_views;
  const medViews = stats?.median_views;
  const likeRate = eng?.avg_like_rate;
  const cmtRate  = eng?.avg_comment_rate;
  const uploads  = trend?.monthly_upload_last_30d;
  const founded  = info?.founded;

  const avgViewsAnn: Arrow = avgViews != null && medViews != null && medViews > 0
    ? avgViews > medViews ? annUp(`중앙값 대비 ${(avgViews / medViews).toFixed(1)}배`) : annFlat(`중앙값 ${fmt(medViews)}`)
    : annFlat("최근 50개 영상 기준");

  const uploadAnn: Arrow = uploads == null ? annFlat("-") : uploads === 0 ? annDown("최근 30일 0건") : uploads >= 4 ? annUp(`월 ${uploads}건 업로드`) : annFlat(`월 ${uploads}건 업로드`);
  const likeAnn: Arrow   = likeRate == null ? annFlat("-") : likeRate >= 1.2 ? annUp("업계 평균 1.2% 상회") : annDown("업계 평균 1.2% 미달");
  const cmtAnn: Arrow    = cmtRate == null ? annFlat("-") : cmtRate >= 1.0 ? annUp("상호작용 우수") : cmtRate >= 0.3 ? annFlat("상호작용 개선 여지") : annDown("상호작용 개선 필요");
  const titleAnn: Arrow  = titleLen == null ? annFlat("-") : titleLen >= 15 && titleLen <= 28 ? annUp("정보 전달 최적 범위") : titleLen < 15 ? annFlat("간결형 제목") : annDown("제목 단축 권장");
  const foundedAnn: Arrow = founded ? annFlat(`운영 기간 ${fmtDuration(founded)}`) : annFlat("-");

  const smallKpi = [
    { v: avgViews != null ? fmt(avgViews) : "-",  l: "평균 조회수",       s: "(최근 50개)", ann: avgViewsAnn },
    { v: uploads  != null ? `${uploads}회` : "-", l: "월 평균 업로드 수", s: "최근 30일",   ann: uploadAnn },
    { v: likeRate != null ? `${likeRate}%` : "-", l: "평균 좋아요율",     s: "",            ann: likeAnn },
    { v: cmtRate  != null ? `${cmtRate}%`  : "-", l: "평균 댓글 참여율",  s: "",            ann: cmtAnn },
    { v: titleLen != null ? `${titleLen}자` : "-", l: "평균 제목 길이",   s: "",            ann: titleAnn },
    { v: founded ?? "-",                           l: "채널 개설일",       s: "",            ann: foundedAnn },
  ];

  return (
    <section style={{ background: BLK, paddingBottom: 0 }}>
      <div className="rpt-wrap rpt-hero-pad">
        <div style={{ fontFamily: MONO, fontSize: "16px", fontWeight: 700, color: "#DDDDDD", letterSpacing: "3px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "40px", padding: "14px 0", borderBottom: `1px solid ${DARK3}` }}>
          <span style={{ display: "block", width: "40px", height: "1px", background: "#555" }} />
          Channel Report · {date} · 섹션 1 / 7
          <span style={{ display: "block", width: "40px", height: "1px", background: "#555" }} />
        </div>

        <div className="g-hero-head">
          <div>
            <h1 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "8px", fontFamily: SANS }}>
              {name}<br />
              <em style={{ fontStyle: "normal", color: LIME, fontSize: "clamp(13px,1.8vw,20px)", fontWeight: 400, letterSpacing: "0px", lineHeight: 1.5, display: "block", marginTop: "4px", wordBreak: "keep-all", overflowWrap: "break-word" }}>{desc.length > 100 ? desc.slice(0, 100) + "…" : desc || "채널 분석 리포트"}</em>
            </h1>
            {meta && <p style={{ fontSize: "14px", color: "#AAAAAA", fontFamily: MONO, marginTop: "8px" }}>{meta}</p>}
            <p style={{ fontSize: "13px", color: ORANGE, fontFamily: MONO, marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ActionCheckbox />
              리포트에서 반드시 실행하거나 점검해야 할 항목
            </p>
          </div>
          <div className="score-box-float" style={{ border: `2px solid ${ORANGE}`, background: ORBG, padding: "28px 36px", textAlign: "center", minWidth: "160px", flexShrink: 0 }}>
            <div style={{ fontSize: "60px", fontWeight: 900, color: LIME, lineHeight: 1, fontFamily: MONO }}>{displayScore}</div>
            <div style={{ fontSize: "12px", color: "#AAAAAA", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "6px", fontFamily: MONO }}>Channel Score</div>
            <div style={{ marginTop: "12px", display: "inline-block", fontSize: "22px", fontWeight: 900, background: ORANGE, color: "#fff", padding: "7px 22px", borderRadius: "4px", fontFamily: MONO, letterSpacing: "2px" }}>{grade}</div>
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#888", fontFamily: MONO }}>{gradeToSub(score)}</div>
            {nextTargetScore(score) != null && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#AAAAAA", fontFamily: MONO }}>
                다음 목표 <span style={{ color: LIME, fontWeight: 700 }}>{nextTargetScore(score)}점</span>
              </div>
            )}
          </div>
        </div>

        {scorecard?.top_action_trigger && (
          <div style={{ background: "#1A0A00", border: `1px solid ${ORANGE}`, padding: "14px 20px", marginTop: "28px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ flexShrink: 0, marginTop: "2px" }}><ActionCheckbox /></span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: "11px", color: ORANGE, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>지금 가장 먼저 해야 할 것</div>
              <div style={{ fontSize: "15px", color: "#F0F0F0", lineHeight: 1.6 }}>{scorecard.top_action_trigger}</div>
            </div>
          </div>
        )}

        {/* 대형 KPI 2개 */}
        <div className="g-kpi-lg" style={{ background: DARK3, border: `1px solid ${DARK3}`, marginBottom: "1px" }}>
          {[
            { v: fmt(info?.total_views), l: "총 조회수 (누적)", ann: viewsAnn },
            { v: fmt(info?.subscribers), l: "구독자 수", ann: subAnn },
          ].map((k, i) => (
            <div key={i} style={{ background: DARK, padding: "24px 28px" }}>
              <div style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: i === 0 ? LIME : "#fff", fontFamily: MONO, letterSpacing: "-1px", lineHeight: 1, marginBottom: "8px" }}>{k.v}</div>
              <div style={{ fontSize: "14px", color: "#AAAAAA", fontFamily: MONO }}>{k.l}</div>
              <Ann a={k.ann} />
            </div>
          ))}
        </div>

        {/* 소형 KPI 6개 — 실 채널 지표 */}
        <div className="g-kpi-sm" style={{ background: DARK3, border: `1px solid ${DARK3}`, borderTop: "none", marginBottom: "40px" }}>
          {smallKpi.map((k, i) => (
            <div key={i} style={{ background: "#1E1E1E", padding: "16px 14px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", fontFamily: MONO, letterSpacing: "-.5px", lineHeight: 1.1, marginBottom: "6px" }}>{k.v}</div>
              <div style={{ fontSize: "12px", color: "#AAAAAA", fontFamily: MONO, letterSpacing: ".3px", lineHeight: 1.4 }}>{k.l}</div>
              {k.s && <div style={{ fontSize: "11px", color: "#888", fontFamily: MONO }}>{k.s}</div>}
              <Ann a={k.ann} />
            </div>
          ))}
        </div>

        {/* 강점 / 약점 */}
        {(scorecard?.strengths?.length || scorecard?.weaknesses?.length) ? (
          <div className="g-sw" style={{ background: DARK3, border: `1px solid ${DARK3}` }}>
            {scorecard.strengths?.length ? (
              <div style={{ background: DARK, padding: "24px 28px" }}>
                <div style={{ fontFamily: MONO, fontSize: "12px", color: LIME, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "10px", borderBottom: `2px solid ${DARK3}` }}>// STRENGTH · 강점</div>
                {scorecard.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid #222` }}>
                    <span style={{ fontFamily: MONO, fontSize: "12px", color: "#888", flexShrink: 0, minWidth: "20px" }}>0{i + 1}</span>
                    <span style={{ fontSize: "15px", color: "#F0F0F0", lineHeight: 1.7 }}>{s}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ background: DARK, padding: "24px 28px" }} />}
            {scorecard.weaknesses?.length ? (
              <div style={{ background: DARK, padding: "24px 28px" }}>
                <div style={{ fontFamily: MONO, fontSize: "12px", color: "#FF6B6B", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "10px", borderBottom: `2px solid ${DARK3}` }}>// WEAKNESS · 약점</div>
                {scorecard.weaknesses.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid #222` }}>
                    <span style={{ fontFamily: MONO, fontSize: "12px", color: "#888", flexShrink: 0, minWidth: "20px" }}>0{i + 1}</span>
                    <span style={{ fontSize: "15px", color: "#F0F0F0", lineHeight: 1.7 }}>{w}</span>
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
function GrowthSection({ data, scorecard }: { data: ManusReportJson["section2_growth_metrics"]; scorecard: ManusReportJson["section1_scorecard"] }) {
  if (!data) return null;
  const trend = data.growth_trend;
  const stats = data.view_statistics;
  const dist  = data.view_distribution;
  const eng   = data.engagement_metrics;
  const sub   = data.subscriber_efficiency;
  const sb    = scorecard?.score_breakdown ?? {};

  type St = "up" | "dn" | "fl" | "wn";
  const s = (v: number | null | undefined, g: number, b: number): St => v == null ? "fl" : v >= g ? "up" : v <= b ? "dn" : "fl";

  const metrics = [
    { n: "① 구독자 성장률",         st: s(trend?.growth_rate_pct, 5, 0),               val: trend?.growth_rate_pct != null ? `${trend.growth_rate_pct > 0 ? "+" : ""}${trend.growth_rate_pct}%` : "-",              name: "구독자 성장률",          ann: trend?.growth_rate_pct != null ? (trend.growth_rate_pct > 0 ? annUp(`전월 대비 +${trend.growth_rate_pct}%`) : annDown(`전월 대비 ${trend.growth_rate_pct}%`)) : annFlat("성장 추세 분석 중"), comment: sb.growth_velocity?.comment },
    { n: "② 조회율 (조회수/구독자)", st: s(sub?.view_to_subscriber_ratio_pct, 50, 10),  val: sub?.view_to_subscriber_ratio_pct != null ? `${sub.view_to_subscriber_ratio_pct}%` : "-",                                 name: "구독자 대비 조회수 비율", ann: sub?.view_to_subscriber_ratio_pct != null ? (sub.view_to_subscriber_ratio_pct >= 50 ? annUp(`구독자 대비 조회율 ${sub.view_to_subscriber_ratio_pct}%`) : annDown(`구독자 대비 조회율 ${sub.view_to_subscriber_ratio_pct}%`)) : annFlat(sub?.comment ?? "-"), comment: sub?.comment ?? sb.niche_authority?.comment },
    { n: "③ 좋아요율",              st: s(eng?.avg_like_rate, 1.5, 0.5),               val: eng?.avg_like_rate != null ? `${eng.avg_like_rate}%` : "-",                                                               name: "평균 좋아요율",           ann: eng?.avg_like_rate != null ? (eng.avg_like_rate >= 1.2 ? annUp("업계 평균 1.2% 상회") : annDown("업계 평균 1.2% 미달")) : annFlat("-"), comment: sb.engagement_quality?.comment },
    { n: "④ 댓글 참여율",           st: s(eng?.avg_comment_rate, 1.0, 0.3),            val: eng?.avg_comment_rate != null ? `${eng.avg_comment_rate}%` : "-",                                                         name: "평균 댓글 참여율",         ann: eng?.avg_comment_rate != null ? (eng.avg_comment_rate >= 1.0 ? annUp("상호작용 우수") : eng.avg_comment_rate >= 0.3 ? annFlat("상호작용 개선 여지") : annDown("상호작용 개선 필요")) : annFlat("-"), comment: sb.engagement_quality?.comment },
    { n: "⑤ 업로드 일관성",         st: "fl" as St,                                     val: trend?.monthly_upload_last_30d != null ? `${trend.monthly_upload_last_30d}회/월` : "-",                                   name: "최근 30일 업로드 횟수",   ann: trend?.monthly_upload_last_30d != null ? (trend.monthly_upload_last_30d === 0 ? annDown("최근 30일 0건") : trend.monthly_upload_last_30d >= 4 ? annUp(`월 ${trend.monthly_upload_last_30d}건`) : annFlat(`월 ${trend.monthly_upload_last_30d}건`)) : annFlat("-"), comment: sb.upload_regularity?.comment },
    { n: "⑥ 최근 모멘텀",           st: s(trend?.growth_rate_pct, 10, 0),              val: (trend?.recent_10_avg_views != null ? fmt(trend.recent_10_avg_views) : trend?.growth_rate_pct != null ? `${trend.growth_rate_pct > 0 ? "+" : ""}${trend.growth_rate_pct}%` : "-"),                                    name: "최근 10개 평균 조회",     ann: (trend?.recent_10_avg_views != null && trend?.previous_10_avg_views != null && trend.previous_10_avg_views > 0) ? (trend.recent_10_avg_views >= trend.previous_10_avg_views ? annUp(`이전 대비 +${(((trend.recent_10_avg_views - trend.previous_10_avg_views) / trend.previous_10_avg_views) * 100).toFixed(0)}%`) : annDown(`이전 대비 ${(((trend.recent_10_avg_views - trend.previous_10_avg_views) / trend.previous_10_avg_views) * 100).toFixed(0)}%`)) : annFlat("성장 모멘텀 분석 중"), comment: trend?.trend_comment ?? sb.growth_velocity?.comment },
    { n: "⑦ 상위 조회수 집중도",    st: s(dist?.viral_ratio_pct, 20, 5),              val: dist?.viral_ratio_pct != null ? `${dist.viral_ratio_pct}%` : "-",                                                          name: "바이럴 비율",             ann: dist?.over_500k != null ? annFlat(`50만↑ ${dist.over_500k}개 · 5만↓ ${dist.under_50k ?? 0}개`) : annFlat("-"), comment: sb.viral_potential?.comment },
    { n: "⑧ CTR 잠재력",            st: s(dist?.above_average_ratio_pct, 40, 20),      val: dist?.above_average_ratio_pct != null ? `${dist.above_average_ratio_pct}%` : "-",                                          name: "평균 이상 조회 비율",      ann: annFlat("제목·썸네일 클릭 유도력 지표"), comment: sb.niche_authority?.comment },
    { n: "⑨ 장기 지속성",           st: "fl" as St,                                     val: stats?.average_views != null ? fmt(stats.average_views) : "-",                                                            name: "평균 조회수",             ann: (stats?.average_views != null && stats?.median_views != null && stats.median_views > 0) ? annUp(`중앙값 대비 ${(stats.average_views / stats.median_views).toFixed(1)}배`) : annFlat("최근 50개 영상 기준"), comment: sb.content_consistency?.comment },
  ];

  return (
    <section className="rpt-section" style={{ background: "#fff" }}>
      <div className="rpt-wrap">
        <SecLabel txt="Growth Metrics" section="섹션 2 / 7" />
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>9개 성장 지표</h2>
        {trend?.trend_comment
          ? <p style={{ fontSize: "16px", color: BLK, fontWeight: 600, marginBottom: "8px", lineHeight: 1.6 }}>{trend.trend_comment}</p>
          : null}
        <p style={{ fontSize: "14px", color: G600, marginBottom: "36px" }}>각 지표별 현재 수치와 진단을 확인하세요. 수치는 최근 50개 영상 기준입니다.</p>
        <div className="g-metrics" style={{ border: `1px solid ${G200}` }}>
          {(() => {
            const firstDnIdx = metrics.findIndex(m => m.st === "dn");
            return metrics.map((m, i) => (
            <div key={i} style={{ background: "#fff", padding: "22px 18px", borderRight: `1px solid ${G200}`, borderBottom: `1px solid ${G200}`, display: "flex", flexDirection: "column", position: "relative" }}>
              {i === firstDnIdx && (
                <span style={{ position: "absolute", top: "10px", right: "10px" }}><ActionCheckbox /></span>
              )}
              <div style={{ fontFamily: MONO, fontSize: "12px", color: G400, marginBottom: "8px" }}>{m.n}</div>
              <DotBadge status={m.st} />
              <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: MONO, marginBottom: "4px", color: m.st === "up" ? "#16A34A" : m.st === "dn" ? "#DC2626" : G600 }}>{m.val}</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: BLK, marginBottom: "2px", fontFamily: SANS }}>{m.name}</div>
              <Ann a={m.ann} />
              {m.comment && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${G200}`, fontSize: "13px", color: G600, lineHeight: 1.65, fontFamily: SANS }}>
                  {m.comment}
                </div>
              )}
            </div>
          ));
          })()}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 3: 데이터 시그널 ═════════════════════════════════ */
function DataSignalsSection({ data, growth, patterns }: {
  data: ManusReportJson["section3_data_signals"];
  growth: ManusReportJson["section2_growth_metrics"];
  patterns: ManusReportJson["section4_channel_patterns"];
}) {
  if (!data) return null;
  const high   = data.high_performance_patterns ?? [];
  const low    = data.low_performance_patterns ?? [];
  const kw     = data.keyword_analysis;
  const title  = data.title_pattern_analysis;
  const stats  = growth?.view_statistics;
  const eng    = growth?.engagement_metrics;
  const trend  = growth?.growth_trend;
  const thumb  = patterns?.thumbnail_and_title_patterns;
  const upload = patterns?.upload_patterns;
  const seriesPerf = patterns?.series_performance;
  const seriesEntries = (Array.isArray(seriesPerf) ? seriesPerf : seriesPerf && typeof seriesPerf === "object" ? Object.values(seriesPerf) : []).filter(Boolean);

  type SIRaw = { t: string; v: string; dot: "g" | "r" | "y" | "b"; desc?: string };
  type SI = SIRaw & { n: string };
  const mkSI = (arr: (SIRaw | null)[], offset = 0): SI[] =>
    arr.filter((x): x is SIRaw => x !== null).slice(0, 10).map((item, i) => ({ n: String(offset + i + 1).padStart(2, "0"), ...item }));

  const g1 = mkSI([
    title?.avg_title_length != null          ? { t: "평균 제목 길이",      v: `${title.avg_title_length}자`,                                                          dot: "g" } : null,
    title?.optimal_title_length              ? { t: "최적 제목 길이",      v: title.optimal_title_length,                                                             dot: "g" } : null,
    title?.hashtag_usage?.avg_tags != null   ? { t: "평균 해시태그 수",    v: `${title.hashtag_usage.avg_tags}개`,                                                    dot: "b" } : null,
    title?.hashtag_usage?.effective_tags     ? { t: "효과적 태그",         v: title.hashtag_usage.effective_tags.slice(0, 40),                                        dot: "g" } : null,
    ...(title?.effective_structures ?? []).slice(0, 6).map(s => ({ t: "효과적 제목 구조", v: s.slice(0, 45), dot: "g" as const })),
    stats?.max_views?.title                  ? { t: "최고 조회 영상 제목", v: stats.max_views.title.slice(0, 45),                                                     dot: "g" } : null,
    (kw?.high_ctr_keywords ?? []).length > 3 ? { t: "클릭 유도 키워드",  v: (kw!.high_ctr_keywords!).slice(3, 6).map(k => `#${k}`).join("  "),                     dot: "y" } : null,
    (thumb?.effective_thumbnail_elements ?? []).length > 0
                                             ? { t: "효과적 썸네일 요소",  v: (thumb!.effective_thumbnail_elements!).slice(0, 2).join(" · ").slice(0, 45),            dot: "b" } : null,
  ]);

  const g2 = mkSI([
    ...high.slice(0, 7).map(p => {
      const insight = (p.insight ?? p.description ?? "").trim();
      return { t: p.pattern ?? "-", v: p.avg_views != null ? `평균 ${fmt(p.avg_views)}회` : insight, desc: insight || undefined, dot: "g" as const };
    }),
    ...(kw?.high_ctr_keywords ?? []).slice(0, 3).map(k => ({ t: "클릭 유도 키워드", v: `#${k}`, dot: "y" as const })),
    eng?.avg_likes_per_video != null         ? { t: "영상당 평균 좋아요",  v: `${fmt(eng.avg_likes_per_video)}개`,                                                    dot: "g" } : null,
    eng?.avg_comments_per_video != null      ? { t: "영상당 평균 댓글",    v: `${fmt(eng.avg_comments_per_video)}개`,                                                 dot: "g" } : null,
    (trend?.recent_10_avg_views != null && trend?.previous_10_avg_views != null)
      ? { t: "최근 모멘텀 변화", v: `최근 ${fmt(trend.recent_10_avg_views)} vs 이전 ${fmt(trend.previous_10_avg_views)}`, dot: trend.recent_10_avg_views >= trend.previous_10_avg_views ? "g" : "r" as const }
      : null,
  ], g1.length);

  const g3 = mkSI([
    ...low.slice(0, 7).map(p => {
      const insight = (p.insight ?? p.description ?? "").trim();
      return { t: p.pattern ?? "-", v: insight, dot: "r" as const };
    }),
    ...(kw?.topic_performance && !Array.isArray(kw.topic_performance) && typeof kw.topic_performance === "object" ? Object.entries(kw.topic_performance).map(([topic, perf]) => ({ t: `주제: ${topic}`, v: perf?.avg_views != null ? `평균 ${fmt(perf.avg_views)}회 · ${perf.share_pct ?? 0}%` : `${perf?.video_count ?? 0}개 영상`, dot: "b" as const })) : []),
    ...seriesEntries.slice(0, 3).map(s => ({ t: `시리즈 · ${s!.name ?? "-"}`, v: `평균 ${fmt(s!.avg_views)}회 · ${s!.video_count ?? 0}편`, dot: "b" as const })),
    upload?.peak_upload_period               ? { t: "업로드 피크 시점",    v: upload.peak_upload_period.slice(0, 45),                                                 dot: "y" } : null,
  ], g1.length + g2.length);

  const total = g1.length + g2.length + g3.length;
  const groups = [
    { id: "ct", tc: "#88CCFF", label: "// Content Signal · 콘텐츠",      items: g1 },
    { id: "pf", tc: LIME,      label: "// Performance Signal · 퍼포먼스", items: g2 },
    { id: "id", tc: "#FFAA55", label: "// Identity Signal · 채널 정체성", items: g3 },
  ];

  return (
    <section className="rpt-section" style={{ background: DARK }}>
      <div className="rpt-wrap">
        <SecLabel txt="Data Signals" section="섹션 3 / 7" dark />
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", color: "#fff", fontFamily: SANS }}>{total >= 30 ? "30개 데이터 시그널" : "데이터 시그널"}</h2>
        <p style={{ fontSize: "16px", color: "#BBBBBB", marginBottom: "36px" }}>콘텐츠 · 퍼포먼스 · 채널 정체성 3개 그룹 핵심 시그널</p>
        <div className="g-signals" style={{ background: DARK3, border: `1px solid ${DARK3}` }}>
          {groups.map((g) => (
            <div key={g.id} style={{ background: "#1E1E1E", padding: "28px 22px" }}>
              <div style={{ fontFamily: MONO, fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "18px", paddingBottom: "12px", borderBottom: `2px solid #2E2E2E`, color: g.tc }}>{g.label}</div>
              {g.items.length === 0 && <p style={{ fontSize: "14px", color: "#777" }}>데이터 준비 중</p>}
              {g.items.map((item, i) => {
                const isTopAlert = g.id === "id" && i === 0;
                return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "9px 0", borderBottom: i < g.items.length - 1 ? `1px solid #252525` : "none" }}>
                  <span style={{ fontFamily: MONO, fontSize: "11px", color: LIME, flexShrink: 0, minWidth: "18px", paddingTop: "3px", fontWeight: 700 }}>{item.n}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#F0F0F0", marginBottom: "2px", fontFamily: SANS, display: "flex", alignItems: "center", gap: "6px" }}>
                      {item.t}
                      {isTopAlert && <ActionCheckbox />}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: "12px", color: "#CCCCCC" }}><SiDot t={item.dot} />{item.v}</div>
                    {item.desc && item.desc !== item.v && (
                      <div style={{ fontSize: "13px", color: "#AAAAAA", lineHeight: 1.6, marginTop: "4px", fontFamily: SANS }}>{item.desc}</div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 4: 채널 운영 패턴 ═══════════════════════════════ */
function ChannelPatternsSection({ data }: { data: ManusReportJson["section4_channel_patterns"] }) {
  if (!data) return null;
  const upload = data.upload_patterns;
  const thumb  = data.thumbnail_and_title_patterns;
  const aud    = data.audience_behavior;
  const evo    = data.content_evolution;
  const series = data.series_performance;
  const phases = evo ? (["phase1","phase2","phase3","phase4","phase5"] as const).map(k => evo[k]).filter(Boolean) : [];
  const patternActions = data.pattern_actions ?? [];

  type Pat = { n: string; name: string; char: string; interp: string };
  const pats: Pat[] = [];

  if (upload?.avg_upload_interval_days != null || upload?.recent_30d_uploads != null)
    pats.push({ n: "01", name: "업로드 주기 패턴", char: [upload?.avg_upload_interval_days != null && `평균 ${upload.avg_upload_interval_days}일 간격`, upload?.recent_30d_uploads != null && `최근 30일 ${upload.recent_30d_uploads}건`, upload?.upload_consistency].filter(Boolean).join(" · "), interp: upload?.optimal_upload_frequency ? `최적 업로드 빈도: ${upload.optimal_upload_frequency}` : "정기 업로드 루틴 확립 권장" });

  if (upload?.peak_upload_period || upload?.optimal_upload_frequency)
    pats.push({ n: "02", name: "업로드 최적 시점", char: [upload?.peak_upload_period && `피크 시점: ${upload.peak_upload_period}`, upload?.optimal_upload_frequency && `권장 빈도: ${upload.optimal_upload_frequency}`].filter(Boolean).join(" · "), interp: "조회수 피크 시점 업로드 집중 시 초기 노출 극대화" });

  if (thumb?.effective_title_formulas?.length)
    pats.push({ n: "03", name: "제목 전략 패턴", char: (thumb.effective_title_formulas ?? []).slice(0, 3).join(" · "), interp: "성과가 높은 제목 구조. 신규 영상 기획 시 적극 활용 권장" });

  if (thumb?.effective_thumbnail_elements?.length)
    pats.push({ n: "04", name: "썸네일 전략 패턴", char: (thumb.effective_thumbnail_elements ?? []).slice(0, 3).join(" · "), interp: "클릭률 향상에 기여한 썸네일 요소. 일관성 있게 적용 권장" });

  if (aud?.viral_trigger)
    pats.push({ n: "05", name: "바이럴 트리거 패턴", char: firstSentence(aud.viral_trigger), interp: aud.engagement_peak_content ?? "바이럴 요인을 신규 콘텐츠에 의도적으로 배치 권장" });

  if (aud?.comment_driver)
    pats.push({ n: "06", name: "댓글 · 참여 유도 패턴", char: firstSentence(aud.comment_driver), interp: "참여 유도 질문을 영상 말미에 삽입하면 댓글 참여율 개선" });

  if (phases.length > 0) {
    const last = phases[phases.length - 1];
    pats.push({ n: "07", name: "콘텐츠 진화 타임라인", char: phases.map((ph, i) => `${i + 1}단계: ${ph?.theme ?? "-"}`).join(" → "), interp: last?.description ?? "채널 콘텐츠 방향이 수렴 중. 현재 포맷 유지 권장" });
  }

  if (pats.length < 7 && series && !Array.isArray(series) && typeof series === "object" && Object.keys(series).length > 0) {
    const entries = Object.values(series).filter(Boolean);
    pats.push({ n: String(pats.length + 1).padStart(2, "0"), name: "시리즈 성과 패턴", char: entries.slice(0, 3).map(s => `${s?.name ?? "-"} (평균 ${fmt(s?.avg_views)})`).join(" · "), interp: `${entries.length}개 시리즈 운영 중. 핵심 시리즈에 집중 권장` });
  }

  if (pats.length === 0) return null;

  const sortedPats = patternActions.length > 0
    ? [...pats].sort((a, b) => {
        const ra = patternActions.find(pa => pa.name === a.name)?.rank ?? 99;
        const rb = patternActions.find(pa => pa.name === b.name)?.rank ?? 99;
        return ra - rb;
      })
    : pats;

  return (
    <section className="rpt-section" style={{ background: "#fff" }}>
      <div className="rpt-wrap">
        <SecLabel txt="Channel Patterns" section="섹션 4 / 7" />
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>{sortedPats.length}개 채널 운영 패턴</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "36px" }}>데이터에서 발견된 운영 패턴과 그 의미를 분석합니다.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sortedPats.map((p, idx) => {
            const action = patternActions.find(pa => pa.name === p.name);
            const rank = action?.rank ?? (idx + 1);
            return (
              <div key={p.n} className="g-pattern" style={{ border: `1px solid ${G200}` }}>
                <div style={{ background: BLK, color: LIME, fontFamily: MONO, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                {String(rank).padStart(2, "0")}
                {rank === 1 && <ActionCheckbox />}
              </div>
                <div className="g-pattern-body" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px", fontFamily: SANS }}>{p.name}</div>
                  <div style={{ fontSize: "14px", color: G600, lineHeight: 1.6 }}>{p.char}</div>
                </div>
                <div className="g-pattern-interp" style={{ padding: "16px 18px", background: "#F0FFF0" }}>
                  <div style={{ fontFamily: MONO, fontSize: "11px", color: "#4A7C00", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", fontWeight: 700 }}>해석</div>
                  <div style={{ fontSize: "14px", color: "#2D5A00", lineHeight: 1.6, fontWeight: 500 }}>{p.interp}</div>
                  {action && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #C6E8A0", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, color: "#DC2626", whiteSpace: "nowrap", paddingTop: "1px" }}>당장</span>
                        <span style={{ fontSize: "13px", color: "#1A1A1A", lineHeight: 1.6 }}>{action.immediate_action}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, color: "#D97706", whiteSpace: "nowrap", paddingTop: "1px" }}>이번 주</span>
                        <span style={{ fontSize: "13px", color: "#1A1A1A", lineHeight: 1.6 }}>{action.weekly_action}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 5: Channel DNA ══════════════════════════════════ */
function ChannelDNASection({ data, scorecard }: { data: ManusReportJson["section5_channel_dna"]; scorecard: ManusReportJson["section1_scorecard"] }) {
  if (!data) return null;
  const signals = scorecard ? [
    ["signals",  "30",  "v", "// 데이터 시그널 추출 완료"],
    ["metrics",  "9",   "v", "// 성장 지표 점수화 완료"],
    ["patterns", "7",   "v", "// 채널 운영 패턴 감지 완료"],
  ] : [];

  return (
    <section className="rpt-section" style={{ background: "#161616" }}>
      <div className="rpt-wrap">
        <SecLabel txt="Channel DNA" section="섹션 5 / 7" dark />
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", color: "#fff", fontFamily: SANS }}>채널 DNA 진단</h2>
        {data.unique_value_proposition
          ? <p style={{ fontSize: "16px", color: "#E0E0E0", fontWeight: 600, marginBottom: "36px", lineHeight: 1.6 }}>{data.unique_value_proposition}</p>
          : <p style={{ fontSize: "16px", color: "#BBBBBB", marginBottom: "36px" }}>채널 고유의 정체성과 성장 구조를 분석합니다.</p>}


        {data.core_identity && (
          <div style={{ border: `1px solid #2E2E2E`, background: DARK2, padding: "28px 32px", marginBottom: "24px", position: "relative" }}>
            <div style={{ position: "absolute", top: "-11px", left: "20px", fontFamily: MONO, fontSize: "12px", background: DARK2, color: LIME, padding: "0 10px", letterSpacing: "1px", fontWeight: 600 }}>CORE IDENTITY</div>
            <div style={{ fontSize: "16px", color: "#F0F0F0", lineHeight: 1.9 }}>{data.core_identity}</div>
            {data.unique_value_proposition && (
              <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: `1px solid ${DARK3}`, fontFamily: MONO, fontSize: "14px", color: "#CCCCCC" }}>
                <span style={{ color: ORANGE, marginRight: "10px", letterSpacing: "1px" }}>POSITIONING</span>
                &ldquo;{data.unique_value_proposition}&rdquo;
              </div>
            )}
          </div>
        )}

        {(data.brand_keywords ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
            {(data.brand_keywords ?? []).map((kw, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: "13px", background: "#252525", color: "#CCCCCC", padding: "4px 12px", borderRadius: "2px" }}>{kw}</span>
            ))}
          </div>
        )}

        {(data.creator_persona || data.target_audience) && (
          <div className="g-dna2" style={{ background: DARK3, border: `1px solid ${DARK3}`, marginBottom: "24px" }}>
            {data.creator_persona && (
              <div style={{ background: DARK2, padding: "22px" }}>
                <div style={{ fontFamily: MONO, fontSize: "12px", color: LIME, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px", paddingBottom: "10px", borderBottom: `1px solid ${DARK3}` }}>// CREATOR PERSONA</div>
                {([["캐릭터", data.creator_persona.character], ["스토리텔링", data.creator_persona.storytelling_style], ["관계", data.creator_persona.relationship_with_audience]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
                  <div key={i} style={{ marginBottom: "12px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "11px", color: "#888", marginBottom: "2px" }}>{k}</div>
                    <div style={{ fontSize: "15px", color: "#F0F0F0", lineHeight: 1.7 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {data.target_audience && (
              <div style={{ background: DARK2, padding: "22px" }}>
                <div style={{ fontFamily: MONO, fontSize: "12px", color: "#FFAA55", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px", paddingBottom: "10px", borderBottom: `1px solid ${DARK3}` }}>// TARGET AUDIENCE</div>
                {([["1차 타겟", data.target_audience.primary], ["2차 타겟", data.target_audience.secondary], ["3차 타겟", data.target_audience.tertiary]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
                  <div key={i} style={{ marginBottom: "12px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "11px", color: "#888", marginBottom: "2px" }}>{k}</div>
                    <div style={{ fontSize: "15px", color: "#F0F0F0", lineHeight: 1.7 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(data.content_pillars ?? []).length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontFamily: MONO, fontSize: "12px", color: "#999", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "28px", height: "1px", background: "#999", display: "block" }} />콘텐츠 필러
            </div>
            {(data.content_pillars ?? []).map((pillar, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: "#1E1E1E", border: `1px solid ${DARK3}`, marginBottom: "4px" }}>
                <span style={{ fontFamily: MONO, fontSize: "12px", color: "#888", minWidth: "20px" }}>0{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#F0F0F0" }}>{pillar.pillar}</span>
                  {pillar.description && <span style={{ fontSize: "13px", color: "#AAAAAA", marginLeft: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{pillar.description}</span>}
                </div>
                {pillar.contribution_pct != null && (
                  <div style={{ flexShrink: 0, minWidth: "90px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "13px", color: LIME, textAlign: "right", marginBottom: "4px" }}>{pillar.contribution_pct}%</div>
                    <DkBar pct={pillar.contribution_pct} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 코드 블록 — 원본 HTML 기준 8줄 */}
        <div style={{ background: "#0F0F0F", border: `1px solid ${DARK3}`, borderLeft: `3px solid ${LIME}`, padding: "22px 26px", fontFamily: MONO, fontSize: "14px", lineHeight: 2, overflowX: "auto" }}>
          {([
            { type: "c", v1: "// tubewatch — channel dna analysis v2.1" },
            { type: "k", k: "channel",         s: `"${firstSentence(data.core_identity ?? "-")}"` },
            { type: "k", k: "signals",         n: "30",                  c: "// 데이터 시그널 추출 완료" },
            { type: "k", k: "metrics",         n: "9",                   c: "// 성장 지표 점수화 완료" },
            { type: "k", k: "patterns",        n: "7",                   c: "// 채널 운영 패턴 감지 완료" },
            { type: "k", k: "dna_type",        s: `[${(data.brand_keywords ?? []).map(k => `"${k}"`).join(", ")}]` },
            { type: "k", k: "uvp",             s: `"${firstSentence(data.unique_value_proposition ?? "")}"` },
            { type: "k", k: "differentiation", s: `"${firstSentence(data.competitive_differentiation ?? "")}"` },
          ] as { type: string; v1?: string; k?: string; s?: string; n?: string; c?: string }[]).map((row, i) => (
            <div key={i} style={{ display: "flex", gap: "14px" }}>
              <span style={{ color: "#777", minWidth: "18px", textAlign: "right" }}>{i + 1}</span>
              <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {row.type === "c" && <span style={{ color: "#888" }}>{row.v1}</span>}
                {row.type === "k" && (<>
                  <span style={{ color: LIME }}>{row.k}</span>{"    "}
                  {row.s && <span style={{ color: "#FFAA55" }}>{row.s}</span>}
                  {row.n && <span style={{ color: "#88AAFF" }}>{row.n}</span>}
                  {row.c && <span style={{ color: "#888" }}>{"  "}{row.c}</span>}
                </>)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ SECTION 6: 완성형 콘텐츠 기획안 ═════════════════════════ */
function ContentPlansSection({ data, signals }: {
  data: ManusReportJson["section6_content_plans"];
  signals: ManusReportJson["section3_data_signals"];
}) {
  if (!data) return null;
  const opps   = [...(data.immediate_opportunities ?? [])].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)).slice(0, 2);
  const series = data.series_concepts ?? [];
  const sf     = data.short_form_strategy;

  /* 해시태그: effective_tags 파싱 + high_ctr_keywords 보완 */
  const _effectiveTags = signals?.title_pattern_analysis?.hashtag_usage?.effective_tags;
  const rawTags  = (typeof _effectiveTags === "string" ? _effectiveTags : "")
    .split(/\s+/).filter(t => t.startsWith("#")).map(t => t.replace(/^#+/, ""));
  const kwTags   = (signals?.keyword_analysis?.high_ctr_keywords ?? []).slice(0, 5);
  const allTags  = [...new Set([...rawTags, ...kwTags])].slice(0, 10);

  return (
    <section className="rpt-section" style={{ background: "#fff" }}>
      <div className="rpt-wrap">
        <SecLabel txt="Content Plan" section="섹션 6 / 7" />
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>완성형 콘텐츠 기획안</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "12px" }}>AI 분석 기반 · 채널 데이터 흐름에서 도출한 완성형 기획문서입니다.</p>
        <p style={{ fontSize: "13px", color: "#D97706", marginBottom: "36px", fontFamily: MONO }}>* 상승기 패턴 기반의 기획으로, 현재 채널 상황과 교차 검토를 권장합니다.</p>

        {opps.length > 0 && (
          <div className={opps.length >= 2 ? "g-plans2" : "g-plans2 g-plans-single"} style={{ marginBottom: "28px" }}>
            {opps.map((opp, i) => (
              <div key={i} style={{ border: `1px solid ${G200}`, overflow: "hidden" }}>
                {/* 헤더 */}
                <div style={{ background: BLK, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontFamily: MONO, fontSize: "12px", color: G400, letterSpacing: "1px" }}>PLAN #{String(opp.priority ?? i + 1).padStart(2, "0")}</span>
                    {opp.format && <span style={{ fontFamily: MONO, fontSize: "11px", background: "#252525", color: "#CCCCCC", padding: "2px 8px", borderRadius: "2px" }}>{opp.format}</span>}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", lineHeight: 1.35 }}>{opp.title ?? "-"}</div>
                </div>

                <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* 기획 의도: concept + rationale 합산 2문장 */}
                  {(opp.concept || opp.rationale) && (
                    <div style={{ paddingBottom: "18px", borderBottom: `1px solid ${G200}` }}>
                      <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>기획 의도</div>
                      {opp.concept && <div style={{ fontSize: "15px", color: G600, lineHeight: 1.8, marginBottom: opp.rationale ? "6px" : 0 }}>{opp.concept}</div>}
                      {opp.rationale && <div style={{ fontSize: "15px", color: G600, lineHeight: 1.8 }}>{opp.rationale}</div>}
                    </div>
                  )}

                  {/* 제목 공식: A=공식, B=구체 예시 */}
                  {(opp.title_formula || opp.title) && (
                    <div style={{ paddingBottom: "18px", borderBottom: `1px solid ${G200}` }}>
                      <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>제목 공식</div>
                      {opp.title_formula && (
                        <div style={{ display: "flex", gap: "10px", fontSize: "15px", marginBottom: "10px", lineHeight: 1.6, alignItems: "flex-start" }}>
                          <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, background: BLK, color: LIME, padding: "2px 7px", flexShrink: 0, marginTop: "2px" }}>A</span>
                          <span>{opp.title_formula}</span>
                        </div>
                      )}
                      {opp.title && (
                        <div style={{ display: "flex", gap: "10px", fontSize: "15px", lineHeight: 1.6, alignItems: "flex-start" }}>
                          <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, background: DARK3, color: ORANGE, padding: "2px 7px", flexShrink: 0, marginTop: "2px" }}>B</span>
                          <span style={{ color: G600 }}>{opp.title}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 구성 흐름 */}
                  {(opp.structure_flow ?? []).length > 0 && (
                    <div style={{ paddingBottom: "18px", borderBottom: `1px solid ${G200}` }}>
                      <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>구성 흐름</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {opp.structure_flow!.map((step, si) => (
                          <div key={si} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, background: BLK, color: LIME, padding: "2px 6px", flexShrink: 0, marginTop: "2px", minWidth: "22px", textAlign: "center" }}>{si + 1}</span>
                            <span style={{ fontSize: "14px", color: G600, lineHeight: 1.65 }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 하단: 예상 조회수 */}
                  {opp.expected_views && (
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: "13px", background: "#F5F5F5", color: G600, padding: "4px 12px", borderRadius: "2px" }}>
                        예상 조회수: <strong style={{ color: ORANGE }}>{opp.expected_views}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 추천 해시태그 */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: "28px", padding: "18px 22px", border: `1px solid ${G200}` }}>
            <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>추천 해시태그</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {allTags.map((tag, i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: "14px", background: "#F5F5F5", color: BLK, padding: "4px 12px", borderRadius: "2px", cursor: "pointer" }}>#{tag}</span>
              ))}
            </div>
          </div>
        )}

        {series.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontFamily: MONO, fontSize: "12px", color: G400, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "28px", height: "1px", background: G400, display: "block" }} />시리즈 기획
            </div>
            <div className="g-series2">
              {series.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${G200}`, padding: "18px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>{s.series_name ?? "-"}</div>
                  {s.concept && <div style={{ fontSize: "14px", color: G600, marginBottom: "10px", lineHeight: 1.6 }}>{s.concept}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontFamily: MONO, fontSize: "13px", color: G600 }}>
                    {s.episode_count != null && <span>에피소드 {s.episode_count}개</span>}
                    {s.target_views_per_episode && <span style={{ color: ORANGE }}>목표 {s.target_views_per_episode}</span>}
                    {s.content_calendar && <span>{s.content_calendar}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sf && (
          <div style={{ border: `1px solid ${G200}`, padding: "18px 22px" }}>
            <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>숏폼 전략</div>
            <div style={{ fontSize: "15px", color: G600, lineHeight: 1.7 }}>
              {sf.posting_frequency && <span><strong>빈도:</strong> {sf.posting_frequency} · </span>}
              {sf.hashtag_strategy && <span><strong>해시태그:</strong> {sf.hashtag_strategy}</span>}
              {(sf.recommended_formats ?? []).length > 0 && <div style={{ marginTop: "6px" }}><strong>추천 포맷:</strong> {sf.recommended_formats!.join(", ")}</div>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ SECTION 7: 30일 실행 계획 (4탭) ════════════════════════ */
function ActionPlanSection({ report }: { report: ManusReportJson }) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const data = report.section7_action_plan;
  if (!data) return null;

  const kpi   = data.kpi_targets;
  const score = report.section1_scorecard?.overall_score ?? 0;
  const subs  = report.channel_info?.subscribers ?? 0;
  const avgV  = report.section2_growth_metrics?.view_statistics?.average_views ?? 0;
  const cmtR  = report.section2_growth_metrics?.engagement_metrics?.avg_comment_rate ?? 0;

  const tabs = [
    { label: "1주차",   sub: data.immediate_actions?.timeframe ?? "기반 다지기", tasks: data.immediate_actions?.tasks ?? [] },
    { label: "2~3주차", sub: data.short_term_plan?.timeframe ?? "실행 중기",     tasks: data.short_term_plan?.tasks ?? [] },
    { label: "4주차+",  sub: data.long_term_plan?.timeframe ?? "전략 실행",      tasks: data.long_term_plan?.tasks ?? [] },
  ];

  type Task = { task?: string; detail?: string; priority?: string; expected_impact?: string; kpi?: string; timeline?: string };

  const allImmediateTasks = (data.immediate_actions?.tasks ?? []) as Task[];
  const topTask: Task | undefined =
    allImmediateTasks.find(t => (t.priority ?? "").toUpperCase() === "긴급" || (t.priority ?? "").toUpperCase() === "URGENT") ??
    allImmediateTasks.find(t => (t.priority ?? "").toUpperCase() === "높음"  || (t.priority ?? "").toUpperCase() === "HIGH")   ??
    allImmediateTasks[0];

  return (
    <section className="rpt-section" style={{ background: "#fff" }}>
      <div className="rpt-wrap">
        <SecLabel txt="Action Plan" section="섹션 7 / 7" />
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", fontFamily: SANS }}>30일 실행 계획</h2>
        <p style={{ fontSize: "16px", color: G600, marginBottom: "24px" }}>우선순위별 액션 아이템과 목표 수치를 확인하세요.</p>

        {/* 지금 당장 1개 */}
        {topTask && (
          <div style={{ background: BLK, padding: "20px 24px", marginBottom: "28px", borderLeft: `4px solid ${LIME}` }}>
            <div style={{ fontFamily: MONO, fontSize: "11px", color: LIME, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ActionCheckbox />
              지금 당장 · Top Priority
            </div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#fff", fontFamily: SANS, marginBottom: "6px" }}>{topTask.task ?? "-"}</div>
            {topTask.detail && <div style={{ fontSize: "14px", color: "#AAAAAA", lineHeight: 1.7 }}>{topTask.detail}</div>}
            {topTask.expected_impact && <div style={{ fontSize: "13px", color: ORANGE, marginTop: "8px", fontFamily: MONO }}>기대 효과: {topTask.expected_impact}</div>}
          </div>
        )}

        {/* 탭 3개 — 선택 탭은 블랙 배경 */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <button key={idx} onClick={() => setActiveTab(idx as 0 | 1 | 2)}
                style={{ padding: "10px 18px", border: `1px solid ${isActive ? BLK : G200}`, borderRadius: "6px", background: isActive ? BLK : "#fff", cursor: "pointer", fontFamily: SANS, fontSize: "14px", fontWeight: 700, color: isActive ? "#fff" : G400, transition: "all .15s", whiteSpace: "nowrap", textAlign: "left" }}>
                {tab.label}
                <span style={{ display: "block", fontFamily: MONO, fontSize: "11px", color: isActive ? "rgba(255,255,255,.6)" : G400, fontWeight: 400, marginTop: "2px" }}>{tab.sub}</span>
              </button>
            );
          })}
        </div>

        {/* 선택 탭 태스크 */}
        {tabs[activeTab].tasks.length === 0 && (
          <p style={{ fontSize: "15px", color: G400, padding: "20px 0" }}>해당 구간 액션 아이템이 없습니다.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {(tabs[activeTab].tasks as Task[]).map((t, i) => {
            const up = (t.priority ?? "").toUpperCase();
            const bc = up === "긴급" || up === "URGENT" ? "#DC2626" : up === "높음" || up === "HIGH" ? "#D97706" : "#1D4ED8";
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px 20px", border: `1px solid ${G200}`, borderLeft: `3px solid ${bc}` }}>
                <PriBadge p={t.priority} />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px", fontFamily: SANS }}>{t.task ?? "-"}</div>
                  {t.detail && <div style={{ fontSize: "15px", color: G600, lineHeight: 1.7 }}>{t.detail}</div>}
                  {t.expected_impact && <div style={{ fontSize: "14px", color: "#D97706", marginTop: "4px" }}>기대 효과: {t.expected_impact}</div>}
                  {t.kpi && <div style={{ fontSize: "14px", color: ORANGE, marginTop: "4px", fontFamily: MONO }}>KPI: {t.kpi}</div>}
                  {t.timeline && <div style={{ fontSize: "13px", color: G400, marginTop: "4px", fontFamily: MONO }}>타임라인: {t.timeline}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 리스크 */}
        {(data.risk_management ?? []).length > 0 && (
          <div style={{ border: `1px solid #F59E0B`, background: "#FFFBEB", padding: "14px 18px", display: "flex", gap: "10px", marginBottom: "32px" }}>
            <span>⚠</span>
            <div style={{ fontSize: "15px", color: "#92400E", lineHeight: 1.75 }}>
              <strong>리스크 관리: </strong>{(data.risk_management ?? []).slice(0, 2).map(r => r.risk).filter(Boolean).join(" · ")}
            </div>
          </div>
        )}

        {/* 성과 지표 달성 예측 — 항상 노출 */}
        {kpi && (
          <div style={{ borderTop: `1px solid ${G200}`, paddingTop: "28px" }}>
            <div style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: G400, marginBottom: "20px" }}>
              성과 지표 달성 예측
            </div>

            {/* 진행률 바: 현재 → 1개월 목표 */}
            {kpi["1_month"] && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontFamily: MONO, fontSize: "11px", color: G400, letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "20px", height: "1px", background: G400, display: "block" }} />현재 → 1개월 목표
                </div>
                {score > 0 && kpi["1_month"]?.avg_views_per_video != null && (
                  <ProgressBar label="채널 스코어" current={score} target={Math.min(100, score + 12)} unit="점" color="#16A34A" />
                )}
                {avgV > 0 && kpi["1_month"]?.avg_views_per_video != null && (
                  <ProgressBar label="평균 조회수" current={avgV} target={kpi["1_month"].avg_views_per_video!} color={ORANGE} />
                )}
                {subs > 0 && kpi["1_month"]?.subscribers != null && (
                  <ProgressBar label="구독자 수" current={subs} target={kpi["1_month"].subscribers!} unit="명" color="#6366F1" />
                )}
                {cmtR > 0 && (
                  <ProgressBar label="댓글 참여율" current={cmtR} target={parseFloat((cmtR * 1.3).toFixed(2))} unit="%" color="#EC4899" />
                )}
              </div>
            )}

            {/* 기간별 목표 그리드 */}
            <div className="g-kpi-goal" style={{ background: G200, border: `1px solid ${G200}`, marginBottom: "8px" }}>
              {(["1_month","3_months","6_months","12_months"] as const).map((key) => {
                const row = kpi[key];
                if (!row) return <div key={key} style={{ background: "#fff", padding: "18px 16px" }} />;
                const label = { "1_month": "1개월 목표", "3_months": "3개월 목표", "6_months": "6개월 목표", "12_months": "12개월 목표" }[key];
                return (
                  <div key={key} style={{ background: "#fff", padding: "18px 16px" }}>
                    <div style={{ fontFamily: MONO, fontSize: "12px", color: G400, marginBottom: "8px" }}>{label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: MONO, color: BLK, marginBottom: "2px" }}>{fmt(row.subscribers)}</div>
                    <div style={{ fontSize: "13px", color: G600, marginBottom: "6px" }}>구독자 목표</div>
                    {row.upload_count != null && <div style={{ fontSize: "12px", color: G400, fontFamily: MONO }}>업로드 {row.upload_count}회</div>}
                    {row.avg_views_per_video != null && <div style={{ fontSize: "12px", color: G400, fontFamily: MONO }}>평균 조회 {fmt(row.avg_views_per_video)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ 타입 (Naver Trends) ══════════════════════════════════════ */
type TrendPoint = { period: string; ratio: number };
type TrendResult = { keyword: string; data: TrendPoint[]; currentRatio: number; prevRatio: number; trend: 'up' | 'down' | 'flat'; changePct: number };
type NewsItem   = { title: string; link: string; pubDate: string };
type NaverTrendsData = { trends: TrendResult[]; news: NewsItem[]; topKeyword: string; tags: string[]; insight: string | null };


/* ══ 상대 시간 ════════════════════════════════════════════════ */
function relTime(pubDate: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(pubDate).getTime()) / 1000);
    if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    const d = new Date(pubDate);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch { return ''; }
}

/* ══ Next Trend Section ═══════════════════════════════════════ */
function trendDesc(t: TrendResult['trend'], pct: number): string {
  if (t === 'up') {
    if (pct > 30) return '급상승 중 — 지금이 기회';
    if (pct > 10) return '상승 추세 — 관심 증가 중';
    return '소폭 상승 — 꾸준한 관심';
  }
  if (t === 'down') {
    if (pct < -30) return '급감 추세 — 모니터링 필요';
    return '하락 추세 — 방향 전환 고려';
  }
  return '안정적 검색량 유지 중';
}

function truncTitle(s: string, n = 52): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n).trimEnd();
  return (cut.endsWith('…') || cut.endsWith('...')) ? cut : cut + '…';
}

function NextTrendSection({ report }: { report: ManusReportJson }) {
  const [data, setData]       = useState<NaverTrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  const keywords = (() => {
    const bk = report.section5_channel_dna?.brand_keywords ?? [];
    const ck = report.section3_data_signals?.keyword_analysis?.high_ctr_keywords ?? [];
    const merged = [...bk, ...ck].filter(Boolean);
    return (merged.length > 0 ? merged : [report.channel_info?.channel_name ?? '유튜브']).slice(0, 3);
  })();

  const channelCtx = [
    report.section5_channel_dna?.core_identity,
    report.section5_channel_dna?.creator_persona?.storytelling_style,
  ].filter(Boolean).join(' / ').slice(0, 200);

  useEffect(() => {
    const params = new URLSearchParams({ keywords: keywords.join(',') });
    if (channelCtx) params.set('channelCtx', channelCtx);
    fetch(`/api/trends/naver?${params.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: NaverTrendsData | null) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trendIcon  = (t: TrendResult['trend']) => t === 'up' ? '▲' : t === 'down' ? '▼' : '→';
  const trendColor = (t: TrendResult['trend']) => t === 'up' ? '#3A7A00' : t === 'down' ? '#DC2626' : '#888';

  /* ── 다크 헤더 + 파스텔 카드 팔레트 ── */
  const DARK_BG   = '#0D0D0D';
  const LIME_PAS  = '#F3FFDE';   // 라임 파스텔
  const ORNG_PAS  = '#FFF5EC';   // 오렌지 파스텔
  const CARD_LINE = 'rgba(0,0,0,0.08)';

  return (
    <section className="rpt-section" style={{ background: '#F8F8F8' }}>
      <div className="rpt-wrap">

        {/* ── 다크 헤더 박스 (헤더 영역만) ── */}
        <div style={{ background: '#111', padding: '28px 28px 24px', marginBottom: '20px' }}>
          <div style={{ fontFamily: MONO, fontSize: '12px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ display: 'block', width: '28px', height: '1px', background: '#444' }} />
            Next Trend Signal · 네이버 데이터랩
          </div>
          <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '8px', color: '#fff', fontFamily: SANS }}>
            이 채널의 검색 트렌드
          </h2>
          <p style={{ fontSize: '16px', color: '#888', marginBottom: '4px' }}>
            채널 핵심 키워드의 최근 4주 검색 흐름과 뉴스 버즈를 분석합니다.
          </p>
          <p style={{ fontFamily: MONO, fontSize: '12px', color: '#555', marginBottom: 0 }}>
            검색 트렌드는 리포트 오픈 시점에 업데이트 반영됩니다.
          </p>
        </div>

        {/* ── 로딩 스켈레톤 ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: 'rgba(0,0,0,0.04)', padding: '26px 24px' }}>
              <div style={{ height: '11px', width: '90px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', marginBottom: '18px', animation: 'trend-pulse 1.5s ease-in-out infinite' }} />
              <div className="g-trend3">
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.05)', padding: '18px 16px' }}>
                    {[55, 38, 70].map((w, j) => (
                      <div key={j} style={{ height: j === 1 ? '28px' : '12px', width: `${w}%`, background: 'rgba(0,0,0,0.08)', borderRadius: '4px', marginBottom: '10px', animation: 'trend-pulse 1.5s ease-in-out infinite' }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.04)', padding: '26px 24px' }}>
              <div style={{ height: '11px', width: '130px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', marginBottom: '18px', animation: 'trend-pulse 1.5s ease-in-out infinite' }} />
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: '46px', background: 'rgba(0,0,0,0.05)', marginBottom: '8px', animation: 'trend-pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          </div>
        )}

        {/* ── 데이터 완료 ── */}
        {!loading && data && (
          <div className="trend-fadein" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* SEARCH TREND — 라임 파스텔 카드 */}
            <div style={{ background: LIME_PAS, padding: '26px 24px', border: `1px solid rgba(170,255,0,.55)` }}>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: '#3A7A00', letterSpacing: '2px', marginBottom: '18px', fontWeight: 700 }}>SEARCH TREND</div>
              {data.trends.length === 0
                ? <div style={{ fontSize: '14px', color: G400 }}>트렌드 데이터 없음</div>
                : (
                  <div className="g-trend3">
                    {data.trends.map((t, i) => (
                      <div key={i} style={{ background: '#fff', padding: '18px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: BLK, fontFamily: SANS, lineHeight: 1.3 }}>{t.keyword}</div>
                          <span style={{ fontSize: '15px', color: trendColor(t.trend), fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>{trendIcon(t.trend)}</span>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: '26px', fontWeight: 900, color: trendColor(t.trend), lineHeight: 1, marginBottom: '4px' }}>
                          {t.changePct > 0 ? '+' : ''}{t.changePct}%
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: '11px', color: G400, marginBottom: '10px' }}>지수 {t.currentRatio}</div>
                        <div style={{ fontSize: '12px', color: G600, lineHeight: 1.5, paddingTop: '8px', borderTop: `1px solid ${CARD_LINE}` }}>
                          {trendDesc(t.trend, t.changePct)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
              <div style={{ marginTop: '14px', fontFamily: MONO, fontSize: '11px', color: '#7A9A50', textAlign: 'right' }}>
                최근 4주 · 전주 평균 대비
              </div>
            </div>

            {/* NEWS BUZZ — 오렌지 파스텔 카드 */}
            <div style={{ background: ORNG_PAS, padding: '26px 24px', border: `1px solid rgba(255,122,0,.4)` }}>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: ORANGE, letterSpacing: '2px', marginBottom: '14px', fontWeight: 700 }}>
                NEWS BUZZ · {data.topKeyword}
              </div>

              {/* AI 인사이트 */}
              {data.insight && (
                <div style={{ background: `${ORBG}`, border: `1px solid rgba(255,122,0,.25)`, padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: MONO, fontSize: '11px', color: ORANGE, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>튜브워치 엔진</span>
                  <span style={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>{data.insight}</span>
                </div>
              )}

              {/* 뉴스 목록 */}
              {data.news.length === 0
                ? <div style={{ fontSize: '14px', color: G400 }}>뉴스 데이터 없음</div>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {data.news.map((n, i) => (
                      <a
                        key={i}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: '#fff', textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow .15s', minWidth: 0, overflow: 'hidden' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                      >
                        <span style={{ fontFamily: MONO, fontSize: '11px', color: G400, flexShrink: 0, minWidth: '50px', paddingTop: '2px' }}>{relTime(n.pubDate)}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#222', flex: 1, minWidth: 0, lineHeight: 1.55, whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{n.title}</span>
                        <span style={{ flexShrink: 0, fontSize: '13px', color: G400, paddingTop: '2px' }}>↗</span>
                      </a>
                    ))}
                  </div>
                )
              }

              {/* 추천 태그 */}
              {data.tags.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: '11px', color: '#B05A00', fontWeight: 700 }}>뉴스 동향에서 뽑은 이번 주 추천 태그</span>
                  {data.tags.map((tag, i) => (
                    <span key={i} style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: ORANGE, background: 'rgba(255,122,0,.12)', padding: '3px 10px', borderRadius: '4px' }}>#{tag}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '14px', fontFamily: MONO, fontSize: '11px', color: '#C07840', textAlign: 'right' }}>
                네이버 뉴스 검색 기준
              </div>
            </div>

          </div>
        )}

        {/* ── 에러 상태 ── */}
        {!loading && !data && (
          <div style={{ background: 'rgba(0,0,0,0.04)', padding: '26px 24px', color: '#555', fontSize: '14px', fontFamily: MONO }}>
            트렌드 데이터를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}

/* ══ 다음달 리포트 예고 ════════════════════════════════════════ */
function NextMonthSection({ report, date, generatedAt, isChannelReport = false }: { report: ManusReportJson; date: string; generatedAt: string; isChannelReport?: boolean }) {
  const nextAvailable = (() => {
    const d = new Date(generatedAt);
    d.setDate(d.getDate() + 30);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  })();
  const channelName = report.channel_info?.channel_name ?? "채널";
  const kpi1m = report.section7_action_plan?.kpi_targets?.["1_month"];
  const subs  = report.channel_info?.subscribers;
  const uploads = report.section2_growth_metrics?.growth_trend?.monthly_upload_last_30d;

  const items = [
    {
      color: LIME,
      label: "UPLOAD ROUTINE",
      title: "업로드 루틴 정착 여부",
      desc: uploads != null && uploads < 4
        ? `현재 월 ${uploads}건 → 목표 4건 이상 달성 여부 추적`
        : "업로드 일관성 지표 변화 추적",
    },
    {
      color: ORANGE,
      label: "A/B TEST RESULT",
      title: "콘텐츠 성과 비교 분석",
      desc: "이번 달 실행 계획 기반 영상 성과 vs 기존 평균 비교",
    },
    {
      color: "#88CCFF",
      label: "SUBSCRIBER GOAL",
      title: kpi1m?.subscribers != null ? `구독자 ${fmt(kpi1m.subscribers)}명 달성 여부` : "구독자 목표 달성 여부",
      desc: subs != null && kpi1m?.subscribers != null
        ? `현재 ${fmt(subs)}명 → 목표 ${fmt(kpi1m.subscribers)}명 (${((kpi1m.subscribers - subs) / subs * 100).toFixed(1)}% 성장 필요)`
        : "다음 달 구독자 성장 목표 달성 추적",
    },
  ];

  return (
    <section className="rpt-section" style={{ background: "#111111" }}>
      <div className="rpt-wrap">
        <div style={{ fontFamily: MONO, fontSize: "12px", color: "#777", letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ display: "block", width: "28px", height: "1px", background: "#555" }} />Next Month Preview
        </div>
        <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: "8px", color: "#fff", fontFamily: SANS }}>다음달 리포트 예고</h2>
        <p style={{ fontSize: "16px", color: "#888", marginBottom: "32px" }}>{channelName} 채널의 다음 분석 리포트 추적 항목을 미리 확인하세요.</p>

        {/* 3열 그리드 (원본 HTML 기준) */}
        <div className="g-preview3" style={{ background: "#1E1E1E", border: `1px solid #1E1E1E`, marginBottom: "24px" }}>
          {items.map((p, i) => (
            <div key={i} style={{ background: "#161616", padding: "26px 24px", borderLeft: `3px solid ${p.color}` }}>
              <div style={{ fontFamily: MONO, fontSize: "11px", color: p.color, letterSpacing: "2px", marginBottom: "8px", fontWeight: 700 }}>{p.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#EEEEEE", marginBottom: "6px", fontFamily: SANS }}>{p.title}</div>
              <div style={{ fontSize: "14px", color: "#888", lineHeight: 1.7 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "18px 22px", border: `1px solid #2A2A2A`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "12px", color: "#888", marginBottom: "3px" }}>다음 리포트 발행 예정</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#EEEEEE" }}>다음 리포트 신청일: {nextAvailable} 이후</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: "12px", color: "#888", textAlign: "right" }}>
            현재 리포트: {date}
            {!isChannelReport && <><br /><span style={{ color: "#888" }}>Free | Creator | Pro</span></>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══ MAIN ════════════════════════════════════════════════════ */
export default function ReportView({ report, generatedAt, reportId, isChannelReport: isChannelReportProp = false }: Props) {
  const date = new Date(generatedAt)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit" })
    .replace(". ", ".").replace(".", "년 ").replace(".", "월");
  const [copied, setCopied] = useState(false);
  const [isChannelReport, setIsChannelReport] = useState(isChannelReportProp);

  useEffect(() => {
    setIsChannelReport(window.location.hostname.includes("channelreport"));
  }, []);

  const brandName = isChannelReport ? "Channel Report" : "TubeWatch";
  const brandMark = isChannelReport ? "" : "™";

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .report-root{font-family:'Inter','Noto Sans KR',sans-serif;background:#fff;color:#0D0D0D;line-height:1.7;-webkit-font-smoothing:antialiased}
        .rpt-wrap{max-width:1100px;margin:0 auto;padding:0 48px}
        .rpt-hero-pad{padding:64px 48px 0}
        .rpt-section{padding:72px 0}
        .g-hero-head{display:grid;grid-template-columns:1fr auto;gap:48px;align-items:center;padding-bottom:36px}
        .g-kpi-lg{display:grid;grid-template-columns:1fr 1fr;gap:1px}
        .g-kpi-sm{display:grid;grid-template-columns:repeat(6,1fr);gap:1px}
        .g-sw{display:grid;grid-template-columns:1fr 1fr;gap:2px}
        .g-metrics{display:grid;grid-template-columns:repeat(3,1fr)}
        .g-signals{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
        .g-pattern{display:grid;grid-template-columns:48px 1fr 1fr;overflow:hidden}
        .g-pattern-body{border-right:1px solid #E8E8E8}
        .g-pattern-interp{border-left:3px solid #AAFF00}
        .g-dna2{display:grid;grid-template-columns:1fr 1fr;gap:2px}
        .g-plans2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
        .g-plans-single{grid-template-columns:1fr}
        .g-series2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
        .g-kpi-goal{display:grid;grid-template-columns:repeat(4,1fr);gap:1px}
        .g-preview3{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
        .rpt-tabs{display:flex;border-bottom:2px solid #E8E8E8;margin-bottom:24px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .rpt-tabs::-webkit-scrollbar{display:none}
        .rpt-nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-bottom:1px solid #E8E8E8;display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:58px}
        @media(max-width:900px){
          .rpt-wrap,.rpt-hero-pad{padding-left:28px;padding-right:28px}
          .rpt-hero-pad{padding-top:48px}
          .rpt-nav{padding:0 28px}
          .g-kpi-sm{grid-template-columns:repeat(3,1fr)}
          .g-metrics{grid-template-columns:repeat(2,1fr)}
          .g-signals{grid-template-columns:1fr}
          .g-kpi-goal{grid-template-columns:repeat(2,1fr)}
          .g-preview3{grid-template-columns:1fr}
        }
        @media(max-width:640px){
          .rpt-wrap,.rpt-hero-pad{padding-left:16px;padding-right:16px}
          .rpt-hero-pad{padding-top:32px}
          .rpt-section{padding:48px 0}
          .rpt-nav{padding:0 16px;height:auto;min-height:52px;flex-wrap:wrap;padding-top:8px;padding-bottom:8px;gap:8px}
          .rpt-nav-label{display:none}
          .g-hero-head{grid-template-columns:1fr;gap:20px}
          .g-kpi-lg{grid-template-columns:1fr}
          .g-kpi-sm{grid-template-columns:repeat(2,1fr)}
          .g-sw{grid-template-columns:1fr}
          .g-metrics{grid-template-columns:1fr}
          .g-pattern{grid-template-columns:36px 1fr}
          .g-pattern-interp{grid-column:1/-1;border-left:3px solid #AAFF00;border-top:1px solid #E8E8E8}
          .g-pattern-body{border-right:none}
          .g-dna2{grid-template-columns:1fr}
          .g-plans2{grid-template-columns:1fr}
          .g-series2{grid-template-columns:1fr}
          .g-kpi-goal{grid-template-columns:repeat(2,1fr)}
          .g-preview3{grid-template-columns:1fr}
        }
        @keyframes score-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        .score-box-float { animation: score-float 3s ease-in-out infinite; }
        @keyframes trend-pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes trend-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .trend-fadein { animation: trend-fadein .45s ease-out both; }
        .g-trend3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.g-trend3{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.g-trend3{grid-template-columns:1fr}}
      `}</style>

      <div className="report-root">
        <nav className="rpt-nav">
          <a href="#" style={{ fontWeight: 900, fontSize: "19px", letterSpacing: "-.5px", color: BLK, textDecoration: "none", cursor: "pointer" }}>
            {brandName}{brandMark && <span style={{ color: LIME }}>{brandMark}</span>}
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span className="rpt-nav-label" style={{ fontFamily: MONO, fontSize: "14px", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>{isChannelReport ? "Strategy Report" : "Monthly Report"}</span>
            {!isChannelReport && (
              <span className="rpt-nav-label" style={{ fontFamily: MONO, fontSize: "13px", fontWeight: 300 }}>{date} · Free | Creator | Pro</span>
            )}
            <button onClick={handleShare} style={{ fontFamily: MONO, fontSize: "13px", fontWeight: 700, letterSpacing: ".5px", padding: "8px 18px", border: `1px solid ${BLK}`, borderRadius: "3px", background: copied ? "#22c55e" : BLK, color: "#fff", cursor: "pointer", whiteSpace: "nowrap", transition: "background .2s" }}
              onMouseEnter={e => { if (!copied) e.currentTarget.style.opacity = ".7"; }}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              {copied ? "✓ 링크 복사됨" : "↗ 리포트 공유"}
            </button>
          </div>
        </nav>

        <HeroSection        info={report.channel_info} scorecard={report.section1_scorecard} growth={report.section2_growth_metrics} signals={report.section3_data_signals} date={date} />
        <GrowthSection      data={report.section2_growth_metrics} scorecard={report.section1_scorecard} />
        <hr style={{ border: "none", borderTop: `1px solid ${G200}`, margin: 0 }} />
        <DataSignalsSection data={report.section3_data_signals} growth={report.section2_growth_metrics} patterns={report.section4_channel_patterns} />
        <ChannelPatternsSection data={report.section4_channel_patterns} />
        <hr style={{ border: "none", borderTop: `1px solid ${G200}`, margin: 0 }} />
        <ChannelDNASection  data={report.section5_channel_dna} scorecard={report.section1_scorecard} />
        <ContentPlansSection data={report.section6_content_plans} signals={report.section3_data_signals} />
        <hr style={{ border: "none", borderTop: `1px solid ${G200}`, margin: 0 }} />
        <ActionPlanSection  report={report} />
        {!isChannelReport && <NextTrendSection report={report} />}
        <NextMonthSection   report={report} date={date} generatedAt={generatedAt} isChannelReport={isChannelReport} />

        <footer style={{ background: "#0A0A0A", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <a href="#" style={{ fontWeight: 900, fontSize: "16px", color: "#fff", textDecoration: "none", cursor: "pointer" }}>
            {brandName}{brandMark && <span style={{ color: LIME }}>{brandMark}</span>}
          </a>
          <div style={{ fontFamily: MONO, fontSize: "12px", color: "#888", textAlign: "right", lineHeight: 1.8 }}>
            {!isChannelReport && <>분석 기준일: {report.channel_info?.analysis_date ?? date} · 채널 분석 엔진 v2.1<br /></>}
            © 2026 {brandName}. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
