export interface TelegramLeadNotification {
  publicNumber: string;
  name: string;
  phoneNormalized: string;
  categorySnapshot: string;
  message: string | null;
  attachmentCount?: number;
}

export interface TelegramDocumentAttachment {
  originalName: string;
  mime: string;
  body: ArrayBuffer;
}

export type TelegramDeliveryResult =
  | { ok: true }
  | {
      ok: false;
      retryable: boolean;
      errorCode: string;
      retryAfterMs?: number;
    };

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

const TELEGRAM_TIMEOUT_MS = 10_000;
const MAX_RETRY_AFTER_MS = 6 * 60 * 60 * 1000;

export function escapeTelegramHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function formatTelegramLead(notification: TelegramLeadNotification): string {
  const lines = [
    `<b>Нова заявка ${escapeTelegramHtml(notification.publicNumber)}</b>`,
    `Ім’я: ${escapeTelegramHtml(notification.name)}`,
    `Телефон: <code>${escapeTelegramHtml(notification.phoneNormalized)}</code>`,
    `Категорія: ${escapeTelegramHtml(notification.categorySnapshot)}`,
  ];

  if (notification.message) {
    lines.push(`Побажання: ${escapeTelegramHtml(notification.message)}`);
  }

  if (notification.attachmentCount && notification.attachmentCount > 0) {
    lines.push(`Вкладення: ${notification.attachmentCount} фото доступні в захищеній адмінці`);
  }

  return lines.join("\n");
}

function retryAfterMs(value: unknown): number | undefined {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.min(MAX_RETRY_AFTER_MS, Math.max(1000, Math.round(seconds * 1000)));
}

async function readTelegramRetryAfter(response: Response): Promise<number | undefined> {
  const headerValue = retryAfterMs(response.headers.get("Retry-After"));
  try {
    const body = (await response.clone().json()) as {
      parameters?: { retry_after?: unknown };
    };
    return retryAfterMs(body.parameters?.retry_after) ?? headerValue;
  } catch {
    return headerValue;
  }
}

async function classifyTelegramResponse(response: Response): Promise<TelegramDeliveryResult> {
  if (response.ok) {
    try {
      const body = (await response.json()) as { ok?: unknown };
      if (body.ok === true) return { ok: true };
    } catch {
      // Невалідну успішну відповідь не можна позначати SENT.
    }
    return {
      ok: false,
      retryable: true,
      errorCode: "TELEGRAM_INVALID_RESPONSE",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      retryable: true,
      errorCode: "TELEGRAM_RATE_LIMITED",
      retryAfterMs: await readTelegramRetryAfter(response),
    };
  }

  if (response.status === 408 || response.status >= 500) {
    return {
      ok: false,
      retryable: true,
      errorCode:
        response.status === 408 ? "TELEGRAM_TIMEOUT" : "TELEGRAM_UNAVAILABLE",
    };
  }

  return {
    ok: false,
    retryable: false,
    errorCode: `TELEGRAM_HTTP_${response.status}`,
  };
}

export async function sendTelegramLead(
  fetcher: FetchLike,
  botToken: string,
  chatId: string,
  notification: TelegramLeadNotification,
): Promise<TelegramDeliveryResult> {
  try {
    const response = await fetcher(
      `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatTelegramLead(notification),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      },
    );
    return classifyTelegramResponse(response);
  } catch {
    return {
      ok: false,
      retryable: true,
      errorCode: "TELEGRAM_NETWORK_ERROR",
    };
  }
}

export async function sendTelegramDocument(
  fetcher: FetchLike,
  botToken: string,
  chatId: string,
  attachment: TelegramDocumentAttachment,
): Promise<TelegramDeliveryResult> {
  try {
    const form = new FormData();
    form.set("chat_id", chatId);
    form.set(
      "document",
      new File([attachment.body], attachment.originalName, { type: attachment.mime }),
    );

    const response = await fetcher(
      `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendDocument`,
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      },
    );
    return classifyTelegramResponse(response);
  } catch {
    return {
      ok: false,
      retryable: true,
      errorCode: "TELEGRAM_NETWORK_ERROR",
    };
  }
}
