# AWS Deployment Guide - CRM Application

Complete guide to deploy your CRM application on AWS with managed MongoDB Atlas.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [MongoDB Atlas Setup](#mongodb-atlas-setup)
4. [Backend Deployment Options](#backend-deployment-options)
5. [Frontend Deployment Options](#frontend-deployment-options)
6. [Complete Deployment Steps](#complete-deployment-steps)
7. [Cost Estimation](#cost-estimation)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Architecture Overview

### Recommended Production Architecture

```
Internet
   │
   ▼
Route 53 (DNS)
   │
   ├─────────────────────────┬──────────────────────────┐
   │                         │                          │
   ▼                         ▼                          ▼
CloudFront CDN         Application Load Balancer    AWS Amplify
(Static Assets)        (API Traffic)                (Frontend)
                            │
                       ┌────┴────┐
                       │         │
                   ┌───▼───┐ ┌──▼────┐
                   │ ECS   │ │ ECS   │  (Auto Scaling)
                   │Task 1 │ │Task 2 │
                   └───┬───┘ └──┬────┘
                       │        │
                       └────┬───┘
                            │
                            ▼
                    MongoDB Atlas
                   (Managed Database)
                            │
                            ▼
                      S3 (Backups)
```

---

## Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: us-east-1
# Default output format: json
```

### 2. Required Tools
```bash
# Install Docker
brew install docker

# Install AWS EB CLI (for Elastic Beanstalk)
pip install awsebcli

# Install Node.js & npm (already installed)
node --version  # Should be v18+
```

### 3. Create Production Environment Files

Create these files in your project:

**Backend: `backend/src/main/resources/application-prod.properties`**
```properties
# Server Configuration
server.port=5000
server.servlet.context-path=/api/v1

# MongoDB Atlas Connection
spring.data.mongodb.uri=${SPRING_DATA_MONGODB_URI}
spring.data.mongodb.auto-index-creation=true

# JWT Configuration
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000

# CORS Configuration
cors.allowed-origins=${FRONTEND_URL},${FRONTEND_URL_WWW}

# Actuator for Health Checks
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized
management.health.mongo.enabled=true

# Logging
logging.level.root=INFO
logging.level.com.ultron.backend=INFO
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n

# Jackson Configuration
spring.jackson.default-property-inclusion=non_null

# Swagger/OpenAPI
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

**Frontend: `.env.production`**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Cluster

1. **Go to**: https://www.mongodb.com/cloud/atlas
2. **Create Account** or **Sign In**
3. **Create New Project**: "CRM-Production"
4. **Build Database**:
   - **Cloud Provider**: AWS
   - **Region**: us-east-1 (or your preferred AWS region)
   - **Cluster Tier**:
     - M0 (FREE) - For testing/low traffic
     - M10 ($57/month) - For production
     - M20 ($80/month) - For higher traffic
5. **Cluster Name**: crm-production-cluster

### Step 2: Database Security Configuration

1. **Database Access** (Create User):
   ```
   Username: crm_admin
   Password: <Generate Strong Password - save this!>
   Database User Privileges: Atlas admin
   ```

2. **Network Access**:
   ```
   Add IP Address:
   - 0.0.0.0/0 (Allow access from anywhere) - for initial setup
   - Later: Add specific AWS Security Group IPs
   ```

### Step 3: Get Connection String

1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string:
   ```
   mongodb+srv://crm_admin:<password>@crm-production-cluster.xxxxx.mongodb.net/crm_production?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Save this for later use

### Step 4: Create Indexes (Performance Optimization)

Connect to your MongoDB Atlas cluster and run:

```javascript
// Connect via MongoDB Compass or mongosh
use crm_production;

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "tenantId": 1 });
db.users.createIndex({ "isDeleted": 1 });

// Leads collection indexes
db.leads.createIndex({ "tenantId": 1, "isDeleted": 1 });
db.leads.createIndex({ "email": 1, "tenantId": 1 });
db.leads.createIndex({ "status": 1, "tenantId": 1 });
db.leads.createIndex({ "assignedTo": 1, "tenantId": 1 });

// Roles collection indexes
db.roles.createIndex({ "tenantId": 1, "isDeleted": 1 });
db.roles.createIndex({ "name": 1, "tenantId": 1 }, { unique: true });
```

---

## Backend Deployment Options

### **Option A: AWS Elastic Beanstalk (EASIEST)**

**Pros**: Zero infrastructure management, auto-scaling, load balancing
**Cons**: Less control, higher cost
**Best for**: Quick deployment, small to medium apps

#### Create Dockerfile for Backend

Create: `backend/Dockerfile`
```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create non-root user
RUN addgroup -g 1001 spring && adduser -D -u 1001 -G spring spring
USER spring:spring

EXPOSE 5000

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "/app/app.jar"]
```

#### Deployment Steps

```bash
# 1. Initialize Elastic Beanstalk
cd backend
eb init

# Select:
# - Region: us-east-1
# - Application name: crm-backend
# - Platform: Docker
# - Do you want to set up SSH: yes

# 2. Create environment
eb create crm-backend-prod \
  --instance-type t3.small \
  --platform docker \
  --region us-east-1

# 3. Set environment variables
eb setenv \
  SPRING_DATA_MONGODB_URI="mongodb+srv://crm_admin:PASSWORD@cluster.mongodb.net/crm_production" \
  JWT_SECRET="your-256-bit-secret-key-generate-this" \
  FRONTEND_URL="https://yourdomain.com" \
  FRONTEND_URL_WWW="https://www.yourdomain.com" \
  SPRING_PROFILES_ACTIVE="prod"

# 4. Deploy
eb deploy

# 5. Check status
eb status

# 6. Open in browser
eb open

# 7. View logs
eb logs
```

#### Auto-Scaling Configuration

```bash
# Create .ebextensions/autoscaling.config
mkdir -p .ebextensions
```

Create: `backend/.ebextensions/autoscaling.config`
```yaml
option_settings:
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 30
  aws:elasticbeanstalk:environment:
    LoadBalancerType: application
  aws:elbv2:listener:443:
    Protocol: HTTPS
    SSLCertificateArns: arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
```

---

### **Option B: AWS ECS with Fargate (RECOMMENDED FOR PRODUCTION)**

**Pros**: Fully managed containers, better cost control, more scalable
**Cons**: More complex setup
**Best for**: Production applications, scalable systems

#### Deployment Steps

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name crm-backend --region us-east-1

# 2. Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build Docker image
cd backend
docker build -t crm-backend:latest .

# 4. Tag image
docker tag crm-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest

# 5. Push to ECR
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
```

#### Create ECS Infrastructure

I'll create a CloudFormation template for you:

Create: `aws/backend-ecs-infrastructure.yml`
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ECS Fargate infrastructure for CRM Backend'

Parameters:
  MongoDBURI:
    Type: String
    NoEcho: true
    Description: MongoDB Atlas connection string
  JWTSecret:
    Type: String
    NoEcho: true
    Description: JWT secret key
  FrontendURL:
    Type: String
    Description: Frontend URL for CORS

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Route Table
  RouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  Route:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref RouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref RouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref RouteTable

  # Security Group for ALB
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  # Security Group for ECS Tasks
  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5000
          ToPort: 5000
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: crm-backend-alb
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Scheme: internet-facing

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: crm-backend-tg
      Port: 5000
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckPath: /api/v1/actuator/health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  # Listener
  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: crm-backend-cluster

  # Task Execution Role
  TaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'

  # Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: crm-backend-task
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ExecutionRoleArn: !Ref TaskExecutionRole
      ContainerDefinitions:
        - Name: crm-backend
          Image: <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
          PortMappings:
            - ContainerPort: 5000
              Protocol: tcp
          Environment:
            - Name: SPRING_PROFILES_ACTIVE
              Value: prod
            - Name: SPRING_DATA_MONGODB_URI
              Value: !Ref MongoDBURI
            - Name: JWT_SECRET
              Value: !Ref JWTSecret
            - Name: FRONTEND_URL
              Value: !Ref FrontendURL
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: /ecs/crm-backend
              awslogs-region: us-east-1
              awslogs-stream-prefix: ecs

  # CloudWatch Log Group
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/crm-backend
      RetentionInDays: 7

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: Listener
    Properties:
      ServiceName: crm-backend-service
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: ENABLED
          Subnets:
            - !Ref PublicSubnet1
            - !Ref PublicSubnet2
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: crm-backend
          ContainerPort: 5000
          TargetGroupArn: !Ref TargetGroup

Outputs:
  LoadBalancerURL:
    Description: URL of the load balancer
    Value: !GetAtt LoadBalancer.DNSName
```

Deploy with:
```bash
aws cloudformation create-stack \
  --stack-name crm-backend-infrastructure \
  --template-body file://aws/backend-ecs-infrastructure.yml \
  --parameters \
    ParameterKey=MongoDBURI,ParameterValue="mongodb+srv://..." \
    ParameterKey=JWTSecret,ParameterValue="your-secret" \
    ParameterKey=FrontendURL,ParameterValue="https://yourdomain.com" \
  --capabilities CAPABILITY_IAM
```

---

## Frontend Deployment Options

### **Option A: AWS Amplify (RECOMMENDED - EASIEST)**

**Pros**: Fully managed, CI/CD built-in, automatic HTTPS
**Cons**: AWS-specific, moderate cost
**Cost**: ~$15-30/month

```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialize Amplify (in frontend directory)
cd frontend
amplify init

# 3. Add hosting
amplify add hosting
# Select: Hosting with Amplify Console
# Choose: Continuous deployment

# 4. Publish
amplify publish

# 5. Set environment variables in Amplify Console
# Go to: AWS Amplify Console > App Settings > Environment variables
# Add:
#   NEXT_PUBLIC_API_URL = https://your-backend-url.com/api/v1
#   NEXT_PUBLIC_APP_URL = https://yourdomain.com
```

#### Connect GitHub for Auto-Deployment

1. Go to AWS Amplify Console
2. Click "New app" > "Host web app"
3. Connect your GitHub repository
4. Branch: main
5. Build settings (auto-detected for Next.js)
6. Add environment variables
7. Save and deploy

---

### **Option B: S3 + CloudFront (Static Export)**

**Pros**: Cheapest option, CDN included
**Cons**: Requires static export (no SSR)
**Cost**: ~$5-10/month

```bash
# 1. Update next.config.js for static export
# Add: output: 'export'

# 2. Build static files
cd frontend
npm run build
# Creates 'out' directory

# 3. Create S3 bucket
aws s3 mb s3://crm-frontend-prod --region us-east-1

# 4. Configure bucket for static website hosting
aws s3 website s3://crm-frontend-prod \
  --index-document index.html \
  --error-document 404.html

# 5. Upload files
aws s3 sync out/ s3://crm-frontend-prod --delete

# 6. Create CloudFront distribution (via AWS Console)
# - Origin: S3 bucket
# - Viewer protocol policy: Redirect HTTP to HTTPS
# - Alternate domain names: yourdomain.com
# - SSL certificate: Request from ACM
```

---

## Complete Deployment Steps (Full Stack)

### Step-by-Step Production Deployment

#### Phase 1: Pre-Deployment Checklist

```bash
# 1. Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Save this output

# 2. Update environment variables
# Create .env.production in frontend/
# Create application-prod.properties in backend/src/main/resources/

# 3. Test locally with production config
cd backend
./mvnw clean package -DskipTests
java -jar -Dspring.profiles.active=prod target/backend-*.jar

cd ../frontend
npm run build
npm start
```

#### Phase 2: Database Setup

```bash
# 1. Create MongoDB Atlas cluster (as described above)
# 2. Create database user
# 3. Whitelist IPs
# 4. Get connection string
# 5. Test connection
mongosh "mongodb+srv://crm_admin:PASSWORD@cluster.mongodb.net/crm_production"
```

#### Phase 3: Backend Deployment

```bash
# Choose ONE option:

# Option A: Elastic Beanstalk
cd backend
eb init
eb create crm-backend-prod
eb setenv SPRING_DATA_MONGODB_URI="..." JWT_SECRET="..."
eb deploy

# Option B: ECS Fargate
cd backend
docker build -t crm-backend .
aws ecr get-login-password | docker login ...
docker push ...
aws cloudformation create-stack ...
```

#### Phase 4: Frontend Deployment

```bash
# Choose ONE option:

# Option A: AWS Amplify
cd frontend
amplify init
amplify add hosting
amplify publish

# Option B: S3 + CloudFront
npm run build
aws s3 sync out/ s3://bucket-name
# Create CloudFront distribution
```

#### Phase 5: Domain Configuration

```bash
# 1. Purchase domain (or use existing)
# - GoDaddy, Namecheap, or Route 53

# 2. Create Route 53 hosted zone
aws route53 create-hosted-zone --name yourdomain.com

# 3. Update nameservers at domain registrar

# 4. Create DNS records
# A record: yourdomain.com → CloudFront/Amplify
# A record: api.yourdomain.com → Load Balancer

# 5. Request SSL certificates (ACM)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS
```

#### Phase 6: Post-Deployment

```bash
# 1. Test all endpoints
curl https://api.yourdomain.com/api/v1/actuator/health

# 2. Test frontend
open https://yourdomain.com

# 3. Monitor logs
# Elastic Beanstalk: eb logs
# ECS: aws logs tail /ecs/crm-backend --follow
# Amplify: Check Amplify Console

# 4. Set up monitoring
# Enable CloudWatch alarms
# Set up AWS SNS for alerts
```

---

## Cost Estimation

### **Budget Option (~$20-40/month)**
- MongoDB Atlas M0: $0 (FREE)
- Backend: AWS Elastic Beanstalk t3.micro: $10-15
- Frontend: AWS Amplify: $15
- **Total: ~$25-30/month**

### **Production Option (~$100-150/month)**
- MongoDB Atlas M10: $57
- Backend: ECS Fargate (2 tasks): $30-40
- Frontend: AWS Amplify: $20
- CloudFront CDN: $10
- Route 53: $0.50
- **Total: ~$120-130/month**

### **Enterprise Option (~$300+/month)**
- MongoDB Atlas M20: $80
- Backend: ECS Fargate (4+ tasks with auto-scaling): $80-120
- Frontend: Amplify with custom domain: $30
- CloudFront: $20
- WAF (Web Application Firewall): $50
- CloudWatch & monitoring: $20
- **Total: ~$280-320/month**

---

## Monitoring & Maintenance

### CloudWatch Monitoring

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name CRM-Dashboard \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Alarms Setup

```bash
# CPU Utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name crm-backend-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name crm-backend-errors \
  --alarm-description "Alert on high error rate" \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Backup Strategy

```bash
# MongoDB Atlas automatic backups (enabled by default)
# Configure:
# - Retention period: 7-30 days
# - Snapshot frequency: Daily
# - Point-in-time recovery: Enable for production

# Application backups
# S3 versioning for static assets
aws s3api put-bucket-versioning \
  --bucket crm-frontend-prod \
  --versioning-configuration Status=Enabled
```

---

## Security Best Practices

### 1. Enable AWS WAF

```bash
# Protect against common attacks
aws wafv2 create-web-acl \
  --name crm-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json
```

### 2. Enable Security Groups

```bash
# Restrict backend access to ALB only
# Restrict MongoDB Atlas to AWS IP ranges only
```

### 3. Secrets Management

```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name crm/mongodb-uri \
  --secret-string "mongodb+srv://..."

aws secretsmanager create-secret \
  --name crm/jwt-secret \
  --secret-string "your-secret-key"
```

### 4. Enable Logging

```bash
# Enable ALB access logs
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn <arn> \
  --attributes Key=access_logs.s3.enabled,Value=true \
              Key=access_logs.s3.bucket,Value=crm-logs
```

---

## CI/CD Pipeline

Create: `.github/workflows/deploy-aws.yml`

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend
        working-directory: ./backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t crm-backend .
          docker tag crm-backend:latest $ECR_REGISTRY/crm-backend:latest
          docker push $ECR_REGISTRY/crm-backend:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster crm-backend-cluster \
            --service crm-backend-service \
            --force-new-deployment

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Amplify CLI
        run: npm install -g @aws-amplify/cli

      - name: Deploy to Amplify
        working-directory: ./frontend
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          amplify publish --yes
```

---

## Troubleshooting

### Common Issues

1. **Backend won't start**:
   ```bash
   # Check logs
   eb logs
   # Or for ECS
   aws logs tail /ecs/crm-backend --follow
   ```

2. **MongoDB connection fails**:
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Check network access settings

3. **CORS errors**:
   - Update `cors.allowed-origins` in application-prod.properties
   - Redeploy backend

4. **Frontend not loading**:
   - Check environment variables
   - Verify CloudFront distribution
   - Check S3 bucket permissions

---

## Quick Start Commands

```bash
# Full deployment in one go (after setup)
./deploy-aws.sh
```

Create: `deploy-aws.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting AWS deployment..."

# Backend
echo "📦 Building backend..."
cd backend
docker build -t crm-backend .
docker tag crm-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest

echo "🔄 Updating ECS service..."
aws ecs update-service --cluster crm-backend-cluster --service crm-backend-service --force-new-deployment

cd ..

# Frontend
echo "🎨 Building frontend..."
cd frontend
npm run build
amplify publish --yes

cd ..

echo "✅ Deployment complete!"
echo "Backend: https://api.yourdomain.com"
echo "Frontend: https://yourdomain.com"
```

---

## Summary

**Recommended Setup for Production:**

1. **Database**: MongoDB Atlas M10 on AWS ($57/month)
2. **Backend**: AWS ECS Fargate ($30-40/month)
3. **Frontend**: AWS Amplify ($20/month)
4. **Total Cost**: ~$110-120/month

**Timeline**:
- MongoDB Atlas setup: 30 minutes
- Backend deployment: 1-2 hours
- Frontend deployment: 30 minutes
- DNS & SSL setup: 30 minutes
- **Total: 3-4 hours**

**Next Steps**:
1. Create MongoDB Atlas cluster
2. Choose backend deployment method (Elastic Beanstalk or ECS)
3. Choose frontend deployment method (Amplify or S3+CloudFront)
4. Follow deployment steps
5. Set up monitoring and backups

Let me know which option you'd like to proceed with! 🚀
