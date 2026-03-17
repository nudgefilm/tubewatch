"use client"

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

type AppFrameZipProps = {
  children: React.ReactNode
}

export function AppFrameZip({ children }: AppFrameZipProps): React.ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="md:pl-[var(--sidebar-width)]">
        <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-lg font-sans tracking-tight font-normal text-black">
          TubeWatch™
        </span>
        </header>
        <main className="flex-1 px-6 md:px-8 lg:px-10 py-6">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
