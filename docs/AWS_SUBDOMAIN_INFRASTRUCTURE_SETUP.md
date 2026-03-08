# AWS Infrastructure Setup for Wildcard Subdomains

## Quick Guide: Configure AWS to Support *.ascendons.com

Since your multi-tenancy code is already implemented, this guide focuses **only** on AWS infrastructure configuration.

---

## What You Need

1. **Domain**: ascendons.com (purchase from GoDaddy, Namecheap, or Route 53)
2. **Wildcard SSL Certificate**: For *.ascendons.com (FREE via AWS ACM)
3. **Wildcard DNS**: Route 53 record pointing *.ascendons.com to your app
4. **Load Balancer**: Configured to accept all subdomains

**Total Time**: 1-2 hours
**Additional Cost**: ~$1-2/month (just Route 53 hosted zone)

---

## Step-by-Step Setup

### Step 1: Setup Route 53 Hosted Zone (5 minutes)

```bash
# 1. Create hosted zone for your domain
aws route53 create-hosted-zone \
  --name ascendons.com \
  --caller-reference $(date +%s) \
  --region us-east-1

# Output will show nameservers like:
# ns-123.awsdns-45.com
# ns-678.awsdns-90.net
# ns-234.awsdns-56.org
# ns-789.awsdns-01.co.uk

# 2. Save your hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name ascendons.com \
  --query "HostedZones[0].Id" \
  --output text)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
```

### Step 2: Update Nameservers at Domain Registrar (10 minutes)

Go to your domain registrar (GoDaddy, Namecheap, etc.) and update nameservers:

**Example for GoDaddy:**
1. Log in to GoDaddy
2. My Products → Domains → ascendons.com → Manage DNS
3. Change Nameservers → Custom
4. Add the 4 nameservers from Step 1 output
5. Save

**Wait 5-30 minutes for DNS propagation**

Verify:
```bash
# Check if nameservers are updated
dig NS ascendons.com

# Should show AWS nameservers
```

---

### Step 3: Request Wildcard SSL Certificate (10 minutes)

```bash
# Request certificate for both ascendons.com and *.ascendons.com
aws acm request-certificate \
  --domain-name ascendons.com \
  --subject-alternative-names "*.ascendons.com" \
  --validation-method DNS \
  --region us-east-1

# Save the certificate ARN from output
CERTIFICATE_ARN="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID"

# Get validation records
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]" \
  --output table
```

**Add Validation Records to Route 53:**

Option A: Via AWS Console (Easier)
1. AWS Console → Certificate Manager → Your Certificate
2. Click "Create records in Route 53" button
3. Click "Create records"
4. Wait 5-30 minutes for validation

Option B: Via CLI
```bash
# You'll get 2 CNAME records (one for each domain)
# Add them like this:

cat > cert-validation-records.json << 'EOF'
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_xxx.ascendons.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_yyy.acm-validations.aws."}]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://cert-validation-records.json
```

**Wait for validation:**
```bash
# This will wait until certificate is validated (5-30 minutes)
aws acm wait certificate-validated \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1

echo "Certificate validated! ✅"
```

---

### Step 4: Configure Application Load Balancer (15 minutes)

#### Option A: Using Elastic Beanstalk

```bash
cd backend

# If not already using EB
eb init -p docker crm-backend --region us-east-1

# Create environment with load balancer
eb create crm-backend-prod \
  --instance-type t3.small \
  --elb-type application

# Configure HTTPS listener
eb create-listener \
  --port 443 \
  --protocol HTTPS \
  --certificate-arn $CERTIFICATE_ARN

# Set environment variables
eb setenv \
  SPRING_DATA_MONGODB_URI="your-mongodb-uri" \
  JWT_SECRET="your-jwt-secret" \
  CORS_ALLOWED_ORIGINS="https://*.ascendons.com,https://ascendons.com"
```

#### Option B: Using ECS with ALB (Already deployed)

If you already have an ALB from ECS deployment:

