import assert from "node:assert/strict";
import test from "node:test";
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

const TEST_SECRET = "test-session-secret-with-at-least-32-chars";

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
