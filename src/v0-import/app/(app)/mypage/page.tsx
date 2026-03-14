"use client"

import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Tv2,
  BarChart3,
  Clock,
  Shield,
  LogOut,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Mock user data
const userData = {
  email: "user@example.com",
  joinDate: "2025년 1월 15일",
  plan: "Free",
  channelCount: 2,
  maxChannels: 3,
  lastAnalysisDate: "2025년 3월 10일",
  analysisCount: 5,
  maxAnalysisRequests: 10,
}

function InfoRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export default function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">마이페이지</h1>
          <p className="mt-1 text-muted-foreground">
            계정 정보와 서비스 사용 현황을 확인할 수 있습니다
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>계정 정보</CardTitle>
                  <CardDescription>내 계정의 기본 정보</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InfoRow 
                icon={Mail} 
                label="이메일" 
                value={userData.email} 
              />
              <InfoRow 
                icon={Calendar} 
                label="가입일" 
                value={userData.joinDate} 
              />
              <InfoRow 
                icon={CreditCard} 
                label="현재 요금제" 
                value={<Badge variant="secondary">{userData.plan}</Badge>} 
              />
              <InfoRow 
                icon={Tv2} 
                label="등록된 채널 수" 
                value={`${userData.channelCount}개`} 
              />
            </CardContent>
          </Card>

          {/* Usage Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>사용 현황</CardTitle>
                  <CardDescription>서비스 이용 현황</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InfoRow 
                icon={Tv2} 
                label="등록된 채널 수" 
                value={`${userData.channelCount} / ${userData.maxChannels}개`} 
              />
              <InfoRow 
                icon={Calendar} 
                label="최근 채널 분석 날짜" 
                value={userData.lastAnalysisDate} 
              />
              <InfoRow 
                icon={Clock} 
                label="최근 분석 실행 횟수" 
                value={`${userData.analysisCount}회`} 
              />
            </CardContent>
          </Card>

          {/* Plan Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>요금제 정보</CardTitle>
                  <CardDescription>현재 구독 중인 플랜</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-2xl font-semibold">{userData.plan}</span>
                <Badge variant="outline">현재 플랜</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>채널 등록 제한</span>
                  <span className="font-medium text-foreground">{userData.maxChannels}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>분석 요청 제한</span>
                  <span className="font-medium text-foreground">{userData.maxAnalysisRequests}회 / 월</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <ExternalLink className="size-4" />
                요금제 변경
              </Button>
            </CardFooter>
          </Card>

          {/* Account Security Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>계정 보안</CardTitle>
                  <CardDescription>로그인 및 보안 설정</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-3 rounded-lg border p-4">
                <svg className="size-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium">Google 계정 로그인</p>
                  <p className="text-xs text-muted-foreground">{userData.email}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50">
                  연결됨
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                TubeWatch는 Google 계정을 통해 안전하게 로그인합니다
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Actions Section */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">계정 관리</h2>
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">로그아웃</p>
                <p className="text-sm text-muted-foreground">
                  현재 기기에서 로그아웃합니다
                </p>
              </div>
              <Button variant="outline">
                <LogOut className="size-4" />
                로그아웃
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-4 border-destructive/30">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">계정 삭제</p>
                <p className="text-sm text-muted-foreground">
                  계정과 모든 데이터가 영구적으로 삭제됩니다
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="size-4" />
                    계정 삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      계정 삭제 시 모든 채널 정보, 분석 결과, 설정이 영구적으로 삭제됩니다.
                      이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
