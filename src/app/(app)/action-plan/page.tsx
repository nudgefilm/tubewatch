import { ActionPlanPage } from "@/components/features/action-plan"
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user"

export default async function Page() {
  await redirectToLandingAuthUnlessSignedIn("/action-plan")
  return <ActionPlanPage />
}
