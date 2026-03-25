"use client"

import { Dna } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function DnaEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Dna className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">채널 DNA 분석 대기 중</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          채널의 성과 구조를 분석하려면 최소 10개 이상의 영상 데이터가 필요합니다.
          <br />
          충분한 데이터가 수집되면 자동으로 분석이 시작됩니다.
        </p>
      </CardContent>
    </Card>
  )
}
