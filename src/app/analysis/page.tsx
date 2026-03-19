import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AnalysisRoute(): Promise<never> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/?authModal=1&next=/analysis")
  }

  redirect("/channels")
}