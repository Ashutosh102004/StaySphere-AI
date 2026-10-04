# Testing & QA Guide (PHASE 22)

## Overview
STAYSPHERE AI has comprehensive testing infrastructure with unit tests, integration tests, and end-to-end tests.

## Testing Stack

### Unit Tests
- **Framework:** Jest
- **Libraries:** @testing-library/react, @testing-library/jest-dom
- **Coverage Target:** >80% for critical modules
- **Location:** `**/*.test.ts(x)` or `**/__tests__/**`

### Integration Tests
- **Framework:** Jest + Supertest
- **Coverage:** API endpoints, database interactions
- **Location:** `api/**/*.integration.test.ts`

### End-to-End Tests
- **Framework:** Playwright
- **Coverage:** User workflows, critical paths
- **Location:** `e2e/**/*.spec.ts`

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Integration Tests (API)
```bash
npm run test:api
```

### Frontend Tests
```bash
npm run test:web
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:ui     # UI mode
```

## Test Coverage Goals

### Critical Modules (>90% coverage required)
- Authentication (login, register, token refresh)
- Authorization (role-based access control)
- Payment processing
- Booking creation
- Identity verification

### Important Modules (>80% coverage)
- Property management (CRUD)
- Search and filtering
- Notifications
- Support tickets
- Admin operations

### Standard Modules (>70% coverage)
- Wishlist management
- Reviews
- Availability calendar
- User profiles
- Settings

## Key Test Paths

### Authentication Flow
1. User registration with validation
2. Login with correct/incorrect credentials
3. JWT token generation and refresh
4. Protected route access
5. Logout and token cleanup

### Booking Flow
1. Search properties
2. View property details
3. Check availability
4. Create booking
5. Payment processing
6. Booking confirmation

### Admin Operations
1. User management (list, update, delete)
2. Property moderation
3. Analytics dashboard
4. Support ticket management

### AI Features
1. Chat message submission
2. Property recommendations
3. Smart search
4. Price optimization

## Coverage Report

### Current Status (PHASE 22)
- Backend API: Ready for testing
- Frontend Components: Ready for testing
- Integration: Ready for testing
- E2E: Test scripts ready

### Target Coverage
- **Overall:** >75%
- **Critical Paths:** >90%
- **Business Logic:** >85%

## Test Data

### Mock Users
```
Guest: guest@test.com / password123
Host: host@test.com / password123
Admin: admin@test.com / password123
```

### Test Properties
- Downtown Modern Apartment ($120/night)
- Beachfront Villa ($280/night)
- Mountain Cabin ($95/night)
- Luxury Penthouse ($450/night)

### Test Bookings
- Confirmed bookings for Oct 15-20
- Pending bookings for Oct 22-25
- Completed bookings from past dates

## CI/CD Integration

### GitHub Actions
- Tests run on every commit
- Coverage reports generated
- Failed tests block merges
- E2E tests run on pull requests

### Pre-commit Hooks
- Linting
- Type checking
- Unit tests
- Coverage minimum enforcement

## Performance Testing

### Load Testing
- Simulate 100 concurrent users
- Property search performance
- Booking creation under load
- API response times

### Stress Testing
- Server stability at 500+ concurrent users
- Database connection pooling
- Memory usage tracking
- Response degradation

## Security Testing

### OWASP Top 10
- SQL Injection prevention
- XSS protection
- CSRF tokens
- Authentication bypass attempts
- Authorization vulnerabilities
- Sensitive data exposure
- XXE attacks
- Broken access control
- Using known vulnerable components

### API Security
- Input validation
- Rate limiting
- CORS policies
- Authentication headers
- Authorization checks

## Browser Compatibility

### Desktop
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile
- iOS Safari (latest 2 versions)
- Chrome Android (latest 2 versions)

## Accessibility Testing

### WCAG 2.1 Level AA
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Form labels and errors
- Focus management

## Regression Testing

### Critical Features
- User authentication
- Property search and booking
- Payment processing
- Admin functions
- Notification delivery

### Smoke Tests
- App startup
- Page navigation
- Form submissions
- API availability

## Bug Tracking

### Severity Levels
- **Critical:** Production down, security risk
- **High:** Major feature broken
- **Medium:** Feature partially broken
- **Low:** Minor UI/UX issues

### Bug Resolution SLA
- Critical: 2 hours
- High: 24 hours
- Medium: 72 hours
- Low: 1 week

## QA Checklist

### Pre-Release
- [ ] All critical tests passing
- [ ] Coverage meets targets
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Mobile responsive verified
- [ ] Accessibility compliant
- [ ] Documentation updated
- [ ] Release notes prepared

### Deployment
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Third-party APIs verified
- [ ] Monitoring alerts set up
- [ ] Rollback plan ready
- [ ] Team notified

### Post-Release
- [ ] Production monitoring active
- [ ] Error rates acceptable
- [ ] User feedback collected
- [ ] Incident response ready

## Tools & Setup

### Testing Tools
- Jest: Unit and integration testing
- Supertest: API endpoint testing
- Playwright: E2E testing
- React Testing Library: Component testing

### Code Quality
- ESLint: Linting
- Prettier: Formatting
- TypeScript: Type checking

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- Analytics
- User session tracking

## Resources

### Documentation
- Jest: https://jestjs.io/
- Playwright: https://playwright.dev/
- React Testing Library: https://testing-library.com/react

### Contacts
- QA Lead: qa@staysphere.local
- DevOps: devops@staysphere.local
- Security: security@staysphere.local

## Next Steps

1. Set up test environment
2. Run initial test suite
3. Generate coverage reports
4. Identify gaps
5. Add missing tests
6. Achieve coverage targets
7. Prepare for deployment
