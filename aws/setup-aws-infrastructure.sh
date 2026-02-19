#!/bin/bash

# AWS Infrastructure Setup Script
# This script sets up the complete AWS infrastructure for the CRM application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="crm"
STACK_NAME="${PROJECT_NAME}-infrastructure"

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║$1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_header "   Checking Prerequisites              "

    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Run 'aws configure'"
        exit 1
    fi

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_message "AWS Account ID: $AWS_ACCOUNT_ID"
    print_message "AWS Region: $AWS_REGION"
}

# Get user inputs
get_user_inputs() {
    print_header "   Configuration Setup                 "

    read -p "Enter MongoDB Atlas connection URI: " MONGODB_URI
    if [ -z "$MONGODB_URI" ]; then
        print_error "MongoDB URI is required"
        exit 1
    fi

    read -p "Enter Frontend URL (e.g., https://yourdomain.com): " FRONTEND_URL
    if [ -z "$FRONTEND_URL" ]; then
        FRONTEND_URL="http://localhost:3000"
        print_warning "Using default frontend URL: $FRONTEND_URL"
    fi

    # Generate JWT secret if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 64)
        print_message "Generated JWT secret (save this!):"
        echo "$JWT_SECRET"
    fi

    read -p "Enter your email for SSL certificate notifications: " EMAIL
}

# Create ECR repository
create_ecr_repository() {
    print_header "   Creating ECR Repository             "

    if ! aws ecr describe-repositories --repository-names ${PROJECT_NAME}-backend --region ${AWS_REGION} &> /dev/null; then
        print_message "Creating ECR repository..."
        aws ecr create-repository \
            --repository-name ${PROJECT_NAME}-backend \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true
        print_message "✅ ECR repository created"
    else
        print_message "ECR repository already exists"
    fi
}

# Create S3 bucket for frontend (if using S3+CloudFront)
create_s3_bucket() {
    print_header "   Creating S3 Bucket (Optional)       "

    read -p "Do you want to create S3 bucket for frontend? (y/n): " CREATE_S3

    if [ "$CREATE_S3" == "y" ]; then
        BUCKET_NAME="${PROJECT_NAME}-frontend-prod-${AWS_ACCOUNT_ID}"

        if ! aws s3 ls s3://${BUCKET_NAME} &> /dev/null 2>&1; then
            print_message "Creating S3 bucket: $BUCKET_NAME"
            aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION}

            # Configure for static website hosting
            aws s3 website s3://${BUCKET_NAME} \
                --index-document index.html \
                --error-document 404.html

            # Enable versioning
            aws s3api put-bucket-versioning \
                --bucket ${BUCKET_NAME} \
                --versioning-configuration Status=Enabled

            print_message "✅ S3 bucket created and configured"
            echo "Bucket name: $BUCKET_NAME"
        else
            print_message "S3 bucket already exists"
        fi
    fi
}

# Main function
main() {
    print_header "   AWS Infrastructure Setup            "

    check_prerequisites
    get_user_inputs
    create_ecr_repository
    create_s3_bucket

    print_header "   Setup Complete! 🎉                  "

    echo ""
    echo "Next steps:"
    echo "1. Deploy backend: cd .. && ./deploy-aws.sh backend"
    echo "2. Deploy frontend using AWS Amplify Console or S3"
    echo ""
}

# Run main function
main
