"use client"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageFlowConnectorProps {
  message: string
  ctaLabel: string
  href: string
}

export function PageFlowConnector({ message, ctaLabel, href }: PageFlowConnectorProps) {
  const router = useRouter()
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium leading-relaxed">{message}</p>
      <Button
        size="sm"
        className="shrink-0"
        onClick={() => router.push(href)}
      >
        {ctaLabel}
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
