import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { V0AppFrame } from "@/components/app/V0AppFrame"
import V0AnalysisDetailPage from "@/v0-final/analysis/[channelId]/page"

export default async function AnalysisDetailRoute({
  params,
}: {
  params: { channelId: string }
}): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/?authModal=1&next=/analysis/${params.channelId}`)
  }

  return (
    <V0AppFrame>
      <V0AnalysisDetailPage params={Promise.resolve(params)} />
    </V0AppFrame>
  )
}
