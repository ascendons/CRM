# AWS Deployment - Quick Start Guide

## 🚀 Fastest Way to Deploy (3 Options)

### **Option 1: Elastic Beanstalk (Easiest - No Docker Knowledge Required)**

**Best for**: Quick deployment, small teams, getting started
**Time**: ~1 hour
**Cost**: ~$15-30/month

```bash
# 1. Setup MongoDB Atlas
#    Go to https://cloud.mongodb.com
#    Create M0 free cluster or M10 ($57/month)
#    Get connection string

# 2. Install Elastic Beanstalk CLI
pip install awsebcli

# 3. Deploy Backend
cd backend
eb init -p docker crm-backend --region us-east-1
eb create crm-backend-prod

# 4. Set environment variables
eb setenv \
  SPRING_DATA_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/crm_production" \
  JWT_SECRET="$(openssl rand -hex 64)" \
  CORS_ALLOWED_ORIGINS="https://yourdomain.com"

# 5. Deploy
eb deploy

# 6. Get URL
eb status
```

---

### **Option 2: AWS Amplify + ECS (Recommended for Production)**

**Best for**: Scalable production apps, CI/CD needed
**Time**: ~2-3 hours
**Cost**: ~$100-150/month

```bash
# 1. Setup MongoDB Atlas (same as above)

# 2. Setup AWS credentials
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1

# 3. Run setup script
cd aws
./setup-aws-infrastructure.sh
# Follow the prompts

# 4. Deploy backend
cd ..
./deploy-aws.sh backend

# 5. Deploy frontend to Amplify
cd frontend
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

---

### **Option 3: Manual AWS Console (Full Control)**

**Best for**: Learning AWS, custom requirements
**Time**: ~3-4 hours
**Cost**: ~$100-150/month

See detailed steps in `AWS_DEPLOYMENT_GUIDE.md`

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] Docker installed (for Option 2)
- [ ] Node.js 18+ installed
- [ ] Java 17 installed
- [ ] MongoDB Atlas account (or AWS DocumentDB)

---

## 🔧 Environment Variables Reference

### Backend Required Variables

```bash
SPRING_DATA_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/crm_production"
JWT_SECRET="your-256-bit-secret-key"
CORS_ALLOWED_ORIGINS="https://yourdomain.com"
PORT=5000  # AWS will override this
```

### Frontend Required Variables

```bash
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

---

## 💰 Cost Breakdown

### Minimal Setup (~$20/month)
- MongoDB Atlas M0: **FREE**
- Elastic Beanstalk t3.micro: **$10-15**
- AWS Amplify: **$5-10**
- **Total: ~$20/month**

### Production Setup (~$120/month)
- MongoDB Atlas M10: **$57**
- ECS Fargate (2 tasks): **$30-40**
- AWS Amplify: **$20**
- CloudFront: **$10**
- **Total: ~$120/month**

### Enterprise Setup (~$300+/month)
- MongoDB Atlas M20: **$80**
- ECS Fargate (4+ tasks): **$80-120**
- Amplify + custom domain: **$30**
- WAF + security: **$50**
- CloudWatch monitoring: **$20**
- **Total: ~$280-320/month**

---

## 🎯 Step-by-Step: Recommended Path

### Step 1: Setup MongoDB Atlas (15 minutes)

1. Go to https://cloud.mongodb.com
2. Sign up / Log in
3. Build a Database
   - Cloud Provider: **AWS**
   - Region: **us-east-1** (same as your app)
   - Tier: **M0 FREE** (for testing) or **M10** (for production)
4. Create Database User
   - Username: `crm_admin`
   - Password: Generate strong password
5. Network Access
   - Add IP: `0.0.0.0/0` (temporary - restrict later)
6. Get Connection String
   ```
   mongodb+srv://crm_admin:<password>@cluster.mongodb.net/crm_production
   ```

### Step 2: Configure AWS (10 minutes)

```bash
# Install AWS CLI (if not already)
brew install awscli  # macOS
# OR
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output: json

# Get your AWS Account ID
aws sts get-caller-identity
export AWS_ACCOUNT_ID=<your-account-id>
```

### Step 3: Deploy Backend (30 minutes)

**Option A: Using Elastic Beanstalk (Easier)**

```bash
cd backend

# Initialize EB
eb init

# Create environment
eb create crm-backend-prod \
  --instance-type t3.small \
  --platform docker

# Set environment variables
eb setenv \
  SPRING_DATA_MONGODB_URI="mongodb+srv://crm_admin:PASSWORD@cluster.mongodb.net/crm_production" \
  JWT_SECRET="$(openssl rand -hex 64)" \
  CORS_ALLOWED_ORIGINS="https://yourdomain.com"

# Deploy
eb deploy

# Check status
eb status
eb open
```

