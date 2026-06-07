# Decisions Log

## 2026-06-02 - v0.1 Documentation Foundation

- Decision: v0.1 is the active implementation scope.
- Decision: Sprint 1 is the active sprint.
- Decision: v0.2 docs and Sprint 7-12 artifacts remain future-only until v0.1 is complete.
- Decision: Zero-padded Markdown files are the canonical working docs/tasks for Sprint 1-6.
- Decision: No application code is created in Sprint 1 Task 1 because the repository is not empty and the task is documentation foundation.
- Decision: Next implementation task is minimum project setup for Next.js, TypeScript, Tailwind, Prisma, and the intended repo structure.

## 2026-06-02 - Sprint 1 Initial Prisma Models

- Decision: Sprint 1 Task 6 implements only `User`, `Kingdom`, `District`, `ResourceStockpile`, `BuildingInstance`, `UnitStack`, `LandPurchaseCooldown`, and `Report`.
- Decision: Queue, tick, movement, combat, alliance, ranking, and full report-center models remain deferred to their owning v0.1 sprint tasks.
- Decision: The initial `User` model stores email/password and Google login fields directly with `passwordHash` and `googleSubject`; a separate auth account-linking model is deferred unless v0.1 needs it.
- Decision: The initial `AreaType` enum contains only `STANDARD`. Additional area categories can be added when v0.1 land pricing needs them; area-type bonuses remain post-v0.1.

## 2026-06-07 - Sprint 1 Email Password Auth

- Decision: Sprint 1 Task 7 uses first-party Next.js route handlers for email/password register, login, and logout.
- Decision: Password hashes use Node `crypto.scrypt` with the stored format `scrypt:v1:<salt>:<hash>`.
- Decision: Sessions use signed `mamalik_session` cookies with `SESSION_SECRET` and no session table for the first v0.1 auth slice.
- Decision: Google login remains deferred to Sprint 1 Task 8, and protected route behavior remains deferred to Sprint 1 Task 9.
- Decision: Turbopack uses the repository root so `apps/web` can build against `packages/db` source.
