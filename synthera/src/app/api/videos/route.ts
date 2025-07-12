import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { videoQueries } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryParam = searchParams.get('category')
    const styleParam = searchParams.get('style')
    const category = categoryParam as 'CINEMATIC' | 'ABSTRACT' | 'PHOTOREALISTIC' | 'ANIMATION' | 'MOTION_GRAPHICS' | 'EXPERIMENTAL' | 'NATURE' | 'ARCHITECTURE' | 'FASHION' | 'TECHNOLOGY' | undefined
    const style = styleParam as 'CINEMATIC' | 'MINIMALIST' | 'SURREAL' | 'RETRO' | 'FUTURISTIC' | 'ARTISTIC' | 'COMMERCIAL' | 'DOCUMENTARY' | undefined
    const creatorId = searchParams.get('creatorId') || undefined
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search') || undefined
    const sortBy = searchParams.get('sortBy') as 'recent' | 'popular' | 'trending' || 'recent'

    const result = await videoQueries.getVideos({
      page,
      limit,
      category,
      style,
      creatorId,
      featured,
      search,
      sortBy,
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get videos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('id')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      )
    }

    await videoQueries.deleteVideo(videoId, session.user.id)

    return NextResponse.json({ message: 'Video deleted successfully' })

  } catch (error) {
    console.error('Delete video error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}