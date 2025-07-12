import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const params = await context.params
    const username = params.username

    if (!username) {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        creator: {
          include: {
            _count: {
              select: {
                videos: true,
                purchases: true,
              }
            }
          }
        },
        _count: {
          select: {
            followers: true,
            following: true,
            videos: true,
            purchases: true,
            likes: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate aggregated stats
    const videoStats = await prisma.video.aggregate({
      where: { creatorId: user.id },
      _sum: {
        views: true,
        likes: true,
        revenue: true,
      },
      _count: true,
    })

    // Get creator-specific data if user is a creator
    let creatorData = null
    if (user.creator) {
      const purchases = await prisma.purchase.aggregate({
        where: { 
          video: { creatorId: user.id },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Calculate average rating (placeholder - would need rating system)
      creatorData = {
        id: user.creator.id,
        isVerified: user.creator.isVerified,
        totalEarnings: purchases._sum.amount || 0,
        totalSales: purchases._count || 0,
        averageRating: 4.8, // Placeholder
        specialties: user.creator.specialties || [],
      }
    }

    const profileData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.name || '',
      email: user.email,
      avatar: user.image,
      bio: user.bio,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks as any,
      isVerified: user.isVerified,
      userType: user.userType,
      subscriptionTier: user.subscriptionTier,
      joinedAt: user.createdAt.toISOString(),
      stats: {
        followers: user._count.followers,
        following: user._count.following,
        totalViews: videoStats._sum.views || 0,
        totalLikes: videoStats._sum.likes || 0,
        totalVideos: videoStats._count || 0,
        totalRevenue: videoStats._sum.revenue || 0,
      },
      creator: creatorData,
    }

    return NextResponse.json({ user: profileData })

  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const username = params.username

    // Check if user can edit this profile
    if (session.user.username !== username) {
      return NextResponse.json(
        { error: 'Forbidden - can only edit own profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      displayName, 
      bio, 
      location, 
      website, 
      socialLinks,
      specialties 
    } = body

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        name: displayName,
        bio,
        location,
        website,
        socialLinks: socialLinks as any,
      }
    })

    // Update creator specialties if user is a creator
    if (updatedUser.userType === 'CREATOR' && specialties) {
      await prisma.creator.update({
        where: { userId: updatedUser.id },
        data: {
          specialties: specialties,
        }
      })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}