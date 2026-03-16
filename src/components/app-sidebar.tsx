"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

const menuItems = [
  { title: "내 채널", url: "/channels", icon: Tv2 },
  { title: "채널 분석", url: "/analysis", icon: BarChart3 },
  { title: "액션 플랜", url: "/action-plan", icon: Zap },
  { title: "SEO 랩", url: "/seo-lab", icon: Search },
  { title: "벤치마크", url: "/benchmark", icon: GitCompareArrows },
  { title: "넥스트 트렌드", url: "/next-trend", icon: TrendingUp },
]

const bottomMenuItems = [
  { title: "고객 지원", url: "/support", icon: HelpCircle },
  { title: "마이페이지", url: "/mypage", icon: User },
  { title: "설정", url: "/settings", icon: Settings },
]

const logoutItem = { title: "로그아웃", url: "/logout", icon: LogOut }

export function AppSidebar(): React.ReactElement {
  const pathname = usePathname()
  const isActive = (url: string): boolean => {
    if (url === "/analysis") return pathname.startsWith("/analysis")
    return pathname === url
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
                <SidebarMenuButton
                  asChild
                  isActive={pathname === logoutItem.url}
                >
                  <Link href={logoutItem.url}>
                    <logoutItem.icon className="size-4" />
                    <span>{logoutItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
