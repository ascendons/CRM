#!/bin/bash

# AWS Wildcard Subdomain Infrastructure Setup
# This script automates the setup of wildcard subdomains for multi-tenant architecture

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Configuration
DOMAIN="${DOMAIN:-ascendons.com}"
REGION="${AWS_REGION:-us-east-1}"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  AWS Wildcard Subdomain Infrastructure Setup          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
print_info "Domain: $DOMAIN"
print_info "Region: $REGION"
echo ""

# Check prerequisites
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not installed"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI not configured. Run 'aws configure'"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS Account: $AWS_ACCOUNT_ID"

# Ask for confirmation
read -p "Continue with setup? (y/n): " CONTINUE
if [ "$CONTINUE" != "y" ]; then
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Route 53 Hosted Zone"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if hosted zone exists
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name $DOMAIN \
  --query "HostedZones[?Name=='$DOMAIN.'].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "$HOSTED_ZONE_ID" ]; then
    print_info "Creating Route 53 hosted zone..."

    HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
      --name $DOMAIN \
      --caller-reference $(date +%s) \
      --query "HostedZone.Id" \
      --output text)

    print_success "Hosted zone created: $HOSTED_ZONE_ID"

    echo ""
    print_warning "UPDATE NAMESERVERS AT YOUR DOMAIN REGISTRAR:"
    aws route53 get-hosted-zone \
      --id $HOSTED_ZONE_ID \
      --query "DelegationSet.NameServers" \
      --output table

    echo ""
    print_warning "After updating nameservers, wait 5-30 minutes for propagation"
    read -p "Press Enter after updating nameservers..." WAIT
else
    print_success "Hosted zone exists: $HOSTED_ZONE_ID"
fi

# Clean up hosted zone ID format
HOSTED_ZONE_ID=$(echo $HOSTED_ZONE_ID | sed 's|/hostedzone/||')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: SSL Certificate (Wildcard)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if certificate exists
CERTIFICATE_ARN=$(aws acm list-certificates \
  --region $REGION \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn" \
  --output text 2>/dev/null || echo "")

if [ -z "$CERTIFICATE_ARN" ]; then
    print_info "Requesting wildcard SSL certificate..."

    CERTIFICATE_ARN=$(aws acm request-certificate \
      --domain-name $DOMAIN \
      --subject-alternative-names "*.$DOMAIN" \
      --validation-method DNS \
      --region $REGION \
      --query "CertificateArn" \
      --output text)

    print_success "Certificate requested: $CERTIFICATE_ARN"

    echo ""
    print_info "Waiting for validation records (10 seconds)..."
    sleep 10

    echo ""
    print_warning "Add these CNAME records to Route 53 for validation:"
    aws acm describe-certificate \
      --certificate-arn $CERTIFICATE_ARN \
      --region $REGION \
      --query "Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]" \
      --output table

    echo ""
    print_info "You can add validation records via AWS Console:"
    echo "https://console.aws.amazon.com/acm/home?region=$REGION#/certificates/list"
    echo "Click 'Create records in Route 53' button"
    echo ""
    read -p "Press Enter after adding validation records..." WAIT

    print_info "Waiting for certificate validation (this may take 5-30 minutes)..."
    aws acm wait certificate-validated \
      --certificate-arn $CERTIFICATE_ARN \
      --region $REGION

    print_success "Certificate validated!"
else
    CERT_STATUS=$(aws acm describe-certificate \
      --certificate-arn $CERTIFICATE_ARN \
      --region $REGION \
      --query "Certificate.Status" \
      --output text)

    if [ "$CERT_STATUS" != "ISSUED" ]; then
        print_warning "Certificate exists but not validated. Status: $CERT_STATUS"
        print_info "Waiting for validation..."
        aws acm wait certificate-validated \
          --certificate-arn $CERTIFICATE_ARN \
          --region $REGION
    fi

    print_success "Certificate exists and is valid: $CERTIFICATE_ARN"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Load Balancer Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find load balancer
print_info "Finding your load balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?starts_with(LoadBalancerName, 'crm')].LoadBalancerArn" \
  --output text 2>/dev/null | head -1 || echo "")

if [ -z "$ALB_ARN" ]; then
    # Try to find any load balancer
    ALB_ARN=$(aws elbv2 describe-load-balancers \
      --query "LoadBalancers[0].LoadBalancerArn" \
      --output text 2>/dev/null || echo "")
fi

if [ -z "$ALB_ARN" ]; then
    print_error "No load balancer found. Please deploy your backend first."
    exit 1
fi

