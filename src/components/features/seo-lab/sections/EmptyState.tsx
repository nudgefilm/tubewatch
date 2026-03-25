"use client"

import { Search } from "lucide-react"

export function SeoLabEmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Search className="mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">SEO 데이터가 없습니다</h3>
      <p className="text-sm text-muted-foreground">
        채널 분석이 완료되면 SEO 최적화 데이터가 표시됩니다.
      </p>
    </div>
  )
}
