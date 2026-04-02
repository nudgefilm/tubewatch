"use client"

import { TrendingUp, Target, Shield, BarChart3, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBar } from "@/components/ui/StatusBar"
import type { ChannelDnaData } from "../mock-data"

// UI 전용: 요약 텍스트의 snake_case 기계어를 자연어로 치환
const SNAKE_TO_KOREAN: Record<string, string> = {
  low_upload_frequency: "업로드 빈도",
  irregular_upload_interval: "업로드 간격",
  high_view_variance: "조회수 변동성",
  short_video_dominant: "쇼츠 중심 구조",
  long_video_dominant: "롱폼 영상 중심",
  medium_video_dominant: "중간 길이 영상",
  consistent_upload: "업로드 주기 안정",
  title_keyword_repetition: "제목 키워드 반복",
  high_ctr: "높은 클릭율",
  low_retention: "낮은 시청 유지율",
  high_engagement: "높은 참여율",
  low_seo_score: "SEO 최적화 부족",
  thumbnail_inconsistency: "썸네일 일관성 부족",
  repeated_topic_pattern: "특정 주제 반복 패턴",
}

function sanitizeSummaryText(text: string): string {
  let result = Object.entries(SNAKE_TO_KOREAN).reduce(
    (acc, [key, val]) => acc.replaceAll(key, val),
    text
  )
  // ".,  " → ". " : 마침표 바로 뒤 쉼표 제거
  result = result.replace(/\.,\s*/g, ". ")
  // ". ,  " → ". " : 마침표+공백 뒤 쉼표 제거
  result = result.replace(/\.\s+,\s*/g, ". ")
  // 끝 쉼표 제거
  result = result.replace(/,\s*$/, "").trim()
  return result
}

/**
 * 마침표 기준으로 문장을 분리한 뒤,
 * 섹션 마커를 "포함하는 문장"이 나타나면 새 단락을 시작한다.
 *
 * "업로드 빈도, 업로드 간격 개선이 필요한 부분 —" 처럼
 * 마커 앞에 레이블이 붙어 있어도 해당 문장 전체가 새 단락의 첫 줄이 된다.
 */
function splitSummaryIntoSections(text: string): string[] {
  const SECTION_MARKERS = [
    "반복 확인된 강점 패턴 —",
    "개선이 필요한 부분 —",
  ]

  // 마침표 기준 문장 분리 + 선행 쉼표/공백 제거
  const sentences = text
    .split(/(?<=\.)\s+/)
    .map((s) => s.replace(/^[,\s]+/, "").trim())
    .filter(Boolean)

  // 섹션 마커를 포함하는 문장이 오면 새 단락 시작
  const sections: string[] = []
  let current: string[] = []

  for (const sentence of sentences) {
    const isNewSection = SECTION_MARKERS.some((m) => sentence.includes(m))
    if (isNewSection && current.length > 0) {
      sections.push(current.join(" "))
      current = [sentence]
    } else {
      current.push(sentence)
    }
  }
  if (current.length > 0) sections.push(current.join(" "))

  return sections.filter(Boolean)
}

interface DnaStructureSummarySectionProps {
  data: ChannelDnaData["structureSummary"]
}

export function DnaStructureSummarySection({ data }: DnaStructureSummarySectionProps) {
  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case "안정":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "불안정":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "취약":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* 히트 영상 의존도 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              히트 영상 의존도
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {data.hitDependency != null ? (
              <StatusBar
                label="의존도"
                score={data.hitDependency}
                hint={
                  data.hitDependency < 50
                    ? "조회가 여러 영상에 분산되는 경향이 나타납니다"
                    : "조회가 일부 히트 영상에 집중되는 구조로 볼 수 있습니다"
                }
              />
            ) : (
              <>
                <div className="h-2 w-full rounded-full bg-muted" />
                <p className="text-xs text-muted-foreground">
                  분석 데이터가 충분하지 않아 수집 중입니다.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 성장 방식 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              성장 방식
            </CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold leading-tight">{data.growthType}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.growthAxis.map((axis) => (
                <Badge key={axis} variant="secondary" className="text-xs">
                  {axis}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 구조 안정성 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              구조 안정성
            </CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={getStabilityColor(data.structureStability)}>
                {data.structureStability}
              </Badge>
            </div>
            <StatusBar
              label="안정성 점수"
              score={data.structureStabilityScore}
              hint={
                data.structureStabilityScore >= 70
                  ? "성과 구조가 안정적으로 유지되는 경향이 나타납니다"
                  : data.structureStabilityScore >= 40
                  ? "성과 변동성이 존재하며 일부 구간 최적화가 필요한 구조입니다"
                  : "성과 구조가 불안정하여 포맷 정규화가 시급한 가능성이 높습니다"
              }
            />
          </CardContent>
        </Card>

        {/* 성과 분포 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              성과 분포
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.performanceDistribution.length > 0 ? (
              <>
                <div className="flex h-12 items-end gap-1">
                  {data.performanceDistribution.map((item) => (
                    <div
                      key={item.range}
                      className="flex-1 rounded-t bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${item.percentage * 1.2}%` }}
                      title={`${item.range}: ${item.count}개 (${item.percentage}%)`}
                    />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>50K+</span>
                </div>
              </>
            ) : (
              <div className="flex h-12 items-center">
                <p className="text-sm font-medium text-muted-foreground">미산출</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* 주제 일관성 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              주제 일관성
            </CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topicConsistency ? (
              <>
                <div className="text-lg font-bold leading-tight">{data.topicConsistency.label}</div>
                {data.topicConsistency.score != null && (
                  <StatusBar
                    label="일관성 점수"
                    score={data.topicConsistency.score}
                    hint={
                      data.topicConsistency.score >= 65
                        ? "반복 주제 패턴이 안정적으로 유지되고 있는 구조입니다"
                        : data.topicConsistency.score >= 45
                          ? "주제 범위가 혼재되어 집중도가 더 굳어질 여지가 있습니다"
                          : "콘텐츠 주제 편차가 커서 채널 정체성이 분산된 구조입니다"
                    }
                  />
                )}
              </>
            ) : (
              <div className="flex h-12 items-center">
                <p className="text-sm font-medium text-muted-foreground">미산출</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 요약 카드 */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 pb-5 px-5">
          <p className="text-sm font-semibold text-foreground/90 mb-3">
            구조 분석 요약
          </p>
          <div className="space-y-4">
            {splitSummaryIntoSections(sanitizeSummaryText(data.summaryText)).map(
              (section, i) => (
                <p key={i} className="text-sm leading-7 text-foreground/80">
                  {section}
                </p>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
