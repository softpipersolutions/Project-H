import { prisma } from './prisma'
import type { 
  User, 
  Video, 
  VideoCategory,
  VideoStyle,
  LicenseType 
} from '@prisma/client'

// User operations
export const userQueries = {
  async createUser(data: {
    email: string
    username: string
    displayName: string
    avatar?: string
    type?: 'CREATOR' | 'COLLECTOR' | 'BROWSER'
  }) {
    return prisma.user.create({
      data: {
        ...data,
        type: data.type || 'BROWSER',
      },
    })
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        creatorProfile: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
  },

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        creatorProfile: true,
      },
    })
  },

  async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        creatorProfile: true,
        videos: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  },

  async updateUser(id: string, data: Partial<User>) {
    return prisma.user.update({
      where: { id },
      data,
    })
  },
}

// Video operations
export const videoQueries = {
  async createVideo(data: {
    title: string
    description: string
    thumbnailUrl: string
    videoUrl: string
    duration: number
    fileSize: number
    resolution: string
    creatorId: string
    aiModel: string
    prompts: string[]
    tags: string[]
    category: VideoCategory
    style: VideoStyle
    aspectRatio: string
    personalLicense?: number
    commercialLicense?: number
    extendedLicense?: number
  }) {
    return prisma.video.create({
      data,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            type: true,
            isVerified: true,
            creatorProfile: true,
          },
        },
      },
    })
  },

  async getVideoById(id: string, userId?: string) {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            type: true,
            isVerified: true,
            creatorProfile: true,
          },
        },
        videoLikes: userId ? { where: { userId } } : false,
        videoComments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (video && userId) {
      // Increment view count
      await prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } },
      })
    }

    return video
  },

  async getVideos(params: {
    page?: number
    limit?: number
    category?: VideoCategory
    style?: VideoStyle
    creatorId?: string
    featured?: boolean
    search?: string
    sortBy?: 'recent' | 'popular' | 'trending'
  } = {}) {
    const { page = 1, limit = 20, category, style, creatorId, featured, search, sortBy = 'recent' } = params
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      isPublic: true,
      ...(category && { category }),
      ...(style && { style }),
      ...(creatorId && { creatorId }),
      ...(featured && { isFeatured: true }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ],
      }),
    }

    const orderBy: Record<string, string> = {
      recent: { createdAt: 'desc' },
      popular: { views: 'desc' },
      trending: { likes: 'desc' },
    }[sortBy]

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              type: true,
              isVerified: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.video.count({ where }),
    ])

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  },

  async updateVideo(id: string, data: Partial<Video>) {
    return prisma.video.update({
      where: { id },
      data,
    })
  },

  async deleteVideo(id: string, userId: string) {
    // Verify ownership
    const video = await prisma.video.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!video || video.creatorId !== userId) {
      throw new Error('Unauthorized')
    }

    return prisma.video.delete({
      where: { id },
    })
  },
}

// Creator operations
export const creatorQueries = {
  async createCreatorProfile(userId: string, data: {
    bio?: string
    website?: string
    twitterHandle?: string
    instagramHandle?: string
    youtubeChannel?: string
    discordHandle?: string
    specialties?: VideoCategory[]
  }) {
    return prisma.creator.create({
      data: {
        userId,
        ...data,
      },
    })
  },

  async getCreatorStats(userId: string) {
    const [videos, totalViews, totalLikes, totalPurchases, totalRevenue] = await Promise.all([
      prisma.video.count({ where: { creatorId: userId } }),
      prisma.video.aggregate({
        where: { creatorId: userId },
        _sum: { views: true },
      }),
      prisma.video.aggregate({
        where: { creatorId: userId },
        _sum: { likes: true },
      }),
      prisma.purchase.count({
        where: { 
          video: { creatorId: userId },
          status: 'COMPLETED',
        },
      }),
      prisma.purchase.aggregate({
        where: { 
          video: { creatorId: userId },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
    ])

    return {
      totalVideos: videos,
      totalViews: totalViews._sum.views || 0,
      totalLikes: totalLikes._sum.likes || 0,
      totalPurchases,
      totalRevenue: totalRevenue._sum.amount || 0,
    }
  },

  async getTopCreators(limit = 10) {
    return prisma.creator.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        followers: 'desc',
      },
      take: limit,
    })
  },
}

// Purchase operations
export const purchaseQueries = {
  async createPurchase(data: {
    userId: string
    videoId: string
    licenseType: LicenseType
    amount: number
    stripePaymentId: string
  }) {
    return prisma.purchase.create({
      data,
      include: {
        video: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    })
  },

  async getUserPurchases(userId: string) {
    return prisma.purchase.findMany({
      where: { 
        userId,
        status: 'COMPLETED',
      },
      include: {
        video: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async hasUserPurchased(userId: string, videoId: string) {
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId,
        videoId,
        status: 'COMPLETED',
      },
    })

    return !!purchase
  },
}

// Collection operations
export const collectionQueries = {
  async createCollection(data: {
    title: string
    description: string
    coverImage: string
    curatorId?: string
    isOfficial?: boolean
  }) {
    return prisma.collection.create({
      data,
    })
  },

  async getCollections(featured = false) {
    return prisma.collection.findMany({
      where: featured ? { isOfficial: true } : {},
      include: {
        curator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        videos: {
          take: 5,
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async addVideoToCollection(collectionId: string, videoId: string) {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        videos: {
          connect: { id: videoId },
        },
      },
    })
  },
}

// Analytics operations
export const analyticsQueries = {
  async getVideoAnalytics(videoId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // This would typically involve time-series data
    // For now, we'll return basic stats
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        views: true,
        likes: true,
        purchases: true,
        revenue: true,
        comments: true,
      },
    })

    return video
  },

  async getDashboardStats(userId: string) {
    const [videosCount, totalViews, totalRevenue, recentPurchases] = await Promise.all([
      prisma.video.count({ where: { creatorId: userId } }),
      prisma.video.aggregate({
        where: { creatorId: userId },
        _sum: { views: true },
      }),
      prisma.purchase.aggregate({
        where: { 
          video: { creatorId: userId },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.purchase.count({
        where: { 
          video: { creatorId: userId },
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ])

    return {
      totalVideos: videosCount,
      totalViews: totalViews._sum.views || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentPurchases,
    }
  },
}