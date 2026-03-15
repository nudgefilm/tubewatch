"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_NAV = [
  { label: "내 채널", href: "/channels" },
  { label: "채널 분석", href: "/analysis" },
  { label: "액션 플랜", href: "/action-plan" },
  { label: "SEO 랩", href: "/seo-lab" },
  { label: "벤치마크", href: "/benchmark" },
  { label: "Next Trend", href: "/next-trend" },
] as const;

const BOTTOM_NAV = [
  { label: "고객 지원", href: "/support" },
  { label: "마이페이지", href: "/mypage" },
  { label: "설정", href: "/settings" },
  { label: "로그아웃", href: "/" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/analysis") {
    return pathname === "/analysis" || pathname.startsWith("/analysis/");
  }
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar(): JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
        <Link href="/channels" className="flex items-center">
          <span className="text-base font-semibold text-slate-900">
            TubeWatch
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          메인
        </p>
        {MAIN_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-slate-200 px-3 py-4">
        {BOTTOM_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
