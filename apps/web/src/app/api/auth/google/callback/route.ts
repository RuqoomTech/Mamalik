import { getPrismaClient } from "@/lib/db/client";
import { setSessionCookie } from "@/lib/auth/cookies";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
} from "@/lib/auth/google-oauth";
import {
  normalizeGoogleIdentity,
  upsertGoogleUser,
  type GoogleAuthUser,
  type GoogleUserRepository,
} from "@/lib/auth/google-user";
import {
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  verifyOAuthState,
} from "@/lib/auth/oauth-state";
import { createSessionPayload, createSessionToken } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const secureCookies = process.env.NODE_ENV === "production";
const userSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  googleSubject: true,
};

function clearGoogleStateCookie(response: NextResponse): void {
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/api/auth/google",
    maxAge: 0,
  });
}

function failureRedirect(request: NextRequest): NextResponse {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "google-login-failed");
  const response = NextResponse.redirect(redirectUrl);
  clearGoogleStateCookie(response);

  return response;
}

function createGoogleUserRepository(): GoogleUserRepository {
  const prisma = getPrismaClient();

  return {
    findByGoogleSubject: async (googleSubject: string): Promise<GoogleAuthUser | null> =>
      prisma.user.findUnique({
        where: { googleSubject },
        select: userSelect,
      }),
    findByEmail: async (email: string): Promise<GoogleAuthUser | null> =>
      prisma.user.findUnique({
        where: { email },
        select: userSelect,
      }),
    linkGoogleSubject: async (
      userId: string,
      googleSubject: string,
    ): Promise<GoogleAuthUser> =>
      prisma.user.update({
        where: { id: userId },
        data: { googleSubject },
        select: userSelect,
      }),
    createGoogleUser: async (input): Promise<GoogleAuthUser> =>
      prisma.user.create({
        data: {
          email: input.email,
          displayName: input.displayName,
          googleSubject: input.googleSubject,
          authProvider: "GOOGLE",
        },
        select: userSelect,
      }),
  };
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const oauthError = request.nextUrl.searchParams.get("error");
    const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value;

    if (oauthError || !code || !verifyOAuthState(expectedState, state)) {
      return failureRedirect(request);
    }

    const config = getGoogleOAuthConfig();
    const accessToken = await exchangeGoogleAuthorizationCode(code, config);
    const googleUserInfo = await fetchGoogleUserInfo(accessToken);
    const identity = normalizeGoogleIdentity(googleUserInfo);
    const user = await upsertGoogleUser(createGoogleUserRepository(), identity);
    const token = createSessionToken(createSessionPayload(user));
    const response = NextResponse.redirect(new URL("/", config.appUrl));

    setSessionCookie(response, token);
    clearGoogleStateCookie(response);

    return response;
  } catch {
    return failureRedirect(request);
  }
}
