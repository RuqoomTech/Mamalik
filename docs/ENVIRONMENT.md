# Environment Configuration

This file documents the v0.1 environment variables. Real secrets must not be committed.

## Local Setup

1. Copy `apps/web/.env.example` to `apps/web/.env.local`.
2. Replace placeholder secrets before running auth, database, admin, or worker flows.
3. Keep `.env.local` and other real `.env*` files ignored.

## Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public web | Base app URL for callbacks, links, and local smoke tests. |
| `DATABASE_URL` | Server/database | PostgreSQL/PostGIS connection string for Prisma and database tasks. |
| `SESSION_SECRET` | Server/auth | Secret used for future session signing/encryption. |
| `GOOGLE_CLIENT_ID` | Server/auth | Google OAuth client id for the Google login task. |
| `GOOGLE_CLIENT_SECRET` | Server/auth | Google OAuth client secret for the Google login task. |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Public map | MapLibre style URL used by future map screens. |
| `ADMIN_EMAILS` | Server/admin | Comma-separated email allowlist for v0.1 admin access. |
| `TICK_WORKER_SECRET` | Server/worker | Shared secret for protected tick worker or admin-triggered tick calls. |

## Secret Handling

- Commit only `.env.example` files.
- Never commit `.env.local`, production `.env`, OAuth secrets, database passwords, or worker secrets.
- Public variables must use the `NEXT_PUBLIC_` prefix only when they are safe to expose in the browser.
- Server-only values must not be read from client components.

## Notes For Later Sprint 1 Tasks

- `DATABASE_URL` becomes active when Prisma and PostgreSQL/PostGIS are configured.
- Google OAuth variables become active during the Google login task.
- `NEXT_PUBLIC_MAP_STYLE_URL` becomes active during the MapLibre task.
- `TICK_WORKER_SECRET` is reserved for the tick worker/admin test tick flow.
