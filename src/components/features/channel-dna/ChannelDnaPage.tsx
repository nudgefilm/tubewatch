"use client"

import { Dna, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DnaStructureSummarySection } from "./sections/StructureSummarySection"
import { DnaPatternAnalysisSection } from "./sections/PatternAnalysisSection"
import { DnaCardsSection } from "./sections/CardsSection"
import { DnaVisualizationSection } from "./sections/VisualizationSection"
import { channelDnaData } from "./mock-data"

interface ChannelDnaPageProps {
  channelId?: string
}

export function ChannelDnaPage({ channelId = "" }: ChannelDnaPageProps) {
  console.log("[v0] ChannelDnaPage rendering with channelId:", channelId)
  console.log("[v0] channelDnaData:", channelDnaData)
  const data = channelDnaData

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 페이지 헤더 */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Dna className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Channel DNA</h1>
            <p className="text-sm text-muted-foreground">
              채널 성과가 발생하는 구조를 해석합니다
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <span>최근 분석: 2024년 1월 15일</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {channelId}
          </Badge>
        </div>
      </header>

      {/* A. 성과 구조 요약 */}
      <DnaStructureSummarySection data={data.structureSummary} />

      {/* B. 반복 패턴 분석 */}
      <DnaPatternAnalysisSection data={data.patternAnalysis} />

      {/* C. DNA 카드 */}
      <DnaCardsSection data={data.dnaCards} />

      {/* D. 시각화 영역 */}
      <DnaVisualizationSection
        data={data.visualization}
        distribution={data.structureSummary.performanceDistribution}
      />
    </div>
  )
}
