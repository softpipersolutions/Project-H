import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { uploadToS3, generateThumbnailKey } from './storage'

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  size: number
}

export interface ProcessingResult {
  metadata: VideoMetadata
  thumbnailUrl: string
  processedVideoUrl?: string
}

// Get video metadata
export async function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video')
      if (!videoStream) {
        reject(new Error('No video stream found'))
        return
      }

      const duration = metadata.format.duration || 0
      const width = videoStream.width || 0
      const height = videoStream.height || 0
      const fps = eval(videoStream.r_frame_rate || '0') || 30
      const bitrate = parseInt(String(metadata.format.bit_rate || '0'))
      const codec = videoStream.codec_name || 'unknown'
      const size = parseInt(String(metadata.format.size || '0'))

      resolve({
        duration,
        width,
        height,
        fps,
        bitrate,
        codec,
        size,
      })
    })
  })
}

// Generate thumbnail from video
export async function generateThumbnail(
  inputPath: string,
  userId: string,
  videoId: string,
  timeOffset = '00:00:02'
): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp')
  await fs.mkdir(tempDir, { recursive: true })
  
  const tempThumbnailPath = path.join(tempDir, `thumbnail-${videoId}-${Date.now()}.jpg`)

  return new Promise(async (resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timeOffset],
        filename: path.basename(tempThumbnailPath),
        folder: path.dirname(tempThumbnailPath),
        size: '1280x720',
      })
      .on('end', async () => {
        try {
          // Optimize thumbnail with Sharp
          const optimizedBuffer = await sharp(tempThumbnailPath)
            .jpeg({ quality: 85, progressive: true })
            .resize(1280, 720, { 
              fit: 'cover',
              position: 'center'
            })
            .toBuffer()

          // Upload to S3
          const thumbnailKey = generateThumbnailKey(userId, videoId)
          const result = await uploadToS3(optimizedBuffer, thumbnailKey, 'image/jpeg')

          // Clean up temp file
          await fs.unlink(tempThumbnailPath).catch(() => {})

          resolve(result.publicUrl)
        } catch (error) {
          // Clean up temp file on error
          await fs.unlink(tempThumbnailPath).catch(() => {})
          reject(error)
        }
      })
      .on('error', async (error) => {
        // Clean up temp file on error
        await fs.unlink(tempThumbnailPath).catch(() => {})
        reject(error)
      })
  })
}

// Convert video to optimized format
export async function optimizeVideo(
  inputPath: string,
  outputPath: string,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: 'low' | 'medium' | 'high'
    format?: 'mp4' | 'webm'
  } = {}
): Promise<void> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 'medium',
    format = 'mp4'
  } = options

  const qualitySettings = {
    low: { crf: 28, preset: 'fast' },
    medium: { crf: 23, preset: 'medium' },
    high: { crf: 18, preset: 'slow' }
  }

  const { crf, preset } = qualitySettings[quality]

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        `-crf ${crf}`,
        `-preset ${preset}`,
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart', // Enable progressive download
        `-vf scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
      ])

    if (format === 'webm') {
      command = command.outputOptions([
        '-c:v libvpx-vp9',
        '-c:a libopus',
      ])
    }

    command
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run()
  })
}

// Validate video file
export function validateVideoFile(
  file: Express.Multer.File,
  options: {
    maxSize?: number // in bytes
    allowedFormats?: string[]
    maxDuration?: number // in seconds
  } = {}
): { isValid: boolean; error?: string } {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedFormats = ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
    }
  }

  // Check file format
  const extension = file.originalname.split('.').pop()?.toLowerCase()
  if (!extension || !allowedFormats.includes(extension)) {
    return {
      isValid: false,
      error: `File format not supported. Allowed formats: ${allowedFormats.join(', ')}`
    }
  }

  // Check MIME type
  if (!file.mimetype.startsWith('video/')) {
    return {
      isValid: false,
      error: 'File is not a valid video'
    }
  }

  return { isValid: true }
}

// Get video duration without full metadata
export async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      const duration = metadata.format.duration || 0
      resolve(duration)
    })
  })
}

// Extract multiple thumbnails for preview
export async function generatePreviewThumbnails(
  inputPath: string,
  userId: string,
  videoId: string,
  count = 5
): Promise<string[]> {
  const metadata = await getVideoMetadata(inputPath)
  const duration = metadata.duration
  const interval = duration / (count + 1)

  const thumbnailUrls: string[] = []

  for (let i = 1; i <= count; i++) {
    const timeOffset = (interval * i).toFixed(2)
    try {
      const thumbnailUrl = await generateThumbnail(
        inputPath,
        userId,
        `${videoId}-preview-${i}`,
        timeOffset
      )
      thumbnailUrls.push(thumbnailUrl)
    } catch (error) {
      console.error(`Failed to generate thumbnail ${i}:`, error)
    }
  }

  return thumbnailUrls
}

// Clean up temporary files
export async function cleanupTempFiles(directory: string): Promise<void> {
  try {
    const files = await fs.readdir(directory)
    const deletePromises = files.map(file => 
      fs.unlink(path.join(directory, file)).catch(() => {})
    )
    await Promise.all(deletePromises)
  } catch {
    // Directory doesn't exist or other error, ignore
  }
}