"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRight, 
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Target,
  TrendingUp,
  ArrowUpRight,
  Flag,
  Calendar,
  Lightbulb,
  Star,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoadingSkeleton } from "@/components/ui/loading-state"

// Priority Action Stack Component
function ActionStack({
  actions
}: {
  actions: {
    priority: 'P1' | 'P2' | 'P3'
    title: string
    description: string
    impact: string
    timeframe: string
  }[]
}) {
  const priorityStyles = {
    P1: 'bg-orange-500 border-orange-500',
    P2: 'bg-blue-500 border-blue-500',
    P3: 'bg-muted-foreground border-muted-foreground'
  }

  const priorityLabels = {
    P1: '최우선',
    P2: '중요',
    P3: '권장'
  }

  return (
    <div className="space-y-4">
      {actions.map((action, index) => (
        <div
          key={index}
          className={`relative p-6 rounded-xl border-2 bg-card transition-all hover:shadow-lg ${
            action.priority === 'P1' ? 'border-orange-500/50' : 
            action.priority === 'P2' ? 'border-blue-500/30' : 'border-border'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${priorityStyles[action.priority]}`}>
              {action.priority}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {priorityLabels[action.priority]}
                </Badge>
                <span className="text-xs text-muted-foreground">{action.timeframe}</span>
              </div>
              <h3 className="text-lg font-bold">{action.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">예상 효과: {action.impact}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Checklist Item Component
function ChecklistItem({
  id,
  title,
  description,
  difficulty,
  checked,
  onCheck
}: {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  checked: boolean
  onCheck: (id: string) => void
}) {
  const difficultyStyles = {
    easy: 'bg-green-500/10 text-green-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    hard: 'bg-red-500/10 text-red-500'
  }

  const difficultyLabels = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움'
  }

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${checked ? 'bg-muted/50 border-muted' : 'bg-card border-border hover:border-muted-foreground/30'}`}>
      <Checkbox 
        id={id}
        checked={checked}
        onCheckedChange={() => onCheck(id)}
        className="mt-1"
      />
      <div className="flex-1">
        <label 
          htmlFor={id}
          className={`font-medium cursor-pointer ${checked ? 'line-through text-muted-foreground' : ''}`}
        >
          {title}
        </label>
        <p className={`text-sm mt-1 ${checked ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </div>
      <Badge variant="outline" className={difficultyStyles[difficulty]}>
        {difficultyLabels[difficulty]}
      </Badge>
    </div>
  )
}

// Status Card Component
function StatusCard({
  icon: Icon,
  label,
  value,
  subtext,
  color
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  color: string
}) {
  const colorStyles: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-500',
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500'
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ActionPlanPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasChannel, setHasChannel] = useState(true)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

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
          icon={Flag}
          title="연결된 채널이 없습니다"
          description="채널을 연결하면 맞춤형 액션 플랜을 확인할 수 있습니다."
          action={{ label: "채널 연결하기", href: "/settings" }}
        />
      </div>
    )
  }

  const handleCheck = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const priorityActions = [
    {
      priority: 'P1' as const,
      title: '영상 인트로 3초 룰 적용',
      description: '시청자 이탈률이 가장 높은 처음 3초를 개선합니다. 후킹 멘트와 시각적 임팩트를 강화하세요.',
      impact: '평균 시청 시간 +25%',
      timeframe: '이번 주 내'
    },
    {
      priority: 'P2' as const,
      title: '댓글 유도 CTA 전략 개선',
      description: '영상 중간과 끝에 자연스러운 댓글 유도 멘트를 추가합니다.',
      impact: '댓글 참여율 +40%',
      timeframe: '2주 내'
    },
    {
      priority: 'P3' as const,
      title: '커뮤니티 탭 주 2회 포스팅',
      description: '구독자와의 소통을 강화하고 알고리즘 노출을 높입니다.',
      impact: '구독자 참여도 +15%',
      timeframe: '1개월 내'
    }
  ]

  const checklist = [
    { id: '1', title: '제목에 핵심 키워드 배치', description: '메인 키워드를 제목 앞부분에 배치하세요', difficulty: 'easy' as const },
    { id: '2', title: '썸네일 A/B 테스트 진행', description: '2가지 버전의 썸네일을 테스트하세요', difficulty: 'medium' as const },
    { id: '3', title: '영상 설명란 SEO 최적화', description: '키워드와 타임스탬프를 포함하세요', difficulty: 'easy' as const },
    { id: '4', title: '고정 댓글 작성', description: '핵심 정보나 CTA를 고정 댓글로 작성하세요', difficulty: 'easy' as const },
    { id: '5', title: '엔드스크린 최적화', description: '관련 영상과 구독 버튼을 효과적으로 배치하세요', difficulty: 'medium' as const },
    { id: '6', title: '재생목록 구성 개선', description: '시리즈 컨텐츠를 재생목록으로 묶으세요', difficulty: 'easy' as const },
  ]

  const completedCount = checkedItems.size
  const totalCount = checklist.length
  const progressPercent = (completedCount / totalCount) * 100

  const nextSteps = [
    { title: 'SEO Lab에서 키워드 분석', link: '/seo-lab', icon: Target },
    { title: '트렌드 기반 콘텐츠 아이디어', link: '/next-trend', icon: Lightbulb },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Action Stack */}
      <section className="relative py-16 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left - Priority Actions */}
            <div className="lg:col-span-3">
              <Badge variant="outline" className="mb-6">Action Plan</Badge>
              <h1 className="text-3xl font-bold tracking-tight mb-2">우선순위 액션</h1>
              <p className="text-muted-foreground mb-8">
                분석 결과를 바탕으로 도출된 핵심 실행 과제입니다
              </p>
              <ActionStack actions={priorityActions} />
            </div>

            {/* Right - Status Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <Flag className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">이번 주 목표</p>
                      <p className="text-2xl font-bold">3개 액션 완료</p>
                    </div>
                  </div>
                  <Progress value={33} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">1/3 완료</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <StatusCard
                  icon={Zap}
                  label="예상 효과"
                  value="+32%"
                  subtext="종합 성장률"
                  color="orange"
                />
                <StatusCard
                  icon={Clock}
                  label="소요 시간"
                  value="~4주"
                  subtext="전체 실행"
                  color="blue"
                />
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-sm">채널 상태 요약</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">현재 점수</span>
                      <span className="font-medium">78점 (A등급)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">목표 점수</span>
                      <span className="font-medium">85점 (S등급)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">개선 필요 영역</span>
                      <span className="font-medium">3개</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Expected Effects */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">기대 효과</h2>
            <p className="text-muted-foreground mt-1">액션 실행 시 예상되는 지표 변화</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p className="text-2xl font-bold text-green-500">+25%</p>
                <p className="text-sm text-muted-foreground mt-1">평균 시청 시간</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p className="text-2xl font-bold text-green-500">+40%</p>
                <p className="text-sm text-muted-foreground mt-1">댓글 참여율</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p className="text-2xl font-bold text-green-500">+15%</p>
                <p className="text-sm text-muted-foreground mt-1">구독자 전환</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <p className="text-2xl font-bold text-green-500">+18%</p>
                <p className="text-sm text-muted-foreground mt-1">노출 클릭률</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Execution Checklist */}
      <section className="py-12 px-6 lg:px-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">실행 체크리스트</h2>
              <p className="text-muted-foreground mt-1">각 항목을 체크하며 진행하세요</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
              <p className="text-sm text-muted-foreground">완료</p>
            </div>
          </div>

          <div className="mb-6">
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <ChecklistItem
                key={item.id}
                {...item}
                checked={checkedItems.has(item.id)}
                onCheck={handleCheck}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">추천 다음 단계</h2>
            <p className="text-muted-foreground mt-1">액션 플랜과 연계하여 진행하면 효과적입니다</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {nextSteps.map((step, index) => (
              <Link key={index} href={step.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-muted group-hover:bg-orange-500/10 transition-colors">
                        <step.icon className="w-6 h-6 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium group-hover:text-orange-500 transition-colors">{step.title}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">더 정��한 최적화가 필요하신가요?</h2>
          <p className="text-muted-foreground mb-8">
            SEO Lab에서 키워드 분석을, Next Trend에서 콘텐츠 아이디어를 확인하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/seo-lab">
                SEO Lab 시작하기
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
