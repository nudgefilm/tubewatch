"use client"

import { useState } from "react"
import { CircleCheck, CircleAlert, Fingerprint, AlertTriangle, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DirectionalGauge } from "@/components/ui/DirectionalGauge"
import type { ChannelDnaData } from "@/mocks/channel-dna"

const INITIAL_SHOW = 3

/** 진단 수치나 긴 raw 문장은 null 반환 → 렌더 생략 */
function sanitizeDescription(desc: string): string | null {
  if (/\d+\.?\d*\s*%/.test(desc) || desc.length > 60) return null
  return desc
}

interface DnaCardsSectionProps {
  data: ChannelDnaData["dnaCards"]
}

export function DnaCardsSection({ data }: DnaCardsSectionProps) {
  const [showAllStrengths, setShowAllStrengths] = useState(false)
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false)

  const visibleStrengths = showAllStrengths ? data.strengths : data.strengths.slice(0, INITIAL_SHOW)
  const visibleWeaknesses = showAllWeaknesses ? data.weaknesses : data.weaknesses.slice(0, INITIAL_SHOW)

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "낮음": return "bg-muted text-muted-foreground border-muted"
      case "중간": return "bg-muted text-foreground border-muted"
      case "높음": return "bg-foreground/10 text-foreground border-foreground/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {/* 강점 / 약점 2열 구조 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 강점 패턴 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleCheck className="size-5 text-emerald-500" />
              강점 패턴
              {data.strengths.length > 0 && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {data.strengths.length}개
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleStrengths.map((item) => (
              <div key={item.title} className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="font-medium text-sm">{item.title}</p>
                <DirectionalGauge
                  score={item.score}
                  strengthLabel="강점"
                  weaknessLabel="약점"
                />
                {sanitizeDescription(item.description) && (
                  <p className="text-xs text-muted-foreground">{sanitizeDescription(item.description)}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {data.strengths.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAllStrengths((v) => !v)}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <ChevronDown
                  className={`size-3.5 transition-transform ${showAllStrengths ? "rotate-180" : ""}`}
                />
                {showAllStrengths
                  ? "접기"
                  : `${data.strengths.length - INITIAL_SHOW}개 더 보기`}
              </button>
            )}
          </CardContent>
        </Card>

        {/* 약점 패턴 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-5 text-red-500" />
              약점 패턴
              {data.weaknesses.length > 0 && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {data.weaknesses.length}개
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleWeaknesses.map((item) => (
              <div key={item.title} className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="font-medium text-sm">{item.title}</p>
                <DirectionalGauge
                  score={item.score}
                  strengthLabel="강점"
                  weaknessLabel="약점"
                />
                {sanitizeDescription(item.description) && (
                  <p className="text-xs text-muted-foreground">{sanitizeDescription(item.description)}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {data.weaknesses.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAllWeaknesses((v) => !v)}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <ChevronDown
                  className={`size-3.5 transition-transform ${showAllWeaknesses ? "rotate-180" : ""}`}
                />
                {showAllWeaknesses
                  ? "접기"
                  : `${data.weaknesses.length - INITIAL_SHOW}개 더 보기`}
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 유지 핵심 패턴 & 리스크 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 유지 핵심 패턴 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="size-5 text-primary" />
              유지 핵심 패턴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.corePatterns.map((item) => (
              <div
                key={item.pattern}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <span className="font-medium">{item.pattern}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p>
                </div>
                <Badge
                  variant={item.importance === "핵심" ? "default" : "secondary"}
                  className="ml-2"
                >
                  {item.importance}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 구조 리스크 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-amber-500" />
              구조 리스크
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.risks.map((risk) => (
              <div key={risk.type} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{risk.type}</span>
                  <Badge className={getRiskLevelColor(risk.level)}>{risk.level}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
