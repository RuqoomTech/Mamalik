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
| `SESSION_SECRET` | Server/auth | Secret used for signed email/password auth session cookies. Must be at least 32 characters. |
| `GOOGLE_CLIENT_ID` | Server/auth | Google OAuth client id for Google login. |
| `GOOGLE_CLIENT_SECRET` | Server/auth | Google OAuth client secret for Google login. |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Public map | MapLibre style URL used by the `/create-kingdom` map-selection page. |
| `ADMIN_EMAILS` | Server/admin | Optional comma-separated email allowlist for v0.1 `/admin` access. `User.role === "ADMIN"` is checked first. |
| `TICK_WORKER_SECRET` | Server/worker | Shared secret for protected tick worker or admin-triggered tick calls. |

## Secret Handling

- Commit only `.env.example` files.
- Never commit `.env.local`, production `.env`, OAuth secrets, database passwords, or worker secrets.
- Public variables must use the `NEXT_PUBLIC_` prefix only when they are safe to expose in the browser.
- Server-only values must not be read from client components.

## Notes For Later Sprint 1 Tasks

- `DATABASE_URL` is active for Prisma validation and generation in `packages/db`.
- `SESSION_SECRET` is active for email/password auth.
- Google OAuth variables are active for `GET /api/auth/google` and `GET /api/auth/google/callback`.
- `NEXT_PUBLIC_MAP_STYLE_URL` is active for the `/create-kingdom` MapLibre page.
- `TICK_WORKER_SECRET` is reserved for the tick worker/admin test tick flow.

## Map Setup

- `/create-kingdom` requires `NEXT_PUBLIC_MAP_STYLE_URL` to load a MapLibre style.
- The example value uses the public MapLibre demo style for local development.
- If the variable is missing, the page shows a configuration error instead of using an implicit fallback provider.
- Production deployments should replace the demo style with the chosen production map style.

## Google OAuth Setup

- Configure Google OAuth with the redirect URI `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`.
- For local development with the example app URL, use `http://localhost:3000/api/auth/google/callback`.
- `NEXT_PUBLIC_APP_URL` must be an absolute app origin with no path.
- Do not commit real Google OAuth client ids or secrets.

## Admin Access

- `/admin` is restricted to authenticated users with `User.role === "ADMIN"` or an email listed in `ADMIN_EMAILS`.
- `ADMIN_EMAILS` is server-only and must not be exposed to the browser.
- Keep `ADMIN_EMAILS` empty unless an operator account needs temporary v0.1 access before role management exists.
- The Sprint 1 admin panel is read-only. `ADMIN_EMAILS` grants inspection access only; it does not enable write, reset, delete, or tick controls.

## Database Package

`packages/db/.env.example` mirrors the database connection value for package-local Prisma CLI usage. Copy it to `packages/db/.env` when running DB commands locally.
