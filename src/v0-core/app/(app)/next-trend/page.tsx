"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRight, 
  TrendingUp,
  Lightbulb,
  Target,
  Clock,
  Sparkles,
  ArrowUpRight,
  Flame,
  Eye,
  Calendar,
  AlertTriangle,
  Play,
  FileText,
  Zap,
  Star,
  ThumbsUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoadingSkeleton } from "@/components/ui/loading-state"

// Idea Cluster Component
function IdeaCluster({ ideas }: { ideas: { title: string; relevance: number; trending: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {ideas.map((idea, index) => (
        <div
          key={index}
          className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
            idea.trending ? 'bg-orange-500/5 border-orange-500/30 hover:border-orange-500' : 'bg-card hover:border-muted-foreground/30'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <Lightbulb className={`w-5 h-5 ${idea.trending ? 'text-orange-500' : 'text-muted-foreground'}`} />
            {idea.trending && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Flame className="w-3 h-3 mr-0.5" />
                HOT
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-sm mb-1">{idea.title}</h4>
          <div className="flex items-center gap-1">
            <Progress value={idea.relevance} className="h-1 flex-1" />
            <span className="text-xs text-muted-foreground">{idea.relevance}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Topic Card Component
function TopicCard({
  title,
  description,
  metrics,
  tags,
  timing
}: {
  title: string
  description: string
  metrics: { views: string; engagement: string }
  tags: string[]
  timing: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            자세히
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">예상 조회수</p>
            <p className="font-medium">{metrics.views}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">참여율</p>
            <p className="font-medium">{metrics.engagement}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">적정 시점</p>
            <p className="font-medium">{timing}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Format Recommendation Component
function FormatCard({
  format,
  description,
  performance,
  duration
}: {
  format: string
  description: string
  performance: number
  duration: string
}) {
  return (
    <div className="p-4 rounded-lg border hover:border-orange-500/30 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-muted">
          <Play className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h4 className="font-medium">{format}</h4>
          <p className="text-xs text-muted-foreground">{duration}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center gap-2">
        <Progress value={performance} className="h-1.5 flex-1" />
        <span className="text-sm font-medium">{performance}%</span>
      </div>
    </div>
  )
}

// Timing Hint Component
function TimingCard({
  day,
  time,
  performance,
  reason
}: {
  day: string
  time: string
  performance: number
  reason: string
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border">
      <div className="text-center min-w-[60px]">
        <p className="text-sm font-bold">{day}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Progress value={performance} className="h-2 flex-1" />
          <Badge variant={performance >= 80 ? "default" : "secondary"} className="text-xs">
            {performance}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{reason}</p>
      </div>
    </div>
  )
}

// Warning Point Component
function WarningPoint({
  title,
  description
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}

export default function NextTrendPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasChannel, setHasChannel] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  if (!hasChannel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={Lightbulb}
          title="연결된 채널이 없습니다"
          description="채널을 연결하면 맞춤형 트렌드 분석과 콘텐츠 아이디어를 받을 수 있습니다."
          action={{ label: "채널 연결하기", href: "/settings" }}
        />
      </div>
    )
  }

  const trendIdeas = [
    { title: 'AI 도구 활용법', relevance: 95, trending: true },
    { title: '2024 트렌드 예측', relevance: 88, trending: true },
    { title: '초보자 가이드', relevance: 85, trending: false },
    { title: '실수 모음', relevance: 82, trending: false },
    { title: '비교 분석', relevance: 78, trending: false },
    { title: '꿀팁 시리즈', relevance: 75, trending: true },
  ]

  const recommendedTopics = [
    {
      title: 'AI 영상 편집 도구 비교',
      description: 'ChatGPT, Claude, Gemini 등 AI 도구를 영상 제작에 활용하는 방법을 비교 분석합니다.',
      metrics: { views: '50K+', engagement: '8.5%' },
      tags: ['AI', '영상편집', '생산성'],
      timing: '즉시'
    },
    {
      title: '유튜브 쇼츠 vs 롱폼 전략',
      description: '2024년 기준 쇼츠와 롱폼 콘텐츠의 최적 활용 전략을 다룹니다.',
      metrics: { views: '35K+', engagement: '7.2%' },
      tags: ['쇼츠', '전략', '성장'],
      timing: '1주 내'
    },
    {
      title: '구독자 1만 달성 로드맵',
      description: '실제 데이터 기반으로 구독자 1만을 달성하기 위한 단계별 가이드입니다.',
      metrics: { views: '28K+', engagement: '9.1%' },
      tags: ['성장', '로드맵', '초보자'],
      timing: '2주 내'
    }
  ]

  const formats = [
    {
      format: '튜토리얼',
      description: '단계별로 따라할 수 있는 가이드 형식',
      performance: 92,
      duration: '10-15분'
    },
    {
      format: '리스트형',
      description: '핵심 포인트를 나열하는 형식',
      performance: 85,
      duration: '8-12분'
    },
    {
      format: '비교 분석',
      description: 'A vs B 형식의 비교 콘텐츠',
      performance: 78,
      duration: '12-20분'
    },
    {
      format: '브이로그',
      description: '일상과 정보를 결합한 형식',
      performance: 72,
      duration: '15-25분'
    }
  ]

  const timingHints = [
    {
      day: '목요일',
      time: '오후 6시',
      performance: 95,
      reason: '퇴근 후 시청 피크 타임'
    },
    {
      day: '일요일',
      time: '오전 10시',
      performance: 88,
      reason: '주말 여유 시간대'
    },
    {
      day: '화요일',
      time: '오후 8시',
      performance: 82,
      reason: '주중 안정적 시청 시간'
    }
  ]

  const warnings = [
    {
      title: '과도한 클릭베이트 주의',
      description: '실제 내용과 다른 제목/썸네일은 이탈률을 높이고 알고리즘에 부정적 영향을 줍니다.'
    },
    {
      title: '저작권 콘텐츠 사용 금지',
      description: '허가 없는 음악, 영상 클립 사용은 수익 창출 정지 및 채널 제재로 이어질 수 있습니다.'
    }
  ]

  const actionIdeas = [
    {
      title: '이번 주 영상 아이디어',
      items: ['AI 편집 도구 실전 리뷰', '나만의 작업 루틴 공개', '시청자 Q&A 라이브']
    },
    {
      title: '시리즈 기획 아이디어',
      items: ['초보 유튜버 성장기', '장비 리뷰 시리즈', '알고리즘 실험실']
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Idea Cluster */}
      <section className="relative py-16 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left - Trend Ideas */}
            <div>
              <Badge variant="outline" className="mb-6">Next Trend</Badge>
              <h1 className="text-3xl font-bold tracking-tight mb-2">트렌드 기반 콘텐츠 아이디어</h1>
              <p className="text-muted-foreground mb-8">
                채널 데이터와 트렌드 분석을 바탕으로 추천된 콘텐츠 주제입니다
              </p>
              
              <IdeaCluster ideas={trendIdeas} />
            </div>

            {/* Right - Key Insights */}
            <div className="space-y-6">
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <Sparkles className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">이번 주 추천</p>
                      <p className="text-xl font-bold">AI 도구 활용법</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    현재 검색량이 급상승 중이며, 채널 주제와 95% 일치합니다.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">트렌드 점수</p>
                        <p className="text-xl font-bold">87/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Target className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">적합도</p>
                        <p className="text-xl font-bold">95%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">핵심 인사이트</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span>AI 관련 키워드 검색량 +340% (지난 달 대비)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span>경쟁 채널 중 42%가 AI 콘텐츠 제작 중</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span>시청자 댓글에서 AI 관련 질문 증가</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Topics */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">추천 주제 클러스터</h2>
            <p className="text-muted-foreground mt-1">채널에 최적화된 콘텐츠 주제 제안</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedTopics.map((topic, index) => (
              <TopicCard key={index} {...topic} />
            ))}
          </div>
        </div>
      </section>

      {/* Format Recommendations */}
      <section className="py-12 px-6 lg:px-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">추천 포맷</h2>
            <p className="text-muted-foreground mt-1">채널 성과가 좋았던 영상 형식</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formats.map((format, index) => (
              <FormatCard key={index} {...format} />
            ))}
          </div>
        </div>
      </section>

      {/* Timing Hints */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Best Upload Times */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-bold">최적 업로드 시간</h2>
              </div>
              <div className="space-y-3">
                {timingHints.map((hint, index) => (
                  <TimingCard key={index} {...hint} />
                ))}
              </div>
            </div>

            {/* Warning Points */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">주의 포인트</h2>
              </div>
              <div className="space-y-3">
                {warnings.map((warning, index) => (
                  <WarningPoint key={index} {...warning} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Ideas */}
      <section className="py-12 px-6 lg:px-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">실행 아이디어</h2>
            <p className="text-muted-foreground mt-1">바로 시작할 수 있는 콘텐츠 아이디어</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {actionIdeas.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 p-3 rounded-lg border hover:border-orange-500/30 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{item}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">아이디어를 액션으로 전환하세요</h2>
          <p className="text-muted-foreground mb-8">
            선택한 주제를 액션 플랜에 추가하거나, SEO 최적화를 시작하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/action-plan">
                액션 플랜에 추가
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/seo-lab">
                SEO 최적화 시작
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
