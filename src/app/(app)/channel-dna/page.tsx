import { ChannelDnaPage } from "@/components/features/channel-dna"
import { redirectToLandingAuthUnlessSignedIn } from "@/lib/auth/require-app-user"

export default async function Page() {
  await redirectToLandingAuthUnlessSignedIn("/channel-dna")
  return <ChannelDnaPage />
}
