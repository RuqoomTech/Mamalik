# 05 — Sprint Plan

## MVP implementation order

| Phase | Goal |
|---|---|
| 1 | Project setup: Next.js, TypeScript, Tailwind, Prisma, Postgres/PostGIS |
| 2 | Auth: email/password + Google login |
| 3 | Core database schema: users, kingdoms, districts, buildings, units, resources |
| 4 | Map prototype: search/pan/click/select location |
| 5 | Land validation prototype: valid land, dynamic buffer, no overlap |
| 6 | Kingdom creation: 50,000 m² land credit, starter buildings, starter units |
| 7 | Tick worker: resources, food consumption, construction/training progress |
| 8 | Dashboard: kingdom overview, districts, buildings, army |
| 9 | Land buying: packages, prices, cooldowns |
| 10 | Combat/scouting prototype |
| 11 | Alliances, reports, notifications |
| 12 | Admin panel and testing tools |

## Sprint 1 — Foundation and first kingdom

Goal:

> A logged-in player can open Mamalik, search/pan the map, click a test location, create a kingdom with 50,000 m² usable land, and see a basic dashboard.

Major output:

- repo setup
- database setup
- auth
- basic map
- temporary validation endpoint
- kingdom creation
- dashboard
- simple admin read-only views

## Sprint 2 — Tick worker and economy

Goal:

> The world updates every 10 minutes.

Major output:

- tick table / tick clock
- resource production
- food consumption
- population effects
- construction job progress
- training job progress
- test tick admin action

## Sprint 3 — Buildings, districts, training

Goal:

> Player can manage districts, construct/upgrade buildings, and train units.

Major output:

- district view
- building list
- construction queue
- upgrade flow
- unit training flow
- training queue
- validation around land use and resources

## Sprint 4 — Land buying

Goal:

> Player can buy virtual land through fixed packages with hybrid pricing and cooldowns.

Major output:

- land package UI
- price calculation
- package cooldowns
- land purchase reports
- usable land updates
- simple visible border update placeholder

## Sprint 5 — Movement, scouting, combat

Goal:

> Armies can move, scout, attack, resolve combat, and create reports.

Major output:

- army movement
- scout mission
- attack mission
- simple combat formula
- defender bonuses
- siege requirement for high-level walls
- battle reports
- scout reports

## Sprint 6 — Alliances, rankings, notifications, admin

Goal:

> v0.1 feels like a playable MMO layer.

Major output:

- alliance create/join/leave
- diplomacy states
- ranking pages
- notifications
- report center
- admin tools
- v0.1 testing checklist

## Sprint rule

Each sprint should end with a working vertical slice. Avoid building large hidden systems without UI or acceptance tests.
