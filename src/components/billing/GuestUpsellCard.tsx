"use client";

import Link from "next/link";
import SectionCard from "@/components/ui/SectionCard";
import type { BillingPlanId } from "./types";

const PLAN_LABELS: Record<BillingPlanId, string> = {
  creator: "Creator 플랜 보기",
  pro: "Pro 플랜 보기",
};

export function GuestUpsellCard(): JSX.Element {
  return (
    <SectionCard className="mt-8 border-primary/30 bg-primary/5">
      <p className="text-sm text-gray-600">
        이미 단건 리포트를 구매하셨습니다.
      </p>
      <h2 className="mt-3 text-lg font-semibold text-gray-900">
        1회 리포트가 아니라 지속적인 채널 성장을 원하시나요?
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        TubeWatch 구독으로 액션 플랜, SEO 랩, 채널 DNA를 계속 받아보세요.
      </p>
      <p className="mt-1 text-sm text-gray-600">
        지속 분석이 필요하면 구독 플랜이 더 유리합니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/billing#creator"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {PLAN_LABELS.creator}
        </Link>
        <Link
          href="/billing#pro"
          className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:opacity-90"
        >
          {PLAN_LABELS.pro}
        </Link>
      </div>
    </SectionCard>
  );
}
