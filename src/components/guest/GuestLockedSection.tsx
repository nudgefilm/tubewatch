"use client";

import { useState } from "react";
import SectionCard from "@/components/ui/SectionCard";

type GuestLockedSectionProps = {
  title: string;
  channelUrl?: string;
  channelTitle?: string;
};

export function GuestLockedSection({
  title,
  channelUrl = "",
  channelTitle = "",
}: GuestLockedSectionProps): JSX.Element {
  const [loading, setLoading] = useState(false);

  async function handlePurchaseClick(): Promise<void> {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/guest-report-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelUrl,
          channelTitle,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const message =
          typeof json.message === "string" ? json.message : "결제 페이지를 열 수 없습니다.";
        alert(message);
        return;
      }
      const url = typeof json.url === "string" ? json.url : null;
      if (url) {
        window.location.href = url;
      } else {
        alert("결제 페이지 URL을 받지 못했습니다.");
      }
    } catch {
      alert("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-gray-600">
          전체 전략 분석을 보려면 리포트를 구매하세요.
        </p>
        <button
          type="button"
          onClick={handlePurchaseClick}
          disabled={loading}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "이동 중..." : "전략 리포트 구매"}
        </button>
      </div>
    </SectionCard>
  );
}
