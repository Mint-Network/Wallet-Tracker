/**
 * Generates minimal icon.ico for Tauri Windows build.
 * Run from frontend: node scripts/generate-icons.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const iconsDir = path.join(__dirname, "..", "src-tauri", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

// Minimal valid 32x32 ICO (one image, 32bpp) for tauri-build on Windows
const BMP_HEADER_SIZE = 40;
const PIXEL_DATA_SIZE = 32 * 32 * 4;
const IMAGE_SIZE = BMP_HEADER_SIZE + PIXEL_DATA_SIZE;
const OFFSET = 6 + 16;

const buf = Buffer.alloc(6 + 16 + IMAGE_SIZE);
let pos = 0;

// ICONDIR
buf.writeUInt16LE(0, pos); pos += 2;
buf.writeUInt16LE(1, pos); pos += 2;
buf.writeUInt16LE(1, pos); pos += 2;

// ICONDIRENTRY: 32x32, 32bpp
buf.writeUInt8(32, pos); pos += 1;
buf.writeUInt8(32, pos); pos += 1;
buf.writeUInt8(0, pos); pos += 1;
buf.writeUInt8(0, pos); pos += 1;
buf.writeUInt16LE(1, pos); pos += 2;
buf.writeUInt16LE(32, pos); pos += 2;
buf.writeUInt32LE(IMAGE_SIZE, pos); pos += 4;
buf.writeUInt32LE(OFFSET, pos); pos += 4;

// BITMAPINFOHEADER (40 bytes)
buf.writeUInt32LE(40, pos); pos += 4;
buf.writeInt32LE(32, pos); pos += 4;
buf.writeInt32LE(32, pos); pos += 4;
buf.writeUInt16LE(1, pos); pos += 2;
buf.writeUInt16LE(32, pos); pos += 2;
buf.writeUInt32LE(0, pos); pos += 4;
buf.writeUInt32LE(0, pos); pos += 4;
buf.writeInt32LE(0, pos); pos += 4;
buf.writeInt32LE(0, pos); pos += 4;
buf.writeUInt32LE(0, pos); pos += 4;
buf.writeUInt32LE(0, pos); pos += 4;

// Pixel data (32x32 BGRA, bottom-up)
for (let y = 31; y >= 0; y--) {
  for (let x = 0; x < 32; x++) {
    buf.writeUInt8(0x60, pos); pos += 1;
    buf.writeUInt8(0x65, pos); pos += 1;
    buf.writeUInt8(0x8b, pos); pos += 1;
    buf.writeUInt8(0xff, pos); pos += 1;
  }
}

fs.writeFileSync(path.join(iconsDir, "icon.ico"), buf);
console.log("Created src-tauri/icons/icon.ico");
