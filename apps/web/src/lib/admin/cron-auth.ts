import { timingSafeEqual } from "node:crypto";

export const MIN_CRON_SECRET_LENGTH = 16;

export function isAuthorizedCronRequest(authorizationHeader: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < MIN_CRON_SECRET_LENGTH || !authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  const provided = Buffer.from(authorizationHeader.slice("Bearer ".length));
  const expected = Buffer.from(secret);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
