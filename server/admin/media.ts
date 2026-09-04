import { isPublishedProductId } from "../../app/data/catalog.ts";
import type { D1DatabaseLike } from "../leads/repository.ts";
import { verifyAdminAccess, type AdminAuthEnv } from "./auth.ts";
import type { TurnstileFetchLike } from "../security/turnstile.ts";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_ACTIVE_IMAGES = 5;
const GENERATED_WIDTH = 1536;
const GENERATED_HEIGHT = 1024;
const WEBP_QUALITY = 86;

type R2PutOptionsLike = {
  httpMetadata?: { contentType?: string; cacheControl?: string };
  customMetadata?: Record<string, string>;
};

export interface ProductMediaBucketLike {
  put(key: string, value: ArrayBuffer, options?: R2PutOptionsLike): Promise<unknown>;
  delete(key: string): Promise<void>;
}

type ImageTransformOptions = {
  width: number;
  height: number;
  fit: "aspect-crop";
  gravity: { x: number; y: number };
};

type ImageOutputLike = {
  response(options?: { headers?: HeadersInit }): Response;
};

type ImagePipelineLike = {
  transform(options: ImageTransformOptions): ImagePipelineLike;
  output(options: { format: "image/webp"; quality: number }): Promise<ImageOutputLike>;
};

type ImageInfoLike = { width?: number; height?: number };

export interface ProductImagesBindingLike {
  input(value: ArrayBuffer): ImagePipelineLike;
  info?(value: ArrayBuffer): Promise<ImageInfoLike>;
}

export interface AdminMediaWorkerEnv extends AdminAuthEnv {
  DB?: D1DatabaseLike;
  PRODUCT_MEDIA_PRIVATE?: ProductMediaBucketLike;
  PRODUCT_MEDIA_PUBLIC?: ProductMediaBucketLike;
  IMAGES?: ProductImagesBindingLike;
  MEDIA_PUBLIC_BASE_URL?: string;
}

export interface AdminMediaHandlerOptions {
  accessFetcher?: TurnstileFetchLike;
}

type StoredImageRow = {
  id: string;
  product_id: string;
  original_key: string;
  webp_key: string;
  public_url: string;
  alt: string | null;
  sort_order: number;
  published: number;
  width: number;
  height: number;
  original_mime: string;
  original_bytes: number;
  checksum_sha256: string | null;
  created_by: string;
  created_at: number;
  updated_at: number;
};

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function publicJson(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", "X-Content-Type-Options": "nosniff" },
  });
}

function error(code: string, status: number): Response {
  return json({ ok: false, error: { code } }, status);
}

function isSameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === url.origin;
}

function normalizeMime(value: string): string | null {
  const mime = value.trim().toLowerCase();
  if (mime === "image/jpg") return "image/jpeg";
  return ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(mime)
    ? mime
    : null;
}

