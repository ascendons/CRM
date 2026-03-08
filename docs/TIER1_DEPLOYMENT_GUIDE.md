# Tier 1 Deployment - Complete Step-by-Step Guide

Your CRM deployment to AWS Elastic Beanstalk with wildcard subdomains.

**Cost**: $39-96/month
**Time**: 2-3 hours
**Difficulty**: Easy (fully guided)

---

## Prerequisites Checklist

Before we start, you need:
- ✅ MongoDB Atlas (already done!)
- ⬜ AWS Account
- ⬜ Domain name (e.g., ascendons.com)
- ⬜ AWS CLI installed
- ⬜ Elastic Beanstalk CLI installed

---

## Phase 1: Install Required Tools (15 minutes)

### Step 1.1: Install AWS CLI

**macOS:**
```bash
# Download installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"

# Install
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify installation
aws --version
# Should show: aws-cli/2.x.x
```

**Alternative (Homebrew):**
```bash
brew install awscli
aws --version
```

### Step 1.2: Configure AWS CLI

```bash
# Run configuration
aws configure

# You'll be asked for:
# AWS Access Key ID: [Get from AWS Console → IAM → Users → Security Credentials]
# AWS Secret Access Key: [Same place]
# Default region: us-east-1
# Default output format: json
```

**How to get AWS credentials:**
1. Go to AWS Console: https://console.aws.amazon.com
2. IAM → Users → Your User → Security Credentials
3. Click "Create access key"
4. Save the Access Key ID and Secret Access Key

**Verify configuration:**
```bash
aws sts get-caller-identity
# Should show your account info
```

### Step 1.3: Install Elastic Beanstalk CLI

```bash
# Using pip
pip install awsebcli

# Or using pip3
pip3 install awsebcli

# Verify installation
eb --version
# Should show: EB CLI 3.x.x
```

**If you don't have pip:**
```bash
# macOS
python3 -m pip install --upgrade pip
pip3 install awsebcli
```

### Step 1.4: Install Amplify CLI (for frontend)

```bash
npm install -g @aws-amplify/cli

# Verify
amplify --version
```

---

## Phase 2: Prepare Your Application (10 minutes)

### Step 2.1: Update Production Configuration

Your MongoDB is already configured! ✅

But let's prepare environment variables for AWS:

**Create a file to store your secrets:**
```bash
# Create secrets file (DO NOT commit to git)
cat > /Users/pankajthakur/IdeaProjects/CRM/aws-secrets.env << 'EOF'
# MongoDB Atlas Connection
SPRING_DATA_MONGODB_URI=mongodb+srv://dev_divisha_app:Divisha%40123@cluster0.btsspaw.mongodb.net/crm_prod?appName=Cluster0

# JWT Secret (keep the existing one)
JWT_SECRET=p8wtD7ADE1hGQBnoD9zxc+YkWYXiWrjmbwhKnatRXZaUoq77/0/dQhmWVd+6bl1Vj4VVKKv2Cim/EKKOnMskXw==

# CORS (will update after getting domain)
CORS_ALLOWED_ORIGINS=https://*.ascendons.com,https://ascendons.com

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# Port (Elastic Beanstalk uses 5000)
PORT=5000
EOF

# Make sure this file is in .gitignore
echo "aws-secrets.env" >> .gitignore
```

### Step 2.2: Create Frontend Environment File

```bash
# Create frontend production environment
cat > /Users/pankajthakur/IdeaProjects/CRM/frontend/.env.production << 'EOF'
# This will be updated after backend is deployed
NEXT_PUBLIC_API_URL=https://your-backend-url.elasticbeanstalk.com/api/v1
NEXT_PUBLIC_APP_URL=https://ascendons.com
NODE_ENV=production
EOF
```

### Step 2.3: Test Local Build

```bash
# Test backend build
cd /Users/pankajthakur/IdeaProjects/CRM/backend
./mvnw clean package -DskipTests

# If build fails, fix errors before proceeding
# Build should create: target/backend-0.0.1-SNAPSHOT.jar

# Test frontend build
cd /Users/pankajthakur/IdeaProjects/CRM/frontend
npm install
npm run build

# Should complete without errors
```

---

## Phase 3: Deploy Backend to Elastic Beanstalk (30 minutes)

