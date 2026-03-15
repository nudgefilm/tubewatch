import { Navigation } from "@/v0-final/components/landing/navigation";
import { HeroSection } from "@/v0-final/components/landing/hero-section";
import { FeaturesSection } from "@/v0-final/components/landing/features-section";
import { HowItWorksSection } from "@/v0-final/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/v0-final/components/landing/infrastructure-section";
import { SecuritySection } from "@/v0-final/components/landing/security-section";
import { CtaSection } from "@/v0-final/components/landing/cta-section";
import { FooterSection } from "@/v0-final/components/landing/footer-section";
import { FloatingTubeTalk } from "@/v0-final/components/landing/floating-tube-talk";

export default function LandingPage(): JSX.Element {
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
