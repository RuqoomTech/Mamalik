# 06 — Sprint 1 Tasks

## Sprint 1 goal

A logged-in player can open Mamalik, search/pan the map, click a test location, create a kingdom with 50,000 m² usable land, and see a basic kingdom dashboard.

## Task S1-01 — Create project structure

Create:

```text
mamalik/
  apps/web/
  packages/db/
  packages/game/
  workers/tick-worker/
  docs/
  tasks/
```

Acceptance criteria:

- repo boots locally
- TypeScript works
- lint command exists
- format command exists
- app has a basic homepage

## Task S1-02 — Configure Next.js, Tailwind, TypeScript

Acceptance criteria:

- Next.js App Router runs
- Tailwind styles load
- TypeScript strict mode is enabled or planned
- base layout exists
- basic UI components folder exists

## Task S1-03 — Configure PostgreSQL + PostGIS

Acceptance criteria:

- local database connection works
- PostGIS extension is enabled
- Prisma can connect
- first migration runs successfully

## Task S1-04 — Create initial Prisma schema

Include:

- User
- Kingdom
- District
- ResourceStockpile
- BuildingInstance
- UnitStack
- LandPurchaseCooldown
- Report
- Notification

Acceptance criteria:

- `prisma generate` works
- migration creates tables
- seed script can insert sample data

## Task S1-05 — Add auth

Implement:

- register
- login
- logout
- Google login
- protected dashboard route

Acceptance criteria:

- unauthenticated user cannot access dashboard
- logged-in user can access dashboard
- user record exists in database or auth mapping layer

## Task S1-06 — Add no-kingdom redirect

Acceptance criteria:

- logged-in user with no kingdom goes to `/create-kingdom`
- logged-in user with kingdom goes to `/dashboard`

## Task S1-07 — Create map selection page

Route:

```text
/create-kingdom
```

Features:

- MapLibre map
- pan/zoom
- click to select marker
- selected coordinates panel
- placeholder search input
- validate location button

Acceptance criteria:

- player can select a point
- UI displays selected lat/lng
- validate button sends selected point to API

## Task S1-08 — Create temporary validation endpoint

Endpoint:

```text
POST /api/kingdom/validate-location
```

Input:

```json
{
  "lat": 24.7136,
  "lng": 46.6753
}
```

Output:

```json
{
  "valid": true,
  "reason": null,
  "visibleAreaM2": 50000,
  "usableLandM2": 50000,
  "previewPolygon": {}
}
```

Acceptance criteria:

- rejects invalid/missing coordinates
- checks against existing kingdom distance using placeholder/simple distance
- returns a preview polygon
- returns nearby suggestions if invalid, even if suggestions are simple placeholders in Sprint 1

## Task S1-09 — Create kingdom confirmation UI

Show:

- suggested kingdom name
- editable name input
- selected location
- usable land = 50,000 m²
- visible area estimate
- starter resources
- starter districts
- starter buildings
- starter army

Acceptance criteria:

- player can edit kingdom name
- create button is disabled until location is valid
- confirmation screen is readable

## Task S1-10 — Create kingdom endpoint

Endpoint:

```text
POST /api/kingdom/create
```

Creates:

- Kingdom
- 5 District records
- ResourceStockpile
- starter BuildingInstances
- starter UnitStacks
- LandPurchaseCooldown records
- protection end timestamp

Acceptance criteria:

- kingdom created for current logged-in user
- user cannot create more than one kingdom in v0.1 unless admin/dev reset
- all starting values are correct
- transaction rollback works if any creation step fails

## Task S1-11 — Create dashboard

Route:

```text
/dashboard
```

Show:

- kingdom name
- protection countdown
- location
- usable/used/free land
- resources
- population
- districts
- starter buildings
- starter army

Acceptance criteria:

- dashboard loads after kingdom creation
- values match database
- no advanced actions required yet

## Task S1-12 — Create simple admin panel

Route:

```text
/admin
```

Show:

- users
- kingdoms
- resources
- districts
- starter buildings/units

Acceptance criteria:

- admin-only access
- view-only in Sprint 1
- local/dev reset can be added only if clearly marked dangerous

## Sprint 1 not included

Do not build:

- real land parcel generation
- real water/restricted-zone validation
- tick worker
- land buying
- construction queue
- training queue
- combat
- scouting
- alliances
- rankings
- full admin actions
