# Vercel Deployment Guide for Synthera

## 🚀 Pre-Deployment Checklist

### ✅ Required Setup Complete:
- [ ] PostgreSQL database configured
- [ ] OAuth providers (Google, GitHub, Discord) set up
- [ ] Stripe payment integration configured
- [ ] AWS S3 or Cloudflare R2 for file storage
- [ ] All environment variables collected
- [ ] Build errors fixed

---

## 📦 Prepare for Deployment

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Create Production Environment File
Copy your environment variables to a production file:

```bash
cp .env.production.template .env.production
```

Fill in all the values you collected from the setup guides.

---

## 🗄️ Database Setup

### Step 1: Create Vercel Postgres Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Database name: `synthera-db`
5. Region: Choose closest to your users
6. Click "Create"

### Step 2: Get Database URL
1. Go to your database → Settings → Environment Variables
2. Copy the `DATABASE_URL`
3. Update your environment files

### Step 3: Run Database Migrations
```bash
# Set up the database schema
npx prisma db push

# Optional: Seed with sample data
npm run db:seed
```

---

## 🌍 Deploy to Vercel

### Method 1: CLI Deployment (Recommended)

```bash
# Deploy to production
vercel --prod
```

Follow the prompts:
- Set up and deploy? `Y`
- Which scope? Select your account
- Link to existing project? `N` (for new project)
- What's your project's name? `synthera`
- In which directory is your code located? `./`

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

---

## ⚙️ Environment Variables Setup

### Step 1: Add Environment Variables in Vercel
1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add all variables from your `.env.production` file:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.vercel.app

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id  
GITHUB_CLIENT_SECRET=your-github-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Environment
NODE_ENV=production
```

### Step 2: Redeploy
After adding environment variables:
```bash
vercel --prod
```

---

## 🌐 Custom Domain Setup

### Step 1: Purchase Domain (Optional)
- Use Vercel Domains, Namecheap, GoDaddy, etc.
- Recommended: Get a `.com` domain

### Step 2: Add Domain in Vercel
1. Go to your project → Settings → Domains
2. Add your custom domain: `yourdomain.com`
3. Follow DNS configuration instructions

### Step 3: Update OAuth Redirects
Update all OAuth providers with your new domain:
- Google: Add `https://yourdomain.com/api/auth/callback/google`
- GitHub: Update to `https://yourdomain.com/api/auth/callback/github`
- Discord: Add `https://yourdomain.com/api/auth/callback/discord`

### Step 4: Update Environment Variables
```env
NEXTAUTH_URL=https://yourdomain.com
```

### Step 5: Update Stripe Webhooks
Update webhook URL to: `https://yourdomain.com/api/webhooks/stripe`

---

## 🔧 Build Configuration

### vercel.json Configuration
Create `vercel.json` in your project root:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Next.js Configuration
Ensure your `next.config.js` is optimized:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
```

---

## 🧪 Testing Production Deployment

### Step 1: Smoke Tests
1. Visit your deployed URL
2. Test user registration/login
3. Upload a test video
4. Try purchasing a license
5. Check all major pages load

### Step 2: Payment Testing
1. Use Stripe test mode initially
2. Test each license type purchase
3. Verify webhook delivery
4. Check database records

### Step 3: Performance Testing
1. Check page load speeds
2. Test video upload/playback
3. Monitor Vercel Analytics
4. Check Core Web Vitals

---

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor page views and performance
3. Track Core Web Vitals

### Error Tracking
Consider adding error tracking:
```bash
npm install @sentry/nextjs
```

### Uptime Monitoring
Set up monitoring with:
- UptimeRobot
- Pingdom  
- StatusCake

---

## 🔒 Security Checklist

### Environment Variables
- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials in code
- [ ] Production keys are being used

### API Security
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Authentication checks in place

### Database Security
- [ ] Database connections are encrypted
- [ ] No sensitive data in logs
- [ ] Proper access controls configured

---

## 🚀 Go Live Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Performance optimized
- [ ] SEO metadata added
- [ ] Error pages customized
- [ ] Analytics tracking set up

### Launch Day
- [ ] Switch Stripe to live mode
- [ ] Update OAuth to production mode
- [ ] Final deployment with live keys
- [ ] Monitor error logs
- [ ] Test all critical paths

### Post-Launch
- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] Verify payment processing
- [ ] Monitor user feedback
- [ ] Set up automated backups

---

## 📈 Performance Optimization

### Image Optimization
```javascript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={videoThumbnail}
  alt="Video thumbnail"
  width={300}
  height={200}
  priority={false}
/>
```

### Video Optimization
- Use adaptive bitrate streaming
- Implement lazy loading
- Add video compression
- Use CDN for video delivery

### Caching Strategy
```javascript
// Add revalidation to API routes
export const revalidate = 60 // seconds
```

---

## ⚠️ Common Deployment Issues

### Build Failures
- Check for TypeScript errors
- Verify all dependencies are installed
- Review build logs in Vercel dashboard

### Environment Variable Issues
- Ensure all required variables are set
- Check for typos in variable names
- Verify sensitive data is properly escaped

### Database Connection Issues
- Check DATABASE_URL format
- Verify database is accessible from Vercel
- Test connection locally first

### OAuth Redirect Issues
- Update all provider redirect URLs
- Ensure NEXTAUTH_URL is correct
- Check for http vs https mismatches

---

## 🔄 Continuous Deployment

### Automatic Deployments
1. Connect GitHub repository to Vercel
2. Enable automatic deployments on push to main
3. Set up preview deployments for pull requests

### Branch Strategy
- `main` → Production deployment
- `staging` → Staging environment
- `develop` → Development environment

### Deployment Hooks
```bash
# Add post-deployment hooks
vercel env add DEPLOYMENT_HOOK your-webhook-url
```

---

## 📋 Maintenance

### Regular Tasks
- Monitor error rates
- Update dependencies
- Review performance metrics
- Backup database regularly
- Rotate API keys periodically

### Scaling Considerations
- Monitor Vercel function usage
- Consider database scaling
- Optimize for Core Web Vitals
- Plan for traffic spikes

---

## 🎉 Congratulations!

Your Synthera platform is now live! 🚀

Next steps:
1. Share with early users
2. Gather feedback
3. Iterate and improve
4. Scale as needed

Remember to monitor your application closely in the first few days after launch.