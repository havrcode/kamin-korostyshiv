import assert from "node:assert/strict";
import test from "node:test";
import type {
  D1DatabaseLike,
  D1PreparedStatementLike,
} from "../server/leads/repository.ts";
import {
  claimOutboxBatch,
  OUTBOX_LOCK_TIMEOUT_MS,
  retryDelayMs,
} from "../server/notifications/outbox.ts";
import { processNotificationOutbox } from "../server/notifications/processor.ts";

type OutboxStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

interface MemoryRow {
  id: string;
  leadId: string;
  status: OutboxStatus;
  attemptCount: number;
  nextAttemptAt: number;
  lockedAt: number | null;
  sentAt: number | null;
  lastErrorCode: string | null;
  attachmentCount: number;
}

class MemoryStatement implements D1PreparedStatementLike {
  private values: unknown[] = [];
  readonly sql: string;
  private readonly database: MemoryOutboxDatabase;

  constructor(sql: string, database: MemoryOutboxDatabase) {
    this.sql = sql;
    this.database = database;
  }

  bind(...values: unknown[]): D1PreparedStatementLike {
    this.values = values;
    return this;
  }

  async all<T>(): Promise<{ results: T[] }> {
    if (this.sql.includes("FROM lead_attachments\n       WHERE lead_id")) {
      return {
        results: this.database.attachmentRows as T[],
      };
    }
    if (!this.sql.includes("FROM notification_outbox AS outbox")) {
      return { results: [] };
    }

    const [nowMs, staleBeforeMs, limit] = this.values as [number, number, number];
    const row = this.database.row;
    const eligible =
      (row.status === "PENDING" && row.nextAttemptAt <= nowMs) ||
      (row.status === "PROCESSING" &&
        row.lockedAt !== null &&
        row.lockedAt <= staleBeforeMs);
    if (!eligible || limit < 1) return { results: [] };

    return {
      results: [
        {
          id: row.id,
          lead_id: row.leadId,
          public_number: "KK-20260831-TEST0001",
          name: "Сергій <майстер>",
          phone_normalized: "+380660570987",
          category_snapshot: "Одинарні & подвійні",
          message: "Потрібно <швидко>",
          attachment_count: row.attachmentCount,
        } as T,
      ],
    };
  }

  async first<T>(): Promise<T | null> {
    const row = this.database.row;

    if (this.sql.includes("SET status = 'PROCESSING'")) {
      const [lockedAt, , id, nowMs, staleBeforeMs] = this.values as [
        number,
        number,
        string,
        number,
        number,
      ];
      const eligible =
        id === row.id &&
        ((row.status === "PENDING" && row.nextAttemptAt <= nowMs) ||
          (row.status === "PROCESSING" &&
            row.lockedAt !== null &&
            row.lockedAt <= staleBeforeMs));
      if (!eligible) return null;

      row.status = "PROCESSING";
      row.lockedAt = lockedAt;
      row.attemptCount += 1;
      return { attempt_count: row.attemptCount } as T;
    }

    if (this.sql.includes("SET status = 'SENT'")) {
      const [sentAt, , id, lockToken] = this.values as [number, number, string, number];
      if (!this.database.ownsLease(id, lockToken)) return null;
      row.status = "SENT";
      row.sentAt = sentAt;
      row.lockedAt = null;
      row.lastErrorCode = null;
      return { id } as T;
    }

    if (this.sql.includes("SET status = 'PENDING'")) {
      const [nextAttemptAt, errorCode, , id, lockToken] = this.values as [
        number,
        string,
        number,
        string,
        number,
      ];
      if (!this.database.ownsLease(id, lockToken)) return null;
      row.status = "PENDING";
      row.nextAttemptAt = nextAttemptAt;
      row.lockedAt = null;
      row.lastErrorCode = errorCode;
      return { id } as T;
    }

    if (this.sql.includes("SET status = 'FAILED'")) {
      const [errorCode, , id, lockToken] = this.values as [string, number, string, number];
      if (!this.database.ownsLease(id, lockToken)) return null;
      row.status = "FAILED";
      row.lockedAt = null;
      row.lastErrorCode = errorCode;
      return { id } as T;
    }

    return null;
  }
}

