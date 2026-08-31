import type { D1DatabaseLike } from "../leads/repository.ts";

const DEFAULT_BATCH_LIMIT = 10;
const MAX_BATCH_LIMIT = 50;
export const OUTBOX_LOCK_TIMEOUT_MS = 5 * 60 * 1000;
export const OUTBOX_MAX_ATTEMPTS = 6;

const RETRY_DELAYS_MS = [
  60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
] as const;

interface OutboxCandidateRow {
  id: string;
  lead_id: string;
  public_number: string;
  name: string;
  phone_normalized: string;
  category_snapshot: string;
  message: string | null;
}

interface ClaimedAttemptRow {
  attempt_count: number;
}

export interface ClaimedOutboxEvent {
  id: string;
  leadId: string;
  publicNumber: string;
  name: string;
  phoneNormalized: string;
  categorySnapshot: string;
  message: string | null;
  attemptCount: number;
  lockToken: number;
}

export interface ClaimOutboxOptions {
  nowMs?: number;
  limit?: number;
  lockTimeoutMs?: number;
}

export type DeliveryTransition =
  | { status: "SENT"; sentAtMs: number }
  | { status: "PENDING"; nextAttemptAtMs: number; errorCode: string }
  | { status: "FAILED"; errorCode: string };

function boundedLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_BATCH_LIMIT;
  return Math.max(1, Math.min(MAX_BATCH_LIMIT, Math.trunc(limit ?? DEFAULT_BATCH_LIMIT)));
}

export function retryDelayMs(attemptCount: number): number {
  const index = Math.max(0, Math.min(RETRY_DELAYS_MS.length - 1, attemptCount - 1));
  return RETRY_DELAYS_MS[index];
}

export function safeOutboxErrorCode(errorCode: string): string {
  const normalized = errorCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
  return (normalized || "UNKNOWN_ERROR").slice(0, 64);
}

export async function claimOutboxBatch(
  database: D1DatabaseLike,
  options: ClaimOutboxOptions = {},
): Promise<ClaimedOutboxEvent[]> {
  const nowMs = options.nowMs ?? Date.now();
  const lockTimeoutMs = options.lockTimeoutMs ?? OUTBOX_LOCK_TIMEOUT_MS;
  const staleBeforeMs = nowMs - Math.max(1, lockTimeoutMs);
  const limit = boundedLimit(options.limit);

  const candidates = await database
    .prepare(
      `SELECT
         outbox.id,
         outbox.lead_id,
         leads.public_number,
         leads.name,
         leads.phone_normalized,
         leads.category_snapshot,
         leads.message
       FROM notification_outbox AS outbox
       INNER JOIN leads ON leads.id = outbox.lead_id
       WHERE outbox.channel = 'TELEGRAM'
         AND (
           (outbox.status = 'PENDING' AND outbox.next_attempt_at <= ?)
           OR (
             outbox.status = 'PROCESSING'
             AND outbox.locked_at IS NOT NULL
             AND outbox.locked_at <= ?
           )
         )
       ORDER BY outbox.next_attempt_at ASC, outbox.created_at ASC
       LIMIT ?`,
    )
    .bind(nowMs, staleBeforeMs, limit)
    .all<OutboxCandidateRow>();

  const claimed: ClaimedOutboxEvent[] = [];
  for (const candidate of candidates.results) {
    // Умовний UPDATE є атомарним claim: якщо інший Worker уже змінив рядок,
    // RETURNING нічого не поверне, навіть коли обидва побачили той самий SELECT.
    const attempt = await database
      .prepare(
        `UPDATE notification_outbox
         SET status = 'PROCESSING',
             attempt_count = attempt_count + 1,
             locked_at = ?,
             updated_at = ?
         WHERE id = ?
           AND channel = 'TELEGRAM'
           AND (
             (status = 'PENDING' AND next_attempt_at <= ?)
             OR (
               status = 'PROCESSING'
               AND locked_at IS NOT NULL
               AND locked_at <= ?
             )
           )
         RETURNING attempt_count`,
      )
      .bind(nowMs, nowMs, candidate.id, nowMs, staleBeforeMs)
      .first<ClaimedAttemptRow>();

    if (!attempt) continue;
    claimed.push({
      id: candidate.id,
      leadId: candidate.lead_id,
      publicNumber: candidate.public_number,
      name: candidate.name,
      phoneNormalized: candidate.phone_normalized,
      categorySnapshot: candidate.category_snapshot,
      message: candidate.message,
      attemptCount: attempt.attempt_count,
      lockToken: nowMs,
    });
  }

  return claimed;
}

export async function finishOutboxDelivery(
  database: D1DatabaseLike,
  eventId: string,
  lockToken: number,
  transition: DeliveryTransition,
  nowMs = Date.now(),
): Promise<boolean> {
  let statement;

  if (transition.status === "SENT") {
    statement = database
      .prepare(
        `UPDATE notification_outbox
         SET status = 'SENT', sent_at = ?, locked_at = NULL,
             last_error_code = NULL, updated_at = ?
         WHERE id = ? AND status = 'PROCESSING' AND locked_at = ?
         RETURNING id`,
      )
      .bind(transition.sentAtMs, nowMs, eventId, lockToken);
  } else if (transition.status === "PENDING") {
    statement = database
      .prepare(
        `UPDATE notification_outbox
         SET status = 'PENDING', next_attempt_at = ?, locked_at = NULL,
             last_error_code = ?, updated_at = ?
         WHERE id = ? AND status = 'PROCESSING' AND locked_at = ?
         RETURNING id`,
      )
      .bind(
        transition.nextAttemptAtMs,
        safeOutboxErrorCode(transition.errorCode),
        nowMs,
        eventId,
        lockToken,
      );
  } else {
    statement = database
      .prepare(
        `UPDATE notification_outbox
         SET status = 'FAILED', locked_at = NULL,
             last_error_code = ?, updated_at = ?
         WHERE id = ? AND status = 'PROCESSING' AND locked_at = ?
         RETURNING id`,
      )
      .bind(
        safeOutboxErrorCode(transition.errorCode),
        nowMs,
        eventId,
        lockToken,
      );
  }

  return Boolean(await statement.first<{ id: string }>());
}
