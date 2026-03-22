"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRight, 
  Search,
  TrendingUp,
  Target,
  Tag,
  FileText,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  BarChart3,
  Sparkles,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoadingSkeleton } from "@/components/ui/loading-state"

// SEO Score Gauge
function SEOScoreGauge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '최적화됨'
    if (score >= 60) return '개선 필요'
    return '최적화 필요'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={`${getScoreColor(score)} transition-all duration-1000`}
            strokeDasharray={`${(score / 100) * 283} 283`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs text-muted-foreground">SEO Score</span>
        </div>
      </div>
      <Badge variant="outline" className={`mt-4 ${getScoreColor(score)}`}>
        {getScoreLabel(score)}
      </Badge>
    </div>
  )
}

// Keyword Cluster Component
function KeywordCluster({ keywords }: { keywords: { text: string; score: number; trend: 'up' | 'down' | 'stable' }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword, index) => (
        <div
          key={index}
          className={`px-3 py-2 rounded-lg border transition-colors hover:border-orange-500/50 cursor-pointer ${
            keyword.score >= 80 ? 'bg-green-500/5 border-green-500/20' :
            keyword.score >= 60 ? 'bg-yellow-500/5 border-yellow-500/20' :
            'bg-muted/50 border-border'
          }`}
        >
          <div className="flex items-center gap-2">
            <Hash className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-medium">{keyword.text}</span>
            {keyword.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">매칭: {keyword.score}%</p>
        </div>
      ))}
    </div>
  )
}

