import assert from "node:assert/strict";
import test from "node:test";
import {
  createLeadWithOutbox,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
} from "../server/leads/repository.ts";
import {
  LEAD_CONSENT_VERSION,
  type ValidatedLeadInput,
} from "../server/leads/validation.ts";

class FakeStatement implements D1PreparedStatementLike {
  bindings: unknown[] = [];
  readonly sql: string;
  private readonly database: FakeDatabase;

  constructor(sql: string, database: FakeDatabase) {
    this.sql = sql;
    this.database = database;
  }

  bind(...values: unknown[]): D1PreparedStatementLike {
    this.bindings = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return (this.database.firstResults.shift() ?? null) as T | null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    return { results: [] };
  }
}

class FakeDatabase implements D1DatabaseLike {
  readonly prepared: FakeStatement[] = [];
  readonly batches: FakeStatement[][] = [];
  firstResults: unknown[] = [];
  batchErrors: Error[] = [];

  prepare(query: string): D1PreparedStatementLike {
    const statement = new FakeStatement(query, this);
    this.prepared.push(statement);
    return statement;
  }

  async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
    this.batches.push(statements as FakeStatement[]);
    const error = this.batchErrors.shift();
    if (error) throw error;
    return statements.map(() => ({ success: true }));
  }
}

const validLead = {
  name: "Сергій",
  phoneNormalized: "+380660570987",
  categoryId: "single-monuments",
  categorySnapshot: "Одинарні пам’ятники",
  message: "Потрібна консультація",
  consentVersion: LEAD_CONSENT_VERSION,
} satisfies ValidatedLeadInput;

test("creates a lead and its Telegram outbox event in one D1 batch", async () => {
  const database = new FakeDatabase();
  database.firstResults = [null];
  const ids = ["lead-id", "outbox-id"];
  const now = new Date("2026-08-31T12:00:00.000Z");

  const result = await createLeadWithOutbox(
    database,
    {
      idempotencyKey: "request-key-000001",
      lead: validLead,
      sourceUrl: "https://example.com/catalog",
    },
    {
      now: () => now,
      createId: () => ids.shift() ?? "unexpected-id",
      createPublicNumber: () => "KK-20260831-ABC12345",
    },
  );

  assert.deepEqual(result, {
    publicNumber: "KK-20260831-ABC12345",
    replayed: false,
  });
  assert.equal(database.batches.length, 1);
  assert.equal(database.batches[0].length, 2);

  const [leadStatement, outboxStatement] = database.batches[0];
  assert.match(leadStatement.sql, /INSERT INTO leads/);
  assert.match(outboxStatement.sql, /INSERT INTO notification_outbox/);
  assert.deepEqual(leadStatement.bindings, [
    "lead-id",
    "KK-20260831-ABC12345",
    "request-key-000001",
    "Сергій",
    "+380660570987",
    "single-monuments",
    "Одинарні пам’ятники",
    "Потрібна консультація",
    LEAD_CONSENT_VERSION,
    "https://example.com/catalog",
    now.getTime(),
    now.getTime(),
  ]);
  assert.deepEqual(outboxStatement.bindings, [
    "outbox-id",
    "lead-id",
    now.getTime(),
    now.getTime(),
    now.getTime(),
  ]);
});

test("returns the existing public number for an idempotent replay", async () => {
  const database = new FakeDatabase();
  database.firstResults = [{ public_number: "KK-EXISTING" }];

  const result = await createLeadWithOutbox(database, {
    idempotencyKey: "request-key-000002",
    lead: validLead,
    sourceUrl: null,
  });

  assert.deepEqual(result, { publicNumber: "KK-EXISTING", replayed: true });
  assert.equal(database.batches.length, 0);
});

test("recovers when a concurrent request wins the idempotency race", async () => {
  const database = new FakeDatabase();
  database.firstResults = [null, { public_number: "KK-RACE-WINNER" }];
  database.batchErrors = [
    new Error("D1_ERROR: UNIQUE constraint failed: leads.idempotency_key"),
  ];

  const result = await createLeadWithOutbox(database, {
    idempotencyKey: "request-key-000003",
    lead: validLead,
    sourceUrl: null,
  });

  assert.deepEqual(result, {
    publicNumber: "KK-RACE-WINNER",
    replayed: true,
  });
  assert.equal(database.batches.length, 1);
});