class MemoryOutboxDatabase implements D1DatabaseLike {
  readonly row: MemoryRow;
  readonly attachmentRows = [
    {
      id: "attachment-1",
      lead_id: "lead-1",
      storage_key: "lead-1/attachment-1.jpg",
      original_name: "приклад.jpg",
      mime: "image/jpeg",
      bytes: 11,
      created_at: 0,
    },
  ];

  constructor(overrides: Partial<MemoryRow> = {}) {
    this.row = {
      id: "outbox-1",
      leadId: "lead-1",
      status: "PENDING",
      attemptCount: 0,
      nextAttemptAt: 0,
      lockedAt: null,
      sentAt: null,
      lastErrorCode: null,
      attachmentCount: 0,
      ...overrides,
    };
  }

  ownsLease(id: string, lockToken: number): boolean {
    return (
      id === this.row.id &&
      this.row.status === "PROCESSING" &&
      this.row.lockedAt === lockToken
    );
  }

  prepare(query: string): D1PreparedStatementLike {
    return new MemoryStatement(query, this);
  }

  async batch(): Promise<unknown[]> {
    return [];
  }
}

const envSecrets = {
  TELEGRAM_BOT_TOKEN: "123456:TEST_SECRET",
  TELEGRAM_CHAT_ID: "-1001234567890",
};

test("uses a bounded exponential retry schedule", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 20].map(retryDelayMs),
    [60_000, 300_000, 900_000, 3_600_000, 21_600_000, 21_600_000, 21_600_000],
  );
});

test("an atomic conditional update lets only one concurrent worker claim an event", async () => {
  const database = new MemoryOutboxDatabase();
  const nowMs = Date.parse("2026-08-31T12:00:00.000Z");

  const [first, second] = await Promise.all([
    claimOutboxBatch(database, { nowMs }),
    claimOutboxBatch(database, { nowMs }),
  ]);

  assert.equal(first.length + second.length, 1);
  assert.equal(database.row.status, "PROCESSING");
  assert.equal(database.row.attemptCount, 1);
});

test("reclaims a stale PROCESSING lease after the timeout", async () => {
  const nowMs = Date.parse("2026-08-31T12:00:00.000Z");
  const database = new MemoryOutboxDatabase({
    status: "PROCESSING",
    attemptCount: 1,
    lockedAt: nowMs - OUTBOX_LOCK_TIMEOUT_MS - 1,
  });

  const events = await claimOutboxBatch(database, { nowMs });

  assert.equal(events.length, 1);
  assert.equal(events[0].attemptCount, 2);
  assert.equal(events[0].lockToken, nowMs);
});

test("marks a delivered Telegram event as SENT", async () => {
  const database = new MemoryOutboxDatabase();
  const now = new Date("2026-08-31T12:00:00.000Z");
  let sentBody = "";

  const result = await processNotificationOutbox(
    { DB: database, ...envSecrets },
    {
      now: () => now,
      fetcher: async (_input, init) => {
        sentBody = String(init?.body);
        return Response.json({ ok: true });
      },
    },
  );

  assert.deepEqual(result, {
    ok: true,
    claimed: 1,
    sent: 1,
    retried: 0,
    failed: 0,
    lostLease: 0,
  });
  assert.equal(database.row.status, "SENT");
  assert.equal(database.row.sentAt, now.getTime());
  assert.match(sentBody, /Сергій &lt;майстер&gt;/);
  assert.match(sentBody, /Одинарні &amp; подвійні/);
});

