import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { V0AppFrame } from "@/components/app/V0AppFrame"
import V0SeoLabPage from "@/v0-final/seo-lab/page"

export default async function SeoLabRoute(): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/?authModal=1&next=/seo-lab")
  }

  return (
    <V0AppFrame>
      <V0SeoLabPage />
    </V0AppFrame>
  )
}
