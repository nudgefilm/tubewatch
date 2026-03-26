import { AnalysisPage } from "@/components/features/analysis"
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user"

export default async function Page() {
  await redirectToLandingAuthUnlessSignedIn("/analysis")
  return <AnalysisPage />
}
