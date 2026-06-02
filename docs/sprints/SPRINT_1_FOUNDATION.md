# Sprint 1 — Foundation + Kingdom Creation

## Sprint goal

A logged-in player can open Mamalik, search/pan the map, click a test location, create a kingdom with 50,000 m² usable land, and see a basic kingdom dashboard.

## Scope

### 1. Project setup

- Create monorepo structure.
- Install Next.js, TypeScript, Tailwind, Prisma.
- Configure ESLint/Prettier.
- Configure environment variables.
- Add basic app shell and layout.

### 2. Database setup

Create PostgreSQL + PostGIS setup and initial Prisma schema.

Initial models:

- User
- Kingdom
- District
- ResourceStockpile
- BuildingInstance
- UnitStack
- LandPurchaseCooldown
- Report

### 3. Auth

Implement:

- register
- login
- logout
- Google login
- protected dashboard routes

Routing behavior:

- user without kingdom → `/create-kingdom`
- user with kingdom → `/dashboard`

### 4. Basic map screen

Create `/create-kingdom` with:

- MapLibre map
- search input placeholder
- pan/zoom
- click marker
- selected coordinates
- validate location button

### 5. Location validation stub

Create `POST /api/kingdom/validate-location`.

Sprint 1 validation is intentionally temporary:

- validate lat/lng exists
- reject invalid coordinate ranges
- reject if too close to an existing kingdom using a simple distance check
- return a temporary polygon preview

Real valid land, water, restricted zones, OSM parcel style, and dynamic tolerance are Sprint 4.

### 6. Kingdom creation

Create `POST /api/kingdom/create`.

It creates:

- Kingdom
- 5 districts
- starting resources
- starter buildings
- starter units
- land package cooldown records
- 3-day beginner protection timestamp

Starting values:

- usableLandM2: 50,000
- population: 1,000
- Money: 10,000
- Food: 5,000
- Manpower: 500
- Knowledge: 0
- army: 100 Infantry, 25 Archers

Districts:

- Economic: 15,000 m²
- Residential: 12,000 m²
- Military: 8,000 m²
- Defensive: 8,000 m²
- Research: 7,000 m²

### 7. Basic dashboard

Create `/dashboard` showing:

- kingdom name
- location
- usable land
- used/free land
- resources
- population
- districts
- starter buildings
- starter army
- beginner protection countdown

### 8. Simple admin panel

Create `/admin` showing:

- users
- kingdoms
- resources
- districts
- buildings
- units

## Out of scope

- Tick worker
- Real land validation
- Real border generation
- Land buying
- Combat
- Scouting
- Alliances
- Rankings
- Full reports

## Acceptance criteria

- [ ] A user can register/login.
- [ ] A user without a kingdom is sent to create one.
- [ ] A user can click a map location.
- [ ] The system validates the clicked location with the temporary validation flow.
- [ ] The user can create a kingdom.
- [ ] The kingdom starts with correct land, districts, resources, population, buildings, and units.
- [ ] The user can see the kingdom dashboard.
- [ ] Admin can view created users and kingdoms.

