import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const params = await context.params
    const username = params.username

    if (!username) {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isOwnProfile = session?.user?.id === user.id

    // Get videos with appropriate filtering
    const videos = await prisma.video.findMany({
      where: {
        creatorId: user.id,
        // Show all videos if own profile, only public videos otherwise
        ...(isOwnProfile ? {} : { isPublic: true })
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      views: video.views,
      likes: video._count.likes,
      comments: video._count.comments,
      purchases: video._count.purchases,
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
        id: video.creator.id,
        username: video.creator.user.username,
        displayName: video.creator.user.name || video.creator.user.username,
        avatar: video.creator.user.image,
        isVerified: video.creator.user.isVerified,
      },
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    }))

    return NextResponse.json({ 
      videos: formattedVideos,
      total: formattedVideos.length 
    })

  } catch (error) {
    console.error('Get user videos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}