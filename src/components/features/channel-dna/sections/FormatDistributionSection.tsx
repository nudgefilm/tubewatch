"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Timer, PieChart as PieChartIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FormatDistributionVm } from "@/lib/channel-dna/internalChannelDnaSummary"

interface FormatDistributionSectionProps {
  data: FormatDistributionVm
  analysisDate?: string | null
}

// ─── 색상 팔레트 ──────────────────────────────────────────────────────────────
const DURATION_COLORS: Record<string, string> = {
  shorts: "hsl(var(--primary))",
  short: "hsl(var(--primary) / 0.65)",
  long: "hsl(var(--primary) / 0.35)",
}

// 카테고리 파이차트 색상 (6가지 구분)
const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.75)",
  "hsl(var(--primary) / 0.55)",
  "hsl(var(--primary) / 0.38)",
  "hsl(220 70% 60%)",
  "hsl(160 55% 50%)",
]

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function DurationTooltip({ active, payload }: { active?: boolean; payload?: { payload: { label: string; subLabel: string; count: number; percentage: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold">{d.label}</p>
      <p className="text-muted-foreground">{d.subLabel}</p>
      <p className="tabular-nums">{d.count}편 · {d.percentage}%</p>
    </div>
  )
}

function CategoryTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { count: number; percentage: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold">{d.name}</p>
      <p className="tabular-nums">{d.payload.count}편 · {d.payload.percentage}%</p>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
function formatAnalysisDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const h = String(d.getHours()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    return `${y}.${mo}.${day} ${h}:${min} 분석 기준`
  } catch {
    return null
  }
}

export function DnaFormatDistributionSection({ data, analysisDate }: FormatDistributionSectionProps) {
  const { durationBuckets, categoryBuckets, hasDurationData, hasCategoryData, sampleSize, midFormGapPercent, categoryPurity } = data
  const maxDurationCount = Math.max(...durationBuckets.map((b) => b.count), 1)

  // 카테고리 1개인 경우 파이차트 표시 의미 없음
  const showPie = hasCategoryData && categoryBuckets.length >= 2

  if (!hasDurationData && !showPie) return null

  const showInsights = (midFormGapPercent != null && midFormGapPercent >= 50) || categoryPurity != null

  return (
    <div className="space-y-4">

      {/* ── 차트 그리드 ──────────────────────────────────────────────────── */}
      <div className={`grid gap-4 ${hasDurationData && showPie ? "lg:grid-cols-2" : ""}`}>

        {/* ── Duration Histogram ─────────────────────────────────────────── */}
        {hasDurationData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Timer className="size-4 text-primary" />영상 길이 분포</CardTitle>
              <p className="text-xs text-muted-foreground">
                표본 {sampleSize}편 기준 — Shorts · 단편 · 장편 비율
              </p>
              {formatAnalysisDate(analysisDate) && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {formatAnalysisDate(analysisDate)}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 수치 요약 배지 */}
              <div className="grid grid-cols-3 gap-2">
                {durationBuckets.map((b) => (
                  <div key={b.label} className="rounded-lg bg-muted/40 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">{b.subLabel}</p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: DURATION_COLORS[b.colorKey] }}>
                      {b.percentage}
                      <span className="text-xs font-normal text-muted-foreground">%</span>
                    </p>
                    <p className="text-[11px] tabular-nums text-muted-foreground">{b.count}편</p>
                  </div>
                ))}
              </div>

              {/* 막대 그래프 */}
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={durationBuckets}
                  margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
                  barSize={40}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}편`}
                    domain={[0, maxDurationCount + 1]}
                  />
                  <Tooltip content={<DurationTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {durationBuckets.map((b) => (
                      <Cell key={b.label} fill={DURATION_COLORS[b.colorKey]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* 해석 문장 */}
              {(() => {
                const dominant = [...durationBuckets].sort((a, b) => b.count - a.count)[0]
                if (!dominant || dominant.count === 0) return null
                const labelMap: Record<string, string> = {
                  shorts: "Shorts(60초 미만) 중심 채널입니다. 알고리즘 노출엔 유리하지만 구독 전환율을 함께 확인하세요.",
                  short: "단편(1~10분) 중심 채널입니다. 정보 전달과 시청 완료율 균형이 좋은 구간입니다.",
                  long: "장편(10분 이상) 중심 채널입니다. 주제 깊이로 차별화되지만 이탈률 관리가 중요합니다.",
                }
                return (
                  <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
                    {labelMap[dominant.colorKey]}
                  </p>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* ── Category Pie Chart ─────────────────────────────────────────── */}
        {showPie && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><PieChartIcon className="size-4 text-primary" />카테고리 분포</CardTitle>
              <p className="text-xs text-muted-foreground">
                표본 기준 카테고리 비중 — 채널 주제 집중도를 확인하세요
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryBuckets}
                    dataKey="percentage"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {categoryBuckets.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* 해석 문장 */}
              {(() => {
                const top = categoryBuckets[0]
                if (!top) return null
                const isFocused = top.percentage >= 70
                return (
                  <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
                    {isFocused
                      ? `'${top.label}' 카테고리 집중도가 ${top.percentage}%입니다. 명확한 주제 정체성이 SEO 일관성에 유리합니다.`
                      : `상위 카테고리 '${top.label}'이 ${top.percentage}%로 분산 구조입니다. 다양한 시청자층을 확보하지만 채널 정체성 강화가 필요할 수 있습니다.`}
                  </p>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── 데이터 인사이트 배너 ──────────────────────────────────────────── */}
      {showInsights && (
        <div className={`grid gap-3 ${midFormGapPercent != null && midFormGapPercent >= 50 && categoryPurity != null ? "sm:grid-cols-2" : ""}`}>

          {/* 미드폼 공백 */}
          {midFormGapPercent != null && midFormGapPercent >= 50 && (
            <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tabular-nums ${midFormGapPercent >= 80 ? "text-rose-600 dark:text-rose-400" : midFormGapPercent >= 60 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{midFormGapPercent}%</span>
                <span className="text-xs font-medium text-muted-foreground">미드폼 공백</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                60초(Shorts)와 10분(Long) 사이 &apos;허리 라인&apos; 영상이 부족합니다. 1~10분 구간을 채우면 알고리즘 노출 다각화에 유리합니다.
              </p>
            </div>
          )}

          {/* 카테고리 일관성 */}
          {categoryPurity != null && (
            <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tabular-nums ${categoryPurity >= 70 ? "text-emerald-600 dark:text-emerald-400" : categoryPurity >= 45 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>{categoryPurity}%</span>
                <span className="text-xs font-medium text-muted-foreground">카테고리 일관성</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {categoryPurity >= 70
                  ? `상위 카테고리 집중도 ${categoryPurity}%. 알고리즘이 채널 정체성을 명확히 인식합니다.`
                  : categoryPurity >= 45
                  ? `카테고리 일관성 ${categoryPurity}%. 주제 집중도를 높이면 알고리즘 추천 정확도가 올라갑니다.`
                  : `카테고리 일관성 ${categoryPurity}%. 알고리즘이 당신의 정체성을 헷갈려 하고 있습니다. (잡탕 채널 주의보)`
                }
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
