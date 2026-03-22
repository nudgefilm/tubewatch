import type { ReactNode } from "react"

import { V0AppSidebar } from "@/components/layout/V0AppSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/v0-core/components/ui/sidebar"

export default function AppRoutesLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SidebarProvider className="min-h-screen">
      <V0AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="block h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-[1.55rem] leading-none font-heading font-medium tracking-[-0.02em]">TubeWatch™</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
