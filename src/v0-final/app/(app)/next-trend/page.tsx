"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  HelpCircle,
  Film,
  Clock,
  Sparkles,
  RefreshCw,
  Target,
  Search,
  Users,
  Timer,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Zap,
} from "lucide-react"
import { Button } from "@/v0-final/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/v0-final/components/ui/card"
import { Badge } from "@/v0-final/components/ui/badge"

// Trend signal data
const trendSignals = [
  {
    title: "트렌딩 토픽",
    description: "당신의 니치에서 급상승 중인 주제",
    icon: TrendingUp,
    badge: "Hot",
    badgeVariant: "destructive" as const,
  },
  {
    title: "시청자 관심사",
    description: "시청자들이 활발히 찾고 있는 질문들",
    icon: HelpCircle,
    badge: "+24%",
    badgeVariant: "secondary" as const,
  },
  {
    title: "포맷 트렌드",
    description: "현재 잘 되는 영상 포맷 (쇼츠, 튜토리얼, 비교)",
    icon: Film,
    badge: "Shorts",
    badgeVariant: "outline" as const,
  },
  {
    title: "타이밍 윈도우",
    description: "트렌드가 피크에 도달할 예상 시점",
    icon: Clock,
    badge: "72h",
    badgeVariant: "secondary" as const,
  },
]

// Video idea suggestions
const videoIdeas = [
  {
    topic: "AI 영상 편집 툴",
    angle: "초보자용 비교 분석",
    suggestedTitle: "소규모 유튜버를 위한 최고의 AI 영상 편집 툴",
    format: "8-10분 튜토리얼",
  },
  {
    topic: "유튜브 알고리즘 변화",
    angle: "2024 최신 업데이트",
    suggestedTitle: "유튜브 알고리즘 2024 완벽 해석",
    format: "15-20분 심층 분석",
  },
  {
    topic: "썸네일 제작 비법",
    angle: "클릭률 200% 올리기",
    suggestedTitle: "클릭률이 2배 오르는 썸네일 공식",
    format: "10-12분 실습 영상",
  },
]

// Radar metrics
const radarMetrics = [
  { label: "토픽 모멘텀", value: 85, icon: TrendingUp },
  { label: "검색 수요", value: 72, icon: Search },
  { label: "경쟁 수준", value: 45, icon: Users },
  { label: "시청자 적합도", value: 90, icon: Target },
  { label: "타이밍 기회", value: 78, icon: Timer },
]

function TrendSignalCard({
  title,
  description,
  icon: Icon,
  badge,
  badgeVariant,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
}) {
  return (
    <Card className="hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-1 text-base">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function VideoIdeaCard({
  topic,
  angle,
  suggestedTitle,
  format,
}: {
  topic: string
  angle: string
  suggestedTitle: string
  format: string
}) {
  return (
    <Card className="hover-lift">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="size-5 text-chart-1" />
          <span className="text-sm font-medium text-muted-foreground">영상 아이디어</span>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">토픽</p>
            <p className="font-medium">{topic}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">니치 앵글</p>
            <p className="font-medium">{angle}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">추천 제목</p>
            <p className="font-semibold text-foreground">&ldquo;{suggestedTitle}&rdquo;</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">포맷</p>
            <Badge variant="outline">{format}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RadarMetricBar({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function NextTrendPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateNewIdeas = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Next Trend</h1>
          <p className="mt-1 text-muted-foreground">
            데이터 기반 시그널로 다음 영상 아이디어를 발견하세요
          </p>
        </div>

        {/* Trend Signals Section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5" />
            <h2 className="text-lg font-semibold">트렌드 시그널</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trendSignals.map((signal) => (
              <TrendSignalCard key={signal.title} {...signal} />
            ))}
          </div>
        </section>

        {/* Niche Video Ideas Section */}
        <section className="mb-10">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5" />
              <h2 className="text-lg font-semibold">다음 영상 아이디어</h2>
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateNewIdeas}
              disabled={isGenerating}
            >
              <RefreshCw className={`size-4 ${isGenerating ? "animate-spin" : ""}`} />
              새 아이디어 생성
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videoIdeas.map((idea, index) => (
              <VideoIdeaCard key={index} {...idea} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Trend Radar Section */}
          <section>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="size-5" />
                  <CardTitle>트렌드 레이더</CardTitle>
                </div>
                <CardDescription>
                  현재 트렌드의 다양한 지표를 한눈에 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {radarMetrics.map((metric) => (
                  <RadarMetricBar key={metric.label} {...metric} />
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Creator Insight Section */}
          <section>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-5" />
                  <CardTitle>크리에이터 인사이트</CardTitle>
                </div>
                <CardDescription>
                  이 아이디어들이 추천된 이유를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    AI 영상 편집 툴에 대한 관심이 소규모 크리에이터들 사이에서 증가하고 있습니다. 
                    현재 경쟁 수준은 중간 정도로 진입 장벽이 높지 않습니다. 
                    <span className="font-medium text-foreground">
                      {" "}앞으로 72시간 내에 발행하면 검색 노출 기회가 크게 증가할 수 있습니다.
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span>마지막 업데이트: 2시간 전</span>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Action Section */}
        <section className="mt-10">
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
              <div>
                <h3 className="text-xl font-semibold">
                  트렌드를 콘텐츠로 바꿀 준비가 되셨나요?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  채널 분석과 액션 플랜으로 성장 전략을 세워보세요
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/channels">
                    <BarChart3 className="size-4" />
                    채널 분석하기
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/action-plan">
                    <Zap className="size-4" />
                    액션 플랜 생성
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
