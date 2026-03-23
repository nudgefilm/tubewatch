"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Users, 
  Youtube,
  BarChart3,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// Summary Stat Card
function StatCard({ 
  title, 
  value, 
  change, 
  changeType,
  icon: Icon,
  iconColor
}: { 
  title: string
  value: string
  change: string
  changeType: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {changeType === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : changeType === 'down' ? (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              ) : null}
              <span className={`text-sm ${
                changeType === 'up' ? 'text-green-500' : 
                changeType === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {change}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: 'active' | 'inactive' | 'pending' | 'error' }) {
  const styles = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-600 border-red-500/20'
  }
  
  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    error: 'Error'
  }

  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  )
}

// Table Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-6 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

// Empty State
function EmptyTable({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Search className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Mock Data
  const stats = [
    { title: 'Total Users', value: '2,847', change: '+12.5% from last month', changeType: 'up' as const, icon: Users, iconColor: 'bg-orange-500/10 text-orange-500' },
    { title: 'Registered Channels', value: '1,234', change: '+8.2% from last month', changeType: 'up' as const, icon: Youtube, iconColor: 'bg-red-500/10 text-red-500' },
    { title: 'Total Analyses', value: '15,892', change: '+23.1% from last month', changeType: 'up' as const, icon: BarChart3, iconColor: 'bg-blue-500/10 text-blue-500' },
    { title: 'Active Plans', value: '892', change: '-2.4% from last month', changeType: 'down' as const, icon: CreditCard, iconColor: 'bg-green-500/10 text-green-500' },
  ]

  const recentUsers = [
    { id: 1, name: 'Kim Creator', email: 'kim@example.com', plan: 'Premium', status: 'active' as const, joinedAt: '2024-03-15' },
    { id: 2, name: 'Lee Studio', email: 'lee@example.com', plan: 'Free', status: 'active' as const, joinedAt: '2024-03-14' },
    { id: 3, name: 'Park Media', email: 'park@example.com', plan: 'Premium', status: 'pending' as const, joinedAt: '2024-03-14' },
    { id: 4, name: 'Choi Channel', email: 'choi@example.com', plan: 'Pro', status: 'active' as const, joinedAt: '2024-03-13' },
    { id: 5, name: 'Jung Content', email: 'jung@example.com', plan: 'Free', status: 'inactive' as const, joinedAt: '2024-03-12' },
  ]

  const recentAnalyses = [
    { id: 1, channel: '@kimcreator', type: 'Full Analysis', score: 85, status: 'active' as const, createdAt: '2024-03-15 14:32' },
    { id: 2, channel: '@leestudio', type: 'SEO Check', score: 72, status: 'active' as const, createdAt: '2024-03-15 13:45' },
    { id: 3, channel: '@parkmedia', type: 'Full Analysis', score: null, status: 'pending' as const, createdAt: '2024-03-15 12:20' },
    { id: 4, channel: '@choichannel', type: 'Channel DNA', score: 91, status: 'active' as const, createdAt: '2024-03-15 11:15' },
    { id: 5, channel: '@jungcontent', type: 'Full Analysis', score: null, status: 'error' as const, createdAt: '2024-03-15 10:30' },
  ]

  const channelRegistrations = [
    { id: 1, channel: '@kimcreator', subscribers: '125K', videos: 342, user: 'Kim Creator', status: 'active' as const, registeredAt: '2024-03-15' },
    { id: 2, channel: '@leestudio', subscribers: '89K', videos: 156, user: 'Lee Studio', status: 'active' as const, registeredAt: '2024-03-14' },
    { id: 3, channel: '@parkmedia', subscribers: '234K', videos: 521, user: 'Park Media', status: 'pending' as const, registeredAt: '2024-03-14' },
    { id: 4, channel: '@choichannel', subscribers: '45K', videos: 89, user: 'Choi Channel', status: 'active' as const, registeredAt: '2024-03-13' },
  ]

  const paymentHistory = [
    { id: 1, user: 'Kim Creator', plan: 'Premium', amount: '$29', status: 'active' as const, date: '2024-03-15' },
    { id: 2, user: 'Choi Channel', plan: 'Pro', amount: '$49', status: 'active' as const, date: '2024-03-14' },
    { id: 3, user: 'Park Media', plan: 'Premium', amount: '$29', status: 'pending' as const, date: '2024-03-14' },
    { id: 4, user: 'New User', plan: 'Premium', amount: '$29', status: 'error' as const, date: '2024-03-13' },
  ]

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-[100px] mb-2" />
                  <Skeleton className="h-8 w-[80px] mb-2" />
                  <Skeleton className="h-3 w-[120px]" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <TableSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Main</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 px-6 lg:px-12 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Badge variant="outline" className="mb-4">Admin</Badge>
          <h1 className="text-3xl font-bold tracking-tight">서비스 운영 현황</h1>
          <p className="text-muted-foreground mt-2">
            TubeWatch 서비스 운영 현황을 한눈에 확인합니다.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Management Section */}
      <section className="py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>운영 관리</CardTitle>
                  <CardDescription>사용자, 분석, 채널, 결제 현황을 관리합니다.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-9 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="users">Recent Users</TabsTrigger>
                  <TabsTrigger value="analyses">Recent Analyses</TabsTrigger>
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentUsers.filter(user => 
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-orange-500" />
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={user.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.joinedAt}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {recentUsers.filter(user => 
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <EmptyTable message="검색 결과가 없습니다." />
                  )}
                </TabsContent>

                {/* Analyses Tab */}
                <TabsContent value="analyses">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAnalyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Youtube className="w-4 h-4 text-red-500" />
                              </div>
                              <span className="font-medium">{analysis.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell>{analysis.type}</TableCell>
                          <TableCell>
                            {analysis.score !== null ? (
                              <span className="font-medium">{analysis.score}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={analysis.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{analysis.createdAt}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Channels Tab */}
                <TabsContent value="channels">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Subscribers</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channelRegistrations.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Youtube className="w-4 h-4 text-red-500" />
                              </div>
                              <span className="font-medium">{channel.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell>{channel.subscribers}</TableCell>
                          <TableCell>{channel.videos}</TableCell>
                          <TableCell className="text-muted-foreground">{channel.user}</TableCell>
                          <TableCell>
                            <StatusBadge status={channel.status} />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-green-500" />
                              </div>
                              <span className="font-medium">{payment.user}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{payment.plan}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{payment.amount}</TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 px-6 lg:px-12 border-t">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Quick Status</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">System Status</p>
                    <p className="text-sm text-muted-foreground">All systems operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Pending Tasks</p>
                    <p className="text-sm text-muted-foreground">3 analyses in queue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Today's Analyses</p>
                    <p className="text-sm text-muted-foreground">127 completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
