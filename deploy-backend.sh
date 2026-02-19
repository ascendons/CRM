#!/bin/bash

# Backend Deployment Script for Elastic Beanstalk
# Usage: ./deploy-backend.sh

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║       🚀 Backend Deployment Script                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Add EB CLI to PATH
export PATH="$HOME/Library/Python/3.11/bin:$PATH"

# Navigate to backend directory
cd "$(dirname "$0")/backend"

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
echo "🔨 Building and Deploying Backend..."
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

# Test the API
echo "Testing API health endpoint..."
RESPONSE=$(curl -s https://api.ascendons.com/api/v1/actuator/health)

if echo "$RESPONSE" | grep -q "UP"; then
    echo "✅ API is healthy: $RESPONSE"
else
    echo "⚠️  API health check returned: $RESPONSE"
    echo "💡 Check logs with: eb logs"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backend URL:  https://api.ascendons.com/api/v1"
echo "📝 View logs:    eb logs"
echo "📊 Status:       eb status"
echo "🔄 Restart:      eb restart"
echo ""
echo "🎉 Done!"
echo ""
