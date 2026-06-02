# Mamalik DB

Prisma, PostgreSQL, and PostGIS foundation for Mamalik v0.1.

## Environment

Copy `.env.example` to `.env` before running Prisma commands that need a database connection.

```powershell
Copy-Item .env.example .env
```

Real `.env*` files stay ignored. Commit only `.env.example`.

## Commands

From the repository root:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:studio
```

`db:migrate:dev`, `db:migrate:deploy`, and `db:studio` require a reachable PostgreSQL database with permissions to enable PostGIS.

## Current Scope

This package currently contains the database foundation only:

- Prisma config.
- PostgreSQL datasource.
- PostGIS enablement migration.
- Generated Prisma client output path.

Initial v0.1 game models are added in Sprint 1 Task 6.
