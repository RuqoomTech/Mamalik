import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseEnvFile } from "./load-worker-env";

describe("worker env loader", () => {
  it("parses simple dotenv values without exposing secrets", () => {
    assert.deepEqual(
      parseEnvFile(`
        # ignored
        DATABASE_URL="postgresql://example"
        SESSION_SECRET=secret-value
        invalid-key=ignored
      `),
      {
        DATABASE_URL: "postgresql://example",
        SESSION_SECRET: "secret-value",
      },
    );
  });
});
