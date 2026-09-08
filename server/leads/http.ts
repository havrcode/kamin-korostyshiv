import { createLeadWithOutbox, type D1DatabaseLike } from "./repository.ts";
import { validateLeadInput } from "./validation.ts";
import { verifyTurnstile, type TurnstileFetchLike } from "../security/turnstile.ts";
import {
  detectLeadAttachmentMime,
  leadAttachmentExtension,
  MAX_LEAD_ATTACHMENT_BYTES,
  MAX_LEAD_ATTACHMENTS,
  MAX_LEAD_MULTIPART_BYTES,
  normalizeLeadAttachmentMime,
  sanitizeLeadAttachmentName,
  type LeadAttachmentBucketLike,
  type LeadAttachmentInput,
} from "./attachments.ts";

const MAX_LEAD_BODY_BYTES = 16 * 1024;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

interface RateLimitResult {
  success: boolean;
}

export interface LeadRateLimiterLike {
  limit(options: { key: string }): Promise<RateLimitResult>;
}

export interface LeadWorkerEnv {
  DB?: D1DatabaseLike;
  LEAD_RATE_LIMITER?: LeadRateLimiterLike;
  LEAD_ATTACHMENTS?: LeadAttachmentBucketLike;
  TURNSTILE_SECRET_KEY?: string;
}

export interface LeadHandlerOptions {
  turnstileFetcher?: TurnstileFetchLike;
}

type BodyReadResult =
  | { ok: true; value: unknown; files: Blob[] }
  | { ok: false; status: number; code: string; message: string };

class LeadAttachmentError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function jsonResponse(
  body: unknown,
  status: number,
  requestId: string,
  extraHeaders: HeadersInit = {},
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": requestId,
      ...extraHeaders,
    },
  });
}

async function readLimitedJson(request: Request): Promise<BodyReadResult> {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_LEAD_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "BODY_TOO_LARGE",
      message: "Заявка завелика.",
    };
  }

  if (!request.body) {
    return { ok: false, status: 400, code: "EMPTY_BODY", message: "Порожня заявка." };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_LEAD_BODY_BYTES) {
      await reader.cancel();
      return {
        ok: false,
        status: 413,
        code: "BODY_TOO_LARGE",
        message: "Заявка завелика.",
      };
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  try {
    return { ok: true, value: JSON.parse(text), files: [] };
  } catch {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      message: "Некоректний формат JSON.",
    };
  }
}

function formString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function formBoolean(form: FormData, name: string): boolean {
  return ["1", "true", "yes", "on"].includes(formString(form, name).trim().toLowerCase());
}

async function readLimitedMultipart(request: Request): Promise<BodyReadResult> {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_LEAD_MULTIPART_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "BODY_TOO_LARGE",
      message: "Заявка завелика.",
    };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, status: 400, code: "INVALID_MULTIPART", message: "Некоректний формат заявки." };
  }

  const entries = form.getAll("attachments");
  const rawFiles = entries.filter((entry): entry is File => entry instanceof File);
  const files = rawFiles.filter((file) => file.size > 0);
  if (rawFiles.length > MAX_LEAD_ATTACHMENTS) {
    return {
      ok: false,
      status: 422,
      code: "TOO_MANY_ATTACHMENTS",
      message: "Додайте не більше трьох зображень.",
    };
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (files.some((file) => file.size > MAX_LEAD_ATTACHMENT_BYTES) || totalBytes > MAX_LEAD_MULTIPART_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "ATTACHMENT_TOO_LARGE",
      message: "Кожне зображення має бути до 6 МБ, а всі разом — до 18 МБ.",
    };
  }

  return {
    ok: true,
    files,
    value: {
      name: formString(form, "name"),
      phone: formString(form, "phone"),
      categoryId: formString(form, "categoryId"),
      productId: formString(form, "productId"),
      categorySnapshot: formString(form, "categorySnapshot"),
      message: formString(form, "message"),
      consentAccepted: formBoolean(form, "consentAccepted"),
      website: formString(form, "website"),
      turnstileToken: formString(form, "turnstileToken") || formString(form, "cf-turnstile-response"),
    },
  };
}

function fileName(file: Blob): string {
  const value = (file as Blob & { name?: unknown }).name;
  return typeof value === "string" ? value : "";
}

type PreparedLeadAttachment = {
  input: LeadAttachmentInput;
  bytes: ArrayBuffer;
};

async function prepareLeadAttachments(files: Blob[]): Promise<PreparedLeadAttachment[]> {
  const prepared: PreparedLeadAttachment[] = [];
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const detectedMime = detectLeadAttachmentMime(new Uint8Array(bytes));
    const declaredMime = file.type ? normalizeLeadAttachmentMime(file.type) : null;
    if (!detectedMime || (file.type && !declaredMime) || (declaredMime && declaredMime !== detectedMime)) {
      throw new LeadAttachmentError("ATTACHMENT_FORMAT_NOT_ALLOWED", 415);
    }

    const id = crypto.randomUUID();
    prepared.push({
      bytes,
      input: {
        id,
        storageKey: `leads/${id}/original.${leadAttachmentExtension(detectedMime)}`,
        originalName: sanitizeLeadAttachmentName(fileName(file), detectedMime),
        mime: detectedMime,
        bytes: bytes.byteLength,
      },
    });
  }
  return prepared;
}

