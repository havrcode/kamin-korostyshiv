import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    publicNumber: text("public_number").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    name: text("name").notNull(),
    phoneNormalized: text("phone_normalized").notNull(),
    categoryId: text("category_id"),
    productId: text("product_id"),
    categorySnapshot: text("category_snapshot").notNull(),
    message: text("message"),
    status: text("status", {
      enum: ["NEW", "IN_PROGRESS", "CONTACTED", "CLOSED", "SPAM"],
    })
      .notNull()
      .default("NEW"),
    consentVersion: text("consent_version").notNull(),
    sourceUrl: text("source_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("leads_public_number_unique").on(table.publicNumber),
    uniqueIndex("leads_idempotency_key_unique").on(table.idempotencyKey),
    index("leads_status_created_at_idx").on(table.status, table.createdAt),
    index("leads_phone_created_at_idx").on(table.phoneNormalized, table.createdAt),
  ],
);

export const notificationOutbox = sqliteTable(
  "notification_outbox",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["TELEGRAM"] })
      .notNull()
      .default("TELEGRAM"),
    status: text("status", {
      enum: ["PENDING", "PROCESSING", "SENT", "FAILED"],
    })
      .notNull()
      .default("PENDING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }).notNull(),
    lockedAt: integer("locked_at", { mode: "timestamp_ms" }),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    lastErrorCode: text("last_error_code"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("notification_outbox_claim_idx").on(
      table.status,
      table.nextAttemptAt,
      table.lockedAt,
    ),
    index("notification_outbox_lead_idx").on(table.leadId),
  ],
);

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: text("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    beforeSnapshot: text("before_snapshot"),
    afterSnapshot: text("after_snapshot"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("admin_audit_entity_idx").on(table.entityType, table.entityId, table.createdAt),
    index("admin_audit_actor_idx").on(table.actorEmail, table.createdAt),
  ],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    originalKey: text("original_key").notNull(),
    webpKey: text("webp_key").notNull(),
    publicUrl: text("public_url").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    published: integer("published").notNull().default(0),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    originalMime: text("original_mime").notNull(),
    originalBytes: integer("original_bytes").notNull(),
    checksumSha256: text("checksum_sha256"),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("product_images_webp_key_unique").on(table.webpKey),
    index("product_images_product_order_idx").on(table.productId, table.sortOrder),
    index("product_images_product_published_idx").on(table.productId, table.published, table.deletedAt),
  ],
);
