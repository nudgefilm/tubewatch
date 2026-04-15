"use client"

import { Lock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

interface FeaturePaywallBlockProps {
  title: string
  ctaLabel: string
}

export function FeaturePaywallBlock({ title, ctaLabel }: FeaturePaywallBlockProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const channelParam = searchParams.get("channel")
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-5 py-5 flex flex-col items-center text-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Lock className="size-4 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          전체 분석 데이터는 구독 플랜에서 확인 가능합니다.
        </p>
      </div>
      <Button
        size="sm"
        className="rounded-lg"
        onClick={() => router.push(channelParam ? `/billing?channel=${channelParam}` : "/billing")}
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