LB_NAME=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].LoadBalancerName" \
  --output text)

LB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text)

LB_ZONE=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].CanonicalHostedZoneId" \
  --output text)

print_success "Load Balancer: $LB_NAME"
print_info "DNS: $LB_DNS"

# Find target group
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --query "TargetGroups[?starts_with(TargetGroupName, 'crm')].TargetGroupArn" \
  --output text 2>/dev/null | head -1 || echo "")

if [ -z "$TARGET_GROUP_ARN" ]; then
    TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
      --load-balancer-arn $ALB_ARN \
      --query "TargetGroups[0].TargetGroupArn" \
      --output text 2>/dev/null || echo "")
fi

if [ -z "$TARGET_GROUP_ARN" ]; then
    print_error "No target group found"
    exit 1
fi

print_success "Target Group: $TARGET_GROUP_ARN"

# Check if HTTPS listener exists
HTTPS_LISTENER=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query "Listeners[?Port==\`443\`].ListenerArn" \
  --output text 2>/dev/null || echo "")

if [ -z "$HTTPS_LISTENER" ]; then
    print_info "Creating HTTPS listener on port 443..."

    aws elbv2 create-listener \
      --load-balancer-arn $ALB_ARN \
      --protocol HTTPS \
      --port 443 \
      --certificates CertificateArn=$CERTIFICATE_ARN \
      --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
      > /dev/null

    print_success "HTTPS listener created"

    # Update HTTP listener to redirect to HTTPS
    HTTP_LISTENER=$(aws elbv2 describe-listeners \
      --load-balancer-arn $ALB_ARN \
      --query "Listeners[?Port==\`80\`].ListenerArn" \
      --output text)

    if [ -n "$HTTP_LISTENER" ]; then
        print_info "Configuring HTTP to HTTPS redirect..."
        aws elbv2 modify-listener \
          --listener-arn $HTTP_LISTENER \
          --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
          > /dev/null
        print_success "HTTP redirect configured"
    fi
else
    print_success "HTTPS listener already exists"
fi

# Ensure security group allows HTTPS
ALB_SG=$(aws elbv2 describe-load-balancers \
  --load-balancer-arn $ALB_ARN \
  --query "LoadBalancers[0].SecurityGroups[0]" \
  --output text)

print_info "Checking security group rules..."
HTTPS_RULE=$(aws ec2 describe-security-groups \
  --group-ids $ALB_SG \
  --query "SecurityGroups[0].IpPermissions[?FromPort==\`443\`]" \
  --output text 2>/dev/null || echo "")

if [ -z "$HTTPS_RULE" ]; then
    print_info "Adding HTTPS rule to security group..."
    aws ec2 authorize-security-group-ingress \
      --group-id $ALB_SG \
      --protocol tcp \
      --port 443 \
      --cidr 0.0.0.0/0 \
      2>/dev/null || print_warning "HTTPS rule may already exist"
    print_success "HTTPS allowed in security group"
else
    print_success "HTTPS already allowed in security group"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Wildcard DNS Records"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

print_info "Creating wildcard DNS records..."

# Create temporary JSON file for DNS changes
cat > /tmp/wildcard-dns-$$.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "*.$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$LB_ZONE",
          "DNSName": "$LB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$LB_ZONE",
          "DNSName": "$LB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file:///tmp/wildcard-dns-$$.json \
  > /dev/null

rm /tmp/wildcard-dns-$$.json

print_success "Wildcard DNS records created"
print_info "DNS propagation may take 2-5 minutes"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           Setup Complete! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
print_success "Infrastructure configured successfully!"
echo ""
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain:              $DOMAIN"
echo "Wildcard:            *.$DOMAIN"
echo "SSL Certificate:     ✅ Valid"
echo "Load Balancer:       $LB_NAME"
echo "DNS:                 Configured"
echo ""
echo "Test URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Main:      https://$DOMAIN"
echo "Tenant 1:  https://wattglow.$DOMAIN"
echo "Tenant 2:  https://acme.$DOMAIN"
echo "Any:       https://anything.$DOMAIN"
echo ""
print_warning "Wait 2-5 minutes for DNS propagation, then test:"
echo ""
echo "  curl https://$DOMAIN/api/v1/actuator/health"
echo "  curl https://wattglow.$DOMAIN/api/v1/actuator/health"
echo ""
echo "Next steps:"
echo "1. Update backend CORS_ALLOWED_ORIGINS to include https://*.$DOMAIN"
echo "2. Deploy your application"
echo "3. Test tenant registration and subdomain access"
echo ""
