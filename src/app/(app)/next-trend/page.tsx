import { NextTrendPage } from "@/components/features/next-trend"
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user"

export default async function Page() {
  await redirectToLandingAuthUnlessSignedIn("/next-trend")
  return <NextTrendPage />
}
