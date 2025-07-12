import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VideoCategory } from '@prisma/client'

export async function GET() {
  try {
    // Get all categories
    const allCategories: VideoCategory[] = [
      VideoCategory.CINEMATIC,
      VideoCategory.ABSTRACT,
      VideoCategory.PHOTOREALISTIC,
      VideoCategory.ANIMATION,
      VideoCategory.MOTION_GRAPHICS,
      VideoCategory.EXPERIMENTAL,
      VideoCategory.NATURE,
      VideoCategory.ARCHITECTURE,
      VideoCategory.FASHION,
      VideoCategory.TECHNOLOGY
    ]

    const categories: { [key: string]: unknown[] } = {}

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
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              type: true,
              isVerified: true,
            }
          },
          _count: {
            select: {
              videoLikes: true,
              videoComments: true,
              videoPurchases: true,
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
        likes: video._count.videoLikes,
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
          username: video.creator.username,
          displayName: video.creator.displayName,
          avatar: video.creator.avatar,
          isVerified: video.creator.isVerified,
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
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            type: true,
            isVerified: true,
          }
        },
        _count: {
          select: {
            videoLikes: true,
            videoComments: true,
            videoPurchases: true,
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
      likes: video._count.videoLikes,
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
        username: video.creator.username,
        displayName: video.creator.displayName,
        avatar: video.creator.avatar,
        isVerified: video.creator.isVerified,
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