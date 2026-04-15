"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Youtube,
  Plus,
  LogOut,
  UserX,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type ChannelRow = {
  id: string;
  channel_title: string | null;
  channel_url: string | null;
  channel_id: string | null;
  thumbnail_url: string | null;
};

type Props = {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  planId: string | null;
  channels: ChannelRow[];
};

export default function SettingsView({ email, displayName, avatarUrl, planId, channels }: Props) {
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setDeleteError(data.error ?? "계정 삭제에 실패했습니다.")
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch {
      setDeleteError("네트워크 오류가 발생했습니다.")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Settings
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground mt-2">
            계정 및 채널 설정을 관리합니다.
          </p>
        </div>
      </section>

      {/* Settings Content */}
      <section className="py-12 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <User className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Account</CardTitle>
                  <CardDescription>계정 정보를 확인합니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Profile Row */}
              <div className="flex items-center gap-4 py-3 border-b">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName ?? "profile"}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-foreground/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-foreground/10 shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{displayName ?? "—"}</p>
                  {planId && (
                    <span className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground capitalize">
                      {planId}
                    </span>
                  )}
                </div>
              </div>
              {/* Email Row */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">이메일</p>
                    <p className="text-sm text-muted-foreground">
                      {email ?? "—"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">인증됨</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Channel Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Youtube className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Channel</CardTitle>
                  <CardDescription>연결된 채널을 관리합니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  등록된 채널이 없습니다.
                </p>
              ) : (
                channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {ch.thumbnail_url ? (
                        <img
                          src={ch.thumbnail_url}
                          alt={ch.channel_title ?? "채널"}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-red-500/10">
                          <Youtube className="size-4 text-red-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ch.channel_title ?? ch.channel_id ?? "채널"}
                        </p>
                        {ch.channel_url ? (
                          <p className="text-sm text-muted-foreground truncate">
                            {ch.channel_url}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600/30 shrink-0">
                      연결됨
                    </Badge>
                  </div>
                ))
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/channels")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  채널 관리
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg">Account Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">로그아웃</p>
                    <p className="text-sm text-muted-foreground">현재 기기에서 로그아웃합니다.</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleLogout()}
                >
                  로그아웃
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 회원탈퇴 */}
          <Card className="border-destructive/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <UserX className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg text-destructive">회원탈퇴</CardTitle>
                  <CardDescription>계정을 영구적으로 삭제합니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                탈퇴 시 모든 분석 데이터, 채널 연결 정보, 구독 내역이 영구 삭제되며 복구할 수 없습니다.
              </p>

              {!deleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteConfirm(true)}
                >
                  회원탈퇴
                </Button>
              ) : (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </p>
                  {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteLoading}
                      onClick={() => void handleDeleteAccount()}
                    >
                      {deleteLoading ? "처리 중..." : "탈퇴 확인"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleteLoading}
                      onClick={() => { setDeleteConfirm(false); setDeleteError(null) }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
