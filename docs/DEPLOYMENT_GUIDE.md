# Production Deployment Guide - CRM Application

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Deployment Options](#deployment-options)
3. [Pre-Deployment Preparation](#pre-deployment-preparation)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security Hardening](#security-hardening)
10. [Scaling Strategy](#scaling-strategy)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Spring Boot │────▶│   MongoDB   │
│  Frontend   │     │   Backend    │     │  Database   │
│  (Port 3000)│     │  (Port 8080) │     │ (Port 27017)│
└─────────────┘     └──────────────┘     └─────────────┘
       │                     │                    │
       ▼                     ▼                    ▼
   Vercel/AWS           AWS EC2/ECS         MongoDB Atlas
                        DigitalOcean         AWS DocumentDB
```

---

## Deployment Options

### **Option 1: Cloud Platform (Recommended for Quick Start)**
- **Frontend**: Vercel / Netlify (Zero-config, auto-scaling)
- **Backend**: Railway / Render / AWS Elastic Beanstalk
- **Database**: MongoDB Atlas (Managed, auto-backup)
- **Effort**: Low | **Cost**: $25-50/month | **Time**: 2-4 hours

### **Option 2: Container-Based (Recommended for Production)**
- **Frontend**: AWS ECS / Google Cloud Run / DigitalOcean App Platform
- **Backend**: Docker on AWS ECS / Kubernetes
- **Database**: MongoDB Atlas / AWS DocumentDB
- **Effort**: Medium | **Cost**: $50-150/month | **Time**: 1-2 days

### **Option 3: VM-Based (Full Control)**
- **Frontend**: NGINX on AWS EC2 / DigitalOcean Droplet
- **Backend**: Tomcat/Java on EC2 / Droplet
- **Database**: Self-hosted MongoDB or Atlas
- **Effort**: High | **Cost**: $40-100/month | **Time**: 2-3 days

### **Option 4: Fully Serverless**
- **Frontend**: Vercel / AWS Amplify
- **Backend**: AWS Lambda + API Gateway (requires refactoring)
- **Database**: MongoDB Atlas
- **Effort**: Very High | **Cost**: Variable | **Time**: 1 week

---

## Pre-Deployment Preparation

### 1. Environment Variables

#### Backend (`application-prod.properties`)
```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/api/v1

# MongoDB Production (MongoDB Atlas recommended)
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/crm_prod?retryWrites=true&w=majority
spring.data.mongodb.database=crm_production

# Redis Cache (Optional but recommended)
spring.redis.host=<redis-host>
spring.redis.port=6379
spring.redis.password=<redis-password>

# JWT Configuration
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000

# CORS (Set to your frontend domain)
cors.allowed-origins=https://your-domain.com,https://www.your-domain.com

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Logging
logging.level.root=INFO
logging.level.com.ultron.backend=INFO
logging.file.name=/var/log/crm/application.log

# Actuator (for health checks)
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized
```

#### Frontend (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 2. Security Checklist
- [ ] Generate strong JWT secret (minimum 256-bit)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS with specific origins (not `*`)
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Enable firewall rules (only necessary ports)
- [ ] Set up backup strategy
- [ ] Configure session timeout
- [ ] Enable security headers (Helmet.js)

### 3. Build Optimization
- [ ] Enable production mode
- [ ] Minify JavaScript/CSS
- [ ] Compress images
- [ ] Enable Gzip/Brotli compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers

---

## Backend Deployment

### Option A: Docker Deployment (Recommended)

#### Step 1: Create Dockerfile
```dockerfile
# File: backend/Dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-*.jar app.jar

# Create non-root user
RUN addgroup -g 1001 spring && adduser -D -u 1001 -G spring spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "/app/app.jar"]
```

#### Step 2: Build Docker Image
```bash
cd backend
docker build -t crm-backend:latest .
```

#### Step 3: Run Container Locally (Test)
```bash
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATA_MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret-key" \
  --name crm-backend \
  crm-backend:latest
```

#### Step 4: Deploy to Cloud

**AWS ECS (Elastic Container Service)**
```bash
# Install AWS CLI
aws configure

# Create ECR repository
aws ecr create-repository --repository-name crm-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag crm-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest

# Create ECS task definition and service (via AWS Console or CLI)
```

**DigitalOcean App Platform**
```bash
# Install doctl CLI
doctl auth init

# Create app (using App Spec)
doctl apps create --spec .do/app.yaml
```

**Docker Compose (For single VM deployment)**
```yaml
# File: docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: crm-backend:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATA_MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Option B: Traditional JAR Deployment

#### Step 1: Build JAR
```bash
cd backend
./mvnw clean package -DskipTests
# Output: backend/target/backend-0.0.1-SNAPSHOT.jar
```

#### Step 2: Deploy to Server
```bash
# SCP to server
scp target/backend-0.0.1-SNAPSHOT.jar user@your-server:/opt/crm/

# SSH into server
ssh user@your-server

# Create systemd service
sudo nano /etc/systemd/system/crm-backend.service
```

**Systemd Service File**
```ini
[Unit]
Description=CRM Backend Service
After=network.target

[Service]
Type=simple
User=crm
WorkingDirectory=/opt/crm
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod /opt/crm/backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="SPRING_DATA_MONGODB_URI=mongodb+srv://..."
Environment="JWT_SECRET=your-secret-key"

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable crm-backend
sudo systemctl start crm-backend

# Check status
sudo systemctl status crm-backend
sudo journalctl -u crm-backend -f
```

#### Step 3: Setup NGINX Reverse Proxy
```nginx
# /etc/nginx/sites-available/crm-backend
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

---

## Frontend Deployment

### Option A: Vercel (Easiest)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
cd frontend
vercel --prod

# Or connect GitHub repo for auto-deployment
# 1. Push code to GitHub
# 2. Import project in Vercel dashboard
# 3. Set environment variables
# 4. Deploy
```

#### Step 3: Configure Environment Variables (Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Option B: AWS Amplify / Netlify
Similar to Vercel - connect GitHub and auto-deploy

### Option C: Docker + NGINX

#### Step 1: Create Dockerfile
```dockerfile
# File: frontend/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Step 2: Update next.config.js
```javascript
module.exports = {
  output: 'standalone',
  // ... rest of config
}
```

#### Step 3: Build and Deploy
```bash
docker build -t crm-frontend:latest .
docker run -d -p 3000:3000 --name crm-frontend crm-frontend:latest
```

### Option D: Static Export + CDN

#### Step 1: Build Static Files
```bash
cd frontend
npm run build
# Output: frontend/out/
```

#### Step 2: Upload to S3 + CloudFront
```bash
# Install AWS CLI
aws s3 sync out/ s3://your-bucket-name --delete

# Create CloudFront distribution pointing to S3 bucket
# Enable HTTPS with ACM certificate
```

---

## Database Setup

### MongoDB Atlas (Recommended)

#### Step 1: Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free/paid cluster (M10+ for production)
3. Create database user
4. Whitelist IP addresses (or 0.0.0.0/0 for dynamic IPs)

#### Step 2: Get Connection String
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/crm_production?retryWrites=true&w=majority
```

#### Step 3: Configure Backup
- Enable automated backups (Atlas auto-backups daily)
- Set retention policy (7-30 days)

#### Step 4: Performance Optimization
```javascript
// Create indexes in MongoDB
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "tenantId": 1 })
db.leads.createIndex({ "tenantId": 1, "isDeleted": 1 })
db.leads.createIndex({ "email": 1, "tenantId": 1 })
db.roles.createIndex({ "tenantId": 1, "isDeleted": 1 })
```

### Self-Hosted MongoDB

#### Step 1: Install MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
```

#### Step 2: Configure Security
```javascript
// /etc/mongod.conf
security:
  authorization: enabled

net:
  bindIp: localhost,<private-ip>
  port: 27017
```

#### Step 3: Create Admin User
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "secure-password",
  roles: [ { role: "root", db: "admin" } ]
})

use crm_production
db.createUser({
  user: "crm_user",
  pwd: "secure-password",
  roles: [ { role: "readWrite", db: "crm_production" } ]
})
```

#### Step 4: Setup Automated Backups
```bash
# Create backup script
cat > /opt/scripts/mongodb-backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mongodump --uri="mongodb://user:pass@localhost:27017/crm_production" --out="$BACKUP_DIR/$TIMESTAMP"
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /opt/scripts/mongodb-backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /opt/scripts/mongodb-backup.sh
```

---

## CI/CD Pipeline

### GitHub Actions

#### Backend CI/CD
```yaml
# File: .github/workflows/backend-deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build with Maven
        working-directory: ./backend
        run: ./mvnw clean package -DskipTests

      - name: Run Tests
        working-directory: ./backend
        run: ./mvnw test

      - name: Build Docker Image
        run: |
          cd backend
          docker build -t crm-backend:${{ github.sha }} .

      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker tag crm-backend:${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/crm-backend:latest
          docker push ${{ secrets.ECR_REGISTRY }}/crm-backend:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster crm-cluster --service backend --force-new-deployment
```

#### Frontend CI/CD
```yaml
# File: .github/workflows/frontend-deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        run: npm run build

      - name: Deploy to Vercel
        working-directory: ./frontend
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel --prod --token=$VERCEL_TOKEN
```

---

## Monitoring & Logging

### Application Monitoring

#### Spring Boot Actuator + Prometheus
```yaml
# backend/pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```properties
# application-prod.properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.metrics.export.prometheus.enabled=true
```

#### Log Aggregation (ELK Stack)
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
```

### Error Tracking
- **Sentry**: https://sentry.io
- **Rollbar**: https://rollbar.com
- **New Relic**: https://newrelic.com

### Uptime Monitoring
- **UptimeRobot**: https://uptimerobot.com (Free)
- **Pingdom**: https://www.pingdom.com
- **AWS CloudWatch**: Built-in with AWS

---

## Security Hardening

### 1. Backend Security

#### Enable Security Headers
```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.headers()
        .contentSecurityPolicy("default-src 'self'")
        .and()
        .xssProtection()
        .and()
        .frameOptions().deny()
        .and()
        .httpStrictTransportSecurity()
            .maxAgeInSeconds(31536000)
            .includeSubDomains(true);
    return http.build();
}
```

#### Rate Limiting
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.0.0</version>
</dependency>
```

```java
// RateLimitingFilter.java
@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    private final Bucket bucket = Bucket.builder()
        .addLimit(Limit.of(100).perMinute())
        .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
        }
    }
}
```

### 2. Database Security
- Enable MongoDB authentication
- Use SSL/TLS for connections
- Implement field-level encryption for sensitive data
- Regular security audits

### 3. Frontend Security
- Enable CSP headers
- Sanitize user inputs
- Implement CSRF protection
- Use HTTPS only
- Enable SameSite cookies

---

## Scaling Strategy

### Horizontal Scaling

#### Backend Auto-Scaling (AWS)
```yaml
# ECS Service with Auto Scaling
Services:
  BackendService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: crm-backend
      DesiredCount: 2

