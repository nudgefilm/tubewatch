import { Navigation } from "@/v0-import/components/landing/navigation";
import { HeroSection } from "@/v0-import/components/landing/hero-section";
import { FeaturesSection } from "@/v0-import/components/landing/features-section";
import { CtaSection } from "@/v0-import/components/landing/cta-section";
import { FooterSection } from "@/v0-import/components/landing/footer-section";

export default function LandingPage(): JSX.Element {
  return (
    <>
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <FooterSection />
    </>
  );
}
