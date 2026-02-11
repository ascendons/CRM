# 🚀 Deploy to Render - Complete Guide

Deploy your entire CRM application (Frontend + Backend) to Render in one click!

## Why Render?

✅ **Free tier available** (great for testing)
✅ **Auto-scaling** and HTTPS included
✅ **Git-based deployments** (auto-deploy on push)
✅ **One-click deployment** with Blueprint
✅ **Built-in CI/CD** pipeline
✅ **99.95% uptime SLA** (paid plans)

## 📋 Pre-Deployment Checklist

### 1. Create MongoDB Atlas Account (Free)

MongoDB Atlas provides a free tier perfect for getting started.

**Steps:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up (free)
3. Click **"Build a Database"**
4. Choose **M0 Free** tier
5. Select a cloud provider and region (choose same as Render - Oregon recommended)
6. Click **"Create"**
7. Create database user:
   - Username: `crm_user`
   - Password: Generate secure password (save it!)
8. Add IP to whitelist:
   - Click **"Network Access"** → **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click **"Confirm"**
9. Get connection string:
   - Click **"Database"** → **"Connect"** → **"Connect your application"**
   - Copy connection string:
   ```
   mongodb+srv://crm_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://crm_user:password@cluster0.xxxxx.mongodb.net/crm_production?retryWrites=true&w=majority`

### 2. Push Code to GitHub

```bash
# Initialize git (if not already)
cd /Users/pankajthakur/IdeaProjects/CRM
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for Render deployment"

# Create GitHub repository
# Go to https://github.com/new
# Create new repository: "crm-application"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/crm-application.git
git branch -M main
git push -u origin main
```

## 🎯 One-Click Deployment (Recommended)

### Step 1: Deploy with Blueprint

1. **Fork/Push your code to GitHub** (done above)

