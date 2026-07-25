/**
 * Generates simple PNG icons without external dependencies.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "icons");

const BACKGROUND = { r: 15, g: 23, b: 42, a: 255 };
const ACCENT = { r: 14, g: 165, b: 233, a: 255 };

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, data.length, false);

  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);

  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(crcInput), false);

  const result = new Uint8Array(4 + 4 + data.length + 4);
  result.set(length, 0);
  result.set(typeBytes, 4);
  result.set(data, 8);
  result.set(crc, 8 + data.length);
  return result;
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  pixels[i] = color.r;
  pixels[i + 1] = color.g;
  pixels[i + 2] = color.b;
  pixels[i + 3] = color.a;
}

function fillRect(pixels, size, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(pixels, size, x, y, color);
    }
  }
}

function drawGlyphG(pixels, size, color) {
  const scale = size / 128;
  const ox = Math.round(34 * scale);
  const oy = Math.round(28 * scale);
  const w = Math.round(72 * scale);
  const h = Math.round(72 * scale);
  const bar = Math.max(1, Math.round(14 * scale));

  fillRect(pixels, size, ox, oy, w, bar, color);
  fillRect(pixels, size, ox, oy, bar, h, color);
  fillRect(pixels, size, ox, oy + h - bar, Math.round(w * 0.65), bar, color);
  fillRect(
    pixels,
    size,
    ox + Math.round(w * 0.45),
    oy + Math.round(h * 0.45),
    Math.round(w * 0.55),
    bar,
    color
  );
  fillRect(
    pixels,
    size,
    ox + w - bar,
    oy + Math.round(h * 0.45),
    bar,
    Math.round(h * 0.55),
    color
  );
}

function createIconPng(size) {
  const pixels = new Uint8Array(size * size * 4);
  fillRect(pixels, size, 0, 0, size, size, BACKGROUND);
  drawGlyphG(pixels, size, ACCENT);

  const row = new Uint8Array((1 + size) * 4);
  const raw = new Uint8Array(size * row.length);
  for (let y = 0; y < size; y++) {
    const start = y * row.length;
    raw[start] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = start + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, size, false);
  view.setUint32(4, size, false);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const parts = [
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0)),
  ];

  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 48, 128, 512];
for (const size of sizes) {
  const filename = size === 512 ? "icon-512.png" : `icon-${size}.png`;
  writeFileSync(join(iconsDir, filename), createIconPng(size));
  console.log(`Generated icons/${filename}`);
}
