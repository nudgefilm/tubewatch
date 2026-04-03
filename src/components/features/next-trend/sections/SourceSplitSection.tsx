"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GitBranch, Home, ExternalLink, Sun } from "lucide-react"
import type { SourceSplit } from "@/mocks/next-trend"

interface NextTrendSourceSplitSectionProps {
  data: SourceSplit
}

export function NextTrendSourceSplitSection({ data }: NextTrendSourceSplitSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <CardTitle>내부 / 확장 분리</CardTitle>
        </div>
        <CardDescription>
          내부 흐름 후보 vs 인접 확장 후보 비교
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Internal Candidates */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-green-100 p-2 dark:bg-green-900/30">
                  <Home className="h-4 w-4 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold">내부 흐름 후보</h4>
                  <p className="text-xs text-muted-foreground">메인 추천</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                강도 {data.internal.strength}%
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">신뢰도</span>
                <span className="font-medium">{data.internal.strength}%</span>
              </div>
              <Progress value={data.internal.strength} className="h-2" />
            </div>

            <ul className="space-y-2">
              {data.internal.candidates.map((candidate, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {candidate}
                </li>
              ))}
            </ul>
          </div>

          {/* Expansion Candidates */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
                  <ExternalLink className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">인접 확장 후보</h4>
                  <p className="text-xs text-muted-foreground">보조 탐색</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.expansion.seasonPotential && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Sun className="h-3 w-3" />
                    시즌 가능성
                  </Badge>
                )}
                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  강도 {data.expansion.strength}%
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">신뢰도</span>
                <span className="font-medium">{data.expansion.strength}%</span>
              </div>
              <Progress value={data.expansion.strength} className="h-2" />
            </div>

            <ul className="space-y-2">
              {data.expansion.candidates.map((candidate, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {candidate}
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground italic">
              * 확장 후보는 보수적 접근 권장
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