```bash
# Get your ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names crm-backend-alb \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text)

echo "ALB ARN: $ALB_ARN"

# Get listener ARN (should be port 80)
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query "Listeners[0].ListenerArn" \
  --output text)

# Create HTTPS listener (port 443) with SSL certificate
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERTIFICATE_ARN \
  --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

# Get your target group ARN
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --names crm-backend-tg \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)

# Redirect HTTP to HTTPS
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

**Add Security Group Rule (Allow HTTPS)**
```bash
# Get ALB security group ID
ALB_SG=$(aws elbv2 describe-load-balancers \
  --load-balancer-arn $ALB_ARN \
  --query "LoadBalancers[0].SecurityGroups[0]" \
  --output text)

# Allow HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

### Step 5: Create Wildcard DNS Records (5 minutes)

Now point all subdomains to your load balancer:

```bash
# Get your load balancer DNS name
LB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arn $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text)

LB_HOSTED_ZONE=$(aws elbv2 describe-load-balancers \
  --load-balancer-arn $ALB_ARN \
  --query "LoadBalancers[0].CanonicalHostedZoneId" \
  --output text)

echo "Load Balancer DNS: $LB_DNS"
echo "LB Hosted Zone: $LB_HOSTED_ZONE"
```

**Create DNS Records:**

```bash
# Create wildcard A record (*.ascendons.com)
cat > wildcard-dns-records.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "*.ascendons.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$LB_HOSTED_ZONE",
          "DNSName": "$LB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "ascendons.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$LB_HOSTED_ZONE",
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
  --change-batch file://wildcard-dns-records.json
```

**Wait 2-5 minutes for DNS propagation.**

---

### Step 6: Update Backend CORS (Already in your code)

Make sure your backend accepts wildcard origins:

```java
// Should already be in your WebConfig
cors.allowed-origins=https://*.ascendons.com,https://ascendons.com
```

Or update via environment variable:
```bash
eb setenv CORS_ALLOWED_ORIGINS="https://*.ascendons.com,https://ascendons.com"

# For ECS, update task definition environment variables
```

---

### Step 7: Test Your Setup ✅

```bash
# 1. Test main domain
curl https://ascendons.com/api/v1/actuator/health

# 2. Test wildcard subdomain
curl https://wattglow.ascendons.com/api/v1/actuator/health

# 3. Test another subdomain
curl https://acme.ascendons.com/api/v1/actuator/health

# 4. Test in browser
open https://ascendons.com
open https://wattglow.ascendons.com
open https://acme.ascendons.com
```

**Expected Result:**
- All subdomains should work ✅
- SSL certificate should be valid ✅
- Your backend should extract tenant from subdomain ✅

---

## Complete Setup Script

