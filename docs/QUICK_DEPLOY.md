# 🚀 Quick Deploy Guide

## 3 Easy Steps to Deploy Your CRM to Production

### Option 1: Render (Recommended - Easiest)

**Time:** 15 minutes | **Cost:** FREE or $14/month

```bash
# Run the automated script
./deploy-render.sh

# Follow the prompts to:
# 1. Set up MongoDB Atlas (free)
# 2. Push to GitHub
# 3. Deploy to Render
```

**What you get:**
- ✅ Both frontend & backend deployed
- ✅ Auto-scaling & HTTPS included
- ✅ Auto-deploy on git push
- ✅ FREE tier available

**See:** [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed guide

---

### Option 2: Docker (Full Control)

**Time:** 30 minutes | **Cost:** $10-50/month (VPS)

```bash
# 1. Set up environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 2. Deploy
./deploy.sh deploy

# Your app runs at:
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

**What you get:**
- ✅ Run anywhere (AWS, DigitalOcean, Azure)
- ✅ Full control over infrastructure
- ✅ Can run on your own servers

**See:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for all options

---

### Option 3: Manual Setup (Custom Infrastructure)

**Time:** 2-4 hours | **Cost:** Variable

See the complete guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

Choose from:
- AWS (EC2, ECS, Fargate)
- Google Cloud Platform
- Microsoft Azure
- DigitalOcean
- Self-hosted

---

## Quick Comparison

| Feature | Render | Docker | Manual |
|---------|--------|--------|--------|
| Setup Time | 15 min | 30 min | 2-4 hrs |
| Cost (Starter) | $14/mo | $10-50/mo | Variable |
| Maintenance | None | Low | High |
| Scaling | Auto | Manual | Manual |
| HTTPS/SSL | Free | Manual | Manual |
| CI/CD | Built-in | Custom | Custom |
| Best For | Getting started | Control | Enterprise |

---

## Prerequisites (All Options)

### 1. MongoDB Atlas (Free Tier Available)

```
1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create FREE M0 cluster (512 MB)
3. Create database user
4. Whitelist IP: 0.0.0.0/0
5. Get connection string
```

### 2. GitHub Account (Free)

```
1. Create account: https://github.com/join
2. Create repository for your CRM
3. Push your code
```

---

## Cost Breakdown

### Render (Recommended for Startups)
```
Tier          Monthly Cost    Best For
────────────────────────────────────────
Free          $0             Testing, demos
Starter       $14            Production (100-1000 users)
Standard      $50            Growing business (1000-10000 users)
Pro           $170           Enterprise (10000+ users)
```

### Docker on VPS
```
Provider           Monthly Cost    Resources
──────────────────────────────────────────────
DigitalOcean       $12            1 GB RAM, 1 CPU
AWS EC2 (t3.small) $15            2 GB RAM, 2 CPU
Azure B1MS         $18            2 GB RAM, 1 CPU
```

### Database (All Options)
```
MongoDB Atlas      Monthly Cost    Storage
──────────────────────────────────────────
M0 (Free)          $0             512 MB
M10                $57            10 GB
M20                $80            20 GB
```

---

## Post-Deployment

After deployment, test these features:

```bash
# Health check
curl https://your-backend-url/api/v1/actuator/health

# Register user
# Login
# Create lead
# Assign lead
# Check auto-assignment
```

---

## Support

- **Render Issues**: https://community.render.com
- **MongoDB Issues**: https://www.mongodb.com/community/forums
- **Application Issues**: Check logs in Render Dashboard

---

## Next Steps After Deployment

1. **Configure Custom Domain**
   - Add CNAME record
   - Enable in Render dashboard

2. **Set Up Monitoring**
   - Enable uptime monitoring (UptimeRobot)
   - Configure error tracking (Sentry)

3. **Enable Backups**
   - MongoDB Atlas: Auto-backups enabled on M10+
   - Application: Export data regularly

4. **Security Hardening**
   - Rotate JWT secret
   - Enable 2FA for admin accounts
   - Review CORS settings

5. **Performance Optimization**
   - Add Redis cache (Render add-on)
   - Enable CDN
   - Optimize database indexes

---

## Need Help?

- **Render Deployment**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- **All Deployment Options**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Docker Deployment**: Run `./deploy.sh`

---

**Ready to deploy? Run:**

```bash
./deploy-render.sh
```

🚀 **Good luck with your deployment!**
