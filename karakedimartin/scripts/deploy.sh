#!/bin/bash

# Deploy karakedimartin to Production
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Deploying karakedimartin..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the karakedimartin directory?"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Make sure to set environment variables in Vercel/Firebase"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build
echo "📦 Building Next.js app..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "Option 1: Vercel (Recommended)"
echo "  1. Push to GitHub"
echo "  2. Vercel will auto-deploy"
echo "  3. Or run: vercel --prod"
echo ""
echo "Option 2: Firebase Hosting"
echo "  1. Run: firebase deploy --only hosting"
echo ""
echo "Option 3: Manual"
echo "  1. Run: npm start"
echo "  2. Test locally"
echo "  3. Deploy manually"
