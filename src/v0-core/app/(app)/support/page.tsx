"use client"

import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  FileText,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Zap,
  Users,
  BarChart3,
  Search,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-4 border-b last:border-0">
      <h4 className="text-sm font-medium mb-2">{question}</h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  )
}

// Guide Card Component  
function GuideCard({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string
  description: string
  icon: React.ElementType 
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SupportPage() {
  const faqs = [
    {
      question: "채널 분석은 얼마나 자주 업데이트 되나요?",
      answer: "채널 분석 데이터는 매일 자동으로 업데이트됩니다. 최신 데이터는 대시보드에서 확인하실 수 있습니다."
    },
    {
      question: "여러 채널을 동시에 분석할 수 있나요?",
      answer: "네, Premium 플랜 이상에서는 최대 5개의 채널을 동시에 분석하고 비교할 수 있습니다."
    },
    {
      question: "액션 플랜은 어떻게 생성되나요?",
      answer: "AI가 채널 데이터를 분석하여 현재 상황에 맞는 맞춤형 액션 플랜을 자동으로 생성합니다."
    },
    {
      question: "플랜을 변경하거나 취소하려면 어떻게 하나요?",
      answer: "Billing 페이지에서 언제든지 플랜을 변경하거나 구독을 취소할 수 있습니다."
    },
    {
      question: "데이터는 안전하게 보호되나요?",
      answer: "모든 데이터는 암호화되어 저장되며, Google OAuth를 통해 안전하게 인증됩니다. 귀하의 YouTube 계정 정보는 분석 목적으로만 사용됩니다."
    }
  ]

  const guides = [
    {
      title: "채널 분석 시작하기",
      description: "채널 점수와 진단 리포트를 이해하는 방법",
      icon: BarChart3
    },
    {
      title: "액션 플랜 활용하기",
      description: "AI 추천 액션을 효과적으로 실행하는 방법",
      icon: Zap
    },
    {
      title: "SEO Lab 가이드",
      description: "키워드 분석과 태그 최적화 전략",
      icon: Search
    },
    {
      title: "벤치마크 분석",
      description: "경쟁 채널과 비교 분석하는 방법",
      icon: Users
    },
    {
      title: "트렌드 활용하기",
      description: "Next Trend로 콘텐츠 아이디어 발굴",
      icon: TrendingUp
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">Support</Badge>
          <h1 className="text-3xl font-bold tracking-tight">도움말 센터</h1>
          <p className="text-muted-foreground mt-2">
            TubeWatch 사용에 필요한 도움을 받으세요.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">이메일 문의</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      24시간 이내에 답변드립니다.
                    </p>
                    <a 
                      href="mailto:support@tubewatch.io" 
                      className="text-sm text-orange-500 hover:underline inline-flex items-center gap-1"
                    >
                      support@tubewatch.io
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">커뮤니티</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      다른 크리에이터들과 소통하세요.
                    </p>
                    <a 
                      href="#" 
                      className="text-sm text-orange-500 hover:underline inline-flex items-center gap-1"
                    >
                      Telegram 참여하기
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Guides */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">빠른 가이드</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {guides.map((guide, index) => (
                <GuideCard key={index} {...guide} />
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <HelpCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">자주 묻는 질문</CardTitle>
                  <CardDescription>가장 많이 문의되는 질문들입니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {faqs.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-3">원하는 답을 찾지 못하셨나요?</h2>
          <p className="text-muted-foreground mb-6">
            직접 문의해주시면 빠르게 도움드리겠습니다.
          </p>
          <Button asChild>
            <a href="mailto:support@tubewatch.io">
              <Mail className="w-4 h-4 mr-2" />
              문의하기
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