function textAt(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectImageMime(bytes: Uint8Array): string | null {
  const png = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (png) return "image/png";

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (bytes.length >= 12 && textAt(bytes, 0, 4) === "RIFF" && textAt(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }

  if (bytes.length >= 12 && textAt(bytes, 4, 4) === "ftyp") {
    const brands = [textAt(bytes, 8, 4), textAt(bytes, 16, 4)];
    if (brands.some((brand) => ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand))) {
      return "image/heic";
    }
  }

  return null;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "heic";
}

function parseBoolean(value: FormDataEntryValue | null, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseFocus(value: FormDataEntryValue | null): number {
  const parsed = typeof value === "string" ? Number(value) : 50;
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) / 100 : 0.5;
}

function publicUrl(baseUrl: string, key: string): string | null {
  try {
    const base = new URL(baseUrl);
    if (!["http:", "https:"].includes(base.protocol)) return null;
    const path = key.split("/").map((part) => encodeURIComponent(part)).join("/");
    return `${base.origin}${base.pathname.replace(/\/+$/, "")}/${path}`;
  } catch {
    return null;
  }
}

function asPublicImage(row: StoredImageRow) {
  return {
    id: row.id,
    product_id: row.product_id,
    public_url: row.public_url,
    alt: row.alt,
    sort_order: row.sort_order,
    published: row.published === 1,
    width: row.width,
    height: row.height,
    original_mime: row.original_mime,
    original_bytes: row.original_bytes,
    checksum_sha256: row.checksum_sha256,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function transformToWebp(
  images: ProductImagesBindingLike,
  bytes: ArrayBuffer,
  focusX: number,
  focusY: number,
): Promise<{ bytes: ArrayBuffer; width: number; height: number }> {
  const output = await images
    .input(bytes)
    .transform({
      width: GENERATED_WIDTH,
      height: GENERATED_HEIGHT,
      fit: "aspect-crop",
      gravity: { x: focusX, y: focusY },
    })
    .output({ format: "image/webp", quality: WEBP_QUALITY });
  const response = output.response({ headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
  const transformed = await response.arrayBuffer();
  const info = images.info ? await images.info(transformed) : null;
  return {
    bytes: transformed,
    width: Number.isInteger(info?.width) ? Number(info?.width) : GENERATED_WIDTH,
    height: Number.isInteger(info?.height) ? Number(info?.height) : GENERATED_HEIGHT,
  };
}

async function activeImageCount(database: D1DatabaseLike, productId: string): Promise<number> {
  const row = await database
    .prepare("SELECT COUNT(*) AS count FROM product_images WHERE product_id = ? AND deleted_at IS NULL")
    .bind(productId)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function findImage(database: D1DatabaseLike, imageId: string): Promise<StoredImageRow | null> {
  return database
    .prepare(
      `SELECT id, product_id, original_key, webp_key, public_url, alt, sort_order, published, width, height,
              original_mime, original_bytes, checksum_sha256, created_by, created_at, updated_at
       FROM product_images
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
    )
    .bind(imageId)
    .first<StoredImageRow>();
}

export async function handleAdminMediaRequest(
  request: Request,
  env: AdminMediaWorkerEnv,
  options: AdminMediaHandlerOptions = {},
): Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/v1/admin/product-images")) return error("NOT_FOUND", 404);
  if (!env.DB) return error("ADMIN_NOT_CONFIGURED", 503);

  const auth = await verifyAdminAccess(request, env, options.accessFetcher);
  if (!auth.ok) return error(auth.code, auth.status);
  if (!isSameOrigin(request, url)) return error("ORIGIN_NOT_ALLOWED", 403);

  if (url.pathname === "/api/v1/admin/product-images" && request.method === "GET") {
    const productId = url.searchParams.get("productId")?.trim() ?? "";
    if (!isPublishedProductId(productId)) return error("PRODUCT_NOT_FOUND", 404);
    const rows = await env.DB
      .prepare(
        `SELECT id, product_id, public_url, alt, sort_order, published, width, height,
                original_key, webp_key, original_mime, original_bytes, checksum_sha256, created_by, created_at, updated_at
         FROM product_images
         WHERE product_id = ? AND deleted_at IS NULL
         ORDER BY sort_order ASC, created_at ASC`,
      )
      .bind(productId)
      .all<StoredImageRow>();
    return json({ ok: true, images: rows.results.map(asPublicImage) }, 200);
  }

  if (url.pathname === "/api/v1/admin/product-images" && request.method === "POST") {
    const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
    if (declaredLength > MAX_UPLOAD_BYTES) return error("IMAGE_TOO_LARGE", 413);
    if (!env.PRODUCT_MEDIA_PRIVATE || !env.PRODUCT_MEDIA_PUBLIC || !env.IMAGES) {
      return error("MEDIA_NOT_CONFIGURED", 503);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return error("INVALID_MULTIPART", 400);
    }
    const productId = typeof form.get("productId") === "string" ? String(form.get("productId")).trim() : "";
    const file = form.get("file");
    if (!isPublishedProductId(productId)) return error("PRODUCT_NOT_FOUND", 404);
    if (!(file instanceof Blob)) return error("IMAGE_REQUIRED", 422);
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return error("IMAGE_TOO_LARGE", 413);

    const bytes = await file.arrayBuffer();
    const detectedMime = detectImageMime(new Uint8Array(bytes));
    const declaredType = file.type.trim();
    const declaredMime = normalizeMime(declaredType);
    if (!detectedMime || (declaredType && !declaredMime) || (declaredMime && detectedMime !== declaredMime)) {
      return error("IMAGE_FORMAT_NOT_ALLOWED", 415);
    }

    const replaceImageId = typeof form.get("replaceImageId") === "string" ? String(form.get("replaceImageId")).trim() : "";
    let replacement: StoredImageRow | null = null;
    try {
      replacement = replaceImageId ? await findImage(env.DB, replaceImageId) : null;
      if (replaceImageId && (!replacement || replacement.product_id !== productId)) return error("IMAGE_NOT_FOUND", 404);
      if (!replacement && await activeImageCount(env.DB, productId) >= MAX_ACTIVE_IMAGES) {
        return error("IMAGE_LIMIT_REACHED", 409);
      }
    } catch {
      return error("MEDIA_NOT_CONFIGURED", 503);
    }

    const baseUrl = env.MEDIA_PUBLIC_BASE_URL?.trim() ?? "";
    const id = replacement?.id ?? crypto.randomUUID();
    const storageId = crypto.randomUUID();
    const originalKey = `products/${productId}/${storageId}/original.${extensionForMime(detectedMime)}`;
    const webpKey = `products/${productId}/${storageId}/image.webp`;
    const imageUrl = publicUrl(baseUrl, webpKey);
    if (!imageUrl) return error("MEDIA_PUBLIC_URL_NOT_CONFIGURED", 503);
    if (!replacement && await activeImageCount(env.DB, productId) >= MAX_ACTIVE_IMAGES) {
      return error("IMAGE_LIMIT_REACHED", 409);
    }

    let transformed: { bytes: ArrayBuffer; width: number; height: number };
    try {
      transformed = await transformToWebp(env.IMAGES, bytes, parseFocus(form.get("focusX")), parseFocus(form.get("focusY")));
      await env.PRODUCT_MEDIA_PRIVATE.put(originalKey, bytes, {
        httpMetadata: { contentType: detectedMime, cacheControl: "private, no-store" },
        customMetadata: { productId, imageId: id },
      });
      await env.PRODUCT_MEDIA_PUBLIC.put(webpKey, transformed.bytes, {
        httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
        customMetadata: { productId, imageId: id },
      });

      const nextOrder = replacement ? null : await env.DB
        .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM product_images WHERE product_id = ? AND deleted_at IS NULL")
        .bind(productId)
        .first<{ next_order: number }>();
      const now = Date.now();
      const submittedAlt = form.get("alt");
      const alt = typeof submittedAlt === "string"
        ? String(submittedAlt).trim().slice(0, 160) || null
        : replacement?.alt ?? null;
      const published = form.get("published") !== null
        ? (parseBoolean(form.get("published"), false) ? 1 : 0)
        : replacement?.published ?? 0;
      const checksum = await sha256Hex(bytes);
      const mutation = replacement
        ? env.DB.prepare(
          `UPDATE product_images SET
             original_key = ?, webp_key = ?, public_url = ?, alt = ?, published = ?,
             width = ?, height = ?, original_mime = ?, original_bytes = ?, checksum_sha256 = ?,
             created_by = ?, updated_at = ?, deleted_at = NULL
           WHERE id = ? AND deleted_at IS NULL`,
        ).bind(
          originalKey, webpKey, imageUrl, alt, published, transformed.width, transformed.height,
          detectedMime, bytes.byteLength, checksum, auth.email, now, id,
        )
        : env.DB.prepare(
          `INSERT INTO product_images (
             id, product_id, original_key, webp_key, public_url, alt, sort_order, published,
             width, height, original_mime, original_bytes, checksum_sha256, created_by,
             created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        ).bind(
          id, productId, originalKey, webpKey, imageUrl, alt,
          Number(nextOrder?.next_order ?? 0), published, transformed.width, transformed.height,
          detectedMime, bytes.byteLength, checksum, auth.email, now, now,
        );
      const audit = env.DB.prepare(
        `INSERT INTO admin_audit_log (
           id, actor_email, action, entity_type, entity_id,
           before_snapshot, after_snapshot, created_at
         ) VALUES (?, ?, 'PRODUCT_IMAGE_CREATED', 'product_image', ?, NULL, ?, ?)`,
      ).bind(
        crypto.randomUUID(), auth.email, id,
        JSON.stringify({ productId, publicUrl: imageUrl, published, replaced: Boolean(replacement) }), now,
      );
      await env.DB.batch([mutation, audit]);
      if (replacement) {
        await Promise.allSettled([
          env.PRODUCT_MEDIA_PRIVATE.delete(replacement.original_key),
          env.PRODUCT_MEDIA_PUBLIC.delete(replacement.webp_key),
        ]);
      }
    } catch (caught) {
      await Promise.allSettled([
        env.PRODUCT_MEDIA_PRIVATE.delete(originalKey),
        env.PRODUCT_MEDIA_PUBLIC.delete(webpKey),
      ]);
      if (String(caught).includes("PRODUCT_IMAGE_LIMIT_REACHED")) return error("IMAGE_LIMIT_REACHED", 409);
      return error("IMAGE_SAVE_FAILED", 500);
    }

    const saved = await findImage(env.DB, id);
    return json({ ok: true, image: saved ? asPublicImage(saved) : null }, 201);
  }

  const match = url.pathname.match(/^\/api\/v1\/admin\/product-images\/([0-9a-f-]{16,64})$/i);
  if (!match) return error("NOT_FOUND", 404);
  const image = await findImage(env.DB, match[1]);
  if (!image) return error("IMAGE_NOT_FOUND", 404);

  if (request.method === "PATCH") {
    let body: { alt?: unknown; published?: unknown; sortOrder?: unknown };
    try {
      body = await request.json() as { alt?: unknown; published?: unknown; sortOrder?: unknown };
    } catch {
      return error("INVALID_JSON", 400);
    }
    const assignments: string[] = [];
    const values: unknown[] = [];
    if (typeof body.alt === "string") {
      assignments.push("alt = ?");
      values.push(body.alt.trim().slice(0, 160) || null);
    }
    if (typeof body.published === "boolean") {
      assignments.push("published = ?");
      values.push(body.published ? 1 : 0);
    }
    if (typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder) && body.sortOrder >= 0 && body.sortOrder < MAX_ACTIVE_IMAGES) {
      assignments.push("sort_order = ?");
      values.push(body.sortOrder);
    }
    if (assignments.length === 0) return error("NO_CHANGES", 422);
    const now = Date.now();
    values.push(now, match[1]);
    const update = env.DB.prepare(`UPDATE product_images SET ${assignments.join(", ")}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`).bind(...values);
    const audit = env.DB.prepare(
      `INSERT INTO admin_audit_log (
         id, actor_email, action, entity_type, entity_id,
         before_snapshot, after_snapshot, created_at
       ) VALUES (?, ?, 'PRODUCT_IMAGE_UPDATED', 'product_image', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), auth.email, match[1],
      JSON.stringify({ published: image.published, alt: image.alt, sortOrder: image.sort_order }),
      JSON.stringify(body), now,
    );
    await env.DB.batch([update, audit]);
    const updated = await findImage(env.DB, match[1]);
    return json({ ok: true, image: updated ? asPublicImage(updated) : null }, 200);
  }

  if (request.method === "DELETE") {
    const now = Date.now();
    const update = env.DB.prepare("UPDATE product_images SET published = 0, deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL").bind(now, now, match[1]);
    const audit = env.DB.prepare(
      `INSERT INTO admin_audit_log (
         id, actor_email, action, entity_type, entity_id,
         before_snapshot, after_snapshot, created_at
       ) VALUES (?, ?, 'PRODUCT_IMAGE_SOFT_DELETED', 'product_image', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), auth.email, match[1], JSON.stringify(asPublicImage(image)), JSON.stringify({ deletedAt: now }), now,
    );
    await env.DB.batch([update, audit]);
    return json({ ok: true }, 200);
  }

  return error("METHOD_NOT_ALLOWED", 405);
}

export async function handlePublicProductImagesRequest(
  request: Request,
  env: Pick<AdminMediaWorkerEnv, "DB">,
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/v1/catalog/product-images") return error("NOT_FOUND", 404);
  if (request.method !== "GET") return error("METHOD_NOT_ALLOWED", 405);
  if (!env.DB) return error("MEDIA_NOT_CONFIGURED", 503);

  const productId = url.searchParams.get("productId")?.trim() ?? "";
  if (productId && !isPublishedProductId(productId)) return error("PRODUCT_NOT_FOUND", 404);
  const statement = productId
    ? env.DB.prepare(
      `SELECT public_url, product_id, alt, sort_order, width, height
       FROM product_images
       WHERE product_id = ? AND published = 1 AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at ASC`,
    ).bind(productId)
    : env.DB.prepare(
      `SELECT public_url, product_id, alt, sort_order, width, height
       FROM product_images
       WHERE published = 1 AND deleted_at IS NULL
       ORDER BY product_id ASC, sort_order ASC, created_at ASC`,
    );
  const rows = await statement.all<{ public_url: string; product_id: string; alt: string | null; sort_order: number; width: number; height: number }>();
  return publicJson({
    ok: true,
    images: rows.results.map((row) => ({
      product_id: row.product_id,
      public_url: row.public_url,
      alt: row.alt,
      sort_order: row.sort_order,
      width: row.width,
      height: row.height,
    })),
  }, 200);
}
