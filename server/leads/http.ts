import { createLeadWithOutbox, type D1DatabaseLike } from "./repository.ts";
import { validateLeadInput } from "./validation.ts";
import { verifyTurnstile, type TurnstileFetchLike } from "../security/turnstile.ts";

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
  TURNSTILE_SECRET_KEY?: string;
}

export interface LeadHandlerOptions {
  turnstileFetcher?: TurnstileFetchLike;
}

type BodyReadResult =
  | { ok: true; value: unknown }
  | { ok: false; status: number; code: string; message: string };

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
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      message: "Некоректний формат JSON.",
    };
  }
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
  if (contentType !== "application/json") {
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

  const body = await readLimitedJson(request);
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

  try {
    const persisted = await createLeadWithOutbox(env.DB, {
      idempotencyKey,
      lead: validated.value,
      sourceUrl: readSourceUrl(request),
    });

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
