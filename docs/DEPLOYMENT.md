# Deployment & Launch Guide (PHASE 23)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (>75% coverage)
- [ ] No ESLint errors or warnings
- [ ] TypeScript strict mode - no errors
- [ ] Code reviewed and approved
- [ ] No security vulnerabilities (npm audit)
- [ ] Documentation updated
- [ ] Changelog prepared

### Infrastructure
- [ ] MongoDB Atlas cluster configured
- [ ] Redis instance ready (Upstash or AWS ElastiCache)
- [ ] Environment variables set
- [ ] SSL certificates ready
- [ ] CDN configured
- [ ] Email service configured (SendGrid)
- [ ] SMS service configured (Twilio)
- [ ] Payment gateway (Razorpay) configured

### Monitoring & Logging
- [ ] Error tracking (Sentry) configured
- [ ] Application monitoring (DataDog/New Relic) configured
- [ ] Log aggregation (ELK/CloudWatch) configured
- [ ] Uptime monitoring configured
- [ ] Alerts configured
- [ ] Dashboard created

### Security
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] API keys rotated
- [ ] Database credentials secured
- [ ] Secrets not in code
- [ ] Security headers configured
- [ ] OWASP compliance verified

## Deployment Environments

### Development
- **URL:** localhost:3000 (frontend), localhost:5000 (API)
- **Database:** Local MongoDB
- **Redis:** Local Redis
- **Purpose:** Active development

### Staging
- **URL:** staging.staysphere.ai
- **Database:** MongoDB Atlas (staging cluster)
- **Redis:** Upstash (staging)
- **Purpose:** Pre-production testing
- **SSL:** Let's Encrypt

### Production
- **URL:** staysphere.ai, www.staysphere.ai
- **Database:** MongoDB Atlas (production cluster)
- **Redis:** AWS ElastiCache (prod)
- **Purpose:** Live platform
- **SSL:** Cloudflare or DigiCert

## Frontend Deployment

### Build & Optimization
```bash
npm run build:web
# Output: apps/web/dist/
```

### Deploy to Vercel
```bash
# Connect repo to Vercel
# Auto-deploys on main branch push
vercel --prod
```

### Deploy to Netlify
```bash
# Connect repo to Netlify
# Auto-deploys on main branch push
netlify deploy --prod
```

### Deploy to AWS S3 + CloudFront
```bash
# Build
npm run build:web

# Sync to S3
aws s3 sync apps/web/dist s3://staysphere-web --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E123... --paths "/*"
```

### Deployment Settings
- Build command: `npm run build:web`
- Output directory: `apps/web/dist`
- Environment variables: `VITE_API_URL`

## Backend Deployment

### Build & Preparation
```bash
npm run build:api
# Output: apps/api/dist/
```

### Docker Deployment
```bash
# Build image
docker build -f infrastructure/docker/Dockerfile.api -t staysphere-api:latest .

# Push to registry
docker push registry.example.com/staysphere-api:latest

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=mongodb://... \
  -e REDIS_URL=redis://... \
  staysphere-api:latest
```

### Kubernetes Deployment
```bash
# Apply manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment
kubectl get pods -n staysphere
kubectl logs -n staysphere deployment/api
```

### Deploy to AWS ECS/Fargate
1. Create ECR repository
2. Build and push Docker image
3. Create ECS task definition
4. Create ECS service
5. Configure load balancer
6. Set up auto-scaling

### Deploy to Render/Railway
```bash
# Connect repo
# Select branch (main)
# Set environment variables
# Deploy
```

## Database Migrations

### Pre-Deployment
```bash
# Backup production database
mongodump --uri="mongodb+srv://..." --out backup/

# Run migrations on staging first
npm run migrate:staging

# Verify data integrity
npm run verify:db
```

### During Deployment
```bash
# Run migrations
npm run migrate:prod

# Verify schema
npm run check:schema
```

### Rollback Plan
```bash
# Restore from backup if needed
mongorestore --uri="mongodb+srv://..." backup/
```

## Environment Variables

### Frontend (.env.production)
```
VITE_API_URL=https://api.staysphere.ai/api/v1
VITE_APP_NAME=STAYSPHERE AI
VITE_VERSION=1.0.0
```

### Backend (.env.production)
```
NODE_ENV=production
PORT=5000
CLIENT_URL=https://staysphere.ai

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/staysphere-prod

# Redis
REDIS_URL=redis://:password@host:6379

# JWT
JWT_ACCESS_SECRET=<generate-secure-secret>
JWT_REFRESH_SECRET=<generate-secure-secret>

# Payment
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=secret

# Email
SENDGRID_API_KEY=SG.xxxxx

# SMS
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=token

# AI Provider
AI_PROVIDER=kiro
AI_API_KEY=key

# Logging & Monitoring
SENTRY_DSN=https://xxx@sentry.io/project
LOG_LEVEL=info
```

## Deployment Steps

### 1. Pre-Deployment (1-2 hours before)
- [ ] Notify team in #deployments channel
- [ ] Verify all tests passing
- [ ] Create release tag
- [ ] Backup production database
- [ ] Verify staging deployment
- [ ] Check status page

### 2. Deployment (30-60 minutes)
- [ ] Deploy backend (rolling update)
- [ ] Verify API health checks
- [ ] Deploy frontend
- [ ] Verify frontend loads
- [ ] Check critical user flows
- [ ] Monitor error rates

