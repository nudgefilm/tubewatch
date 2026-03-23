"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  Plus,
  Search,
  Settings,
  Target,
  TrendingUp,
  User,
  Youtube,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/v0-core/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/v0-core/components/ui/dropdown-menu"

const mainNavItems = [
  {
    title: "Channel Analysis",
    url: "/analysis",
    icon: BarChart3,
  },
  {
    title: "Channel DNA",
    url: "/channel-dna",
    icon: Target,
  },
  {
    title: "Action Plan",
    url: "/action-plan",
    icon: FileText,
  },
  {
    title: "SEO Lab",
    url: "/seo-lab",
    icon: Search,
  },
  {
    title: "Next Trend",
    url: "/next-trend",
    icon: TrendingUp,
  },
]

const secondaryNavItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Support",
    url: "/support",
    icon: HelpCircle,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
]

export function V0AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [activeChannel, setActiveChannel] = React.useState("튜브 워치")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 pb-0">
        <Link href="/" className="flex flex-col">
          <span className="text-[23px] lg:text-[24px] leading-none font-heading font-medium tracking-[-0.02em]">TubeWatch™</span>
          <span className="text-xs text-muted-foreground">YouTube Growth OS</span>
        </Link>

        <div className="pt-2">
          <div className="px-2 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              분석 채널
            </span>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/50 rounded-lg"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Youtube className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{activeChannel}</span>
                      <span className="truncate text-xs text-muted-foreground">Premium Plan</span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuItem onClick={() => setActiveChannel("튜브 워치")}>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded bg-orange-500 text-white">
                        <Youtube className="size-3" />
                      </div>
                      <span>튜브 워치</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveChannel("My Channel 2")}>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded bg-blue-500 text-white">
                        <Youtube className="size-3" />
                      </div>
                      <span>My Channel 2</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="mr-2 size-4" />
                    Add Channel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarSeparator />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-muted-foreground" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-foreground">User Name</span>
            <span className="truncate text-xs text-muted-foreground">user@example.com</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
