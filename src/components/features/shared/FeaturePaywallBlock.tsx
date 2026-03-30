"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface FeaturePaywallBlockProps {
  title: string
  description: string
  ctaLabel: string
  planLabel?: string
  previewHint?: string
}

export function FeaturePaywallBlock({
  title,
  description,
  ctaLabel,
  planLabel = "Growth",
  previewHint,
}: FeaturePaywallBlockProps) {
  const router = useRouter()
  return (
    <div className="rounded-lg border border-primary/20 bg-muted/30 px-5 py-5 flex flex-col items-center text-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Lock className="size-4 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {previewHint && (
        <p className="text-sm text-muted-foreground mt-2">{previewHint}</p>
      )}
      <p className="text-xs text-muted-foreground">{planLabel} 플랜에서 이어집니다</p>
      <Button size="sm" onClick={() => router.push("/billing")}>
        {ctaLabel}
      </Button>
    </div>
  )
}
