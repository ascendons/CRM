# Migration Guide: Elastic Beanstalk → EC2

## Overview

This guide will help you migrate your CRM application from AWS Elastic Beanstalk to EC2 with **zero downtime** and **no database migration** (since you're using MongoDB Atlas).

### Current Setup
- **Compute**: AWS Elastic Beanstalk (Amazon Linux 2)
- **Database**: MongoDB Atlas (cloud-hosted)
- **Users**: 3 active users
- **Domains**: crm.ascendons.com, api.ascendons.com

### Target Setup
- **Compute**: Single EC2 instance (t3.small)
- **Database**: MongoDB Atlas (same, no changes)
- **Cost Savings**: ~$40-90/month

---

## Phase 1: Prepare EC2 Instance

### Step 1.1: Launch EC2 Instance

**Via AWS Console:**

1. Go to EC2 Dashboard → Launch Instance
2. Configure:
   - **Name**: `crm-production`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: `t3.small` (2 vCPU, 2GB RAM)
   - **Key Pair**: Create new or use existing
   - **Network Settings**:
     - Auto-assign public IP: Enable
     - Security Group: Create new
       - SSH (22): Your IP only
       - HTTP (80): 0.0.0.0/0
       - HTTPS (443): 0.0.0.0/0
   - **Storage**: 20GB gp3 SSD
3. Launch Instance

### Step 1.2: Allocate Elastic IP

1. EC2 → Elastic IPs → Allocate Elastic IP
2. Select the new IP → Actions → Associate
3. Associate with your `crm-production` instance
4. Note the Elastic IP (e.g., `54.123.45.67`)

### Step 1.3: Setup EC2 Instance

**From your local machine:**

```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ubuntu@<ELASTIC-IP>

# Copy setup script (or manually upload)
# Then run:
chmod +x setup-ec2.sh
./setup-ec2.sh

# Logout and login again (to apply docker group)
logout
ssh -i ~/.ssh/your-key.pem ubuntu@<ELASTIC-IP>
```

---

## Phase 2: Deploy Application to EC2

### Step 2.1: Update JWT Secret

**On EC2:**
```bash
cd ~/crm
nano .env

# Update JWT_SECRET to match your production secret
JWT_SECRET=your-actual-production-jwt-secret-here
```

### Step 2.2: Deploy from Local Machine

**From your project directory:**

```bash
# Deploy to EC2
./deploy-to-ec2.sh <ELASTIC-IP>

# Example:
./deploy-to-ec2.sh 54.123.45.67
```

This will:
- Copy your application files
- Build Docker images
- Start all containers
- Show container status

### Step 2.3: Verify Deployment

**Check services are running:**

```bash
# SSH to EC2
ssh -i ~/.ssh/your-key.pem ubuntu@<ELASTIC-IP>

# Check container status
cd ~/crm
sudo docker-compose -f docker-compose.ec2.yml ps

# Expected output:
# crm-backend    running    healthy
# crm-frontend   running    healthy
# crm-nginx      running    Up
```

**View logs:**
```bash
# All services
sudo docker-compose -f docker-compose.ec2.yml logs -f

# Specific service
sudo docker-compose -f docker-compose.ec2.yml logs -f backend
```

---

## Phase 3: Test on EC2

### Step 3.1: Test via IP Address

**Using EC2 Elastic IP:**

1. **Frontend**: `http://<ELASTIC-IP>`
2. **Backend**: `http://<ELASTIC-IP>:8080/api/v1/actuator/health`

### Step 3.2: Testing Checklist

**Test all critical features:**

- [ ] **Authentication**
  - [ ] Login with existing user
  - [ ] Logout
  - [ ] Session persistence

- [ ] **Lead Management**
  - [ ] View leads list
  - [ ] Create new lead
  - [ ] Edit existing lead
  - [ ] Delete lead
  - [ ] Search leads

- [ ] **Contact Management**
  - [ ] View contacts
  - [ ] Create contact
  - [ ] Edit contact
  - [ ] Link to account

- [ ] **Account Management**
  - [ ] View accounts
  - [ ] Create account
  - [ ] Edit account

- [ ] **Opportunity Management**
  - [ ] View opportunities
  - [ ] Create opportunity
  - [ ] Update stage
  - [ ] Close opportunity

- [ ] **Performance**
  - [ ] Pages load quickly
  - [ ] No console errors
  - [ ] Forms submit properly

### Step 3.3: Have All 3 Users Test

**Share test URL with your users:**
```
Test Environment: http://<ELASTIC-IP>
Login with your normal credentials
```

**During testing:**
- ✅ Elastic Beanstalk still running (production)
- ✅ EC2 running (testing)
- ✅ Both use same MongoDB Atlas database
- ✅ All data synced automatically

---

## Phase 4: Configure SSL (Optional but Recommended)

### Using Let's Encrypt (Free SSL)

**On EC2:**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Stop nginx container temporarily
cd ~/crm
sudo docker-compose -f docker-compose.ec2.yml stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
  -d crm.ascendons.com \
  -d api.ascendons.com \
  --email your-email@example.com \
  --agree-tos

# Copy certificates to nginx directory
sudo mkdir -p ~/crm/nginx/ssl
sudo cp /etc/letsencrypt/live/crm.ascendons.com/fullchain.pem ~/crm/nginx/ssl/
sudo cp /etc/letsencrypt/live/crm.ascendons.com/privkey.pem ~/crm/nginx/ssl/

# Update nginx config for SSL
# (You'll need to update nginx/nginx.conf)

# Restart nginx
sudo docker-compose -f docker-compose.ec2.yml up -d nginx
```

---

## Phase 5: Switch DNS (Go Live)

### Step 5.1: Update DNS Records

**In your DNS provider (Route53, Cloudflare, etc.):**

**Before (pointing to EBS):**
```
A Record: crm.ascendons.com  → <OLD-EBS-IP>
A Record: api.ascendons.com  → <OLD-EBS-IP>
```

**After (pointing to EC2):**
```
A Record: crm.ascendons.com  → <NEW-EC2-ELASTIC-IP>
A Record: api.ascendons.com  → <NEW-EC2-ELASTIC-IP>
```

**Set TTL to 300 seconds (5 minutes) for faster propagation**

### Step 5.2: Monitor During Switch

**Watch logs on EC2:**
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@<ELASTIC-IP>
cd ~/crm
sudo docker-compose -f docker-compose.ec2.yml logs -f
```

**Check for:**
- ✅ Successful login attempts
- ✅ API requests succeeding
- ❌ Error messages
- ❌ Connection issues

### Step 5.3: Verify Switch Complete

**Check DNS propagation:**
```bash
# From your local machine
dig crm.ascendons.com +short
# Should show: <NEW-EC2-ELASTIC-IP>

nslookup crm.ascendons.com
# Should resolve to EC2 IP
```

**Test from browser:**
1. Clear browser cache
2. Visit `https://crm.ascendons.com`
3. Login and test features
4. Ask all 3 users to verify

---

## Phase 6: Monitor & Keep EBS as Backup

### Week 1-2 After Switch

**Monitor EC2:**
```bash
# Check disk space
df -h

# Check memory
free -h

# Check container health
docker-compose -f docker-compose.ec2.yml ps

# Check logs for errors
docker-compose -f docker-compose.ec2.yml logs --tail=100 | grep -i error
```

**Keep Elastic Beanstalk running as backup:**
- Don't terminate yet
- If issues on EC2, you can quickly roll back by changing DNS
- Cost: ~$50-100/month (temporary)

---

## Phase 7: Shutdown Elastic Beanstalk

### After 1-2 Weeks of Stable EC2

**When you're confident:**

1. **Create final backup:**
   ```bash
   # On EC2
   cd ~/crm
   sudo docker-compose -f docker-compose.ec2.yml exec backend \
     java -jar /app/app.jar --export-backup
   ```

2. **Terminate Elastic Beanstalk:**
   - Go to Elastic Beanstalk Console
   - Select your environment
   - Actions → Terminate Environment
   - Confirm termination

3. **Clean up related resources:**
   - [ ] Delete unused Load Balancers
   - [ ] Delete unused Security Groups
   - [ ] Delete unused S3 buckets (if any)
   - [ ] Delete unused CloudWatch Log Groups

---

## Rollback Plan (If Needed)

**If you need to rollback to Elastic Beanstalk:**

1. **Switch DNS back:**
   ```
   A Record: crm.ascendons.com  → <OLD-EBS-IP>
   A Record: api.ascendons.com  → <OLD-EBS-IP>
   ```

2. **Wait 5-10 minutes for DNS propagation**

3. **Verify users can access EBS**

4. **Investigate EC2 issues at your leisure**

**Remember:** Both EC2 and EBS use the same MongoDB Atlas, so no data is lost!

---

## Troubleshooting

### Container Won't Start

```bash
# View detailed logs
sudo docker-compose -f docker-compose.ec2.yml logs backend

# Restart specific service
sudo docker-compose -f docker-compose.ec2.yml restart backend

# Rebuild and restart
sudo docker-compose -f docker-compose.ec2.yml up -d --build backend
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Upgrade instance if needed:
# Stop services → Change instance type to t3.medium → Start services
```

### Cannot Connect to MongoDB

```bash
# Test MongoDB connection
sudo docker-compose -f docker-compose.ec2.yml exec backend \
  wget -O- https://cluster0.btsspaw.mongodb.net

# Check environment variables
sudo docker-compose -f docker-compose.ec2.yml exec backend env | grep MONGO
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Cost Comparison

### Current (Elastic Beanstalk)
- EBS Environment: ~$50-100/month
- MongoDB Atlas: ~$0-60/month
- **Total: $50-160/month**

### After Migration (EC2)
- EC2 t3.small: ~$15/month
- Elastic IP: Free (when attached)
- Storage (20GB): ~$2/month
- Data Transfer: ~$5/month
- MongoDB Atlas: ~$0-60/month (same)
- **Total: $22-82/month**

### Savings
- **Monthly: $28-78**
- **Yearly: $336-936**

---

## Support

If you encounter issues:

1. Check logs: `sudo docker-compose -f docker-compose.ec2.yml logs -f`
2. Check container status: `sudo docker-compose -f docker-compose.ec2.yml ps`
3. Restart services: `sudo docker-compose -f docker-compose.ec2.yml restart`
4. Full rebuild: `sudo docker-compose -f docker-compose.ec2.yml up -d --build`

---

## Timeline Summary

| Phase | Duration | Risk | Action |
|-------|----------|------|--------|
| 1. Launch EC2 | 30 mins | None | Setup instance |
| 2. Deploy App | 1 hour | None | Deploy & build |
| 3. Test | 1-3 days | None | All users test |
| 4. Configure SSL | 30 mins | None | Optional |
| 5. Switch DNS | 15 mins | Low | Go live |
| 6. Monitor | 1-2 weeks | Low | Keep EBS running |
| 7. Shutdown EBS | 5 mins | None | Terminate EBS |

**Total active work time: ~3 hours**
**Total calendar time: 2-3 weeks (including monitoring)**

Good luck with your migration! 🚀
