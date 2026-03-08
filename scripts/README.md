# Scripts Directory

All utility and deployment scripts are organized here.

## 🚀 Deployment Scripts

### Main Deployment
- **deploy.sh** - Main deployment script
- **deploy-aws.sh** - Deploy to AWS
- **deploy-render.sh** - Deploy to Render.com
- **deploy-tier1.sh** - Deploy to Tier1 hosting

### Service-Specific
- **deploy-backend.sh** - Backend deployment only
- **deploy-frontend.sh** - Frontend deployment only

## 🔧 Development Scripts

### Startup
- **start-backend.sh** - Start backend server
- **start-frontend.sh** - Start frontend dev server
- **RESTART_BACKEND.sh** - Restart backend

### Setup
- **install-prerequisites.sh** - Install required tools

## 🧪 Testing Scripts

- **test-attendance.sh** - Test attendance system
- **quick-test-attendance.sh** - Quick attendance tests
- **test-deployment.sh** - Verify deployment
- **load-test.sh** - Load testing

## 🛠️ Utility Scripts

### Database & Seeding
- **seed_roles.js** - Seed roles into database

### Debugging
- **debug-notifications.js** - Debug notification system

### Fixes
- **fix-user-duplicates.js** - Fix duplicate users
- **fix-user-duplicates-exec.js** - Execute duplicate fix
- **fix-user-complete.sh** - Complete user fix
- **fix-user-roles.sh** - Fix user roles

## 📝 Usage

Most scripts should be run from the project root:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run a script
./scripts/deploy.sh

# Or from scripts directory
cd scripts && ./deploy.sh
```

## ⚠️ Important Notes

- Always review scripts before executing
- Some scripts require environment variables
- Backend scripts need backend to be running
- Deployment scripts may require credentials

## 📊 Total: 20 Scripts
