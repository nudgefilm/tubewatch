import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { V0AppFrame } from "@/components/app/V0AppFrame"
import V0NextTrendPage from "@/v0-final/next-trend/page"

export default async function NextTrendRoute(): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/?authModal=1&next=/next-trend")
  }

  return (
    <V0AppFrame>
      <V0NextTrendPage />
    </V0AppFrame>
  )
}
