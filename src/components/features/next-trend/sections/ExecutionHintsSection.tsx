"use client"

import { PlanDocument } from "@/components/features/shared/OnePagerCard"

interface ExecutionHintDocumentProps {
  markdown: string | null
}

export function ExecutionHintDocument({ markdown }: ExecutionHintDocumentProps) {
  if (!markdown) return null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <PlanDocument markdown={markdown} />
      </div>
    </div>
  )
}
