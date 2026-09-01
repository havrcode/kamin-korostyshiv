import assert from "node:assert/strict";
import test from "node:test";
import {
  LEAD_CONSENT_VERSION,
  normalizeUkrainianPhone,
  validateLeadInput,
} from "../server/leads/validation.ts";

test("normalizes supported Ukrainian phone formats", () => {
  assert.equal(normalizeUkrainianPhone("+38 (066) 057-09-87"), "+380660570987");
  assert.equal(normalizeUkrainianPhone("0660570987"), "+380660570987");
  assert.equal(normalizeUkrainianPhone("660570987"), "+380660570987");
  assert.equal(normalizeUkrainianPhone("12345"), null);
});

test("returns a normalized safe lead contract", () => {
  const result = validateLeadInput({
    name: "  Сергій  ",
    phone: "+38 (066) 057-09-87",
    categoryId: "single-monuments",
    productId: "prod-single-vertical",
    categorySnapshot: "Одинарні пам’ятники",
    message: "  Потрібна консультація  ",
    consentAccepted: true,
    website: "",
    turnstileToken: "test-token-valid-123",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value, {
    name: "Сергій",
    phoneNormalized: "+380660570987",
    categoryId: "single-monuments",
    productId: "prod-single-vertical",
    categorySnapshot: "Одинарні пам’ятники",
    message: "Потрібна консультація",
    turnstileToken: "test-token-valid-123",
    consentVersion: LEAD_CONSENT_VERSION,
  });
});

test("rejects invalid fields and a filled honeypot", () => {
  const result = validateLeadInput({
    name: "A",
    phone: "123",
    categoryId: "BAD ID",
    productId: "BAD PRODUCT",
    categorySnapshot: "",
    message: "x".repeat(2001),
    consentAccepted: false,
    website: "https://spam.example",
    turnstileToken: "x",
  });

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.deepEqual(
    new Set(result.errors.map((error) => error.code)),
    new Set([
      "SPAM_DETECTED",
      "INVALID_NAME",
      "INVALID_PHONE",
      "INVALID_CATEGORY_ID",
      "INVALID_PRODUCT_ID",
      "INVALID_CATEGORY",
      "MESSAGE_TOO_LONG",
      "CONSENT_REQUIRED",
      "TURNSTILE_REQUIRED",
    ]),
  );
});
