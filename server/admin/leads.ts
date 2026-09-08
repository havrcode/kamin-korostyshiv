import type { D1DatabaseLike } from "../leads/repository.ts";
import { verifyAdminAccess, type AdminAuthEnv } from "./auth.ts";
import type { TurnstileFetchLike } from "../security/turnstile.ts";
import type { AdminMediaWorkerEnv } from "./media.ts";
import {
  contentDispositionName,
  type LeadAttachmentBucketLike,
  type StoredLeadAttachmentRow,
} from "../leads/attachments.ts";

export interface AdminWorkerEnv extends AdminAuthEnv, Pick<AdminMediaWorkerEnv, "PRODUCT_MEDIA_PRIVATE" | "PRODUCT_MEDIA_PUBLIC" | "IMAGES" | "MEDIA_PUBLIC_BASE_URL"> {
  DB?: D1DatabaseLike;
  LEAD_ATTACHMENTS?: LeadAttachmentBucketLike;
}

export interface AdminHandlerOptions {
  accessFetcher?: TurnstileFetchLike;
}

const LEAD_STATUSES = new Set(["NEW", "IN_PROGRESS", "CONTACTED", "CLOSED", "SPAM"]);

type AdminLeadRow = {
  id: string;
  public_number: string;
  name: string;
  phone_normalized: string;
  category_id: string | null;
  product_id: string | null;
  category_snapshot: string;
  message: string | null;
  status: string;
  created_at: number;
  updated_at: number;
};

type AdminLeadAttachment = Pick<StoredLeadAttachmentRow, "id" | "original_name" | "mime" | "bytes" | "created_at"> & {
  download_url: string;
};

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function boundedLimit(value: string | null): number {
  const parsed = Number(value ?? 50);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.trunc(parsed))) : 50;
}

export async function handleAdminApiRequest(
  request: Request,
  env: AdminWorkerEnv,
  options: AdminHandlerOptions = {},
): Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/v1/admin/")) return json({ ok: false, error: { code: "NOT_FOUND" } }, 404);
  if (!env.DB) return json({ ok: false, error: { code: "ADMIN_NOT_CONFIGURED" } }, 503);

  const auth = await verifyAdminAccess(request, env, options.accessFetcher);
  if (!auth.ok) return json({ ok: false, error: { code: auth.code } }, auth.status);

  if (url.pathname === "/api/v1/admin/leads" && request.method === "GET") {
    const status = url.searchParams.get("status")?.toUpperCase();
    const where = status && LEAD_STATUSES.has(status) ? "WHERE status = ?" : "";
    const statement = env.DB.prepare(
      `SELECT id, public_number, name, phone_normalized, category_id, product_id,
              category_snapshot, message, status, created_at, updated_at
       FROM leads ${where}
       ORDER BY created_at DESC
       LIMIT ?`,
    );
    const query = status && LEAD_STATUSES.has(status)
      ? statement.bind(status, boundedLimit(url.searchParams.get("limit")))
      : statement.bind(boundedLimit(url.searchParams.get("limit")));
    const rows = await query.all<AdminLeadRow>();
    const attachmentsByLead = new Map<string, AdminLeadAttachment[]>();
    if (rows.results.length > 0) {
      const placeholders = rows.results.map(() => "?").join(", ");
      const attachments = await env.DB.prepare(
        `SELECT id, lead_id, storage_key, original_name, mime, bytes, created_at
         FROM lead_attachments
         WHERE lead_id IN (${placeholders})
         ORDER BY created_at ASC`,
      ).bind(...rows.results.map((row) => row.id)).all<StoredLeadAttachmentRow>();
      for (const attachment of attachments.results) {
        const list = attachmentsByLead.get(attachment.lead_id) ?? [];
        list.push({
          id: attachment.id,
          original_name: attachment.original_name,
          mime: attachment.mime,
          bytes: attachment.bytes,
          created_at: attachment.created_at,
          download_url: `/api/v1/admin/leads/${attachment.lead_id}/attachments/${attachment.id}`,
        });
        attachmentsByLead.set(attachment.lead_id, list);
      }
    }
    return json({
      ok: true,
      leads: rows.results.map((row) => ({ ...row, attachments: attachmentsByLead.get(row.id) ?? [] })),
    }, 200);
  }

  const attachmentMatch = url.pathname.match(/^\/api\/v1\/admin\/leads\/([0-9a-f-]{16,64})\/attachments\/([0-9a-f-]{16,64})$/i);
  if (attachmentMatch && request.method === "GET") {
    if (!env.LEAD_ATTACHMENTS) return json({ ok: false, error: { code: "ATTACHMENTS_NOT_CONFIGURED" } }, 503);
    const attachment = await env.DB.prepare(
      `SELECT id, lead_id, storage_key, original_name, mime, bytes, created_at
       FROM lead_attachments
       WHERE id = ? AND lead_id = ?
       LIMIT 1`,
    ).bind(attachmentMatch[2], attachmentMatch[1]).first<StoredLeadAttachmentRow>();
    if (!attachment) return json({ ok: false, error: { code: "ATTACHMENT_NOT_FOUND" } }, 404);
    const stored = await env.LEAD_ATTACHMENTS.get(attachment.storage_key);
    if (!stored?.body) return json({ ok: false, error: { code: "ATTACHMENT_NOT_FOUND" } }, 404);
    const encodedName = encodeURIComponent(attachment.original_name).replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Type": attachment.mime,
      "Content-Disposition": `attachment; filename="${contentDispositionName(attachment.original_name)}"; filename*=UTF-8''${encodedName}`,
    });
    stored.writeHttpMetadata?.(headers);
    headers.set("Content-Type", attachment.mime);
    return new Response(stored.body, { status: 200, headers });
  }

  const match = url.pathname.match(/^\/api\/v1\/admin\/leads\/([0-9a-f-]{16,64})$/i);
  if (match && request.method === "PATCH") {
    let body: { status?: unknown; note?: unknown };
    try {
      body = await request.json() as { status?: unknown; note?: unknown };
    } catch {
      return json({ ok: false, error: { code: "INVALID_JSON" } }, 400);
    }
    const status = typeof body.status === "string" ? body.status.toUpperCase() : "";
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
    if (!LEAD_STATUSES.has(status)) return json({ ok: false, error: { code: "INVALID_STATUS" } }, 422);

    const before = await env.DB.prepare("SELECT status FROM leads WHERE id = ? LIMIT 1").bind(match[1]).first<{ status: string }>();
    if (!before) return json({ ok: false, error: { code: "LEAD_NOT_FOUND" } }, 404);
    const now = Date.now();
    const update = env.DB.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, match[1]);
    const audit = env.DB.prepare(
      `INSERT INTO admin_audit_log (
         id, actor_email, action, entity_type, entity_id,
         before_snapshot, after_snapshot, created_at
       ) VALUES (?, ?, 'LEAD_STATUS_CHANGED', 'lead', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), auth.email, match[1],
      JSON.stringify({ status: before.status }), JSON.stringify({ status, note }), now,
    );
    await env.DB.batch([update, audit]);
    return json({ ok: true, lead: { id: match[1], status } }, 200);
  }

  return json({ ok: false, error: { code: "NOT_FOUND" } }, 404);
}
