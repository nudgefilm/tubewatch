"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle2, XCircle, Target, Layers, Type } from "lucide-react"
import { seoDiagnosticData } from "./mock-data"

type Status = "good" | "warning" | "critical"

const statusConfig: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  good: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" }
}

interface DiagnosticCardProps {
  title: string
  score: number
  status: Status
  description: string
  detail: string
  icon: typeof Target
}

function DiagnosticCard({ title, score, status, description, detail, icon: Icon }: DiagnosticCardProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-2 ${config.bg}`}>
              <Icon className={`size-4 ${config.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <StatusIcon className={`size-4 ${config.color}`} />
            <span className={`text-lg font-bold ${config.color}`}>{score}</span>
          </div>
        </div>
        <Progress value={score} className="mt-3 h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

interface SeoLabDiagnosticSectionProps {
  data?: typeof seoDiagnosticData
}

export function SeoLabDiagnosticSection({ data = seoDiagnosticData }: SeoLabDiagnosticSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">SEO 진단</h2>
        <p className="text-sm text-muted-foreground">채널의 SEO 구조적 상태를 진단합니다</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DiagnosticCard
          title="제목 명확성"
          score={data.titleClarity.score}
          status={data.titleClarity.status}
          description={data.titleClarity.description}
          detail={data.titleClarity.detail}
          icon={Type}
        />
        <DiagnosticCard
          title="키워드 포함율"
          score={data.keywordInclusion.score}
          status={data.keywordInclusion.status}
          description={data.keywordInclusion.description}
          detail={data.keywordInclusion.detail}
          icon={Target}
        />
        <DiagnosticCard
          title="키워드 일관성"
          score={data.keywordConsistency.score}
          status={data.keywordConsistency.status}
          description={data.keywordConsistency.description}
          detail={data.keywordConsistency.detail}
          icon={Layers}
        />
      </div>

      {/* 대표 키워드 축 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">대표 키워드 축</CardTitle>
          <CardDescription>이 채널을 대표하는 핵심 키워드</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-primary/10 px-4 py-2">
              <p className="text-lg font-bold text-primary">{data.representativeKeyword.keyword}</p>
              <p className="text-xs text-muted-foreground">강도: {data.representativeKeyword.strength}%</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.representativeKeyword.relatedKeywords.map((kw) => (
                <Badge key={kw} variant="secondary">{kw}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제목 구조 안정성 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">제목 구조 분포</CardTitle>
          <CardDescription>사용 중인 제목 구조와 성과</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.titleStructureStability.patterns.map((pattern) => (
              <div key={pattern.structure} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{pattern.structure}</span>
                  <Badge variant={
                    pattern.performance === "high" ? "default" :
                    pattern.performance === "medium" ? "secondary" : "outline"
                  }>
                    {pattern.performance === "high" ? "고성과" :
                     pattern.performance === "medium" ? "보통" : "저성과"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pattern.usage} className="h-2 w-24" />
                  <span className="w-10 text-right text-sm text-muted-foreground">{pattern.usage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
