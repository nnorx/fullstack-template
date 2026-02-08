# Fullstack Template

A modern fullstack monorepo template with end-to-end type safety, designed for self-hosted deployment.

## Stack

**Frontend** (`apps/web`): React 19, TypeScript, Vite (rolldown), Tailwind CSS v4, TanStack Router, React Query, shadcn/ui

**Backend** (`apps/api`): Hono, TypeScript, Drizzle ORM, PostgreSQL, Better Auth (email + RBAC)

**Shared** (`packages/shared`): Zod schemas and derived types shared between API and frontend

**Tooling**: Turborepo, pnpm workspaces, Biome, Knip, Vitest

**Infrastructure**: Docker Compose, Caddy, Cloudflare Tunnel

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Cloudflare Edge                 │
└────────────────────────┬────────────────────────┘
                         │ Tunnel
┌────────────────────────┴────────────────────────┐
│                   Host / Pi                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │cloudflared│→│   Caddy   │→│  Hono API    │  │
│  └──────────┘  │ (static + │  │  :3001       │  │
│                │  proxy)   │  └──────┬───────┘  │
│                └───────────┘         │           │
│                              ┌───────┴───────┐   │
│                              │  PostgreSQL   │   │
│                              │  :5432        │   │
│                              └───────────────┘   │
└──────────────────────────────────────────────────┘
```

## Type Safety

The API types flow from backend to frontend with zero code generation:

```typescript
// Backend: define routes with Zod validation
const app = new Hono()
  .post("/api/items", zValidator("json", createItemSchema), async (c) => {
    // ...
    return c.json({ item });
  });

export type AppType = typeof app;

// Frontend: fully typed API calls
import { hc } from "hono/client";
import type { AppType } from "@fullstack-template/api";

const api = hc<AppType>("");
const res = await api.api.items.$post({ json: { name: "test" } });
//    ^-- fully typed response
```

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

The Vite dev server proxies `/api` requests to the backend automatically.

## Project Structure

```
fullstack-template/
├── apps/
│   ├── web/                  # React frontend
│   │   ├── src/
│   │   │   ├── components/   # UI components (shadcn/ui)
│   │   │   ├── lib/          # API client, auth client, utilities
│   │   │   ├── routes/       # TanStack Router file-based routes
│   │   │   └── test/         # Test setup and utilities
│   │   └── ...config files
│   └── api/                  # Hono backend
│       ├── src/
│       │   ├── db/           # Drizzle schema, migrations, seeds
│       │   ├── routes/       # API route handlers
│       │   ├── middleware/   # Auth, logging middleware
│       │   └── lib/          # Auth config, env validation
│       └── ...config files
├── packages/
│   └── shared/               # Shared Zod schemas + types
├── infra/
│   ├── docker-compose.yml    # Production compose (all services)
│   ├── docker-compose.dev.yml # Dev compose (Postgres only)
│   ├── Dockerfile.api        # Multi-stage API build
│   ├── Dockerfile.web        # Multi-stage frontend build (Caddy)
│   ├── Caddyfile             # Reverse proxy config
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

// Admin-only route
app.get("/api/admin", requireAuth, requireAdmin, (c) => {
  return c.json({ message: "Admin access" });
});
```

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

# Start all services
docker compose -f infra/docker-compose.yml up -d

# With Cloudflare Tunnel (exposes to internet):
docker compose -f infra/docker-compose.yml --profile tunnel up -d
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
| `VITE_API_URL` | No | `""` | API URL for the frontend |
| `TUNNEL_TOKEN` | For tunnel | - | Cloudflare Tunnel token |

## License

MIT
