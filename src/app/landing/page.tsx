import { Navigation } from "@/v0-import/components/landing/navigation";
import { HeroSection } from "@/v0-import/components/landing/hero-section";
import { FeaturesSection } from "@/v0-import/components/landing/features-section";
import { HowItWorksSection } from "@/v0-import/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/v0-import/components/landing/infrastructure-section";
import { SecuritySection } from "@/v0-import/components/landing/security-section";
import { CtaSection } from "@/v0-import/components/landing/cta-section";
import { FooterSection } from "@/v0-import/components/landing/footer-section";
import { FloatingTubeTalk } from "@/v0-import/components/landing/floating-tube-talk";

export default function LandingPage(): JSX.Element {
  return (
    <>
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <SecuritySection />
      <CtaSection />
      <FooterSection />
      <FloatingTubeTalk />
    </>
  );
}
