import { SeoLabPage } from "@/components/features/seo-lab"
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user"

export default async function Page() {
  await redirectToLandingAuthUnlessSignedIn("/seo-lab")
  return <SeoLabPage />
}
