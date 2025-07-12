import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToS3, generateVideoKey } from '@/lib/storage'
import { 
  validateVideoFile, 
  getVideoMetadata, 
  generateThumbnail,
  VideoMetadata 
} from '@/lib/video-processing'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a creator
    if (session.user.type === 'BROWSER') {
      return NextResponse.json(
        { error: 'Only creators can upload videos' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const aiModel = formData.get('aiModel') as string
    const prompts = JSON.parse(formData.get('prompts') as string || '[]')
    const tags = JSON.parse(formData.get('tags') as string || '[]')
    const category = formData.get('category') as string
    const style = formData.get('style') as string
    const personalLicense = parseFloat(formData.get('personalLicense') as string || '0')
    const commercialLicense = parseFloat(formData.get('commercialLicense') as string || '0')
    const extendedLicense = parseFloat(formData.get('extendedLicense') as string || '0')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!title || !description || !aiModel || !category || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert File to buffer and create multer-like object
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const multerFile = {
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
      buffer
    } as Express.Multer.File

    // Validate video file
    const validation = validateVideoFile(multerFile, {
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create temporary directory
    const tempDir = join(process.cwd(), 'tmp')
    await mkdir(tempDir, { recursive: true })

    // Save file temporarily for processing
    const tempFilePath = join(tempDir, `${Date.now()}-${file.name}`)
    await writeFile(tempFilePath, buffer)

    let videoMetadata: VideoMetadata
    let thumbnailUrl: string
    let videoUrl: string

    try {
      // Get video metadata
      videoMetadata = await getVideoMetadata(tempFilePath)

      // Upload original video to S3
      const videoKey = generateVideoKey(session.user.id, file.name)
      const uploadResult = await uploadToS3(buffer, videoKey, file.type)
      videoUrl = uploadResult.publicUrl

      // Create video record first to get ID
      const video = await prisma.video.create({
        data: {
          title,
          description,
          thumbnailUrl: '', // Will update after thumbnail generation
          videoUrl,
          duration: Math.round(videoMetadata.duration),
          fileSize: file.size,
          resolution: `${videoMetadata.width}x${videoMetadata.height}`,
          creatorId: session.user.id,
          aiModel,
          prompts,
          tags,
          category: category as 'CINEMATIC' | 'ABSTRACT' | 'PHOTOREALISTIC' | 'ANIMATION' | 'MOTION_GRAPHICS' | 'EXPERIMENTAL' | 'NATURE' | 'ARCHITECTURE' | 'FASHION' | 'TECHNOLOGY',
          style: style as 'CINEMATIC' | 'MINIMALIST' | 'SURREAL' | 'RETRO' | 'FUTURISTIC' | 'ARTISTIC' | 'COMMERCIAL' | 'DOCUMENTARY',
          aspectRatio: `${videoMetadata.width}:${videoMetadata.height}`,
          fps: Math.round(videoMetadata.fps),
          personalLicense: personalLicense > 0 ? personalLicense : null,
          commercialLicense: commercialLicense > 0 ? commercialLicense : null,
          extendedLicense: extendedLicense > 0 ? extendedLicense : null,
          isAvailableForSale: personalLicense > 0 || commercialLicense > 0 || extendedLicense > 0,
        },
      })

      // Generate thumbnail
      thumbnailUrl = await generateThumbnail(tempFilePath, session.user.id, video.id)

      // Update video with thumbnail URL
      const updatedVideo = await prisma.video.update({
        where: { id: video.id },
        data: { thumbnailUrl },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      })

      // Update creator stats
      await prisma.creator.update({
        where: { userId: session.user.id },
        data: {
          totalVideos: { increment: 1 },
        },
      }).catch(() => {
        // Creator profile might not exist yet, ignore error
      })

      // Clean up temp file
      await unlink(tempFilePath).catch(() => {})

      return NextResponse.json({
        message: 'Video uploaded successfully',
        video: updatedVideo,
      })

    } catch (error) {
      // Clean up temp file on error
      await unlink(tempFilePath).catch(() => {})
      
      console.error('Video processing error:', error)
      return NextResponse.json(
        { error: 'Failed to process video' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get upload progress (for future WebSocket implementation)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID required' },
      { status: 400 }
    )
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ video })

  } catch (error) {
    console.error('Get video error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}