import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGoogleAuthorizationUrl,
  type GoogleOAuthConfig,
} from "./google-oauth";
import {
  normalizeGoogleIdentity,
  upsertGoogleUser,
  type GoogleAuthUser,
  type GoogleIdentity,
  type GoogleUserRepository,
} from "./google-user";
import { createOAuthState, verifyOAuthState } from "./oauth-state";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionPayload,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./session";
import {
  normalizeEmail,
  validateLoginInput,
  validateRegisterInput,
} from "./validation";
import {
  getPostLoginDestination,
  isAdminUser,
  parseAdminEmails,
} from "./route-destinations";

const TEST_SECRET = "test-session-secret-with-at-least-32-chars";
const GOOGLE_CONFIG: GoogleOAuthConfig = {
  clientId: "google-client-id",
  clientSecret: "google-client-secret",
  appUrl: "http://localhost:3000",
  redirectUri: "http://localhost:3000/api/auth/google/callback",
};

function createGoogleRepository(initialUsers: GoogleAuthUser[] = []): GoogleUserRepository & {
  users: Map<string, GoogleAuthUser>;
} {
  const users = new Map(initialUsers.map((user) => [user.id, user]));

  return {
    users,
    findByGoogleSubject: async (googleSubject: string) =>
      Array.from(users.values()).find((user) => user.googleSubject === googleSubject) ?? null,
    findByEmail: async (email: string) =>
      Array.from(users.values()).find((user) => user.email === email) ?? null,
    linkGoogleSubject: async (userId: string, googleSubject: string) => {
      const user = users.get(userId);

      if (!user) {
        throw new Error("User not found.");
      }

      const updatedUser = { ...user, googleSubject };
      users.set(userId, updatedUser);

      return updatedUser;
    },
    createGoogleUser: async (input) => {
      const user: GoogleAuthUser = {
        id: `user-${users.size + 1}`,
        email: input.email,
        displayName: input.displayName,
        role: "PLAYER",
        googleSubject: input.googleSubject,
      };
      users.set(user.id, user);

      return user;
    },
  };
}

function googleIdentity(overrides: Partial<GoogleIdentity> = {}): GoogleIdentity {
  return {
    subject: "google-subject-1",
    email: "player@example.com",
    emailVerified: true,
    displayName: "Player One",
    ...overrides,
  };
}

test("normalizes email before auth validation", () => {
  assert.equal(normalizeEmail("  Player@Example.COM "), "player@example.com");
});

