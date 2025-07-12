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

    // Get user's purchases with video details
    const purchases = await prisma.purchase.findMany({
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
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      videoId: purchase.videoId,
      licenseType: purchase.licenseType,
      amount: purchase.amount,
      currency: purchase.currency,
      status: purchase.status,
      createdAt: purchase.createdAt.toISOString(),
      video: {
        id: purchase.video.id,
        title: purchase.video.title,
        thumbnailUrl: purchase.video.thumbnailUrl,
        duration: purchase.video.duration,
        category: purchase.video.category,
        style: purchase.video.style,
        creator: {
          username: purchase.video.creator.user.username,
          displayName: purchase.video.creator.user.name || purchase.video.creator.user.username,
          avatar: purchase.video.creator.user.image,
          isVerified: purchase.video.creator.user.isVerified,
        }
      }
    }))

    return NextResponse.json({ purchases: formattedPurchases })

  } catch (error) {
    console.error('Get user purchases error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}