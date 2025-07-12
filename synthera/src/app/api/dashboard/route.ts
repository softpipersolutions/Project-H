import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.userType !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can access dashboard' },
        { status: 403 }
      )
    }

    const userId = session.user.id

    // Get user's creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: {
        user: true,
        _count: {
          select: {
            videos: true,
            purchases: true,
          }
        }
      }
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      )
    }

    // Calculate date ranges
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get overall stats
    const [
      totalRevenue,
      totalViews,
      totalLikes,
      totalVideos,
      totalSales,
      followers,
      lastMonthRevenue,
      lastMonthViews
    ] = await Promise.all([
      // Total revenue
      prisma.purchase.aggregate({
        where: {
          video: { creatorId: creator.id },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      
      // Total views
      prisma.video.aggregate({
        where: { creatorId: creator.id },
        _sum: { views: true }
      }),
      
      // Total likes
      prisma.like.count({
        where: { video: { creatorId: creator.id } }
      }),
      
      // Total videos
      prisma.video.count({
        where: { creatorId: creator.id }
      }),
      
      // Total sales
      prisma.purchase.count({
        where: {
          video: { creatorId: creator.id },
          status: 'COMPLETED'
        }
      }),
      
      // Followers
      prisma.follow.count({
        where: { followingId: userId }
      }),
      
      // Last month revenue for growth calculation
      prisma.purchase.aggregate({
        where: {
          video: { creatorId: creator.id },
          status: 'COMPLETED',
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        },
        _sum: { amount: true }
      }),
      
      // Last month views for growth calculation
      prisma.video.aggregate({
        where: { 
          creatorId: creator.id,
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        },
        _sum: { views: true }
      })
    ])

    // Calculate growth percentages
    const currentRevenue = totalRevenue._sum.amount || 0
    const previousRevenue = lastMonthRevenue._sum.amount || 0
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const currentViews = totalViews._sum.views || 0
    const previousViews = lastMonthViews._sum.views || 0
    const viewsGrowth = previousViews > 0 
      ? ((currentViews - previousViews) / previousViews) * 100 
      : 0

    // Get recent videos
    const recentVideos = await prisma.video.findMany({
      where: { creatorId: creator.id },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        views: true,
        revenue: true,
        createdAt: true,
        _count: {
          select: { likes: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get top performing videos by revenue
    const topPerformers = await prisma.video.findMany({
      where: { creatorId: creator.id },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        views: true,
        revenue: true,
      },
      orderBy: { revenue: 'desc' },
      take: 5
    })

    // Get category performance
    const categoryStats = await prisma.video.groupBy({
      by: ['category'],
      where: { creatorId: creator.id },
      _count: { id: true },
      _sum: { revenue: true }
    })

    const topCategories = categoryStats
      .map(stat => ({
        category: stat.category.replace('_', ' '),
        count: stat._count.id,
        revenue: stat._sum.revenue || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate analytics metrics
    const conversionRate = totalSales > 0 && currentViews > 0 
      ? (totalSales / currentViews) * 100 
      : 0

    const averageViewDuration = 45 // Placeholder - would need view duration tracking

    // Calculate repeat customers (placeholder)
    const repeatCustomers = 15 // Placeholder percentage

    // Generate revenue chart data (last 30 days)
    const revenueChart = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // This would typically come from actual daily aggregations
      revenueChart.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 100, // Placeholder data
        sales: Math.floor(Math.random() * 10)
      })
    }

    const dashboardData = {
      stats: {
        totalRevenue: currentRevenue,
        totalViews: currentViews,
        totalLikes,
        totalVideos,
        totalSales,
        followers,
        revenueGrowth,
        viewsGrowth
      },
      recentVideos: recentVideos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        views: video.views,
        likes: video._count.likes,
        revenue: video.revenue,
        createdAt: video.createdAt.toISOString()
      })),
      topPerformers: topPerformers.map(video => ({
        id: video.id,
        title: video.title,
        views: video.views,
        revenue: video.revenue,
        thumbnailUrl: video.thumbnailUrl
      })),
      revenueChart,
      analytics: {
        topCategories,
        averageViewDuration,
        conversionRate,
        repeatCustomers
      }
    }

    return NextResponse.json({ data: dashboardData })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}