"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalysisScoreOverviewProps {
  score: number
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-600"
}

function getScoreLabel(score: number) {
  if (score >= 80) return "양호"
  if (score >= 60) return "보통"
  return "개선 필요"
}

function getScoreTrackColor(score: number) {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#f59e0b"
  return "#f43f5e"
}

export function AnalysisScoreOverview({ score }: AnalysisScoreOverviewProps) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          채널 종합 점수
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={getScoreTrackColor(score)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Score Label */}
        <div className="mt-3 text-center">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              score >= 80
                ? "bg-emerald-50 text-emerald-700"
                : score >= 60
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-700"
            }`}
          >
            {getScoreLabel(score)}
          </span>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          TubeWatch 엔진 분석 기준
        </p>
      </CardContent>
    </Card>
  )
}
