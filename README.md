# Fullstack Template

[![CI](https://github.com/nnorx/fullstack-template/actions/workflows/ci.yml/badge.svg)](https://github.com/nnorx/fullstack-template/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern fullstack monorepo template with end-to-end type safety, designed for self-hosted deployment.

## Stack

**Frontend** (`apps/web`): React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Router, React Query, shadcn/ui

**Backend** (`apps/api`): Hono, TypeScript, Drizzle ORM, PostgreSQL, Better Auth (email + RBAC)

**Shared** (`packages/shared`): Zod schemas and derived types shared between API and frontend

**Tooling**: Turborepo, pnpm workspaces, Biome, Knip, Vitest

**Infrastructure**: Docker Compose, Caddy, Cloudflare Tunnel

## Features

- **Projects** — Create projects, invite collaborators by email, manage members with role-based access (owner / contributor)
- **Posts & Comments** — Threaded discussions within projects, with author attribution and inline comment counts
- **File Uploads** — Drag-and-drop image uploads (JPEG, PNG, GIF, WebP, SVG) with 10MB limit, stored on local disk
- **Real-time Notifications** — WebSocket-powered notifications when someone shares a project, creates a post, or comments on your post
- **Authentication** — Email + password auth with session cookies, route guards, and admin RBAC via Better Auth

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Cloudflare Edge                │
└────────────────────────┬────────────────────────┘
                         │ Tunnel
┌────────────────────────┴───────────────────────┐
│                   Host / Pi                    │
│  ┌───────────┐ ┌───────────┐ ┌──────────────┐  │
│  │cloudflared│→│   Caddy   │→│  Hono API    │  │
│  └───────────┘ │ (static + │ │  :3001       │  │
│                │  proxy)   │ │  + WebSocket │  │
│                └───────────┘ └──┬─────┬─────┘  │
│                                 │     │        │
│                          ┌──────┴┐ ┌──┴──────┐ │
│                          │ PG    │ │ Uploads │ │
│                          │ :5432 │ │ (volume)│ │
│                          └───────┘ └─────────┘ │
└────────────────────────────────────────────────┘
```

## Type Safety

API types flow from backend to frontend via OpenAPI:

```typescript
// Backend: define routes with Zod schemas (apps/api/src/routes/)
const route = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: { content: { "application/json": { schema: MySchema } } },
  },
});

app.openapi(route, async (c) => { /* ... */ });
```

```typescript
// Frontend: auto-typed API calls (apps/web/src/)
import { client } from "@/lib/api-client";

const { data } = await client.GET("/api/health");
//      ^? { status: "healthy"; timestamp: string; uptime: number }
```

Types are generated from the OpenAPI spec served at `/api/doc`:

```bash
pnpm --filter @fullstack-template/web typegen
```

This generates `apps/web/src/lib/api.d.ts` from the live API. Regenerate whenever you add or change API routes.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker + Docker Compose (for the database)

### Setup

```bash
# Clone and install
git clone <repo-url> && cd fullstack-template
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start PostgreSQL
docker compose -f infra/docker-compose.dev.yml up -d

# Run database migrations
pnpm db:push  # Quick sync for development

# Start development servers
pnpm dev
```

The frontend is at `http://localhost:5173` and the API at `http://localhost:3001`.

The Vite dev server proxies `/api` and `/ws` (WebSocket) requests to the backend automatically.

## Project Structure

```
fullstack-template/
├── apps/
│   ├── web/                  # React frontend
│   │   ├── src/
│   │   │   ├── components/   # UI components (shadcn/ui)
│   │   │   ├── hooks/        # React Query hooks (projects, posts, files, etc.)
│   │   │   ├── lib/          # API client, auth client, WebSocket, utilities
│   │   │   ├── routes/       # TanStack Router file-based routes
│   │   │   └── test/         # Test setup and utilities
│   │   └── ...config files
│   └── api/                  # Hono backend
│       ├── src/
│       │   ├── db/           # Drizzle schema, migrations, seeds
│       │   ├── routes/       # API route handlers
│       │   ├── middleware/   # Auth, logging middleware
│       │   └── lib/          # Auth, env, storage, WebSocket, notifications
│       └── ...config files
├── packages/
│   └── shared/               # Shared Zod schemas + types
├── infra/
│   ├── docker-compose.yml    # Production compose (all services)
│   ├── docker-compose.dev.yml # Dev compose (Postgres only)
│   ├── Dockerfile.api        # Multi-stage API build
│   ├── Dockerfile.web        # Multi-stage frontend build (Caddy)
│   ├── Caddyfile             # Reverse proxy + WebSocket config
│   └── cloudflared/          # Tunnel config example
├── turbo.json                # Turborepo task pipeline
├── pnpm-workspace.yaml       # Workspace configuration
└── biome.json                # Shared linting/formatting
```

