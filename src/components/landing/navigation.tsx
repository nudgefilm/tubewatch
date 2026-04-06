/**
 * ⚠️ CORE RENDER SOURCE
 * 메인 로고 및 Auth Modal을 포함한 핵심 UI
 * 수정 시 반드시 실제 렌더 영향 확인 필요
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";

import { getSafeOAuthReturnPath } from "@/lib/auth/safe-return-path";
import { AuthModal } from "./auth-modal";
import { createClient } from "@/lib/supabase/client";
import { readSelectedChannelIdFromStorage } from "@/lib/channels/selectedChannelStorage";

const navLinks = [
  { name: "Channel Analysis", href: "/analysis", description: "내 채널, 지금 몇점일까?" },
  { name: "Channel DNA", href: "/channel-dna", description: "이 채널의 성과 구조, 패턴이 궁금해" },
  { name: "Action Plan", href: "/action-plan", description: "그래서 오늘 뭐하면 돼?" },
  { name: "Next Trend", href: "/next-trend", description: "다음 영상, 뭐 찍을건데 !" },
];

export function Navigation() {
  const [storedChannelId, setStoredChannelId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [oauthReturnPath, setOauthReturnPath] = useState<string | null>(null);
  const [authModalHasError, setAuthModalHasError] = useState(false);
  /** lucide SVG는 SSR/클라이언트 DOM 차이로 hydration 불일치가 날 수 있어 마운트 후에만 렌더 */
  const [iconsMounted, setIconsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIconsMounted(true);
    setStoredChannelId(readSelectedChannelIdFromStorage());
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const meta = session.user.user_metadata ?? {};
        setUserDisplayName(
          (meta.name as string | undefined) ||
          (meta.full_name as string | undefined) ||
          (meta.preferred_username as string | undefined) ||
          session.user.email ||
          null
        );
        setUserAvatarUrl((meta.avatar_url as string | undefined) ?? null);
      } else {
        setIsLoggedIn(false);
        setUserDisplayName(null);
        setUserAvatarUrl(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserDisplayName(null);
    setUserAvatarUrl(null);
    setIsProfileDropdownOpen(false);
    window.location.href = "/";
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** 보호 라우트 등에서 `/?authModal=1&next=...` 로 진입 시 모달 오픈 및 `next` 반영.
   *  콜백 실패 시 `/?authModal=1&authError=1` 로 진입 → 에러 상태로 모달 오픈. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get("next");
    const isAuthError = params.get("authError") === "1";

    if (nextParam) {
      setOauthReturnPath(getSafeOAuthReturnPath(nextParam));
    }

    if (params.get("authModal") === "1") {
      setAuthModalHasError(isAuthError);
      setIsAuthModalOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("authModal");
      url.searchParams.delete("next");
      url.searchParams.delete("authError");
      const qs = url.searchParams.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${url.pathname}?${qs}` : url.pathname
      );
    }
  }, []);

  function getNavHref(href: string) {
    return storedChannelId ? `${href}?channel=${storedChannelId}` : href;
  }

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
          <a href="/" className="flex items-center group cursor-pointer">
            <span
              className={`font-heading font-medium leading-none tracking-[-0.01em] transition-all duration-500 ${
                isScrolled ? "text-[23px] lg:text-[24px]" : "text-[23px] lg:text-[24px]"
              }`}
            >
              TubeWatch™
            </span>
          </a>

          {/* Desktop Navigation + CTA - Right Aligned */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={getNavHref(link.href)}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-300 relative group cursor-pointer"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none">
                  {link.description}
                </span>
              </a>
            ))}

            <span className="w-px h-4 bg-foreground/20" />

            {isLoggedIn ? (
              /* 로그인 상태: 프로필 이미지 + 닉네임 + hover 드롭다운 */
              <div
                className="relative"
                onMouseEnter={() => {
                  if (profileCloseTimerRef.current) {
                    clearTimeout(profileCloseTimerRef.current);
                    profileCloseTimerRef.current = null;
                  }
                  setIsProfileDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  profileCloseTimerRef.current = setTimeout(() => {
                    setIsProfileDropdownOpen(false);
                  }, 1000);
                }}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {userAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userAvatarUrl}
                      alt={userDisplayName ?? "profile"}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-foreground/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-foreground/10">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className={`text-foreground/80 transition-all duration-500 ${isScrolled ? "text-xs" : "text-sm"}`}>
                    {userDisplayName}
                  </span>
                </button>

                {/* Hover Dropdown */}
                <div
                  className={`absolute right-0 top-full mt-2 w-44 bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${
                    isProfileDropdownOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-1"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-foreground/10">
                    <p className="text-xs text-muted-foreground truncate">{userDisplayName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors duration-150 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              /* 비로그인 상태: 기존 버튼 */
              <>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`text-foreground/70 hover:text-foreground transition-all duration-500 cursor-pointer ${isScrolled ? "text-xs" : "text-sm"}`}
                >
                  로그인
                </button>
                <Button
                  size="sm"
                  className={`bg-black hover:bg-neutral-800 text-white rounded-lg shadow-lg transition-all duration-500 cursor-pointer ${isScrolled ? "px-4 h-8 text-xs" : "px-5 h-9"}`}
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  시작하기
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {iconsMounted ? (
              isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )
            ) : (
              <span className="inline-block w-6 h-6" aria-hidden />
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
                href={getNavHref(link.href)}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-sans text-foreground hover:text-muted-foreground transition-all duration-500 cursor-pointer ${
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
            <Button 
              variant="outline" 
              className="flex-1 rounded-lg h-14 text-base cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
            >
              로그인
            </Button>
            <Button 
              className="flex-1 bg-black text-white rounded-lg h-14 text-base shadow-lg cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
            >
              시작하기
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => { setIsAuthModalOpen(false); setAuthModalHasError(false); }}
        returnToPath={oauthReturnPath}
        hasError={authModalHasError}
      />
    </header>
  );
}
