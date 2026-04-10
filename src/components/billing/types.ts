/**
 * Billing plan types — Creator / Pro subscription + Single / Triple one-time credits.
 */

// ─── Subscription plans ───────────────────────────────────────────────────────

export type BillingPlanId = "creator" | "pro" | "creator_6m" | "pro_6m";

export type BillingPeriod = "monthly" | "semiannual";

export interface BillingPlan {
  id: Extract<BillingPlanId, "creator" | "pro">;
  name: string;
  priceUsd: number;
  /** 6개월 결제 총액 (USD) */
  semiannualPriceUsd: number;
  /** 월 결제 원화 (PortOne/TossPayments용) */
  priceKrw: number;
  /** 6개월 결제 원화 (PortOne/TossPayments용) */
  semiannualPriceKrw: number;
  /** 6개월 플랜 ID */
  semiannualPlanId: Extract<BillingPlanId, "creator_6m" | "pro_6m">;
  /** 6개월 절약 문구 */
  semiannualBadge: string;
  /** 채널 수 */
  channels: number;
  /** 월 분석 횟수 */
  monthlyAnalyses: number;
  /** 추천 대상 (월간) */
  targetAudience: string;
  /** 추천 대상 (6개월) */
  targetAudienceSemiannual: string;
  /** Stripe subscription price ID (env-based, null until resolved on server) */
  stripePriceId: string | null;
}

/** Env var names for subscription price IDs. Resolve on server via process.env[key]. */
export const SUBSCRIPTION_PRICE_ID_ENV_KEYS: Record<BillingPlanId, string> = {
  creator: "STRIPE_SUBSCRIPTION_CREATOR_PRICE_ID",
  pro: "STRIPE_SUBSCRIPTION_PRO_PRICE_ID",
  creator_6m: "STRIPE_SUBSCRIPTION_CREATOR_6M_PRICE_ID",
  pro_6m: "STRIPE_SUBSCRIPTION_PRO_6M_PRICE_ID",
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "creator",
    name: "Creator",
    priceUsd: 9,
    semiannualPriceUsd: 49,
    priceKrw: 9900,
    semiannualPriceKrw: 49000,
    semiannualPlanId: "creator_6m",
    semiannualBadge: "한 달이 공짜",
    channels: 3,
    monthlyAnalyses: 90,
    targetAudience: "1인 크리에이터 전용",
    targetAudienceSemiannual: "꾸준한 성장을 원하는 크리에이터",
    stripePriceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 29,
    semiannualPriceUsd: 149,
    priceKrw: 29900,
    semiannualPriceKrw: 149000,
    semiannualPlanId: "pro_6m",
    semiannualBadge: "약 17% 할인",
    channels: 10,
    monthlyAnalyses: 300,
    targetAudience: "성장 채널 전용",
    targetAudienceSemiannual: "성과 집중 채널 전용",
    stripePriceId: null,
  },
];

// ─── One-time credit products ─────────────────────────────────────────────────

export type CreditProductId = "single" | "triple";

export interface CreditProduct {
  id: CreditProductId;
  name: string;
  priceUsd: number;
  /** 원화 가격 (PortOne/TossPayments용) */
  priceKrw: number;
  /** 충전되는 분석 횟수 */
  creditCount: number;
  description: string;
  /** Stripe one-time price ID (env-based, null until resolved on server) */
  stripePriceId: string | null;
}

/** Env var names for one-time credit price IDs. */
export const CREDIT_PRICE_ID_ENV_KEYS: Record<CreditProductId, string> = {
  single: "STRIPE_CREDIT_SINGLE_PRICE_ID",
  triple: "STRIPE_CREDIT_TRIPLE_PRICE_ID",
};

export const CREDIT_PRODUCTS: CreditProduct[] = [
  {
    id: "single",
    name: "싱글 패스",
    priceUsd: 2.9,
    priceKrw: 3900,
    creditCount: 1,
    description: "1회 분석",
    stripePriceId: null,
  },
  {
    id: "triple",
    name: "트리플 팩",
    priceUsd: 5.9,
    priceKrw: 7900,
    creditCount: 3,
    description: "3회 분석",
    stripePriceId: null,
  },
];

/** Free 플랜 생애 분석 한도 */
export const FREE_LIFETIME_ANALYSIS_LIMIT = 3;
