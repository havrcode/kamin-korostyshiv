export type TurnstileFetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface VerifyTurnstileInput {
  secret: string;
  token: string;
  remoteIp?: string | null;
  idempotencyKey?: string | null;
}

export type TurnstileResult =
  | { ok: true }
  | { ok: false; code: "TURNSTILE_REJECTED" | "TURNSTILE_UNAVAILABLE" };

export async function verifyTurnstile(
  input: VerifyTurnstileInput,
  fetcher: TurnstileFetchLike = fetch,
): Promise<TurnstileResult> {
  const form = new FormData();
  form.set("secret", input.secret);
  form.set("response", input.token);
  if (input.remoteIp) form.set("remoteip", input.remoteIp);
  if (input.idempotencyKey) form.set("idempotency_key", input.idempotencyKey);

  try {
    const response = await fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form, signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return { ok: false, code: "TURNSTILE_UNAVAILABLE" };
    const body = await response.json() as { success?: unknown };
    return body.success === true
      ? { ok: true }
      : { ok: false, code: "TURNSTILE_REJECTED" };
  } catch {
    return { ok: false, code: "TURNSTILE_UNAVAILABLE" };
  }
}
