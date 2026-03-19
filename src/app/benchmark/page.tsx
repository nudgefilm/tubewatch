import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { V0AppFrame } from "@/components/app/V0AppFrame"
import V0BenchmarkPage from "@/v0-final/benchmark/page"

export default async function BenchmarkRoute(): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/?authModal=1&next=/benchmark")
  }

  return (
    <V0AppFrame>
      <V0BenchmarkPage />
    </V0AppFrame>
  )
}