2. **Go to Render Dashboard**
   - Sign up at [Render](https://render.com) (free)
   - Click **"New +"** → **"Blueprint"**

3. **Connect Repository**
   - Connect your GitHub account
   - Select repository: `crm-application`
   - Click **"Connect"**

4. **Render will detect `render.yaml`**
   - It will show 2 services:
     - `crm-backend` (Web Service)
     - `crm-frontend` (Web Service)
   - Click **"Apply Blueprint"**

5. **Set Environment Variables**

   Render will prompt you to set required variables:

   **For `crm-backend`:**
   ```
   SPRING_DATA_MONGODB_URI = mongodb+srv://crm_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/crm_production?retryWrites=true&w=majority
   ```

   Click **"Deploy Blueprint"**

### Step 2: Wait for Deployment (5-10 minutes)

Render will:
1. ✅ Clone your repository
2. ✅ Build backend (compile Java)
3. ✅ Build frontend (compile Next.js)
4. ✅ Deploy both services
5. ✅ Assign URLs:
   - Backend: `https://crm-backend-xxxx.onrender.com`
   - Frontend: `https://crm-frontend-xxxx.onrender.com`

### Step 3: Verify Deployment

**Check Backend:**
```bash
curl https://crm-backend-xxxx.onrender.com/api/v1/actuator/health
# Should return: {"status":"UP"}
```

**Check Frontend:**
Open browser: `https://crm-frontend-xxxx.onrender.com`

### Step 4: Configure Custom Domain (Optional)

1. Go to **crm-frontend** service → **Settings** → **Custom Domain**
2. Add domain: `app.yourdomain.com`
3. Update DNS:
   ```
   Type: CNAME
   Name: app
   Value: crm-frontend-xxxx.onrender.com
   ```

## 🔧 Manual Deployment (Alternative)

If you prefer manual setup instead of Blueprint:

### Backend Deployment

1. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect repository
   - Name: `crm-backend`
   - Environment: **Docker**
   - Region: **Oregon**
   - Branch: `main`
   - Dockerfile Path: `./backend/Dockerfile`
   - Docker Context: `./backend`

2. **Configure Build**
   - Build Command: `./mvnw clean package -DskipTests`
   - Start Command: `java -Dspring.profiles.active=prod -jar target/backend-*.jar`

3. **Environment Variables**
   ```
   SPRING_PROFILES_ACTIVE = prod
   SPRING_DATA_MONGODB_URI = mongodb+srv://...
   JWT_SECRET = [Auto-generate in Render]
   SERVER_PORT = 8080
   ```

4. **Health Check**
   - Path: `/api/v1/actuator/health`

5. **Advanced Settings**
   - Plan: **Starter** ($7/month) or **Free** (limited)
   - Auto-Deploy: **Yes**

### Frontend Deployment

1. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect repository
   - Name: `crm-frontend`
   - Environment: **Node**
   - Region: **Oregon** (same as backend)
   - Branch: `main`
   - Root Directory: `frontend`

2. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Environment Variables**
   ```
   NODE_ENV = production
   NEXT_PUBLIC_API_URL = https://crm-backend-xxxx.onrender.com/api/v1
   NEXT_PUBLIC_APP_URL = https://crm-frontend-xxxx.onrender.com
   ```

   **⚠️ Important:** Update `NEXT_PUBLIC_API_URL` with actual backend URL after backend deploys!

4. **Advanced Settings**
   - Plan: **Starter** ($7/month) or **Free**
   - Auto-Deploy: **Yes**

## 🔄 Auto-Deployment Setup

Once configured, Render automatically deploys when you push to GitHub:

```bash
# Make changes to code
git add .
git commit -m "Add new feature"
git push origin main

# Render automatically detects changes and deploys!
# You'll receive email notification when deployment completes
```

## 📊 Monitoring & Logs

### View Logs

**Backend Logs:**
1. Go to Render Dashboard → `crm-backend`
2. Click **"Logs"** tab
3. Real-time logs appear here

**Frontend Logs:**
1. Go to Render Dashboard → `crm-frontend`
2. Click **"Logs"** tab

### Health Monitoring

Render automatically monitors health checks:
- If health check fails 3 times, service restarts
- Email notifications sent on failures

### Metrics (Paid Plans)

- CPU usage
- Memory usage
- Request rate
- Response times

## 💰 Pricing Tiers

### Free Tier
- **Cost:** $0/month
- **Limitations:**
  - Services spin down after 15 min inactivity
  - 750 hours/month total
  - Slower cold starts (10-30 seconds)
- **Best for:** Testing, demos, low-traffic apps

### Starter Tier (Recommended for Production)
- **Cost:** $7/service/month = **$14/month total**
- **Features:**
  - Always on (no spin down)
  - 512 MB RAM
  - 0.5 CPU
  - Custom domains
  - Auto-scaling
- **Best for:** Small to medium production apps

### Standard Tier
- **Cost:** $25/service/month = **$50/month total**
- **Features:**
  - 2 GB RAM
  - 1 CPU
  - Priority support
  - Zero-downtime deploys
- **Best for:** Growing businesses

### Pro Tier
- **Cost:** $85/service/month = **$170/month total**
- **Features:**
  - 8 GB RAM
  - 2 CPU
  - Advanced metrics
  - SLA: 99.95% uptime
- **Best for:** Enterprise applications

**Total Cost Comparison:**
```
Free:     $0/month    (+ MongoDB Atlas Free)
Starter:  $14/month   (+ MongoDB Atlas Free = $14/month)
Standard: $50/month   (+ MongoDB Atlas M10 $57 = $107/month)
Pro:      $170/month  (+ MongoDB Atlas M20 $80 = $250/month)
```

## 🔒 Security Best Practices

### 1. Environment Variables
Never commit secrets to Git:
- Store in Render environment variables
- Use Render's secret generation for JWT_SECRET

### 2. HTTPS
- Automatically enabled by Render
- Free SSL certificates
- Auto-renewal

### 3. CORS Configuration
Update backend CORS settings in Render:
```
CORS_ALLOWED_ORIGINS = https://crm-frontend-xxxx.onrender.com,https://app.yourdomain.com
```

### 4. Database Security
- MongoDB Atlas: Enable network whitelisting
- Use strong passwords
- Enable audit logging (paid tier)

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs:**
```
Render Dashboard → crm-backend → Logs
```

**Common issues:**
1. **MongoDB connection failed**
   - Verify `SPRING_DATA_MONGODB_URI` is correct
   - Check MongoDB Atlas IP whitelist (must include 0.0.0.0/0)
   - Test connection string locally

2. **Port binding error**
   - Render expects port 8080 (already configured)

3. **Out of memory**
   - Upgrade to Starter plan (512 MB)
   - Reduce JVM heap: `-Xmx400m`

### Frontend Won't Start

**Common issues:**
1. **Environment variables missing**
   - Verify `NEXT_PUBLIC_API_URL` is set
   - Must start with `https://`

2. **Build fails**
   - Check Node version (should be 18.x)
   - Clear build cache: Settings → Clear Build Cache

3. **API connection errors**
   - Verify CORS settings on backend
   - Check backend is running
   - Test API directly: `curl https://crm-backend-xxxx.onrender.com/api/v1/actuator/health`

### Free Tier Cold Starts

**Problem:** First request after inactivity takes 30+ seconds

**Solutions:**
1. Upgrade to Starter plan ($7/month per service)
2. Use uptime monitoring to ping every 10 minutes:
   - [UptimeRobot](https://uptimerobot.com) (free)
   - Configure monitor: `https://crm-backend-xxxx.onrender.com/api/v1/actuator/health`

### Database Connection Timeouts

**Solutions:**
1. Increase MongoDB Atlas tier (M10+)
2. Enable connection pooling (already configured)
3. Add retry logic (already configured)

## 🚀 Performance Optimization

### 1. Enable Caching

Add Redis on Render:
```yaml
# Add to render.yaml
- type: redis
  name: crm-cache
  plan: starter  # $7/month
  maxmemoryPolicy: allkeys-lru
```

Update backend environment:
```
SPRING_REDIS_HOST = [from Redis service]
SPRING_CACHE_TYPE = redis
```

### 2. CDN for Static Assets

Render automatically uses CDN for static files on paid plans.

### 3. Database Indexes

Run in MongoDB Atlas Shell:
```javascript
use crm_production

// User indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "tenantId": 1 })

// Lead indexes
db.leads.createIndex({ "tenantId": 1, "isDeleted": 1 })
db.leads.createIndex({ "email": 1, "tenantId": 1 })
db.leads.createIndex({ "assignedUserId": 1 })

// Role indexes
db.roles.createIndex({ "tenantId": 1, "isDeleted": 1 })
db.roles.createIndex({ "roleId": 1, "tenantId": 1 })
```

### 4. Connection Pooling

Already configured in `application.properties`:
```properties
spring.data.mongodb.min-pool-size=10
spring.data.mongodb.max-pool-size=50
```

## 📈 Scaling Strategy

### Horizontal Scaling

Render automatically scales based on traffic (Starter+ plans):
- Add more instances during high traffic
- Scale down during low traffic
- Configure in: Service → Settings → Scaling

### Database Scaling

MongoDB Atlas:
1. Start with M0 (Free)
2. Upgrade to M10 when you have 100+ users
3. Enable sharding at 10,000+ users

## 🔄 CI/CD Pipeline

Render automatically provides CI/CD:

```
git push → Render detects → Builds → Tests → Deploys
```

Add GitHub Actions for additional testing:

```yaml
# .github/workflows/render-deploy.yml
name: Render Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Backend Tests
        run: cd backend && ./mvnw test

      - name: Frontend Tests
        run: cd frontend && npm test

  # Render deploys automatically after tests pass
```

## 📞 Support

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Support Email: support@render.com (paid plans)

### Application Issues
- Check logs in Render Dashboard
- Monitor MongoDB Atlas metrics
- Enable error tracking (Sentry recommended)

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Backend health check passes
- [ ] Frontend loads successfully
- [ ] User registration works
- [ ] Login/logout works
- [ ] Lead creation works
- [ ] Auto-assignment configured
- [ ] CORS configured correctly
- [ ] Custom domain added (if applicable)
- [ ] Monitoring enabled
- [ ] Backups configured (MongoDB Atlas)
- [ ] Environment variables secured
- [ ] Auto-deployment tested

## 🎉 Your Application is Live!

**Backend URL:** `https://crm-backend-xxxx.onrender.com`
**Frontend URL:** `https://crm-frontend-xxxx.onrender.com`
**API Docs:** `https://crm-backend-xxxx.onrender.com/api/v1/actuator`

### Share with Users:
```
Application: https://crm-frontend-xxxx.onrender.com
API: https://crm-backend-xxxx.onrender.com/api/v1
```

---

## 🔗 Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [GitHub Repository](https://github.com/YOUR_USERNAME/crm-application)

---

**Deployment Time:** ~10 minutes
**Monthly Cost:** $0 (Free tier) or $14 (Starter)
**Maintenance:** Minimal (auto-updates, auto-scaling)

Happy Deploying! 🚀
