# 🏠 STAYSPHERE AI

> AI-powered vacation rental marketplace platform

An Airbnb-style vacation rental SaaS platform built with the MERN stack, featuring AI-powered customer support, secure payments via Razorpay, and identity verification.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248.svg)](https://www.mongodb.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**STAYSPHERE AI** is a full-stack vacation rental marketplace that enables:

- **Guests** to search, book, and review properties
- **Hosts** to list and manage properties
- **AI Support** to assist users with bookings, payments, and inquiries
- **Admins** to manage users, properties, and platform operations

### Key Differentiators

- 🤖 **AI Customer Support Agent** with tool-calling capabilities
- 🔒 **Provider-independent architecture** (AI, payments, identity verification)
- 🏗️ **Modular monolith** designed for future scalability
- 💳 **Razorpay integration** for secure payments
- 🔐 **Identity verification** system with provider abstraction

---

## ✨ Features

### For Guests
- 🔍 Search properties by location, dates, guests, price, amenities
- 📅 Check real-time availability
- 💰 Secure booking and payment via Razorpay
- ⭐ Leave reviews and ratings
- 💬 AI-powered support for bookings and inquiries
- ❤️ Wishlist properties
- 🔔 Real-time notifications

### For Hosts
- 📝 Create and manage property listings
- 📸 Upload property images
- 📆 Manage availability calendar
- 💵 Configure pricing and cancellation policies
- 📊 View earnings and booking analytics
- 📬 Manage booking requests

### For Admins
- 👥 User management
- 🏘️ Property moderation
- 📈 Platform analytics and insights
- 🎫 Support ticket management
- 🔍 Audit log viewing
- ✅ Identity verification review

### AI Support Agent
- Property search and recommendations
- Booking status inquiries
- Payment status checks
- Cancellation policy information
- Identity verification guidance
- Human support escalation

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Routing:** React Router
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express with TypeScript
- **Database:** MongoDB 7.0 with Mongoose ODM
- **Cache/Queue:** Redis + BullMQ
- **Authentication:** JWT (access + refresh tokens)
- **Authorization:** Role-Based Access Control (RBAC)
- **Validation:** Zod
- **Security:** Helmet, CORS, rate limiting

### Payments & AI
- **Payment Gateway:** Razorpay
- **AI Provider:** Provider-agnostic (Kiro, OpenCode, etc.)
- **Identity Verification:** Provider-agnostic (Mock for dev)

### DevOps
- **Monorepo:** Turborepo + npm workspaces
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (manifests ready)
- **CI/CD:** GitHub Actions
- **Code Quality:** ESLint, Prettier, TypeScript strict mode

---

## 📁 Project Structure

```
staysphere-ai/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   └── api/                    # Express backend
│
├── packages/
│   ├── shared/                 # Shared utilities and constants
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configurations (ESLint, TypeScript)
│
├── infrastructure/
│   ├── docker/                 # Dockerfiles and configs
│   ├── kubernetes/             # K8s manifests
│   └── monitoring/             # Monitoring configs (future)
│
├── docs/                       # Project documentation
│   ├── PROJECT_STATE.md
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── PROVIDER_HANDOFF.md
│   └── ...
│
├── scripts/                    # Utility scripts
├── .github/workflows/          # CI/CD workflows
│
├── turbo.json                  # Turborepo configuration
├── package.json                # Root package.json (workspaces)
├── .env.example                # Environment variables template
└── README.md                   # This file
```

### Apps

- **web:** React SPA with Vite, TypeScript, Tailwind CSS, shadcn/ui
- **api:** Express REST API with TypeScript, MongoDB, Redis, BullMQ

### Packages

- **@staysphere/shared:** Constants, utilities (roles, statuses, error codes)
- **@staysphere/types:** TypeScript interfaces (User, Property, Booking, etc.)
- **@staysphere/config:** Shared ESLint and TypeScript configurations

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm 10+
- **MongoDB** 7.0+ (local or MongoDB Atlas)
- **Redis** 7.0+ (local or Upstash)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd staysphere-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in required values:
   - MongoDB connection string
   - Redis URL
   - JWT secrets (generate with `openssl rand -base64 32`)
   - Razorpay TEST keys
   - AI provider API key

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

### With Docker

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start all apps in dev mode
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only

# Building
npm run build        # Build all apps
npm run build:web    # Build frontend only
npm run build:api    # Build backend only

# Code Quality
npm run lint         # Lint all packages
npm run typecheck    # Type check all packages
npm run format       # Format code with Prettier

# Testing
npm run test         # Run all tests
npm run test:web     # Run frontend tests
npm run test:api     # Run backend tests

# Utilities
npm run clean        # Clean all build artifacts
```

### Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Run checks before pushing**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 🏗️ Architecture

### Design Principles

1. **Modular Monolith:** Strong module boundaries, future service extraction ready
2. **Provider Independence:** AI, payments, identity verification are abstracted
3. **Security First:** Authentication, authorization, input validation, audit logging
4. **Scalability Ready:** Stateless backend, caching, background jobs, horizontal scaling
5. **Type Safety:** TypeScript strict mode, shared types, Zod validation

### Key Architectural Decisions

See [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) for detailed ADRs.

**Highlights:**
- Modular monolith (not microservices)
- JWT authentication with refresh tokens
- RBAC with 4 roles (GUEST, HOST, SUPPORT, ADMIN)
- Provider-independent AI layer
- Razorpay for payments
- MongoDB for database
- Redis for caching and job queues

### Backend Modules

```
apps/api/src/modules/
├── auth/              # Authentication (register, login, JWT)
├── users/             # User management
├── properties/        # Property listings
├── availability/      # Availability calendar
├── bookings/          # Booking engine
├── payments/          # Payment processing (Razorpay)
├── refunds/           # Refund handling
├── identity/          # Identity verification
├── reviews/           # Reviews and ratings
├── wishlist/          # User wishlists
├── notifications/     # Notification system
├── support/           # Support tickets
├── ai/                # AI customer support agent
├── admin/             # Admin operations
└── audit/             # Audit logging
```

### Database Schema

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema.

**Core Collections:**
- Users, Profiles, Properties, Bookings, Payments, Reviews
- IdentityVerifications, AIConversations, SupportTickets
- Notifications, AuditLogs

### API Structure

**Base URL:** `/api/v1`

**Authentication:** Bearer token in `Authorization` header

**Response Format:**
```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": { page: 1, limit: 20, total: 100 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/staysphere-ai
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Razorpay (TEST mode keys)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# AI Provider
AI_PROVIDER=kiro
AI_API_KEY=your_ai_api_key
```

### Optional

```bash
# Application
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Identity Verification
IDENTITY_PROVIDER=mock
IDENTITY_PROVIDER_KEY=your_key
```

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

**Target Coverage:** >70% for critical modules

**Critical Test Paths:**
- Authentication flow
- Booking creation and payment
- Payment webhook handling
- AI tool authorization
- Identity verification flow

---

## 🚢 Deployment

### Development Deployment (Free Tier)

**Frontend:** Vercel / Netlify  
**Backend:** Render / Railway / Fly.io  
**Database:** MongoDB Atlas M0 (Free)  
**Redis:** Upstash (Free)

See [deployment.md](docs/deployment.md) for detailed instructions.

### Production Deployment

**Frontend:** Vercel Pro / Netlify Pro / CloudFront + S3  
**Backend:** AWS ECS / Google Cloud Run / DigitalOcean  
**Database:** MongoDB Atlas M10+ (Dedicated cluster)  
**Redis:** AWS ElastiCache / Redis Cloud

**Kubernetes:** Manifests ready in `infrastructure/kubernetes/`

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and tests (`npm run lint && npm run test`)
5. Commit with conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. Push to your fork
7. Open a Pull Request

### Code Style

- **TypeScript:** Strict mode, no implicit any
- **Formatting:** Prettier (runs automatically)
- **Linting:** ESLint (must pass)
- **Commits:** Conventional commits format

### Pull Request Guidelines

- Clear description of changes
- Link related issues
- Tests for new features
- Update documentation if needed
- All CI checks must pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for scalability and maintainability
- Provider-independent architecture for flexibility

---

## 📞 Support

For questions or issues:
- Check [docs/](docs/) folder for detailed documentation
- Open an issue on GitHub
- Review [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md)

---

**Built with ❤️ for the vacation rental ecosystem**
