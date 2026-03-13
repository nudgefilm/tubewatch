"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_NAV = [
  { label: "채널 진단", href: "/analysis" },
  { label: "액션 플랜", href: "/action-plan" },
  { label: "SEO 랩", href: "/seo-lab" },
  { label: "벤치마킹", href: "/benchmark" },
] as const;

const SECONDARY_NAV = [{ label: "채널 관리", href: "/channels" }] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/analysis") {
    return pathname === "/analysis" || pathname.startsWith("/analysis/");
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

        <p className="mb-2 mt-6 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          관리
        </p>
        {SECONDARY_NAV.map((item) => {
          const active = pathname === item.href;
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

      {/* Bottom: support + profile placeholder */}
      <div className="shrink-0 border-t border-slate-200 px-4 py-4">
        <a
          href="mailto:support@tubewatch.kr"
          className="mb-3 block text-xs text-slate-500 hover:text-slate-700"
        >
          문의 / 지원
        </a>
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">
              계정
            </p>
            <p className="truncate text-xs text-slate-500">프로필</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
