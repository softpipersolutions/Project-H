import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json({
        creators: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }

    // Build where clause for creator search
    const where = {
      user: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } }
        ]
      }
    }

    // Get creators with pagination
    const [creators, totalCount] = await Promise.all([
      prisma.creator.findMany({
        where,
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
                  videos: true,
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { user: { isVerified: 'desc' } },
          { user: { _count: { followers: 'desc' } } },
          { _count: { videos: 'desc' } }
        ]
      }),
      prisma.creator.count({ where })
    ])

    // Get video stats for each creator
    const creatorIds = creators.map(c => c.id)
    const videoStats = await prisma.video.groupBy({
      by: ['creatorId'],
      where: {
        creatorId: { in: creatorIds },
        isPublic: true
      },
      _sum: {
        views: true,
        likes: true,
      },
      _count: {
        id: true
      }
    })

    const statsMap = new Map(
      videoStats.map(stat => [
        stat.creatorId,
        {
          totalViews: stat._sum.views || 0,
          totalLikes: stat._sum.likes || 0,
          totalVideos: stat._count.id || 0
        }
      ])
    )

    const formattedCreators = creators.map(creator => {
      const stats = statsMap.get(creator.id) || {
        totalViews: 0,
        totalLikes: 0,
        totalVideos: 0
      }

      return {
        id: creator.id,
        username: creator.user.username,
        displayName: creator.user.name || creator.user.username,
        avatar: creator.user.image,
        isVerified: creator.user.isVerified,
        followers: creator.user._count.followers,
        totalVideos: stats.totalVideos,
        totalViews: stats.totalViews,
        specialties: creator.specialties || [],
      }
    })

    return NextResponse.json({
      creators: formattedCreators,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      query
    })

  } catch (error) {
    console.error('Search creators error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}