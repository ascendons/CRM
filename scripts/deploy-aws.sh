#!/bin/bash

# AWS Deployment Script for CRM Application
# This script automates the deployment of both backend and frontend to AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECR_REPOSITORY="crm-backend"
ECS_CLUSTER="crm-backend-cluster"
ECS_SERVICE="crm-backend-service"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_message "Checking prerequisites..."

    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi

    if [ -z "$AWS_ACCOUNT_ID" ]; then
        print_error "AWS_ACCOUNT_ID environment variable is not set."
        echo "Please set it: export AWS_ACCOUNT_ID=your-account-id"
        exit 1
    fi

    print_message "Prerequisites check passed!"
}

# Deploy backend
deploy_backend() {
    print_message "🚀 Starting backend deployment..."

    cd backend

    # Build Docker image
    print_message "📦 Building Docker image..."
    docker build -t ${ECR_REPOSITORY}:latest .

    # Tag image for ECR
    docker tag ${ECR_REPOSITORY}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
    docker tag ${ECR_REPOSITORY}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:$(date +%Y%m%d-%H%M%S)

    # Login to ECR
    print_message "🔐 Logging in to AWS ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

    # Create ECR repository if it doesn't exist
    if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null; then
        print_message "Creating ECR repository..."
        aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}
    fi

    # Push image to ECR
    print_message "⬆️  Pushing image to ECR..."
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:$(date +%Y%m%d-%H%M%S)

    # Update ECS service (if exists)
    if aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION} &> /dev/null; then
        print_message "🔄 Updating ECS service..."
        aws ecs update-service \
            --cluster ${ECS_CLUSTER} \
            --service ${ECS_SERVICE} \
            --force-new-deployment \
            --region ${AWS_REGION}

        print_message "✅ Backend deployment initiated!"
        print_message "Waiting for deployment to complete (this may take a few minutes)..."

        aws ecs wait services-stable \
            --cluster ${ECS_CLUSTER} \
            --services ${ECS_SERVICE} \
            --region ${AWS_REGION}

        print_message "✅ Backend deployment completed successfully!"
    else
        print_warning "ECS service not found. Please create it using CloudFormation or AWS Console."
        print_message "Image pushed to ECR successfully. You can now deploy it manually."
    fi

    cd ..
}

# Deploy frontend
deploy_frontend() {
    print_message "🎨 Starting frontend deployment..."

    cd frontend

    # Check if Amplify is initialized
    if [ -d "amplify" ]; then
        print_message "📦 Building and deploying to AWS Amplify..."

        # Install dependencies
        npm ci

        # Deploy to Amplify
        npx amplify publish --yes

        print_message "✅ Frontend deployed to AWS Amplify!"
    else
        print_warning "Amplify not initialized. Deploying to S3+CloudFront..."

        # Build static files
        print_message "📦 Building static files..."
        npm run build

        # Upload to S3 (if S3 bucket is configured)
        if [ -n "$S3_BUCKET" ]; then
            print_message "⬆️  Uploading to S3..."
            aws s3 sync out/ s3://${S3_BUCKET} --delete

            # Invalidate CloudFront cache (if CloudFront distribution is configured)
            if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
                print_message "🔄 Invalidating CloudFront cache..."
                aws cloudfront create-invalidation \
                    --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
                    --paths "/*"
            fi

            print_message "✅ Frontend deployed to S3+CloudFront!"
        else
            print_warning "S3_BUCKET environment variable not set. Skipping S3 upload."
            print_message "Build completed. You can manually upload 'out/' directory to S3."
        fi
    fi

    cd ..
}

# Main deployment function
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   CRM Application - AWS Deployment    ║"
    echo "╚════════════════════════════════════════╝"
    echo ""

    check_prerequisites

    # Parse command line arguments
    if [ "$1" == "backend" ]; then
        deploy_backend
    elif [ "$1" == "frontend" ]; then
        deploy_frontend
    elif [ "$1" == "all" ] || [ -z "$1" ]; then
        deploy_backend
        echo ""
        deploy_frontend
    else
        print_error "Invalid argument. Use: backend, frontend, or all"
        exit 1
    fi

    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║      Deployment Completed! 🎉         ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
}

# Run main function
main "$@"
