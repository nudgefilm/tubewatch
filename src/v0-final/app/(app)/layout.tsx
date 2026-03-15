"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/v0-final/components/ui/sidebar"
import { AppSidebar } from "@/v0-final/components/app-sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-lg font-display">TubeWatch™</span>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
