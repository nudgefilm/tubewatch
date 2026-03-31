"use client"

import type { EvidenceItem } from "@/lib/next-trend/buildNextTrendInternalSpec"

interface EvidenceBlockProps {
  items: EvidenceItem[]
  className?: string
}

/**
 * ViewModel에서 생성된 Evidence 항목을 표시하는 공용 컴포넌트.
 * 새로운 계산 없음 — 전달받은 items를 그대로 렌더링.
 */
export function EvidenceBlock({ items, className = "" }: EvidenceBlockProps) {
  if (items.length === 0) return null
  const capped = items.slice(0, 3)
  return (
    <div className={`rounded-md border bg-muted/50 px-3 py-2.5 ${className}`}>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {capped.map((item, i) => (
          <div key={i} className="min-w-0">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium leading-snug">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
