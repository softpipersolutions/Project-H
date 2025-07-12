# Synthera Deployment Guide

This guide will walk you through setting up all required API keys and deploying Synthera to production.

## 🗄️ Phase 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub account

2. **Create Database**
   - In Vercel dashboard, click "Storage"
   - Click "Create Database" → "Postgres"
   - Choose a database name: `synthera-db`
   - Select region closest to your users
   - Click "Create"

3. **Get Connection String**
   - After creation, go to "Settings" tab
   - Copy the `DATABASE_URL` from "Environment Variables"
   - It will look like: `postgresql://user:pass@host:5432/dbname?sslmode=require`

### Option B: Supabase (Alternative)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get database URL from Settings → Database
4. Enable Row Level Security if needed

## 🔐 Phase 2: Authentication Setup

### Google OAuth Setup

1. **Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project: "Synthera"

2. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable "Google+ API"

3. **Create OAuth Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Synthera OAuth"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

4. **Get Credentials**
   - Copy Client ID and Client Secret
   - Add to environment variables

### GitHub OAuth Setup

1. **GitHub Settings**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"

2. **App Configuration**
   - Application name: "Synthera"
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

3. **Get Credentials**
   - Copy Client ID and generate Client Secret

### Discord OAuth Setup

1. **Discord Developer Portal**
   - Go to [discord.com/developers/applications](https://discord.com/developers/applications)
   - Click "New Application"
   - Name: "Synthera"

2. **OAuth2 Configuration**
   - Go to OAuth2 → General
   - Copy Client ID and Client Secret
   - Add Redirects: `https://yourdomain.com/api/auth/callback/discord`

## 💳 Phase 3: Stripe Payment Setup

### 1. Create Stripe Account
- Go to [stripe.com](https://stripe.com)
- Create account and complete verification

### 2. Get API Keys
- Dashboard → Developers → API Keys
- Copy Publishable Key and Secret Key
- **Start with Test Keys**, switch to Live later

### 3. Set Up Webhooks
- Dashboard → Developers → Webhooks
- Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Select events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4. Configure Products (Optional)
- Dashboard → Products
- Create subscription plans if needed

## 🗃️ Phase 4: File Storage Setup

### Option A: AWS S3

1. **Create AWS Account**
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Create account

2. **Create S3 Bucket**
   - S3 Console → Create Bucket
   - Name: `synthera-videos-[random]`
   - Region: Same as your app deployment
   - Block public access: OFF (we'll use presigned URLs)

3. **Create IAM User**
   - IAM Console → Users → Add User
   - Username: `synthera-s3-user`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)

4. **Configure CORS**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### Option B: Cloudflare R2 (Alternative)

1. **Cloudflare Account**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Create account

2. **Create R2 Bucket**
   - Dashboard → R2 Object Storage
   - Create bucket: `synthera-videos`

3. **Get API Credentials**
   - R2 → Manage R2 API tokens
   - Create token with edit permissions

## 🔑 Phase 5: Environment Variables

### 1. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 2. Update Environment Variables

Create `.env.production` file:

```env
# Database
DATABASE_URL="your-postgres-connection-string"

# NextAuth.js
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..." # Use test keys initially
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3 / Cloudflare R2
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Environment
NODE_ENV="production"
```

## 🚀 Phase 6: Deployment

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.production`

5. **Set up Database**
   ```bash
   # After deployment, run migrations
   npx prisma migrate deploy
   ```

### Option B: Manual Deploy to Vercel

1. **GitHub Integration**
   - Push code to GitHub
   - Connect repository in Vercel dashboard
   - Auto-deployment on push

2. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## 🌐 Phase 7: Custom Domain (Optional)

### 1. Purchase Domain
- Use Namecheap, GoDaddy, or Vercel Domains

### 2. Configure DNS
- Add domain in Vercel dashboard
- Update nameservers or add CNAME records

### 3. Update OAuth Redirects
- Update all OAuth app configurations with new domain
- Update NEXTAUTH_URL environment variable

## ✅ Phase 8: Testing & Verification

### 1. Database Connection
- Verify Prisma can connect
- Check tables are created
- Test data operations

### 2. Authentication
- Test Google, GitHub, Discord login
- Verify user creation
- Check session management

### 3. Payments
- Test Stripe payment flow
- Verify webhook delivery
- Check purchase records

### 4. File Upload
- Test video upload
- Verify S3 storage
- Check file access

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check firewall settings

2. **OAuth Errors**
   - Verify redirect URLs match exactly
   - Check client IDs and secrets
   - Ensure APIs are enabled

3. **Stripe Webhooks Not Working**
   - Check webhook URL is accessible
   - Verify webhook secret
   - Check event selection

4. **File Upload Issues**
   - Verify S3 credentials
   - Check bucket permissions
   - Test CORS configuration

### Support Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

## 📋 Deployment Checklist

- [ ] Database setup and connection tested
- [ ] OAuth providers configured for all environments
- [ ] Stripe integration and webhooks working
- [ ] File storage configured and tested
- [ ] Environment variables set in production
- [ ] TypeScript/ESLint errors resolved
- [ ] Application deployed successfully
- [ ] Custom domain configured (if applicable)
- [ ] All functionality tested in production
- [ ] Monitoring and error tracking set up

---

**Next Steps:** Follow this guide step by step, and test each integration before moving to the next phase. The deployment process typically takes 4-6 hours for first-time setup.