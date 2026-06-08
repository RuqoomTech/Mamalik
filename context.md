# Mamalik Context

Long-term project memory for Mamalik / ممالك.

## Project Summary

Mamalik is an original browser-based, tick-based grand strategy MMO on a global real-world map. Players create kingdoms on valid land, receive a starting usable land credit, grow through districts and buildings, train armies, scout and fight, form simple alliances, receive reports, and compete through persistent rankings.

Mamalik is inspired by the genre of tick-based web strategy games, but it must not copy any existing game's code, UI, art, text, branding, or protected expression.

## Active Release

- Active milestone: v0.1
- Active sprint: Sprint 1 - Foundation + Kingdom Creation
- Active task sequence: repository foundation, monorepo skeleton, web tooling setup, environment examples, database foundation, initial Prisma models, email/password auth, Google login, and protected route behavior are complete; the MapLibre create-kingdom page is next
- v0.2 material in this repository is future-only and must not drive implementation until v0.1 is complete

## Locked v0.1 Scope

v0.1 must include:

- Register/login
- Google login
- Real-world map screen
- Search, pan, and click location selection
- Valid kingdom creation
- Starting kingdom with 50,000 m2 usable land credit
- Real land parcel style visible borders, simplified or stubbed at first
- Land credit system
- District system
- Starting buildings
- Starting units
- 10-minute tick economy
- Population and Food consumption
- Building construction and upgrades
- Unit training
- Land buying packages, prices, and cooldowns
- Distance-based army movement
- Basic combat
- Approximate scouting
- Reports
- Rankings
- Simple alliances
- Admin panel

## Deferred Until After v0.1

- WebSockets/realtime
- Full chat
- Area-type bonuses
- Wood, Stone, and Iron
- Advanced diplomacy
- Payments/premium
- Mobile app
- Manual building placement
- Advanced battle tactics

## Locked Gameplay Decisions

### World

- Global real-world map from day one.
- Players can start anywhere globally if the location is valid.
- Valid land excludes water, restricted zones, impossible geometry, overlap, and invalid border generation.
- World is persistent and endless.
- There are no seasons and no final victory condition.
- Progression is leaderboard-based.

### Land

- Starting usable land credit is 50,000 m2.
- Visible border is a virtual polygon.
- Gameplay land credit and visible border area are separate.
- Visible border generation uses dynamic tolerance:
  - Try 49,000-51,000 m2.
  - Then try 45,000-55,000 m2.
  - Then use a fallback generated polygon.
- Land buying uses fixed packages:
  - 500 m2: no cooldown
  - 1,000 m2: 6 hours
  - 5,000 m2: 24 hours
  - 10,000 m2: 48 hours
- Land price depends on kingdom size and area type.
- War land capture allows a winner to gain 1,000 m2 usable land credit from the same enemy player once per 30 days.

### Kingdom Creation

- Player searches or pans the map, clicks a point, validates it, then confirms creation.
- Invalid locations should return useful reasons and suggest nearby valid points.
- Kingdom naming is hybrid: suggested from player/location and editable before confirmation.

### Protection

- Beginner protection lasts 3 days.
- Protected kingdoms cannot attack players.
- Protected kingdoms cannot be attacked.
- Protected kingdoms cannot be scouted by players.
- Protected kingdoms can build, train, buy land, prepare, and later scout NPC/wild areas.

### Districts

- Buildings are not manually placed on the map.
- Buildings consume land inside districts.
- Districts are Economic, Military, Residential, Research, and Defensive.
- Starting allocation:
  - Economic: 15,000 m2
  - Residential: 12,000 m2
  - Military: 8,000 m2
  - Defensive: 8,000 m2
  - Research: 7,000 m2
- Allocation is fixed at start and editable later using unused land.

### Starting State

- Money: 10,000
- Food: 5,000
- Manpower: 500
- Knowledge: 0
- Population: 1,000
- Army: 100 Infantry and 25 Archers

### Economy

- Resources are Money, Food, Manpower, and Knowledge.
- Money comes from taxes and markets.
- Food comes from farms and population support.
- Manpower comes from population and houses.
- Knowledge comes from scholar/research buildings.
- Resources generate every 10-minute tick.
- Population and army consume Food every tick.

### Buildings And Units

