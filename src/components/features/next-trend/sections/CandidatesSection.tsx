"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Antenna } from "lucide-react"
import { EvidenceBlock } from "@/components/common/EvidenceBlock"
import type { TrendCandidate } from "@/mocks/next-trend"

interface NextTrendCandidatesSectionProps {
  data: TrendCandidate[]
}

const signalStrengthBadgeConfig = {
  clear: { label: "반복 신호 확인됨", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: false },
  medium: { label: "신호감지", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: true },
  low: { label: "표본 부족", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: false },
}

function feasibilityHint(feasibility: number): string {
  if (feasibility >= 76) return "기존 포맷 유지 시 바로 적용 가능"
  if (feasibility >= 60) return "약간의 준비로 시작 가능"
  return "추가 리소스 필요"
}

type RankTier = "primary" | "secondary" | "experimental"
function rankTier(index: number): RankTier {
  if (index === 0) return "primary"
  if (index < 3) return "secondary"
  return "experimental"
}

const tierCardClass: Record<RankTier, string> = {
  primary: "border-primary/40 bg-primary/5 dark:bg-primary/10",
  secondary: "border-border bg-card",
  experimental: "border-dashed border-muted-foreground/30 bg-muted/20",
}

const tierRankClass: Record<RankTier, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-primary/10 text-primary",
  experimental: "bg-muted text-muted-foreground",
}

export function NextTrendCandidatesSection({ data }: NextTrendCandidatesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>내부 신호 기반 다음 시도 후보</CardTitle>
        </div>
        <CardDescription>
          채널 내부 반복 신호에서 도출한 시도 가능 주제 — 1순위부터 순서대로 결정하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((candidate, index) => {
            const tier = rankTier(index)
            const badge = signalStrengthBadgeConfig[candidate.signalStrength]
            return (
              <div
                key={candidate.id}
                className={`rounded-lg border p-4 transition-colors hover:brightness-[0.97] ${tierCardClass[tier]}`}
              >
                <div className="flex items-start gap-3">
                  {/* 순위 뱃지 */}
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5 ${tierRankClass[tier]}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* 주제 후보 */}
                    <h4 className={`font-semibold leading-snug ${tier === "primary" ? "text-base" : "text-sm"}`}>
                      {candidate.topic}
                    </h4>

                    {/* 신호 강도 뱃지 */}
                    <Badge variant="outline" className={`text-xs ${badge.className}`}>
                      {badge.icon && <Antenna className="mr-1 h-3 w-3 shrink-0" />}
                      {badge.label}
                    </Badge>

                    {/* 추천 이유 */}
                    <p className="text-sm text-muted-foreground">{candidate.reason}</p>

                    {/* 예상 변화 */}
                    {candidate.expectedEffect && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                        <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" />
                        {candidate.expectedEffect}
                      </p>
                    )}

                    {/* Evidence — ViewModel에서 생성한 근거 항목 */}
                    {(candidate.evidence ?? []).length > 0 && (
                      <EvidenceBlock items={candidate.evidence!} />
                    )}

                    {/* 실행 가능성 — 해석 문장 우선, % 보조 */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-foreground/80">
                        {feasibilityHint(candidate.feasibility)}{" "}
                        <span className="font-normal text-muted-foreground">({candidate.feasibility}%)</span>
                      </p>
                      <Progress value={candidate.feasibility} className="h-1 max-w-[120px]" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