### Step 3.1: Initialize Elastic Beanstalk

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend

# Initialize EB application
eb init

# You'll be prompted with:
# 1. Select a default region: 10 (us-east-1)
# 2. Enter Application Name: crm-backend (press Enter)
# 3. Select a platform: 1 (Docker)
# 4. Platform branch: Docker running on 64bit Amazon Linux 2 (latest)
# 5. Do you wish to continue with CodeCommit? N
# 6. Do you want to set up SSH? Y
# 7. Select a keypair: Create new or use existing
```

**Expected output:**
```
Application crm-backend has been created.
```

### Step 3.2: Create Elastic Beanstalk Environment

```bash
# Create production environment
eb create crm-backend-prod \
  --instance-type t3.small \
  --platform docker \
  --region us-east-1 \
  --elb-type application

# This will take 5-10 minutes
# It will:
# - Create EC2 instance
# - Create Application Load Balancer
# - Deploy your Docker container
# - Configure security groups
```

**You'll see output like:**
```
Creating application version archive "app-xxxx".
Uploading crm-backend/app-xxxx.zip to S3...
Environment details for: crm-backend-prod
  Application name: crm-backend
  Region: us-east-1
  Deployed Version: app-xxxx
  Environment ID: e-xxxxxxxxxx
  Platform: arn:aws:elasticbeanstalk:us-east-1::platform/Docker running on 64bit Amazon Linux 2/x.x.x
  Tier: WebServer-Standard-1.0
  CNAME: crm-backend-prod.us-east-1.elasticbeanstalk.com
  Updated: 2024-xx-xx xx:xx:xx
Printing Status:
2024-xx-xx xx:xx:xx    INFO    createEnvironment is starting.
2024-xx-xx xx:xx:xx    INFO    Using elasticbeanstalk-us-east-1-xxxxxx as Amazon S3 storage bucket.
...
```

**Wait for completion:**
```
2024-xx-xx xx:xx:xx    INFO    Successfully launched environment: crm-backend-prod
```

### Step 3.3: Set Environment Variables

```bash
# Set all environment variables
eb setenv \
  SPRING_DATA_MONGODB_URI="mongodb+srv://dev_divisha_app:Divisha%40123@cluster0.btsspaw.mongodb.net/crm_prod?appName=Cluster0" \
  JWT_SECRET="p8wtD7ADE1hGQBnoD9zxc+YkWYXiWrjmbwhKnatRXZaUoq77/0/dQhmWVd+6bl1Vj4VVKKv2Cim/EKKOnMskXw==" \
  CORS_ALLOWED_ORIGINS="https://*.ascendons.com,https://ascendons.com" \
  SPRING_PROFILES_ACTIVE="prod" \
  PORT="5000"

# This will restart your environment
```

### Step 3.4: Get Your Backend URL

```bash
# Get environment info
eb status

# Look for:
# CNAME: crm-backend-prod.us-east-1.elasticbeanstalk.com
```

**Save this URL! You'll need it for:**
- Frontend configuration
- DNS setup
- Testing

### Step 3.5: Test Backend

```bash
# Get the URL
BACKEND_URL=$(eb status | grep CNAME | awk '{print $2}')

# Test health endpoint
curl http://$BACKEND_URL/api/v1/actuator/health

# Should return:
# {"status":"UP"}
```

**If health check fails:**
```bash
# View logs
eb logs

# Common issues:
# - MongoDB connection failed: Check connection string
# - Port mismatch: Ensure PORT=5000 in env vars
# - Build failed: Check Docker build
```

---

## Phase 4: Setup Wildcard Subdomains (30 minutes)

Now let's configure your domain to support multi-tenant subdomains.

### Step 4.1: Get Your Domain Ready

**You need:**
- Domain name (e.g., ascendons.com)
- Access to domain registrar (GoDaddy, Namecheap, etc.)

### Step 4.2: Run Wildcard Subdomain Setup

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/aws

# Set your domain
export DOMAIN="ascendons.com"  # Change this to your domain

# Run the automated setup
./setup-subdomain-infrastructure.sh
```

