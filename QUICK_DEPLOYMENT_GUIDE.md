# 🚀 Quick Deployment Guide

## Overview

Your CRM has two deployment methods:
1. **Manual** - Using deployment scripts
2. **Automatic** - Using GitHub Actions (CI/CD)

---

## 🔧 Manual Deployment

### Backend

```bash
cd /Users/pankajthakur/IdeaProjects/CRM
./deploy-backend.sh
```

**What it does:**
- Checks for uncommitted changes
- Prompts to commit if needed
- Deploys to Elastic Beanstalk
- Tests the deployment
- Shows status

**Time:** ~5 minutes

### Frontend

```bash
cd /Users/pankajthakur/IdeaProjects/CRM
./deploy-frontend.sh
```

**What it does:**
- Checks for uncommitted changes
- Prompts to commit if needed
- Deploys to Elastic Beanstalk
- Tests the deployment (health + login page)
- Shows status

**Time:** ~5 minutes

---

## 🤖 Automatic Deployment (GitHub Actions)

### Setup (One-time)

1. **Add AWS credentials to GitHub Secrets:**
   - Go to: https://github.com/ascendons/CRM/settings/secrets/actions
   - Click "New repository secret"
   - Add these secrets:
     - `AWS_ACCESS_KEY_ID` - Your AWS access key
     - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

2. **How to get AWS credentials:**
   ```bash
   # Option 1: From existing AWS CLI config
   cat ~/.aws/credentials

   # Option 2: Create new IAM user
   # 1. Go to AWS Console → IAM → Users
   # 2. Create new user with Elastic Beanstalk permissions
   # 3. Generate access keys
   ```

### How it Works

Once set up, deployments happen automatically:

#### Backend Deployment
- **Triggers:** When you push changes to `backend/` folder
- **Process:**
  1. Builds Java application with Maven
  2. Runs tests
  3. Deploys to Elastic Beanstalk
  4. Verifies deployment health
- **View progress:** https://github.com/ascendons/CRM/actions

#### Frontend Deployment
- **Triggers:** When you push changes to `frontend/` folder
- **Process:**
  1. Installs npm dependencies
  2. Runs linter
  3. Builds Next.js app
  4. Deploys to Elastic Beanstalk
  5. Verifies deployment (health + login page)
- **View progress:** https://github.com/ascendons/CRM/actions

### Manual Trigger

You can also manually trigger deployments:

1. Go to: https://github.com/ascendons/CRM/actions
2. Select workflow (Deploy Backend or Deploy Frontend)
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow"

---

## 📝 Typical Development Workflow

### Making Changes

```bash
# 1. Navigate to your project
cd /Users/pankajthakur/IdeaProjects/CRM

# 2. Create a new branch (optional but recommended)
git checkout -b feature/my-new-feature

# 3. Make your changes
# Edit files in backend/ or frontend/

# 4. Test locally
cd backend
./mvnw spring-boot:run  # Test backend
# or
cd frontend
npm run dev  # Test frontend

# 5. Commit changes
git add .
git commit -m "Add my new feature"
git push origin feature/my-new-feature

# 6. Deploy
# Option A: Automatic (if using GitHub Actions)
git checkout master
git merge feature/my-new-feature
git push origin master  # Auto-deploys!

# Option B: Manual
./deploy-backend.sh  # or ./deploy-frontend.sh
```

---

## 🔍 Monitoring Deployments

### Check Deployment Status

```bash
# Backend
cd backend
export PATH="$HOME/Library/Python/3.11/bin:$PATH"
eb status

# Frontend
cd frontend
export PATH="$HOME/Library/Python/3.11/bin:$PATH"
eb status
```

### View Logs

```bash
# Backend logs
cd backend
eb logs

# Frontend logs
cd frontend
eb logs

# Stream logs in real-time
eb logs --stream
```

### Test Endpoints

```bash
# Backend health
curl https://api.ascendons.com/api/v1/actuator/health

# Frontend health
curl https://crm.ascendons.com/api/ping

# Frontend login page
curl -I https://crm.ascendons.com/login
```

---

## 🔄 Rollback

