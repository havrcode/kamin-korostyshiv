import assert from "node:assert/strict";
import test from "node:test";
import {
  contentDispositionName,
  detectLeadAttachmentMime,
  normalizeLeadAttachmentMime,
  sanitizeLeadAttachmentName,
} from "../server/leads/attachments.ts";

test("detects supported client image signatures", () => {
  assert.equal(detectLeadAttachmentMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectLeadAttachmentMime(new Uint8Array([0xff, 0xd8, 0xff])), "image/jpeg");
  assert.equal(detectLeadAttachmentMime(new TextEncoder().encode("RIFFxxxxWEBP")), "image/webp");
  assert.equal(detectLeadAttachmentMime(new TextEncoder().encode("not-an-image")), null);
});

test("normalizes safe MIME and download names", () => {
  assert.equal(normalizeLeadAttachmentMime("image/heif"), "image/heic");
  assert.equal(sanitizeLeadAttachmentName("../../картинка\n.png", "image/png"), "картинка.png");
  assert.equal(contentDispositionName('photo"\r\n.png'), "photo___.png");
});
