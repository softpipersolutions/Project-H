import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category')
    const style = searchParams.get('style')
    const priceRange = searchParams.get('priceRange')
    const duration = searchParams.get('duration')
    const sortBy = searchParams.get('sortBy') || 'trending'
    const dateRange = searchParams.get('dateRange')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {
      isPublic: true,
      AND: []
    }

    // Text search
    if (query) {
      where.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
          {
            creator: {
              user: {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { username: { contains: query, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      })
    }

    // Category filter
    if (category && category !== 'All Categories') {
      where.AND.push({
        category: category.toUpperCase().replace(' ', '_')
      })
    }

    // Style filter
    if (style && style !== 'All Styles') {
      where.AND.push({
        style: { contains: style, mode: 'insensitive' }
      })
    }

    // Price range filter
    if (priceRange && priceRange !== 'all') {
      switch (priceRange) {
        case 'free':
          where.AND.push({
            OR: [
              { isAvailableForSale: false },
              { personalLicense: 0 }
            ]
          })
          break
        case 'under_10':
          where.AND.push({
            isAvailableForSale: true,
            personalLicense: { lt: 10 }
          })
          break
        case '10_50':
          where.AND.push({
            isAvailableForSale: true,
            personalLicense: { gte: 10, lte: 50 }
          })
          break
        case '50_100':
          where.AND.push({
            isAvailableForSale: true,
            personalLicense: { gte: 50, lte: 100 }
          })
          break
        case 'over_100':
          where.AND.push({
            isAvailableForSale: true,
            personalLicense: { gt: 100 }
          })
          break
      }
    }

    // Duration filter
    if (duration && duration !== 'all') {
      switch (duration) {
        case 'short':
          where.AND.push({ duration: { lt: 30 } })
          break
        case 'medium':
          where.AND.push({ duration: { gte: 30, lte: 120 } })
          break
        case 'long':
          where.AND.push({ duration: { gt: 120 } })
          break
      }
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      where.AND.push({
        createdAt: { gte: startDate }
      })
    }

    // Determine sort order
    let orderBy: any = {}
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'popular':
        orderBy = [{ views: 'desc' }, { likes: 'desc' }]
        break
      case 'views':
        orderBy = { views: 'desc' }
        break
      case 'likes':
        orderBy = { likes: 'desc' }
        break
      case 'price_low':
        orderBy = { personalLicense: 'asc' }
        break
      case 'price_high':
        orderBy = { personalLicense: 'desc' }
        break
      case 'trending':
      default:
        // Calculate trending score based on recent engagement
        orderBy = [
          { isFeatured: 'desc' },
          { views: 'desc' },
          { createdAt: 'desc' }
        ]
        break
    }

    // Get videos with pagination
    const [videos, totalCount] = await Promise.all([
      prisma.video.findMany({
        where,
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({ where })
    ])

    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      views: video.views,
      likes: video._count.likes,
      category: video.category,
      style: video.style,
      tags: video.tags,
      isFeatured: video.isFeatured,
      isPublic: video.isPublic,
      pricing: {
        personalLicense: video.personalLicense,
        commercialLicense: video.commercialLicense,
        extendedLicense: video.extendedLicense,
        exclusiveRights: video.exclusiveRights,
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

    return NextResponse.json({
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      filters: {
        query,
        category,
        style,
        priceRange,
        duration,
        sortBy,
        dateRange
      }
    })

  } catch (error) {
    console.error('Search videos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}