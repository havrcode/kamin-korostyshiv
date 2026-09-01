export const LEAD_CONSENT_VERSION = "lead-contact-v1";

export type LeadField =
  | "form"
  | "name"
  | "phone"
  | "categoryId"
  | "productId"
  | "categorySnapshot"
  | "message"
  | "consentAccepted"
  | "turnstileToken";

export interface LeadValidationError {
  field: LeadField;
  code: string;
  message: string;
}

export interface ValidatedLeadInput {
  name: string;
  phoneNormalized: string;
  categoryId: string | null;
  productId: string | null;
  categorySnapshot: string;
  message: string | null;
  turnstileToken: string;
  consentVersion: typeof LEAD_CONSENT_VERSION;
}

export type LeadValidationResult =
  | { ok: true; value: ValidatedLeadInput }
  | { ok: false; errors: LeadValidationError[] };

function readText(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

export function normalizeUkrainianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  let normalized: string;

  if (digits.length === 12 && digits.startsWith("380")) {
    normalized = `+${digits}`;
  } else if (digits.length === 10 && digits.startsWith("0")) {
    normalized = `+38${digits}`;
  } else if (digits.length === 9) {
    normalized = `+380${digits}`;
  } else {
    return null;
  }

  return /^\+380\d{9}$/.test(normalized) ? normalized : null;
}

export function validateLeadInput(input: unknown): LeadValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      errors: [{ field: "form", code: "INVALID_BODY", message: "Некоректний формат заявки." }],
    };
  }

  const body = input as Record<string, unknown>;
  const errors: LeadValidationError[] = [];
  const name = readText(body.name);
  const phone = readText(body.phone);
  const categoryId = readText(body.categoryId);
  const productId = readText(body.productId);
  const categorySnapshot = readText(body.categorySnapshot);
  const message = readText(body.message);
  const honeypot = readText(body.website);
  const turnstileToken = readText(body.turnstileToken);
  const phoneNormalized = phone ? normalizeUkrainianPhone(phone) : null;

  if (honeypot) {
    errors.push({ field: "form", code: "SPAM_DETECTED", message: "Заявку відхилено." });
  }
  if (!name || name.length < 2 || name.length > 80) {
    errors.push({ field: "name", code: "INVALID_NAME", message: "Вкажіть ім’я від 2 до 80 символів." });
  }
  if (!phoneNormalized) {
    errors.push({ field: "phone", code: "INVALID_PHONE", message: "Вкажіть коректний український номер телефону." });
  }
  if (categoryId && !/^[a-z0-9][a-z0-9-]{1,79}$/.test(categoryId)) {
    errors.push({ field: "categoryId", code: "INVALID_CATEGORY_ID", message: "Некоректна категорія." });
  }
  if (productId && !/^[a-z0-9][a-z0-9-]{1,79}$/.test(productId)) {
    errors.push({ field: "productId", code: "INVALID_PRODUCT_ID", message: "Некоректний виріб." });
  }
  if (!categorySnapshot || categorySnapshot.length < 2 || categorySnapshot.length > 120) {
    errors.push({
      field: "categorySnapshot",
      code: "INVALID_CATEGORY",
      message: "Оберіть напрямок звернення.",
    });
  }
  if (message && message.length > 2000) {
    errors.push({ field: "message", code: "MESSAGE_TOO_LONG", message: "Скоротіть опис до 2000 символів." });
  }
  if (body.consentAccepted !== true) {
    errors.push({
      field: "consentAccepted",
      code: "CONSENT_REQUIRED",
      message: "Потрібна згода на обробку даних для відповіді на звернення.",
    });
  }
  if (!turnstileToken || turnstileToken.length < 10 || turnstileToken.length > 2048) {
    errors.push({
      field: "turnstileToken",
      code: "TURNSTILE_REQUIRED",
      message: "Підтвердьте, що звернення надсилає людина.",
    });
  }

  if (errors.length > 0 || !name || !phoneNormalized || !categorySnapshot || !turnstileToken) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      phoneNormalized,
      categoryId: categoryId || null,
      productId: productId || null,
      categorySnapshot,
      message: message || null,
      turnstileToken,
      consentVersion: LEAD_CONSENT_VERSION,
    },
  };
}
