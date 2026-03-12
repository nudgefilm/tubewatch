"use client";

import Link from "next/link";

const NAV_ITEMS = [
  {
    label: "채널 진단",
    tooltip: "🔒 내 채널, 지금 몇점일까?",
  },
  {
    label: "액션 플랜",
    tooltip: "🔒 그래서 오늘 뭐하면 돼?",
  },
  {
    label: "SEO 랩",
    tooltip: "🔒 조회수 터지는 태그 좀 알려줘",
  },
  {
    label: "벤치마킹",
    tooltip: "🔒 잘 나가는 쟤는 비결이 뭐야?",
  },
];

export default function LandingHeader(): JSX.Element {
  return (
    <header className="border-b border-[#e5e6e1] bg-[#f7f7f5]">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="TubeWatch"
            className="h-7 w-auto"
          />
          <span className="text-[16px] font-semibold text-[#161616]">
            Tube Watch
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="group relative">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#5f6158] transition hover:text-[#161616]"
              >
                {item.label}
              </button>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
                <div className="whitespace-nowrap rounded-lg border border-[#e5e6e1] bg-white px-3 py-1.5 text-[12px] text-[#5f6158]">
                  {item.tooltip}
                </div>
              </div>
            </div>
          ))}

          <div className="ml-3 h-4 w-px bg-[#e5e6e1]" />

          <Link
            href="/login"
            className="ml-3 rounded-lg px-3 py-2 text-[14px] font-medium text-[#5f6158] transition hover:text-[#161616]"
          >
            로그인
          </Link>

          <Link
            href="/login"
            className="ml-1 rounded-[10px] bg-[#161616] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#2a2a2a]"
          >
            회원가입
          </Link>
        </nav>

        {/* Mobile: minimal */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="rounded-[10px] bg-[#161616] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#2a2a2a]"
          >
            시작하기
          </Link>
        </div>
      </div>
    </header>
  );
}
