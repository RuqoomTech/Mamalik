# Database Foundation

Mamalik v0.1 uses PostgreSQL with PostGIS and Prisma.

## Package

Database tooling lives in `packages/db`.

Current contents:

- `prisma.config.ts`
- `prisma/schema.prisma`
- `prisma/migrations/000001_enable_postgis/migration.sql`
- `prisma/migrations/000002_initial_v0_1_models/migration.sql`
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

## Initial v0.1 Models

Sprint 1 Task 6 added the first Prisma model set:

- `User`
- `Kingdom`
- `District`
- `ResourceStockpile`
- `BuildingInstance`
- `UnitStack`
- `LandPurchaseCooldown`
- `Report`

These models support the Sprint 1 auth, kingdom creation, starter state, dashboard, and admin foundations. Queue, tick, movement, combat, alliance, ranking, and full report-center models are added in later v0.1 sprint tasks.

## Current Limitations

- Local `psql` and Docker were not available in the current environment, so the migration was not applied locally during setup.
- The generated Prisma client is ignored and should be regenerated as needed with `npm run db:generate`.
- `prisma migrate diff` validated as available but did not emit SQL from the local schema in this toolchain. The initial model migration was added manually from the validated Prisma schema and still needs to be applied against a real PostgreSQL/PostGIS database.
