"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Image from "next/image"
import { Users, Video, Eye, Activity, Heart, Layers, Search, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/v0-final/components/ui/card"
import { Progress } from "@/v0-final/components/ui/progress"
import { Spinner } from "@/v0-final/components/ui/spinner"

// Mock data for channel info
const mockChannelData = {
  id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
  name: "Sample Channel",
  thumbnail: "/placeholder.svg",
  subscribers: "2.5M",
  videoCount: 1234,
  totalViews: "125M",
}

// Mock analysis results
const mockAnalysisResults = {
  overallScore: 82,
  sections: [
    {
      id: "activity",
      name: "채널 활동",
      icon: Activity,
      score: 85,
      description: "최근 30일간 꾸준한 업로드 빈도를 유지하고 있습니다.",
    },
    {
      id: "engagement",
      name: "시청자 반응",
      icon: Heart,
      score: 78,
      description: "평균 이상의 좋아요 비율과 댓글 참여도를 보입니다.",
    },
    {
      id: "content",
      name: "콘텐츠 구조",
      icon: Layers,
      score: 88,
      description: "영상 길이와 구성이 시청 유지율에 최적화되어 있습니다.",
    },
    {
      id: "seo",
      name: "SEO 최적화",
      icon: Search,
      score: 72,
      description: "제목과 설명의 키워드 활용도를 개선할 여지가 있습니다.",
    },
    {
      id: "growth",
      name: "성장 모멘텀",
      icon: TrendingUp,
      score: 90,
      description: "구독자 및 조회수 증가 추세가 매우 긍정적입니다.",
    },
  ],
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-600"
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-rose-500"
}

function ChannelSummaryCard({ channel }: { channel: typeof mockChannelData }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted">
            <Image
              src={channel.thumbnail}
              alt={channel.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-semibold">{channel.name}</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-6 sm:justify-start">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span>구독자 {channel.subscribers}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="size-4" />
                <span>영상 {channel.videoCount.toLocaleString()}개</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="size-4" />
                <span>총 조회수 {channel.totalViews}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverallScoreCard({ score }: { score: number }) {
  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle>전체 채널 점수</CardTitle>
        <CardDescription>종합 분석 결과</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
        <span className="mt-1 text-sm text-muted-foreground">/ 100</span>
        <div className="mt-4 w-full max-w-[200px]">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalysisSectionCard({
  section,
}: {
  section: (typeof mockAnalysisResults.sections)[0]
}) {
  const Icon = section.icon
  return (
    <Card className="hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5" />
            </div>
            <CardTitle className="text-base">{section.name}</CardTitle>
          </div>
          <span className={`text-2xl font-bold ${getScoreColor(section.score)}`}>
            {section.score}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(section.score)}`}
            style={{ width: `${section.score}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Spinner className="size-8" />
      <p className="text-muted-foreground">채널 분석 중...</p>
    </div>
  )
}

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [channelData, setChannelData] = useState<typeof mockChannelData | null>(null)
  const [analysisResults, setAnalysisResults] = useState<typeof mockAnalysisResults | null>(null)

  useEffect(() => {
    // Simulate API call to fetch channel data and analysis
    const fetchData = async () => {
      setIsLoading(true)
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setChannelData({ ...mockChannelData, id: channelId })
      setAnalysisResults(mockAnalysisResults)
      setIsLoading(false)
    }
    fetchData()
  }, [channelId])

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">채널 분석</h1>
          <p className="mt-1 text-muted-foreground">
            선택한 유튜브 채널의 분석 결과를 확인하세요
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : (
          channelData &&
          analysisResults && (
            <div className="space-y-8">
              {/* Channel Summary */}
              <ChannelSummaryCard channel={channelData} />

              {/* Overall Score */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <OverallScoreCard score={analysisResults.overallScore} />
                </div>
              </div>

              {/* Analysis Sections */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">상세 분석</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {analysisResults.sections.map((section) => (
                    <AnalysisSectionCard key={section.id} section={section} />
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
