# CLAWDIS Dashboard - Production Runbook

Emergency procedures and troubleshooting guide for production incidents.

## Quick Links

- **Dashboard**: https://dashboard.clawdis.dev
- **Status Page**: https://status.clawdis.dev
- **Sentry Errors**: https://sentry.io/organizations/clawdis
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/FortiShield/openclaw

## On-Call Rotation

Contact information will be maintained separately in secure system.

## Incident Severity Levels

### P1 - Critical (Downtime)
- Dashboard completely unavailable
- Gateway connection broken
- Data loss occurring
- Security breach in progress

**Response Time**: < 5 minutes
**Escalation**: Immediate

### P2 - High (Major Degradation)
- Dashboard slow (>5s load time)
- Features not working (WebSocket, config changes)
- High error rate (>5%)
- Partial data unavailable

**Response Time**: < 15 minutes
**Escalation**: If not resolved in 30 min

### P3 - Medium (Minor Issues)
- Minor UI bugs
- Slow API responses (<2s)
- Intermittent errors
- Performance issues

**Response Time**: < 1 hour
**Escalation**: If not resolved in 4 hours

### P4 - Low (Documentation/Enhancement)
- Typos, documentation issues
- Enhancement requests
- Non-critical bug reports

**Response Time**: Next business day

## Common Issues & Solutions

### Dashboard Won't Load

#### Check 1: Service Status
```bash
# Check if dashboard is running
curl https://dashboard.clawdis.dev/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T00:00:00.000Z",
  "version": "2.0.0-beta1",
  "environment": "production",
  "uptime": 12345
}
```

#### Check 2: Gateway Connection
```bash
# Verify gateway is accessible
curl https://gateway.clawdis.dev/health
```

#### Check 3: Environment Variables
```bash
# Verify required env vars are set
vercel env ls --production
```

Must include:
- NEXT_PUBLIC_GATEWAY_BASE_URL
- NEXT_PUBLIC_GATEWAY_WS_URL
- NEXT_PUBLIC_APP_URL

#### Check 4: Deployment Status
- Check Vercel dashboard for deployment status
- Look for recent deployments in Activity
- Check for failed builds or deployments

### High Error Rate (>5%)

#### Step 1: Check Sentry
- Go to https://sentry.io/organizations/clawdis
- Look at "All Issues" filtered to last 24 hours
- Identify the most common error
- Check error context (browser, OS, user)

#### Step 2: Check Application Logs
```bash
# For Vercel deployment
vercel logs --production

# For Docker deployment
docker logs clawdis-dashboard
```

#### Step 3: Restart Services
```bash
# Vercel - redeploy
vercel redeploy

# Docker
docker restart clawdis-dashboard

# Kubernetes
kubectl rollout restart deployment/dashboard -n clawdis
```

#### Step 4: Roll Back if Needed
```bash
# Vercel
vercel rollback

# Docker - use previous image
docker run -d <previous-image-hash>

# Kubernetes
kubectl rollout undo deployment/dashboard -n clawdis
```

### WebSocket Connection Failing

#### Check 1: Gateway Health
```bash
curl https://gateway.clawdis.dev/health
```

#### Check 2: Proxy Configuration
- For nginx: Verify WebSocket upgrade headers
- For Cloudflare: Check that WebSockets are enabled
- For AWS ALB: Ensure sticky sessions enabled

```nginx
# Correct nginx config
location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### Check 3: Firewall/Security
- Verify WSS port (usually 443) is not blocked
- Check WAF rules not blocking WebSocket traffic
- Review rate limiting policies

#### Check 4: Environment Variables
- Ensure NEXT_PUBLIC_GATEWAY_WS_URL points to correct WSS endpoint
- Verify it matches production domain

### Slow Performance (>3s load time)

#### Step 1: Run Lighthouse Audit
- In browser: F12 → Lighthouse tab
- Target scores: >= 90 all metrics
- Focus on: LCP, FID/INP, CLS

#### Step 2: Check Bundle Size
```bash
# Analyze bundle
npm run build
# Check .next/static/chunks/ sizes
```

Target: Total JS < 200KB

#### Step 3: Check Gateway Response Time
```bash
# Measure response time
curl -w "@curl-format.txt" -o /dev/null \
  https://gateway.clawdis.dev/api/status
```

If gateway slow: Escalate to gateway team

#### Step 4: Optimize if Needed
- Clear CDN cache (Vercel: automatic, CloudFlare: manual)
- Check for missing images optimizations
- Review database queries (if applicable)

### Memory/CPU Issues

#### For Vercel
- Check Vercel dashboard for function metrics
- If consistently high: Upgrade plan
- Review function memory allocation in vercel.json

#### For Docker
```bash
# Monitor resources
docker stats clawdis-dashboard

