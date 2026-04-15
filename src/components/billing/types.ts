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
}

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
}

export const CREDIT_PRODUCTS: CreditProduct[] = [
  {
    id: "single",
    name: "싱글 패스",
    priceUsd: 2.9,
    priceKrw: 3900,
    creditCount: 1,
    description: "1회 분석",
  },
  {
    id: "triple",
    name: "트리플 팩",
    priceUsd: 5.9,
    priceKrw: 7900,
    creditCount: 3,
    description: "3회 분석",
  },
];

/** Free 플랜 생애 분석 한도 */
export const FREE_LIFETIME_ANALYSIS_LIMIT = 3;
