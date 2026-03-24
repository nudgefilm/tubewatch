"use client"

import { 
  CreditCard, 
  Check, 
  Zap,
  Crown,
  Calendar,
  Receipt,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Plan Feature Component
function PlanFeature({ text, included = true }: { text: string; included?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Check className={`w-4 h-4 ${included ? 'text-green-500' : 'text-muted-foreground/30'}`} />
      <span className={`text-sm ${included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}`}>
        {text}
      </span>
    </div>
  )
}

// Plan Card Component
function PlanCard({ 
  name, 
  price, 
  period,
  description,
  features,
  isCurrentPlan = false,
  isPopular = false
}: { 
  name: string
  price: string
  period: string
  description: string
  features: { text: string; included: boolean }[]
  isCurrentPlan?: boolean
  isPopular?: boolean
}) {
  return (
    <Card className={`relative ${isCurrentPlan ? 'border-orange-500 border-2' : ''} ${isPopular ? 'shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-orange-500 text-white">인기</Badge>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="outline" className="bg-background">현재 플랜</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground text-sm">/{period}</span>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <PlanFeature key={index} text={feature.text} included={feature.included} />
          ))}
        </div>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : "default"}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? '현재 사용 중' : '플랜 선택'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function BillingView() {
  const currentPlan = {
    name: 'Premium',
    nextBilling: '2024년 2월 15일',
    amount: '₩29,000'
  }

  const plans = [
    {
      name: 'Free',
      price: '₩0',
      period: '월',
      description: '시작하기 좋은 무료 플랜',
      isCurrentPlan: false,
      isPopular: false,
      features: [
        { text: '채널 1개 분석', included: true },
        { text: '기본 채널 점수', included: true },
        { text: '주간 리포트', included: false },
        { text: '액션 플랜', included: false },
        { text: 'SEO Lab', included: false },
        { text: '트렌드 분석', included: false },
      ]
    },
    {
      name: 'Premium',
      price: '₩29,000',
      period: '월',
      description: '성장하는 크리에이터를 위한 플랜',
      isCurrentPlan: true,
      isPopular: true,
      features: [
        { text: '채널 3개 분석', included: true },
        { text: '상세 진단 리포트', included: true },
        { text: '주간 리포트', included: true },
        { text: '액션 플랜', included: true },
        { text: 'SEO Lab', included: true },
        { text: '트렌드 분석', included: true },
      ]
    },
    {
      name: 'Enterprise',
      price: '₩99,000',
      period: '월',
      description: '전문가 및 에이전시를 위한 플랜',
      isCurrentPlan: false,
      isPopular: false,
      features: [
        { text: '채널 무제한 분석', included: true },
        { text: '고급 벤치마크', included: true },
        { text: 'API 액세스', included: true },
        { text: '우선 지원', included: true },
        { text: '맞춤형 리포트', included: true },
        { text: '전담 매니저', included: true },
      ]
    }
  ]

  const billingHistory = [
    { date: '2024년 1월 15일', description: 'Premium 플랜 - 월간 구독', amount: '₩29,000', status: '결제 완료' },
    { date: '2023년 12월 15일', description: 'Premium 플랜 - 월간 구독', amount: '₩29,000', status: '결제 완료' },
    { date: '2023년 11월 15일', description: 'Premium 플랜 - 월간 구독', amount: '₩29,000', status: '결제 완료' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-5xl mx-auto">
          <Badge variant="outline" className="mb-4">Billing</Badge>
          <h1 className="text-3xl font-bold tracking-tight">구독 및 결제</h1>
          <p className="text-muted-foreground mt-2">
            플랜을 관리하고 결제 내역을 확인합니다.
          </p>
        </div>
      </section>

      {/* Current Plan Summary */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Card className="mb-12 bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <Crown className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{currentPlan.name} Plan</h2>
                      <Badge className="bg-orange-500 text-white">활성</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      다음 결제일: {currentPlan.nextBilling}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    결제 수단 변경
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    구독 취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6">플랜 선택</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <PlanCard key={index} {...plan} />
              ))}
            </div>
          </div>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">결제 내역</CardTitle>
                  <CardDescription>최근 결제 내역을 확인합니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {billingHistory.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded bg-muted">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.amount}</p>
                      <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-3">결제 관련 문의가 있으신가요?</h2>
          <p className="text-muted-foreground mb-6">
            결제, 환불, 플랜 변경에 대해 궁금하신 점이 있으시면 문의해주세요.
          </p>
          <Button variant="outline" asChild>
            <a href="/support">
              고객센터 문의하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