// Optimization Item Component
function OptimizationItem({
  title,
  current,
  suggestion,
  score,
  type
}: {
  title: string
  current: string
  suggestion: string
  score: number
  type: 'title' | 'description' | 'tags'
}) {
  const icons = {
    title: FileText,
    description: FileText,
    tags: Tag
  }
  const Icon = icons[type]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={score} className="w-20 h-2" />
            <span className="text-sm font-medium">{score}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">현재</p>
          <p className="text-sm">{current}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-green-600">추천</p>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Copy className="w-3 h-3 mr-1" />
              복사
            </Button>
          </div>
          <p className="text-sm">{suggestion}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Tag Recommendation Component
function TagRecommendation({ tags }: { tags: { tag: string; relevance: number; competition: 'low' | 'medium' | 'high' }[] }) {
  const competitionStyles = {
    low: 'bg-green-500/10 text-green-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-red-500/10 text-red-500'
  }

  const competitionLabels = {
    low: '낮음',
    medium: '보통',
    high: '높음'
  }

  return (
    <div className="space-y-2">
      {tags.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{item.tag}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">관련성</p>
              <p className="text-sm font-medium">{item.relevance}%</p>
            </div>
            <Badge variant="outline" className={competitionStyles[item.competition]}>
              경쟁 {competitionLabels[item.competition]}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SEOLabPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasChannel, setHasChannel] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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
          icon={Search}
          title="연결된 채널이 없습니다"
          description="채널을 연결하면 SEO 분석과 키워드 추천을 받을 수 있습니다."
          action={{ label: "채널 연결하기", href: "/settings" }}
        />
      </div>
    )
  }

  const seoScore = 78

  const scoreBreakdown = [
    { label: '제목 최적화', score: 85 },
    { label: '설명 최적화', score: 72 },
    { label: '태그 커버리지', score: 80 },
    { label: '키워드 밀도', score: 75 },
  ]

  const keywords = [
    { text: '유튜브 성장', score: 92, trend: 'up' as const },
    { text: '채널 분석', score: 88, trend: 'stable' as const },
    { text: '구독자 늘리기', score: 85, trend: 'up' as const },
    { text: '알고리즘', score: 78, trend: 'stable' as const },
    { text: '조회수 높이기', score: 72, trend: 'down' as const },
    { text: '썸네일 제작', score: 68, trend: 'stable' as const },
  ]

  const optimizations = [
    {
      title: '제목 최적화',
      type: 'title' as const,
      current: '유튜브 채널 성장하는 방법',
      suggestion: '2024 유튜브 채널 성장 전략 | 구독자 1만 달성 로드맵',
      score: 85
    },
    {
      title: '설명 최적화',
      type: 'description' as const,
      current: '이 영상에서는 유튜브 채널을 성장시키는 방법에 대해 알아봅니다.',
      suggestion: '유튜브 채널 성장을 위한 실전 가이드입니다. 알고리즘 이해부터 콘텐츠 전략, SEO 최적화까지 구독자 1만 달성을 위한 모든 것을 담았습니다. #유튜브성장 #구독자늘리기',
      score: 72
    }
  ]

  const recommendedTags = [
    { tag: '유튜브성장전략', relevance: 95, competition: 'medium' as const },
    { tag: '구독자늘리기', relevance: 92, competition: 'high' as const },
    { tag: '유튜브알고리즘', relevance: 88, competition: 'medium' as const },
    { tag: '채널분석', relevance: 85, competition: 'low' as const },
    { tag: '콘텐츠전략', relevance: 82, competition: 'low' as const },
  ]

  const patterns = [
    {
      type: 'success',
      title: '숫자 포함 제목',
      description: '제목에 구체적인 숫자가 포함된 영상의 CTR이 23% 더 높습니다.'
    },
    {
      type: 'tip',
      title: '질문형 제목 활용',
      description: '질문으로 시작하는 제목이 시청자 호기심을 자극합니다.'
    },
    {
      type: 'warning',
      title: '태그 중복 주의',
      description: '유사한 의미의 태그 중복 사용은 효과가 제한적입니다.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - SEO Score + Keyword Cluster */}
      <section className="relative py-16 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left - SEO Score */}
            <div>
              <Badge variant="outline" className="mb-6">SEO Lab</Badge>
              <h1 className="text-3xl font-bold tracking-tight mb-2">SEO 분석 도구</h1>
              <p className="text-muted-foreground mb-8">
                영상 메타데이터를 분석하고 검색 최적화를 개선하세요
              </p>

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <SEOScoreGauge score={seoScore} />
                
                <div className="flex-1 space-y-3">
                  {scoreBreakdown.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.score}%</span>
                      </div>
                      <Progress value={item.score} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Keyword Cluster */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    키워드 클러스터
                  </CardTitle>
                  <CardDescription>
                    채널과 관련성이 높은 키워드입니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KeywordCluster keywords={keywords} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-6 lg:px-12 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="키워드 또는 영상 URL을 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="gap-2">
              <Search className="w-4 h-4" />
              분석하기
            </Button>
          </div>
        </div>
      </section>

      {/* Optimization Tabs */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="title" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="title">제목 최적화</TabsTrigger>
              <TabsTrigger value="description">설명 최적화</TabsTrigger>
              <TabsTrigger value="tags">태그 전략</TabsTrigger>
            </TabsList>

            <TabsContent value="title" className="space-y-6">
              <OptimizationItem {...optimizations[0]} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">제목 작성 팁</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>핵심 키워드를 제목 앞부분에 배치하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>구체적인 숫자나 연도를 포함하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>60자 이내로 작성하여 잘리지 않게 하세요</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description" className="space-y-6">
              <OptimizationItem {...optimizations[1]} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">설명란 작성 팁</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>처음 2-3줄에 핵심 내용과 키워드를 포함하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>타임스탬프를 추가하여 탐색을 용이하게 하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>관련 해시태그를 3-5개 추가하세요</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>추천 태그</CardTitle>
                  <CardDescription>채널과 콘텐츠에 최적화된 태그입니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <TagRecommendation tags={recommendedTags} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pattern Insights */}
      <section className="py-12 px-6 lg:px-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">SEO 패턴 인사이트</h2>
            <p className="text-muted-foreground mt-1">데이터에서 발견된 최적화 패턴</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {patterns.map((pattern, index) => (
              <Card key={index} className={
                pattern.type === 'success' ? 'border-l-4 border-l-green-500' :
                pattern.type === 'tip' ? 'border-l-4 border-l-blue-500' :
                'border-l-4 border-l-yellow-500'
              }>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {pattern.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />}
                    {pattern.type === 'tip' && <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />}
                    {pattern.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                    <div>
                      <h4 className="font-medium text-sm">{pattern.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">SEO 최적화를 실행에 옮기세요</h2>
          <p className="text-muted-foreground mb-8">
            분석된 키워드와 추천 사항을 액션 플랜에 반영하거나, 트렌드를 확인하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/action-plan">
                액션 플랜에 적용
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/next-trend">
                트렌드 분석 보기
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
