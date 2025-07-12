import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Get category statistics
    const categoryStats = await prisma.video.groupBy({
      by: ['category'],
      where: {
        isPublic: true
      },
      _count: {
        id: true
      },
      _sum: {
        views: true,
        likes: true,
        revenue: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Format the data
    const categories: { [key: string]: any } = {}
    
    categoryStats.forEach(stat => {
      categories[stat.category] = {
        count: stat._count.id,
        views: stat._sum.views || 0,
        likes: stat._sum.likes || 0,
        revenue: stat._sum.revenue || 0
      }
    })

    // Get trending categories (categories with high recent activity)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const trendingStats = await prisma.video.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
        createdAt: {
          gte: lastWeek
        }
      },
      _count: {
        id: true
      },
      _sum: {
        views: true
      },
      having: {
        _count: {
          id: {
            gte: 5 // At least 5 videos uploaded in the last week
          }
        }
      },
      orderBy: {
        _sum: {
          views: 'desc'
        }
      }
    })

    const trending = trendingStats.map(stat => stat.category)

    // Calculate growth rates
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const monthlyStats = await prisma.video.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
        createdAt: {
          gte: lastMonth
        }
      },
      _count: {
        id: true
      }
    })

    const growth: { [key: string]: number } = {}
    monthlyStats.forEach(stat => {
      const totalCount = categories[stat.category]?.count || 0
      const monthlyCount = stat._count.id
      const previousCount = totalCount - monthlyCount
      
      if (previousCount > 0) {
        growth[stat.category] = Math.round((monthlyCount / previousCount) * 100)
      } else {
        growth[stat.category] = 100 // New category
      }
    })

    return NextResponse.json({
      categories,
      trending,
      growth,
      totalCategories: Object.keys(categories).length,
      totalVideos: Object.values(categories).reduce((sum: number, cat: any) => sum + cat.count, 0),
      totalViews: Object.values(categories).reduce((sum: number, cat: any) => sum + cat.views, 0)
    })

  } catch (error) {
    console.error('Get category stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}