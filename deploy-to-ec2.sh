#!/bin/bash

#############################################
# Deploy CRM Application to EC2
# Usage: ./deploy-to-ec2.sh <ec2-ip-or-hostname>
#############################################

set -e

EC2_HOST=$1
EC2_USER="ubuntu"  # Change to 'ec2-user' for Amazon Linux
SSH_KEY="-i ~/.ssh/crm-app-key.pem"  # SSH key for EC2 access

if [ -z "$EC2_HOST" ]; then
    echo "Usage: ./deploy-to-ec2.sh <ec2-ip-or-hostname>"
    echo ""
    echo "Examples:"
    echo "  ./deploy-to-ec2.sh 54.123.45.67"
    echo "  ./deploy-to-ec2.sh ec2-54-123-45-67.compute-1.amazonaws.com"
    exit 1
fi

echo "========================================="
echo "🚀 Deploying CRM to EC2"
echo "========================================="
echo "Target: ${EC2_USER}@${EC2_HOST}"
echo ""

# Check SSH connection
echo "🔍 Testing SSH connection..."
if ! ssh $SSH_KEY ${EC2_USER}@${EC2_HOST} "echo 'SSH connection successful'"; then
    echo "❌ Cannot connect to EC2 instance"
    echo "Please check:"
    echo "  - EC2 instance is running"
    echo "  - Security group allows SSH (port 22) from your IP"
    echo "  - SSH key is correct"
    exit 1
fi

# Copy application files
echo ""
echo "📦 Copying application files..."
rsync -avz -e "ssh $SSH_KEY -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'backend/target' \
    --exclude 'frontend/.next' \
    --exclude 'frontend/node_modules' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    ./ ${EC2_USER}@${EC2_HOST}:~/crm/

echo "✅ Files copied successfully"

# Deploy on EC2
echo ""
echo "🔧 Deploying application on EC2..."
ssh $SSH_KEY ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
    set -e
    cd ~/crm

    echo ""
    echo "📋 Current directory contents:"
    ls -la

    # Check if docker-compose.ec2.yml exists
    if [ ! -f "docker-compose.ec2.yml" ]; then
        echo "❌ docker-compose.ec2.yml not found!"
        exit 1
    fi

    # Stop existing containers
    echo ""
    echo "🛑 Stopping existing containers..."
    sudo docker-compose -f docker-compose.ec2.yml down 2>/dev/null || true

    # Remove old images to force rebuild
    echo ""
    echo "🗑️  Cleaning up old images..."
    sudo docker-compose -f docker-compose.ec2.yml down --rmi all 2>/dev/null || true

    # Build and start containers
    echo ""
    echo "🏗️  Building and starting containers..."
    sudo docker-compose -f docker-compose.ec2.yml up -d --build

    # Wait for services to be healthy
    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 10

    # Show status
    echo ""
    echo "========================================="
    echo "📊 Container Status:"
    echo "========================================="
    sudo docker-compose -f docker-compose.ec2.yml ps

    echo ""
    echo "========================================="
    echo "📝 Recent Logs:"
    echo "========================================="
    sudo docker-compose -f docker-compose.ec2.yml logs --tail=20

    echo ""
    echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "========================================="
echo "✅ Deployment Successful!"
echo "========================================="
echo ""
echo "Your application is now running on EC2!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://${EC2_HOST}"
echo "   Backend:  http://${EC2_HOST}:8080/api/v1"
echo ""
echo "📊 View logs:"
echo "   ssh ${EC2_USER}@${EC2_HOST} 'cd ~/crm && sudo docker-compose -f docker-compose.ec2.yml logs -f'"
echo ""
echo "🔄 Restart services:"
echo "   ssh ${EC2_USER}@${EC2_HOST} 'cd ~/crm && sudo docker-compose -f docker-compose.ec2.yml restart'"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Test the application on the EC2 IP"
echo "   2. Configure SSL certificates (Let's Encrypt)"
echo "   3. Update DNS to point to EC2 IP"
echo "   4. Monitor for 1-2 weeks"
echo "   5. Shut down Elastic Beanstalk"
echo ""
echo "========================================="