### 3. Post-Deployment (1 hour)
- [ ] Verify all features working
- [ ] Check database integrity
- [ ] Monitor performance metrics
- [ ] Check error tracking
- [ ] Verify email/SMS delivery
- [ ] Test third-party integrations

### 4. Communication
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document any issues
- [ ] Update deployment log

## Rollback Plan

### If Critical Issue Found

**Immediate Actions (within 5 minutes):**
1. Stop new deployments
2. Alert on-call team
3. Assess issue severity
4. Decide: Fix or Rollback

**Rollback Steps:**
```bash
# Frontend
# Previous version already cached by CDN
# Just revert DNS or cloudfront origin

# Backend
kubectl rollout undo deployment/api -n staysphere
# or
docker run previous-image-tag
```

**Post-Rollback:**
1. Notify team
2. Create incident report
3. Root cause analysis
4. Fix and test
5. Redeploy

## Monitoring After Deploy

### Health Checks (First Hour)
- API response times
- Error rate (target: <0.1%)
- Database connection pool
- Redis cache hit rate
- External service availability
- User login success rate
- Booking creation success rate
- Payment processing success rate

### Key Metrics
- **API Latency:** p95 < 500ms
- **Error Rate:** < 0.1%
- **Uptime:** > 99.9%
- **Database:** < 100ms queries
- **Cache Hit Rate:** > 80%

### Alerts
- API down
- Error rate spike
- Slow queries
- High memory usage
- Deployment failures
- Payment failures
- Email delivery issues

## First Week Post-Launch

### Daily Checks
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Performance metrics
- [ ] Third-party integrations
- [ ] Database health
- [ ] Cache performance

### Weekly Tasks
- [ ] Performance report
- [ ] User feedback summary
- [ ] Incident review
- [ ] Security audit log
- [ ] Cost analysis

### Documentation
- [ ] Update runbooks
- [ ] Document incidents
- [ ] Capture lessons learned
- [ ] Update troubleshooting guide

## Launch Communication

### Pre-Launch Announcement
```
🚀 STAYSPHERE AI launches tomorrow at 9 AM EST!

✨ New Features:
- AI-powered property search
- Smart booking system
- Host earnings dashboard
- Real-time notifications

Get ready to revolutionize vacation rentals!
```

### Launch Day
```
🎉 STAYSPHERE AI is LIVE!

Join thousands of travelers discovering amazing properties.
Book your perfect stay today at staysphere.ai
```

### Post-Launch Follow-up
```
📊 Launch Day Recap:
- 1,000+ signups
- 500+ properties listed
- $50K in bookings

Thank you for making day 1 amazing!
```

## Success Metrics (First 30 Days)

### User Metrics
- Target: 10,000+ signups
- Target: 1,000+ hosts
- Target: 500+ properties
- Target: 100+ bookings

### Business Metrics
- Target: $100K+ GMV
- Target: 10%+ conversion rate
- Target: 4+ star rating
- Target: 90%+ customer satisfaction

### Technical Metrics
- Target: 99.9% uptime
- Target: <500ms API latency
- Target: <0.1% error rate
- Target: 80%+ cache hit rate

## Post-Launch Plan

### Week 1
- Monitor platform health
- Respond to user issues
- Fix critical bugs
- Optimize performance

### Month 1
- Marketing push
- User feedback collection
- Feature refinements
- Performance optimization

### Quarter 1
- Scale infrastructure
- Add new features
- Expand to new markets
- Achieve profitability

## Team Responsibilities

### DevOps
- Infrastructure management
- Deployment execution
- Monitoring setup
- Incident response

### QA
- Final testing
- Performance validation
- Security audit
- Regression verification

### Backend Team
- API deployment
- Database migrations
- Service health
- Incident support

### Frontend Team
- Frontend deployment
- Browser compatibility
- Performance monitoring
- User feedback tracking

### Product
- Launch communication
- Feature readiness
- Success metrics
- Post-launch analysis

## Incident Response

### Critical Issue (API Down)
1. Page on-call engineer
2. Failover to secondary
3. Assess root cause
4. Implement fix
5. Redeploy
6. Verify recovery
7. Post-incident review

### High Priority Issue (Feature Broken)
1. Alert team
2. Assess impact
3. Implement hotfix
4. Test thoroughly
5. Deploy
6. Monitor
7. Create ticket for long-term fix

## Resources

### Documentation
- Deployment Guide: This file
- Architecture Guide: docs/ARCHITECTURE_DECISIONS.md
- API Reference: docs/API.md
- Troubleshooting: docs/TROUBLESHOOTING.md

### Tools
- Vercel: https://vercel.com/
- MongoDB Atlas: https://www.mongodb.com/cloud
- AWS: https://aws.amazon.com/
- Sentry: https://sentry.io/

### Contacts
- DevOps Lead: devops@staysphere.local
- On-call Engineer: on-call@staysphere.local
- Product Manager: pm@staysphere.local

## Launch Timeline

### T-2 Days
- Final code review
- Deployment plan review
- Team briefing

### T-1 Day
- Last-minute testing
- Backup verification
- Team standup

### Launch Day (T-0)
- Pre-deployment checks (8:00 AM)
- Backend deployment (8:30 AM)
- Frontend deployment (9:00 AM)
- Verification (9:30 AM)
- Public announcement (10:00 AM)

### Post-Launch
- Continuous monitoring
- Issue resolution
- Team debrief
- Success celebration 🎉

---

**Ready to Launch STAYSPHERE AI!** 🚀
