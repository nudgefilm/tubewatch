"use client"

import Link from "next/link"
import { 
  CreditCard, 
  Check, 
  Crown,
  Tv2,
  Coins,
  ChevronRight,
  Info,
  Zap,
} from "lucide-react"
import { Button } from "@/v0-final/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/v0-final/components/ui/card"
import { Badge } from "@/v0-final/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/v0-final/components/ui/table"
import { Progress } from "@/v0-final/components/ui/progress"

// Mock current plan data
const currentPlan = {
  name: "Pro",
  price: "19,900",
  maxChannels: 10,
  monthlyCredits: 50,
}

// Mock credit data
const creditData = {
  remaining: 32,
  usedThisMonth: 18,
  total: 50,
}

// Credit packages
const creditPackages = [
  {
    id: "credit-20",
    amount: 20,
    price: "9,900",
  },
  {
    id: "credit-50",
    amount: 50,
    price: "19,900",
  },
  {
    id: "credit-100",
    amount: 100,
    price: "34,900",
  },
]

// Plan options
const plans = [
  {
    id: "free",
    name: "Free",
    price: "0",
    period: "무료",
    maxChannels: 3,
    monthlyCredits: 5,
    recommended: false,
    current: false,
    features: [
      "채널 분석",
      "Action Plan",
      "SEO 랩",
      "벤치마크",
      "기본 고객 지원",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,900",
    period: "월",
    maxChannels: 10,
    monthlyCredits: 50,
    recommended: true,
    current: true,
    features: [
      "고급 채널 분석",
      "Action Plan",
      "SEO 랩",
      "벤치마크",
      "SEO 최적화 도구",
      "우선 고객 지원",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "49,900",
    period: "월",
    maxChannels: 30,
    monthlyCredits: 200,
    recommended: false,
    current: false,
    features: [
      "고급 채널 분석",
      "Action Plan",
      "SEO 랩",
      "벤치마크",
      "팀 협업 기능 (추후 제공)",
      "API 액세스 (추후 제공)",
      "전담 고객 지원",
    ],
  },
]

// Mock billing history
const billingHistory = [
  {
    id: 1,
    date: "2025년 3월 1일",
    item: "Pro 플랜 월 구독",
    amount: "19,900원",
    status: "완료",
  },
  {
    id: 2,
    date: "2025년 2월 15일",
    item: "크레딧 50 충전",
    amount: "19,900원",
    status: "완료",
  },
  {
    id: 3,
    date: "2025년 2월 1일",
    item: "Pro 플랜 월 구독",
    amount: "19,900원",
    status: "완료",
  },
]

function PlanCard({ plan }: { plan: typeof plans[0] }) {
  return (
    <Card className={`relative flex flex-col ${plan.recommended ? "border-primary shadow-md" : ""}`}>
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Crown className="size-3 mr-1" />
            추천
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pt-6">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="mt-2">
          {plan.price === "0" ? (
            <span className="text-3xl font-bold">무료</span>
          ) : (
            <>
              <span className="text-3xl font-bold">{plan.price}원</span>
              <span className="text-muted-foreground"> / {plan.period}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">채널 등록</span>
            <span className="font-medium">{plan.maxChannels}개</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">월 기본 크레딧</span>
            <span className="font-medium">{plan.monthlyCredits} Credit</span>
          </div>
        </div>
        
        {/* Feature List */}
        <div className="pt-4 border-t">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-primary shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Button 
          className="w-full" 
          variant={plan.current ? "outline" : plan.recommended ? "default" : "outline"}
          disabled={plan.current}
        >
          {plan.current ? "현재 플랜" : "선택하기"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function CreditPackageCard({ pkg }: { pkg: typeof creditPackages[0] }) {
  return (
    <Card className="text-center">
      <CardHeader className="pb-2">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-2">
          <Coins className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{pkg.amount} Credit</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-xl font-semibold">{pkg.price}원</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline">
          구매하기
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function BillingPage() {
  const creditUsagePercent = (creditData.usedThisMonth / creditData.total) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">요금제 및 크레딧</h1>
          <p className="mt-1 text-muted-foreground">
            현재 요금제와 사용 가능한 분석 크레딧을 확인하고 추가 크레딧을 충전할 수 있습니다
          </p>
        </div>

        <div className="space-y-8">
          {/* Current Plan Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">현재 이용 중인 플랜</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                      <CreditCard className="size-7 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                        <Badge variant="secondary">현재 플랜</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {currentPlan.price}원 / 월
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Tv2 className="size-4" />
                        채널 등록
                      </div>
                      <p className="text-lg font-semibold">최대 {currentPlan.maxChannels}개</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Coins className="size-4" />
                        월 기본 크레딧
                      </div>
                      <p className="text-lg font-semibold">{currentPlan.monthlyCredits} Credit</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/30">
                <Button>
                  플랜 변경
                  <ChevronRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          </section>

          {/* Credit Balance Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">크레딧 사용 현황</h2>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Coins className="size-4" />
                      남은 크레딧
                    </div>
                    <p className="text-3xl font-bold text-primary">{creditData.remaining} Credit</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Zap className="size-4" />
                      이번 달 사용
                    </div>
                    <p className="text-3xl font-bold">{creditData.usedThisMonth} Credit</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">이번 달 크레딧 사용량</span>
                    <span className="font-medium">
                      {creditData.usedThisMonth} / {creditData.total} Credit
                    </span>
                  </div>
                  <Progress value={creditUsagePercent} className="h-2" />
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Info className="size-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    채널 분석 1회 실행 시 1 Credit이 사용됩니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Credit Purchase Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">크레딧 충전</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creditPackages.map((pkg) => (
                <CreditPackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>

          {/* Plan Comparison Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">플랜 비교</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </section>

          {/* Credit Policy Notice Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">크레딧 사용 정책</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">
                      채널 분석 실행 시 1 Credit이 사용됩니다
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">
                      각 채널은 데이터 변화 반영을 위해 72시간 분석 쿨다운이 적용됩니다
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Action Plan은 기존 분석 데이터를 기반으로 제공됩니다
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">
                      SEO 랩과 벤치마크의 일부 고급 기능은 추가 데이터 조회를 기반으로 제공될 수 있습니다
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Billing History Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">결제 내역</h2>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>결제일</TableHead>
                      <TableHead>결제 항목</TableHead>
                      <TableHead>결제 금액</TableHead>
                      <TableHead className="text-right">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.date}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.amount}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50">
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* Support Link Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">결제 관련 문의</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Info className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">도움이 필요하신가요?</p>
                      <p className="text-sm text-muted-foreground">
                        요금제 변경 또는 결제 관련 문의는 고객 지원 페이지에서 확인할 수 있습니다
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/support">
                      고객 지원으로 이동
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
