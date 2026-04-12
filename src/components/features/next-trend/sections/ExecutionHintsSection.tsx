"use client"

import { PlanDocument } from "@/components/features/shared/OnePagerCard"

interface ExecutionHintDocumentProps {
  markdown: string | null
}

/** AI가 생성한 본문에서 **bold** 마커를 제거 — ## 섹션 제목은 유지 */
function stripBold(md: string): string {
  return md.replace(/\*\*([^*]+)\*\*/g, "$1")
}

export function ExecutionHintDocument({ markdown }: ExecutionHintDocumentProps) {
  if (!markdown) return null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <PlanDocument markdown={stripBold(markdown)} />
      </div>
    </div>
  )
}