- Buildings have levels.
- Construction and upgrades are measured in ticks.
- There is 1 active construction slot at start.
- There is 1 active training queue at start.
- v0.1 buildings: Farm, Market, Tax Office, Palace, Houses, Barracks, Stables later, Watchtower, Wall, Scholar Hall.
- v0.1 units: Infantry, Archers, Cavalry, Scouts, Siege.
- Research uses a simple tech tree.

### Combat

- Armies take distance-based travel time.
- Global attacks are allowed, but far attacks are slow and expensive.
- v0.1 battle formula is simple attack power versus defense power.
- Defenders get bonuses from Wall, Watchtower, Defensive District, Defense tech, and garrisoned units.
- Scouts reveal approximate enemy information.
- Siege is required to seriously damage high-level walls.

### Alliances And Rankings

- Alliances are simple in v0.1: create, join, leave, leader role, member list.
- Alliance fields include name, tag, description, and member list.
- Member limit is 20.
- Alliance members cannot attack each other.
- Diplomacy states are Neutral, Ally, and War.
- No full chat in v0.1; possible simple alliance announcements only.
- Rankings include Total land, Military power, Economy score, and Knowledge/technology score.
- Alliance score is later.

## Locked Architecture Decisions

- Frontend: Next.js, TypeScript, Tailwind.
- Map: MapLibre GL JS.
- Backend: Next.js API routes / route handlers first.
- Database: PostgreSQL + PostGIS.
- ORM: Prisma.
- PostGIS-heavy operations use raw SQL / TypedSQL.
- Worker: separate tick worker process every 10 minutes.
- Realtime: polling/refresh first; WebSockets later.
- Auth: email/password and Google login.
- Admin: simple admin panel in v0.1.

## Tooling Conventions

- npm is the current package manager.
- Root scripts delegate to app-local scripts in `apps/web`.
- Web dependencies and lockfile live in `apps/web`.
- Database dependencies and lockfile live in `packages/db`.
- Commit environment templates only. Real secrets belong in ignored local files such as `apps/web/.env.local`.
- Public browser-safe web environment variables must use `NEXT_PUBLIC_`; server secrets must stay server-side.
- Prisma foundation now includes initial v0.1 models for users, kingdoms, districts, resource stockpiles, buildings, unit stacks, land purchase cooldowns, and reports.
- PostGIS is enabled by the first database migration.
- The initial `User` model stores email/password and Google auth fields directly; a separate auth account-linking model is deferred unless v0.1 needs it.
- The initial `AreaType` enum starts with `STANDARD` only; additional area categories can be added when v0.1 land pricing requires them, while area-type bonuses remain post-v0.1.
- Email/password auth uses first-party Next.js route handlers, Node `crypto.scrypt` password hashes, and signed `mamalik_session` cookies.
- Google login uses first-party Next.js route handlers, a short-lived HttpOnly OAuth state cookie, Google OAuth token/userinfo endpoints, and the same signed `mamalik_session` cookie as email/password auth.
- Google login links an existing email account when the Google email matches and `googleSubject` is empty; otherwise it signs in by `googleSubject` or creates a new `GOOGLE` user.
- Protected app routes use server-side page guards backed by `getCurrentUser`; `/dashboard`, `/create-kingdom`, and `/admin` do not use client-only protection.
- Admin access checks `User.role === "ADMIN"` first and also supports the server-side `ADMIN_EMAILS` allowlist.
- Turbopack is configured with the repository root so `apps/web` can consume `packages/db` source during builds.
- The current v0.1 logo mark is a text-free raster asset at `apps/web/public/brand/mamalik-logo.png`; render `Mamalik / ممالك` as real UI text.
- Canonical v0.1 documentation sources are listed in `AGENTS.md`; duplicate historical docs and task artifacts live under `docs/archive/` and `tasks/archive/` as read-only references.
- Active Sprint 1-6 task tracking uses `tasks/backlog.md` and `tasks/sprint_01.md` through `tasks/sprint_06.md`; JSON/CSV exports are reference artifacts only.

## Glossary

- Kingdom: A player's main realm on the world map.
- Usable land credit: Exact gameplay land amount used for balance and capacity.
- Visible border: Virtual polygon shown on the map; may approximate the land credit.
- District: Land allocation category that contains buildings.
- Tick: A 10-minute world update cycle.
- Beginner protection: First 3 days after kingdom creation when player combat/scouting is blocked.
- Report: Stored player-facing outcome record for land, construction, scouting, battle, or training events.
- Alliance: Simple player group with leader and member list.
