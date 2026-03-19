import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { V0AppFrame } from "@/components/app/V0AppFrame"
import V0ActionPlanPage from "@/v0-final/action-plan/page"

export default async function ActionPlanRoute(): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/?authModal=1&next=/action-plan")
  }

  return (
    <V0AppFrame>
      <V0ActionPlanPage />
    </V0AppFrame>
  )
}
