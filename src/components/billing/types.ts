/**
 * Billing plan types — Creator / Pro subscription + Single / Triple one-time credits.
 */

// ─── Subscription plans ───────────────────────────────────────────────────────

export type BillingPlanId = "creator" | "pro";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  priceUsd: number;
  /** 채널 수 */
  channels: number;
  /** 월 분석 횟수 */
  monthlyAnalyses: number;
  /** 추천 대상 */
  targetAudience: string;
  /** Stripe subscription price ID (env-based, null until resolved on server) */
  stripePriceId: string | null;
}

/** Env var names for subscription price IDs. Resolve on server via process.env[key]. */
export const SUBSCRIPTION_PRICE_ID_ENV_KEYS: Record<BillingPlanId, string> = {
  creator: "STRIPE_SUBSCRIPTION_CREATOR_PRICE_ID",
  pro: "STRIPE_SUBSCRIPTION_PRO_PRICE_ID",
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "creator",
    name: "Creator",
    priceUsd: 9,
    channels: 3,
    monthlyAnalyses: 90,
    targetAudience: "1인 크리에이터",
    stripePriceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 29,
    channels: 10,
    monthlyAnalyses: 300,
    targetAudience: "성장 중인 채널 운영자",
    stripePriceId: null,
  },
];

// ─── One-time credit products ─────────────────────────────────────────────────

export type CreditProductId = "single" | "triple";

export interface CreditProduct {
  id: CreditProductId;
  name: string;
  priceUsd: number;
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
    creditCount: 1,
    description: "1회 분석",
    stripePriceId: null,
  },
  {
    id: "triple",
    name: "트리플 팩",
    priceUsd: 5.9,
    creditCount: 3,
    description: "3회 분석",
    stripePriceId: null,
  },
];

/** Free 플랜 생애 분석 한도 */
export const FREE_LIFETIME_ANALYSIS_LIMIT = 3;
