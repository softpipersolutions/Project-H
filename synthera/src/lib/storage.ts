import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET!

export interface UploadResult {
  key: string
  url: string
  publicUrl: string
}

// Upload file to S3
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'private', // Files are private by default
  })

  await s3Client.send(command)

  const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  
  return {
    key,
    url: publicUrl,
    publicUrl,
  }
}

// Generate presigned URL for temporary access
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Delete file from S3
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

// Generate unique file keys
export function generateVideoKey(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  return `videos/${userId}/${timestamp}.${extension}`
}

export function generateThumbnailKey(userId: string, videoId: string): string {
  const timestamp = Date.now()
  return `thumbnails/${userId}/${videoId}-${timestamp}.jpg`
}

// Get file size from S3
export async function getFileSize(key: string): Promise<number> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)
  return response.ContentLength || 0
}

// Check if file exists in S3
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    await s3Client.send(command)
    return true
  } catch {
    return false
  }
}