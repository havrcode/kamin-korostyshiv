import type { TurnstileFetchLike } from "../security/turnstile.ts";

export interface AdminAuthEnv {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  ADMIN_EMAILS?: string;
}

export type AdminAuthResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 | 503; code: string };

type JwtHeader = { alg?: unknown; kid?: unknown };
type JwtPayload = { aud?: unknown; email?: unknown; exp?: unknown; sub?: unknown };

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function asArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
  } catch {
    return null;
  }
}

function normalizeTeamDomain(value: string): string | null {
  const candidate = value.startsWith("https://") ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function allowedAudience(payloadAud: unknown, expected: string): boolean {
  return payloadAud === expected || (Array.isArray(payloadAud) && payloadAud.includes(expected));
}

export async function verifyAdminAccess(
  request: Request,
  env: AdminAuthEnv,
  fetcher: TurnstileFetchLike = fetch,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<AdminAuthResult> {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN && normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN);
  const audience = env.CF_ACCESS_AUD?.trim();
  const allowedEmails = new Set(
    (env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
  );
  if (!teamDomain || !audience || allowedEmails.size === 0) {
    return { ok: false, status: 503, code: "ADMIN_AUTH_NOT_CONFIGURED" };
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (!token) return { ok: false, status: 401, code: "ACCESS_TOKEN_REQUIRED" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, status: 401, code: "ACCESS_TOKEN_INVALID" };

  const header = decodeJson<JwtHeader>(parts[0]);
  const payload = decodeJson<JwtPayload>(parts[1]);
  if (
    !header || header.alg !== "RS256" || typeof header.kid !== "string" ||
    !payload || typeof payload.email !== "string" || typeof payload.exp !== "number" ||
    payload.exp <= nowSeconds || !allowedAudience(payload.aud, audience)
  ) {
    return { ok: false, status: 401, code: "ACCESS_TOKEN_INVALID" };
  }

  try {
    const response = await fetcher(`${teamDomain}/cdn-cgi/access/certs`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { ok: false, status: 503, code: "ACCESS_CERTS_UNAVAILABLE" };
    const certs = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
    const jwk = certs.keys?.find((key) => key.kid === header.kid);
    if (!jwk) return { ok: false, status: 401, code: "ACCESS_TOKEN_INVALID" };
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      asArrayBuffer(decodeBase64Url(parts[2])),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return { ok: false, status: 401, code: "ACCESS_TOKEN_INVALID" };
  } catch {
    return { ok: false, status: 503, code: "ACCESS_CERTS_UNAVAILABLE" };
  }

  const email = payload.email.trim().toLowerCase();
  if (!allowedEmails.has(email)) return { ok: false, status: 403, code: "ADMIN_NOT_ALLOWED" };
  return { ok: true, email };
}
