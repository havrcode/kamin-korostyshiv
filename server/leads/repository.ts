import type { ValidatedLeadInput } from "./validation.ts";
import type { LeadAttachmentInput } from "./attachments.ts";

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

export interface PersistLeadInput {
  idempotencyKey: string;
  lead: ValidatedLeadInput;
  sourceUrl: string | null;
  attachments?: LeadAttachmentInput[];
}

export interface PersistLeadResult {
  publicNumber: string;
  replayed: boolean;
}

export interface PersistLeadOptions {
  now?: () => Date;
  createId?: () => string;
  createPublicNumber?: (now: Date) => string;
  maxInsertAttempts?: number;
}

interface ExistingLeadRow {
  public_number: string;
}

function defaultPublicNumber(now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `KK-${date}-${suffix}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|SQLITE_CONSTRAINT:\s*UNIQUE/i.test(
    error.message,
  );
}

async function findExistingLead(
  database: D1DatabaseLike,
  idempotencyKey: string,
): Promise<ExistingLeadRow | null> {
  return database
    .prepare(
      `SELECT public_number
       FROM leads
       WHERE idempotency_key = ?
       LIMIT 1`,
    )
    .bind(idempotencyKey)
    .first<ExistingLeadRow>();
}

export async function createLeadWithOutbox(
  database: D1DatabaseLike,
  input: PersistLeadInput,
  options: PersistLeadOptions = {},
): Promise<PersistLeadResult> {
  const existing = await findExistingLead(database, input.idempotencyKey);
  if (existing) {
    return { publicNumber: existing.public_number, replayed: true };
  }

  const now = options.now ?? (() => new Date());
  const createId = options.createId ?? (() => crypto.randomUUID());
  const createPublicNumber = options.createPublicNumber ?? defaultPublicNumber;
  const maxInsertAttempts = options.maxInsertAttempts ?? 3;

  for (let attempt = 1; attempt <= maxInsertAttempts; attempt += 1) {
    const timestamp = now();
    const timestampMs = timestamp.getTime();
    const leadId = createId();
    const outboxId = createId();
    const publicNumber = createPublicNumber(timestamp);

    const insertLead = database
      .prepare(
        `INSERT INTO leads (
           id, public_number, idempotency_key, name, phone_normalized,
           category_id, product_id, category_snapshot, message, status, consent_version,
           source_url, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?)`,
      )
      .bind(
        leadId,
        publicNumber,
        input.idempotencyKey,
        input.lead.name,
        input.lead.phoneNormalized,
        input.lead.categoryId,
        input.lead.productId,
        input.lead.categorySnapshot,
        input.lead.message,
        input.lead.consentVersion,
        input.sourceUrl,
        timestampMs,
        timestampMs,
      );

    const insertOutbox = database
      .prepare(
        `INSERT INTO notification_outbox (
           id, lead_id, channel, status, attempt_count, next_attempt_at,
           locked_at, sent_at, last_error_code, created_at, updated_at
         ) VALUES (?, ?, 'TELEGRAM', 'PENDING', 0, ?, NULL, NULL, NULL, ?, ?)`,
      )
      .bind(outboxId, leadId, timestampMs, timestampMs, timestampMs);

    const insertAttachments = (input.attachments ?? []).map((attachment) => database
      .prepare(
        `INSERT INTO lead_attachments (
           id, lead_id, storage_key, original_name, mime, bytes, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        attachment.id,
        leadId,
        attachment.storageKey,
        attachment.originalName,
        attachment.mime,
        attachment.bytes,
        timestampMs,
      ));

    try {
      // Cloudflare D1 виконує всі statements у batch як одну транзакцію.
      await database.batch([insertLead, insertOutbox, ...insertAttachments]);
      return { publicNumber, replayed: false };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      // Паралельний повтор міг виграти гонку за тим самим idempotency key.
      const replay = await findExistingLead(database, input.idempotencyKey);
      if (replay) {
        return { publicNumber: replay.public_number, replayed: true };
      }

      // Інакше найімовірніша рідкісна колізія public_number: генеруємо новий.
      if (attempt === maxInsertAttempts) throw error;
    }
  }

  throw new Error("Lead insert attempts exhausted");
}
