"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import type { RiskMemo } from "./mock-data"

interface NextTrendRiskSectionProps {
  data: RiskMemo[]
}

const churnRiskConfig = {
  high: {
    icon: AlertTriangle,
    label: "높은 이탈 위험",
    className: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50",
    iconColor: "text-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  medium: {
    icon: AlertCircle,
    label: "중간 이탈 위험",
    className: "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50",
    iconColor: "text-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    icon: Info,
    label: "낮은 이탈 위험",
    className: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50",
    iconColor: "text-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
}

export function NextTrendRiskSection({ data }: NextTrendRiskSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle>리스크 메모</CardTitle>
        </div>
        <CardDescription>
          실험 전 주의가 필요한 영역 안내 (부정 평가가 아닌 경계선 안내)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((risk) => {
            const config = churnRiskConfig[risk.churnRisk]
            const Icon = config.icon
            return (
              <div
                key={risk.id}
                className={`rounded-lg border p-4 ${config.className}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 ${config.iconColor}`} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{risk.topic}</h4>
                      <Badge variant="outline" className={config.badgeClass}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{risk.reason}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">확신도:</span>
                      <span className="font-medium">{risk.confidence}%</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">주의 포인트:</p>
                      <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                        {risk.warningPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
