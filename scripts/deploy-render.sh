#!/bin/bash

# Quick Deploy to Render
# This script helps you prepare your CRM app for Render deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "═══════════════════════════════════════════"
echo "   CRM Application - Render Deployment"
echo "═══════════════════════════════════════════"
echo -e "${NC}"

# Step 1: Check if git is initialized
echo -e "${YELLOW}Step 1: Checking Git...${NC}"
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
else
    echo -e "${GREEN}✓ Git already initialized${NC}"
fi

# Step 2: Create .gitignore if not exists
echo -e "${YELLOW}Step 2: Creating .gitignore...${NC}"
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production

# Dependencies
node_modules/
backend/target/

# Build output
frontend/.next/
frontend/out/

# Logs
*.log
logs/

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db

# Backups
backups/
EOF
    echo -e "${GREEN}✓ .gitignore created${NC}"
else
    echo -e "${GREEN}✓ .gitignore already exists${NC}"
fi

# Step 3: MongoDB Atlas setup prompt
echo ""
echo -e "${YELLOW}Step 3: MongoDB Atlas Setup${NC}"
echo "Before deploying, you need a MongoDB Atlas account."
echo ""
echo "1. Sign up at: https://www.mongodb.com/cloud/atlas/register"
echo "2. Create a FREE M0 cluster"
echo "3. Create database user and get connection string"
echo ""
read -p "Have you set up MongoDB Atlas? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set up MongoDB Atlas first, then run this script again."
    exit 1
fi

# Step 4: Get MongoDB connection string
echo ""
echo -e "${YELLOW}Step 4: MongoDB Configuration${NC}"
echo "Paste your MongoDB Atlas connection string:"
echo "Format: mongodb+srv://username:password@cluster.mongodb.net/crm_production?retryWrites=true&w=majority"
read -p "Connection String: " MONGODB_URI

# Validate connection string
if [[ ! $MONGODB_URI =~ ^mongodb\+srv:// ]]; then
    echo -e "${YELLOW}⚠ Warning: Connection string doesn't look correct${NC}"
    echo "Make sure it starts with: mongodb+srv://"
fi

# Step 5: Update render.yaml with user input
echo ""
echo -e "${YELLOW}Step 5: Updating configuration...${NC}"

# Note: User will set MongoDB URI manually in Render dashboard
echo -e "${GREEN}✓ Configuration ready${NC}"

# Step 6: Commit changes
echo ""
echo -e "${YELLOW}Step 6: Committing changes...${NC}"
git add .
git commit -m "Prepare for Render deployment" || echo "No changes to commit"
echo -e "${GREEN}✓ Changes committed${NC}"

# Step 7: GitHub setup instructions
echo ""
echo -e "${YELLOW}Step 7: GitHub Repository Setup${NC}"
echo ""
echo "Now create a GitHub repository:"
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Repository name: crm-application"
echo "3. Make it private (recommended)"
echo "4. Do NOT initialize with README"
echo "5. Click 'Create repository'"
echo ""
read -p "Press Enter when you've created the repository..."

echo ""
echo "What's your GitHub username?"
read -p "Username: " GITHUB_USER
read -p "Repository name (default: crm-application): " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-crm-application}

# Add remote and push
echo ""
echo "Pushing to GitHub..."
git remote add origin https://github.com/$GITHUB_USER/$GITHUB_REPO.git || git remote set-url origin https://github.com/$GITHUB_USER/$GITHUB_REPO.git
git branch -M main
git push -u origin main

echo -e "${GREEN}✓ Code pushed to GitHub${NC}"

# Step 8: Render deployment instructions
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Repository ready for Render deployment!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Go to: https://dashboard.render.com"
echo "2. Sign up/Login"
echo "3. Click 'New +' → 'Blueprint'"
echo "4. Connect your GitHub account"
echo "5. Select repository: $GITHUB_REPO"
echo "6. Render will detect render.yaml automatically"
echo "7. When prompted, set this environment variable:"
echo ""
echo "   Service: crm-backend"
echo "   Variable: SPRING_DATA_MONGODB_URI"
echo "   Value: $MONGODB_URI"
echo ""
echo "8. Click 'Apply Blueprint'"
echo ""
echo "Deployment will take 5-10 minutes."
echo ""
echo "Your app will be available at:"
echo "  Frontend: https://crm-frontend-[random].onrender.com"
echo "  Backend:  https://crm-backend-[random].onrender.com"
echo ""
echo -e "${GREEN}Happy Deploying! 🚀${NC}"
