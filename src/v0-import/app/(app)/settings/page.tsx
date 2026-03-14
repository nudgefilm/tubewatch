"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Settings,
  Tv2,
  BarChart3,
  Bell,
  Monitor,
  Globe,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Mock channel data
const channelData = {
  defaultChannel: "내 유튜브 채널",
  registeredChannels: 2,
  maxChannels: 3,
}

// Mock analysis settings
const analysisSettings = {
  analysisLimit: "10회 / 월",
  analysisCooldown: "24시간",
  lastAnalysisDate: "2025년 3월 10일",
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 py-4 border-b last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    analysisComplete: true,
    majorUpdates: true,
    announcements: false,
  })
  
  const [theme, setTheme] = useState("system")
  const [language, setLanguage] = useState("ko")

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">설정</h1>
          <p className="mt-1 text-muted-foreground">
            서비스 이용 환경과 기본 옵션을 관리할 수 있습니다
          </p>
        </div>

        <div className="space-y-6">
          {/* Channel Settings Section */}
          <SectionCard
            icon={Tv2}
            title="채널 설정"
            description="기본 분석 채널을 선택하고 등록된 채널 상태를 확인하세요"
          >
            <div className="space-y-1">
              <InfoItem 
                label="기본 분석 채널" 
                value={
                  <Badge variant="secondary">{channelData.defaultChannel}</Badge>
                } 
              />
              <InfoItem 
                label="등록된 채널 수" 
                value={`${channelData.registeredChannels} / ${channelData.maxChannels}개`} 
              />
              <div className="pt-4">
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    채널 등록 및 관리는 <Link href="/channels" className="text-primary underline underline-offset-2">내 채널</Link> 페이지에서 가능합니다
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Analysis Settings Section */}
          <SectionCard
            icon={BarChart3}
            title="분석 설정"
            description="분석은 서비스 정책에 따라 일정 시간 후 다시 요청할 수 있습니다"
          >
            <div className="space-y-1">
              <InfoItem 
                label="분석 요청 제한" 
                value={analysisSettings.analysisLimit} 
              />
              <InfoItem 
                label="분석 주기" 
                value={`최소 ${analysisSettings.analysisCooldown} 간격`} 
              />
              <InfoItem 
                label="최근 분석 날짜" 
                value={analysisSettings.lastAnalysisDate} 
              />
              <div className="pt-4">
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    분석 요청 제한은 요금제에 따라 다를 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Notification Settings Section */}
          <SectionCard
            icon={Bell}
            title="알림 설정"
            description="서비스 알림 수신 여부를 설정합니다"
          >
            <div className="space-y-1">
              <SettingRow
                label="분석 완료 알림 받기"
                description="채널 분석이 완료되면 알림을 받습니다"
              >
                <Switch
                  checked={notifications.analysisComplete}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, analysisComplete: checked }))
                  }
                />
              </SettingRow>
              <SettingRow
                label="주요 업데이트 알림 받기"
                description="새로운 기능 및 서비스 업데이트 소식을 받습니다"
              >
                <Switch
                  checked={notifications.majorUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, majorUpdates: checked }))
                  }
                />
              </SettingRow>
              <SettingRow
                label="운영 공지 알림 받기"
                description="서비스 점검 및 운영 관련 공지를 받습니다"
              >
                <Switch
                  checked={notifications.announcements}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, announcements: checked }))
                  }
                />
              </SettingRow>
            </div>
          </SectionCard>

          {/* Display Settings Section */}
          <SectionCard
            icon={Monitor}
            title="화면 설정"
            description="언어 및 테마 모드를 설정합니다"
          >
            <div className="space-y-1">
              <SettingRow
                label="언어"
                description="서비스 표시 언어를 선택합니다"
              >
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-40">
                    <Globe className="size-4 mr-2" />
                    <SelectValue placeholder="언어 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow
                label="테마 모드"
                description="화면 테마를 선택합니다"
              >
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-40">
                    {theme === "light" && <Sun className="size-4 mr-2" />}
                    {theme === "dark" && <Moon className="size-4 mr-2" />}
                    {theme === "system" && <Monitor className="size-4 mr-2" />}
                    <SelectValue placeholder="테마 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="size-4" />
                        라이트
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="size-4" />
                        다크
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="size-4" />
                        시스템 설정 따르기
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </div>
          </SectionCard>

          {/* Support Link Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">도움말 바로가기</CardTitle>
              <CardDescription>
                서비스 이용에 도움이 필요하시면 고객 지원 페이지를 방문하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/support">
                  고객 지원 페이지로 이동
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
