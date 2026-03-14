/**
 * Billing plan types for Creator / Pro / Agency.
 * Structured for future Stripe subscription integration.
 */

export type BillingPlanId = "creator" | "pro" | "agency";

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
  agency: "STRIPE_SUBSCRIPTION_AGENCY_PRICE_ID",
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "creator",
    name: "Creator",
    priceUsd: 19,
    channels: 1,
    monthlyAnalyses: 10,
    targetAudience: "1인 크리에이터",
    stripePriceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    channels: 5,
    monthlyAnalyses: 50,
    targetAudience: "성장 중인 채널 운영자",
    stripePriceId: null,
  },
  {
    id: "agency",
    name: "Agency",
    priceUsd: 99,
    channels: 20,
    monthlyAnalyses: 200,
    targetAudience: "멀티 채널 / 에이전시",
    stripePriceId: null,
  },
];