test("returns a temporary failure to PENDING and respects Telegram retry_after", async () => {
  const database = new MemoryOutboxDatabase();
  const now = new Date("2026-08-31T12:00:00.000Z");

  const result = await processNotificationOutbox(
    { DB: database, ...envSecrets },
    {
      now: () => now,
      fetcher: async () =>
        Response.json(
          { ok: false, parameters: { retry_after: 120 } },
          { status: 429 },
        ),
    },
  );

  assert.equal(result.retried, 1);
  assert.equal(database.row.status, "PENDING");
  assert.equal(database.row.nextAttemptAt, now.getTime() + 120_000);
  assert.equal(database.row.lastErrorCode, "TELEGRAM_RATE_LIMITED");
});

test("moves a retryable failure to terminal FAILED after the sixth attempt", async () => {
  const database = new MemoryOutboxDatabase({ attemptCount: 5 });
  const now = new Date("2026-08-31T12:00:00.000Z");

  const result = await processNotificationOutbox(
    { DB: database, ...envSecrets },
    {
      now: () => now,
      fetcher: async () => new Response(null, { status: 503 }),
    },
  );

  assert.equal(result.failed, 1);
  assert.equal(database.row.attemptCount, 6);
  assert.equal(database.row.status, "FAILED");
  assert.equal(database.row.lastErrorCode, "TELEGRAM_UNAVAILABLE");
});

test("does not claim personal data when notification bindings are missing", async () => {
  const database = new MemoryOutboxDatabase();
  const result = await processNotificationOutbox({ DB: database });

  assert.equal(result.ok, false);
  assert.equal(result.code, "NOTIFICATION_SERVICE_NOT_CONFIGURED");
  assert.equal(database.row.status, "PENDING");
  assert.equal(database.row.attemptCount, 0);
});

test("keeps attachment files private when Telegram attachment delivery is disabled", async () => {
  const database = new MemoryOutboxDatabase({ attachmentCount: 1 });
  let fetchCount = 0;
  let bucketReads = 0;

  const result = await processNotificationOutbox(
    {
      DB: database,
      ...envSecrets,
      TELEGRAM_SEND_ATTACHMENTS: "false",
      LEAD_ATTACHMENTS: {
        async put() {},
        async get() {
          bucketReads += 1;
          return null;
        },
        async delete() {},
      },
    },
    {
      fetcher: async () => {
        fetchCount += 1;
        return Response.json({ ok: true });
      },
    },
  );

  assert.equal(result.sent, 1);
  assert.equal(fetchCount, 1);
  assert.equal(bucketReads, 0);
});

test("sends attachment files only when the Telegram flag is explicitly enabled", async () => {
  const database = new MemoryOutboxDatabase({ attachmentCount: 1 });
  let fetchCount = 0;
  let sentDocument: File | undefined;

  const result = await processNotificationOutbox(
    {
      DB: database,
      ...envSecrets,
      TELEGRAM_SEND_ATTACHMENTS: "true",
      LEAD_ATTACHMENTS: {
        async put() {},
        async get() {
          return { body: new Response("image-bytes").body };
        },
        async delete() {},
      },
    },
    {
      fetcher: async (_input, init) => {
        fetchCount += 1;
        if (init?.body instanceof FormData) {
          sentDocument = init.body.get("document") as File;
        }
        return Response.json({ ok: true });
      },
    },
  );

  assert.equal(result.sent, 1);
  assert.equal(fetchCount, 2);
  assert.ok(sentDocument);
  assert.equal(sentDocument.name, "приклад.jpg");
  assert.equal(database.row.status, "SENT");
});

test("fails safely when attachment delivery is enabled without private R2", async () => {
  const database = new MemoryOutboxDatabase({ attachmentCount: 1 });
  const result = await processNotificationOutbox(
    { DB: database, ...envSecrets, TELEGRAM_SEND_ATTACHMENTS: "true" },
    { fetcher: async () => Response.json({ ok: true }) },
  );

  assert.equal(result.failed, 1);
  assert.equal(database.row.status, "FAILED");
  assert.equal(database.row.lastErrorCode, "TELEGRAM_ATTACHMENTS_NOT_CONFIGURED");
});
