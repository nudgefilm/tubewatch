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
  Target,
  Zap,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  Minus,
  Crown,
  Medal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoadingSkeleton } from "@/components/ui/loading-state"

// Radar Chart Component (SVG-based)
function RadarChart({ 
  data, 
  labels 
}: { 
  data: { channel: number[]; average: number[] }
  labels: string[]
}) {
  const [animated, setAnimated] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const centerX = 150
  const centerY = 150
  const radius = 100
  const sides = labels.length
  const angleStep = (2 * Math.PI) / sides

  // Calculate points for a data series
  const getPoints = (values: number[]) => {
    return values.map((value, i) => {
      const angle = angleStep * i - Math.PI / 2
      const r = animated ? (value / 100) * radius : 0
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle)
      }
    })
  }

  // Generate polygon path
  const getPath = (points: { x: number; y: number }[]) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }

  // Background grid
  const gridLevels = [20, 40, 60, 80, 100]
  
  const channelPoints = getPoints(data.channel)
  const averagePoints = getPoints(data.average)

  // Label positions
  const labelPositions = labels.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = radius + 25
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    }
  })

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 300 300" className="w-full">
        {/* Grid */}
        {gridLevels.map((level) => {
          const points = labels.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2
            const r = (level / 100) * radius
            return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) }
          })
          return (
            <polygon
              key={level}
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              opacity={0.5}
            />
          )
        })}

        {/* Axis lines */}
        {labels.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              opacity={0.5}
            />
          )
        })}

        {/* Average data */}
        <path
          d={getPath(averagePoints)}
          fill="currentColor"
          fillOpacity={0.1}
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground transition-all duration-1000"
        />

        {/* Channel data */}
        <path
          d={getPath(channelPoints)}
          fill="currentColor"
          fillOpacity={0.2}
          stroke="currentColor"
          strokeWidth="2"
          className="text-orange-500 transition-all duration-1000"
        />

        {/* Channel data points */}
        {channelPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-orange-500 transition-all duration-1000"
          />
        ))}
      </svg>

      {/* Labels */}
      {labelPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute text-xs font-medium text-muted-foreground transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(pos.x / 300) * 100}%`, top: `${(pos.y / 300) * 100}%` }}
        >
          {labels[i]}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-muted-foreground">내 채널</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span className="text-sm text-muted-foreground">카테고리 평균</span>
        </div>
      </div>
    </div>
  )
}

// Comparison Card
function ComparisonCard({
  label,
  myValue,
  avgValue,
  icon: Icon,
  format = 'number'
}: {
  label: string
  myValue: number
  avgValue: number
  icon: React.ElementType
  format?: 'number' | 'percent' | 'compact'
}) {
  const diff = myValue - avgValue
  const diffPercent = avgValue > 0 ? ((diff / avgValue) * 100).toFixed(1) : '0'
  const isPositive = diff > 0

  const formatValue = (val: number) => {
    if (format === 'percent') return `${val}%`
    if (format === 'compact') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
    }
    return val.toLocaleString()
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-muted">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
          <Badge 
            variant="outline" 
            className={isPositive ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}
          >
            {isPositive ? '+' : ''}{diffPercent}%
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">내 채널</p>
            <p className="text-lg font-bold">{formatValue(myValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">평균</p>
            <p className="text-lg font-medium text-muted-foreground">{formatValue(avgValue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Strength/Weakness Item
function StrengthItem({
  label,
  value,
  rank,
  type
}: {
  label: string
  value: string
  rank: number
  type: 'strength' | 'weakness'
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        {type === 'strength' ? (
          <div className="p-1 rounded bg-green-500/10">
            <ChevronUp className="w-4 h-4 text-green-500" />
          </div>
        ) : (
          <div className="p-1 rounded bg-red-500/10">
            <ChevronDown className="w-4 h-4 text-red-500" />
          </div>
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{value}</span>
        <Badge variant="secondary" className="text-xs">
          상위 {rank}%
        </Badge>
      </div>
    </div>
  )
}

export default function BenchmarkPage() {
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
          icon={Target}
          title="연결된 채널이 없습니다"
          description="채널을 연결하면 경쟁 채널 비교 분석을 확인할 수 있습니다."
          action={{ label: "채널 연결하기", href: "/settings" }}
        />
      </div>
    )
  }

  const radarData = {
    channel: [85, 72, 68, 78, 82, 75],
    average: [70, 65, 70, 60, 68, 65]
  }
  const radarLabels = ['활동', '반응', '구조', 'SEO', '성장', '브랜딩']

  const comparisons = [
    { label: '구독자', myValue: 125400, avgValue: 89200, icon: Users, format: 'compact' as const },
    { label: '평균 조회수', myValue: 36500, avgValue: 28400, icon: Eye, format: 'compact' as const },
    { label: '참여율', myValue: 4.2, avgValue: 3.1, icon: ThumbsUp, format: 'percent' as const },
    { label: '영상 수', myValue: 342, avgValue: 256, icon: Video, format: 'number' as const },
  ]

  const strengths = [
    { label: '구독자 전환율', value: '3.2%', rank: 15 },
    { label: '영상 일관성', value: '92%', rank: 8 },
    { label: 'SEO 최적화', value: '78점', rank: 22 },
  ]

  const weaknesses = [
    { label: '평균 시청 시간', value: '6:42', rank: 65 },
    { label: '댓글 참여율', value: '0.8%', rank: 72 },
    { label: '공유율', value: '1.2%', rank: 58 },
  ]

  const improvements = [
    { priority: 1, label: '댓글 유도 전략 개선', impact: 'high', difficulty: 'medium' },
    { priority: 2, label: '영상 인트로 최적화', impact: 'high', difficulty: 'low' },
    { priority: 3, label: '커뮤니티 탭 활성화', impact: 'medium', difficulty: 'low' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Radar Chart */}
      <section className="relative py-16 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Radar Chart */}
            <div>
              <Badge variant="outline" className="mb-6">Benchmark</Badge>
              <RadarChart data={radarData} labels={radarLabels} />
            </div>

            {/* Right - Summary */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">경쟁 채널 비교</h1>
                <p className="text-muted-foreground mt-2">
                  동일 카테고리 채널 대비 내 채널의 위치를 확인하세요
                </p>
              </div>

              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <Crown className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">카테고리 내 순위</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">상위 18%</span>
                        <span className="text-sm text-green-500">+5% from last month</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Medal className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-xs text-muted-foreground">1위 영역</p>
                  <p className="font-bold">SEO</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-xs text-muted-foreground">성장률</p>
                  <p className="font-bold">+23%</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs text-muted-foreground">개선 영역</p>
                  <p className="font-bold">3개</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Cards */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">지표 비교</h2>
            <p className="text-muted-foreground mt-1">카테고리 평균 대비 내 채널 성과</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparisons.map((item, index) => (
              <ComparisonCard key={index} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Strengths & Weaknesses */}
      <section className="py-12 px-6 lg:px-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChevronUp className="w-5 h-5 text-green-500" />
                  강점
                </CardTitle>
                <CardDescription>평균 대비 우수한 영역</CardDescription>
              </CardHeader>
              <CardContent>
                {strengths.map((item, index) => (
                  <StrengthItem key={index} {...item} type="strength" />
                ))}
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChevronDown className="w-5 h-5 text-red-500" />
                  약점
                </CardTitle>
                <CardDescription>개선이 필요한 영역</CardDescription>
              </CardHeader>
              <CardContent>
                {weaknesses.map((item, index) => (
                  <StrengthItem key={index} {...item} type="weakness" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Improvement Priorities */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">개선 우선순위</h2>
            <p className="text-muted-foreground mt-1">효과와 난이도를 고려한 추천 순서</p>
          </div>

          <div className="space-y-4">
            {improvements.map((item) => (
              <Card key={item.priority} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      item.priority === 1 ? 'bg-orange-500' : item.priority === 2 ? 'bg-blue-500' : 'bg-muted-foreground'
                    }`}>
                      {item.priority}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          영향: <span className={item.impact === 'high' ? 'text-green-500' : 'text-yellow-500'}>
                            {item.impact === 'high' ? '높음' : '보통'}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          난이도: <span className={item.difficulty === 'low' ? 'text-green-500' : 'text-yellow-500'}>
                            {item.difficulty === 'low' ? '낮음' : '보통'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      자세히
                      <ArrowRight className="w-3 h-3" />
                    </Button>
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
          <h2 className="text-2xl font-bold mb-4">벤치마크 결과를 액션으로 연결하세요</h2>
          <p className="text-muted-foreground mb-8">
            분석된 강점과 약점을 기반으로 맞춤형 실행 전략을 확인하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/action-plan">
                액션 플랜 확인하기
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
