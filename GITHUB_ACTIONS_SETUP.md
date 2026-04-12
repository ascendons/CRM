# GitHub Actions Setup for EC2 Deployment

This guide explains how to configure GitHub Actions to automatically deploy your CRM application to EC2.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. EC2_SSH_KEY
**The private SSH key content for accessing EC2**

```bash
# Get the SSH key content (run locally)
cat ~/.ssh/crm-app-key.pem
```

**How to add:**
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `EC2_SSH_KEY`
5. Value: Paste the **entire content** of the SSH key (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

### 2. EC2_HOST
**The IP address of your EC2 instance**

```
Value: 52.20.26.167
```

**How to add:**
1. Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `EC2_HOST`
4. Value: `52.20.26.167`

### 3. EC2_USER
**The SSH username for EC2**

```
Value: ubuntu
```

**How to add:**
1. Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `EC2_USER`
4. Value: `ubuntu`

---

## Quick Setup Commands

### Get SSH Key Content
```bash
cat ~/.ssh/crm-app-key.pem
```

Copy the entire output (including BEGIN and END lines) and paste it as `EC2_SSH_KEY` secret.

---

## How to Use

### Automatic Deployment
The workflow runs automatically when you:
- Push to `master` or `main` branch
- Code is tested, built, and deployed automatically

### Manual Deployment
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy to EC2** workflow
4. Click **Run workflow** button
5. Select branch and click **Run workflow**

---

## What the Workflow Does

1. ✅ **Checkout Code** - Gets latest code from GitHub
2. ✅ **Build Backend** - Compiles Java application with Maven
3. ✅ **Test Backend** - Runs unit tests
4. ✅ **Build Frontend** - Prepares Next.js application
5. ✅ **Test Frontend** - Runs linter
6. ✅ **Copy to EC2** - Syncs code to EC2 instance via rsync
7. ✅ **Deploy** - Rebuilds and restarts Docker containers
8. ✅ **Verify** - Checks health endpoints
9. ✅ **Report** - Shows deployment status

---

## Deployment Process

```
GitHub Push
    ↓
Build & Test
    ↓
Copy files to EC2 via SSH
    ↓
Run: docker-compose up -d --build
    ↓
Verify health checks
    ↓
✅ Deployment Complete
```

---

## Monitoring Deployment

### View Deployment Logs
1. Go to **Actions** tab in GitHub
2. Click on the running/completed workflow
3. View detailed logs for each step

### Check Container Status
After deployment, SSH to EC2:
```bash
ssh -i ~/.ssh/crm-app-key.pem ubuntu@52.20.26.167
cd ~/crm
sudo docker-compose -f docker-compose.ec2.yml ps
```

### View Application Logs
```bash
# All services
sudo docker-compose -f docker-compose.ec2.yml logs -f

# Backend only
sudo docker-compose -f docker-compose.ec2.yml logs -f backend

# Frontend only
sudo docker-compose -f docker-compose.ec2.yml logs -f frontend
```

---

## Health Check Endpoints

The workflow verifies these endpoints:
- **Backend:** https://api.ascendons.com/api/v1/actuator/health
- **Frontend:** https://crm.ascendons.com

---

## Troubleshooting

### Deployment Fails at "Setup SSH"
**Problem:** SSH key is invalid or not set correctly

**Solution:**
1. Verify `EC2_SSH_KEY` secret contains the full key (including BEGIN/END lines)
2. Make sure there are no extra spaces or line breaks
3. The key should start with `-----BEGIN RSA PRIVATE KEY-----`

### Deployment Fails at "Copy files to EC2"
**Problem:** Cannot connect to EC2 or authentication failed

**Solution:**
1. Verify `EC2_HOST` is set to `52.20.26.167`
2. Verify `EC2_USER` is set to `ubuntu`
3. Check EC2 security group allows SSH (port 22) from GitHub Actions IPs

### Health Check Fails
**Problem:** Containers didn't start properly

**Solution:**
1. SSH to EC2 and check logs:
   ```bash
   ssh -i ~/.ssh/crm-app-key.pem ubuntu@52.20.26.167
   cd ~/crm
   sudo docker-compose -f docker-compose.ec2.yml logs
   ```
2. Check container status:
   ```bash
   sudo docker-compose -f docker-compose.ec2.yml ps
   ```
3. Restart if needed:
   ```bash
   sudo docker-compose -f docker-compose.ec2.yml restart
   ```

---

## Security Notes

### SSH Key Security
- ✅ SSH key is stored as encrypted GitHub secret
- ✅ Key is only decrypted during workflow execution
- ✅ Key is deleted after deployment completes
- ✅ Never commit SSH keys to repository

### EC2 Security
- EC2 security group should allow SSH only from necessary IPs
- Consider restricting SSH to specific GitHub Actions IP ranges
- Rotate SSH keys periodically

---

## Cost Impact

**GitHub Actions:**
- Free tier: 2,000 minutes/month for private repos
- Each deployment: ~5-10 minutes
- Estimated: 200-400 deployments/month on free tier

**EC2:**
- No additional cost from GitHub Actions
- Standard EC2 charges apply (~$8/month for t3.micro)

---

## Best Practices

### Before Deploying
1. ✅ Test locally first
2. ✅ Commit and push to feature branch
3. ✅ Create pull request
4. ✅ Review changes
5. ✅ Merge to master (triggers auto-deploy)

### Deployment Schedule
- **Development:** Deploy on every commit (automatic)
- **Production:** Deploy manually via "Run workflow" button
- **Hotfixes:** Use manual workflow trigger

### Rollback Strategy
If deployment fails:
1. The previous containers keep running (deployment script uses `down` then `up`)
2. To rollback: Revert the commit and re-run workflow
3. Or SSH to EC2 and manually restart previous version

---

## Next Steps

1. ✅ Add the 3 secrets to GitHub (EC2_SSH_KEY, EC2_HOST, EC2_USER)
2. ✅ Push a commit to master branch
3. ✅ Watch the deployment in Actions tab
4. ✅ Verify at https://crm.ascendons.com

---

## Workflow File Location

`.github/workflows/deploy-ec2.yml`

To modify the workflow, edit this file and commit changes.

---

## Support

**Issues during deployment?**
1. Check GitHub Actions logs
2. SSH to EC2 and check container logs
3. Verify all secrets are set correctly
4. Ensure EC2 instance is running

---

**Happy deploying!** 🚀
