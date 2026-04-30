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

// ─── Consulting products ──────────────────────────────────────────────────────

export type ConsultingPlanId = "standard" | "premium" | "enterprise";

export interface ConsultingPlan {
  id: ConsultingPlanId;
  name: string;
  priceKrw: number;
  reportsTotal: string;
  frequency: string;
  description: string;
  badge: string;
  features: string[];
}

export const CONSULTING_PLANS: ConsultingPlan[] = [
  {
    id: "standard",
    name: "Standard",
    priceKrw: 330000,
    reportsTotal: "총 3회 제공",
    frequency: "월 1회 정기 리포트",
    description: "월 1회 정기 리포트 + 전문가 진단",
    badge: "VAT 포함",
    features: [
      "월 1회 정기 리포트 발행",
      "총 3회 전문가 진단 제공",
      "최근 영상 50개 메타데이터 + 30개 시그널 전수 조사",
      "언폴드랩 수석 전략가 1:1 맞춤형 진단 코멘터리",
      "특허 출원 기술 기반 병목(Bottleneck) 구간 탐지",
      "분석 기반 향후 30일 콘텐츠 실행 로드맵",
      "클라이언트 보고용 전용 URL + 전문가 별도 보고서",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceKrw: 550000,
    reportsTotal: "총 6회 제공",
    frequency: "월 2회 리포트",
    description: "월 2회 리포트 + 전문가 진단",
    badge: "VAT 포함",
    features: [
      "월 2회 정기 리포트 발행",
      "총 6회 전문가 진단 제공",
      "최근 영상 50개 메타데이터 + 30개 시그널 전수 조사",
      "언폴드랩 수석 전략가 1:1 맞춤형 진단 코멘터리",
      "특허 출원 기술 기반 병목(Bottleneck) 구간 탐지",
      "분석 기반 향후 30일 콘텐츠 실행 로드맵",
      "클라이언트 보고용 전용 URL + 전문가 별도 보고서",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceKrw: 1100000,
    reportsTotal: "12회~최대 24회/년",
    frequency: "정기구독 연간",
    description: "정기구독 리포트 연간 + 전문가 진단",
    badge: "VAT 포함",
    features: [
      "연간 정기구독 리포트 12회~최대 24회",
      "전문가 진단 전 기간 제공",
      "최근 영상 50개 메타데이터 + 30개 시그널 전수 조사",
      "언폴드랩 수석 전략가 1:1 맞춤형 진단 코멘터리",
      "특허 출원 기술 기반 병목(Bottleneck) 구간 탐지",
      "분석 기반 향후 30일 콘텐츠 실행 로드맵",
      "클라이언트 보고용 전용 URL + 전문가 별도 보고서",
    ],
  },
];

/** 하위 호환: 기존 단일 상수 (payment-complete route에서 참조) */
export const ENTERPRISE_PRODUCT = CONSULTING_PLANS[0];
