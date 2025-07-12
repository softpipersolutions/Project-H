import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '8')

    if (!query || query.length < 2) {
      // Return popular searches when no query
      const popularTags = await prisma.video.findMany({
        where: {
          isPublic: true,
          tags: {
            isEmpty: false
          }
        },
        select: {
          tags: true
        },
        orderBy: {
          views: 'desc'
        },
        take: 50
      })

      // Extract and count tags
      const tagCount: { [key: string]: number } = {}
      popularTags.forEach(video => {
        video.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      })

      const popularSearches = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag]) => ({
          type: 'tag',
          value: tag,
          label: `#${tag}`,
          count: tagCount[tag]
        }))

      return NextResponse.json({
        suggestions: popularSearches,
        type: 'popular'
      })
    }

    const suggestions = []

    // Search for matching video titles
    const videoSuggestions = await prisma.video.findMany({
      where: {
        isPublic: true,
        title: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        views: true,
        creator: {
          select: {
            user: {
              select: {
                name: true,
                isVerified: true
              }
            }
          }
        }
      },
      orderBy: {
        views: 'desc'
      },
      take: 3
    })

    videoSuggestions.forEach(video => {
      suggestions.push({
        type: 'video',
        value: video.title,
        label: video.title,
        id: video.id,
        thumbnail: video.thumbnailUrl,
        creator: video.creator.user.name,
        views: video.views,
        verified: video.creator.user.isVerified
      })
    })

    // Search for matching creators
    const creatorSuggestions = await prisma.creator.findMany({
      where: {
        user: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              username: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      },
      select: {
        user: {
          select: {
            username: true,
            name: true,
            image: true,
            isVerified: true,
            _count: {
              select: {
                followers: true,
                videos: true
              }
            }
          }
        }
      },
      orderBy: {
        user: {
          _count: {
            followers: 'desc'
          }
        }
      },
      take: 3
    })

    creatorSuggestions.forEach(creator => {
      suggestions.push({
        type: 'creator',
        value: creator.user.name || creator.user.username,
        label: `@${creator.user.username}`,
        username: creator.user.username,
        avatar: creator.user.image,
        followers: creator.user._count.followers,
        videos: creator.user._count.videos,
        verified: creator.user.isVerified
      })
    })

    // Search for matching tags
    const tagSuggestions = await prisma.video.findMany({
      where: {
        isPublic: true,
        tags: {
          hasSome: [query]
        }
      },
      select: {
        tags: true
      },
      take: 20
    })

    const matchingTags = new Set<string>()
    tagSuggestions.forEach(video => {
      video.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          matchingTags.add(tag)
        }
      })
    })

    Array.from(matchingTags).slice(0, 3).forEach(tag => {
      suggestions.push({
        type: 'tag',
        value: tag,
        label: `#${tag}`,
        count: 0 // Could add actual count if needed
      })
    })

    // Search for matching categories
    const categories = [
      'AI Art', 'Animation', 'Architecture', 'Characters', 'Landscapes',
      'Abstract', 'Portraits', 'Fantasy', 'Sci-Fi', 'Nature', 'Urban'
    ]

    const matchingCategories = categories.filter(cat =>
      cat.toLowerCase().includes(query.toLowerCase())
    )

    matchingCategories.slice(0, 2).forEach(category => {
      suggestions.push({
        type: 'category',
        value: category,
        label: category,
        category: category
      })
    })

    // Search for matching styles
    const styles = [
      'Photorealistic', 'Cinematic', 'Artistic', 'Minimalist', 'Vintage',
      'Futuristic', 'Cartoon', 'Oil Painting', 'Watercolor', 'Digital Art', 'Concept Art'
    ]

    const matchingStyles = styles.filter(style =>
      style.toLowerCase().includes(query.toLowerCase())
    )

    matchingStyles.slice(0, 2).forEach(style => {
      suggestions.push({
        type: 'style',
        value: style,
        label: style,
        style: style
      })
    })

    // Limit total suggestions
    const limitedSuggestions = suggestions.slice(0, limit)

    return NextResponse.json({
      suggestions: limitedSuggestions,
      query,
      type: 'search'
    })

  } catch (error) {
    console.error('Get search suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}