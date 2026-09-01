import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import test from "node:test";

const brandRoot = join(process.cwd(), "public", "brand", "kaminchyk");

function unfilterPng(buffer: Buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG");
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  assert.equal(bitDepth, 8, "логотип має бути 8-bit PNG");
  assert.ok(colorType === 3 || colorType === 6, "логотип має бути indexed-alpha або RGBA PNG");

  const idat: Buffer[] = [];
  let transparency: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") idat.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === "tRNS") transparency = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IEND") break;
  }

  const decoded = inflateSync(Buffer.concat(idat));
  const bytesPerPixel = colorType === 6 ? 4 : 1;
  const rowBytes = width * bytesPerPixel;
  const pixels = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y += 1) {
    const filter = decoded[y * (rowBytes + 1)];
    const source = decoded.subarray(y * (rowBytes + 1) + 1, (y + 1) * (rowBytes + 1));
    const target = pixels.subarray(y * rowBytes, (y + 1) * rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const left = x >= bytesPerPixel ? target[x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[(y - 1) * rowBytes + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[(y - 1) * rowBytes + x - bytesPerPixel] : 0;
      if (filter === 0) target[x] = source[x];
      else if (filter === 1) target[x] = (source[x] + left) & 255;
      else if (filter === 2) target[x] = (source[x] + up) & 255;
      else if (filter === 3) target[x] = (source[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        target[x] = (source[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      } else assert.fail(`невідомий PNG filter ${filter}`);
    }
  }
  return { pixels, colorType, transparency };
}

test("затверджені K та Angel PNG ідентичні corrected-набору й мають реальну прозорість", async () => {
  const manifest = await readFile(join(brandRoot, "CHECKSUMS.sha256"), "utf8");
  const entries = manifest.trim().split("\n").map((line) => line.split(/\s+/, 2));
  assert.equal(entries.length, 12);

  for (const [expectedHash, relativePath] of entries) {
    const buffer = await readFile(join(brandRoot, relativePath));
    assert.equal(createHash("sha256").update(buffer).digest("hex"), expectedHash, relativePath);
    const { pixels, colorType, transparency } = unfilterPng(buffer);
    let minAlpha = 255;
    let maxAlpha = 0;
    const pixelStep = colorType === 6 ? 4 : 1;
    const firstAlpha = colorType === 6 ? 3 : 0;
    for (let index = firstAlpha; index < pixels.length; index += pixelStep) {
      const alpha = colorType === 6 ? pixels[index] : (transparency[pixels[index]] ?? 255);
      minAlpha = Math.min(minAlpha, alpha);
      maxAlpha = Math.max(maxAlpha, alpha);
    }
    assert.equal(minAlpha, 0, `${relativePath}: має бути повністю прозорий фон`);
    assert.ok(maxAlpha > 0, `${relativePath}: логотип не може бути порожнім`);
  }
});
