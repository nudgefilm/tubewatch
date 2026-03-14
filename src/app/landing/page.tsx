import { Navigation } from "@/v0-import/components/landing/navigation";
import { HeroSection } from "@/v0-import/components/landing/hero-section";
import { FeaturesSection } from "@/v0-import/components/landing/features-section";
import { HowItWorksSection } from "@/v0-import/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/v0-import/components/landing/infrastructure-section";
import { SecuritySection } from "@/v0-import/components/landing/security-section";
import { MetricsSection } from "@/v0-import/components/landing/metrics-section";
import { DevelopersSection } from "@/v0-import/components/landing/developers-section";
import { IntegrationsSection } from "@/v0-import/components/landing/integrations-section";
import { TestimonialsSection } from "@/v0-import/components/landing/testimonials-section";
import { PricingSection } from "@/v0-import/components/landing/pricing-section";
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
      <MetricsSection />
      <DevelopersSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <FooterSection />
      <FloatingTubeTalk />
    </>
  );
}
