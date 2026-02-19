#!/bin/bash

# Install Prerequisites for AWS Deployment
# Run this script to install all required tools

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     Installing AWS Deployment Prerequisites           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1. Install AWS CLI
echo -e "${BLUE}[1/3] Installing AWS CLI...${NC}"
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI already installed${NC}"
    aws --version
else
    echo "Downloading AWS CLI installer..."
    cd /tmp
    curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"

    echo "Installing AWS CLI (requires sudo password)..."
    sudo installer -pkg AWSCLIV2.pkg -target /

    rm AWSCLIV2.pkg

    if command -v aws &> /dev/null; then
        echo -e "${GREEN}✅ AWS CLI installed successfully${NC}"
        aws --version
    else
        echo -e "${YELLOW}⚠️  AWS CLI installation may require terminal restart${NC}"
    fi
fi

# 2. Install Elastic Beanstalk CLI
echo ""
echo -e "${BLUE}[2/3] Installing Elastic Beanstalk CLI...${NC}"
if command -v eb &> /dev/null; then
    echo -e "${GREEN}✅ EB CLI already installed${NC}"
    eb --version
else
    echo "Installing via pip3..."
    pip3 install awsebcli --upgrade --user

    # Add to PATH if needed
    if ! command -v eb &> /dev/null; then
        echo "Adding to PATH..."
        echo 'export PATH="$HOME/Library/Python/3.11/bin:$PATH"' >> ~/.zshrc
        export PATH="$HOME/Library/Python/3.11/bin:$PATH"
    fi

    if command -v eb &> /dev/null; then
        echo -e "${GREEN}✅ EB CLI installed successfully${NC}"
        eb --version
    else
        echo -e "${YELLOW}⚠️  EB CLI installed but may need PATH update${NC}"
        echo "   Run: export PATH=\"\$HOME/Library/Python/3.11/bin:\$PATH\""
    fi
fi

# 3. Install Amplify CLI
echo ""
echo -e "${BLUE}[3/3] Installing Amplify CLI...${NC}"
if command -v amplify &> /dev/null; then
    echo -e "${GREEN}✅ Amplify CLI already installed${NC}"
    amplify --version
else
    echo "Installing via npm..."
    npm install -g @aws-amplify/cli

    if command -v amplify &> /dev/null; then
        echo -e "${GREEN}✅ Amplify CLI installed successfully${NC}"
        amplify --version
    else
        echo -e "${YELLOW}⚠️  Amplify CLI installation may require terminal restart${NC}"
    fi
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          Installation Complete! ✅                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Installed tools:"
echo "  - AWS CLI:      $(command -v aws &> /dev/null && echo '✅' || echo '⚠️ Restart terminal')"
echo "  - EB CLI:       $(command -v eb &> /dev/null && echo '✅' || echo '⚠️ Restart terminal')"
echo "  - Amplify CLI:  $(command -v amplify &> /dev/null && echo '✅' || echo '⚠️ Restart terminal')"
echo ""
echo "Next steps:"
echo "1. If any tools show ⚠️, restart your terminal"
echo "2. Run: aws configure"
echo "3. Run: ./deploy-tier1.sh"
echo ""