test("validates register input", () => {
  const result = validateRegisterInput({
    email: "player@example.com",
    displayName: " Player One ",
    password: "strong-password",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(result.data, {
      email: "player@example.com",
      displayName: "Player One",
      password: "strong-password",
    });
  }
});

test("rejects invalid register input", () => {
  const result = validateRegisterInput({
    email: "not-an-email",
    displayName: "A",
    password: "short",
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.deepEqual(
      result.errors.map((error) => error.field),
      ["email", "displayName", "password"],
    );
  }
});

test("validates login input", () => {
  const result = validateLoginInput({
    email: "Player@Example.COM",
    password: "strong-password",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.data.email, "player@example.com");
  }
});

test("hashes and verifies passwords", async () => {
  const storedHash = await hashPassword("strong-password");

  assert.match(storedHash, /^scrypt:v1:/);
  assert.equal(await verifyPassword("strong-password", storedHash), true);
  assert.equal(await verifyPassword("wrong-password", storedHash), false);
});

test("creates and verifies signed session tokens", () => {
  const now = new Date("2026-06-07T00:00:00.000Z");
  const payload = createSessionPayload(
    { id: "user-1", email: "player@example.com", role: "PLAYER" },
    now,
  );
  const token = createSessionToken(payload, TEST_SECRET);

  assert.deepEqual(verifySessionToken(token, TEST_SECRET, now), payload);
});

test("rejects tampered session tokens", () => {
  const payload = createSessionPayload(
    { id: "user-1", email: "player@example.com", role: "PLAYER" },
    new Date("2026-06-07T00:00:00.000Z"),
  );
  const token = createSessionToken(payload, TEST_SECRET);
  const [body, signature] = token.split(".");
  const tamperedPayload: SessionPayload = { ...payload, userId: "user-2" };
  const tamperedBody = Buffer.from(JSON.stringify(tamperedPayload)).toString("base64url");

  assert.equal(verifySessionToken(`${tamperedBody}.${signature}`, TEST_SECRET), null);
  assert.equal(verifySessionToken(`${body}.tampered`, TEST_SECRET), null);
});

test("rejects expired session tokens", () => {
  const payload = createSessionPayload(
    { id: "user-1", email: "player@example.com", role: "PLAYER" },
    new Date("2026-06-07T00:00:00.000Z"),
  );
  const token = createSessionToken(payload, TEST_SECRET);
  const afterExpiry = new Date((payload.expiresAt + 1) * 1000);

  assert.equal(verifySessionToken(token, TEST_SECRET, afterExpiry), null);
});

test("creates and verifies Google OAuth state", () => {
  const state = createOAuthState();
  const otherState = createOAuthState();

  assert.notEqual(state, otherState);
  assert.equal(verifyOAuthState(state, state), true);
  assert.equal(verifyOAuthState(state, otherState), false);
  assert.equal(verifyOAuthState(state, null), false);
  assert.equal(verifyOAuthState(null, state), false);
});

test("builds Google authorization URL with v0.1 callback settings", () => {
  const url = buildGoogleAuthorizationUrl(GOOGLE_CONFIG, "state-1");

  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.pathname, "/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), GOOGLE_CONFIG.clientId);
  assert.equal(url.searchParams.get("redirect_uri"), GOOGLE_CONFIG.redirectUri);
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.equal(url.searchParams.get("prompt"), "select_account");
});

test("normalizes verified Google identity", () => {
  const identity = normalizeGoogleIdentity({
    sub: " google-subject-1 ",
    email: " Player@Example.COM ",
    email_verified: true,
    name: " Player One ",
  });

  assert.deepEqual(identity, {
    subject: "google-subject-1",
    email: "player@example.com",
    emailVerified: true,
    displayName: "Player One",
  });
});

test("rejects unverified Google identity", () => {
  assert.throws(() =>
    normalizeGoogleIdentity({
      sub: "google-subject-1",
      email: "player@example.com",
      email_verified: false,
    }),
  );
});

test("logs in existing user by Google subject", async () => {
  const existingUser: GoogleAuthUser = {
    id: "user-1",
    email: "player@example.com",
    displayName: "Player One",
    role: "PLAYER",
    googleSubject: "google-subject-1",
  };
  const repository = createGoogleRepository([existingUser]);

  const user = await upsertGoogleUser(repository, googleIdentity());

  assert.deepEqual(user, existingUser);
  assert.equal(repository.users.size, 1);
});

test("links Google subject to existing email user", async () => {
  const repository = createGoogleRepository([
    {
      id: "user-1",
      email: "player@example.com",
      displayName: "Player One",
      role: "PLAYER",
      googleSubject: null,
    },
  ]);

  const user = await upsertGoogleUser(repository, googleIdentity());

  assert.equal(user.id, "user-1");
  assert.equal(user.googleSubject, "google-subject-1");
  assert.equal(repository.users.size, 1);
});

test("creates new Google user when no account exists", async () => {
  const repository = createGoogleRepository();

  const user = await upsertGoogleUser(repository, googleIdentity());

  assert.equal(user.email, "player@example.com");
  assert.equal(user.displayName, "Player One");
  assert.equal(user.role, "PLAYER");
  assert.equal(user.googleSubject, "google-subject-1");
  assert.equal(repository.users.size, 1);
});

test("rejects email linked to a different Google subject", async () => {
  const repository = createGoogleRepository([
    {
      id: "user-1",
      email: "player@example.com",
      displayName: "Player One",
      role: "PLAYER",
      googleSubject: "google-subject-2",
    },
  ]);

  await assert.rejects(() => upsertGoogleUser(repository, googleIdentity()));
});

test("selects post-login destination from kingdom state", () => {
  assert.equal(getPostLoginDestination({ kingdom: null }), "/create-kingdom");
  assert.equal(
    getPostLoginDestination({ kingdom: { id: "kingdom-1", name: "Test Kingdom" } }),
    "/dashboard",
  );
});

test("parses admin allowlist emails", () => {
  assert.deepEqual(
    Array.from(parseAdminEmails(" Admin@Example.COM, second@example.com , ")),
    ["admin@example.com", "second@example.com"],
  );
});

test("allows admin role before checking allowlist", () => {
  assert.equal(
    isAdminUser(
      { email: "player@example.com", role: "ADMIN" },
      "other-admin@example.com",
    ),
    true,
  );
});

test("allows configured admin email for non-admin role", () => {
  assert.equal(
    isAdminUser(
      { email: "Admin@Example.COM", role: "PLAYER" },
      "admin@example.com",
    ),
    true,
  );
});

test("rejects non-admin user outside allowlist", () => {
  assert.equal(
    isAdminUser(
      { email: "player@example.com", role: "PLAYER" },
      "admin@example.com",
    ),
    false,
  );
});