AutoScaling:
  Target: 70% CPU utilization
  Min: 2 instances
  Max: 10 instances
```

#### Load Balancer Configuration
```nginx
# NGINX Load Balancer
upstream backend {
    least_conn;
    server backend1:8080 weight=3;
    server backend2:8080 weight=2;
    server backend3:8080 weight=1;

    keepalive 32;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

### Caching Strategy

#### Redis Cache
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```properties
spring.redis.host=cache.your-domain.com
spring.redis.port=6379
spring.cache.type=redis
spring.cache.redis.time-to-live=600000
```

### Database Optimization
- Create proper indexes
- Use connection pooling
- Implement read replicas
- Enable query optimization

---

## Cost Optimization

### Estimated Monthly Costs

#### Starter Setup (~$50/month)
- Frontend: Vercel Free Tier
- Backend: DigitalOcean Basic Droplet ($12)
- Database: MongoDB Atlas M10 ($57) → Use M0 free tier initially
- Total: **~$12-50/month**

#### Production Setup (~$150/month)
- Frontend: Vercel Pro ($20)
- Backend: AWS ECS Fargate 2 tasks ($50)
- Database: MongoDB Atlas M20 ($80)
- CDN: CloudFront ($10)
- Monitoring: CloudWatch ($10)
- Total: **~$170/month**

#### Enterprise Setup (~$500+/month)
- Frontend: Vercel Enterprise
- Backend: Auto-scaling ECS cluster
- Database: MongoDB Atlas M30+ with replicas
- Redis Cache: ElastiCache
- Full monitoring and logging

---

## Quick Start Deployment (Fastest)

### Step 1: MongoDB Atlas
```bash
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create M0 Free cluster
3. Create database user
4. Whitelist IP: 0.0.0.0/0
5. Copy connection string
```

### Step 2: Backend on Railway
```bash
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Select backend folder
4. Add environment variables:
   - SPRING_DATA_MONGODB_URI
   - JWT_SECRET
5. Deploy
6. Copy backend URL
```

### Step 3: Frontend on Vercel
```bash
1. Sign up at https://vercel.com
2. Import Git Repository
3. Root Directory: frontend
4. Environment Variables:
   - NEXT_PUBLIC_API_URL=<railway-backend-url>
5. Deploy
```

**Total Time: 30 minutes | Cost: FREE for low traffic**

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates installed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error tracking setup
- [ ] Logging configured

### Deployment
- [ ] Backend built and tested
- [ ] Frontend built and tested
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Load testing completed

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify backups working
- [ ] Test all critical flows
- [ ] Document deployment process
- [ ] Set up alerts

---

## Rollback Strategy

### Backend Rollback
```bash
# ECS
aws ecs update-service --cluster crm-cluster --service backend --task-definition backend:previous

# Docker Compose
docker-compose down
docker pull crm-backend:previous-tag
docker-compose up -d

# Systemd
sudo systemctl stop crm-backend
sudo cp /opt/crm/backup/backend-previous.jar /opt/crm/backend.jar
sudo systemctl start crm-backend
```

### Frontend Rollback
```bash
# Vercel
vercel rollback

# NGINX
sudo cp /var/www/crm/frontend-backup /var/www/crm/frontend -r
sudo systemctl reload nginx
```

### Database Rollback
```bash
# MongoDB restore
mongorestore --uri="mongodb+srv://..." --drop /backups/mongodb/20240211_020000
```

---

## Support & Maintenance

### Regular Maintenance Tasks
- **Daily**: Check error logs, monitor uptime
- **Weekly**: Review performance metrics, check disk space
- **Monthly**: Security updates, dependency updates, backup verification
- **Quarterly**: Performance optimization, cost review

### Emergency Contacts
- Database Admin: DBA team
- DevOps Lead: DevOps team
- On-Call Engineer: Rotation schedule

---

## Conclusion

This guide covers multiple deployment strategies. For most cases, I recommend:

🎯 **Recommended for You**:
- **Frontend**: Vercel (easiest, free tier)
- **Backend**: Railway or DigitalOcean App Platform (simple, affordable)
- **Database**: MongoDB Atlas M10 (managed, reliable)

**Next Steps**:
1. Choose your deployment strategy
2. Set up accounts on chosen platforms
3. Configure environment variables
4. Deploy following this guide
5. Monitor and optimize

Good luck with your production deployment! 🚀
