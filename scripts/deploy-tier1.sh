#!/bin/bash

# Tier 1 Deployment - Interactive Script
# This script guides you through the deployment process

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║       Tier 1 Deployment - Interactive Setup           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
echo ""

# Check AWS CLI
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
    if aws sts get-caller-identity &> /dev/null; then
        echo -e "${GREEN}✅ AWS CLI configured${NC}"
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        echo "   Account: $AWS_ACCOUNT"
    else
        echo -e "${RED}❌ AWS CLI not configured${NC}"
        echo "   Run: aws configure"
        exit 1
    fi
else
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    echo "   Install: curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o 'AWSCLIV2.pkg' && sudo installer -pkg AWSCLIV2.pkg -target /"
    exit 1
fi

# Check EB CLI
if command -v eb &> /dev/null; then
    echo -e "${GREEN}✅ Elastic Beanstalk CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Elastic Beanstalk CLI not installed${NC}"
    echo "   Install: pip install awsebcli"
    read -p "Install now? (y/n): " INSTALL_EB
    if [ "$INSTALL_EB" = "y" ]; then
        pip install awsebcli
    else
        exit 1
    fi
fi

# Check Amplify CLI
if command -v amplify &> /dev/null; then
    echo -e "${GREEN}✅ Amplify CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Amplify CLI not installed${NC}"
    echo "   Install: npm install -g @aws-amplify/cli"
    read -p "Install now? (y/n): " INSTALL_AMP
    if [ "$INSTALL_AMP" = "y" ]; then
        npm install -g @aws-amplify/cli
    else
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo ""

# Get domain
echo -e "${BLUE}Configuration${NC}"
echo ""
read -p "Enter your domain name (e.g., ascendons.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain is required${NC}"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Deployment Configuration:"
echo "═══════════════════════════════════════════════════════════"
echo "Domain:          $DOMAIN"
echo "AWS Account:     $AWS_ACCOUNT"
echo "Region:          us-east-1"
echo "Backend:         Elastic Beanstalk (t3.small)"
echo "Frontend:        AWS Amplify"
echo "Database:        MongoDB Atlas (existing)"
echo "═══════════════════════════════════════════════════════════"
echo ""

read -p "Proceed with deployment? (y/n): " PROCEED
if [ "$PROCEED" != "y" ]; then
    exit 0
fi

# Phase 1: Backend Deployment
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Phase 1: Backend Deployment (Elastic Beanstalk)      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

cd backend

# Check if EB is initialized
if [ ! -d ".elasticbeanstalk" ]; then
    echo -e "${BLUE}Initializing Elastic Beanstalk...${NC}"

    # Create config
    mkdir -p .elasticbeanstalk
    cat > .elasticbeanstalk/config.yml << EOF
branch-defaults:
  master:
    environment: crm-backend-prod
global:
  application_name: crm-backend
  default_platform: Docker running on 64bit Amazon Linux 2
  default_region: us-east-1
  profile: null
  workspace_type: Application
EOF

    echo -e "${GREEN}✅ Elastic Beanstalk initialized${NC}"
else
    echo -e "${GREEN}✅ Elastic Beanstalk already initialized${NC}"
fi

# Check if environment exists
if eb status &> /dev/null; then
    echo -e "${GREEN}✅ Environment already exists${NC}"
    echo "   Environment name: crm-backend-prod"

    read -p "Deploy update to existing environment? (y/n): " DEPLOY_UPDATE
    if [ "$DEPLOY_UPDATE" = "y" ]; then
        echo -e "${BLUE}Deploying update...${NC}"
        eb deploy
        echo -e "${GREEN}✅ Update deployed${NC}"
    fi
else
    echo -e "${BLUE}Creating environment (this takes 5-10 minutes)...${NC}"
    eb create crm-backend-prod \
      --instance-type t3.small \
      --platform docker \
      --region us-east-1 \
      --elb-type application

    echo -e "${GREEN}✅ Environment created${NC}"
