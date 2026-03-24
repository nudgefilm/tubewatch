"use client"

import type { ReactNode } from "react"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar"
import { V0AppSidebar } from "@/components/layout/V0AppSidebar"

type AppFrameProps = {
  children: ReactNode
}

export function AppFrame({ children }: AppFrameProps) {
  return (
    <SidebarProvider className="min-h-screen">
      <V0AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-lg font-display">TubeWatch™</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
