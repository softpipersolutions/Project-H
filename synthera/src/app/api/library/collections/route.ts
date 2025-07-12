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

    // Get user's collections
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            videos: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const formattedCollections = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      videoCount: collection._count.videos,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    }))

    return NextResponse.json({ collections: formattedCollections })

  } catch (error) {
    console.error('Get user collections error:', error)
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
    const { name, description, isPublic = false } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        isPublic,
        userId,
      }
    })

    return NextResponse.json({ 
      message: 'Collection created successfully',
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        videoCount: 0,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      }
    })

  } catch (error) {
    console.error('Create collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}