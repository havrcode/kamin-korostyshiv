import assert from "node:assert/strict";
import test from "node:test";
import { handlePublicProductImagesRequest, detectImageMime } from "../server/admin/media.ts";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../server/leads/repository.ts";

class FakeStatement implements D1PreparedStatementLike {
  private readonly rows: Record<string, unknown>[];

  constructor(rows: Record<string, unknown>[]) {
    this.rows = rows;
  }

  bind(...values: unknown[]): D1PreparedStatementLike {
    void values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return (this.rows[0] as T | undefined) ?? null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    return { results: this.rows as T[] };
  }
}

class FakeDatabase implements D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike {
    if (query.includes("FROM product_images")) {
      return new FakeStatement([{
        public_url: "https://media.example.com/products/prod-table-bench-1/image.webp",
        product_id: "prod-table-bench-1",
        alt: "Стіл з лавкою № 1",
        sort_order: 0,
        width: 1536,
        height: 1024,
      }]);
    }
    return new FakeStatement([]);
  }

  async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
    void statements;
    return [];
  }
}

test("detects supported image signatures instead of trusting a filename", () => {
  assert.equal(detectImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectImageMime(new Uint8Array([0xff, 0xd8, 0xff])), "image/jpeg");
  assert.equal(detectImageMime(new TextEncoder().encode("RIFFxxxxWEBP")), "image/webp");
  assert.equal(detectImageMime(new TextEncoder().encode("not-an-image")), null);
});

test("public product media exposes only published catalog product IDs", async () => {
  const response = await handlePublicProductImagesRequest(
    new Request("https://example.com/api/v1/catalog/product-images"),
    { DB: new FakeDatabase() },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    images: [{
      product_id: "prod-table-bench-1",
      public_url: "https://media.example.com/products/prod-table-bench-1/image.webp",
      alt: "Стіл з лавкою № 1",
      sort_order: 0,
      width: 1536,
      height: 1024,
    }],
  });

  const unknown = await handlePublicProductImagesRequest(
    new Request("https://example.com/api/v1/catalog/product-images?productId=prod-invented"),
    { DB: new FakeDatabase() },
  );
  assert.equal(unknown.status, 404);
});
