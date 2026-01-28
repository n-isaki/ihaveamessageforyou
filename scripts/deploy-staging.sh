#!/bin/bash

# Deploy to Staging
# Usage: ./scripts/deploy-staging.sh

set -e

echo "🚀 Deploying to STAGING..."
echo ""

# Check if on dev branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  Warning: You're not on the 'dev' branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build
echo "📦 Building..."
npm run build:all

# Deploy to staging
echo "🌐 Deploying to Firebase Staging..."
firebase deploy --only hosting:staging

echo ""
echo "✅ Staging deployment complete!"
echo "🔗 URL: https://gift-shop-app-staging.web.app"
echo ""
echo "💡 Test your changes, then merge to 'main' and deploy to production when ready."
