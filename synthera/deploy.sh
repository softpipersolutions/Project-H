#!/bin/bash

# Synthera Deployment Script
# This script helps automate the deployment process

set -e

echo "🚀 Synthera Deployment Helper"
echo "================================"
echo ""

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
else
    echo "✅ Vercel CLI is installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it first."
    echo "   You can copy from .env.production.template"
    exit 1
fi

echo "✅ Environment file found"

# Run setup script
echo ""
echo "🔧 Running environment setup..."
node setup-env.js

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for build errors
echo ""
echo "🔨 Testing build..."
if npm run build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors before deploying."
    echo "   Check the error messages above."
    exit 1
fi

# Check database schema
echo ""
echo "🗄️ Checking database schema..."
if npx prisma generate; then
    echo "✅ Prisma schema generated"
else
    echo "❌ Prisma schema generation failed"
    exit 1
fi

# Pre-deployment checklist
echo ""
echo "📋 Pre-deployment checklist:"
echo ""
echo "Before deploying, make sure you have:"
echo "[ ] ✅ Set up your database (Vercel Postgres recommended)"
echo "[ ] ✅ Configured OAuth providers (Google, GitHub, Discord)"
echo "[ ] ✅ Set up Stripe payment integration"
echo "[ ] ✅ Configured file storage (AWS S3 or Cloudflare R2)"
echo "[ ] ✅ Updated all environment variables"
echo ""

read -p "Have you completed all the above steps? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo ""
    echo "📚 Please complete the setup first:"
    echo "   1. Follow the DEPLOYMENT_GUIDE.md"
    echo "   2. Set up all required services"
    echo "   3. Update your environment variables"
    echo "   4. Run this script again"
    exit 0
fi

# Ask for deployment type
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Deployment options:"
echo "1. Deploy to Vercel (recommended)"
echo "2. Just run local development server"
echo "3. Exit"
echo ""

read -p "Choose an option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🌍 Deploying to Vercel..."
        echo ""
        echo "⚠️  Make sure to:"
        echo "   1. Set environment variables in Vercel dashboard"
        echo "   2. Update OAuth redirect URLs to your production domain"
        echo "   3. Update Stripe webhook URLs"
        echo ""
        
        read -p "Continue with deployment? (y/N): " deploy_confirm
        
        if [[ $deploy_confirm == [yY] || $deploy_confirm == [yY][eE][sS] ]]; then
            if vercel --prod; then
                echo ""
                echo "🎉 Deployment successful!"
                echo ""
                echo "📋 Post-deployment checklist:"
                echo "[ ] Set environment variables in Vercel dashboard"
                echo "[ ] Update OAuth redirect URLs"
                echo "[ ] Update Stripe webhook URLs"
                echo "[ ] Test all functionality"
                echo ""
                echo "📚 See DEPLOYMENT_CHECKLIST.md for detailed steps"
            else
                echo "❌ Deployment failed. Check the error messages above."
            fi
        else
            echo "Deployment cancelled."
        fi
        ;;
    2)
        echo ""
        echo "🏃 Starting development server..."
        npm run dev
        ;;
    3)
        echo "Goodbye! 👋"
        exit 0
        ;;
    *)
        echo "Invalid option. Please choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
echo "🎯 Next steps:"
echo "   1. Visit your deployed application"
echo "   2. Test all major functionality"
echo "   3. Monitor for any errors"
echo "   4. Share with your first users!"
echo ""
echo "📖 Need help? Check out:"
echo "   - DEPLOYMENT_GUIDE.md"
echo "   - DEPLOYMENT_CHECKLIST.md"
echo "   - Individual setup guides for each service"
echo ""
echo "🚀 Happy launching!"