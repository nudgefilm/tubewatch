import { Navigation } from "./navigation";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { HowItWorksSection } from "./how-it-works-section";
import { InfrastructureSection } from "./infrastructure-section";
import { SecuritySection } from "./security-section";
import { CtaSection } from "./cta-section";
import { FooterSection } from "./footer-section";
import { FloatingTubeTalk } from "./floating-tube-talk";

export default function HomeLanding() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
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
