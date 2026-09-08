export const MAX_LEAD_ATTACHMENTS = 3;
export const MAX_LEAD_ATTACHMENT_BYTES = 6 * 1024 * 1024;
export const MAX_LEAD_MULTIPART_BYTES = 18 * 1024 * 1024;

export const LEAD_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type LeadAttachmentMime = typeof LEAD_ATTACHMENT_MIME_TYPES[number];

export interface LeadAttachmentInput {
  id: string;
  storageKey: string;
  originalName: string;
  mime: LeadAttachmentMime;
  bytes: number;
}

export interface LeadAttachmentBucketLike {
  put(
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<LeadAttachmentObjectLike | null>;
  delete(key: string): Promise<void>;
}

export interface LeadAttachmentObjectLike {
  body: ReadableStream<Uint8Array> | null;
  writeHttpMetadata?(headers: Headers): void;
}

export interface StoredLeadAttachmentRow {
  id: string;
  lead_id: string;
  storage_key: string;
  original_name: string;
  mime: LeadAttachmentMime;
  bytes: number;
  created_at: number;
}

export function normalizeLeadAttachmentMime(value: string): LeadAttachmentMime | null {
  const mime = value.trim().toLowerCase();
  if (mime === "image/heif") return "image/heic";
  return (LEAD_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mime)
    ? mime as LeadAttachmentMime
    : null;
}

function textAt(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectLeadAttachmentMime(bytes: Uint8Array): LeadAttachmentMime | null {
  const png = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (png) return "image/png";

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (bytes.length >= 12 && textAt(bytes, 0, 4) === "RIFF" && textAt(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }

  if (bytes.length >= 12 && textAt(bytes, 4, 4) === "ftyp") {
    const brands = [textAt(bytes, 8, 4), textAt(bytes, 16, 4)];
    if (brands.some((brand) => ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand))) {
      return "image/heic";
    }
  }

  return null;
}

export function leadAttachmentExtension(mime: LeadAttachmentMime): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "heic";
}

export function sanitizeLeadAttachmentName(value: string, mime: LeadAttachmentMime): string {
  const fallback = `photo.${leadAttachmentExtension(mime)}`;
  const name = value
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 120);
  return name || fallback;
}

export function contentDispositionName(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "_").replace(/[\\"\r\n]/g, "_").slice(0, 120) || "photo";
}
