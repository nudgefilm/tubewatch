"use client";

import { AnimatedWave } from "./animated-wave";

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-36 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-8 lg:py-12">
          <div>
            {/* Brand Column */}
            <div>
              <a href="#" className="inline-flex items-center mb-3">
                <span className="text-2xl font-display">TubeWatch™</span>
              </a>

              <p className="text-sm text-muted-foreground leading-relaxed mb-2 max-w-xs">
                데이터 기반 인사이트로<br />
                채널 성장을 지원합니다.
              </p>
              <p className="text-xs text-muted-foreground/70 mb-2">
                Email nudgefilm@gmail.com | Seoul, Korea
              </p>
              <p className="text-xs text-muted-foreground/70 font-mono">
                Built with AI for Creators.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Copyright © 2026 TubeWatch™ All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
