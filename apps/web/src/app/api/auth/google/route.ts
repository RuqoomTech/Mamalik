import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  getGoogleOAuthConfig,
} from "@/lib/auth/google-oauth";
import {
  createOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

const secureCookies = process.env.NODE_ENV === "production";

function loginFailureRedirect(request: Request): NextResponse {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "google-login-failed");

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  try {
    const config = getGoogleOAuthConfig();
    const state = createOAuthState();
    const authorizationUrl = buildGoogleAuthorizationUrl(config, state);
    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set({
      name: GOOGLE_OAUTH_STATE_COOKIE_NAME,
      value: state,
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
      path: "/api/auth/google",
      maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return loginFailureRedirect(request);
  }
}