If something goes wrong:

### Backend Rollback

```bash
cd backend
export PATH="$HOME/Library/Python/3.11/bin:$PATH"

# List previous versions
eb appversion

# Deploy previous version
eb deploy --version <version-label>
```

### Frontend Rollback

```bash
cd frontend
export PATH="$HOME/Library/Python/3.11/bin:$PATH"

# List previous versions
eb appversion

# Deploy previous version
eb deploy --version <version-label>
```

---

## 🆘 Troubleshooting

### Problem: "eb: command not found"

**Solution:**
```bash
export PATH="$HOME/Library/Python/3.11/bin:$PATH"

# Or add to ~/.zshrc permanently:
echo 'export PATH="$HOME/Library/Python/3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Problem: Deployment fails

**Solution:**
```bash
# Check logs
cd backend  # or frontend
eb logs

# Common issues:
# - Port mismatch: Check PORT environment variable
# - Database connection: Verify MONGODB_URI
# - Dependencies: Check pom.xml or package.json
```

### Problem: Health check fails after deployment

**Solution:**
```bash
# Backend
curl https://api.ascendons.com/api/v1/actuator/health

# Frontend
curl https://crm.ascendons.com/api/ping

# If still failing:
cd backend  # or frontend
eb logs
eb restart
```

### Problem: GitHub Actions deployment fails

**Solution:**
1. Check workflow logs: https://github.com/ascendons/CRM/actions
2. Verify AWS credentials are set correctly in GitHub secrets
3. Check EB environment is healthy: `eb status`

---

## 📊 Environment Variables

### Backend Variables

```bash
cd backend
eb setenv \
  PORT="8080" \
  SPRING_DATA_MONGODB_URI="mongodb+srv://..." \
  JWT_SECRET="your-secret" \
  CORS_ALLOWED_ORIGINS="https://crm.ascendons.com,https://*.ascendons.com" \
  SPRING_PROFILES_ACTIVE="prod"
```

### Frontend Variables

```bash
cd frontend
eb setenv \
  NEXT_PUBLIC_API_URL="https://api.ascendons.com/api/v1" \
  NEXT_PUBLIC_APP_URL="https://crm.ascendons.com" \
  NODE_ENV="production" \
  PORT="3000"
```

---

## ✅ Best Practices

### 1. Always Test Locally First

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm run dev
```

### 2. Use Meaningful Commit Messages

```bash
# Good
git commit -m "Add user authentication feature"
git commit -m "Fix bug in contact search"

# Bad
git commit -m "changes"
git commit -m "update"
```

### 3. Monitor After Deployment

- Check logs for 5 minutes after deployment
- Test critical user flows
- Monitor error rates

### 4. Deploy During Low Traffic

- Best time: Late night or early morning
- Avoid peak business hours

---

## 📞 Quick Commands

```bash
# Status
eb status

# Deploy
eb deploy

# View logs
eb logs

# Stream logs
eb logs --stream

# Restart
eb restart

# Set environment variable
eb setenv KEY=value

# SSH into instance
eb ssh

# Open in browser
eb open
```

---

## 🎯 URLs Reference

- **Backend API:** https://api.ascendons.com/api/v1
- **Frontend:** https://crm.ascendons.com
- **Multi-tenant:** https://*.ascendons.com
- **EB Backend:** http://crm-backend-prod.eba-cptirjf2.us-east-1.elasticbeanstalk.com
- **EB Frontend:** http://crm-frontend-prod.eba-9k5gurxk.us-east-1.elasticbeanstalk.com

---

## 🚀 Next Steps

1. ✅ Set up GitHub Actions (add AWS credentials to secrets)
2. ✅ Test manual deployment with the scripts
3. ✅ Make a small change and see auto-deployment in action
4. ✅ Set up monitoring alerts (optional)
5. ✅ Configure backup strategy (MongoDB Atlas handles this)

---

**Need help?**
- View logs: `eb logs`
- Check status: `eb status`
- GitHub Actions: https://github.com/ascendons/CRM/actions
- AWS Console: https://console.aws.amazon.com/elasticbeanstalk

Happy deploying! 🎉
