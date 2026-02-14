# CLAWDIS Dashboard Production Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set `NEXT_PUBLIC_GATEWAY_BASE_URL` to production gateway
- [ ] Set `NEXT_PUBLIC_GATEWAY_WS_URL` to production WebSocket URL (wss://)
- [ ] Configure `NEXT_PUBLIC_APP_VERSION` to release version
- [ ] Set up Sentry/DataDog for error tracking
- [ ] Configure analytics service if needed

### Code Quality
- [ ] Run `pnpm lint` - no errors
- [ ] Run `pnpm build` - no errors
- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm test:coverage` - coverage >= 80%
- [ ] Review TypeScript errors: `npx tsc --noEmit`
- [ ] Check for console.log() statements (remove debug logs)

### Security
- [ ] Security headers verified in `middleware.ts`
- [ ] CSP policy reviewed and updated
- [ ] Environment variables are not exposed
- [ ] Secrets stored in secure vault (not git)
- [ ] SSL/TLS certificate installed
- [ ] API rate limiting configured

### Performance
- [ ] Lighthouse audit >= 90 all scores
- [ ] Bundle size analyzed and acceptable
- [ ] Images optimized for production
- [ ] WebSocket compression enabled (if available)
- [ ] CDN configured for static assets
- [ ] Caching headers configured

### Documentation
- [ ] README updated with production URLs
- [ ] DEPLOYMENT.md matches your setup
- [ ] Runbook created for incident response
- [ ] Team trained on deployment process
- [ ] Support documentation available

## Deployment

### Vercel Deployment
- [ ] GitHub repository connected to Vercel
- [ ] Environment variables added in Vercel dashboard
- [ ] Production domain configured
- [ ] Preview deployments working
- [ ] Custom domain SSL certificate verified

### Docker Deployment
- [ ] Dockerfile reviewed and tested
- [ ] docker-compose.yml configured
- [ ] Image builds without errors
- [ ] Container runs and serves requests
- [ ] Health check endpoint responding

### Cloud Provider Setup
- [ ] Account and project created
- [ ] IAM roles/permissions configured
- [ ] Storage buckets created (if needed)
- [ ] Databases provisioned and tested
- [ ] Backup strategy implemented

## Post-Deployment Testing

### Functionality
- [ ] Dashboard loads without errors
- [ ] Connection to gateway established
- [ ] Real-time updates working
- [ ] All pages accessible and functional
- [ ] Forms submit and process correctly
- [ ] Error pages display correctly

### Performance
- [ ] Page load time < 3 seconds
- [ ] LCP score < 2.5 seconds
- [ ] FID/INP score < 100ms
- [ ] CLS score < 0.1
- [ ] Network waterfall optimized

### Security
- [ ] CSP headers present and correct
- [ ] XSS Protection enabled
- [ ] HTTPS/WSS enforced
- [ ] Session management working
- [ ] Rate limiting active
- [ ] No sensitive data in logs

### Compatibility
- [ ] Works on Chrome/Firefox/Safari/Edge
- [ ] Mobile view responsive
- [ ] Tablet view optimized
- [ ] Touch interactions working
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible

### Monitoring
- [ ] Error tracking system receiving errors
- [ ] Performance metrics being collected
- [ ] Health check endpoint working
- [ ] Logging system capturing events
- [ ] Alerts configured for critical issues

## Production Operations

### Daily Checks
- [ ] Dashboard availability verified
- [ ] Error rate within normal range
- [ ] Performance metrics stable
- [ ] WebSocket connections healthy
- [ ] Gateway communication working

### Weekly Tasks
- [ ] Review error logs for patterns
- [ ] Check performance trends
- [ ] Monitor resource usage
- [ ] Update security patches
- [ ] Review backup status

### Monthly Tasks
- [ ] Security audit
- [ ] Performance analysis
- [ ] Capacity planning review
- [ ] Documentation update
- [ ] Team training/knowledge share

## Backup & Disaster Recovery

### Backup Strategy
- [ ] Database backups automated (daily)
- [ ] Backups encrypted and stored off-site
- [ ] Restore procedure tested monthly
- [ ] RTO/RPO defined
- [ ] Backup retention policy set

### Disaster Recovery
- [ ] Failover procedure documented
- [ ] Rollback procedure tested
- [ ] Incident response plan created
- [ ] Contact list updated
- [ ] Post-incident review process defined

## Monitoring & Alerting

### Metrics to Monitor
- [ ] Response time (p50, p95, p99)
- [ ] Error rate (4xx, 5xx)
- [ ] WebSocket connection failures
- [ ] Memory usage
- [ ] CPU usage
- [ ] Disk usage

### Alerts to Configure
- [ ] Error rate > 5%
- [ ] Response time > 1 second
- [ ] WebSocket disconnections
- [ ] Memory usage > 80%
- [ ] Disk usage > 90%
- [ ] SSL certificate expiration (30 days)

### Logging
- [ ] Application logs centralized
- [ ] Log retention configured
- [ ] Log search/analysis tool available
- [ ] Sensitive data not logged
- [ ] Log rotation configured

## Compliance & Standards

### Security Standards
- [ ] OWASP Top 10 reviewed
- [ ] GDPR compliance (if applicable)
- [ ] Data privacy policy posted
- [ ] Terms of service available
- [ ] Security.txt file created

### Performance Standards
- [ ] Core Web Vitals target met
- [ ] Lighthouse score >= 90
- [ ] Accessibility score >= 90
- [ ] SEO score >= 90
- [ ] Best Practices score >= 90

### Code Standards
- [ ] TypeScript strict mode
- [ ] 80%+ test coverage
- [ ] ESLint passing
- [ ] No technical debt items
- [ ] Documentation up to date

## Communication

### Stakeholders Notified
- [ ] Team of deployment
- [ ] Operations team of changes
- [ ] Management of go-live
- [ ] Support team of new features
- [ ] Users of production URL (if public)

### Documentation Shared
- [ ] Deployment guide provided
- [ ] Architecture diagram shared
- [ ] Runbook distributed
- [ ] Contact list updated
- [ ] Training materials available

## Sign-Off

### Development Team
- [ ] Lead dev: _________________  Date: ________
- [ ] QA: _______________________  Date: ________

### Operations Team
- [ ] Ops lead: __________________  Date: ________
- [ ] DevOps: ____________________  Date: ________

### Management
- [ ] Project lead: _______________  Date: ________
- [ ] Manager: ___________________  Date: ________

## Post-Go-Live

### Week 1
- [ ] Monitor dashboard 24/7
- [ ] Respond to issues immediately
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Document any issues

### Week 2-4
- [ ] Continue monitoring
- [ ] Implement fixes from week 1
- [ ] Optimize performance based on data
- [ ] Fine-tune alerts
- [ ] Plan next improvements

### Month 2+
- [ ] Establish baseline metrics
- [ ] Plan optimization roadmap
- [ ] Schedule retrospective
- [ ] Update documentation
- [ ] Plan next major feature

## Rollback Procedure

If critical issues occur:

1. **Immediate Actions**
   - [ ] Declare incident
   - [ ] Alert response team
   - [ ] Assess severity

2. **Rollback Decision**
   - [ ] Compare rollback risk vs. fix risk
   - [ ] Get approval from lead

3. **Rollback Execution**
   - [ ] Execute rollback procedure
   - [ ] Verify previous version working
   - [ ] Notify stakeholders

4. **Post-Rollback**
   - [ ] Investigate root cause
   - [ ] Implement fix
   - [ ] Test extensively
   - [ ] Re-deploy when ready

## Emergency Contacts

- **On-Call**: ____________________________
- **Lead Dev**: ___________________________
- **Ops Lead**: ____________________________
- **Manager**: _____________________________
- **Sentry/DataDog**: ______________________

## Notes

```
Use this space for deployment-specific notes:

- Build date: ___________________
- Deployed by: _________________
- Deployment time: _____________
- Estimated users: _____________
- Known issues: _________________
```

---

**Document Created**: February 2026
**CLAWDIS Version**: 2.0.0-beta1
**Last Updated**: _____________
**Next Review**: _____________
