# Definition Of Done

A Mamalik task is done only when the relevant criteria are met and documented.

## General Criteria

- The task stays inside v0.1 and the active sprint.
- The implementation is small and reviewable.
- Documentation is updated.
- `session_state.md` is updated.
- `CHANGELOG.md` is updated.
- Relevant checks are run, or the reason they cannot run is documented.
- Known issues and the next recommended task are recorded.

## Code Criteria

- TypeScript is strict once app code exists.
- Domain logic is not hidden inside UI components.
- Server-side validation protects every game action.
- Client-submitted resource, land, unit, price, and cooldown values are not trusted.
- Mutations touching related game state use transactions where practical.
- Edge cases and failure states are handled.

## API Criteria

- Input is validated.
- Ownership and authorization are checked.
- Errors are useful and do not leak sensitive internals.
- Game calculations are performed server-side.
- Relevant tests or manual verification notes exist.

## Game Logic Criteria

- Formulas live in reusable game modules where possible.
- Formula outputs are deterministic for the same inputs.
- Unit tests cover formulas once the test runner exists.
- Temporary formulas are documented as temporary.

## Spatial Criteria

- Gameplay land credit stays separate from visible geometry.
- Invalid coordinates are rejected.
- PostGIS/raw SQL is used for spatial-heavy operations when needed.
- Invalid geometries, overlap, water, restricted zones, and no-result cases are handled as the relevant sprint introduces them.

## Sprint Criteria

A sprint is done when:

- Sprint acceptance criteria pass.
- Critical bugs are fixed or documented with explicit deferral approval.
- Core flow is manually tested.
- Admin can inspect generated state where relevant.
- The next sprint can safely build on top of it.
