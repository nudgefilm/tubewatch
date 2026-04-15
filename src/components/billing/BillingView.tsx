"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TermsModal } from "@/components/landing/terms-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BILLING_PLANS,
  CREDIT_PRODUCTS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
  type BillingPeriod,
  type BillingPlanId,
  type CreditProductId,
} from "./types";
import type { UserBillingStatus } from "@/lib/server/billing/getUserBillingStatus";

// ─── Google Ads 구매 전환 이벤트 ──────────────────────────────────────────────

function fireAdsConversion(transactionId: string, value?: number) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", "conversion", {
    send_to: "AW-17934413106/GKwpCNLttJocELLa5edC",
    transaction_id: transactionId,
    ...(value !== undefined ? { value, currency: "KRW" } : {}),
  });
}

// ─── PortOne SDK 동적 로드 ─────────────────────────────────────────────────

async function requestPortOnePayment(params: {
  paymentId: string;
  orderName: string;
  totalAmount: number;
  redirectUrl: string;
}) {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  if (!storeId || !channelKey) {
    throw new Error("결제 설정이 올바르지 않습니다. 관리자에게 문의해주세요.");
  }
  const PortOne = (await import("@portone/browser-sdk/v2")).default;
  return PortOne.requestPayment({
    storeId,
    channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: "KRW",
    payMethod: "CARD",
    redirectUrl: params.redirectUrl,
  });
}

// ─── PortOne 리디렉트 복귀 처리 ────────────────────────────────────────────

