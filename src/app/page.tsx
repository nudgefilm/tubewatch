import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { FloatingTubeTalk } from "@/components/landing/floating-tube-talk";

export default function HomePage({
  searchParams,
}: {
  searchParams: { authModal?: string; next?: string };
}): JSX.Element {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation authModal={searchParams.authModal} next={searchParams.next} />
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
