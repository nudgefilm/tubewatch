"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAdminUser } from "@/lib/admin/adminTools";

type AccountState = {
  email: string | null;
  isAdmin: boolean;
};

export default function AccountMenu(): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<AccountState | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? null;
      if (!mounted) return;
      setAccount({
        email,
        isAdmin: isAdminUser(email),
      });
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const label = account?.email ?? "계정";
  const initial = account?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="max-w-[140px] truncate text-xs font-medium">
          {label}
        </span>
        {account?.isAdmin ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
            Admin
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 text-sm text-slate-700 shadow-lg">
          <div className="px-3 pb-2">
            <p className="truncate text-xs font-medium text-slate-900">
              {label}
            </p>
            {account?.isAdmin ? (
              <p className="mt-0.5 text-[11px] text-slate-500">관리자 계정</p>
            ) : (
              <p className="mt-0.5 text-[11px] text-slate-500">일반 회원</p>
            )}
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <div className="flex flex-col gap-0.5 px-1">
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              disabled
            >
              내 계정 (준비 중)
            </button>
            <Link
              href="/channels"
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              채널 관리
            </Link>
            {account?.isAdmin ? (
              <Link
                href="/admin"
                className="flex w-full items-center rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                관리자 페이지
              </Link>
            ) : null}
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <span>로그아웃</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

