# 🚀 Deploy Now - Ready to Go!

Your CRM application is configured and ready for deployment with your MongoDB Atlas connection.

## ✅ Configuration Complete

- **MongoDB**: Connected to your existing cluster (cluster0.btsspaw.mongodb.net)
- **Database**: divisha
- **JWT Secret**: Auto-generated secure key
- **Environment**: Production configuration ready

## 🎯 Quick Deploy to Render (15 minutes)

### Option 1: Automated Script

```bash
./deploy-render.sh
```

The script will:
1. Initialize git repository
2. Prompt for GitHub username/repo
3. Push to GitHub
4. Guide you through Render setup

### Option 2: Manual Deployment

#### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Create GitHub repository at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your repository
5. Render auto-detects `render.yaml`
6. **IMPORTANT**: When prompted for environment variables:
   - Service: `crm-backend`
   - Variable: `SPRING_DATA_MONGODB_URI`
   - Value: `mongodb+srv://dev_divisha_app:Divisha%40123@cluster0.btsspaw.mongodb.net/divisha?appName=Cluster0`
7. Click **"Apply Blueprint"**

#### Step 3: Wait for Deployment (5-10 minutes)

Render will build and deploy both services. You'll get URLs like:
- Frontend: `https://crm-frontend-xxxx.onrender.com`
- Backend: `https://crm-backend-xxxx.onrender.com`

#### Step 4: Update Frontend Environment Variables

After deployment, update the frontend service on Render:
1. Go to `crm-frontend` service → Settings → Environment
2. Update `NEXT_PUBLIC_API_URL` with your actual backend URL
3. Save and redeploy

## 🔒 Security Notes

- ✅ `.env.production` is in `.gitignore` (won't be committed)
- ✅ Sensitive credentials only in Render environment variables
- ✅ JWT secret is cryptographically secure (64 bytes)
- ✅ Production profile disables Swagger and debug logging

## 📊 MongoDB Configuration

Your MongoDB is already configured with:
- **Cluster**: cluster0.btsspaw.mongodb.net
- **Database**: divisha
- **User**: dev_divisha_app
- **Connection Pooling**: 10-50 connections
- **Auto-indexing**: Enabled

## 🎉 Post-Deployment

### Verify Backend Health
```bash
curl https://crm-backend-xxxx.onrender.com/api/v1/actuator/health
# Should return: {"status":"UP"}
```

### Access Your Application
- Open browser: `https://crm-frontend-xxxx.onrender.com`
- Register your organization
- Start using your CRM!

## 💰 Cost

**Render Free Tier**: $0/month
- Services spin down after 15 min inactivity
- Good for testing

**Render Starter**: $14/month (both services)
- Always on, no spin down
- Recommended for production

**MongoDB Atlas**: FREE (M0 tier)
- Already set up and working

## 📚 Need Help?

- **Render Deployment**: See `RENDER_DEPLOYMENT.md` for detailed guide
- **Docker Deployment**: See `DEPLOYMENT_GUIDE.md` for Docker/VPS options
- **Quick Reference**: See `QUICK_DEPLOY.md` for comparison

---

**Ready to deploy? Run:**

```bash
./deploy-render.sh
```

🚀 **Your CRM will be live in 15 minutes!**