# Check memory usage
docker ps --format "table {{.Names}}\t{{.MemUsage}}"
```

If too high:
- Increase container memory limit
- Check for memory leaks in application
- Review connected client count

#### For Kubernetes
```bash
# Check resource usage
kubectl top pods -n clawdis

# Check limits
kubectl describe pod <pod-name> -n clawdis
```

If too high:
- Increase resource limits
- Check for memory leaks
- Scale replicas if needed

### SSL/Certificate Issues

#### Check Certificate Validity
```bash
# Check expiration
echo | openssl s_client -servername dashboard.clawdis.dev \
  -connect dashboard.clawdis.dev:443 2>/dev/null | \
  openssl x509 -noout -dates
```

#### Renew Certificate
- Vercel: Automatic (no action needed)
- CloudFlare: Automatic (no action needed)
- Manual: Use Let's Encrypt certbot
  ```bash
  certbot renew
  ```

### Database Issues (if applicable)

#### Check Connection
```bash
# Test database connection
psql -h db.example.com -U postgres -d clawdis -c "SELECT 1"
```

#### Backup Status
```bash
# List recent backups
aws s3 ls s3://backups/clawdis/ --recursive --summarize
```

#### Restore from Backup
```bash
# For PostgreSQL
aws s3 cp s3://backups/clawdis/latest.sql.gz - | \
  gunzip | psql -h db.example.com -U postgres -d clawdis
```

## Escalation Process

### Unable to Resolve in 15 Minutes

1. **Page on-call engineer**
   - Use team's paging system
   - Provide incident summary
   - Share relevant logs/metrics

2. **Create incident ticket**
   - GitHub issue or Jira
   - Include: Timeline, logs, steps taken
   - Set priority based on severity

3. **Update status page**
   - Go to https://status.clawdis.dev
   - Update incident status
   - Post regular updates (every 15 min)

### Unable to Resolve in 1 Hour

1. **Prepare rollback**
   - Identify last known good version
   - Test rollback in staging
   - Get approval from team lead

2. **Execute rollback**
   - See "Roll Back" sections above
   - Monitor metrics after rollback
   - Post-mortem within 24 hours

3. **Continue Investigation**
   - Investigation continues offline
   - Schedule root cause analysis
   - Plan fix and re-deployment

## Monitoring Dashboard

Key metrics to watch:

- **Uptime**: Should be > 99.9%
- **Error Rate**: Should be < 1%
- **Response Time (p95)**: Should be < 1s
- **WebSocket Connections**: Should be stable
- **CPU Usage**: Should be < 70%
- **Memory Usage**: Should be < 80%

### Vercel Metrics
- Dashboard: https://vercel.com/dashboard/project-id

### Custom Monitoring
- Sentry: https://sentry.io/organizations/clawdis
- DataDog (if enabled): https://app.datadoghq.com
- New Relic (if enabled): https://one.newrelic.com

## Communication Templates

### Incident Started
```
⚠️  INCIDENT: Dashboard unavailable
Severity: P[1-4]
Start Time: [HH:MM UTC]
Status: INVESTIGATING
Latest: [current status]
```

### Ongoing Update
```
🔄 UPDATE: [time]
Status: INVESTIGATING
Actions Taken:
- [action 1]
- [action 2]
ETA for Resolution: [time]
```

### Resolved
```
✅ RESOLVED: [time]
Root Cause: [brief description]
Duration: [minutes]
Next: Post-mortem scheduled for [time]
```

## Post-Incident

### Within 24 Hours
- [ ] Create post-mortem document
- [ ] Identify root cause
- [ ] Assign action items
- [ ] Set follow-up meeting

### Post-Mortem Content
- Timeline of events
- Root cause analysis
- Contributing factors
- Action items to prevent recurrence
- Timeline for implementing fixes

### Knowledge Base
- Document issue and solution
- Add to FAQ section
- Update runbook if needed
- Share with team

## Useful Commands

```bash
# Check health
curl https://dashboard.clawdis.dev/api/health

# Check logs (Vercel)
vercel logs --production

# Check logs (Docker)
docker logs clawdis-dashboard -f

# Restart service (Docker)
docker restart clawdis-dashboard

# Redeploy (Vercel)
vercel redeploy

# Rollback (Vercel)
vercel rollback

# Clear cache
curl -X POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

## Emergency Contacts

Update with actual contact information:

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Lead Dev | [Name] | [Phone] | @[slack] |
| DevOps Lead | [Name] | [Phone] | @[slack] |
| Manager | [Name] | [Phone] | @[slack] |
| Escalation | [Name] | [Phone] | @[slack] |

## Resources

- **Dashboard Code**: https://github.com/FortiShield/openclaw
- **Deployment Guide**: docs/DEPLOYMENT.md
- **Production Checklist**: PRODUCTION_CHECKLIST.md
- **Architecture**: docs/ARCHITECTURE.md
- **API Docs**: https://api.clawdis.dev/docs

Last Updated: 2026-02-14
Next Review: 2026-03-14
