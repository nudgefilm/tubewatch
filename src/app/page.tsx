import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ReportPreview from "@/components/landing/ReportPreview";
import TrustSection from "@/components/landing/TrustSection";
import ForWho from "@/components/landing/ForWho";
import CTASection from "@/components/landing/CTASection";

export default async function LandingPage(): Promise<JSX.Element> {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // auth check failure is non-critical for the landing page
  }

  return (
    <main className="min-h-screen bg-[#08090d]">
      <Hero isAuthenticated={isAuthenticated} />
      <ProblemSection />
      <HowItWorks />
      <ReportPreview />
      <TrustSection />
      <ForWho />
      <CTASection isAuthenticated={isAuthenticated} />

      <footer className="border-t border-white/[0.04] bg-[#08090d] py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-[13px] text-gray-600">
            TubeWatch — 데이터로 설계하는 유튜브 성장 전략
          </p>
        </div>
      </footer>
    </main>
  );
}
