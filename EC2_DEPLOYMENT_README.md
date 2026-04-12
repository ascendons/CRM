# EC2 Deployment - Quick Reference

## Files Created

```
CRM/
├── docker-compose.ec2.yml     # Docker Compose config for EC2 (no MongoDB needed!)
├── setup-ec2.sh               # Run on EC2 to install Docker & dependencies
├── deploy-to-ec2.sh           # Run locally to deploy app to EC2
├── MIGRATION_GUIDE.md         # Complete step-by-step migration guide
└── EC2_DEPLOYMENT_README.md   # This file
```

---

## Quick Start (3 Steps)

### Step 1: Launch EC2 Instance

**AWS Console:**
- Instance Type: `t3.micro` (⚠️ 1GB RAM - may be tight for Java + Next.js)
- OS: Ubuntu 22.04 LTS
- Storage: 20GB
- Security Groups: Allow 22, 80, 443
- Allocate Elastic IP

### Step 2: Setup EC2

**From EC2 instance:**
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@<EC2-IP>

# Upload and run setup script
# (or use deploy script from step 3 which copies everything)
chmod +x setup-ec2.sh
./setup-ec2.sh

# Logout and login again
logout
ssh -i your-key.pem ubuntu@<EC2-IP>
```

### Step 3: Deploy Application

**From your local machine:**
```bash
cd /path/to/CRM

# Deploy to EC2
./deploy-to-ec2.sh <EC2-IP>

# Example:
./deploy-to-ec2.sh 54.123.45.67
```

**That's it!** Your app is now running on EC2.

---

## Testing

**Access via EC2 IP:**
- Frontend: `http://<EC2-IP>`
- Backend: `http://<EC2-IP>:8080/api/v1`

**Login with existing credentials** - same database (MongoDB Atlas)!

---

## Key Points

### ✅ No Database Migration
- You're using MongoDB Atlas (cloud-hosted)
- Both EBS and EC2 can use the **same database**
- No data migration needed
- Zero data loss risk

### ✅ Safe Parallel Testing
```
┌─────────────┐     ┌──────────────┐
│     EBS     │────▶│ MongoDB Atlas│◀────┐
│  (Current)  │     │   (Shared)   │     │
└─────────────┘     └──────────────┘     │
                                          │
┌─────────────┐                          │
│  EC2 (Test) │──────────────────────────┘
└─────────────┘
```

Both systems write to same database:
- ✅ All changes sync automatically
- ✅ Users can test EC2 without data issues
- ✅ Easy rollback (just change DNS back)

### ✅ Cost Savings

**Before (EBS):** ~$50-100/month
**After (EC2 t3.micro):** ~$8-12/month
**Savings:** ~$42-88/month ($504-1056/year)

---

## Common Commands

### Check Status
```bash
ssh ubuntu@<EC2-IP>
cd ~/crm
sudo docker-compose -f docker-compose.ec2.yml ps
```

### View Logs
```bash
# All services
sudo docker-compose -f docker-compose.ec2.yml logs -f

# Specific service
sudo docker-compose -f docker-compose.ec2.yml logs -f backend
sudo docker-compose -f docker-compose.ec2.yml logs -f frontend
```

### Restart Services
```bash
# Restart all
sudo docker-compose -f docker-compose.ec2.yml restart

# Restart specific service
sudo docker-compose -f docker-compose.ec2.yml restart backend
```

### Rebuild & Restart
```bash
# Rebuild everything
sudo docker-compose -f docker-compose.ec2.yml up -d --build

# Rebuild specific service
sudo docker-compose -f docker-compose.ec2.yml up -d --build backend
```

### Stop Services
```bash
sudo docker-compose -f docker-compose.ec2.yml down
```

---

## DNS Switch (When Ready)

**Update your DNS records:**
```
OLD: crm.ascendons.com  → <EBS-IP>
NEW: crm.ascendons.com  → <EC2-ELASTIC-IP>

OLD: api.ascendons.com  → <EBS-IP>
NEW: api.ascendons.com  → <EC2-ELASTIC-IP>
```

**Wait 5-10 minutes**, then test:
```bash
dig crm.ascendons.com +short
# Should show EC2 IP
```

---

## Rollback (If Needed)

**Switch DNS back to EBS:**
```
crm.ascendons.com  → <OLD-EBS-IP>
api.ascendons.com  → <OLD-EBS-IP>
```

No data lost! (Same MongoDB Atlas database)

---

## Monitoring

### System Resources
```bash
# Memory usage
free -h

# Disk usage
df -h

# Container stats
docker stats
```

### Application Health
```bash
# Backend health check
curl http://localhost:8080/api/v1/actuator/health

# Frontend health check
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Container won't start?
```bash
# View detailed logs
sudo docker-compose -f docker-compose.ec2.yml logs backend

# Check if port is in use
sudo netstat -tulpn | grep :8080
```

### Out of memory?
```bash
# Check memory
free -h
docker stats

# Upgrade to t3.medium if needed
```

### Can't connect to MongoDB?
```bash
# Test connection
sudo docker-compose -f docker-compose.ec2.yml exec backend \
  env | grep MONGO
```

---

## Environment Variables

**Configured in docker-compose.ec2.yml:**
```yaml
SPRING_DATA_MONGODB_URI: mongodb+srv://...cluster0.btsspaw.mongodb.net/crm_prod
JWT_SECRET: (set in .env file on EC2)
CORS_ALLOWED_ORIGINS: https://crm.ascendons.com
```

**Update JWT_SECRET on EC2:**
```bash
cd ~/crm
nano .env
# Update JWT_SECRET to match production
```

---

## Security Checklist

- [ ] SSH key-based authentication (no passwords)
- [ ] Security Group: SSH only from your IP
- [ ] Security Group: HTTP/HTTPS from anywhere
- [ ] Firewall (UFW) enabled
- [ ] Regular system updates: `sudo apt-get update && sudo apt-get upgrade`
- [ ] MongoDB Atlas: IP whitelist configured
- [ ] SSL certificates installed (Let's Encrypt)

---

## Backup Strategy

### Application Backup
```bash
# On EC2
cd ~/crm
tar -czf backup-$(date +%Y%m%d).tar.gz \
  docker-compose.ec2.yml \
  nginx/ \
  .env

# Copy to S3 (optional)
aws s3 cp backup-*.tar.gz s3://your-backup-bucket/
```

### Database Backup
**MongoDB Atlas has automatic backups!**
- Check: Atlas Console → Clusters → Backup

---

## Next Steps

1. ✅ Deploy to EC2
2. ✅ Test with all 3 users (1-3 days)
3. ✅ Configure SSL (optional but recommended)
4. ✅ Switch DNS to EC2
5. ✅ Monitor for 1-2 weeks
6. ✅ Shut down Elastic Beanstalk

**See MIGRATION_GUIDE.md for detailed instructions**

---

## Support

**Issues during deployment?**

1. Check logs: `sudo docker-compose -f docker-compose.ec2.yml logs -f`
2. Check status: `sudo docker-compose -f docker-compose.ec2.yml ps`
3. Restart: `sudo docker-compose -f docker-compose.ec2.yml restart`
4. Rebuild: `sudo docker-compose -f docker-compose.ec2.yml up -d --build`

**MongoDB connection issues?**
- Verify MongoDB Atlas IP whitelist includes EC2's public IP
- Check connection string in docker-compose.ec2.yml

**Can't access via IP?**
- Check Security Group allows HTTP (80) and HTTPS (443)
- Check EC2 firewall: `sudo ufw status`

---

Good luck! 🚀
