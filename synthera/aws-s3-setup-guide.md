# AWS S3 Setup Guide for Synthera

## ☁️ AWS Account Setup

### Step 1: Create AWS Account
1. Go to [AWS.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Complete registration and billing setup
4. Verify your phone number and email

### Step 2: Access AWS Console
1. Sign in to [AWS Console](https://console.aws.amazon.com)
2. Select your preferred region (e.g., us-east-1)

---

## 🗄️ S3 Bucket Creation

### Step 1: Create S3 Bucket
1. Navigate to S3 service in AWS Console
2. Click "Create bucket"
3. Bucket settings:
   - **Bucket name**: `synthera-videos-[random-string]` (must be globally unique)
   - **Region**: Choose same region as your app deployment
   - **Object Ownership**: ACLs disabled (recommended)
   - **Block Public Access**: Keep enabled (we'll use presigned URLs)
   - **Bucket Versioning**: Enable (recommended)
   - **Encryption**: Enable with SSE-S3
4. Click "Create bucket"

### Step 2: Configure CORS
1. Go to your bucket → "Permissions" tab
2. Scroll to "Cross-origin resource sharing (CORS)"
3. Click "Edit" and add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 3: Create Folder Structure
Create these folders in your bucket:
- `videos/` - For video files
- `thumbnails/` - For video thumbnails
- `temp/` - For temporary uploads

---

## 👤 IAM User Setup

### Step 1: Create IAM User
1. Go to IAM service in AWS Console
2. Click "Users" → "Add users"
3. User name: `synthera-s3-user`
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"

### Step 2: Attach Policies
1. Choose "Attach existing policies directly"
2. Search for and select: `AmazonS3FullAccess`
   - For production, use custom policy (see below)
3. Click "Next" → "Create user"

### Step 3: Save Access Keys
1. Copy the Access Key ID and Secret Access Key
2. Store them securely (you won't see the secret key again)

### Custom S3 Policy (Recommended for Production):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:PutObjectAcl",
        "s3:GetObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

### Environment Variables:
```env
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

---

## 🔧 CloudFront Setup (Optional but Recommended)

### Step 1: Create CloudFront Distribution
1. Go to CloudFront service
2. Click "Create distribution"
3. Origin settings:
   - **Origin domain**: Select your S3 bucket
   - **Name**: Auto-filled
   - **Origin access**: Origin access control settings
   - **Create control setting**: Create new OAC

### Step 2: Configure Distribution
1. Default cache behavior:
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy**: CachingOptimized
2. Settings:
   - **Price class**: Use all edge locations (best performance)
   - **Alternate domain name**: your-domain.com (if using custom domain)
3. Click "Create distribution"

### Step 3: Update S3 Bucket Policy
After CloudFront is created, update your S3 bucket policy to only allow CloudFront access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::your-account-id:distribution/your-distribution-id"
        }
      }
    }
  ]
}
```

---

## 🧪 Testing S3 Setup

### Step 1: Test Upload
1. Update your `.env.local` with S3 credentials
2. Start your development server:
   ```bash
   npm run dev
   ```
3. Go to `/upload` and try uploading a video
4. Check your S3 bucket for the uploaded file

### Step 2: Test File Access
1. Upload a video through your app
2. Try accessing the video URL
3. Verify thumbnails are generated and stored

---

## 🚀 Production Considerations

### 1. Security
- Use least privilege IAM policies
- Enable S3 bucket encryption
- Use presigned URLs for temporary access
- Implement proper access controls

### 2. Performance
- Use CloudFront for global distribution
- Enable transfer acceleration
- Optimize video formats and compression
- Implement progressive video loading

### 3. Cost Optimization
- Use S3 Intelligent Tiering
- Set up lifecycle policies for old content
- Monitor storage and transfer costs
- Consider S3 Storage Classes (IA, Glacier)

### 4. Backup & Recovery
- Enable S3 Cross-Region Replication
- Set up automated backups
- Test restore procedures
- Document recovery processes

---

## 📊 Monitoring & Logging

### CloudWatch Metrics
1. Enable CloudWatch for S3
2. Monitor key metrics:
   - Storage size
   - Request rates
   - Error rates
   - Data transfer

### S3 Access Logging
1. Enable S3 access logging
2. Store logs in separate bucket
3. Analyze access patterns
4. Monitor for suspicious activity

---

## 💰 Cost Management

### Storage Costs
- **Standard**: ~$0.023/GB/month
- **Intelligent Tiering**: ~$0.0125/GB/month (for infrequent access)
- **Glacier**: ~$0.004/GB/month (for archival)

### Transfer Costs
- **CloudFront**: ~$0.085/GB (first 10TB)
- **Direct S3**: ~$0.09/GB
- **Free tier**: 15GB transfer out per month

### Optimization Tips
1. Compress videos before upload
2. Use appropriate video formats (H.264, VP9)
3. Implement CDN caching
4. Archive old content to Glacier

---

## 🔄 Alternative: Cloudflare R2

If you prefer Cloudflare R2 over AWS S3:

### Benefits:
- S3-compatible API
- No egress fees
- Integrated with Cloudflare CDN
- Simpler pricing

### Setup:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 Object Storage
3. Create bucket: `synthera-videos`
4. Generate R2 API token
5. Use S3-compatible endpoints

### Environment Variables:
```env
AWS_ACCESS_KEY_ID="your-r2-access-key"
AWS_SECRET_ACCESS_KEY="your-r2-secret-key"
AWS_REGION="auto"
AWS_S3_BUCKET="synthera-videos"
AWS_ENDPOINT_URL="https://your-account-id.r2.cloudflarestorage.com"
```

---

## ⚠️ Common Issues

### "Access Denied" Error
- Check IAM user permissions
- Verify bucket policy allows access
- Ensure credentials are correct

### CORS Errors
- Verify CORS configuration in S3
- Check allowed origins and methods
- Ensure preflight requests are handled

### Slow Upload/Download
- Check your internet connection
- Consider using CloudFront
- Optimize file sizes before upload

### "Bucket does not exist" Error
- Verify bucket name is correct
- Check region configuration
- Ensure bucket exists in specified region

---

## 🔄 Next Steps

After setting up S3:
1. Test video upload and playback
2. Configure video processing pipeline
3. Set up automated thumbnail generation
4. Implement content moderation
5. Add video analytics tracking
6. Set up automated backups