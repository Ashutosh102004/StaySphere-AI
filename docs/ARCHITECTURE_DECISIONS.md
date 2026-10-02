# ARCHITECTURE DECISIONS

**Last Updated:** 2026-10-02T18:41:46.393Z

This document records key architectural decisions made for the STAYSPHERE AI project.

---

## ADR-001: Modular Monolith Architecture

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need to build a scalable vacation rental platform with multiple modules (auth, properties, bookings, payments, AI).

### Decision
Implement a **modular monolith** rather than microservices.

### Rationale
- Simpler to develop and deploy initially
- Strong module boundaries enable future extraction to microservices
- Reduced operational complexity
- Single database simplifies transactions
- Easier to maintain consistency
- Better development velocity for early stages

### Consequences
- Must maintain strict module boundaries
- Cannot independently scale individual modules
- All modules deployed together
- Shared database (MongoDB)

### Future Considerations
- Can extract high-load modules (search, AI) to separate services later
- Module boundaries designed for future service extraction

---

## ADR-002: Provider-Independent AI Layer

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
AI coding assistants may change (rate limits, quotas, provider switching). Application needs AI for customer support agent.

### Decision
Implement a **provider-independent AI abstraction layer**.

### Rationale
- Development can continue when one AI provider is unavailable
- Allows switching between Kiro, OpenCode, Pollinations, etc.
- Application code remains independent of AI provider
- Easier to test and mock
- Future-proof against provider changes

### Consequences
- Additional abstraction layer increases complexity
- Must normalize provider responses
- Error handling must account for provider differences
- Provider capabilities may differ (tool calling support)

### Implementation
```typescript
interface AIProvider {
  generateCompletion(params): Promise<CompletionResponse>;
  supportsTools(): boolean;
}
```

---

## ADR-003: JWT-Based Authentication

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need secure authentication for web and potential mobile clients.

### Decision
Use **JWT (JSON Web Tokens)** with access + refresh token pattern.

### Rationale
- Stateless authentication (enables horizontal scaling)
- Works well with SPA architecture
- Industry standard
- Supports multiple clients (web, mobile)
- No server-side session storage needed

### Token Strategy
- **Access Token:** Short-lived (15 minutes), contains user ID and role
- **Refresh Token:** Long-lived (7 days), stored in HTTP-only cookie
- Token rotation on refresh

### Security Measures
- HTTP-only cookies for web clients
- Secure flag in production
- Token revocation list for logout
- Short access token expiration

### Consequences
- Cannot invalidate tokens immediately (until expiration)
- Revocation list required for logout
- Token payload visible (no sensitive data)

---

## ADR-004: Role-Based Access Control (RBAC)

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need authorization system for different user types.

### Decision
Implement **RBAC with four roles**: GUEST, HOST, SUPPORT, ADMIN.

### Roles
- **GUEST:** Can search, book, review
- **HOST:** GUEST permissions + can create/manage properties
- **SUPPORT:** Can view and manage support tickets
- **ADMIN:** Full system access

### Rationale
- Simple and sufficient for MVP
- Clear permission boundaries
- Easy to understand and implement
- Role hierarchy (HOST includes GUEST permissions)

### Implementation
- Role stored in User model
- Middleware checks role before allowing access
- Frontend also checks role for UI rendering (not for security)

### Future Considerations
- May need fine-grained permissions (ABAC) later
- May need role-based feature flags

---

## ADR-005: MongoDB as Primary Database

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need database for storing users, properties, bookings, payments, etc.

### Decision
Use **MongoDB with Mongoose ODM**.

### Rationale
- Flexible schema (good for evolving product)
- Horizontal scaling support
- Geospatial queries (property search by location)
- Rich query capabilities
- Free tier available (MongoDB Atlas)
- Good fit for document-oriented data (properties, bookings)

### Considerations
- No ACID transactions across collections (mitigated with MongoDB 4.0+ multi-document transactions)
- Schema design matters (avoid over-embedding)

### Schema Strategy
- One model per collection
- References between collections (not deep embedding)
- Indexes on frequently queried fields
- Compound indexes for complex queries

---

## ADR-006: Razorpay for Payments

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need payment processing for bookings.

### Decision
Use **Razorpay** as payment gateway.

### Rationale
- Popular in India market
- Good API documentation
- Webhook support for payment confirmation
- TEST mode for development
- Supports multiple payment methods
- Reasonable pricing

### Integration Strategy
- Backend creates Razorpay order
- Frontend opens Razorpay Checkout
- Webhook confirms payment
- Signature verification for security
- Reconciliation job for reliability

### Security
- Key secret never exposed to frontend
- Webhook signature verification
- Idempotent payment processing

---

## ADR-007: Turborepo for Monorepo Management

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need monorepo tool for managing multiple packages and apps.

### Decision
Use **Turborepo** with npm workspaces.

### Rationale
- Fast, parallel builds
- Smart caching
- Simple configuration
- Good DX
- Works well with npm workspaces
- Better than Lerna for our use case

### Structure
```
staysphere-ai/
├── apps/
│   ├── web/
│   └── api/
└── packages/
    ├── shared/
    ├── types/
    └── config/
```

### Build Pipeline
- Parallel builds where possible
- Dependency-aware builds
- Shared caching

---

## ADR-008: React + Vite for Frontend

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need modern frontend framework and build tool.

### Decision
Use **React with Vite** (not Create React App or Next.js).

### Rationale
- Vite is faster than CRA
- Simpler than Next.js for SPA
- HMR (Hot Module Replacement)
- Optimized production builds
- Native ESM support
- TypeScript support out of the box

