import assert from "node:assert/strict";
import test from "node:test";
import { verifyTurnstile } from "../server/security/turnstile.ts";

test("accepts only an explicit successful Turnstile response", async () => {
  const sent: FormData[] = [];
  const result = await verifyTurnstile(
    { secret: "secret", token: "token", remoteIp: "203.0.113.10", idempotencyKey: "request-123456789" },
    async (_url, init) => {
      sent.push(init?.body as FormData);
      return Response.json({ success: true });
    },
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(sent[0]?.get("secret"), "secret");
  assert.equal(sent[0]?.get("response"), "token");
  assert.equal(sent[0]?.get("remoteip"), "203.0.113.10");
});

test("rejects a failed challenge and treats network errors as unavailable", async () => {
  assert.deepEqual(
    await verifyTurnstile(
      { secret: "secret", token: "bad-token" },
      async () => Response.json({ success: false }),
    ),
    { ok: false, code: "TURNSTILE_REJECTED" },
  );
  assert.deepEqual(
    await verifyTurnstile(
      { secret: "secret", token: "token" },
      async () => { throw new Error("offline"); },
    ),
    { ok: false, code: "TURNSTILE_UNAVAILABLE" },
  );
});