**Option B: Using ECS (More Scalable)**

```bash
# Run setup script
cd aws
./setup-aws-infrastructure.sh

# Deploy using script
cd ..
export AWS_ACCOUNT_ID=your-account-id
./deploy-aws.sh backend
```

### Step 4: Deploy Frontend (30 minutes)

**Option A: Using AWS Amplify (Recommended)**

```bash
cd frontend

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init
# Choose:
# - Name: crm-frontend
# - Environment: prod
# - Default editor: your choice
# - AWS Profile: default

# Add hosting
amplify add hosting
# Choose: Hosting with Amplify Console

# Set environment variables (in Amplify Console or .env.production)
# NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1

# Publish
amplify publish
```

**Option B: Connect GitHub for Auto-Deployment**

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect GitHub
4. Select repository and branch
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_APP_URL`
6. Deploy

### Step 5: Configure Domain (Optional - 30 minutes)

```bash
# 1. Purchase domain (GoDaddy, Namecheap, or Route 53)

# 2. Request SSL certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# 3. Create Route 53 hosted zone
aws route53 create-hosted-zone --name yourdomain.com

# 4. Update nameservers at domain registrar

# 5. Add DNS records
# - A record: api.yourdomain.com → Load Balancer
# - A record: yourdomain.com → Amplify/CloudFront
```

---

## 🧪 Testing Your Deployment

```bash
# Test backend health
curl https://your-backend-url.com/api/v1/actuator/health

# Test backend API
curl https://your-backend-url.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test frontend
open https://your-frontend-url.com
```

---

## 📊 Monitoring & Logs

### View Backend Logs

**Elastic Beanstalk:**
```bash
eb logs
eb logs --stream
```

**ECS:**
```bash
aws logs tail /ecs/crm-backend --follow
```

### View Frontend Logs

**Amplify:**
- Go to Amplify Console → Your App → Logs

### CloudWatch Monitoring

```bash
# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=crm-backend-service \
  --statistics Average \
  --start-time 2024-02-01T00:00:00Z \
  --end-time 2024-02-01T23:59:59Z \
  --period 3600
```

---

## 🔒 Security Best Practices

1. **Use Secrets Manager** (instead of environment variables)
   ```bash
   aws secretsmanager create-secret \
     --name crm/mongodb-uri \
     --secret-string "mongodb+srv://..."
   ```

2. **Restrict MongoDB IP Whitelist**
   - Remove `0.0.0.0/0`
   - Add specific AWS IP ranges

3. **Enable HTTPS**
   - Request ACM certificate
   - Configure ALB/CloudFront to use HTTPS

4. **Set up WAF** (Web Application Firewall)
   ```bash
   aws wafv2 create-web-acl --name crm-waf --scope REGIONAL
   ```

5. **Enable CloudWatch Alarms**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name high-cpu \
     --alarm-description "Alert when CPU > 80%" \
     --metric-name CPUUtilization \
     --threshold 80
   ```

---

## 🔄 CI/CD Setup (GitHub Actions)

The project includes `.github/workflows/deploy-aws.yml` for automatic deployment.

**Setup:**

1. Add GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `NEXT_PUBLIC_API_URL`

2. Commit with triggers:
   ```bash
   git commit -m "[backend] Update backend code"
   git commit -m "[frontend] Update frontend code"
   git commit -m "[all] Update full stack"
   git push
   ```

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
eb logs
# Or
aws logs tail /ecs/crm-backend --follow

# Common issues:
# - MongoDB connection string incorrect
# - Environment variables not set
# - Port mismatch (backend expects 5000, not 8080)
```

### Frontend build fails
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### CORS errors
```bash
# Update backend CORS_ALLOWED_ORIGINS
eb setenv CORS_ALLOWED_ORIGINS="https://your-frontend-url.com"
```

### MongoDB connection fails
```bash
# Check MongoDB Atlas:
# 1. IP whitelist includes 0.0.0.0/0
# 2. Database user exists
# 3. Connection string is correct
# 4. Network access is enabled
```

---

## 📞 Support

- AWS Documentation: https://docs.aws.amazon.com
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Elastic Beanstalk: https://docs.aws.amazon.com/elasticbeanstalk
- AWS Amplify: https://docs.amplify.aws

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] AWS CLI configured
- [ ] Environment variables set
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Custom domain configured (optional)
- [ ] SSL certificate installed
- [ ] Monitoring and alarms set up
- [ ] Backup strategy configured
- [ ] CI/CD pipeline working

---

## 🎉 You're Done!

Your CRM application should now be running on AWS!

**Next Steps:**
- Monitor your application
- Set up automated backups
- Configure auto-scaling
- Add custom domain
- Enable CloudWatch alarms
- Implement proper security measures
