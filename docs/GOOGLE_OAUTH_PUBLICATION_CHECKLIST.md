# Google OAuth Publication Checklist

Use this checklist before publishing Google login for a production Mamalik deployment.

## Public App URLs

- [ ] Production app URL works publicly.
- [x] `${NEXT_PUBLIC_APP_URL}/privacy` works publicly without login in the tested app environment.
- [x] `${NEXT_PUBLIC_APP_URL}/terms` works publicly without login in the tested app environment.
- [x] Home page links to both the Privacy Policy and Terms of Service.
- [x] `/login` links to both the Privacy Policy and Terms of Service.
- [x] `/register` links to both the Privacy Policy and Terms of Service.
- [x] Login and register pages show the Google-login policy notice near the Google login entry point.

## Google Cloud OAuth Consent

- [ ] OAuth consent screen has the Privacy Policy URL: `${NEXT_PUBLIC_APP_URL}/privacy`.
- [ ] OAuth consent screen has the Terms of Service URL if the field is available: `${NEXT_PUBLIC_APP_URL}/terms`.
- [ ] Authorized domain is verified and aligns with the production app homepage domain.
- [ ] Authorized redirect URI points to the production callback: `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`.
- [ ] App name is correct: `Mamalik`.
- [ ] App logo is correct and matches the app branding.
- [ ] Support email is correct: `Omar.aglan91@gmail.com`.
- [ ] Test users are removed or app publishing status is configured correctly when ready.

## Local Verification

- [x] `npm run build` includes `/privacy` and `/terms`.
- [x] Public legal pages do not require database access.
- [x] Public legal pages do not require an authenticated session.
- [x] Google login start route still renders and redirects according to the existing OAuth implementation in the tested app environment.

## Notes

- Do not publish Google OAuth with localhost policy URLs.
- The production `NEXT_PUBLIC_APP_URL` must be an absolute origin with no path.
- Google OAuth secrets must remain server-side and must not be committed.
