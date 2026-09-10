import type { D1DatabaseLike } from "../leads/repository.ts";
import type {
  LeadAttachmentBucketLike,
  StoredLeadAttachmentRow,
} from "../leads/attachments.ts";
import {
  claimOutboxBatch,
  finishOutboxDelivery,
  OUTBOX_MAX_ATTEMPTS,
  retryDelayMs,
} from "./outbox.ts";
import {
  sendTelegramDocument,
  sendTelegramLead,
  type FetchLike,
  type TelegramDeliveryResult,
} from "./telegram.ts";

export interface NotificationWorkerEnv {
  DB?: D1DatabaseLike;
  LEAD_ATTACHMENTS?: LeadAttachmentBucketLike;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_SEND_ATTACHMENTS?: string | boolean;
}

export interface ProcessOutboxOptions {
  fetcher?: FetchLike;
  now?: () => Date;
  limit?: number;
  maxAttempts?: number;
}

export interface ProcessOutboxResult {
  ok: boolean;
  code?: "NOTIFICATION_SERVICE_NOT_CONFIGURED";
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  lostLease: number;
}

export function shouldSendTelegramAttachments(value: string | boolean | undefined): boolean {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
}

async function sendTelegramAttachments(
  env: NotificationWorkerEnv,
  event: {
    leadId: string;
    attachmentCount: number;
  },
  fetcher: FetchLike,
  botToken: string,
  chatId: string,
): Promise<TelegramDeliveryResult> {
  if (event.attachmentCount < 1) return { ok: true };
  if (!env.LEAD_ATTACHMENTS) {
    return {
      ok: false,
      retryable: false,
      errorCode: "TELEGRAM_ATTACHMENTS_NOT_CONFIGURED",
    };
  }

  let rows: StoredLeadAttachmentRow[];
  try {
    const result = await env.DB!.prepare(
      `SELECT id, lead_id, storage_key, original_name, mime, bytes, created_at
       FROM lead_attachments
       WHERE lead_id = ?
       ORDER BY created_at ASC, id ASC`,
    ).bind(event.leadId).all<StoredLeadAttachmentRow>();
    rows = result.results;
  } catch {
    return {
      ok: false,
      retryable: true,
      errorCode: "TELEGRAM_ATTACHMENTS_DATABASE_ERROR",
    };
  }

  if (rows.length !== event.attachmentCount) {
    return {
      ok: false,
      retryable: false,
      errorCode: "TELEGRAM_ATTACHMENTS_METADATA_MISSING",
    };
  }

  for (const row of rows) {
    let stored;
    try {
      stored = await env.LEAD_ATTACHMENTS.get(row.storage_key);
    } catch {
      return {
        ok: false,
        retryable: true,
        errorCode: "TELEGRAM_ATTACHMENT_STORAGE_ERROR",
      };
    }
    if (!stored?.body) {
      return {
        ok: false,
        retryable: false,
        errorCode: "TELEGRAM_ATTACHMENT_NOT_FOUND",
      };
    }

    let body: ArrayBuffer;
    try {
      body = await new Response(stored.body).arrayBuffer();
    } catch {
      return {
        ok: false,
        retryable: true,
        errorCode: "TELEGRAM_ATTACHMENT_READ_ERROR",
      };
    }

    const delivery = await sendTelegramDocument(fetcher, botToken, chatId, {
      originalName: row.original_name,
      mime: row.mime,
      body,
    });
    if (!delivery.ok) return delivery;
  }

  return { ok: true };
}

export async function processNotificationOutbox(
  env: NotificationWorkerEnv,
  options: ProcessOutboxOptions = {},
): Promise<ProcessOutboxResult> {
  const emptyResult = { claimed: 0, sent: 0, retried: 0, failed: 0, lostLease: 0 };
  if (!env.DB || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return {
      ok: false,
      code: "NOTIFICATION_SERVICE_NOT_CONFIGURED",
      ...emptyResult,
    };
  }

  const now = options.now ?? (() => new Date());
  const nowMs = now().getTime();
  const maxAttempts = Math.max(1, options.maxAttempts ?? OUTBOX_MAX_ATTEMPTS);
  const events = await claimOutboxBatch(env.DB, { nowMs, limit: options.limit });
  const result: ProcessOutboxResult = {
    ok: true,
    ...emptyResult,
    claimed: events.length,
  };

  for (const event of events) {
    let delivery = await sendTelegramLead(
      options.fetcher ?? fetch,
      env.TELEGRAM_BOT_TOKEN,
      env.TELEGRAM_CHAT_ID,
      event,
    );
    if (delivery.ok && shouldSendTelegramAttachments(env.TELEGRAM_SEND_ATTACHMENTS)) {
      delivery = await sendTelegramAttachments(
        env,
        event,
        options.fetcher ?? fetch,
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_CHAT_ID,
      );
    }
    const finishedAtMs = now().getTime();

    if (delivery.ok) {
      const finished = await finishOutboxDelivery(
        env.DB,
        event.id,
        event.lockToken,
        { status: "SENT", sentAtMs: finishedAtMs },
        finishedAtMs,
      );
      if (finished) result.sent += 1;
      else result.lostLease += 1;
      continue;
    }

    if (delivery.retryable && event.attemptCount < maxAttempts) {
      const delayMs = Math.max(
        retryDelayMs(event.attemptCount),
        delivery.retryAfterMs ?? 0,
      );
      const finished = await finishOutboxDelivery(
        env.DB,
        event.id,
        event.lockToken,
        {
          status: "PENDING",
          nextAttemptAtMs: finishedAtMs + delayMs,
          errorCode: delivery.errorCode,
        },
        finishedAtMs,
      );
      if (finished) result.retried += 1;
      else result.lostLease += 1;
      continue;
    }

    const finished = await finishOutboxDelivery(
      env.DB,
      event.id,
      event.lockToken,
      { status: "FAILED", errorCode: delivery.errorCode },
      finishedAtMs,
    );
    if (finished) result.failed += 1;
    else result.lostLease += 1;
  }

  return result;
}
