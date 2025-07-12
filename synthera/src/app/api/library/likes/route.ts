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

    const userId = session.user.id

    // Get user's liked videos
    const likes = await prisma.like.findMany({
      where: { userId },
      include: {
        video: {
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
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedLikes = likes.map(like => ({
      id: like.id,
      videoId: like.videoId,
      createdAt: like.createdAt.toISOString(),
      video: {
        id: like.video.id,
        title: like.video.title,
        thumbnailUrl: like.video.thumbnailUrl,
        duration: like.video.duration,
        views: like.video.views,
        likes: like.video._count.likes,
        category: like.video.category,
        style: like.video.style,
        isFeatured: like.video.isFeatured,
        pricing: {
          personalLicense: like.video.personalLicense,
          isAvailableForSale: like.video.isAvailableForSale,
        },
        creator: {
          username: like.video.creator.user.username,
          displayName: like.video.creator.user.name || like.video.creator.user.username,
          avatar: like.video.creator.user.image,
          isVerified: like.video.creator.user.isVerified,
        },
        createdAt: like.video.createdAt.toISOString(),
      }
    }))

    return NextResponse.json({ likes: formattedLikes })

  } catch (error) {
    console.error('Get user likes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    })

    if (existingLike) {
      // Unlike the video
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      return NextResponse.json({ 
        message: 'Video unliked',
        liked: false 
      })
    } else {
      // Like the video
      await prisma.like.create({
        data: {
          userId,
          videoId
        }
      })

      return NextResponse.json({ 
        message: 'Video liked',
        liked: true 
      })
    }

  } catch (error) {
    console.error('Toggle like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}