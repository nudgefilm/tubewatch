"use client";

import Link from "next/link";
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
        <div className="py-5 lg:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Brand Column */}
            <div className="flex items-center gap-4">
              <a href="#" className="inline-flex items-center">
                <span className="text-2xl font-display">TubeWatch™</span>
              </a>
              <p className="text-xs text-muted-foreground/70 font-mono">
                Built with AI for Creators.
              </p>
            </div>

            {/* Company Info */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground/70">
                UNFOLD LAB | CEO J. W. Jung | Business License: 136-11-23540 | Suite 214-S46, 46 Apgujeong-ro 2-gil, Gangnam-gu, Seoul, Republic of Korea
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              All systems operational
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Copyright <Link href="/admin" className="hover:text-foreground transition-colors">©</Link> 2026 TubeWatch™ All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
