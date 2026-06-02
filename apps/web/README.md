# Mamalik Web

Next.js web app for Mamalik v0.1.

## Local Development

Install dependencies from `apps/web` or use the root forwarding scripts.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` before working on database, auth, map, admin, or worker integrations.

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Real `.env*` files stay ignored. Commit only `.env.example`.

## Checks

From the repository root:

```bash
npm run typecheck
npm run lint
npm run build
```
