import assert from "node:assert/strict";
import test from "node:test";
import { shouldProcessOutbox } from "../worker/index.ts";

test("starts Telegram processing only after a successful lead request", () => {
  assert.equal(shouldProcessOutbox("/api/v1/leads", 201), true);
  assert.equal(shouldProcessOutbox("/api/v1/leads", 200), true);
  assert.equal(shouldProcessOutbox("/api/v1/leads", 422), false);
  assert.equal(shouldProcessOutbox("/api/v1/admin/leads", 200), false);
});
