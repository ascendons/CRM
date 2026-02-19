#!/bin/bash

# Frontend Deployment Script for Elastic Beanstalk
# Usage: ./deploy-frontend.sh

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║       🎨 Frontend Deployment Script                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Add EB CLI to PATH
export PATH="$HOME/Library/Python/3.11/bin:$PATH"

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

echo "📍 Current directory: $(pwd)"
echo ""

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
        git push origin master
        echo "✅ Changes committed and pushed"
    else
        echo "⏭️  Skipping commit"
    fi
else
    echo "✅ No uncommitted changes"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Building and Deploying Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Deploy to Elastic Beanstalk
echo "📦 Deploying to Elastic Beanstalk..."
eb deploy --timeout 20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check environment status
echo "📊 Environment Status:"
eb status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Testing Deployment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait a moment for deployment to settle
sleep 5

# Test the frontend
echo "Testing frontend health endpoint..."
RESPONSE=$(curl -s https://crm.ascendons.com/api/ping)

if echo "$RESPONSE" | grep -q "crm-frontend"; then
    echo "✅ Frontend is healthy: $RESPONSE"
else
    echo "⚠️  Frontend health check returned: $RESPONSE"
    echo "💡 Check logs with: eb logs"
fi

echo ""
echo "Testing login page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://crm.ascendons.com/login)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login page is accessible (HTTP $HTTP_CODE)"
else
    echo "⚠️  Login page returned HTTP $HTTP_CODE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Frontend URL:  https://crm.ascendons.com"
echo "📝 View logs:     eb logs"
echo "📊 Status:        eb status"
echo "🔄 Restart:       eb restart"
echo ""
echo "🎉 Done!"
echo ""
