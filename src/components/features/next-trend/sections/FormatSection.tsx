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
            strokeWidth="7"
            style={{ stroke: "oklch(var(--muted-foreground))", opacity: 0.2 }}
          />
          <circle
            cx="48" cy="48" r="38"
            fill="none"
            strokeWidth="7"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            style={{ stroke: "oklch(var(--foreground))", transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
            {minutes > 0 ? minutes : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">분</span>
        </div>
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-[10px] text-muted-foreground">권장 길이</p>
        {seconds > 0 && (
          <p className="text-sm font-semibold tabular-nums text-foreground/80">
            {seconds.toLocaleString()}<span className="text-xs font-normal ml-0.5">초</span>
          </p>
        )}
      </div>
    </div>
  )
}

// ── 포맷 분포 바 ─────────────────────────────────────────────────────────────
function LengthDistributionBar({ short, long }: { short: number; long: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Play className="h-3 w-3 fill-current" />
        <span className="font-medium">포맷 분포</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-sky-400 dark:bg-sky-500 transition-all duration-500"
          style={{ width: `${short}%` }}
        />
        <div
          className="h-full bg-slate-500 dark:bg-slate-400 transition-all duration-500"
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
  const filledSegments = Math.round(score / 10)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                idx < filledSegments
                  ? "bg-foreground"
                  : "bg-slate-200 dark:bg-slate-700"
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
function ApproachText({
  text,
  keywords,
}: {
  text: string
  keywords: { text: string; type: "signal" | "action" }[]
}) {
  if (!keywords.length) return <>{text}</>

  const sorted = [...keywords]
    .map(kw => ({ ...kw, pos: text.indexOf(kw.text) }))
    .filter(kw => kw.pos >= 0)
    .sort((a, b) => a.pos - b.pos)

  const nodes: React.ReactNode[] = []
  let cursor = 0

  for (const kw of sorted) {
    if (kw.pos < cursor) continue
    if (kw.pos > cursor) {
      nodes.push(<span key={`t-${cursor}`}>{text.slice(cursor, kw.pos)}</span>)
    }
    nodes.push(
      <span
        key={`k-${kw.pos}`}
        className={cn(
          "px-1.5 py-0.5 rounded font-medium",
          kw.type === "signal"
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            : "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
        )}
      >
        {kw.text}
      </span>
    )
    cursor = kw.pos + kw.text.length
  }
  if (cursor < text.length) {
    nodes.push(<span key="t-end">{text.slice(cursor)}</span>)
  }

  return <>{nodes}</>
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function NextTrendFormatSection({ data }: NextTrendFormatSectionProps) {
  return (
    <div className="space-y-3">
      {data.map((fmt) => (
        <div key={fmt.id} className="rounded-xl border border-border overflow-hidden">

          {/* 헤드라인 + 시리즈 배지 */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
            <p className="text-sm font-medium leading-snug">{fmt.headline}</p>
            {fmt.seriesPotential && (
              <span className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                <RefreshCw className="h-3 w-3" />
                시리즈 가능
              </span>
            )}
          </div>

          {/* 시간 게이지 | 포맷 분포 + 적합도 */}
          <div className="grid grid-cols-12 divide-x divide-border">
            <div className="col-span-4 flex items-center justify-center py-6">
              <TimeGauge minutes={fmt.minutes} seconds={fmt.seconds} />
            </div>
            <div className="col-span-8 flex flex-col justify-center gap-5 px-5 py-5">
              <LengthDistributionBar short={fmt.shortPct} long={fmt.longPct} />
              <FitScoreGauge score={fmt.internalFit} />
            </div>
          </div>

          {/* 전개 방식 */}
          <div className="bg-muted/20 px-5 py-4 border-t border-border">
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
