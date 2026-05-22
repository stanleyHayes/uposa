# UPOSA Architecture

> UPOSA — University Practice Old Students Association Platform

## Overview

UPOSA is a full-stack alumni association platform delivered as an **npm workspaces monorepo**. It connects former students through events, news, job boards, mentorship, elections, donations, and a community forum.

| Layer | Technology |
|-------|------------|
| API | Node.js + Express + TypeScript + MongoDB (Mongoose) |
| Admin Dashboard | React 18 + Vite + Tailwind CSS v3 + Zustand |
| Alumni Portal | React 19 + Vite + Tailwind CSS v4 + Zustand |
| Marketing Site | React 19 + Vite + Tailwind CSS v4 + Context |
| Mobile App | React Native + Expo SDK 54 + expo-router + Zustand |
| Real-time | Socket.IO |
| Payments | Paystack + Stripe + Coinbase Commerce |
| Email | Resend |
| File Storage | Cloudinary (images) + local disk (documents) |

---

## Repository Structure

```
uposa-monorepo/
├── apps/
│   ├── api/                 # REST API + WebSocket server
│   ├── admin/               # Staff management dashboard
│   ├── alumni/              # Member self-service portal
│   ├── marketing/           # Public website
│   └── mobile/              # React Native mobile app
├── package.json             # Root workspace manifest
└── render.yaml              # Render deployment blueprint
```

---

## API Architecture (`apps/api`)

### Request Lifecycle

```
HTTP Request
    → CORS / Helmet / Morgan / Rate Limit
    → Route Middleware (authMiddleware / adminMiddleware)
    → Controller (Zod validation)
    → Service (business logic)
    → Repository (Mongoose abstraction)
    → MongoDB
    → JSON Response
```

### Key Directories

| Directory | Responsibility |
|-----------|----------------|
| `src/modules/**` | Feature modules: routes → controller → service → validation |
| `src/models/index.ts` | All Mongoose schemas (~30 models) |
| `src/repositories/` | Database-agnostic repository pattern with `MongooseRepository` |
| `src/middleware/` | Auth, admin role guards, error handling, rate limits, uploads |
| `src/providers/` | Payment provider registry (Paystack / Stripe / Crypto) |
| `src/utils/` | JWT, email, Cloudinary, crypto, pagination, responses |
| `src/config/` | DB connection, env loader, Socket.IO server |

### Authentication

Dual JWT system:
- **Members**: `JWT_SECRET` → `accessToken` (15m) + `refreshToken` (7d)
- **Admins**: `JWT_ADMIN_SECRET` → `adminToken` (15m) + `adminRefreshToken` (7d)

Cookie-based auth is supported via `cookie-parser`.

### Database

MongoDB single-tenant cluster. Key collections:
- `members`, `admins`
- `events`, `projects`, `news`, `donations`, `dues`
- `jobs`, `jobapplications`, `mentorshiprequests`
- `forumposts`, `forumcomments`
- `polls`, `pollvotes`, `elections`, `electionvotes`
- `payments`, `paymentmethods`
- `gallerycategories`, `galleryitems`
- `siteconfigs`, `contactmessages`, `transcriptrequests`

---

## Frontend Architecture

### Admin Dashboard (`apps/admin`)

- **Router**: `react-router-dom` v6
- **State**: Zustand (auth, UI, 20+ feature stores)
- **Styling**: Tailwind v3 with custom `tailwind.config.ts`
- **Build**: `tsc && vite build`
- **Deploy target**: Static host (Vercel/Render/static)

### Alumni Portal (`apps/alumni`)

- **Router**: `react-router` v7
- **State**: Zustand (auth, UI)
- **Styling**: Tailwind v4 + DaisyUI
- **API Client**: Axios with refresh-token coalescing + Socket.IO
- **Build**: `tsc -b && vite build`

### Marketing Site (`apps/marketing`)

- **Router**: `react-router` v7
- **State**: React Context (`SiteDataContext`)
- **Styling**: Tailwind v4 + DaisyUI
- **API**: Native `fetch` to public endpoints
- **Build**: `tsc -b && vite build`

### Mobile App (`apps/mobile`)

- **Router**: `expo-router` v6 (file-based)
- **State**: Zustand + AsyncStorage persistence
- **API**: Axios with token refresh queue
- **Build**: `expo start` / EAS

---

## Environment Variables

### API (Required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Member JWT signing secret |
| `JWT_ADMIN_SECRET` | Admin JWT signing secret |
| `CREDENTIALS_ENCRYPTION_KEY` | 32-char AES key (production only) |

### API (Optional / Third-party)

| Variable | Service |
|----------|---------|
| `RESEND_API_KEY` | Transactional email |
| `CLOUDINARY_*` | Image hosting |
| `PAYSTACK_*` / `STRIPE_*` / `CRYPTO_*` | Payments |
| `CLIENT_URL` / `ADMIN_URL` | CORS allowlist |

---

## Deployment Strategy

### Render (Recommended)

- **API**: Docker-based web service on Render
- **Frontends**: Static sites on Render (or Vercel)
- **Database**: MongoDB Atlas (managed)

See `render.yaml` and `apps/api/Dockerfile` for blueprint.

### Docker

The API includes a multi-stage `Dockerfile`:
1. `deps` — install dependencies
2. `build` — compile TypeScript
3. `prod` — minimal image with `dist/` + `node_modules`

---

## Development Workflow

```bash
# Install dependencies
npm install

# Run API only
npm run dev:api

# Run all frontends + API
npm run dev

# Build everything
npm run build

# Seed local database
npm run seed
```

---

## CI/CD

GitHub Actions workflows:
- `ci.yml` — lint, type-check, and build on every PR/push
- `deploy-api.yml` — build and deploy API Docker image to Render on `main` merges

---

## Security Notes

- Helmet headers on all requests
- CORS origin allowlist with pattern matching
- Rate limiting on auth, payment, and webhook routes
- AES-256-GCM encryption for payment credentials at rest
- Raw body preserved for Stripe webhook signature verification
- Input validation via Zod on all controllers