### Not Next.js Because
- Don't need SSR for most pages
- Want simpler deployment
- SPA architecture sufficient

### UI Framework
- shadcn/ui + Tailwind CSS
- Radix UI primitives
- Lucide icons

---

## ADR-009: Express for Backend

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need Node.js backend framework.

### Decision
Use **Express with TypeScript**.

### Rationale
- Most popular Node.js framework
- Mature ecosystem
- Flexible middleware system
- Good TypeScript support
- Easy to understand
- Large community

### Not Fastify/Koa/Nest Because
- Express is sufficient for performance needs
- Team familiarity
- Better for MVP

### Structure
- Modular route organization
- Middleware-based architecture
- Service layer pattern

---

## ADR-010: TypeScript Everywhere

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need type safety across frontend and backend.

### Decision
Use **TypeScript for all code**.

### Rationale
- Type safety prevents runtime errors
- Better IDE support
- Shared types between frontend and backend
- Self-documenting code
- Refactoring safety

### Configuration
- Strict mode enabled
- Shared TypeScript configs
- Shared types package

### Consequences
- Slightly slower development initially
- Learning curve for team members
- Build step required

---

## ADR-011: Redis for Caching and Sessions

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need caching layer and session management.

### Decision
Use **Redis** for caching and rate limiting.

### Use Cases
- Property search results caching
- Rate limiting counters
- Background job queues (BullMQ)
- Session data (future)

### Rationale
- Fast in-memory storage
- Simple data structures
- Good Node.js client
- Free tier available

---

## ADR-012: BullMQ for Background Jobs

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need reliable background job processing.

### Decision
Use **BullMQ** (backed by Redis).

### Use Cases
- Booking expiration (every minute)
- Payment reconciliation (every 5 minutes)
- Email notifications (immediate queue)
- AI conversation cleanup (daily)

### Rationale
- Reliable job processing
- Retry logic built-in
- Delayed jobs support
- Good monitoring
- Uses Redis (already in stack)

---

## ADR-013: Zod for Validation

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need input validation for API and forms.

### Decision
Use **Zod** for schema validation.

### Rationale
- TypeScript-first
- Type inference from schemas
- Works on frontend and backend
- Composable schemas
- Good error messages

### Usage
- API request validation
- Form validation (React Hook Form integration)
- Environment variable validation

---

## ADR-014: Docker for Containerization

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need consistent development and deployment environment.

### Decision
Use **Docker and Docker Compose**.

### Rationale
- Consistent environments (dev, staging, prod)
- Easy local development
- Deployment flexibility
- Container orchestration ready (Kubernetes)

### Services
- web (React frontend)
- api (Express backend)
- mongodb
- redis

---

## ADR-015: API Versioning Strategy

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need API versioning for backward compatibility.

### Decision
Use **URL-based versioning** (`/api/v1/...`).

### Rationale
- Simple and explicit
- Easy to understand
- Clear deprecation path
- Standard approach

### Not Header Versioning Because
- Harder to test with browser
- Less discoverable

---

## ADR-016: Identity Verification Abstraction

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need identity verification but provider choice should be flexible.

### Decision
Create **provider-independent identity verification interface**.

### Providers
- **MockProvider:** For development/testing
- **ProductionAdapter:** Wrapper for actual KYC provider (Aadhaar, Veriff, Onfido)

### Rationale
- Provider flexibility
- Testability
- Avoid vendor lock-in
- Can switch providers without code changes

---

## ADR-017: No Premature Microservices

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Might be tempted to build microservices from the start.

### Decision
**Do NOT create microservices prematurely**. Start with modular monolith.

### Rationale
- YAGNI (You Aren't Gonna Need It)
- Microservices add operational complexity
- Distributed systems are hard
- Monolith is faster to develop
- Can extract services later when needed

### When to Extract
- Specific module has very different scaling needs
- Clear module boundaries proven over time
- Team size justifies it

---

## ADR-018: Free Tier Deployment for Development

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Need deployment for development/demo without cost.

### Decision
Use **free tier services** for development deployment.

### Services
- **Frontend:** Vercel/Netlify Free
- **Backend:** Render/Railway/Fly.io Free
- **Database:** MongoDB Atlas M0 Free
- **Redis:** Upstash Free

### Clearly Document
- Free tier limitations (cold starts, hours, storage)
- Not production-ready
- Performance limitations

---

## ADR-019: Git-Based State Persistence for Provider Switching

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
AI provider may change mid-development due to rate limits or availability.

### Decision
Maintain **persistent state documentation** in `/docs/` folder.

### Files
- `PROJECT_STATE.md` - Current phase, completed work, next steps
- `PROVIDER_HANDOFF.md` - Handoff instructions for next AI provider
- `ARCHITECTURE_DECISIONS.md` - This file
- `IMPLEMENTATION_PLAN.md` - Detailed roadmap
- `KNOWN_ISSUES.md` - Bugs and blockers

### Rationale
- Next AI provider can read files and continue
- State persists across sessions
- Clear handoff protocol
- Reduces repetition
- Version controlled

---

## ADR-020: Incremental Development with Approval Gates

**Status:** Accepted  
**Date:** 2026-10-02  
**Deciders:** Initial architecture phase

### Context
Large project could be generated all at once, leading to errors and waste.

### Decision
Work in **small, verifiable phases** with approval gates.

### Process
1. Explain phase scope
2. Wait for approval
3. Implement only approved scope
4. Test
5. Update documentation
6. Get approval before next phase

### Rationale
- Prevents massive uncontrolled generation
- Allows course correction
- Verifiable progress
- Better error handling
- Provider switches don't lose large amounts of work

---

**End of Architecture Decisions Document**
