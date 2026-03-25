"use client"

import { CircleCheck, CircleAlert, Fingerprint, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ChannelDnaData } from "../mock-data"

interface DnaCardsSectionProps {
  data: ChannelDnaData["dnaCards"]
}

export function DnaCardsSection({ data }: DnaCardsSectionProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "낮음":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "중간":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "높음":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">DNA 카드</h2>
        <Badge variant="outline" className="text-xs">
          Core Patterns
        </Badge>
      </div>

      {/* 강점 / 약점 2열 구조 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 강점 패턴 */}
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleCheck className="size-5 text-emerald-500" />
              강점 패턴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.strengths.map((item) => (
              <div key={item.title} className="rounded-lg border bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm font-semibold text-emerald-600">{item.score}</span>
                </div>
                <Progress
                  value={item.score}
                  className="mt-2 h-1.5 [&>div]:bg-emerald-500"
                />
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 약점 패턴 */}
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-5 text-red-500" />
              약점 패턴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.weaknesses.map((item) => (
              <div key={item.title} className="rounded-lg border bg-red-500/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm font-semibold text-red-600">{item.score}</span>
                </div>
                <Progress
                  value={item.score}
                  className="mt-2 h-1.5 [&>div]:bg-red-500"
                />
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 유지 핵심 패턴 & 리스크 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 유지 핵심 패턴 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="size-5 text-primary" />
              유지 핵심 패턴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.corePatterns.map((item) => (
              <div
                key={item.pattern}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <span className="font-medium">{item.pattern}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p>
                </div>
                <Badge
                  variant={item.importance === "핵심" ? "default" : "secondary"}
                  className="ml-2"
                >
                  {item.importance}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 구조 리스크 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-amber-500" />
              구조 리스크
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.risks.map((risk) => (
              <div key={risk.type} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{risk.type}</span>
                  <Badge className={getRiskLevelColor(risk.level)}>{risk.level}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