**The script will:**
1. ✅ Create Route 53 hosted zone
2. ✅ Show you nameservers to update
3. ⏸️ **PAUSE** - You update nameservers at registrar
4. ✅ Request wildcard SSL certificate
5. ✅ Show you validation records
6. ⏸️ **PAUSE** - You add validation records
7. ✅ Wait for SSL validation (5-30 minutes)
8. ✅ Configure load balancer for HTTPS
9. ✅ Create wildcard DNS records

**When it pauses, follow the on-screen instructions.**

### Step 4.3: Update Nameservers (During script pause)

The script will show you 4 nameservers like:
```
ns-123.awsdns-45.com
ns-678.awsdns-90.net
ns-234.awsdns-56.org
ns-789.awsdns-01.co.uk
```

**Go to your domain registrar:**

**GoDaddy:**
1. Login → My Products → Domains
2. Click on ascendons.com → Manage DNS
3. Nameservers → Change
4. Select "Custom"
5. Add all 4 nameservers
6. Save

**Namecheap:**
1. Login → Domain List
2. Click "Manage" next to ascendons.com
3. Nameservers → Custom DNS
4. Add all 4 nameservers
5. Save

**Route 53 (if domain is there):**
- Already done automatically! ✅

**Press Enter in the script after updating nameservers**

### Step 4.4: SSL Certificate Validation (During script pause)

The script will show validation records. **Easiest way:**

1. Go to AWS Console: https://console.aws.amazon.com/acm
2. Find your certificate
3. Click "Create records in Route 53" button
4. Click "Create records"
5. Wait 5-30 minutes

**Press Enter in the script after adding records**

### Step 4.5: Verify Setup

After script completes:

```bash
# Wait 2-5 minutes for DNS propagation

# Test main domain
curl https://ascendons.com/api/v1/actuator/health

# Test subdomain
curl https://test.ascendons.com/api/v1/actuator/health

# Both should return:
# {"status":"UP"}
```

---

## Phase 5: Deploy Frontend to AWS Amplify (30 minutes)

### Step 5.1: Update Frontend Environment

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/frontend

# Get your backend URL
cd ../backend
BACKEND_URL=$(eb status | grep CNAME | awk '{print $2}')

# Update frontend .env.production
cd ../frontend
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://$BACKEND_URL/api/v1
NEXT_PUBLIC_APP_URL=https://ascendons.com
NODE_ENV=production
EOF
```

### Step 5.2: Initialize Amplify

```bash
# Make sure you're in frontend directory
cd /Users/pankajthakur/IdeaProjects/CRM/frontend

# Initialize Amplify
amplify init

# You'll be prompted:
# 1. Enter a name for the project: crm-frontend
# 2. Initialize the project with the above configuration? Y
# 3. Select the authentication method: AWS profile
# 4. Please choose the profile: default
```

### Step 5.3: Add Hosting

```bash
# Add hosting to Amplify
amplify add hosting

# You'll be prompted:
# 1. Select the plugin module to execute: Hosting with Amplify Console
# 2. Choose a type: Manual deployment
```

### Step 5.4: Deploy Frontend

```bash
# Build and deploy
amplify publish

# This will:
# - Install dependencies
# - Build your Next.js app
# - Deploy to Amplify
# - Give you a URL
```

**You'll get a URL like:**
```
https://dev.xxxxxxxxxx.amplifyapp.com
```

### Step 5.5: Configure Custom Domain in Amplify

**Option 1: Via Amplify Console (Easier)**

1. Go to: https://console.aws.amazon.com/amplify
2. Click your app → Domain Management
3. Add domain: `ascendons.com`
4. Add subdomain pattern: `*.ascendons.com`
5. Amplify will configure SSL automatically

**Option 2: Via CLI**
```bash
# This is complex, use the console for now
```

---

## Phase 6: Update CORS and Test (15 minutes)

### Step 6.1: Update Backend CORS

Your backend is now deployed, update CORS to accept frontend:

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend

# Update CORS to include your domains
eb setenv CORS_ALLOWED_ORIGINS="https://*.ascendons.com,https://ascendons.com,https://dev.xxxxxxxxxx.amplifyapp.com"

# Wait for environment to restart (2-3 minutes)
eb health
```

### Step 6.2: Full System Test

**Test 1: Backend Health**
```bash
curl https://ascendons.com/api/v1/actuator/health
# Expected: {"status":"UP"}
```

