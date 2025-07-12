import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Calculate trending timeframes
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get hot videos (high engagement in last 24 hours)
    const hotVideosCount = await prisma.video.count({
      where: {
        isPublic: true,
        createdAt: { gte: last24Hours },
        views: { gte: 100 } // Threshold for "hot"
      }
    })

    // Get top category by video count this week
    const categoryStats = await prisma.video.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
        createdAt: { gte: lastWeek }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 1
    })

    const topCategory = categoryStats[0]?.category?.replace('_', ' ') || 'AI Art'

    // Find rising creator (highest follower growth)
    const risingCreatorQuery = await prisma.$queryRaw<any[]>`
      SELECT 
        u.username,
        COUNT(f.id) as current_followers,
        u.name as display_name
      FROM "User" u
      LEFT JOIN "Follow" f ON u.id = f."followingId"
      LEFT JOIN "Creator" c ON u.id = c."userId"
      WHERE c.id IS NOT NULL
      GROUP BY u.id, u.username, u.name
      ORDER BY current_followers DESC
      LIMIT 1
    `

    const risingCreator = risingCreatorQuery[0]?.username || '@artigen'
    const growth = risingCreatorQuery[0]?.current_followers * 10 || 150 // Simulated growth percentage

    // Get trending videos (high engagement recently)
    const trendingVideos = await prisma.video.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: lastWeek }
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
                image: true,
                isVerified: true,
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            purchases: true,
          }
        }
      },
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    })

    // Get featured videos
    const featuredVideos = await prisma.video.findMany({
      where: {
        isPublic: true,
        isFeatured: true
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
                image: true,
                isVerified: true,
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            purchases: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    })

    // Get trending creators
    const trendingCreators = await prisma.creator.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            isVerified: true,
            _count: {
              select: {
                followers: true,
              }
            }
          }
        },
        _count: {
          select: {
            videos: true,
          }
        }
      },
      orderBy: [
        { user: { _count: { followers: 'desc' } } },
        { isVerified: 'desc' }
      ],
      take: 6
    })

    // Get category breakdown
    const categoryBreakdown = await prisma.video.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
        createdAt: { gte: lastMonth }
      },
      _count: {
        id: true
      },
      _sum: {
        views: true,
        revenue: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 8
    })

    // Format trending videos
    const formattedTrendingVideos = trendingVideos.map(video => ({
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      views: video.views,
      likes: video._count.likes,
      category: video.category,
      style: video.style,
      isFeatured: video.isFeatured,
      pricing: {
        personalLicense: video.personalLicense,
        isAvailableForSale: video.isAvailableForSale,
      },
      creator: {
        username: video.creator.user.username,
        displayName: video.creator.user.name || video.creator.user.username,
        avatar: video.creator.user.image,
        isVerified: video.creator.user.isVerified,
      },
      createdAt: video.createdAt.toISOString(),
    }))

    // Format featured videos
    const formattedFeaturedVideos = featuredVideos.map(video => ({
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      views: video.views,
      likes: video._count.likes,
      category: video.category,
      style: video.style,
      isFeatured: video.isFeatured,
      pricing: {
        personalLicense: video.personalLicense,
        isAvailableForSale: video.isAvailableForSale,
      },
      creator: {
        username: video.creator.user.username,
        displayName: video.creator.user.name || video.creator.user.username,
        avatar: video.creator.user.image,
        isVerified: video.creator.user.isVerified,
      },
      createdAt: video.createdAt.toISOString(),
    }))

    // Format trending creators
    const formattedTrendingCreators = trendingCreators.map(creator => ({
      id: creator.id,
      username: creator.user.username,
      displayName: creator.user.name || creator.user.username,
      avatar: creator.user.image,
      isVerified: creator.user.isVerified,
      followers: creator.user._count.followers,
      totalVideos: creator._count.videos,
      specialties: creator.specialties || [],
    }))

    // Format category breakdown
    const formattedCategories = categoryBreakdown.map(cat => ({
      category: cat.category.replace('_', ' '),
      count: cat._count.id,
      views: cat._sum.views || 0,
      revenue: cat._sum.revenue || 0
    }))

    return NextResponse.json({
      trending: {
        hotVideos: hotVideosCount,
        topCategory,
        risingCreator,
        growth
      },
      trendingVideos: formattedTrendingVideos,
      featuredVideos: formattedFeaturedVideos,
      trendingCreators: formattedTrendingCreators,
      categories: formattedCategories,
      stats: {
        totalVideos: await prisma.video.count({ where: { isPublic: true } }),
        totalCreators: await prisma.creator.count(),
        totalViews: (await prisma.video.aggregate({
          where: { isPublic: true },
          _sum: { views: true }
        }))._sum.views || 0
      }
    })

  } catch (error) {
    console.error('Get trending data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}