## Scripts

### Root (via Turborepo)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages (Biome) |
| `pnpm format` | Auto-fix and format all code |
| `pnpm type-check` | TypeScript validation across workspace |
| `pnpm test` | Run all tests |
| `pnpm knip` | Find unused code/dependencies |

### Database

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Generate SQL migrations from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push schema directly (development) |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser) |
| `pnpm db:seed` | Seed the database with initial data |

## Data Fetching

API calls use [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) with types generated from the OpenAPI spec, paired with [TanStack Query](https://tanstack.com/query) for caching and state management.

```typescript
// 1. Use the typed client — paths autocomplete, responses are inferred
import { client } from "@/lib/api-client";

const { data } = await client.GET("/api/health");

// 2. Wrap in a TanStack Query hook with a key from the factory
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health.check(),
    queryFn: async () => {
      const { data } = await client.GET("/api/health");
      if (!data) throw new Error("Unexpected empty response");
      return data;
    },
  });
}
```

Errors are automatically parsed into `ApiError` instances by the client middleware. The `QueryClient` skips retries on 4xx errors (not transient).

When adding a new API route:

1. Define the route in `apps/api/src/routes/` using `createRoute` with Zod schemas
2. Run `pnpm --filter @fullstack-template/web typegen` to regenerate types
3. Create a hook in `apps/web/src/hooks/` using `client.GET`/`POST`/etc.

## Replacing the Example Features

The projects/posts/comments features are meant to be replaced with your own domain. Here's what to touch:

1. **Database schema** — Edit `apps/api/src/db/schema/projects.ts` (or replace it entirely). Run `pnpm db:generate` then `pnpm db:migrate`
2. **Shared validation** — Update `packages/shared/src/schemas/projects.ts` with your Zod schemas, then `pnpm --filter @fullstack-template/shared build`
3. **API routes** — Replace/edit files in `apps/api/src/routes/`. Each file follows the same pattern: `createRoute()` with Zod schemas + `app.openapi()` handler
4. **Mount routes** — Update `apps/api/src/app.ts` to mount your new routes
5. **Regenerate types** — Run `pnpm typegen` so the frontend picks up your new API shape
6. **Frontend hooks** — Replace files in `apps/web/src/hooks/`. Each hook wraps `client.GET`/`POST`/etc. with React Query
7. **Frontend routes** — Replace files under `apps/web/src/routes/_authenticated/projects/` with your own pages
8. **Query keys** — Update `apps/web/src/lib/query-keys.ts` to match your new domains
9. **Seed data** — Update `apps/api/src/db/seed.ts` for your new schema

The auth system, file uploads, WebSocket notifications, and infrastructure are all independent of the example domain and can be kept as-is.

## Authentication

Authentication is handled by [Better Auth](https://better-auth.com/) with:

- **Email + password** sign up and sign in
- **Session management** with httpOnly cookies
- **Admin plugin** for role-based access control
- **Organization plugin** for multi-tenant support

### Frontend

```typescript
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";

// Check auth state
const { data: session } = useSession();

// Sign in
await signIn.email({ email, password });

// Sign up
await signUp.email({ name, email, password });
```

### Backend

```typescript
import { requireAuth, requireAdmin } from "./middleware/auth";

// Protected route
app.get("/api/protected", requireAuth, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

// Admin-only route (must use requireAuth first)
app.get("/api/admin", requireAuth, requireAdmin, (c) => {
  return c.json({ message: "Admin access" });
});
```

Note: `requireAdmin` must be used **after** `requireAuth` to ensure there's a valid session.

## Observability

Error tracking, performance monitoring, and session replay are provided by [Sentry](https://sentry.io/).

### Setup

1. Create two Sentry projects: one for **React** (frontend) and one for **Hono/Node.js** (backend)
2. Copy the DSN for each project into your `.env`:

```bash
# Backend (Hono)
SENTRY_DSN=https://...@o....ingest.us.sentry.io/...

# Frontend (React) — must be prefixed with VITE_
VITE_SENTRY_DSN=https://...@o....ingest.us.sentry.io/...
```

3. Restart the dev servers — Sentry is now active

When the DSN environment variables are not set, Sentry is completely disabled and adds zero overhead.

### What's Captured

| Feature | Frontend | Backend |
|---------|----------|---------|
| Error tracking | React ErrorBoundary + unhandled exceptions | All 5xx errors via error handler middleware |
| Performance traces | Page loads, navigations, fetch requests | API request spans, database queries |
| Session replay | Replays user actions leading to errors | - |
| Profiling | - | CPU profiling for sampled traces |
| Request correlation | Sends `X-Request-ID` on every API call | Tags Sentry events with `X-Request-ID` |
| User context | - | Attaches user ID and email on authenticated requests |

### Testing the Integration

In development mode, test buttons are available on the `/dashboard` page (after login):
- **Test Backend Error** - Triggers `/api/test/sentry-error`, should appear in backend Sentry project with request ID and user context
- **Test Frontend Error** - Throws a React error caught by ErrorBoundary, should appear in frontend Sentry project with component stack
- **Test Manual Capture** - Manually calls `Sentry.captureException()`, should appear in frontend Sentry project

After clicking a test button, check your Sentry dashboard:
1. Verify the error appears in the correct project (frontend or backend)
2. Check that `request_id` tag is present and matches between frontend/backend events
3. Verify user context is attached (email, user ID)
4. Check that breadcrumbs show the API calls leading to the error

### Source Maps

Production builds generate hidden source maps. To upload them to Sentry for readable stack traces, set these environment variables in CI/CD:

```bash
SENTRY_AUTH_TOKEN=sntrys_...   # From Sentry Settings → Auth Tokens
SENTRY_ORG=your-org
SENTRY_PROJECT_WEB=your-web-project
```

The `@sentry/vite-plugin` automatically uploads source maps during `vite build` and deletes the `.map` files afterward so they are never served to users.

### Sampling Rates

Default sampling rates are tuned for Sentry's free tier (5k events/month):

| Setting | Development | Production |
|---------|-------------|------------|
| Traces | 100% | 10% |
| Session replay (normal) | 0% | 10% |
| Session replay (on error) | 100% | 100% |
| Profiling | 100% of traces | 100% of traces |

Adjust in `apps/api/src/instrument.ts` and `apps/web/src/lib/sentry.ts`.

## Deployment

### Security First! 🔒

**Before deploying to production**, review the [SECURITY.md](./SECURITY.md) guide. Critical steps:

1. Generate a strong `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
2. Set strong database credentials (not `postgres:postgres`)
3. Configure production URLs with HTTPS
4. Review and enable additional security features (rate limiting, email verification, CSP)

See [SECURITY.md](./SECURITY.md) for a complete pre-production security checklist.

### Self-Hosted (Raspberry Pi / VPS)

```bash
# On your server:
git clone <repo-url> && cd fullstack-template
cp .env.example .env
# Edit .env: set BETTER_AUTH_SECRET, TUNNEL_TOKEN, etc.

# 1. Start database only (API would fail without schema)
docker compose -f infra/docker-compose.yml up -d db

# 2. Run migrations before starting the API (uses compiled migrate, no tsx required)
docker compose -f infra/docker-compose.yml run --rm api pnpm db:migrate:prod

# 3. Start the rest (API, Caddy)
docker compose -f infra/docker-compose.yml up -d

# With Cloudflare Tunnel (exposes to internet), use --profile tunnel in step 3:
# docker compose -f infra/docker-compose.yml --profile tunnel up -d
```

### Cloudflare Tunnel Setup

1. Create a tunnel in the [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/)
2. Copy the tunnel token
3. Set `TUNNEL_TOKEN` in your `.env` file
4. Configure the tunnel to point to `http://caddy:80`
5. Run with `--profile tunnel`

### CI/CD

GitHub Actions automatically:
1. Runs lint, type-check, and tests on every PR
2. Builds multi-arch Docker images (amd64 + arm64) on push to main
3. Pushes images to GitHub Container Registry (ghcr.io)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | - | Secret key for auth token signing |
| `BETTER_AUTH_URL` | No | `http://localhost:3001` | Backend URL for auth |
| `API_PORT` | No | `3001` | Port for the API server |
| `UPLOAD_DIR` | No | `./uploads` | Directory for file uploads |
| `VITE_API_URL` | No | `""` | API URL for the frontend |
| `SENTRY_DSN` | No | - | Backend Sentry DSN for error tracking |
| `VITE_SENTRY_DSN` | No | - | Frontend Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | For CI/CD | - | Sentry auth token for source map uploads |
| `SENTRY_ORG` | For CI/CD | - | Sentry organization slug |
| `SENTRY_PROJECT_WEB` | For CI/CD | - | Sentry project slug (frontend) |
| `TUNNEL_TOKEN` | For tunnel | - | Cloudflare Tunnel token |

## License

MIT
