"use client";

import { useState } from "react";
import { AnimatedWave } from "./animated-wave";
import { AdminAuthModal } from "./admin-auth-modal";
import { TermsModal } from "./terms-modal";
import { PrivacyModal } from "./privacy-modal";

const footerLinks = {
  product: [
    { name: "Channel Analysis", href: "/channels" },
    { name: "Action Plan", href: "/action-plan" },
    { name: "SEO Lab", href: "/seo-lab" },
    { name: "Benchmark", href: "/benchmark" },
  ],
  support: [
    { name: "문의하기", href: "/support" },
    { name: "마이페이지", href: "/mypage" },
    { name: "설정", href: "/settings" },
    { name: "요금제", href: "/billing" },
  ],
};

export function FooterSection() {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  return (
    <footer className="relative border-t border-foreground/10">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-36 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-10 lg:py-12">
          {/* Brand */}
          <div className="mb-6">
            <a href="/" className="inline-flex items-center cursor-pointer">
              <span className="text-2xl font-display">TubeWatch™</span>
            </a>
          </div>

          {/* Info Rows */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground/70">
            {/* Row 1 - Email */}
            <div>
              <span>Unfold Lab | CEO: J. W. Jung | Email. nudgefilm@gmail.com</span>
            </div>
            
            {/* Row 2 - Business License (left) + Built by (right) */}
            <div className="flex flex-col md:flex-row justify-between gap-1">
              <span>Business License 136-11-23540</span>
              <span className="text-sm text-muted-foreground">Built by Creators for Creators</span>
            </div>
            
            {/* Row 3 - Address (left) + Terms (right) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
              <span>Suite 214-S46, Apgujeong-ro 2-gil, Gangnam-gu, Seoul, Korea</span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</button>
                <span>|</span>
                <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</button>
                <span>|</span>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors cursor-pointer">Google Privacy Policy</a>
                <span>|</span>
                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors cursor-pointer">YouTube Terms of Service</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left - System Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 md:order-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            All systems operational
          </div>

          {/* Right - Copyright */}
          <p className="text-sm text-muted-foreground order-1 md:order-2">
            Copyright{" "}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer"
              title="Admin Access"
            >
              ©
            </button>{" "}
            2026 TubeWatch™ All rights reserved.
          </p>
        </div>
      </div>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Terms Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Privacy Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </footer>
  );
}
