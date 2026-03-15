"use client"

import Link from "next/link"
import {
  ArrowRight,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Upload,
  Heart,
  Search,
  Activity,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/v0-final/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/v0-final/components/ui/card"
import { Badge } from "@/v0-final/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/v0-final/components/ui/empty"

// Mock data - in real app, this would come from analysis results
const hasAnalysisData = true

const summaryData = {
  currentPosition: "중상위권",
  strongestArea: "콘텐츠 구조",
  weakestArea: "시청자 반응",
  priorityArea: "SEO 최적화",
  summary: "현재 채널은 콘텐츠 구조는 안정적이지만, 시청자 반응과 업로드 운영 개선이 필요합니다.",
}

const comparisonCards = [
  {
    id: "views-per-subscriber",
    name: "구독자 대비 조회수",
    icon: Users,
    myScore: 72,
    benchmarkScore: 65,
    status: "높음",
  },
  {
    id: "upload-frequency",
    name: "업로드 빈도",
    icon: Upload,
    myScore: 58,
    benchmarkScore: 70,
    status: "낮음",
  },
  {
    id: "engagement",
    name: "시청자 반응",
    icon: Heart,
    myScore: 65,
    benchmarkScore: 68,
    status: "보통",
  },
  {
    id: "seo",
    name: "SEO 최적화",
    icon: Search,
    myScore: 62,
    benchmarkScore: 75,
    status: "낮음",
  },
]

const chartData = [
  { name: "채널 활동", myScore: 75, benchmarkScore: 70 },
  { name: "시청자 반응", myScore: 65, benchmarkScore: 68 },
  { name: "콘텐츠 구조", myScore: 88, benchmarkScore: 72 },
  { name: "SEO 최적화", myScore: 62, benchmarkScore: 75 },
  { name: "성장 모멘텀", myScore: 78, benchmarkScore: 65 },
]

const strengths = [
  { text: "콘텐츠 구조가 시청 유지율에 최적화되어 있습니다", score: 88 },
  { text: "성장 모멘텀이 비교 기준보다 13점 높습니다", score: 78 },
  { text: "구독자 대비 조회수 비율이 우수합니다", score: 72 },
]

const weaknesses = [
  { text: "SEO 최적화 점수가 비교 기준보다 13점 낮습니다", score: 62 },
  { text: "업로드 빈도가 권장 수준보다 부족합니다", score: 58 },
  { text: "시청자 반응(좋아요/댓글)이 평균 수준입니다", score: 65 },
]

const insight = "현재 채널은 콘텐츠 구조 점수는 높지만 SEO 최적화와 시청자 반응에서 개선 여지가 큽니다. 업로드 빈도를 높이고 제목/설명/태그 최적화에 집중하면 더 빠른 성장이 가능합니다."

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "높음":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "보통":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "낮음":
      return "bg-rose-100 text-rose-700 border-rose-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-600"
}

function TopSummaryCard() {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Target className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>채널 벤치마크 요약</CardTitle>
            <CardDescription>비교 분석 결과 요약</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">현재 채널 위치</p>
            <p className="mt-1 text-xl font-semibold">{summaryData.currentPosition}</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">가장 강한 항목</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">{summaryData.strongestArea}</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">가장 약한 항목</p>
            <p className="mt-1 text-xl font-semibold text-rose-600">{summaryData.weakestArea}</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">개선 우선 영역</p>
            <p className="mt-1 text-xl font-semibold text-amber-600">{summaryData.priorityArea}</p>
          </div>
        </div>
        <p className="text-muted-foreground">{summaryData.summary}</p>
      </CardContent>
    </Card>
  )
}

function ComparisonScoreCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {comparisonCards.map((card) => {
        const Icon = card.icon
        const diff = card.myScore - card.benchmarkScore
        const isPositive = diff > 0
        return (
          <Card key={card.id} className="hover-lift">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5" />
                </div>
                <Badge variant="outline" className={getStatusBadgeStyle(card.status)}>
                  {card.status}
                </Badge>
              </div>
              <CardTitle className="mt-3 text-base">{card.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">내 점수</p>
                  <p className={`text-2xl font-bold ${getScoreColor(card.myScore)}`}>
                    {card.myScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">비교 기준</p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {card.benchmarkScore}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm">
                {isPositive ? (
                  <TrendingUp className="size-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-4 text-rose-500" />
                )}
                <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                  {isPositive ? "+" : ""}{diff}점
                </span>
                <span className="text-muted-foreground">차이</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function BenchmarkChartCard() {
  const maxScore = 100
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <CardTitle>비교 차트</CardTitle>
            <CardDescription>내 채널과 비교 기준 점수를 시각적으로 비교합니다</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-end gap-6">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">내 채널</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">비교 기준</span>
          </div>
        </div>
        <div className="space-y-6">
          {chartData.map((item) => {
            const IconMap: Record<string, React.ElementType> = {
              "채널 활동": Activity,
              "시청자 반응": Heart,
              "콘텐츠 구조": Layers,
              "SEO 최적화": Search,
              "성장 모멘텀": Zap,
            }
            const Icon = IconMap[item.name] || Activity
            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={getScoreColor(item.myScore)}>{item.myScore}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="text-muted-foreground">{item.benchmarkScore}</span>
                  </div>
                </div>
                <div className="relative h-6 overflow-hidden rounded-lg bg-muted">
                  {/* Benchmark bar (background) */}
                  <div
                    className="absolute inset-y-0 left-0 bg-muted-foreground/30 transition-all duration-500"
                    style={{ width: `${(item.benchmarkScore / maxScore) * 100}%` }}
                  />
                  {/* My score bar (foreground) */}
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                    style={{ width: `${(item.myScore / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function StrengthWeaknessSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Strengths Card */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-emerald-900">강점</CardTitle>
              <CardDescription className="text-emerald-700">현재 잘하고 있는 부분</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {strengths.map((item, index) => (
              <li key={index} className="flex items-start gap-3 rounded-lg bg-background p-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-600">{item.score}점</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Weaknesses Card */}
      <Card className="border-rose-200 bg-rose-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100">
              <AlertTriangle className="size-5 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-rose-900">약점</CardTitle>
              <CardDescription className="text-rose-700">우선 개선이 필요한 부분</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {weaknesses.map((item, index) => (
              <li key={index} className="flex items-start gap-3 rounded-lg bg-background p-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-rose-600">{item.score}점</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function InsightCard() {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Zap className="size-5" />
          </div>
          <div>
            <CardTitle>벤치마크 인사이트</CardTitle>
            <CardDescription>비교 결과를 바탕으로 한 종합 분석</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{insight}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Empty className="border min-h-[400px]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BarChart3 className="size-6" />
        </EmptyMedia>
        <EmptyTitle>비교할 데이터가 없습니다</EmptyTitle>
        <EmptyDescription>
          채널 분석을 먼저 완료하면 벤치마크 결과를 확인할 수 있습니다
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

export default function BenchmarkPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">벤치마크</h1>
          <p className="mt-1 text-muted-foreground">
            내 채널과 비교 기준 데이터를 바탕으로 성장 위치를 확인하세요
          </p>
        </div>

        {!hasAnalysisData ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* Top Summary */}
            <TopSummaryCard />

            {/* Comparison Score Cards */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">비교 점수</h2>
              <ComparisonScoreCards />
            </div>

            {/* Benchmark Chart */}
            <BenchmarkChartCard />

            {/* Strength & Weakness */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">강점과 약점</h2>
              <StrengthWeaknessSection />
            </div>

            {/* Insight */}
            <InsightCard />
          </div>
        )}
      </div>
    </div>
  )
}
