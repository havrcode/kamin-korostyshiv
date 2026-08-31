import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.ts";

test("Cron delegates notification work to waitUntil", async () => {
  let backgroundTask: Promise<unknown> | undefined;

  worker.scheduled({}, {}, {
    waitUntil(promise) {
      backgroundTask = promise;
    },
  });

  assert.ok(backgroundTask);
  const result = await backgroundTask;
  assert.deepEqual(result, {
    ok: false,
    code: "NOTIFICATION_SERVICE_NOT_CONFIGURED",
    claimed: 0,
    sent: 0,
    retried: 0,
    failed: 0,
    lostLease: 0,
  });
});