async function storeLeadAttachments(
  bucket: LeadAttachmentBucketLike,
  files: Blob[],
): Promise<LeadAttachmentInput[]> {
  const prepared = await prepareLeadAttachments(files);
  const stored: PreparedLeadAttachment[] = [];
  try {
    for (const attachment of prepared) {
      await bucket.put(attachment.input.storageKey, attachment.bytes, {
        httpMetadata: { contentType: attachment.input.mime, cacheControl: "private, no-store" },
        customMetadata: { attachmentId: attachment.input.id },
      });
      stored.push(attachment);
    }
    return stored.map(({ input }) => input);
  } catch {
    await Promise.allSettled(stored.map(({ input }) => bucket.delete(input.storageKey)));
    throw new LeadAttachmentError("ATTACHMENT_SAVE_FAILED", 500);
  }
}

async function deleteLeadAttachments(
  bucket: LeadAttachmentBucketLike | undefined,
  attachments: LeadAttachmentInput[],
): Promise<void> {
  if (!bucket || attachments.length === 0) return;
  await Promise.allSettled(attachments.map((attachment) => bucket.delete(attachment.storageKey)));
}

function readSourceUrl(request: Request): string | null {
  const referer = request.headers.get("Referer");
  if (!referer) return null;

  try {
    const url = new URL(referer);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return null;
  }
}

export async function handleLeadApiRequest(
  request: Request,
  env: LeadWorkerEnv,
  options: LeadHandlerOptions = {},
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  if (url.pathname !== "/api/v1/leads") {
    return jsonResponse({ ok: false, error: { code: "NOT_FOUND" } }, 404, requestId);
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { ok: false, error: { code: "METHOD_NOT_ALLOWED" } },
      405,
      requestId,
      { Allow: "POST" },
    );
  }

  const contentType = request.headers
    .get("Content-Type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json" && contentType !== "multipart/form-data") {
    return jsonResponse(
      { ok: false, error: { code: "UNSUPPORTED_MEDIA_TYPE" } },
      415,
      requestId,
    );
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_IDEMPOTENCY_KEY",
          message: "Потрібен коректний ключ повтору запиту.",
        },
      },
      400,
      requestId,
    );
  }

  if (!env.DB || !env.LEAD_RATE_LIMITER || !env.TURNSTILE_SECRET_KEY) {
    return jsonResponse(
      { ok: false, error: { code: "SERVICE_NOT_CONFIGURED" } },
      503,
      requestId,
      { "Retry-After": "300" },
    );
  }

  const body = contentType === "multipart/form-data"
    ? await readLimitedMultipart(request)
    : await readLimitedJson(request);
  if (!body.ok) {
    return jsonResponse(
      { ok: false, error: { code: body.code, message: body.message } },
      body.status,
      requestId,
    );
  }

  const validated = validateLeadInput(body.value);
  if (!validated.ok) {
    return jsonResponse(
      { ok: false, error: { code: "VALIDATION_FAILED", fields: validated.errors } },
      422,
      requestId,
    );
  }

  const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";

  let rateLimit: RateLimitResult;
  try {
    rateLimit = await env.LEAD_RATE_LIMITER.limit({ key: `lead:${clientIp}` });
  } catch {
    return jsonResponse(
      { ok: false, error: { code: "RATE_LIMIT_UNAVAILABLE" } },
      503,
      requestId,
      { "Retry-After": "60" },
    );
  }

  if (!rateLimit.success) {
    return jsonResponse(
      { ok: false, error: { code: "RATE_LIMITED" } },
      429,
      requestId,
      { "Retry-After": "120" },
    );
  }

  const turnstile = await verifyTurnstile(
    {
      secret: env.TURNSTILE_SECRET_KEY,
      token: validated.value.turnstileToken,
      remoteIp: clientIp === "unknown" ? null : clientIp,
      idempotencyKey,
    },
    options.turnstileFetcher,
  );
  if (!turnstile.ok) {
    return jsonResponse(
      { ok: false, error: { code: turnstile.code } },
      turnstile.code === "TURNSTILE_REJECTED" ? 422 : 503,
      requestId,
      turnstile.code === "TURNSTILE_UNAVAILABLE" ? { "Retry-After": "60" } : {},
    );
  }

  let attachments: LeadAttachmentInput[] = [];
  try {
    if (body.files.length > 0) {
      if (!env.LEAD_ATTACHMENTS) {
        return jsonResponse({ ok: false, error: { code: "ATTACHMENTS_NOT_CONFIGURED" } }, 503, requestId, { "Retry-After": "300" });
      }
      attachments = await storeLeadAttachments(env.LEAD_ATTACHMENTS, body.files);
    }

    const persisted = await createLeadWithOutbox(env.DB, {
      idempotencyKey,
      lead: validated.value,
      sourceUrl: readSourceUrl(request),
      attachments,
    });

    if (persisted.replayed) await deleteLeadAttachments(env.LEAD_ATTACHMENTS, attachments);

    return jsonResponse(
      {
        ok: true,
        lead: { publicNumber: persisted.publicNumber },
        replayed: persisted.replayed,
      },
      persisted.replayed ? 200 : 201,
      requestId,
    );
  } catch (error) {
    await deleteLeadAttachments(env.LEAD_ATTACHMENTS, attachments);
    if (error instanceof LeadAttachmentError) {
      return jsonResponse({ ok: false, error: { code: error.code } }, error.status, requestId);
    }
    console.error("lead_persistence_failed", {
      requestId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonResponse(
      { ok: false, error: { code: "PERSISTENCE_FAILED" } },
      500,
      requestId,
    );
  }
}
