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
  const lines = answer.split("\n")
  return (
    <div className="py-4 border-b last:border-0">
      <h4 className="text-sm font-semibold mb-2">{question}</h4>
      <div className="space-y-1">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
        ))}
      </div>
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
        "채널을 등록한 후 사이드바에서 분석할 채널을 선택하고, Channel Analysis 페이지에서 [분석 실행] 버튼을 누르면 됩니다.\n첫 분석은 약 1~2분이 소요되며, 최신 데이터 기준 최대 50개 영상을 분석합니다.\n분석 완료 후 Channel Analysis · Channel DNA · Action Plan · Next Trend 네 가지 페이지에서 결과를 확인할 수 있습니다.",
    },
    {
      question: "분석은 얼마나 자주 할 수 있나요?",
      answer:
        "동일 채널은 24시간 쿨다운이 적용됩니다. 마지막 분석 후 24시간이 지나면 재분석할 수 있습니다.\n채널이 여러 개인 경우 각 채널마다 독립적으로 쿨다운이 적용되므로, 채널별로 원하는 시점에 분석할 수 있습니다.",
    },
    {
      question: "분석 크레딧은 어떻게 충전하나요?",
      answer:
        "Creator 플랜은 월 90회, Pro 플랜은 월 300회 분석이 기본 제공됩니다.\n추가 충전이 필요하면 Billing 페이지에서 싱글 패스(1회·₩6,900) 또는 트리플 팩(3회·₩17,900)을 구매할 수 있습니다.\nFree 플랜은 가입 후 총 3회까지 무료 분석이 제공되며, 소진 후에는 단건 크레딧 구매로 이용하실 수 있습니다.",
    },
    {
      question: "채널은 몇 개까지 등록할 수 있나요?",
      answer:
        "Free 플랜은 채널 1개, Creator 플랜은 최대 3개, Pro 플랜은 최대 10개를 등록할 수 있습니다.\nFree 플랜은 구독 없이 영구적으로 1개 채널을 이용할 수 있습니다.",
    },
    {
      question: "등록한 채널을 바꿀 수 있나요?",
      answer:
        "Creator · Pro 구독 중에는 채널을 교체할 수 있습니다.\n채널 변경은 한 달에 플랜 채널 수만큼 가능합니다(Creator 월 3회, Pro 월 10회).\nFree 플랜 및 구독 만료 후에는 채널 변경이 제한됩니다.",
    },
    {
      question: "월간 채널 리포트는 무엇인가요?",
      answer:
        "[내 채널] 페이지의 '월간 리포트 신청' 버튼을 통해 튜브워치가 작성한 종합 채널 분석 리포트를 받아볼 수 있습니다.\n채널 현황·성과 지표·콘텐츠 전략까지 하나의 문서로 정리해 드리며, 생성에는 약 2~3분이 소요됩니다.\n채널당 30일에 1회 생성할 수 있으며, 이미 생성된 리포트가 있으면 '리포트 확인' 버튼으로 바로 열람할 수 있습니다.",
    },
    {
      question: "각 분석 메뉴는 어떻게 활용하나요?",
      answer:
        "분석 완료 후 결과는 아래 네 메뉴에서 확인할 수 있습니다.\nChannel Analysis: 채널 종합 점수, 구간 진단, 성과 흐름 등 채널 현황을 전반적으로 파악합니다.\nChannel DNA: 강점·약점 패턴, 영상 포맷 분포, 팬덤 응집도 등 채널 고유의 구조를 진단합니다.\nAction Plan: 분석 결과를 바탕으로 튜브워치 엔진이 자동 생성한 우선순위별 실행 과제 목록입니다.\nNext Trend: 트렌드 신호와 키워드를 바탕으로 다음 콘텐츠 아이디어를 발굴합니다.\nChannel DNA · Action Plan · Next Trend는 Creator · Pro 플랜에서 이용할 수 있습니다.",
    },
    {
      question: "구독이 만료되면 데이터는 어떻게 되나요?",
      answer:
        "구독 만료 시 기존 분석 데이터와 채널 정보는 그대로 유지됩니다.\n단, 채널 추가·변경은 불가하며 Channel DNA · Action Plan · Next Trend 등 유료 기능은 재구독 전까지 접근이 제한됩니다.\n재구독하면 즉시 모든 기능이 복원됩니다.",
    },
    {
      question: "플랜을 다운그레이드하면 채널은 어떻게 되나요?",
      answer:
        "다운그레이드는 현재 구독 만료 후 적용됩니다.\nPro → Creator로 전환 시 등록 채널이 3개를 초과하는 경우, 구독 만료 전에 직접 채널을 정리해두는 것을 권장합니다.",
    },
    {
      question: "플랜을 변경하거나 구독하려면 어떻게 하나요?",
      answer:
        "Billing 페이지에서 플랜을 선택해 구독할 수 있습니다.\nTubeWatch 구독은 자동 갱신 없이 선택한 기간(월간·6개월) 만료 시 종료되는 안심 구독 방식입니다.\n업그레이드는 즉시 적용되며, 다운그레이드는 현재 구독 만료 후 적용됩니다.",
    },
    {
      question: "탈퇴하면 데이터는 어떻게 되나요?",
      answer:
        "탈퇴 시 분석 데이터와 채널 정보는 즉시 영구 삭제되며 복구할 수 없습니다.\n같은 Google 계정으로 재가입해도 기존 데이터는 연동되지 않습니다.\n결제·구독 이력은 전자상거래법에 따라 5년간 보관 후 파기됩니다.",
    },
    {
      question: "데이터는 안전하게 보호되나요?",
      answer:
        "모든 데이터는 암호화되어 저장되며, Google OAuth를 통해 안전하게 인증됩니다.\nYouTube 채널 정보는 분석 목적으로만 사용되며 제3자에게 제공되지 않습니다.",
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
      description: "튜브워치 엔진 추천 실행 과제를 우선순위에 따라 적용하는 방법",
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