fi

# Get backend URL
BACKEND_URL=$(eb status | grep CNAME | awk '{print $2}')
echo ""
echo -e "${GREEN}Backend URL: http://$BACKEND_URL${NC}"
echo ""

# Set environment variables
echo -e "${BLUE}Setting environment variables...${NC}"
echo "   (Using values from application-prod.properties defaults)"

read -p "Update environment variables? (y/n): " UPDATE_ENV
if [ "$UPDATE_ENV" = "y" ]; then
    read -p "Enter SPRING_DATA_MONGODB_URI: " MONGO_URI
    read -p "Enter JWT_SECRET (or press enter to generate): " JWT_SECRET

    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 64)
        echo "   Generated JWT_SECRET: $JWT_SECRET"
    fi

    eb setenv \
      SPRING_DATA_MONGODB_URI="$MONGO_URI" \
      JWT_SECRET="$JWT_SECRET" \
      CORS_ALLOWED_ORIGINS="https://*.$DOMAIN,https://$DOMAIN" \
      SPRING_PROFILES_ACTIVE="prod" \
      PORT="5000"

    echo -e "${GREEN}✅ Environment variables set${NC}"
fi

# Test backend
echo -e "${BLUE}Testing backend...${NC}"
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://$BACKEND_URL/api/v1/actuator/health | grep -q "200"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check pending (may need a few minutes)${NC}"
fi

cd ..

# Phase 2: Subdomain Setup
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Phase 2: Wildcard Subdomain Setup                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

read -p "Setup wildcard subdomains for $DOMAIN? (y/n): " SETUP_SUBDOMAINS
if [ "$SETUP_SUBDOMAINS" = "y" ]; then
    export DOMAIN=$DOMAIN
    cd aws
    ./setup-subdomain-infrastructure.sh
    cd ..
fi

# Phase 3: Frontend Deployment
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Phase 3: Frontend Deployment (AWS Amplify)           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

read -p "Deploy frontend to AWS Amplify? (y/n): " DEPLOY_FRONTEND
if [ "$DEPLOY_FRONTEND" = "y" ]; then
    cd frontend

    # Update .env.production
    echo -e "${BLUE}Updating frontend configuration...${NC}"
    cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://$BACKEND_URL/api/v1
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
EOF

    echo -e "${GREEN}✅ Frontend configuration updated${NC}"

    # Check if Amplify is initialized
    if [ ! -d "amplify" ]; then
        echo -e "${BLUE}Initializing Amplify...${NC}"
        echo "   Please follow the prompts:"
        amplify init
    fi

    # Add hosting if not added
    if ! amplify status | grep -q "hosting"; then
        echo -e "${BLUE}Adding Amplify hosting...${NC}"
        amplify add hosting
    fi

    # Publish
    echo -e "${BLUE}Publishing frontend...${NC}"
    amplify publish

    echo -e "${GREEN}✅ Frontend deployed${NC}"

    cd ..
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              Deployment Complete! 🎉                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Your CRM is now deployed!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Deployment Summary:"
echo "═══════════════════════════════════════════════════════════"
echo "Backend URL:     http://$BACKEND_URL"
echo "Frontend URL:    https://$DOMAIN"
echo "Main Domain:     https://$DOMAIN"
echo "Wildcard:        https://*.$DOMAIN"
echo ""
echo "Test URLs:"
echo "  Health:  http://$BACKEND_URL/api/v1/actuator/health"
echo "  Main:    https://$DOMAIN"
echo "  Tenant:  https://wattglow.$DOMAIN"
echo ""
echo "Next Steps:"
echo "1. Test your application"
echo "2. Register a test organization"
echo "3. Monitor logs: cd backend && eb logs"
echo "4. Check costs in AWS Console"
echo ""
echo "Documentation: TIER1_DEPLOYMENT_GUIDE.md"
echo "═══════════════════════════════════════════════════════════"
