"use client"

import Link from "next/link"
import {
  HelpCircle,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Zap,
  Users,
  BarChart3,
  TrendingUp,
  CreditCard,
} from "lucide-react"

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-4 border-b last:border-0">
      <h4 className="text-sm font-medium mb-2">{question}</h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  )
}

function GuideCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string
  description: string
  icon: React.ElementType
  href: string
}) {
  return (
    <Link href={href}>
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
    </Link>
  )
}

export default function SupportView() {
  const faqs = [
    {
      question: "채널 분석은 어떻게 실행하나요?",
      answer:
        "채널 등록 후 채널 분석을 바로 시작할 수 있습니다. 설정/채널 관리 및 Channel Analysis 페이지에서 실행할 수 있습니다.",
    },
    {
      question: "분석 크레딧은 어떻게 충전하나요?",
      answer:
        "Creator 플랜은 월 90회, Pro 플랜은 월 300회 분석이 포함됩니다. 추가 충전이 필요하면 Billing 페이지에서 싱글 패스(1회) 또는 트리플 팩(3회)을 구매할 수 있습니다. Free 플랜은 최초 3회까지 무료로 사용 가능합니다.",
    },
    {
      question: "채널은 몇 개까지 등록할 수 있나요?",
      answer:
        "Creator 플랜은 최대 3개, Pro 플랜은 최대 10개의 채널을 등록하고 분석할 수 있습니다. 채널 등록·관리는 Settings 또는 Channels 메뉴에서 할 수 있습니다.",
    },
    {
      question: "Channel DNA는 무엇인가요?",
      answer:
        "Channel DNA는 내 채널의 성과 패턴을 분석하는 기능입니다. 강점·약점 패턴, 영상 포맷 분포, 팬덤 응집도 등 채널 고유의 구조를 진단합니다. 외부 경쟁 채널 비교 기능은 별도로 제공됩니다.",
    },
    {
      question: "Action Plan은 어떻게 활용하나요?",
      answer:
        "채널 분석 결과를 바탕으로 AI가 자동 생성한 실행 과제 목록입니다. 우선순위별로 정렬된 액션 항목을 확인하고, 각 항목의 근거와 실행 시나리오를 참고해 콘텐츠 전략에 적용하세요.",
    },
    {
      question: "플랜을 변경하거나 취소하려면 어떻게 하나요?",
      answer:
        "Billing 페이지에서 언제든지 플랜을 변경하거나 구독을 취소할 수 있습니다. 구독 취소 후에도 남은 결제 기간까지는 서비스를 계속 이용할 수 있습니다.",
    },
    {
      question: "데이터는 안전하게 보호되나요?",
      answer:
        "모든 데이터는 암호화되어 저장되며, Google OAuth를 통해 안전하게 인증됩니다. YouTube 채널 정보는 분석 목적으로만 사용되며 제3자에게 제공되지 않습니다.",
    },
  ]

  const guides = [
    {
      title: "채널 분석 시작하기",
      description: "채널 종합 점수, 구간 진단, 성과 흐름을 확인하는 방법",
      icon: BarChart3,
      href: "/analysis",
    },
    {
      title: "Channel DNA 읽기",
      description: "강점·약점 패턴과 포맷 분포로 채널 구조 파악하기",
      icon: Users,
      href: "/channel-dna",
    },
    {
      title: "Action Plan 활용하기",
      description: "AI 추천 실행 과제를 우선순위에 따라 적용하는 방법",
      icon: Zap,
      href: "/action-plan",
    },
    {
      title: "Next Trend 활용하기",
      description: "트렌드 신호로 다음 콘텐츠 아이디어 발굴하기",
      icon: TrendingUp,
      href: "/next-trend",
    },
    {
      title: "크레딧 & 플랜 가이드",
      description: "분석 크레딧 충전 방법과 플랜별 기능 차이 안내",
      icon: CreditCard,
      href: "/billing",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Support
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">도움말 센터</h1>
          <p className="text-muted-foreground mt-2">TubeWatch 사용에 필요한 도움을 받으세요.</p>
        </div>
      </section>

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
                    <p className="text-sm text-muted-foreground mb-3">24시간 이내에 답변드립니다.</p>
                    <a
                      href="mailto:nudgefilm@gmail.com"
                      className="text-sm text-orange-500 hover:underline inline-flex items-center gap-1"
                    >
                      nudgefilm@gmail.com
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
                    <p className="text-sm text-muted-foreground mb-3">다른 크리에이터들과 소통하세요.</p>
                    <a
                      href="https://t.me/+j18-UwlpPiUxZTI1"
                      target="_blank"
                      rel="noopener noreferrer"
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

      <section className="py-12 px-6 lg:px-12 border-t bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-3">원하는 답을 찾지 못하셨나요?</h2>
          <p className="text-muted-foreground mb-6">직접 문의해주시면 빠르게 도움드리겠습니다.</p>
          <Button asChild>
            <a href="https://t.me/+j18-UwlpPiUxZTI1" target="_blank" rel="noopener noreferrer">
              <TelegramIcon className="w-4 h-4 mr-2" />
              커뮤니티 참여하기
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