Create: `setup-subdomain-infrastructure.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Setting up wildcard subdomain infrastructure..."

# Configuration
DOMAIN="ascendons.com"
REGION="us-east-1"

# 1. Create hosted zone
echo "📝 Creating Route 53 hosted zone..."
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
  --name $DOMAIN \
  --caller-reference $(date +%s) \
  --query "HostedZone.Id" \
  --output text)

echo "✅ Hosted Zone created: $HOSTED_ZONE_ID"

# Get nameservers
aws route53 get-hosted-zone \
  --id $HOSTED_ZONE_ID \
  --query "DelegationSet.NameServers" \
  --output table

echo ""
echo "⚠️  UPDATE NAMESERVERS AT YOUR DOMAIN REGISTRAR"
echo "Then press Enter to continue..."
read

# 2. Request SSL certificate
echo "🔐 Requesting wildcard SSL certificate..."
CERTIFICATE_ARN=$(aws acm request-certificate \
  --domain-name $DOMAIN \
  --subject-alternative-names "*.$DOMAIN" \
  --validation-method DNS \
  --region $REGION \
  --query "CertificateArn" \
  --output text)

echo "✅ Certificate requested: $CERTIFICATE_ARN"

# Show validation records
echo "📋 Add these CNAME records to Route 53:"
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region $REGION \
  --query "Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]" \
  --output table

echo ""
echo "Add validation records via AWS Console:"
echo "https://console.aws.amazon.com/acm/home?region=$REGION#/certificates/list"
echo "Click 'Create records in Route 53' button"
echo ""
echo "Press Enter after adding validation records..."
read

# Wait for validation
echo "⏳ Waiting for certificate validation (this may take 5-30 minutes)..."
aws acm wait certificate-validated \
  --certificate-arn $CERTIFICATE_ARN \
  --region $REGION

echo "✅ Certificate validated!"

# 3. Get load balancer info
echo "🔍 Finding your load balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text)

LB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arn $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text)

LB_ZONE=$(aws elbv2 describe-load-balancers \
  --load-balancer-arn $ALB_ARN \
  --query "LoadBalancers[0].CanonicalHostedZoneId" \
  --output text)

echo "Load Balancer: $LB_DNS"

# 4. Create HTTPS listener
echo "🔒 Creating HTTPS listener..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)

aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERTIFICATE_ARN \
  --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

echo "✅ HTTPS listener created"

# 5. Create wildcard DNS records
echo "🌐 Creating wildcard DNS records..."
cat > /tmp/wildcard-dns.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
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
      "Action": "CREATE",
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
  --change-batch file:///tmp/wildcard-dns.json

echo "✅ DNS records created"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     Setup Complete! 🎉                ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Your domain: https://$DOMAIN"
echo "Test subdomain: https://test.$DOMAIN"
echo ""
echo "Wait 2-5 minutes for DNS propagation, then test:"
echo "  curl https://$DOMAIN/api/v1/actuator/health"
echo "  curl https://test.$DOMAIN/api/v1/actuator/health"
```

Make it executable:
```bash
chmod +x setup-subdomain-infrastructure.sh
./setup-subdomain-infrastructure.sh
```

---

## Frontend Deployment (AWS Amplify)

For frontend to work with subdomains:

```bash
cd frontend

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting
# Choose: Hosting with Amplify Console

# Deploy
amplify publish
```

**In Amplify Console:**
1. Go to Amplify → Your App → Domain Management
2. Add custom domain: `ascendons.com`
3. Add `*.ascendons.com` as subdomain pattern
4. Amplify will automatically handle SSL for all subdomains

**Or use CloudFront + S3:**
```bash
# Build frontend
npm run build

# Upload to S3
aws s3 sync out/ s3://your-bucket --delete

# Create CloudFront distribution with:
# - Alternate domain names: ascendons.com, *.ascendons.com
# - SSL certificate: Use the same ACM certificate
# - Origin: S3 bucket
```

---

## Troubleshooting

### Issue 1: SSL Certificate Not Validating

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --query "Certificate.Status"

# If stuck, check validation records are in Route 53
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Type=='CNAME']"
```

### Issue 2: Subdomain Not Resolving

```bash
# Test DNS propagation
dig wattglow.ascendons.com
dig acme.ascendons.com

# Check wildcard record exists
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Name=='*.ascendons.com']"
```

### Issue 3: CORS Errors

Update backend environment:
```bash
eb setenv CORS_ALLOWED_ORIGINS="https://*.ascendons.com,https://ascendons.com"
```

---

## Cost Breakdown

- **Route 53 Hosted Zone**: $0.50/month
- **Route 53 Queries**: $0.40 per million queries (~$0.01/month for small traffic)
- **SSL Certificate (ACM)**: **FREE** ✅
- **Wildcard DNS**: No additional cost
- **Load Balancer**: Already part of your deployment

**Total Additional Cost: ~$1-2/month** 💰

---

## Summary

✅ **Wildcard SSL**: FREE via AWS ACM
✅ **Wildcard DNS**: Single Route 53 record
✅ **Load Balancer**: Works with all subdomains automatically
✅ **Cost**: ~$1-2/month additional
✅ **Time**: 1-2 hours setup

Your multi-tenancy code will now work with:
- `https://ascendons.com` (main domain)
- `https://wattglow.ascendons.com` (tenant 1)
- `https://acme.ascendons.com` (tenant 2)
- `https://any-subdomain.ascendons.com` (any tenant)

All with valid SSL certificates! 🎉
