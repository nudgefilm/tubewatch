"use client"

import Link from "next/link"
import {
  ArrowRight,
  Search,
  Type,
  FileText,
  Tags,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

// Mock data - in real app, this would come from analysis results
const hasAnalysisData = true

const seoScore = 68

const keywordData = [
  { keyword: "youtube 성장", count: 24 },
  { keyword: "알고리즘", count: 18 },
  { keyword: "쇼츠 전략", count: 15 },
  { keyword: "구독자 늘리기", count: 12 },
  { keyword: "조회수 올리기", count: 10 },
  { keyword: "유튜브 수익화", count: 8 },
  { keyword: "썸네일 제작", count: 7 },
  { keyword: "영상 편집", count: 6 },
]

const titleOptimization = {
  averageLength: 42,
  recommendedLength: "30~60자",
  patterns: [
    { title: "숫자 + 핵심 키워드 조합", example: "조회수 10배 올리는 3가지 방법", performance: "높음" },
    { title: "질문형 제목", example: "왜 당신의 영상은 추천되지 않을까?", performance: "높음" },
    { title: "방법/팁 제시형", example: "초보 유튜버가 꼭 알아야 할 5가지", performance: "보통" },
  ],
}

const descriptionOptimization = {
  averageLength: 156,
  recommendedStructure: [
    "첫 1~2줄: 영상 핵심 내용 요약",
    "3~5줄: 상세 설명 및 타임스탬프",
    "하단: 관련 링크 및 SNS 정보",
  ],
  firstLineImportance: "검색 결과와 추천 영상에서 첫 1~2줄만 노출되므로 핵심 내용을 반드시 포함해야 합니다.",
}

const tagData = [
  { tag: "유튜브", size: "large" },
  { tag: "성장전략", size: "large" },
  { tag: "알고리즘", size: "medium" },
  { tag: "쇼츠", size: "medium" },
  { tag: "구독자", size: "medium" },
  { tag: "조회수", size: "small" },
  { tag: "수익화", size: "small" },
  { tag: "썸네일", size: "small" },
  { tag: "편집", size: "small" },
  { tag: "초보유튜버", size: "small" },
]

const recommendations = [
  {
    id: 1,
    type: "warning",
    text: "제목에 핵심 키워드를 앞부분에 포함하세요",
    detail: "현재 영상의 32%만 제목 앞부분에 키워드가 포함되어 있습니다.",
  },
  {
    id: 2,
    type: "warning",
    text: "설명 첫 줄에 영상 주제를 명확히 작성하세요",
    detail: "설명란 첫 줄이 비어있거나 불명확한 영상이 45% 입니다.",
  },
  {
    id: 3,
    type: "info",
    text: "관련 태그를 5개 이상 추가하세요",
    detail: "평균 태그 수가 3.2개로 권장 수준(8~15개)보다 적습니다.",
  },
  {
    id: 4,
    type: "success",
    text: "제목 길이가 적절합니다",
    detail: "평균 제목 길이 42자로 권장 범위(30~60자) 내에 있습니다.",
  },
]

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-600"
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-rose-500"
}

function getTagSize(size: string): string {
  switch (size) {
    case "large":
      return "text-lg px-4 py-2"
    case "medium":
      return "text-base px-3 py-1.5"
    default:
      return "text-sm px-2.5 py-1"
  }
}

