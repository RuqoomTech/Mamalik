import { randomBytes, timingSafeEqual } from "node:crypto";

export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "mamalik_google_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function verifyOAuthState(
  expectedState: string | null | undefined,
  actualState: string | null | undefined,
): boolean {
  if (!expectedState || !actualState) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedState);
  const actualBuffer = Buffer.from(actualState);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
