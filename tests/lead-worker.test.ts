import assert from "node:assert/strict";
import test from "node:test";
import { handleLeadApiRequest } from "../server/leads/http.ts";
import type {
  D1DatabaseLike,
  D1PreparedStatementLike,
} from "../server/leads/repository.ts";

class ApiStatement implements D1PreparedStatementLike {
  bindings: unknown[] = [];
  readonly sql: string;
  private readonly database: ApiDatabase;

  constructor(sql: string, database: ApiDatabase) {
    this.sql = sql;
    this.database = database;
  }

  bind(...values: unknown[]): D1PreparedStatementLike {
    this.bindings = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return this.database.existingPublicNumber
      ? ({ public_number: this.database.existingPublicNumber } as T)
      : null;
  }
}

class ApiDatabase implements D1DatabaseLike {
  existingPublicNumber: string | null = null;
  batchCount = 0;

  prepare(query: string): D1PreparedStatementLike {
    return new ApiStatement(query, this);
  }

  async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
    this.batchCount += 1;
    return statements.map(() => ({ success: true }));
  }
}

function validRequest(headers: HeadersInit = {}): Request {
  return new Request("https://example.com/api/v1/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "request-key-123456",
      "CF-Connecting-IP": "203.0.113.10",
      Referer: "https://example.com/catalog?private=dropped",
      ...headers,
    },
    body: JSON.stringify({
      name: "Сергій",
      phone: "+38 (066) 057-09-87",
      categoryId: "single-monuments",
      categorySnapshot: "Одинарні пам’ятники",
      message: "Потрібна консультація",
      consentAccepted: true,
      website: "",
    }),
  });
}

test("accepts a valid lead only with D1 and rate-limit bindings", async () => {
  const database = new ApiDatabase();
  const rateKeys: string[] = [];

  const response = await handleLeadApiRequest(validRequest(), {
    DB: database,
    LEAD_RATE_LIMITER: {
      async limit({ key }) {
        rateKeys.push(key);
        return { success: true };
      },
    },
  });
  const body = (await response.json()) as {
    ok: boolean;
    lead: { publicNumber: string };
    replayed: boolean;
  };

  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.match(body.lead.publicNumber, /^KK-\d{8}-[A-F0-9]{8}$/);
  assert.equal(body.replayed, false);
  assert.deepEqual(rateKeys, ["lead:203.0.113.10"]);
  assert.equal(database.batchCount, 1);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.ok(response.headers.get("X-Request-Id"));
});

test("fails closed when server bindings are absent", async () => {
  const response = await handleLeadApiRequest(validRequest(), {});
  const body = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 503);
  assert.equal(body.error.code, "SERVICE_NOT_CONFIGURED");
  assert.equal(response.headers.get("Retry-After"), "300");
});

test("rejects an invalid idempotency key before reading the body", async () => {
  const response = await handleLeadApiRequest(
    validRequest({ "Idempotency-Key": "short" }),
    {},
  );
  const body = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_IDEMPOTENCY_KEY");
});

test("returns 429 without touching D1 when the rate limit is exceeded", async () => {
  const database = new ApiDatabase();
  const response = await handleLeadApiRequest(validRequest(), {
    DB: database,
    LEAD_RATE_LIMITER: {
      async limit() {
        return { success: false };
      },
    },
  });
  const body = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 429);
  assert.equal(body.error.code, "RATE_LIMITED");
  assert.equal(response.headers.get("Retry-After"), "120");
  assert.equal(database.batchCount, 0);
});

test("rejects a declared body larger than 16 KiB", async () => {
  const database = new ApiDatabase();
  const response = await handleLeadApiRequest(
    validRequest({ "Content-Length": String(17 * 1024) }),
    {
      DB: database,
      LEAD_RATE_LIMITER: { async limit() { return { success: true }; } },
    },
  );
  const body = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 413);
  assert.equal(body.error.code, "BODY_TOO_LARGE");
  assert.equal(database.batchCount, 0);
});
