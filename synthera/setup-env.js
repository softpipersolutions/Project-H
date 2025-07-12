#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');

console.log('🚀 Synthera Environment Setup Helper\n');

// Generate a secure NextAuth secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64');

console.log('✅ Generated NextAuth Secret');

// Template for production environment
const envTemplate = `# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/synthera?schema=public"

# NextAuth.js (Required)
NEXTAUTH_SECRET="${nextAuthSecret}"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth Providers (Required for authentication)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Stripe (Required for payments)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# File Storage - AWS S3 (Required for video uploads)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET=""

# Optional - Redis for caching
REDIS_URL=""

# File Upload Settings
MAX_FILE_SIZE="100MB"
ALLOWED_VIDEO_FORMATS="mp4,mov,avi,webm"

# Environment
NODE_ENV="production"
`;

// Write the template
fs.writeFileSync('.env.production.template', envTemplate);
console.log('✅ Created .env.production.template');

// Update the existing .env.local with the new secret
let envLocal = fs.readFileSync('.env.local', 'utf8');
envLocal = envLocal.replace(/NEXTAUTH_SECRET=".*"/, `NEXTAUTH_SECRET="${nextAuthSecret}"`);
fs.writeFileSync('.env.local', envLocal);
console.log('✅ Updated .env.local with new NextAuth secret');

console.log(`
🔥 Next Steps:

1. DATABASE SETUP:
   📝 Go to https://vercel.com/new/postgres
   📝 Create a new Postgres database
   📝 Copy the DATABASE_URL to your environment files

2. OAUTH SETUP:
   📝 Google: https://console.cloud.google.com
   📝 GitHub: https://github.com/settings/developers
   📝 Discord: https://discord.com/developers/applications

3. STRIPE SETUP:
   📝 Go to https://stripe.com
   📝 Get your API keys from the dashboard
   📝 Set up webhooks pointing to /api/webhooks/stripe

4. FILE STORAGE:
   📝 AWS S3: https://aws.amazon.com/s3
   📝 Create bucket and IAM user with S3 permissions

5. DEPLOYMENT:
   📝 Copy values from .env.production.template
   📝 Deploy to Vercel: vercel --prod

Your NextAuth Secret: ${nextAuthSecret}
(This has been added to your .env.local file)

⚠️  IMPORTANT: Keep your secrets secure and never commit them to git!
`);