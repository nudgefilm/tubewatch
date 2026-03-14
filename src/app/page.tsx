import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ReportPreview from "@/components/landing/ReportPreview";
import TrustSection from "@/components/landing/TrustSection";
import ForWho from "@/components/landing/ForWho";
import CTASection from "@/components/landing/CTASection";

type UserChannelRow = { id: string };
type LatestAnalysisRow = { user_channel_id: string };

export default async function LandingPage(): Promise<JSX.Element> {
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

  const isAuthenticated = !!user;

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <LandingHeader />
      <Hero isAuthenticated={isAuthenticated} />
      <ProblemSection />
      <HowItWorks />
      <ReportPreview />
      <TrustSection />
      <ForWho />
      <CTASection isAuthenticated={isAuthenticated} />

      <footer className="border-t border-[#e5e6e1] bg-[#f7f7f5] py-10">
        <div className="mx-auto max-w-[1100px] px-6 text-center">
          <p className="text-[13px] text-[#8b8e84]">
            TubeWatch — 데이터로 설계하는 유튜브 성장 전략
          </p>
        </div>
      </footer>
    </main>
  );
}
