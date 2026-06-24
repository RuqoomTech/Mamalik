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
| `ALLOW_MISSING_LAND_MASK` | Server/map validation | Optional local-development fallback. Set to `true` only when land-mask seed data is missing and local map work must continue. Leave false/empty in production. |
| `ADMIN_EMAILS` | Server/admin | Optional comma-separated email allowlist for v0.1 `/admin` access. `User.role === "ADMIN"` is checked first. |
| `TICK_WORKER_SECRET` | Server/worker | Reserved for future protected external tick calls. The current Sprint 2 admin Server Action does not require a public tick secret. |

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
- `TICK_WORKER_SECRET` is reserved for future protected external tick flows. Sprint 2 admin ticks run through a server-only action and current-user admin authorization.

## Tick Worker Environment

- `npm run tick:once` runs outside the Next.js app and needs `DATABASE_URL` available to the worker process.
- For local development, the worker loads ignored env files if a value is not already set in the shell: `apps/web/.env.local`, `apps/web/.env`, `packages/db/.env`, then `.env`.
- Explicit shell or deployment environment values take precedence over local env files.
- Before running `npm run tick:once` against a database, apply migrations with `npm run db:migrate:deploy`.

## Map Setup

- `/create-kingdom` requires `NEXT_PUBLIC_MAP_STYLE_URL` to load a MapLibre style.
- The example value uses the public MapLibre demo style for local development.
- If the variable is missing, the page shows a configuration error instead of using an implicit fallback provider.
- Production deployments should replace the demo style with the chosen production map style.
- Sprint 4 water rejection reads the local `LandMaskPolygon` PostGIS table. Apply migrations and seed the coarse v0.1 mask with `npm run db:seed-land-mask`.
- Sprint 4 restricted-zone validation reads the local `RestrictedZone` PostGIS table. Apply migrations and seed the artificial v0.1 fixtures with `npm run db:seed-restricted-zones` for local smoke checks.
- `ALLOW_MISSING_LAND_MASK=true` allows local validation to continue when the land mask is missing. Do not enable it in production.

## Google OAuth Setup

- Configure Google OAuth with the redirect URI `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`.
- Configure the Google OAuth consent Privacy Policy URL as `${NEXT_PUBLIC_APP_URL}/privacy`.
- Configure the Google OAuth consent Terms of Service URL as `${NEXT_PUBLIC_APP_URL}/terms` if the field is available.
- For local development with the example app URL, use `http://localhost:3000/api/auth/google/callback`.
- `NEXT_PUBLIC_APP_URL` must be an absolute app origin with no path.
- For production Google OAuth publication, `NEXT_PUBLIC_APP_URL` must use the public production app origin, and the authorized domain must match or align with the app homepage and verified authorized domain in Google Cloud.
- The app name, logo, and support email in Google Cloud OAuth consent settings must match the production Mamalik app configuration.
- Do not commit real Google OAuth client ids or secrets.

## Admin Access

- `/admin` is restricted to authenticated users with `User.role === "ADMIN"` or an email listed in `ADMIN_EMAILS`.
- `ADMIN_EMAILS` is server-only and must not be exposed to the browser.
- Keep `ADMIN_EMAILS` empty unless an operator account needs temporary v0.1 access before role management exists.
- The Sprint 2 admin panel can run one manual tick through a server-only action after re-checking admin authorization.
- `ADMIN_EMAILS` can grant v0.1 admin access, including the manual tick control. Prefer assigning `User.role = "ADMIN"` for durable operator accounts.
- Admin access does not enable reset, delete, or edit controls in v0.1.

## Database Package

`packages/db/.env.example` mirrors the database connection value for package-local Prisma CLI usage. Copy it to `packages/db/.env` when running DB commands locally.
