import { redirect } from "next/navigation";
import Link from "next/link";
import RegisterChannelForm from "@/components/channels/RegisterChannelForm";
import ChannelCard from "@/components/channels/ChannelCard";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser, getChannelLimit } from "@/lib/admin/adminTools";
import AppShell from "@/components/app/AppShell";
import PageContainer from "@/components/app/PageContainer";
import EmptyState from "@/components/ui/EmptyState";

type UserChannel = {
  id: string
  user_id: string
  channel_url: string | null
  channel_id: string | null
  channel_title: string | null
  thumbnail_url: string | null
  subscriber_count: number | null
  last_analysis_requested_at: string | null
  last_analyzed_at: string | null
  created_at: string
  updated_at: string
}

function StatusPill({
  current,
  max,
  isAdmin,
}: {
  current: number
  max: number
  isAdmin: boolean
}): JSX.Element {
  const isFull = !isAdmin && current >= max

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: isAdmin ? current : max }).map((_, i) => (
          <div
            key={i}
            className={[
              "h-2 w-6 rounded-full transition",
              i < current ? "bg-slate-600" : "bg-slate-200",
            ].join(" ")}
          />
        ))}
      </div>
      <span className="text-sm tabular-nums text-slate-500">
        {current}{isAdmin ? "개 등록" : `/${max}`}
      </span>
      {isAdmin ? (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
          무제한
        </span>
      ) : isFull ? (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          등록 완료
        </span>
      ) : null}
    </div>
  )
}

function GuideStep({
  step,
  title,
  desc,
  active,
}: {
  step: number;
  title: string;
  desc: string;
  active: boolean;
}): JSX.Element {
  return (
    <div className="flex gap-3">
      <div
        className={[
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          active ? "bg-slate-100 text-slate-900" : "bg-slate-50 text-slate-400",
        ].join(" ")}
      >
        {step}
      </div>
      <div className="min-w-0">
        <p
          className={
            active
              ? "text-sm font-semibold text-slate-900"
              : "text-sm font-medium text-slate-400"
          }
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

export default async function ChannelsPage(): Promise<JSX.Element> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: channels, error: channelsError } = await supabase
    .from('user_channels')
    .select(`
      id,
      user_id,
      channel_url,
      channel_id,
      channel_title,
      thumbnail_url,
      subscriber_count,
      last_analysis_requested_at,
      last_analyzed_at,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (channelsError) {
    console.error('channels page error:', channelsError)
  }

  const safeChannels: UserChannel[] = channels ?? []
  const currentCount = safeChannels.length
  const admin = isAdminUser(user.email)
  const maxCount = getChannelLimit(user.email)

  const hasChannels = currentCount > 0
  const hasAnalyzed = safeChannels.some((ch) => ch.last_analyzed_at)

  const currentStep = !hasChannels ? 1 : !hasAnalyzed ? 2 : 3

  const emptyStateIcon = (
    <svg
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );

  return (
    <AppShell
      title="채널 관리"
      description="유튜브 채널을 등록하고 분석을 요청하세요."
    >
      <PageContainer>
        {/* Progress Guide */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            <GuideStep
              step={1}
              title="채널 등록"
              desc="유튜브 채널 URL 입력"
              active={currentStep >= 1}
            />
            <GuideStep
              step={2}
              title="분석 요청"
              desc="AI 기반 채널 분석 실행"
              active={currentStep >= 2}
            />
            <GuideStep
              step={3}
              title="결과 확인"
              desc="리포트 및 인사이트 확인"
              active={currentStep >= 3}
            />
          </div>
        </section>

        {/* Channel Status + Register */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">내 채널</h2>
            <StatusPill
              current={currentCount}
              max={maxCount}
              isAdmin={admin}
            />
          </div>

          <RegisterChannelForm
            currentCount={currentCount}
            maxCount={maxCount}
            isAdmin={admin}
          />
        </section>

        {/* Channel List */}
        <section>
          {!hasChannels ? (
            <EmptyState
              variant="app"
              title="아직 등록된 채널이 없습니다"
              message="위에서 유튜브 채널 URL을 등록하면 데이터 기반 분석을 시작할 수 있습니다."
              icon={emptyStateIcon}
            />
          ) : (
            <div className="space-y-6">
              {safeChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isAdmin={admin}
                />
              ))}
            </div>
          )}
        </section>

        {admin ? (
          <div className="text-center">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Admin Dashboard →
            </Link>
          </div>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
