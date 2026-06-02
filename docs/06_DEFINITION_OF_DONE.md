# 06 — Definition of Done

A task is done only when all relevant criteria are met.

## General task done criteria

- Code is implemented.
- TypeScript passes.
- Lint passes.
- Relevant tests or manual QA steps pass.
- Data validation is included.
- Error states are handled.
- UI shows loading/empty/error states where relevant.
- The change does not break existing flows.
- Documentation is updated if behavior changes.

## API task done criteria

- Endpoint validates input.
- Endpoint checks ownership/authorization.
- Endpoint returns useful errors.
- Endpoint is idempotent where needed.
- Endpoint does not expose internal IDs unnecessarily.
- Endpoint has at least basic test coverage or documented manual checks.

## Game logic task done criteria

- Formula is implemented in `packages/game` where possible.
- Formula has unit tests.
- Edge cases are handled.
- Results are deterministic for the same input.
- No gameplay state is changed without a transaction when needed.

## Spatial task done criteria

- Uses PostGIS/raw SQL where needed.
- Handles invalid geometries.
- Handles empty/no result cases.
- Does not trust client coordinates blindly.
- Provides player-friendly invalid-location reasons.

## Sprint done criteria

A sprint is done when:

- Sprint acceptance criteria are met.
- Critical bugs are fixed.
- Core flow is manually tested.
- Admin can inspect generated state.
- The next sprint can safely build on top of it.

