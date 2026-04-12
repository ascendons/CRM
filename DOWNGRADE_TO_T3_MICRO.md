# Downgrade EC2 from t3.small to t3.micro

## Cost Savings
- **t3.small:** ~$15/month (2GB RAM, 2 vCPUs)
- **t3.micro:** ~$8/month (1GB RAM, 2 vCPUs)
- **Monthly savings:** ~$7
- **Annual savings:** ~$84

## ⚠️ Important Warning

**t3.micro has only 1GB RAM**. Your application runs:
- Java Spring Boot backend (typically uses 300-500MB)
- Next.js frontend (typically uses 200-400MB)
- Docker overhead (~100-200MB)

**Total estimated usage: 600-1100MB** - this is very tight on 1GB!

You may experience:
- Slower performance
- Out of memory errors
- Container crashes
- Swap usage (slower disk-based memory)

**Recommendation:** Monitor closely for 24-48 hours after downgrade.

---

## Step-by-Step Migration

### Step 1: Stop Your EC2 Instance

1. Go to **AWS Console** → **EC2** → **Instances**
2. Select your CRM instance
3. Click **Instance State** → **Stop Instance**
4. Wait until state shows "Stopped" (takes 1-2 minutes)

### Step 2: Change Instance Type

1. With instance still selected, click **Actions**
2. Navigate to **Instance Settings** → **Change Instance Type**
3. In the dropdown, select **t3.micro**
4. Click **Apply**

### Step 3: Start Instance

1. Click **Instance State** → **Start Instance**
2. Wait until state shows "Running" (takes 1-2 minutes)
3. Note: **Elastic IP remains the same** (no DNS changes needed)

### Step 4: Verify Services

SSH into your instance:
```bash
ssh -i your-key.pem ubuntu@<EC2-IP>
```

Check if containers are running:
```bash
cd ~/crm
sudo docker-compose -f docker-compose.ec2.yml ps
```

If containers aren't running, start them:
```bash
sudo docker-compose -f docker-compose.ec2.yml up -d
```

### Step 5: Monitor Memory Usage

**Critical: Monitor for 24-48 hours!**

```bash
# Check overall memory
free -h

# Watch memory in real-time (update every 2 seconds)
watch -n 2 free -h

# Check Docker container memory usage
docker stats

# Check for OOM (Out of Memory) kills
sudo dmesg | grep -i "out of memory"
```

### Step 6: Test Application

1. **Frontend:** `http://<EC2-IP>`
2. **Backend:** `http://<EC2-IP>:8080/api/v1`
3. **Health Check:** `curl http://<EC2-IP>:8080/api/v1/actuator/health`

Test all features:
- Login with all 3 users
- Create/edit/delete operations
- Navigation between pages
- Data loading speed

---

## Monitoring Commands

### Memory Check (Run Every Few Hours)
```bash
# Summary
free -h

# Detailed memory breakdown
cat /proc/meminfo | head -20

# Check swap usage (if swap is high, you're running out of RAM)
swapon --show
```

### Container Health
```bash
cd ~/crm

# Status
sudo docker-compose -f docker-compose.ec2.yml ps

# Resource usage
docker stats --no-stream

# Logs (look for memory errors)
sudo docker-compose -f docker-compose.ec2.yml logs --tail=100 | grep -i "memory\|oom\|heap"
```

### System Load
```bash
# Overall system health
htop

# CPU and memory over time
top
```

---

## Signs You Need to Upgrade Back to t3.small

⚠️ **Upgrade if you see any of these:**

1. **Memory constantly above 90%**
   ```bash
   free -h
   # If "used" is consistently >900MB
   ```

2. **Swap usage is high**
   ```bash
   free -h
   # If "swap used" is >200MB
   ```

3. **Containers restarting frequently**
   ```bash
   sudo docker-compose -f docker-compose.ec2.yml ps
   # Check "Status" column for restarts
   ```

4. **OOM (Out of Memory) errors in logs**
   ```bash
   sudo docker-compose -f docker-compose.ec2.yml logs | grep -i "out of memory"
   sudo dmesg | grep -i "oom"
   ```

5. **Application becomes slow or unresponsive**

---

## Optimization Tips for t3.micro

If you want to stay on t3.micro, try these optimizations:

### 1. Reduce Java Memory Allocation
Edit `docker-compose.ec2.yml`:
```yaml
services:
  backend:
    environment:
      - JAVA_OPTS=-Xmx384m -Xms256m
```

### 2. Enable Swap (Emergency Buffer)
```bash
# Create 1GB swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Reduce Docker Build Concurrency
Edit `docker-compose.ec2.yml`:
```yaml
services:
  frontend:
    build:
      context: ./frontend
      args:
        - NODE_OPTIONS=--max-old-space-size=384
```

---

## How to Upgrade Back to t3.small

If t3.micro doesn't work well:

1. **Stop instance** (AWS Console → EC2 → Stop)
2. **Change instance type** to t3.small
3. **Start instance**
4. No other changes needed!

---

## Post-Migration Checklist

- [ ] Instance successfully changed to t3.micro
- [ ] Instance restarted and running
- [ ] Containers are running (`docker ps`)
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Login works for all users
- [ ] Memory usage < 90% (`free -h`)
- [ ] No swap usage or minimal swap
- [ ] No OOM errors in logs
- [ ] Performance is acceptable
- [ ] Monitored for 24-48 hours

---

## Quick Reference

**Check memory:**
```bash
free -h
```

**Check containers:**
```bash
cd ~/crm && sudo docker-compose -f docker-compose.ec2.yml ps
```

**View logs:**
```bash
cd ~/crm && sudo docker-compose -f docker-compose.ec2.yml logs -f
```

**Restart if needed:**
```bash
cd ~/crm && sudo docker-compose -f docker-compose.ec2.yml restart
```

---

## Summary

1. ✅ Stop EC2 instance
2. ✅ Change type to t3.micro in AWS Console
3. ✅ Start instance
4. ✅ Verify containers running
5. ⚠️ Monitor memory for 24-48 hours
6. ✅ Upgrade back to t3.small if issues occur

**Total downtime:** ~5 minutes

Good luck! 🚀
