/**
 * Billing plan types — Creator / Pro subscription + Single / Triple one-time credits.
 */

// ─── Subscription plans ───────────────────────────────────────────────────────

export type BillingPlanId = "creator" | "pro";

export type BillingPeriod = "monthly" | "semiannual";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  priceUsd: number;
  /** 6개월 결제 총액 (USD) */
  semiannualPriceUsd: number;
  /** 월 결제 원화 (PortOne/TossPayments용) */
  priceKrw: number;
  /** 6개월 결제 원화 (PortOne/TossPayments용) */
  semiannualPriceKrw: number;
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
    priceUsd: 14.9,
    semiannualPriceUsd: 74.9,
    priceKrw: 19900,
    semiannualPriceKrw: 99000,
    semiannualBadge: "한 달이 공짜",
    channels: 3,
    monthlyAnalyses: 90,
    targetAudience: "1인 크리에이터 전용",
    targetAudienceSemiannual: "꾸준한 성장을 원하는 크리에이터",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 37.9,
    semiannualPriceUsd: 187.9,
    priceKrw: 49900,
    semiannualPriceKrw: 249000,
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
    priceUsd: 5.2,
    priceKrw: 6900,
    creditCount: 1,
    description: "1회 분석",
  },
  {
    id: "triple",
    name: "트리플 팩",
    priceUsd: 13.5,
    priceKrw: 17900,
    creditCount: 3,
    description: "3회 분석",
  },
];

/** Free 플랜 생애 분석 한도 */
export const FREE_LIFETIME_ANALYSIS_LIMIT = 3;

// ─── Enterprise consulting product ───────────────────────────────────────────

export const ENTERPRISE_PRODUCT = {
  id: "enterprise-standard" as const,
  name: "Enterprise Standard",
  priceKrw: 330000,
  durationMonths: 3,
  reportsTotal: 3,
  description: "전문가 진단 채널 분석 컨설팅",
  badge: "VAT 포함",
} as const;
