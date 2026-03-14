"use client";

import { useState } from "react";
import SectionCard from "@/components/ui/SectionCard";
import type { BillingPlan } from "./types";

type PricingPlanCardProps = {
  plan: BillingPlan;
};

export function PricingPlanCard({ plan }: PricingPlanCardProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(): Promise<void> {
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
        const msg =
          typeof json.error === "string" && json.error.trim() !== ""
            ? json.error
            : res.status === 401
              ? "로그인이 필요합니다."
              : "결제 페이지를 열 수 없습니다.";
        setError(msg);
        return;
      }

      const url = typeof json.url === "string" ? json.url : null;
      if (url) {
        window.location.href = url;
      } else {
        setError("결제 페이지 URL을 받지 못했습니다.");
      }
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id={plan.id}>
      <SectionCard className="flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          ${plan.priceUsd}
          <span className="text-sm font-normal text-gray-500">/월</span>
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">채널 수</dt>
            <dd className="font-medium">{plan.channels}개</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">월 분석 횟수</dt>
            <dd className="font-medium">{plan.monthlyAnalyses}회</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">추천 대상</dt>
            <dd className="font-medium">{plan.targetAudience}</dd>
          </div>
        </dl>
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "이동 중..." : "구독 시작하기"}
          </button>
        </div>
        {error ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </SectionCard>
    </div>
  );
}
