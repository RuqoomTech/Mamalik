# Sprint 1 - Foundation + Kingdom Creation

## Goal

A logged-in player can open Mamalik, search/pan the map, click a test location, create a kingdom with 50,000 m2 usable land, and see a basic kingdom dashboard.

## Scope

- Repository foundation and persistent memory files.
- Minimum project setup. The monorepo directory skeleton and web app tooling are complete; environment examples and database foundation remain next.
- Email/password auth and Google login.
- Database foundation.
- Basic MapLibre map screen.
- Temporary location validation.
- Kingdom creation with locked starter state.
- Basic dashboard.
- Basic admin view.

## Required Starter State

- Usable land credit: 50,000 m2.
- Population: 1,000.
- Money: 10,000.
- Food: 5,000.
- Manpower: 500.
- Knowledge: 0.
- Army: 100 Infantry, 25 Archers.
- Beginner protection: 3 days.

## Required Districts

| District | Allocation |
|---|---:|
| Economic | 15,000 m2 |
| Residential | 12,000 m2 |
| Military | 8,000 m2 |
| Defensive | 8,000 m2 |
| Research | 7,000 m2 |

## Temporary Location Validation

Sprint 1 validation is intentionally temporary:

- Validate lat/lng exists.
- Reject invalid coordinate ranges.
- Reject if too close to an existing kingdom using a simple distance check.
- Return a temporary polygon preview.

Real valid land, water rejection, restricted zones, OSM parcel style, and dynamic tolerance are Sprint 4.

## Out Of Scope

- Tick worker.
- Real land validation.
- Real border generation.
- Land buying.
- Combat.
- Scouting.
- Alliances.
- Rankings.
- Full report center.

## Acceptance Criteria

- [ ] Required memory and documentation files exist.
- [ ] A user can register/login.
- [ ] Google login works.
- [ ] A user without a kingdom is sent to create one.
- [ ] A user can click a map location.
- [ ] The system validates the clicked location with the temporary validation flow.
- [ ] The user can create a kingdom.
- [ ] The kingdom starts with correct land, districts, resources, population, buildings, and units.
- [ ] The user can see the kingdom dashboard.
- [ ] Admin can view created users and kingdoms.
