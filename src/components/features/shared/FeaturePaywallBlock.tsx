"use client"

import { Lock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

interface FeaturePaywallBlockProps {
  ctaLabel: string
}

export function FeaturePaywallBlock({ ctaLabel }: FeaturePaywallBlockProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const channelParam = searchParams.get("channel")
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Lock className="size-4 text-primary shrink-0" />
        <p className="text-sm font-medium text-primary leading-snug">
          전체 분석 데이터는 구독 플랜에서 확인 가능합니다.
        </p>
      </div>
      <Button
        size="sm"
        className="rounded-lg shrink-0"
        onClick={() => router.push(channelParam ? `/billing?channel=${channelParam}` : "/billing")}
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
