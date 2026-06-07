# Authentication

Mamalik v0.1 uses first-party Next.js route handlers for email/password auth. Google login is still deferred to Sprint 1 Task 8.

## Implemented In Sprint 1 Task 7

- Register page: `/register`
- Login page: `/login`
- Register API: `POST /api/auth/register`
- Login API: `POST /api/auth/login`
- Logout API: `POST /api/auth/logout`
- Root page displays register/login links or the signed-in account summary.

## Password Storage

- Passwords are hashed with Node `crypto.scrypt`.
- Stored format: `scrypt:v1:<salt>:<hash>`.
- Raw passwords are never stored.

## Sessions

- Session cookie name: `mamalik_session`.
- Session duration: 7 days.
- Cookie flags: `HttpOnly`, `SameSite=Lax`, path `/`, and `Secure` in production.
- Session tokens are HMAC SHA-256 signed with `SESSION_SECRET`.
- `SESSION_SECRET` must be at least 32 characters.

## Input Validation

- Emails are trimmed and lowercased.
- Display names must be 2-50 characters.
- Passwords must be 8-128 characters.
- Login failures use a generic message.
- Duplicate registration returns an email-taken error.

## Current Limits

- Google login is not implemented yet.
- Route protection for dashboard and kingdom creation is not implemented yet.
- There is no session table yet. Signed cookies are the v0.1 Sprint 1 implementation.
- Live route smoke tests require a reachable PostgreSQL/PostGIS database.
