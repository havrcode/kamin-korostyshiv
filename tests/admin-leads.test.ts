import assert from "node:assert/strict";
import test from "node:test";
import { handleAdminApiRequest } from "../server/admin/leads.ts";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../server/leads/repository.ts";

function base64Url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function signedAccessToken() {
  const keys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const header = base64Url(JSON.stringify({ alg: "RS256", kid: "test-key" }));
  const payload = base64Url(JSON.stringify({ aud: ["app-aud"], email: "owner@example.com", exp: 2_000_000_000 }));
  const signature = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keys.privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  ));
  return {
    token: `${header}.${payload}.${base64Url(signature)}`,
    jwk: { ...publicJwk, kid: "test-key", alg: "RS256", use: "sig" },
  };
}

const lead = {
  id: "11111111-1111-4111-8111-111111111111",
  public_number: "KK-20260908-TEST0001",
  name: "Сергій",
  phone_normalized: "+380660570987",
  category_id: "vazy",
  product_id: "vaza-5",
  category_snapshot: "Вази: Ваза № 5",
  message: "Потрібен такий виріб",
  status: "NEW",
  created_at: 1_000,
  updated_at: 1_000,
};

const attachment = {
  id: "22222222-2222-4222-8222-222222222222",
  lead_id: lead.id,
  storage_key: "leads/attachment/original.png",
  original_name: "приклад.png",
  mime: "image/png" as const,
  bytes: 8,
  created_at: 1_001,
};

class FakeStatement implements D1PreparedStatementLike {
  private readonly query: string;

  constructor(query: string) {
    this.query = query;
  }

  bind(...values: unknown[]): D1PreparedStatementLike {
    void values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return this.query.includes("FROM lead_attachments") ? attachment as T : null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    if (this.query.includes("FROM leads")) return { results: [lead as T] };
    if (this.query.includes("FROM lead_attachments")) return { results: [attachment as T] };
    return { results: [] };
  }
}

class FakeDatabase implements D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike {
    return new FakeStatement(query);
  }

  async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
    void statements;
    return [];
  }
}

function env(database: FakeDatabase, body: ReadableStream<Uint8Array>) {
  return {
    DB: database,
    CF_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
    CF_ACCESS_AUD: "app-aud",
    ADMIN_EMAILS: "owner@example.com",
    LEAD_ATTACHMENTS: {
      async put() {},
      async get() { return { body }; },
      async delete() {},
    },
  };
}

test("admin lists attachment metadata and downloads it after Access verification", async () => {
  const signed = await signedAccessToken();
  const database = new FakeDatabase();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
      controller.close();
    },
  });
  const options = { accessFetcher: async (url: string | URL | Request, init?: RequestInit) => {
    void url;
    void init;
    return Response.json({ keys: [signed.jwk] });
  } };
  const headers = { "Cf-Access-Jwt-Assertion": signed.token };

  const list = await handleAdminApiRequest(
    new Request("https://example.com/api/v1/admin/leads", { headers }),
    env(database, body),
    options,
  );
  const listBody = await list.json() as { leads: Array<{ attachments: Array<{ download_url: string }> }> };
  assert.equal(list.status, 200);
  assert.equal(listBody.leads[0].attachments[0].download_url, `/api/v1/admin/leads/${lead.id}/attachments/${attachment.id}`);

  const download = await handleAdminApiRequest(
    new Request(`https://example.com${listBody.leads[0].attachments[0].download_url}`, { headers }),
    env(database, body),
    options,
  );
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("Content-Type"), "image/png");
  assert.match(download.headers.get("Content-Disposition") ?? "", /filename="_______.png"; filename\*=UTF-8''%D0%BF%D1%80%D0%B8%D0%BA%D0%BB%D0%B0%D0%B4.png/);
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
});
