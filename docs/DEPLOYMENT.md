# CLAWDIS Deployment Guide

## Overview

This guide covers deploying the CLAWDIS Dashboard to production environments. The dashboard is built with Next.js 15 and can be deployed to various platforms.

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the optimal deployment platform for Next.js applications with built-in CI/CD, edge functions, and analytics.

#### Prerequisites
- GitHub repository with CLAWDIS code
- Vercel account (https://vercel.com)
- Environment variables configured

#### Deployment Steps

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy project
vercel deploy

# 4. Configure environment variables
vercel env add NEXT_PUBLIC_GATEWAY_BASE_URL
vercel env add NEXT_PUBLIC_GATEWAY_WS_URL
vercel env add NEXT_PUBLIC_APP_URL
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN

# 5. Set as production deployment
vercel promote <deployment-url>
```

#### Production Configuration

Create `vercel.json` for advanced configuration:

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev",
  "env": {
    "NEXT_PUBLIC_APP_URL": {
      "required": true
    },
    "NEXT_PUBLIC_GATEWAY_BASE_URL": {
      "required": true
    },
    "NEXT_PUBLIC_GATEWAY_WS_URL": {
      "required": true
    }
  },
  "regions": [
    "iad1",
    "sfo1"
  ],
  "functions": {
    "app/api/**": {
      "maxDuration": 60
    }
  }
}
```

### 2. Docker Deployment

For self-hosted or cloud deployments (AWS, GCP, etc.).

#### Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Install only production dependencies
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["pnpm", "start"]
```

#### Build and Run

```bash
# Build image
docker build -t clawdis-dashboard:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_GATEWAY_BASE_URL=http://gateway:3001 \
  -e NEXT_PUBLIC_GATEWAY_WS_URL=ws://gateway:3001 \
  -e NEXT_PUBLIC_APP_URL=https://dashboard.example.com \
  clawdis-dashboard:latest

# Or with docker-compose
docker-compose up
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_APP_URL: https://dashboard.example.com
      NEXT_PUBLIC_GATEWAY_BASE_URL: http://gateway:3001
      NEXT_PUBLIC_GATEWAY_WS_URL: ws://gateway:3001
    depends_on:
      - gateway
    restart: unless-stopped

  gateway:
    image: clawdis-gateway:latest
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
    restart: unless-stopped
```

### 3. AWS Deployment

#### ECS (Recommended)

```bash
# 1. Push image to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag clawdis-dashboard:latest <account>.dkr.ecr.<region>.amazonaws.com/clawdis-dashboard:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/clawdis-dashboard:latest

# 2. Create ECS Task Definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 3. Create ECS Service
aws ecs create-service --cluster clawdis --service-name dashboard --task-definition clawdis-dashboard
```

#### Lambda + API Gateway

For serverless deployment (higher latency, not recommended for WebSocket):

```bash
# Install Serverless Framework
npm install -g serverless

# Deploy
serverless deploy
```

### 4. Google Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/<project>/clawdis-dashboard

# Deploy to Cloud Run
gcloud run deploy clawdis-dashboard \
  --image gcr.io/<project>/clawdis-dashboard \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_GATEWAY_BASE_URL=https://gateway.example.com
```

### 5. Kubernetes

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: clawdis

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dashboard
  namespace: clawdis
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dashboard
  template:
    metadata:
      labels:
        app: dashboard
    spec:
      containers:
      - name: dashboard
        image: clawdis-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_GATEWAY_BASE_URL
          valueFrom:
            configMapKeyRef:
              name: gateway-config
              key: base-url
        - name: NEXT_PUBLIC_GATEWAY_WS_URL
          valueFrom:
            configMapKeyRef:
              name: gateway-config
              key: ws-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: dashboard-service
  namespace: clawdis
spec:
  selector:
    app: dashboard
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Environment Configuration

### Required Variables
```env
NEXT_PUBLIC_APP_URL=https://dashboard.clawdis.dev
NEXT_PUBLIC_GATEWAY_BASE_URL=https://gateway.clawdis.dev
NEXT_PUBLIC_GATEWAY_WS_URL=wss://gateway.clawdis.dev
```

### Optional Variables
```env
NEXT_PUBLIC_APP_VERSION=2.0.0-beta1
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token_here
TELEGRAM_BOT_TOKEN=your_token_here
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Database Setup (if needed)

For session persistence or analytics:

```sql
-- PostgreSQL example
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  value FLOAT NOT NULL,
  rating VARCHAR(50),
  delta FLOAT,
  url TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
```

## SSL/TLS Configuration

### Using Let's Encrypt + Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.clawdis.dev;

    ssl_certificate /etc/letsencrypt/live/dashboard.clawdis.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.clawdis.dev/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### CloudFlare SSL

1. Add your domain to CloudFlare
2. Change nameservers to CloudFlare
3. Set SSL mode to "Flexible" or "Full"
4. CloudFlare automatically handles certificate renewal

## Monitoring & Logging

### Application Monitoring

```typescript
// Integrate with monitoring service
import Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
```

### Log Aggregation

```bash
# Using ELK Stack
docker run -d -p 9200:9200 docker.elastic.co/elasticsearch/elasticsearch:8.0.0

# Or cloud services
# - DataDog
# - Splunk
# - New Relic
# - Sumo Logic
```

## Health Checks

### Kubernetes Health Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/metrics
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Custom Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    uptime: process.uptime(),
  });
}
```

## Backup & Disaster Recovery

### Database Backups

```bash
# Daily backup to S3
0 2 * * * pg_dump clawdis | gzip > backup_$(date +\%Y\%m\%d).sql.gz && \
  aws s3 cp backup_$(date +\%Y\%m\%d).sql.gz s3://backups/clawdis/
```

### Configuration Backups

```bash
# Backup environment variables (encrypted)
aws secretsmanager create-secret --name clawdis/env --secret-string file://production.env
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (AWS ELB, nginx)
- WebSocket connection balancing
- Session state management

### Vertical Scaling

- Increase container memory/CPU
- Upgrade server hardware
- Optimize code performance

## Cost Optimization

### Vercel
- Use Hobby plan for staging
- Pro plan for production ($20/month)
- Only pay for actual usage

### Docker/Self-hosted
- Use spot instances (AWS EC2)
- Reserved instances for stable workloads
- Auto-scaling based on metrics

## Post-Deployment Checklist

- [ ] Test dashboard accessibility
- [ ] Verify WebSocket connection
- [ ] Check all environment variables
- [ ] Run Lighthouse audit
- [ ] Test on mobile devices
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Enable logging
- [ ] Configure alerts
- [ ] Create runbook for incidents
- [ ] Document deployment process
- [ ] Train team on deployment

## Rollback Procedure

### Vercel
```bash
# Redeploy previous version
vercel rollback
```

### Docker
```bash
# Rollback to previous image
docker stop clawdis-dashboard
docker run -d --name clawdis-dashboard <previous-image-sha>
```

### Kubernetes
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/dashboard -n clawdis
```

## Troubleshooting

### High Memory Usage
- Check for memory leaks
- Review container memory limits
- Analyze heap dumps

### WebSocket Connection Issues
- Verify gateway connectivity
- Check firewall rules
- Review proxy configuration

### Slow Performance
- Review CloudFlare/CDN settings
- Check database performance
- Profile application

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Community: Discord/Slack
