"use client";

import { useState, useRef } from "react";
import { AnimatedWave } from "./animated-wave";
import { AdminAuthModal } from "./admin-auth-modal";
import { TermsModal } from "./terms-modal";
import { PrivacyModal } from "./privacy-modal";
import { SiteStatsModal } from "./SiteStatsModal";

const footerLinks = {
  product: [
    { name: "Channel Analysis", href: "/analysis" },
    { name: "Channel DNA", href: "/channel-dna" },
    { name: "Action Plan", href: "/action-plan" },
    { name: "Next Trend", href: "/next-trend" },
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
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStatsEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsStatsModalOpen(true);
  };

  const handleStatsLeave = () => {
    closeTimerRef.current = setTimeout(() => setIsStatsModalOpen(false), 2000);
  };

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
            <a
              href="/"
              className="inline-flex items-center group"
              onMouseEnter={handleStatsEnter}
              onMouseLeave={handleStatsLeave}
            >
              <span className="text-2xl font-heading font-medium tracking-[-0.02em] group-hover:text-foreground/70 transition-colors">TubeWatch™</span>
            </a>
          </div>

          {/* Info Rows */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground/70">
            {/* Row 1 - Company Name */}
            <div>
              <span>언폴드랩(UNFOLD LAB)</span>
            </div>

            {/* Row 2 - CEO + Business License + 통신판매업신고 */}
            <div>
              <span>대표: 정재우 | 사업자등록번호: 136-11-23540 | 통신판매업신고: 제 2026-서울강남-XXXX 호 | 특허출원: 제10-2026-0075318호</span>
            </div>

            {/* Row 3 - Address (left) + Built by (right) */}
            <div className="flex flex-col md:flex-row justify-between gap-1">
              <span>주소: 서울특별시 강남구 압구정로2길 46, 214-S46호</span>
              <span className="text-muted-foreground/70">Built by Creators for Creators</span>
            </div>

            {/* Row 4 - Contact + Terms (right) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
              <span>연락처: 02-518-2022 | 이메일: nudgefilm@gmail.com</span>
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
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
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

      {/* Site Stats Modal */}
      <SiteStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onMouseEnter={handleStatsEnter}
        onMouseLeave={handleStatsLeave}
      />

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
