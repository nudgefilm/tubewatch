"use client"

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

type V0AppFrameProps = {
  children: React.ReactNode
}

export function V0AppFrame({ children }: V0AppFrameProps): React.ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-lg font-display">TubeWatch™</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

