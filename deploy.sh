#!/bin/bash

# Production Deployment Script for CRM Application
# Author: Auto-generated
# Usage: ./deploy.sh [option]
# Options: build, deploy, rollback, logs, status

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_requirements() {
    print_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found"
        print_info "Copy .env.production.example to .env.production and configure it"
        exit 1
    fi

    print_success "All requirements met"
}

build_images() {
    print_info "Building Docker images..."

    # Build backend
    print_info "Building backend..."
    docker-compose -f $COMPOSE_FILE build backend
    print_success "Backend built successfully"

    # Build frontend
    print_info "Building frontend..."
    docker-compose -f $COMPOSE_FILE build frontend
    print_success "Frontend built successfully"

    print_success "All images built successfully"
}

backup_current() {
    print_info "Creating backup..."

    mkdir -p $BACKUP_DIR

    # Backup current images
    docker save crm-backend:latest | gzip > $BACKUP_DIR/backend-$DATE.tar.gz
    docker save crm-frontend:latest | gzip > $BACKUP_DIR/frontend-$DATE.tar.gz

    print_success "Backup created at $BACKUP_DIR"
}

deploy() {
    print_info "Deploying application..."

    # Load environment variables
    export $(cat .env.production | grep -v '^#' | xargs)

    # Stop current containers
    print_info "Stopping current containers..."
    docker-compose -f $COMPOSE_FILE down

    # Start new containers
    print_info "Starting new containers..."
    docker-compose -f $COMPOSE_FILE up -d

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10

    # Check backend health
    if docker-compose -f $COMPOSE_FILE exec -T backend wget -q --spider http://localhost:8080/api/v1/actuator/health; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi

    print_success "Deployment completed successfully"
}

rollback() {
    print_info "Rolling back to previous version..."

    # Find latest backup
    LATEST_BACKEND=$(ls -t $BACKUP_DIR/backend-*.tar.gz 2>/dev/null | head -1)
    LATEST_FRONTEND=$(ls -t $BACKUP_DIR/frontend-*.tar.gz 2>/dev/null | head -1)

    if [ -z "$LATEST_BACKEND" ] || [ -z "$LATEST_FRONTEND" ]; then
        print_error "No backup found for rollback"
        exit 1
    fi

    # Load backup images
    print_info "Loading backup images..."
    docker load < $LATEST_BACKEND
    docker load < $LATEST_FRONTEND

    # Restart containers
    print_info "Restarting containers with previous images..."
    docker-compose -f $COMPOSE_FILE down
    docker-compose -f $COMPOSE_FILE up -d

    print_success "Rollback completed successfully"
}

show_logs() {
    print_info "Showing logs..."
    docker-compose -f $COMPOSE_FILE logs -f --tail=100
}

show_status() {
    print_info "Checking status..."
    docker-compose -f $COMPOSE_FILE ps

    echo ""
    print_info "Service URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:8080"
    echo "Backend Health: http://localhost:8080/api/v1/actuator/health"
}

cleanup() {
    print_info "Cleaning up old backups (keeping last 5)..."
    cd $BACKUP_DIR
    ls -t backend-*.tar.gz | tail -n +6 | xargs -r rm
    ls -t frontend-*.tar.gz | tail -n +6 | xargs -r rm
    cd ..
    print_success "Cleanup completed"
}

# Main script
case "$1" in
    build)
        check_requirements
        build_images
        ;;
    deploy)
        check_requirements
        backup_current
        build_images
        deploy
        cleanup
        show_status
        ;;
    rollback)
        rollback
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {build|deploy|rollback|logs|status}"
        echo ""
        echo "Commands:"
        echo "  build     - Build Docker images"
        echo "  deploy    - Deploy application to production"
        echo "  rollback  - Rollback to previous version"
        echo "  logs      - Show application logs"
        echo "  status    - Show service status"
        exit 1
        ;;
esac
