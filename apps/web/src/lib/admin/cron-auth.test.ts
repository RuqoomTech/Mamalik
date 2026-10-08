import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedCronRequest } from "./cron-auth";

const secret = "a-very-long-cron-secret-value";

test("accepts the exact bearer secret", () => {
  assert.equal(isAuthorizedCronRequest(`Bearer ${secret}`, secret), true);
});

test("rejects missing, wrong, or malformed headers", () => {
  assert.equal(isAuthorizedCronRequest(null, secret), false);
  assert.equal(isAuthorizedCronRequest(secret, secret), false);
  assert.equal(isAuthorizedCronRequest(`Bearer ${secret}x`, secret), false);
  assert.equal(isAuthorizedCronRequest("Bearer wrong", secret), false);
});

test("fails closed when the secret is missing or too short", () => {
  assert.equal(isAuthorizedCronRequest("Bearer ", undefined), false);
  assert.equal(isAuthorizedCronRequest("Bearer short", "short"), false);
});
