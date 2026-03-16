"use client"

import { TrendingUp, Lightbulb, MessageSquare, Hash, Beaker, Sparkles, ArrowUpRight, Target, Video, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Category Trend Data
const categoryTrends = [
  {
    title: "Shorts 형식의 교육 콘텐츠",
    description: "최근 60초 이내 정보 전달 영상의 조회수가 평균 대비 340% 상승",
    growth: "+340%",
  },
  {
    title: "Before/After 변환 콘텐츠",
    description: "시각적 변화를 보여주는 콘텐츠의 시청 지속시간이 2배 증가",
    growth: "+200%",
  },
  {
    title: "실시간 반응/리액션 영상",
    description: "라이브 느낌의 즉각적 리액션 콘텐츠 구독 전환율 상승",
    growth: "+156%",
  },
  {
    title: "스토리텔링 기반 튜토리얼",
    description: "단순 설명보다 스토리가 있는 튜토리얼의 완시청률이 높음",
    growth: "+89%",
  },
]

// Niche Opportunity Data
const nicheOpportunities = [
  {
    title: "초보자 맞춤 실수 모음",
    reason: "해당 카테고리에서 '실수', '주의' 키워드 검색량 증가 중이나 양질의 콘텐츠 부족",
    format: "Shorts",
    difficulty: "쉬움",
  },
  {
    title: "도구/장비 비교 리뷰",
    reason: "구매 결정 전 비교 콘텐츠 수요 높음, 경쟁 채널 대비 공백 존재",
    format: "Long-form",
    difficulty: "보통",
  },
  {
    title: "하루 루틴 브이로그",
    reason: "일상 공유 콘텐츠에 대한 댓글 요청 다수 발견",
    format: "Long-form",
    difficulty: "쉬움",
  },
]

// Audience Signal Data
const audienceSignals = [
  {
    icon: MessageSquare,
    title: "댓글 질문 증가",
    description: "'어떻게 하셨어요?', '자세히 알려주세요' 등의 질문형 댓글이 최근 2주간 45% 증가",
    type: "engagement",
  },
  {
    icon: Hash,
    title: "특정 키워드 반복 등장",
    description: "'초보', '입문', '시작' 키워드가 댓글에서 자주 언급됨",
    type: "keyword",
  },
  {
    icon: Clock,
    title: "영상 길이별 반응 차이",
    description: "8-12분 영상의 좋아요/조회수 비율이 다른 길이 대비 32% 높음",
    type: "duration",
  },
  {
    icon: Target,
    title: "특정 주제 반복 요청",
    description: "'다음에는 OO도 다뤄주세요' 형태의 요청 댓글 패턴 발견",
    type: "request",
  },
]

// Keyword Expansion Data
const expandedKeywords = [
  { keyword: "초보자 가이드", volume: "높음", competition: "중간" },
  { keyword: "꿀팁 모음", volume: "높음", competition: "높음" },
  { keyword: "실전 적용", volume: "중간", competition: "낮음" },
  { keyword: "비교 분석", volume: "중간", competition: "중간" },
  { keyword: "실수 방지", volume: "높음", competition: "낮음" },
  { keyword: "시간 단축", volume: "중간", competition: "낮음" },
  { keyword: "무료 도구", volume: "높음", competition: "중간" },
  { keyword: "2024 트렌드", volume: "높음", competition: "높음" },
]

// Growth Experiment Data
const growthExperiments = [
  {
    title: "연속 Shorts 시리즈",
    description: "같은 주제를 3-5개의 연속 Shorts로 제작하여 시리즈 효과 테스트",
    expectedImpact: "구독자 유입 증가 예상",
    effort: "낮음",
  },
  {
    title: "커뮤니티 투표 기반 콘텐츠",
    description: "다음 영상 주제를 커뮤니티 탭 투표로 결정하여 참여도 증가",
    expectedImpact: "댓글 참여율 상승 예상",
    effort: "중간",
  },
  {
    title: "콜라보 / 듀엣 형식",
    description: "비슷한 규모의 채널과 협업하여 크로스 프로모션 효과",
    expectedImpact: "신규 시청자 유입 예상",
    effort: "높음",
  },
]

export default function NextTrendPage() {
  return (
    <div className="px-6 py-6 lg:px-10 lg:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 mb-3">
          <TrendingUp className="size-6" />
          넥스트 트렌드
        </h1>
        <p className="text-muted-foreground">
          채널 데이터와 AI 분석을 기반으로 다음 영상 아이디어를 제안합니다
        </p>
      </div>

      {/* Category Trend Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-foreground/70" />
          <h2 className="text-xl font-semibold">카테고리 트렌드</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryTrends.map((trend, index) => (
            <Card key={index} className="group hover:border-foreground/30 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium">{trend.title}</CardTitle>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-0">
                    {trend.growth}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{trend.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Niche Opportunity Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-foreground/70" />
          <h2 className="text-xl font-semibold">니치 아이템 제안</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {nicheOpportunities.map((item, index) => (
            <Card key={index} className="group hover:border-foreground/30 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.reason}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Video className="w-3 h-3 mr-1" />
                    {item.format}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    난이도: {item.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Audience Signal Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-foreground/70" />
          <h2 className="text-xl font-semibold">시청자 반응 신호</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audienceSignals.map((signal, index) => (
            <Card key={index} className="hover:border-foreground/30 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="p-2 bg-foreground/5 rounded-lg h-fit">
                    <signal.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{signal.title}</h3>
                    <p className="text-sm text-muted-foreground">{signal.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Keyword Expansion Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-foreground/70" />
          <h2 className="text-xl font-semibold">확장 키워드</h2>
        </div>
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3">
              {expandedKeywords.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">{item.keyword}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.volume === "높음" 
                      ? "bg-green-500/10 text-green-600" 
                      : "bg-yellow-500/10 text-yellow-600"
                  }`}>
                    검색량 {item.volume}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.competition === "낮음"
                      ? "bg-blue-500/10 text-blue-600"
                      : item.competition === "중간"
                      ? "bg-yellow-500/10 text-yellow-600"
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    경쟁 {item.competition}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Growth Experiment Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Beaker className="w-5 h-5 text-foreground/70" />
          <h2 className="text-xl font-semibold">성장 실험 제안</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {growthExperiments.map((experiment, index) => (
            <Card key={index} className="group hover:border-foreground/30 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">EXP.{String(index + 1).padStart(2, '0')}</span>
                  {experiment.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{experiment.description}</p>
                <div className="pt-2 border-t border-foreground/10">
                  <p className="text-xs text-muted-foreground mb-1">예상 효과</p>
                  <p className="text-sm font-medium">{experiment.expectedImpact}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  투입 노력: {experiment.effort}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
