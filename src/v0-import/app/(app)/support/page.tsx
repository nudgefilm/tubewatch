"use client"

import Link from "next/link"
import { 
  HelpCircle, 
  Youtube, 
  BarChart3, 
  FileText, 
  CreditCard,
  Mail,
  Clock,
  Shield,
  ChevronRight,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Quick Help Cards Data
const quickHelpCards = [
  {
    icon: Youtube,
    title: "채널 등록 방법",
    description: "유튜브 채널 URL을 입력하여 간편하게 채널을 등록하세요",
    href: "/channels",
  },
  {
    icon: BarChart3,
    title: "채널 분석은 어떻게 진행되나요?",
    description: "등록된 채널의 데이터를 기반으로 자동 분석이 진행됩니다",
    href: "/channels",
  },
  {
    icon: FileText,
    title: "분석 결과는 어디서 확인하나요?",
    description: "채널 분석, 액션 플랜, SEO 랩, 벤치마크에서 확인할 수 있습니다",
    href: "/action-plan",
  },
  {
    icon: CreditCard,
    title: "요금제와 이용 제한 안내",
    description: "현재 무료 플랜으로 최대 3개 채널까지 등록 가능합니다",
    href: "#",
  },
]

// FAQ Data
const faqItems = [
  {
    question: "채널은 몇 개까지 등록할 수 있나요?",
    answer: "기본적으로 최대 3개의 채널을 등록할 수 있습니다.",
  },
  {
    question: "채널 분석은 얼마나 자주 할 수 있나요?",
    answer: "분석 정책에 따라 일정 시간 이후 다시 요청할 수 있습니다.",
  },
  {
    question: "분석 결과는 어디에서 확인하나요?",
    answer: "채널 분석 페이지, 액션 플랜, SEO 랩, 벤치마크 페이지에서 확인할 수 있습니다.",
  },
  {
    question: "유튜브 채널 URL은 어떤 형식으로 입력해야 하나요?",
    answer: "@채널명, youtube.com/@채널명, youtube.com/channel/UCxxxx 형식을 지원합니다.",
  },
  {
    question: "로그인은 어떤 방식으로 진행되나요?",
    answer: "Google 계정으로 간편하게 로그인할 수 있습니다.",
  },
]

// Getting Started Steps
const gettingStartedSteps = [
  "Google 계정으로 로그인",
  "내 채널 페이지에서 채널 등록",
  "채널 분석 실행",
  "액션 플랜과 SEO 랩 확인",
  "벤치마크로 비교 확인",
]

// Trust Items
const trustItems = [
  "TubeWatch는 Google 계정 비밀번호를 저장하지 않습니다",
  "분석 결과는 채널 데이터 기반으로 제공됩니다",
  "일부 기능은 서비스 정책에 따라 제한될 수 있습니다",
]

function QuickHelpCard({ 
  icon: Icon, 
  title, 
  description, 
  href 
}: { 
  icon: React.ElementType
  title: string
  description: string
  href: string
}) {
  return (
    <Card className="hover-lift">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">{description}</CardDescription>
        <Button variant="outline" size="sm" asChild>
          <Link href={href}>
            자세히 보기
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">고객 지원</h1>
          <p className="mt-1 text-muted-foreground">
            TubeWatch 이용 방법과 자주 묻는 질문을 확인하세요
          </p>
        </div>

        {/* Quick Help Cards Section */}
        <section className="mb-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickHelpCards.map((card) => (
              <QuickHelpCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">자주 묻는 질문</h2>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Getting Started Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">처음 시작하기</h2>
          <Card>
            <CardContent className="pt-6">
              <ol className="space-y-4">
                {gettingStartedSteps.map((step, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">문의 안내</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-6 text-muted-foreground">
                서비스 이용 중 도움이 필요하면 아래 경로로 문의하세요
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">이메일 문의</p>
                    <p className="text-sm text-muted-foreground">support@tubewatch.ai</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">운영 시간</p>
                    <p className="text-sm text-muted-foreground">평일 10:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trust Section */}
        <section>
          <h2 className="mb-6 text-xl font-semibold tracking-tight">안내 사항</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {trustItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Shield className="size-5 shrink-0 text-primary mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
