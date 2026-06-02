# Database Foundation

Mamalik v0.1 uses PostgreSQL with PostGIS and Prisma.

## Package

Database tooling lives in `packages/db`.

Current contents:

- `prisma.config.ts`
- `prisma/schema.prisma`
- `prisma/migrations/000001_enable_postgis/migration.sql`
- `.env.example`
- package-local npm dependencies and lockfile

## Environment

Copy `packages/db/.env.example` to `packages/db/.env` before running Prisma commands that need a database connection.

```powershell
Copy-Item packages\db\.env.example packages\db\.env
```

Real `.env*` files are ignored. Commit only `.env.example` templates.

## Commands

From the repository root:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:studio
```

`db:validate` and `db:generate` can run with a valid `DATABASE_URL` value. Migration and Studio commands require a reachable PostgreSQL database.

## PostGIS

The first migration enables PostGIS:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Applying this migration requires database permissions to create extensions.

## Current Limitations

- No v0.1 game models exist yet. They are added in Sprint 1 Task 6.
- Local `psql` and Docker were not available in the current environment, so the migration was not applied locally during setup.
- The generated Prisma client is ignored and should be regenerated as needed with `npm run db:generate`.
