"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, Crown, Building2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TermsModal } from "@/components/landing/terms-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BILLING_PLANS,
  CONSULTING_PLANS,
  CREDIT_PRODUCTS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
  type BillingPeriod,
  type BillingPlanId,
  type ConsultingPlanId,
  type CreditProductId,
} from "./types";
import { readSelectedChannelIdFromStorage } from "@/lib/channels/selectedChannelStorage";
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

    const type = searchParams.get("po_type") as "subscription" | "credit" | "enterprise" | null;
    const planId = searchParams.get("po_plan");
    const billingPeriod = searchParams.get("po_period") as "monthly" | "semiannual" | null;
    const productId = searchParams.get("po_product");
    const channelUrl = searchParams.get("po_channel_url");
    const contactEmail = searchParams.get("po_email");
    const contactPhone = searchParams.get("po_phone");
    if (!type) return;

    setReturnState("verifying");

    let body: Record<string, unknown>;
    if (type === "subscription") {
      body = { paymentId, type, planId, billingPeriod };
    } else if (type === "enterprise") {
      body = { paymentId, type, channelUrl, contactEmail, contactPhone };
    } else {
      body = { paymentId, type, productId };
    }

    // 금액 역산 (ROAS 측정용)
    let redirectAmount: number | undefined;
    if (type === "subscription" && planId) {
      const matchedPlan = BILLING_PLANS.find((p) => p.id === planId);
      if (matchedPlan) {
        redirectAmount = billingPeriod === "semiannual"
          ? matchedPlan.semiannualPriceKrw
          : matchedPlan.priceKrw;
      }
    } else if (type === "credit" && productId) {
      const matchedProduct = CREDIT_PRODUCTS.find((p) => p.id === productId);
      redirectAmount = matchedProduct?.priceKrw;
    } else if (type === "enterprise") {
      const consultingPlanId = searchParams.get("po_consulting_plan");
      const matchedConsulting = CONSULTING_PLANS.find((p) => p.id === consultingPlanId);
      redirectAmount = matchedConsulting?.priceKrw ?? CONSULTING_PLANS[0].priceKrw;
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
          setReturnError(json.error ?? "결제는 완료되었지만 적용에 실패했습니다. 새로고침 후 다시 확인해주세요.");
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

// 플랜 + 결제 주기 → 표시용 레이블
function getPlanDisplayLabel(planId: string, billingPeriod: "monthly" | "semiannual" | null): string {
  const periodLabel = billingPeriod === "semiannual" ? " (6개월)" : " (월간)";
  if (planId === "creator") return `Creator${periodLabel}`;
  if (planId === "pro") return `Pro${periodLabel}`;
  return planId;
}

const PLAN_RANK: Record<string, number> = {
  creator: 1,
  pro: 2,
};

// ─── Subscription plan card ───────────────────────────────────────────────────

function SubscriptionPlanCard({
  plan,
  isPopular,
  period,
  currentPlanId,
  currentBillingPeriod,
  pendingPlanId,
  pendingBillingPeriod,
  channelCount,
  isLoading,
  error,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
}: {
  plan: (typeof BILLING_PLANS)[number];
  isPopular?: boolean;
  period: BillingPeriod;
  currentPlanId: "free" | "creator" | "pro";
  currentBillingPeriod: "monthly" | "semiannual" | null;
  pendingPlanId: string | null;
  pendingBillingPeriod: "monthly" | "semiannual" | null;
  channelCount: number;
  isLoading: boolean;
  error: string | null;
  onPaymentStart: () => void;
  onPaymentSuccess: () => void;
  onPaymentError: (msg: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const checkboxId = `agree-${plan.id}-${period}`;

  const isSemiannual = period === "semiannual";
  const amountKrw = isSemiannual ? plan.semiannualPriceKrw : plan.priceKrw;

  const isSubscribed = currentPlanId !== "free";

  // plan.id + period가 모두 동일한 경우에만 현재 플랜으로 차단
  const isExactSamePlan =
    plan.id === currentPlanId && period === currentBillingPeriod;

  // 다운그레이드 여부 (pro → creator): pending으로 처리
  const isDeferredChange =
    isSubscribed &&
    (PLAN_RANK[plan.id] ?? 0) < (PLAN_RANK[currentPlanId] ?? 0);

  // 업그레이드 여부 (creator → pro)
  const isUpgrade = isSubscribed && !isDeferredChange && !isExactSamePlan;

  // 이 카드(plan.id + period)가 예약된 플랜인지
  const thisPlanIsPending =
    pendingPlanId === plan.id && pendingBillingPeriod === period;

  // 다른 플랜이 예약된 상태인지
  const hasPendingPlan = !!pendingPlanId;

  // 버튼 텍스트 결정
  function getButtonLabel(): string {
    if (isLoading) return "결제 처리 중...";
    if (!isSubscribed) return "구독 시작하기";
    if (isDeferredChange) return "만료 후 변경 예약";
    return "지금 변경하기";
  }

  async function handleSubscribePortOne() {
    const orderName = `TubeWatch ${plan.name} ${isSemiannual ? "6개월" : "1개월"}`;
    const paymentId = `twsub${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUrl =
      `${baseUrl}/billing?po_payment_id=${paymentId}&po_type=subscription&po_plan=${plan.id}&po_period=${period}`;

    let response;
    try {
      response = await requestPortOnePayment({ paymentId, orderName, totalAmount: amountKrw, redirectUrl });
    } catch (e) {
      onPaymentError(e instanceof Error ? e.message : "결제 모듈 로드에 실패했습니다.");
      return;
    }

    if (!response) return; // 리디렉트 → usePortOneRedirectReturn이 처리
    if ("code" in response && response.code) {
      onPaymentError(("message" in response ? (response as { message?: string }).message : null) ?? "결제에 실패했습니다.");
      return;
    }

    // 팝업 결제 성공 → 서버 검증
    try {
      const res = await fetch("/api/portone/payment-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, type: "subscription", planId: plan.id, billingPeriod: period }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        fireAdsConversion(paymentId, amountKrw);
        onPaymentSuccess();
      } else {
        onPaymentError(json.error ?? "결제는 완료되었지만 적용에 실패했습니다. 새로고침 후 다시 확인해주세요.");
      }
    } catch {
      onPaymentError("결제 확인 중 오류가 발생했습니다.");
    }
  }

  async function handleSubscribe() {
    if (isLoading) return;
    onPaymentStart();
    try {
      await handleSubscribePortOne();
    } catch {
      onPaymentError("요청 중 오류가 발생했습니다.");
    }
  }

  const features = [
    `채널 ${plan.channels}개`,
    `월 ${plan.monthlyAnalyses}회 분석`,
    "재분석 24시간 쿨다운",
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

        {/* 현재 이용 중인 플랜 */}
        {isExactSamePlan ? (
          <div className="mt-auto rounded-lg border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-center">
            <p className="text-sm font-medium text-primary">현재 이용 중인 플랜</p>
          </div>

        /* 이 플랜이 이미 예약됨 */
        ) : thisPlanIsPending ? (
          <div className="mt-auto rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3 text-center">
            <p className="text-sm font-medium text-primary">다음 플랜으로 예약됨</p>
            <p className="mt-0.5 text-xs text-muted-foreground">현재 구독 만료 후 자동 전환됩니다</p>
          </div>

        /* 다른 플랜이 이미 예약된 경우 → 추가 예약 불가 */
        ) : hasPendingPlan ? (
          <div className="mt-auto rounded-lg border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">이미 다음 플랜이 예약되어 있습니다.</p>
          </div>

        /* 구매 가능한 상태 */
        ) : (
          <>
            {isUpgrade && (
              <div className="mb-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  업그레이드 즉시 적용됩니다. 기존 구독 잔여 기간은 소멸되며, 잔여 기간에 대한 크레딧 보상은{" "}
                  <a href="/support" className="font-medium text-foreground/70 underline underline-offset-2">
                    CS 문의
                  </a>
                  를 통해 신청하실 수 있습니다.
                </p>
              </div>
            )}
            {isDeferredChange && channelCount > plan.channels && (
              <div className="mb-3 rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2.5 dark:border-red-800/60 dark:bg-red-950/30">
                <p className="text-xs font-bold text-red-700 dark:text-red-400">
                  ⚠️ 최신 등록 채널 {plan.channels}개 외 삭제됩니다.
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                  현재 {channelCount}개 채널 중 {channelCount - plan.channels}개가 플랜 전환 시 삭제됩니다.<br />
                  불필요한 채널을 먼저 채널 목록에서 정리한 후 진행하세요.
                </p>
              </div>
            )}
            {isDeferredChange && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center dark:border-amber-800/50 dark:bg-amber-950/30">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  결제 시 현재 구독 만료 후 적용됩니다
                </p>
              </div>
            )}
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
            <Button className="mt-auto w-full" onClick={handleSubscribe} disabled={isLoading || !agreed}>
              {getButtonLabel()}
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
    const paymentId = `twcredit${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
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

// ─── Consulting card (탭: Standard / Premium / Enterprise) ───────────────────

function EnterpriseCard({ initialEmail, userChannels }: { initialEmail: string; userChannels: { id: string; channel_url: string | null }[] }) {
  const searchParams = useSearchParams();
  const paramChannelUrl = searchParams.get("channel_url") ?? "";
  const isEnterpriseFlow = !!searchParams.get("enterprise");

  const [activeTab, setActiveTab] = useState<ConsultingPlanId>("standard");
  const [modalOpen, setModalOpen] = useState(false);
  const [channelUrl, setChannelUrl] = useState(paramChannelUrl);
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelUrlRef = useRef<HTMLInputElement>(null);

  const plan = CONSULTING_PLANS.find((p) => p.id === activeTab) ?? CONSULTING_PLANS[0];

  useEffect(() => {
    if (channelUrl) return;
    const selectedId = readSelectedChannelIdFromStorage();
    if (selectedId) {
      const matched = userChannels.find((c) => c.id === selectedId);
      if (matched?.channel_url) { setChannelUrl(matched.channel_url); return; }
    }
    if (userChannels.length === 1 && userChannels[0].channel_url) {
      setChannelUrl(userChannels[0].channel_url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEnterpriseFlow) setModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modalOpen && !paramChannelUrl) setTimeout(() => channelUrlRef.current?.focus(), 50);
  }, [modalOpen, paramChannelUrl]);

  async function handlePayment() {
    if (!channelUrl.trim()) {
      setError("분석 대상 채널 URL을 입력해주세요.");
      return;
    }
    if (!contactEmail.trim()) {
      setError("담당자 이메일을 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const PortOne = (await import("@portone/browser-sdk/v2")).default;
      const paymentId = `twent${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl =
        `${baseUrl}/billing?po_payment_id=${paymentId}` +
        `&po_type=enterprise` +
        `&po_consulting_plan=${plan.id}` +
        `&po_channel_url=${encodeURIComponent(channelUrl.trim())}` +
        `&po_email=${encodeURIComponent(contactEmail.trim())}` +
        `&po_phone=${encodeURIComponent(contactPhone.trim())}`;

      await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName: `TubeWatch ${plan.name} 컨설팅`,
        totalAmount: plan.priceKrw,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        redirectUrl,
      });
    } catch {
      setError("결제 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const TAB_LABELS: { id: ConsultingPlanId; label: string }[] = [
    { id: "standard", label: "Standard" },
    { id: "premium", label: "Premium" },
    { id: "enterprise", label: "Enterprise" },
  ];

  return (
    <>
      <Card className="flex flex-col border-primary/30 bg-primary/[0.02]">
        {/* 탭 */}
        <div className="flex border-b border-border">
          {TAB_LABELS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors first:rounded-tl-xl last:rounded-tr-xl ${
                activeTab === t.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{plan.name}</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">{plan.badge}</Badge>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold">
              ₩{plan.priceKrw.toLocaleString("ko-KR")}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">{plan.reportsTotal}</span>
          </div>
          <CardDescription className="mt-1">{plan.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 pt-0">
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button className="mt-auto w-full" onClick={() => setModalOpen(true)}>
            신청하기
          </Button>
        </CardContent>
      </Card>

      {/* 채널 URL 입력 모달 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold">{plan.name} 컨설팅 신청</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ent-channel-url" className="text-sm font-medium">
                  분석 대상 채널 URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ent-channel-url"
                  ref={channelUrlRef}
                  placeholder="https://www.youtube.com/@channelname"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">분석을 원하시는 채널 URL을 확인하거나 직접 입력해 주세요.</p>
              </div>
              <div>
                <Label htmlFor="ent-email" className="text-sm font-medium">
                  담당자 이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ent-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="ent-phone" className="text-sm font-medium">
                  연락처
                </Label>
                <Input
                  id="ent-phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive" role="alert">{error}</p>
              )}

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                결제 완료 당일 담당 전략가가 배정되며, 첫 리포트는 분석 완료 후 이메일로 전달됩니다.
              </div>

              <Button
                className="w-full"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "처리 중..." : `₩${plan.priceKrw.toLocaleString("ko-KR")} 결제하기`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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

  const planName = status.planId === "pro" ? "Pro" : "Creator";
  const periodLabel = status.billingPeriod === "semiannual" ? " · 6개월" : " · 월간";
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
              <Badge className="bg-primary text-primary-foreground">{planName}{periodLabel}</Badge>
              <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
            </div>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {nextBillingDate && (
                <p>만료일: {nextBillingDate}</p>
              )}
              <p>이번 달 분석: {status.monthlyCreditsUsed}회 사용</p>
              {status.purchasedCredits > 0 && (
                <p className="text-xs text-muted-foreground">
                  + 추가 크레딧: {status.purchasedCredits}회
                </p>
              )}
              {status.pendingPlanId && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  다음 플랜: {getPlanDisplayLabel(status.pendingPlanId, status.pendingBillingPeriod)} (만료 후 적용)
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BillingView({ initialData, channelCount, userEmail = "", userChannels = [] }: { initialData: UserBillingStatus; channelCount: number; userEmail?: string; userChannels?: { id: string; channel_url: string | null }[] }) {
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [termsOpen, setTermsOpen] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [errorPlanId, setErrorPlanId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRedirectSuccess = useCallback(() => {
    setSuccessMessage("구독이 정상적으로 적용되었습니다.");
    setTimeout(() => {
      router.refresh();
    }, 2000);
  }, [router]);

  const { returnState, returnError } = usePortOneRedirectReturn(handleRedirectSuccess);

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
        {/* 결제 상태 알림 배너 */}
        {returnState === "verifying" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            결제를 확인하는 중입니다...
          </div>
        )}
        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}
        {returnState === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {returnError ?? "결제 확인에 실패했습니다."}
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
            {BILLING_PLANS.map((plan, i) => {
              const planKey = `${plan.id}_${period}`;
              return (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  isPopular={i === 1}
                  period={period}
                  currentPlanId={initialData.planId}
                  currentBillingPeriod={initialData.billingPeriod}
                  pendingPlanId={initialData.pendingPlanId}
                  pendingBillingPeriod={initialData.pendingBillingPeriod}
                  channelCount={channelCount}
                  isLoading={loadingPlanId === planKey}
                  error={errorPlanId === planKey ? errorMessage : null}
                  onPaymentStart={() => {
                    setLoadingPlanId(planKey);
                    setErrorPlanId(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  onPaymentSuccess={() => {
                    setLoadingPlanId(null);
                    setSuccessMessage("구독이 정상적으로 적용되었습니다.");
                    setTimeout(() => router.refresh(), 2000);
                  }}
                  onPaymentError={(msg: string) => {
                    setLoadingPlanId(null);
                    setErrorPlanId(planKey);
                    setErrorMessage(msg);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* Creator/Pro → Free 다운그레이드 안내 */}
        {initialData.planId !== "free" && (
          <section>
            <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-5 py-4">
              <p className="text-sm font-semibold text-foreground/70">Free 플랜 전환 안내</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                <li>구독 만료 시 채널 변경·삭제가 제한됩니다. 기존 채널 데이터는 유지됩니다.</li>
                {channelCount > 1 && (
                  <li className="font-medium text-foreground/60">
                    ⚠️ 구독 해지 후 Free 플랜으로 전환 시 최신 등록 채널 1개 외 삭제됩니다.
                    <span className="ml-1 font-normal text-muted-foreground">(현재 {channelCount}개 등록 중)</span>
                  </li>
                )}
              </ul>
            </div>
          </section>
        )}

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

        {/* Enterprise Standard */}
        <section>
          <div className="mb-2 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">전문가 컨설팅</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            튜브워치 엔진의 정밀함에 전문가의 통찰을 더한 채널 성장 컨설팅 서비스입니다.
          </p>
          <EnterpriseCard initialEmail={userEmail} userChannels={userChannels} />
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