**Test 2: Subdomain**
```bash
curl https://test.ascendons.com/api/v1/actuator/health
# Expected: {"status":"UP"}
```

**Test 3: Frontend**
```bash
# Open in browser
open https://ascendons.com

# Should load your frontend
```

**Test 4: Multi-Tenancy**
```bash
# Open in browser
open https://ascendons.com/register

# Register a new organization:
# - Organization: Wattglow
# - Subdomain: wattglow
# - After registration, should redirect to:
# https://wattglow.ascendons.com
```

---

## Phase 7: Monitoring & Maintenance

### View Logs

**Backend Logs:**
```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend

# View recent logs
eb logs

# Stream logs (real-time)
eb logs --stream
```

**Frontend Logs:**
- Go to Amplify Console → Your App → Logs

### Monitor Health

```bash
# Check backend health
eb health

# Expected output:
# crm-backend-prod                          Ok
```

### Update Backend

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/backend

# Make code changes
# ...

# Deploy update
eb deploy

# This will:
# - Build new Docker image
# - Deploy to Elastic Beanstalk
# - Zero downtime (rolling update)
```

### Update Frontend

```bash
cd /Users/pankajthakur/IdeaProjects/CRM/frontend

# Make code changes
# ...

# Deploy update
amplify publish
```

---

## Cost Tracking

### View Current Costs

**AWS Console:**
1. Go to: https://console.aws.amazon.com/billing
2. Bills → Current month
3. Check services:
   - Elastic Beanstalk (EC2)
   - Elastic Load Balancing
   - Amplify
   - Route 53

**Expected Monthly Cost:**
```
EC2 (t3.small):              $15.00
Application Load Balancer:   $16.20
Amplify:                     $3.50
Route 53:                    $0.90
Data Transfer:               $1.00
                            -------
TOTAL:                       $36.60/month
```

**Plus MongoDB Atlas (if not using free tier):**
```
M10 Cluster:                 $57.00
                            -------
GRAND TOTAL:                 $93.60/month
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
eb logs

# Common issues:
# 1. MongoDB connection failed
#    Fix: Check SPRING_DATA_MONGODB_URI
#
# 2. Port mismatch
#    Fix: Ensure PORT=5000
#
# 3. Docker build failed
#    Fix: Check Dockerfile, run local build
```

### SSL not working

```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Check certificate validation
aws acm describe-certificate \
  --certificate-arn <ARN> \
  --region us-east-1

# If stuck, add validation records manually
```

### Subdomain not resolving

```bash
# Check DNS propagation
dig wattglow.ascendons.com
dig ascendons.com

# Check Route 53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id <ID> \
  --query "ResourceRecordSets[?Name=='*.ascendons.com.']"
```

### Frontend not loading

```bash
# Check Amplify deployment
amplify status

# Redeploy
amplify publish

# Check browser console for errors
```

---

## Summary

You've deployed:
- ✅ Backend on Elastic Beanstalk
- ✅ Frontend on AWS Amplify
- ✅ Wildcard SSL for all subdomains
- ✅ Multi-tenant architecture

**Your URLs:**
- Main site: `https://ascendons.com`
- API: `https://ascendons.com/api/v1`
- Tenant 1: `https://wattglow.ascendons.com`
- Tenant 2: `https://acme.ascendons.com`

**Monthly Cost: $37-94**

---

## Next Steps

1. **Monitor your application**
   - Set up CloudWatch alarms
   - Monitor costs

2. **Optimize performance**
   - Enable caching
   - Optimize database queries

3. **Plan for scale**
   - When you hit 10-20 organizations
   - Upgrade to Tier 2 (ECS Fargate)

4. **Add features**
   - Custom branding per tenant
   - Usage analytics
   - Billing integration

---

## Quick Reference Commands

```bash
# Backend
cd backend
eb status              # Check status
eb logs                # View logs
eb deploy              # Deploy updates
eb health              # Check health

# Frontend
cd frontend
amplify status         # Check status
amplify publish        # Deploy updates

# Monitoring
aws cloudwatch get-metric-statistics ...  # View metrics
```

Congratulations! Your multi-tenant CRM is now live on AWS! 🎉
