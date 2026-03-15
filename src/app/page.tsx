import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/v0-final/components/landing/navigation";
import { HeroSection } from "@/v0-final/components/landing/hero-section";
import { FeaturesSection } from "@/v0-final/components/landing/features-section";
import { HowItWorksSection } from "@/v0-final/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/v0-final/components/landing/infrastructure-section";
import { SecuritySection } from "@/v0-final/components/landing/security-section";
import { CtaSection } from "@/v0-final/components/landing/cta-section";
import { FooterSection } from "@/v0-final/components/landing/footer-section";
import { FloatingTubeTalk } from "@/v0-final/components/landing/floating-tube-talk";

type UserChannelRow = { id: string };
type LatestAnalysisRow = { user_channel_id: string };

export default async function HomePage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!userError && user) {
    const { data: channels, error: channelsError } = await supabase
      .from("user_channels")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!channelsError && channels && channels.length > 0) {
      const { data: latestAnalysis } = await supabase
        .from("analysis_results")
        .select("user_channel_id")
        .eq("user_id", user.id)
        .eq("status", "analyzed")
        .eq("gemini_status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const row = latestAnalysis as LatestAnalysisRow | null;
      const targetChannelId =
        row?.user_channel_id ?? (channels[0] as UserChannelRow).id;
      redirect(`/analysis/${encodeURIComponent(targetChannelId)}`);
    }

    if (!channelsError && (!channels || channels.length === 0)) {
      redirect("/channels");
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay v0-landing-theme">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <SecuritySection />
      <CtaSection />
      <FooterSection />
      <FloatingTubeTalk />
    </main>
  );
}
