"use client";

import { useState, useEffect } from "react";
import { Button } from "@/v0-final/components/ui/button";
import { Menu, X } from "lucide-react";
import { AuthModal } from "@/v0-final/components/auth/auth-modal";

const navLinks = [
  { name: "Channel Analysis", href: "/channels", description: "내 채널, 지금 몇점일까?" },
  { name: "Action Plan", href: "/action-plan", description: "그래서 오늘 뭐하면 돼?" },
  { name: "SEO Lab", href: "/seo-lab", description: "조회수 터지는 태그 좀 알려줘" },
  { name: "Benchmark", href: "/benchmark", description: "잘 나가는 쟤는 비결이 뭐야?" },
  { name: "Next Trend", href: "/next-trend", description: "다음 영상, 뭐 찍을건데 !" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? "top-4 left-4 right-4" 
          : "top-0 left-0 right-0"
      }`}
    >
      <nav 
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Logo */}
          <a href="/landing" className="flex items-center group">
            <span className={`font-display tracking-tight transition-all duration-500 ${isScrolled ? "text-xl" : "text-2xl"}`}>TubeWatch™</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-300 relative group cursor-pointer"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none">
                  {link.description}
                </span>
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className={`text-foreground/70 hover:text-foreground transition-all duration-500 cursor-pointer ${isScrolled ? "text-xs" : "text-sm"}`}
            >
              Sign in
            </button>
            <Button
              size="sm"
              className={`bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all duration-500 cursor-pointer ${isScrolled ? "px-4 h-8 text-xs" : "px-6"}`}
              onClick={() => setAuthOpen(true)}
            >
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

      </nav>
      
      {/* Mobile Menu - Full Screen Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          {/* Bottom CTAs */}
          <div className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
            isMobileMenuOpen 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <button
              type="button"
              className="flex-1"
              onClick={() => {
                setAuthOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Button 
                variant="outline" 
                className="w-full rounded-full h-14 text-base cursor-pointer"
              >
                Sign in
              </Button>
            </button>
            <button
              type="button"
              className="flex-1"
              onClick={() => {
                setAuthOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Button 
                className="w-full bg-foreground text-background rounded-full h-14 text-base cursor-pointer"
              >
                Sign Up
              </Button>
            </button>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
