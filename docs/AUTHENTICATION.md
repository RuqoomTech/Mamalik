# Authentication

Mamalik v0.1 uses first-party Next.js route handlers for email/password auth and Google login.

## Implemented In Sprint 1 Task 7

- Register page: `/register`
- Login page: `/login`
- Register API: `POST /api/auth/register`
- Login API: `POST /api/auth/login`
- Logout API: `POST /api/auth/logout`
- Root page displays register/login links or the signed-in account summary.

## Implemented In Sprint 1 Task 8

- Google login start API: `GET /api/auth/google`
- Google login callback API: `GET /api/auth/google/callback`
- Login page Google entry point: `/login`
- Register page Google entry point: `/register`
- Google OAuth users receive the same signed `mamalik_session` cookie as email/password users.

## Google OAuth Flow

- Required environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`, and `SESSION_SECRET`.
- Redirect URI: `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`.
- OAuth state is generated server-side and stored in `mamalik_google_oauth_state`.
- State cookie flags: `HttpOnly`, `SameSite=Lax`, path `/api/auth/google`, short-lived 10 minute max age, and `Secure` in production.
- Callback requests must provide a matching `state` value and authorization `code`.
- The callback exchanges the authorization code at Google's token endpoint and reads identity from Google's userinfo endpoint.
- Google identities must include a subject, an email, and a verified email flag.

## Google Account Linking

- If a user exists by `googleSubject`, that user is logged in.
- If no `googleSubject` match exists but a user exists by email with no linked `googleSubject`, the Google subject is linked to that existing user.
- If no user exists, a user is created with `authProvider = GOOGLE`.
- If an email is already linked to a different Google subject, login fails.

## Implemented In Sprint 1 Task 9

- Protected dashboard page: `/dashboard`
- Protected create-kingdom placeholder page: `/create-kingdom`
- Protected admin placeholder page: `/admin`
- Signed-in `/login` and `/register` visits redirect to the correct app destination.

## Route Protection

- Route protection uses server-side page guards and `getCurrentUser`.
- Unauthenticated users visiting `/dashboard`, `/create-kingdom`, or `/admin` are redirected to `/login`.
- Signed-in users without a kingdom visiting `/dashboard` are redirected to `/create-kingdom`.
- Signed-in users with a kingdom visiting `/create-kingdom` are redirected to `/dashboard`.
- Signed-in users visiting `/login` or `/register` are redirected to `/create-kingdom` when they have no kingdom and `/dashboard` when they have a kingdom.
- `/admin` allows users with `User.role === "ADMIN"`.
- `/admin` also supports the server-side `ADMIN_EMAILS` allowlist for v0.1 operator access.

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
- Google login failures redirect to `/login?error=google-login-failed`.

## Current Limits

- `/dashboard` is a protected read-only kingdom overview.
- `/admin` is a Sprint 1 placeholder until its owning task adds basic read-only views.
- `/create-kingdom` has the protected MapLibre location-selection page, temporary server validation, editable confirmation UI, and kingdom creation API.
- Live kingdom creation smoke tests require a reachable PostgreSQL/PostGIS database.
- There is no session table yet. Signed cookies are the v0.1 Sprint 1 implementation.
- Live route smoke tests require a reachable PostgreSQL/PostGIS database.
- Live Google OAuth smoke tests require configured Google OAuth credentials and a matching Google Console redirect URI.
