import type { D1DatabaseLike } from "../leads/repository.ts";
import {
  claimOutboxBatch,
  finishOutboxDelivery,
  OUTBOX_MAX_ATTEMPTS,
  retryDelayMs,
} from "./outbox.ts";
import { sendTelegramLead, type FetchLike } from "./telegram.ts";

export interface NotificationWorkerEnv {
  DB?: D1DatabaseLike;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
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
    const delivery = await sendTelegramLead(
      options.fetcher ?? fetch,
      env.TELEGRAM_BOT_TOKEN,
      env.TELEGRAM_CHAT_ID,
      event,
    );
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
