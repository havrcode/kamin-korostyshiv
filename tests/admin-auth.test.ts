import assert from "node:assert/strict";
import test from "node:test";
import { verifyAdminAccess } from "../server/admin/auth.ts";

function base64Url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function signedAccessToken(email: string) {
  const keys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const header = base64Url(JSON.stringify({ alg: "RS256", kid: "test-key" }));
  const payload = base64Url(JSON.stringify({ aud: ["app-aud"], email, exp: 2_000_000_000 }));
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

test("fails closed when Cloudflare Access settings are absent", async () => {
  const result = await verifyAdminAccess(new Request("https://example.com/api/v1/admin/leads"), {});
  assert.deepEqual(result, { ok: false, status: 503, code: "ADMIN_AUTH_NOT_CONFIGURED" });
});

test("verifies the Access JWT signature, audience and email allowlist", async () => {
  const signed = await signedAccessToken("owner@example.com");
  const request = new Request("https://example.com/api/v1/admin/leads", {
    headers: { "Cf-Access-Jwt-Assertion": signed.token },
  });
  const result = await verifyAdminAccess(
    request,
    {
      CF_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
      CF_ACCESS_AUD: "app-aud",
      ADMIN_EMAILS: "owner@example.com",
    },
    async (url) => {
      assert.equal(String(url), "https://team.cloudflareaccess.com/cdn-cgi/access/certs");
      return Response.json({ keys: [signed.jwk] });
    },
    1_900_000_000,
  );
  assert.deepEqual(result, { ok: true, email: "owner@example.com" });
});

test("rejects a correctly signed JWT for an email outside the allowlist", async () => {
  const signed = await signedAccessToken("other@example.com");
  const result = await verifyAdminAccess(
    new Request("https://example.com/api/v1/admin/leads", { headers: { "Cf-Access-Jwt-Assertion": signed.token } }),
    { CF_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com", CF_ACCESS_AUD: "app-aud", ADMIN_EMAILS: "owner@example.com" },
    async () => Response.json({ keys: [signed.jwk] }),
    1_900_000_000,
  );
  assert.deepEqual(result, { ok: false, status: 403, code: "ADMIN_NOT_ALLOWED" });
});
