"use client";

import { useState } from "react";
import { Check, Zap, Crown, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BILLING_PLANS,
  CREDIT_PRODUCTS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
} from "./types";
import type { UserBillingStatus } from "@/lib/server/billing/getUserBillingStatus";

// ─── Subscription plan card ───────────────────────────────────────────────────

function SubscriptionPlanCard({
  plan,
  isPopular,
}: {
  plan: (typeof BILLING_PLANS)[number];
  isPopular?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "결제 페이지를 열 수 없습니다.");
        return;
      }
      if (typeof json.url === "string") window.location.href = json.url;
      else setError("결제 페이지 URL을 받지 못했습니다.");
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    `채널 ${plan.channels}개`,
    `월 ${plan.monthlyAnalyses}회 분석`,
    "재분석 12시간 쿨다운",
    "영상 50개 분석",
    "Channel Analysis · Channel DNA",
    "Action Plan · Next Trend",
  ];

  return (
    <Card className={`relative flex flex-col ${isPopular ? "border-2 border-primary shadow-md" : ""}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">추천</Badge>
        </div>
      )}
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">${plan.priceUsd}</span>
          <span className="text-sm text-muted-foreground">/월</span>
        </div>
        <CardDescription className="mt-1">{plan.targetAudience}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-4">
        <div className="mb-6 space-y-2.5">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              {f}
            </div>
          ))}
        </div>
        <Button className="mt-auto w-full" onClick={handleSubscribe} disabled={loading}>
          {loading ? "이동 중..." : "구독 시작하기"}
        </Button>
        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── One-time credit card ─────────────────────────────────────────────────────

function CreditProductCard({ product }: { product: (typeof CREDIT_PRODUCTS)[number] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/one-time-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "결제 페이지를 열 수 없습니다.");
        return;
      }
      if (typeof json.url === "string") window.location.href = json.url;
      else setError("결제 페이지 URL을 받지 못했습니다.");
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 text-center">
        <div className="mb-1 flex justify-center">
          <Zap className="h-6 w-6 text-amber-500" />
        </div>
        <CardTitle className="text-base">{product.name}</CardTitle>
        <div className="mt-1">
          <span className="text-2xl font-bold">${product.priceUsd}</span>
        </div>
        <CardDescription className="mt-1">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-2">
        <p className="mb-4 text-center text-sm text-muted-foreground">
          분석 {product.creditCount}회 충전
        </p>
        <Button
          variant="outline"
          className="mt-auto w-full"
          onClick={handlePurchase}
          disabled={loading}
        >
          {loading ? "이동 중..." : "구매하기"}
        </Button>
        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Current plan status card ─────────────────────────────────────────────────

function CurrentPlanCard({ status }: { status: UserBillingStatus }) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function handleManage() {
    if (portalLoading) return;
    setPortalError(null);
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setPortalError(json.error ?? "구독 관리 페이지를 열 수 없습니다.");
        return;
      }
      if (typeof json.url === "string") window.location.href = json.url;
      else setPortalError("포털 URL을 받지 못했습니다.");
    } catch {
      setPortalError("요청 중 오류가 발생했습니다.");
    } finally {
      setPortalLoading(false);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }

  if (status.planId === "free") {
    const total = FREE_LIFETIME_ANALYSIS_LIMIT + status.purchasedCredits;
    const used = status.lifetimeAnalysesUsed;
    const remaining = Math.max(0, total - used);
    return (
      <Card className="border-muted bg-muted/20">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">현재 플랜</h2>
                <Badge variant="outline">Free</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                채널 1개 · 생애 분석 {used}/{total}회 사용
                {remaining > 0
                  ? ` · 잔여 ${remaining}회`
                  : " · 소진됨"}
              </p>
              {status.purchasedCredits > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  (기본 {FREE_LIFETIME_ANALYSIS_LIMIT}회 + 구매 {status.purchasedCredits}회)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planLabel = status.planId === "pro" ? "Pro" : "Creator";
  const statusLabel =
    status.subscriptionStatus === "trialing" ? "체험 중" :
    status.subscriptionStatus === "active" ? "활성" :
    status.subscriptionStatus ?? "—";
  const nextBillingDate = formatDate(status.currentPeriodEnd);

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">현재 플랜</h2>
              <Badge className="bg-primary text-primary-foreground">{planLabel}</Badge>
              <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
            </div>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {nextBillingDate && (
                <p>다음 결제일: {nextBillingDate}</p>
              )}
              <p>이번 달 분석: {status.monthlyCreditsUsed}회 사용</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={handleManage} disabled={portalLoading}>
              {portalLoading ? "이동 중..." : "구독 관리"}
            </Button>
            {portalError && (
              <p className="text-xs text-red-600">{portalError}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BillingView({ initialData }: { initialData: UserBillingStatus }) {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-muted/30 to-background px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <Badge variant="outline" className="mb-4">
            Billing
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">구독 및 결제</h1>
          <p className="mt-2 text-muted-foreground">플랜을 선택하고 채널 분석을 시작하세요.</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12 lg:px-12">
        {/* Current plan status */}
        <section>
          <CurrentPlanCard status={initialData} />
        </section>

        {/* Subscription plans */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">구독 플랜</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            튜브워치의 구독 플랜은 해당 기간 만료 시 종료되며 자동 갱신되지 않습니다. 이는 자동 갱신으로 인한 미사용에 따른 부담을 해소하기 위해 반영된 <strong>안심 구독</strong> 정책입니다.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {BILLING_PLANS.map((plan, i) => (
              <SubscriptionPlanCard key={plan.id} plan={plan} isPopular={i === 1} />
            ))}
          </div>
        </section>

        {/* One-time credit products */}
        <section>
          <div className="mb-2 flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">단건 크레딧</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            무료 횟수 소진 후 구독 없이 분석을 추가로 이용할 수 있습니다.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {CREDIT_PRODUCTS.map((product) => (
              <CreditProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Support CTA */}
        <section className="border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">결제 관련 문의가 있으신가요?</p>
          <Button variant="ghost" size="sm" className="mt-2" asChild>
            <a href="/support">
              고객센터 문의하기 <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </section>
      </div>
    </div>
  );
}
