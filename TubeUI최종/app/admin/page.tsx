"use client"

import { 
  Users, 
  Tv2, 
  BarChart3, 
  Activity,
  Clock,
  UserPlus,
  LogIn,
  Search,
  RefreshCw,
  Server,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock service stats
const serviceStats = {
  totalUsers: 1284,
  totalChannels: 3567,
  totalAnalysis: 12450,
  todayAnalysis: 87,
}

// Mock recent user activity
const recentSignups = [
  { id: 1, email: "newuser1@gmail.com", date: "2025년 3월 14일 14:32" },
  { id: 2, email: "creator@example.com", date: "2025년 3월 14일 12:15" },
  { id: 3, email: "youtuber@naver.com", date: "2025년 3월 14일 10:45" },
]

const recentLogins = [
  { id: 1, email: "active@gmail.com", date: "2025년 3월 14일 15:02" },
  { id: 2, email: "user123@example.com", date: "2025년 3월 14일 14:58" },
  { id: 3, email: "analyst@naver.com", date: "2025년 3월 14일 14:45" },
]

const recentAnalysisUsers = [
  { id: 1, email: "power@gmail.com", channel: "테크리뷰채널", date: "2025년 3월 14일 15:10" },
  { id: 2, email: "creator@example.com", channel: "요리비디오", date: "2025년 3월 14일 14:55" },
  { id: 3, email: "youtuber@naver.com", channel: "게임실황", date: "2025년 3월 14일 14:30" },
]

// Mock channel stats
const channelStats = {
  totalChannels: 3567,
  avgSubscribers: "125,430",
  recentChannels: [
    { id: 1, name: "테크리뷰채널", subscribers: "52,000", date: "2025년 3월 14일" },
    { id: 2, name: "요리비디오", subscribers: "128,000", date: "2025년 3월 14일" },
    { id: 3, name: "게임실황", subscribers: "89,000", date: "2025년 3월 13일" },
  ],
}

// Mock analysis queue
const analysisQueue = {
  pending: 12,
  running: 3,
  completed: 87,
  recentTasks: [
    { id: 1, channel: "테크리뷰채널", status: "completed", time: "2분 전" },
    { id: 2, channel: "요리비디오", status: "running", time: "진행 중" },
    { id: 3, channel: "게임실황", status: "pending", time: "대기 중" },
    { id: 4, channel: "음악채널", status: "pending", time: "대기 중" },
    { id: 5, channel: "여행브이로그", status: "completed", time: "5분 전" },
  ],
}

function StatCard({ 
  icon: Icon, 
  label, 
  value,
  description,
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  description?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600/30 bg-yellow-50">
          <Clock className="size-3 mr-1" />
          대기
        </Badge>
      )
    case "running":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600/30 bg-blue-50">
          <Loader2 className="size-3 mr-1 animate-spin" />
          실행 중
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50">
          <CheckCircle2 className="size-3 mr-1" />
          완료
        </Badge>
      )
    default:
      return null
  }
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">관리자 대시보드</h1>
          </div>
          <p className="text-muted-foreground">
            TubeWatch™ 서비스 운영 현황을 확인할 수 있습니다
          </p>
        </div>

        <div className="space-y-8">
          {/* Service Overview Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">서비스 현황</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                icon={Users} 
                label="총 사용자 수" 
                value={serviceStats.totalUsers} 
              />
              <StatCard 
                icon={Tv2} 
                label="등록된 채널 수" 
                value={serviceStats.totalChannels} 
              />
              <StatCard 
                icon={BarChart3} 
                label="총 분석 실행 수" 
                value={serviceStats.totalAnalysis} 
              />
              <StatCard 
                icon={Activity} 
                label="오늘 분석 요청 수" 
                value={serviceStats.todayAnalysis}
                description="전일 대비 +12%"
              />
            </div>
          </section>

          {/* User Activity Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">사용자 활동</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Signups */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">최근 가입 사용자</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSignups.map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{user.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Logins */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <LogIn className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">최근 로그인 사용자</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentLogins.map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{user.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Analysis Users */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Search className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">최근 분석 요청 사용자</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAnalysisUsers.map((user) => (
                      <div key={user.id} className="flex flex-col gap-0.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="truncate font-medium">{user.email}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{user.date}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">채널: {user.channel}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Channel Statistics Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">채널 통계</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Tv2 className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 등록 채널 수</p>
                      <p className="text-2xl font-bold">{channelStats.totalChannels.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">평균 채널 구독자 수</p>
                      <p className="text-2xl font-bold">{channelStats.avgSubscribers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">최근 등록 채널</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {channelStats.recentChannels.map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{channel.name}</span>
                          <p className="text-xs text-muted-foreground">{channel.subscribers} 구독자</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{channel.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Analysis Queue Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">분석 작업 현황</h2>
            <div className="grid gap-6 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100">
                      <Clock className="size-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">대기 중 분석 작업</p>
                      <p className="text-2xl font-bold">{analysisQueue.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                      <Loader2 className="size-5 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">현재 실행 중 분석</p>
                      <p className="text-2xl font-bold">{analysisQueue.running}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                      <CheckCircle2 className="size-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">최근 완료된 분석</p>
                      <p className="text-2xl font-bold">{analysisQueue.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">작업 목록</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisQueue.recentTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{task.channel}</span>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Admin Actions Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">관리자 작업</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button>
                    <RefreshCw className="size-4" />
                    분석 큐 새로고침
                  </Button>
                  <Button variant="outline">
                    <Server className="size-4" />
                    시스템 상태 확인
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Admin Access Notice */}
          <section>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">관리자 전용 페이지</p>
                    <p className="text-sm text-amber-700 mt-1">
                      이 페이지는 관리자 계정에서만 접근할 수 있습니다
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
