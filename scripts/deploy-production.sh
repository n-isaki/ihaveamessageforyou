#!/bin/bash

# Deploy to Production
# Usage: ./scripts/deploy-production.sh

set -e

echo "🚀 Deploying to PRODUCTION..."
echo ""

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the 'main' branch to deploy to production"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Confirm deployment
read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Build
echo "📦 Building..."
npm run build:all

# Deploy Firestore + Storage Rules (shared between staging and production)
echo "📋 Deploying Firestore Rules..."
firebase deploy --only firestore:rules
echo "📋 Deploying Storage Rules..."
firebase deploy --only storage

# Deploy to production
echo "🌐 Deploying to Firebase Production..."
firebase deploy --only hosting:production

echo ""
echo "✅ Production deployment complete!"
echo "🔗 URL: https://gift-shop-app-7bbd3.web.app"
