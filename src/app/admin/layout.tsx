import type { ReactNode } from "react";
import Link from "next/link";
import { ensureAdminOrRedirect } from "@/lib/auth/is-admin";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureAdminOrRedirect();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-6">
          <Link
            href="/"
            className="font-heading text-[22px] font-medium leading-none tracking-[-0.02em] text-foreground transition-opacity hover:opacity-70"
          >
            TubeWatch™
          </Link>
          <span className="text-foreground/20">/</span>
          <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/50 ring-1 ring-foreground/10">
            Admin
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
