/**
 * DO NOT USE IN ROUTES
 * Legacy mock analysis UI (archived). Same source as removed:
 * v0-TubewatchUI/app/(app)/analysis/page.tsx and src/v0-core/app/(app)/analysis/page.tsx
 * Operational /analysis: src/app/(app)/analysis/page.tsx → @/components/analysis/AnalysisReportPageClient only.
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  Video, 
  ThumbsUp,
  MessageCircle,
  Share2,
  Clock,
  Target,
  Zap,
  BarChart3,
  Search,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoadingSkeleton } from "@/components/ui/loading-state"

// Score Gauge Component
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 300)
    return () => clearTimeout(timer)
  }, [score])

  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-orange-500'
      case 'A': return 'text-green-500'
      case 'B': return 'text-blue-500'
      case 'C': return 'text-yellow-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="relative w-72 h-72 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
        {/* Background circle */}
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-orange-500 transition-all duration-1000 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-7xl font-bold tracking-tight ${getGradeColor(grade)}`}>
          {grade}
        </span>
        <span className="text-4xl font-bold text-foreground mt-2">
          {animatedScore}
        </span>
        <span className="text-sm text-muted-foreground mt-1">Channel Score</span>
      </div>
    </div>
  )
}

// Diagnosis Card Component
function DiagnosisCard({ 
  title, 
  score, 
  icon: Icon, 
  status,
  items 
}: { 
  title: string
  score: number
  icon: React.ElementType
  status: 'good' | 'warning' | 'critical'
  items: { label: string; value: string; trend?: 'up' | 'down' }[]
}) {
  const statusColors = {
    good: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    critical: 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusColors[status]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">진단 점수: {score}/100</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            {status === 'good' ? '양호' : status === 'warning' ? '주의' : '개선필요'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress value={score} className="h-1.5 mb-4" />
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{item.value}</span>
                {item.trend && (
                  item.trend === 'up' 
                    ? <TrendingUp className="w-3 h-3 text-green-500" />
                    : <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Pattern Insight Card
function InsightCard({ 
  title, 
  description, 
  type 
}: { 
  title: string
  description: string
  type: 'positive' | 'negative' | 'neutral'
}) {
  const typeStyles = {
    positive: 'border-l-green-500 bg-green-500/5',
    negative: 'border-l-red-500 bg-red-500/5',
    neutral: 'border-l-blue-500 bg-blue-500/5'
  }

  return (
    <div className={`p-4 border-l-4 rounded-r-lg ${typeStyles[type]}`}>
      <div className="flex items-start gap-3">
        {type === 'positive' ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
        ) : type === 'negative' ? (
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        ) : (
          <Target className="w-5 h-5 text-blue-500 mt-0.5" />
        )}
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasChannel, setHasChannel] = useState(true)
  const [hasData, setHasData] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Loading State
  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  // Empty State - No Channel Connected
  if (!hasChannel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="연결된 채널이 없습니다"
          description="채널을 연결하면 상세 분석 리포트와 성장 인사이트를 확인할 수 있습니다."
          action={{ label: "채널 연결하기", href: "/settings" }}
        />
      </div>
    )
  }

  // Empty State - No Analysis Data
  if (!hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="분석 데이터가 없습니다"
          description="채널 데이터를 수집 중입니다. 잠시 후 다시 확인해 주세요."
          action={{ label: "새로고침", href: "/analysis" }}
        />
      </div>
    )
  }

  // Mock data
  const channelScore = 78
  const grade = 'A'

  const channelSummary = {
    subscribers: '125,400',
    totalViews: '12.5M',
    videos: '342',
    avgViews: '36,500'
  }

  const diagnosisSections = [
    {
      title: '활동 지표',
      score: 85,
      icon: Video,
      status: 'good' as const,
      items: [
        { label: '주간 업로드', value: '2.3회', trend: 'up' as const },
        { label: '업로드 일관성', value: '92%' },
        { label: '평균 영상 길이', value: '12:34' }
      ]
    },
    {
      title: '반응 지표',
      score: 72,
      icon: ThumbsUp,
      status: 'warning' as const,
      items: [
        { label: '좋아요 비율', value: '4.2%', trend: 'down' as const },
        { label: '댓글 비율', value: '0.8%' },
        { label: '공유 비율', value: '1.2%', trend: 'up' as const }
      ]
    },
    {
      title: '구조 분석',
      score: 68,
      icon: BarChart3,
      status: 'warning' as const,
      items: [
        { label: '썸네일 CTR', value: '5.8%' },
        { label: '평균 시청 시간', value: '6:42' },
        { label: '이탈률', value: '45%', trend: 'down' as const }
      ]
    },
    {
      title: 'SEO 점수',
      score: 82,
      icon: Search,
      status: 'good' as const,
      items: [
        { label: '키워드 최적화', value: '78%' },
        { label: '제목 품질', value: '85%', trend: 'up' as const },
        { label: '태그 커버리지', value: '92%' }
      ]
    },
    {
      title: '성장 지표',
      score: 75,
      icon: TrendingUp,
      status: 'good' as const,
      items: [
        { label: '구독자 성장률', value: '+2.3%', trend: 'up' as const },
        { label: '조회수 성장률', value: '+5.1%', trend: 'up' as const },
        { label: '참여율 변화', value: '-0.5%', trend: 'down' as const }
      ]
    }
  ]

  const insights = [
    {
      title: '높은 구독자 전환율',
      description: '시청자 대비 구독 전환율이 평균보다 23% 높습니다. 채널 브랜딩과 CTA가 효과적으로 작동하고 있습니다.',
      type: 'positive' as const
    },
    {
      title: '댓글 참여율 하락 추세',
      description: '최근 30일간 댓글 참여율이 15% 감소했습니다. 커뮤니티 활성화 전략이 필요합니다.',
      type: 'negative' as const
    },
    {
      title: '최적 업로드 시간대 발견',
      description: '목요일 오후 6-8시 업로드 영상이 평균 대비 40% 높은 초기 조회수를 기록합니다.',
      type: 'neutral' as const
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Score Gauge */}
      <section className="relative py-16 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Score Gauge */}
            <div className="flex flex-col items-center lg:items-start">
              <Badge variant="outline" className="mb-6">Channel Analysis</Badge>
              <ScoreGauge score={channelScore} grade={grade} />
              <p className="text-center lg:text-left text-muted-foreground mt-6 max-w-md">
                종합 채널 점수입니다. 활동, 반응, 구조, SEO, 성장 5개 영역의 분석 결과를 종합하여 산출됩니다.
              </p>
            </div>

            {/* Right - Channel Summary */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">종합 진단 리포트</h1>
                <p className="text-muted-foreground mt-2">채널 데이터 기반 상세 분석 결과</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Users className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">구독자</p>
                        <p className="text-xl font-bold">{channelSummary.subscribers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Eye className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">총 조회수</p>
                        <p className="text-xl font-bold">{channelSummary.totalViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Video className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">영상 수</p>
                        <p className="text-xl font-bold">{channelSummary.videos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">평균 조회수</p>
                        <p className="text-xl font-bold">{channelSummary.avgViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosis Sections */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">영역별 진단</h2>
              <p className="text-muted-foreground mt-1">5개 핵심 영역의 상세 분석 결과</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagnosisSections.map((section, index) => (
              <DiagnosisCard key={index} {...section} />
            ))}
          </div>
        </div>
      </section>

      {/* Pattern Insights */}
      <section className="py-12 px-6 lg:px-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">패턴 인사이트</h2>
            <p className="text-muted-foreground mt-1">데이터에서 발견된 주요 패턴과 시사점</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </div>
      </section>

      {/* Growth Trend */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">성장 트렌드</h2>
            <p className="text-muted-foreground mt-1">최근 90일간 채널 성장 추이</p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">성장 트렌드 차트</p>
                  <p className="text-xs mt-1">데이터 연결 시 활성화</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">분석 결과를 바탕으로 다음 단계를 시작하세요</h2>
          <p className="text-muted-foreground mb-8">
            진단 결과를 기반으로 맞춤형 액션 플랜을 확인하거나, SEO 최적화를 시작할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/action-plan">
                액션 플랜 확인하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/seo-lab">
                SEO Lab 시작하기
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
