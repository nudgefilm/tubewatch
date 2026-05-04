"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Youtube,
  Activity,
  Building2,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",                   label: "대시보드",    icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/admin/users",             label: "사용자",      icon: <Users className="h-4 w-4" /> },
  { href: "/admin/channels",          label: "채널",        icon: <Youtube className="h-4 w-4" /> },
  { href: "/admin/pipeline",          label: "파이프라인",  icon: <Activity className="h-4 w-4" /> },
  { href: "/admin/enterprise-orders", label: "채널 컨설팅", icon: <Building2 className="h-4 w-4" /> },
  { href: "/admin/diagnose-leads",    label: "무료 진단",   icon: <Stethoscope className="h-4 w-4" /> },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default function AdminSidebar(): JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-foreground/10 bg-background">
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          관리
        </p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-foreground/8 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-foreground/10 px-3 py-4">
        <a
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          서비스로 돌아가기
        </a>
      </div>
    </aside>
  );
}
