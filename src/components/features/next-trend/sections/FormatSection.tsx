"use client"

import { cn } from "@/lib/utils"
import { Play, Zap, RefreshCw, ExternalLink } from "lucide-react"

interface FormatItem {
  id: string
  headline: string
  seriesPotential: boolean
  seconds: number
  minutes: number
  shortPct: number
  longPct: number
  approach: string
  approachKeywords: { text: string; type: "signal" | "action" }[]
  internalFit: number
  basedOn: string
}

interface NextTrendFormatSectionProps {
  data: FormatItem[]
}

// ── 원형 시간 게이지 ─────────────────────────────────────────────────────────
function TimeGauge({ minutes, seconds }: { minutes: number; seconds: number }) {
  const percentage = Math.min((minutes / 30) * 100, 100)
  const circumference = 2 * Math.PI * 38
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle
            cx="48" cy="48" r="38"
            fill="none"
            className="stroke-muted/40"
            strokeWidth="6"
          />
          <circle
            cx="48" cy="48" r="38"
            fill="none"
            className="stroke-foreground/70 dark:stroke-foreground/60"
            strokeWidth="6"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
            {minutes > 0 ? minutes : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">분</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">권장 길이</p>
        {seconds > 0 && (
          <p className="text-sm font-semibold tabular-nums text-foreground/80">
            {seconds.toLocaleString("ko-KR")}초
          </p>
        )}
      </div>
    </div>
  )
}

// ── 포맷 분포 바 ─────────────────────────────────────────────────────────────
function LengthDistributionBar({ short, long }: { short: number; long: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Play className="h-3 w-3 fill-current" />
        <span className="font-medium">포맷 분포</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
        <div
          className="h-full bg-sky-300 dark:bg-sky-600/60 transition-all duration-500"
          style={{ width: `${short}%` }}
        />
        <div
          className="h-full bg-foreground/60 dark:bg-foreground/40 transition-all duration-500"
          style={{ width: `${long}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>짧은 편 {short}%</span>
        <span>긴 편 {long}%</span>
      </div>
    </div>
  )
}

// ── 내부 적합도 게이지 ───────────────────────────────────────────────────────
function FitScoreGauge({ score }: { score: number }) {
  const filled = Math.round(score / 10)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Zap className="h-3 w-3" />
        <span className="font-medium">내부 적합도</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-4 h-5 rounded-sm transition-all duration-300",
                idx < filled
                  ? "bg-foreground/80 dark:bg-foreground/70"
                  : "bg-muted/50 dark:bg-muted/30"
              )}
            />
          ))}
        </div>
        <span className="text-lg font-semibold text-foreground tabular-nums">{score}%</span>
      </div>
    </div>
  )
}

// ── 전개 방식 키워드 하이라이트 ──────────────────────────────────────────────
function ApproachText({ text, keywords }: {
  text: string
  keywords: { text: string; type: "signal" | "action" }[]
}) {
  if (keywords.length === 0) return <>{text}</>

  const parts: { content: string; type: "normal" | "signal" | "action" }[] = []
  let remaining = text
  let offset = 0

  // 키워드를 텍스트 내 위치 순으로 정렬
  const sorted = [...keywords]
    .map(kw => ({ ...kw, index: text.indexOf(kw.text) }))
    .filter(kw => kw.index !== -1)
    .sort((a, b) => a.index - b.index)

  for (const kw of sorted) {
    const relIdx = kw.index - offset
    if (relIdx < 0) continue
    if (relIdx > 0) parts.push({ content: remaining.slice(0, relIdx), type: "normal" })
    parts.push({ content: kw.text, type: kw.type })
    remaining = remaining.slice(relIdx + kw.text.length)
    offset = kw.index + kw.text.length
  }
  if (remaining) parts.push({ content: remaining, type: "normal" })

  return (
    <>
      {parts.map((p, i) =>
        p.type === "normal" ? (
          <span key={i}>{p.content}</span>
        ) : (
          <span
            key={i}
            className={cn(
              "px-1.5 py-0.5 rounded font-medium",
              p.type === "signal"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                : "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
            )}
          >
            {p.content}
          </span>
        )
      )}
    </>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function NextTrendFormatSection({ data }: NextTrendFormatSectionProps) {
  return (
    <div className="space-y-3">
      {data.map((fmt) => (
        <div key={fmt.id} className="rounded-xl border border-border overflow-hidden">
          {/* 헤드라인 + 배지 */}
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <p className="text-sm font-medium leading-snug">{fmt.headline}</p>
            {fmt.seriesPotential && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-slate-50 dark:bg-slate-950/30 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">
                <RefreshCw className="h-3 w-3" />
                시리즈 가능
              </span>
            )}
          </div>

          {/* 시간 게이지 + 분포·적합도 */}
          <div className="grid grid-cols-12 divide-x divide-border border-t border-b border-border">
            <div className="col-span-4 flex items-center justify-center py-5">
              <TimeGauge minutes={fmt.minutes} seconds={fmt.seconds} />
            </div>
            <div className="col-span-8 flex flex-col justify-center gap-5 px-5 py-5">
              <LengthDistributionBar short={fmt.shortPct} long={fmt.longPct} />
              <FitScoreGauge score={fmt.internalFit} />
            </div>
          </div>

          {/* 전개 방식 */}
          <div className="bg-muted/20 px-5 py-4">
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">전개 방식</p>
            <p className="text-sm leading-relaxed">
              <ApproachText text={fmt.approach} keywords={fmt.approachKeywords} />
            </p>
          </div>

          {/* 출처 */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-t border-border">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{fmt.basedOn}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
