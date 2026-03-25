"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Film, Clock, Repeat, ArrowRight } from "lucide-react"
import type { FormatRecommendation } from "../mock-data"

interface NextTrendFormatSectionProps {
  data: FormatRecommendation[]
}

export function NextTrendFormatSection({ data }: NextTrendFormatSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <CardTitle>포맷 추천</CardTitle>
        </div>
        <CardDescription>
          이 채널에서 효과적이었던 포맷 기반 추천
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {data.map((format) => (
            <div
              key={format.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{format.format}</h4>
                {format.seriesPotential && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    시리즈 가능
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>권장 길이: {format.recommendedLength}</span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">전개 방식</p>
                <div className="flex items-center gap-1 text-sm">
                  {format.approach.split(" → ").map((step, idx, arr) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{step}</span>
                      {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">내부 적합도</span>
                  <span className="font-medium">{format.internalFit}%</span>
                </div>
                <Progress value={format.internalFit} className="h-2" />
              </div>

              <p className="text-xs text-muted-foreground italic">
                {format.basedOn}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
