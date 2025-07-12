import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Get all categories
    const allCategories = [
      'AI_ART',
      'ANIMATION', 
      'ARCHITECTURE',
      'CHARACTERS',
      'LANDSCAPES',
      'ABSTRACT',
      'PORTRAITS',
      'FANTASY',
      'SCI_FI',
      'NATURE',
      'URBAN'
    ]

    const categories: { [key: string]: any[] } = {}

    // Get featured video for each category
    for (const category of allCategories) {
      const featuredVideos = await prisma.video.findMany({
        where: {
          category,
          isPublic: true,
          OR: [
            { isFeatured: true },
            { views: { gte: 1000 } } // High view count videos
          ]
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
          { isFeatured: 'desc' },
          { views: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 3 // Get top 3 videos per category
      })

      categories[category] = featuredVideos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        views: video.views,
        likes: video._count.likes,
        category: video.category,
        style: video.style,
        isFeatured: video.isFeatured,
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
    }

    // Get overall featured videos
    const allFeaturedVideos = await prisma.video.findMany({
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
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 12
    })

    const featured = allFeaturedVideos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      views: video.views,
      likes: video._count.likes,
      category: video.category,
      style: video.style,
      isFeatured: video.isFeatured,
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
      categories,
      featured,
      totalFeatured: featured.length,
      categoriesWithContent: Object.keys(categories).filter(cat => categories[cat].length > 0).length
    })

  } catch (error) {
    console.error('Get featured categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}