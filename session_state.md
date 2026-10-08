# Session State

## Current Session

- Current date/time: 2026-10-09
- Current sprint: Sprint 4 is closed; Sprint 2 v0.1 follow-ups (player actions, scheduled ticks) and the visible-border expansion follow-up are complete. Ready for Sprint 5.
- Current sprint file: `docs/sprints/SPRINT_05_COMBAT_SCOUTING.md` (next)
- Current task: None; playable core loop, living map, and public redesign shipped.

## Last Completed Task

- Build/upgrade/train actions with shared rules and row-locked transactions.
- `/api/cron/tick` plus Supabase pg_cron schedule every 10 minutes.
- Organic, growing kingdom borders; admin border recalculation.
- World map with all kingdoms; neighbours on the create-kingdom map.
- New home page, atlas hero art, logo, favicons; production map style switched to OpenFreeMap.

## Commands Run

- `npm run typecheck`, `npm run lint`: passed.
- `npm run test`: web 123/123, game 74/74, tick 8/8.

## Manual Smoke Status

- Home page checked locally at desktop and mobile widths.
- Border clipping SQL dry-run against production returned a valid single polygon (55,317 m2 for 55,500 m2 land).
- Post-deploy checks of the live game pages, cron endpoint, and border recalculation pending in the same session.

## Known Issues

- Tick worker processes all kingdoms in one transaction; per-kingdom isolation and STARTED lease/retry remain deferred.
- Starting construction/training creates no report; only completions do.
- Land mask is coarse; clipped borders follow it, not the real coastline.

## Next Recommended Task

- Start Sprint 5 S5-001 movement order model.
