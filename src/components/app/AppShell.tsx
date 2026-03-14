import type { ReactNode } from "react";
import AppSidebar from "@/components/app/AppSidebar";
import AppHeader from "@/components/app/AppHeader";
import AppFooter from "@/components/app/AppFooter";
import AccountMenu from "@/components/app/AccountMenu";

type AppShellProps = {
  title: string;
  description?: string | null;
  right?: ReactNode;
  children: ReactNode;
};

export default function AppShell({
  title,
  description,
  right,
  children,
}: AppShellProps): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar />
      <div className="pl-64 flex min-h-screen flex-col">
        <AppHeader
          title={title}
          description={description}
          right={right ?? <AccountMenu />}
        />
        <main className="min-h-0 flex-1">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

