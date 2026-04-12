#!/bin/bash

#############################################
# EC2 Instance Setup Script
# Run this script on your fresh EC2 instance
#############################################

set -e

echo "========================================="
echo "🚀 CRM Application EC2 Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please run as regular user (ubuntu/ec2-user), not root"
    exit 1
fi

# Update system
echo "📦 Step 1/6: Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Docker
echo "🐳 Step 2/6: Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Install Docker prerequisites
    sudo apt-get install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    sudo usermod -aG docker $USER

    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose (standalone)
echo "🐳 Step 3/6: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y -qq docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Install Git
echo "📚 Step 4/6: Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y -qq git
    echo "✅ Git installed"
else
    echo "✅ Git already installed"
fi

# Install additional utilities
echo "🛠️  Step 5/6: Installing utilities..."
sudo apt-get install -y -qq \
    htop \
    nano \
    vim \
    wget \
    curl \
    unzip \
    net-tools

# Configure firewall (UFW)
echo "🔒 Step 6/6: Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw reload
    echo "✅ Firewall configured"
fi

# Create application directory
echo ""
echo "📁 Creating application directory..."
mkdir -p ~/crm
cd ~/crm

# Create .env file template
echo ""
echo "📝 Creating .env template..."
cat > .env << 'EOF'
# JWT Configuration
JWT_SECRET=change-this-to-a-secure-random-string-at-least-64-characters-long

# MongoDB Atlas (already configured in docker-compose.ec2.yml)
# No changes needed - using existing Atlas cluster

# Application URLs
FRONTEND_URL=https://crm.ascendons.com
BACKEND_URL=https://api.ascendons.com
EOF

echo ""
echo "========================================="
echo "✅ EC2 Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Deploy your application:"
echo "   - Copy your code to ~/crm/"
echo "   - Update .env file with your JWT_SECRET"
echo "   - Run: docker-compose -f docker-compose.ec2.yml up -d --build"
echo ""
echo "2. If you added yourself to docker group, logout and login again:"
echo "   logout"
echo ""
echo "3. Check application status:"
echo "   docker-compose -f docker-compose.ec2.yml ps"
echo "   docker-compose -f docker-compose.ec2.yml logs -f"
echo ""
echo "4. Test your application:"
echo "   http://$(curl -s ifconfig.me)"
echo ""
echo "========================================="