function usePortOneRedirectReturn(onSuccess: () => void) {
  const searchParams = useSearchParams();
  const [returnState, setReturnState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    const paymentId = searchParams.get("po_payment_id");
    if (!paymentId) return;

    const type = searchParams.get("po_type") as "subscription" | "credit" | null;
    const planId = searchParams.get("po_plan");
    const productId = searchParams.get("po_product");
    if (!type) return;

    setReturnState("verifying");

    const body =
      type === "subscription"
        ? { paymentId, type, planId }
        : { paymentId, type, productId };

    // 금액 역산 (ROAS 측정용)
    let redirectAmount: number | undefined;
    if (type === "subscription" && planId) {
      const matchedPlan = BILLING_PLANS.find(
        (p) => p.id === planId || p.semiannualPlanId === planId
      );
      if (matchedPlan) {
        const isSemiannual = planId === "creator_6m" || planId === "pro_6m";
        redirectAmount = isSemiannual ? matchedPlan.semiannualPriceKrw : matchedPlan.priceKrw;
      }
    } else if (type === "credit" && productId) {
      const matchedProduct = CREDIT_PRODUCTS.find((p) => p.id === productId);
      redirectAmount = matchedProduct?.priceKrw;
    }

    fetch("/api/portone/payment-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((json: { ok?: boolean; error?: string }) => {
        if (json.ok) {
          fireAdsConversion(paymentId, redirectAmount);
          setReturnState("success");
          onSuccess();
        } else {
          setReturnState("error");
          setReturnError(json.error ?? "결제 확인에 실패했습니다.");
        }
      })
      .catch(() => {
        setReturnState("error");
        setReturnError("결제 확인 중 오류가 발생했습니다.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { returnState, returnError };
}

// ─── Subscription plan card ───────────────────────────────────────────────────

function SubscriptionPlanCard({
  plan,
  isPopular,
  period,
  currentPlanId,
}: {
  plan: (typeof BILLING_PLANS)[number];
  isPopular?: boolean;
  period: BillingPeriod;
  currentPlanId: "free" | "creator" | "pro";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const checkboxId = `agree-${plan.id}-${period}`;

  // 현재 구독 중인 플랜 여부 + 전체 구독 중 여부 (구매 차단 기준)
  const isCurrentPlan = plan.id === currentPlanId;
  const isSubscribed = currentPlanId !== "free";

  const isSemiannual = period === "semiannual";
  const planId: BillingPlanId = isSemiannual ? plan.semiannualPlanId : plan.id;

  async function handleSubscribePortOne() {
    const amountKrw = isSemiannual ? plan.semiannualPriceKrw : plan.priceKrw;
    const orderName = `TubeWatch ${plan.name} ${isSemiannual ? "6개월" : "1개월"}`;
    const paymentId = `tw_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUrl =
      `${baseUrl}/billing?po_payment_id=${paymentId}&po_type=subscription&po_plan=${planId}`;

    let response;
    try {
      response = await requestPortOnePayment({ paymentId, orderName, totalAmount: amountKrw, redirectUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 모듈 로드에 실패했습니다.");
      return;
    }

    // 팝업 결제 완료 시 응답 수신 (리디렉트 시에는 undefined)
    if (!response) return; // 리디렉트 → usePortOneRedirectReturn이 처리
    if ("code" in response && response.code) {
      setError(("message" in response ? (response as { message?: string }).message : null) ?? "결제에 실패했습니다.");
      return;
    }

    // 팝업 결제 성공 → 서버 검증
    setLoading(true);
    try {
      const res = await fetch("/api/portone/payment-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, type: "subscription", planId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        fireAdsConversion(paymentId, amountKrw);
        router.refresh();
      } else {
        setError(json.error ?? "결제 확인에 실패했습니다.");
      }
    } catch {
      setError("결제 확인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await handleSubscribePortOne();
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
    "회당 50개 영상 분석 데이터 업데이트",
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
          {isSemiannual ? (
            <>
              <span className="text-3xl font-bold">
                ₩{plan.semiannualPriceKrw.toLocaleString("ko-KR")}
              </span>
              <span className="text-sm text-muted-foreground"> / 6개월</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold">
                ₩{plan.priceKrw.toLocaleString("ko-KR")}
              </span>
              <span className="text-sm text-muted-foreground">/월</span>
            </>
          )}
        </div>
        {isSemiannual && (
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs text-emerald-600 bg-emerald-50">
              {plan.semiannualBadge}
            </Badge>
          </div>
        )}
        <CardDescription className="mt-1">
          {isSemiannual ? plan.targetAudienceSemiannual : plan.targetAudience}
        </CardDescription>
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
        {/* 구독 중인 경우: 구매 차단 + 안내 표시 */}
        {isSubscribed ? (
          <div className="mt-auto rounded-lg border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-center">
            {isCurrentPlan ? (
              <p className="text-sm font-medium text-primary">현재 이용 중인 플랜</p>
            ) : (
              <p className="text-sm text-muted-foreground">구독 만료 후 변경 가능합니다.</p>
            )}
          </div>
        ) : (
          <>
            {/* 청약철회 불가 동의 체크박스 */}
            <label
              htmlFor={checkboxId}
              className="mb-3 flex cursor-pointer items-start gap-2 rounded-lg border border-foreground/8 bg-foreground/[0.02] p-3"
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary cursor-pointer"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                서비스 이용 시작 후에는{" "}
                <strong className="font-medium text-foreground/70">청약철회가 제한</strong>
                될 수 있음을 이해하고 동의합니다.{" "}
                <span className="text-muted-foreground/50">(전자상거래법 제17조)</span>
              </span>
            </label>
            <Button className="mt-auto w-full" onClick={handleSubscribe} disabled={loading || !agreed}>
              {loading ? "처리 중..." : "구독 시작하기"}
            </Button>
            {!agreed && (
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
                위 동의 후 결제가 가능합니다.
              </p>
            )}
            {error && (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── One-time credit card ─────────────────────────────────────────────────────

function CreditProductCard({ product }: { product: (typeof CREDIT_PRODUCTS)[number] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchasePortOne() {
    const productId: CreditProductId = product.id;
    const paymentId = `tw_credit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderName = `TubeWatch ${product.name} (분석 ${product.creditCount}회)`;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUrl =
      `${baseUrl}/billing?po_payment_id=${paymentId}&po_type=credit&po_product=${productId}`;

    let response;
    try {
      response = await requestPortOnePayment({
        paymentId,
        orderName,
        totalAmount: product.priceKrw,
        redirectUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 모듈 로드에 실패했습니다.");
      return;
    }

    if (!response) return; // 리디렉트 처리 중
    if ("code" in response && response.code) {
      setError(("message" in response ? (response as { message?: string }).message : null) ?? "결제에 실패했습니다.");
      return;
    }

    // 팝업 결제 성공 → 서버 검증
    setLoading(true);
    try {
      const res = await fetch("/api/portone/payment-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, type: "credit", productId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        fireAdsConversion(paymentId, product.priceKrw);
        router.refresh();
      } else {
        setError(json.error ?? "결제 확인에 실패했습니다.");
      }
    } catch {
      setError("결제 확인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await handlePurchasePortOne();
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
          <span className="text-2xl font-bold">
            ₩{product.priceKrw.toLocaleString("ko-KR")}
          </span>
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
          {loading ? "처리 중..." : "구매하기"}
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
                <p>만료일: {nextBillingDate}</p>
              )}
              <p>이번 달 분석: {status.monthlyCreditsUsed}회 사용</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BillingView({ initialData }: { initialData: UserBillingStatus }) {
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [termsOpen, setTermsOpen] = useState(false);

  const handlePaymentSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const { returnState, returnError } = usePortOneRedirectReturn(handlePaymentSuccess);

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
        {/* 결제 리디렉트 복귀 상태 알림 */}
        {returnState !== "idle" && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              returnState === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : returnState === "verifying"
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {returnState === "verifying" && "결제를 확인하는 중입니다..."}
            {returnState === "success" && "결제가 완료되었습니다."}
            {returnState === "error" && (returnError ?? "결제 확인에 실패했습니다.")}
          </div>
        )}

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
            튜브워치의 구독 플랜은 해당 <strong>기간 만료 시 종료</strong>되며 자동 갱신되지 않습니다.<br />
          이는 자동 갱신으로 인한 미사용에 따른 부담을 해소하기 위해 반영된 <strong>안심 구독</strong> 정책입니다.
          </p>
          {/* Billing period toggle */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-lg border p-1 bg-muted/40">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  period === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                월간
              </button>
              <button
                type="button"
                onClick={() => setPeriod("semiannual")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  period === "semiannual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                6개월
              </button>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {BILLING_PLANS.map((plan, i) => (
              <SubscriptionPlanCard key={plan.id} plan={plan} isPopular={i === 1} period={period} currentPlanId={initialData.planId} />
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

        {/* Footer links */}
        <section className="border-t pt-8 text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              환불 정책
            </button>
            <span className="px-1 text-muted-foreground/40">|</span>
            <a
              href="/support"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              결제 관련 문의
            </a>
          </div>
        </section>
      </div>

      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
