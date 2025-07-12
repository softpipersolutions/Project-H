'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navigation/navbar'
import { VideoCard } from '@/components/video/video-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign,
  TrendingUp,
  Eye,
  Users,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Star,
  Upload,
  Settings,
  Crown,
  Zap,
  Target,
  Award,
  Loader2,
  Plus
} from 'lucide-react'
import { formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'

interface DashboardData {
  stats: {
    totalRevenue: number
    totalViews: number
    totalLikes: number
    totalVideos: number
    totalSales: number
    followers: number
    revenueGrowth: number
    viewsGrowth: number
  }
  recentVideos: Array<{
    id: string
    title: string
    thumbnailUrl: string
    views: number
    likes: number
    revenue: number
    createdAt: string
  }>
  topPerformers: Array<{
    id: string
    title: string
    views: number
    revenue: number
    thumbnailUrl: string
  }>
  revenueChart: Array<{
    date: string
    revenue: number
    sales: number
  }>
  analytics: {
    topCategories: Array<{ category: string; count: number; revenue: number }>
    averageViewDuration: number
    conversionRate: number
    repeatCustomers: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')

  // Always call hooks first
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return response.json()
    },
    enabled: !!session?.user && session.user.userType === 'CREATOR'
  })

  // Redirect if not authenticated or not a creator
  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (session.user.userType !== 'CREATOR') {
    redirect('/profile/' + session.user.username)
  }

  const data: DashboardData | undefined = dashboardData?.data

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-500'
    if (growth < 0) return 'text-red-500'
    return 'text-muted-foreground'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}! Here&apos;s how your content is performing.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <a href="/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </a>
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(data.stats.totalRevenue)}</div>
                  <div className={`text-xs flex items-center gap-1 ${getGrowthColor(data.stats.revenueGrowth)}`}>
                    {getGrowthIcon(data.stats.revenueGrowth)}
                    {data.stats.revenueGrowth > 0 ? '+' : ''}{data.stats.revenueGrowth.toFixed(1)}% from last month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data.stats.totalViews)}</div>
                  <div className={`text-xs flex items-center gap-1 ${getGrowthColor(data.stats.viewsGrowth)}`}>
                    {getGrowthIcon(data.stats.viewsGrowth)}
                    {data.stats.viewsGrowth > 0 ? '+' : ''}{data.stats.viewsGrowth.toFixed(1)}% from last month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data.stats.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {data.stats.totalVideos} videos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Followers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data.stats.followers)}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.stats.totalLikes} total likes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <Badge variant="secondary">{data.analytics.conversionRate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. View Duration</span>
                    <span className="text-sm font-medium">{data.analytics.averageViewDuration}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Repeat Customers</span>
                    <span className="text-sm font-medium">{data.analytics.repeatCustomers}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.analytics.topCategories.slice(0, 3).map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm">{category.category}</span>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(category.revenue)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Creator Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">
                      <Star className="w-3 h-3 mr-1" />
                      Verified Creator
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.user.subscriptionTier === 'PRO' ? (
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Pro Plan - 0% platform fees</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Premium Plan - 5% platform fees</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Videos and Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Videos
                  </CardTitle>
                  <CardDescription>Your latest uploads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.recentVideos.map((video) => (
                    <div key={video.id} className="flex items-center gap-3">
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{video.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatNumber(video.views)} views</span>
                          <span>{formatNumber(video.likes)} likes</span>
                          <span>{formatPrice(video.revenue)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(video.createdAt))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Your highest earning videos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.topPerformers.map((video, index) => (
                    <div key={video.id} className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs min-w-6 justify-center">
                        #{index + 1}
                      </Badge>
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{video.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatNumber(video.views)} views</span>
                          <span className="font-medium text-green-600">{formatPrice(video.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Chart visualization would go here</p>
                      <p className="text-xs">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    View Analytics
                  </CardTitle>
                  <CardDescription>Traffic patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Analytics visualization would go here</p>
                      <p className="text-xs">Real-time data tracking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>How your content performs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.analytics.topCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-muted-foreground">{category.count} videos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(category.revenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(category.revenue / category.count)} avg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Videos</h2>
                <p className="text-muted-foreground">{data.stats.totalVideos} videos uploaded</p>
              </div>
              <Button asChild>
                <a href="/upload">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload New Video
                </a>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.recentVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  duration={120} // Would need duration from API
                  views={video.views}
                  likes={video.likes}
                  creator={{
                    username: session.user.username!,
                    displayName: session.user.name!,
                    avatar: session.user.image,
                    isVerified: true,
                  }}
                  category="AI_ART"
                  style="Cinematic"
                  isFeatured={false}
                  pricing={{
                    personalLicense: 10,
                    isAvailableForSale: true,
                  }}
                  createdAt={video.createdAt}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPrice(data.stats.totalRevenue * 0.3)}</div>
                  <p className="text-sm text-muted-foreground">+23% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPrice(data.stats.totalRevenue)}</div>
                  <p className="text-sm text-muted-foreground">Lifetime revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPrice(data.stats.totalRevenue * 0.1)}</div>
                  <p className="text-sm text-muted-foreground">Available in 3 days</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Earnings by license type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Personal Licenses</p>
                      <p className="text-sm text-muted-foreground">Most popular choice</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(data.stats.totalRevenue * 0.4)}</p>
                      <p className="text-sm text-muted-foreground">40% of total</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Commercial Licenses</p>
                      <p className="text-sm text-muted-foreground">Business usage</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(data.stats.totalRevenue * 0.35)}</p>
                      <p className="text-sm text-muted-foreground">35% of total</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Extended Licenses</p>
                      <p className="text-sm text-muted-foreground">Unlimited usage</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(data.stats.totalRevenue * 0.2)}</p>
                      <p className="text-sm text-muted-foreground">20% of total</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Exclusive Rights</p>
                      <p className="text-sm text-muted-foreground">Full ownership</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(data.stats.totalRevenue * 0.05)}</p>
                      <p className="text-sm text-muted-foreground">5% of total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}