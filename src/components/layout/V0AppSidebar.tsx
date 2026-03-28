"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Plus,
  Search,
  Settings,
  Target,
  TrendingUp,
  User,
  Youtube,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import {
  readSelectedChannelIdFromStorage,
  writeSelectedChannelIdToStorage,
} from "@/lib/channels/selectedChannelStorage"

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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

type SidebarChannel = {
  id: string
  channel_title: string | null
}

export function V0AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [channels, setChannels] = React.useState<SidebarChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  const activeChannelLabel = React.useMemo(() => {
    if (channels.length === 0) return "채널을 등록하세요"
    const ch = channels.find((c) => c.id === selectedChannelId)
    return ch?.channel_title ?? "채널 선택"
  }, [channels, selectedChannelId])

  const hrefWithChannel = React.useCallback(
    (base: string) => {
      if (!selectedChannelId) return base
      const sep = base.includes("?") ? "&" : "?"
      return `${base}${sep}channel=${encodeURIComponent(selectedChannelId)}`
    },
    [selectedChannelId]
  )

  const loadChannels = React.useCallback(async () => {
    try {
      const res = await fetch("/api/channels", { credentials: "include" })
      const json: { data?: SidebarChannel[] } = await res.json().catch(() => ({}))
      const list = Array.isArray(json.data) ? json.data : []
      setChannels(list)
      // 우선순위: 1) URL ?channel= → 2) localStorage → 3) 첫 번째 채널
      const urlChannelId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("channel")
          : null
      const stored = readSelectedChannelIdFromStorage()
      if (urlChannelId && list.some((c) => c.id === urlChannelId)) {
        // URL 채널이 유효한 경우 localStorage도 동기화
        setSelectedChannelId(urlChannelId)
        writeSelectedChannelIdToStorage(urlChannelId)
      } else if (stored && list.some((c) => c.id === stored)) {
        setSelectedChannelId(stored)
      } else if (list.length > 0) {
        const first = list[0].id
        setSelectedChannelId(first)
        writeSelectedChannelIdToStorage(first)
      } else {
        setSelectedChannelId(null)
        writeSelectedChannelIdToStorage(null)
      }
    } catch {
      setChannels([])
    }
  }, [])

  React.useEffect(() => {
    const onUpdate = () => {
      void loadChannels()
    }
    window.addEventListener("tubewatch-channels-updated", onUpdate)
    return () => window.removeEventListener("tubewatch-channels-updated", onUpdate)
  }, [loadChannels])

  React.useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email ?? null)
      if (!session?.user) {
        setChannels([])
        setSelectedChannelId(null)
        writeSelectedChannelIdToStorage(null)
        return
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        void loadChannels()
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [loadChannels])

  const selectChannel = (id: string) => {
    setSelectedChannelId(id)
    writeSelectedChannelIdToStorage(id)
    // URL 동기화: 현재 path의 기존 query를 유지하되 channel만 교체/추가
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("channel", id)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    writeSelectedChannelIdToStorage(null)
    router.push("/")
    router.refresh()
  }

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
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/50 rounded-lg"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Youtube className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{activeChannelLabel}</span>
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
                  {channels.map((ch, i) => (
                    <DropdownMenuItem
                      key={ch.id}
                      onSelect={() => {
                        selectChannel(ch.id)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={
                            i % 2 === 0
                              ? "flex size-6 items-center justify-center rounded bg-orange-500 text-white"
                              : "flex size-6 items-center justify-center rounded bg-blue-500 text-white"
                          }
                        >
                          <Youtube className="size-3" />
                        </div>
                        <span>{ch.channel_title ?? "채널"}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push("/channels")
                    }}
                  >
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
                    <Link href={hrefWithChannel(item.url)}>
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

      <SidebarFooter className="mt-auto flex flex-col gap-0 border-t border-sidebar-border pt-2">
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupLabel className="px-2">Settings</SidebarGroupLabel>
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

        <SidebarSeparator className="my-2" />

        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-muted-foreground" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-foreground">User Name</span>
            <span className="truncate text-xs text-muted-foreground">
              {userEmail ?? "user@example.com"}
            </span>
          </div>
        </div>
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            <span>로그아웃</span>
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
