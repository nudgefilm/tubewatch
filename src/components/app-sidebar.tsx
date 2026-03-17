"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Tv2,
  BarChart3,
  Zap,
  Search,
  GitCompareArrows,
  TrendingUp,
  User,
  LogOut,
  HelpCircle,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  { title: "내 채널", url: "/channels", icon: Tv2 },
  { title: "채널 분석", url: "/analysis", icon: BarChart3 },
  { title: "액션 플랜", url: "/action-plan", icon: Zap },
  { title: "SEO 랩", url: "/seo-lab", icon: Search },
  { title: "벤치마크", url: "/benchmark", icon: GitCompareArrows },
  { title: "넥스트 트렌드", url: "/next-trend", icon: TrendingUp },
]

const bottomMenuItems = [
  { title: "고객 지원", url: "/guest-report", icon: HelpCircle },
  { title: "마이페이지", url: "/dashboard", icon: User },
  { title: "설정", url: "/dashboard/settings", icon: Settings },
]

const logoutItem = { title: "로그아웃", icon: LogOut }

export function AppSidebar(): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (url: string): boolean => {
    if (url === "/analysis") return pathname.startsWith("/analysis")
    return pathname === url
  }
  const handleLogout = async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex flex-col">
          <span className="text-xl font-display tracking-tight">
            TubeWatch™
          </span>
          <span className="text-xs text-muted-foreground">
            YouTube Growth OS
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      href={
                        item.url === "/analysis" ? "/channels" : item.url
                      }
                    >
                      <item.icon className="size-4" />
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
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} onClick={handleLogout}>
                  <logoutItem.icon className="size-4" />
                  <span>{logoutItem.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