function SEOScoreCard() {
  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle>SEO 점수</CardTitle>
        <CardDescription>채널 SEO 최적화 수준</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className={`text-6xl font-bold ${getScoreColor(seoScore)}`}>
          {seoScore}
        </div>
        <span className="mt-1 text-sm text-muted-foreground">/ 100</span>
        <div className="mt-4 w-full max-w-[200px]">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(seoScore)}`}
              style={{ width: `${seoScore}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KeywordAnalysisCard() {
  const maxCount = Math.max(...keywordData.map((k) => k.count))
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Search className="size-5" />
          </div>
          <div>
            <CardTitle>핵심 키워드 분석</CardTitle>
            <CardDescription>채널 영상에서 자주 사용되는 키워드</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywordData.map((item) => {
            const intensity = item.count / maxCount
            const bgOpacity = Math.round(intensity * 100)
            return (
              <Badge
                key={item.keyword}
                variant="outline"
                className="cursor-default transition-colors hover:bg-primary/10"
                style={{
                  backgroundColor: `hsl(var(--primary) / ${bgOpacity * 0.15})`,
                }}
              >
                {item.keyword}
                <span className="ml-1.5 text-xs text-muted-foreground">({item.count})</span>
              </Badge>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TitleOptimizationCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Type className="size-5" />
          </div>
          <div>
            <CardTitle>제목 최적화</CardTitle>
            <CardDescription>영상 제목 길이 및 구조 분석</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">평균 제목 길이</p>
            <p className="mt-1 text-2xl font-semibold">{titleOptimization.averageLength}자</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">추천 제목 길이</p>
            <p className="mt-1 text-2xl font-semibold">{titleOptimization.recommendedLength}</p>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-medium">조회수 높은 영상 제목 패턴</h4>
          <div className="space-y-3">
            {titleOptimization.patterns.map((pattern, index) => (
              <div key={index} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pattern.title}</span>
                  <Badge
                    variant="outline"
                    className={
                      pattern.performance === "높음"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    성과: {pattern.performance}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">예: {pattern.example}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DescriptionOptimizationCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="size-5" />
          </div>
          <div>
            <CardTitle>설명란 최적화</CardTitle>
            <CardDescription>영상 설명 길이 및 구조 분석</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium text-muted-foreground">평균 설명 길이</p>
          <p className="mt-1 text-2xl font-semibold">{descriptionOptimization.averageLength}자</p>
        </div>
        <div>
          <h4 className="mb-3 font-medium">추천 설명 구조</h4>
          <ul className="space-y-2">
            {descriptionOptimization.recommendedStructure.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">설명란 첫 문장 중요도</p>
          <p className="mt-1 text-sm text-amber-700">
            {descriptionOptimization.firstLineImportance}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function TagAnalysisCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Tags className="size-5" />
          </div>
          <div>
            <CardTitle>태그 분석</CardTitle>
            <CardDescription>자주 사용되는 태그</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-center gap-3 py-4">
          {tagData.map((tag) => (
            <span
              key={tag.tag}
              className={`rounded-full bg-muted font-medium transition-colors hover:bg-primary/10 ${getTagSize(tag.size)}`}
            >
              #{tag.tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendationsCard() {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Lightbulb className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>SEO 개선 제안</CardTitle>
            <CardDescription>검색 노출을 높이기 위한 개선점</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recommendations.map((rec) => (
            <li key={rec.id} className="rounded-lg bg-background p-4">
              <div className="flex items-start gap-3">
                {rec.type === "warning" && (
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                )}
                {rec.type === "info" && (
                  <TrendingUp className="mt-0.5 size-5 shrink-0 text-blue-500" />
                )}
                {rec.type === "success" && (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                )}
                <div>
                  <p className="font-medium">{rec.text}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{rec.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Empty className="border min-h-[400px]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search className="size-6" />
        </EmptyMedia>
        <EmptyTitle>분석 데이터가 없습니다</EmptyTitle>
        <EmptyDescription>
          채널 분석을 먼저 완료하면 SEO 분석을 확인할 수 있습니다
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/channels">
            채널 분석하러 가기
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export default function SeoLabPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">SEO 랩</h1>
          <p className="mt-1 text-muted-foreground">
            영상 제목, 설명, 태그를 분석하여 SEO 개선 포인트를 제공합니다
          </p>
        </div>

        {!hasAnalysisData ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* SEO Score */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <SEOScoreCard />
              </div>
            </div>

            {/* Keyword Analysis */}
            <KeywordAnalysisCard />

            {/* Title & Description Optimization */}
            <div className="grid gap-6 lg:grid-cols-2">
              <TitleOptimizationCard />
              <DescriptionOptimizationCard />
            </div>

            {/* Tag Analysis */}
            <TagAnalysisCard />

            {/* Recommendations */}
            <RecommendationsCard />
          </div>
        )}
      </div>
    </div>
  )
}
