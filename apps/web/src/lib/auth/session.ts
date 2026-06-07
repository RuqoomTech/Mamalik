import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "mamalik_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "PLAYER" | "ADMIN";

export type SessionPayload = {
  userId: string;
  email: string;
  role: SessionRole;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters before using sessions.");
  }

  return secret;
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionPayload(
  user: { id: string; email: string; role: SessionRole },
  now = new Date(),
): SessionPayload {
  const issuedAt = Math.floor(now.getTime() / 1000);

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS,
  };
}

export function createSessionToken(
  payload: SessionPayload,
  secret = getSessionSecret(),
): string {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = sign(body, secret);

  return `${body}.${signature}`;
}

export function verifySessionToken(
  token: string,
  secret = getSessionSecret(),
  now = new Date(),
): SessionPayload | null {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(body).toString("utf8")) as SessionPayload;
    const currentTime = Math.floor(now.getTime() / 1000);

    if (!payload.userId || !payload.email || !payload.role || payload.expiresAt <= currentTime) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
