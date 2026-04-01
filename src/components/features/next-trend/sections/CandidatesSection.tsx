"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp } from "lucide-react"
import { EvidenceBlock } from "@/components/common/EvidenceBlock"
import type { TrendCandidate } from "../mock-data"

interface NextTrendCandidatesSectionProps {
  data: TrendCandidate[]
}

// [3] signalStrength → 행동 연결
function signalAction(strength: "clear" | "medium" | "low"): string {
  if (strength === "clear") return "지금 바로 실행 가능"
  if (strength === "medium") return "2~3편 테스트 후 확장"
  return "탐색 단계, 1편 테스트 권장"
}

// [2] 실행 가능성 해석
function feasibilityHint(feasibility: number): string {
  if (feasibility >= 76) return "기존 포맷 유지 시 바로 적용 가능"
  if (feasibility >= 60) return "약간의 준비로 시작 가능"
  return "추가 리소스 필요"
}

// [3] 후보 역할 라벨
function getTierLabel(index: number): string {
  if (index === 0) return "우선 실행 후보"
  if (index <= 2) return "보조 후보"
  return "탐색 후보"
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
                    {/* [3] 역할 라벨 — 제목 위 */}
                    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${
                      tier === "primary"
                        ? "bg-primary/10 text-primary"
                        : tier === "experimental"
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/60 text-foreground/60"
                    }`}>
                      {getTierLabel(index)}
                    </span>

                    {/* 주제 후보 */}
                    <h4 className={`font-semibold leading-snug ${tier === "primary" ? "text-base" : "text-sm"}`}>
                      {candidate.topic}
                    </h4>

                    {/* [4] 행동 문장 — 주제 바로 아래, 항상 1줄 */}
                    <p className="text-sm font-medium text-foreground/80">
                      {signalAction(candidate.signalStrength)}
                    </p>

                    {/* 추천 이유 */}
                    <p className="text-sm text-muted-foreground">{candidate.reason}</p>

                    {/* Evidence — ViewModel에서 생성한 근거 항목 */}
                    {(candidate.evidence ?? []).length > 0 && (
                      <EvidenceBlock items={candidate.evidence!} />
                    )}

                    {/* [5] 실행 가능성 — 해석 문장 우선, % 보조 */}
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
