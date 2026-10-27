// geonames-fetch.js - downloads the free GeoNames list of Malaysian places (https://download.geonames.org/export/dump/MY.zip), unpacks MY.txt
// (no extra npm package needed) and saves it in the project's data/ folder. Used by `npm run import:towns` and, once, by the TOWNDLE server on its first
// start when the computer is online (set TOWNDLE_AUTO_GEONAMES=0 in .env to switch that off).
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

export const GEONAMES_URL = "https://download.geonames.org/export/dump/MY.zip";
export const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");

// pulls one file out of a .zip held in memory (stored or deflated entries)
export function extractFromZip(buf, wanted) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip file");
  let pos = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const method = buf.readUInt16LE(pos + 10);
    const compSize = buf.readUInt32LE(pos + 20);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLen);
    if (name === wanted) {
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);
      return method === 8 ? zlib.inflateRawSync(data) : data;
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(wanted + " not found inside the zip");
}

export async function downloadGeonamesMY(dataDir = DATA_DIR) {
  const res = await fetch(GEONAMES_URL, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error("GeoNames answered HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const text = extractFromZip(buf, "MY.txt").toString("utf8");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "MY.txt"), text);
  return text;
}

export function hasGeonamesFile(dataDir = DATA_DIR) {
  try { return fs.readdirSync(dataDir).some((n) => /^MY\.txt$/i.test(n)); } catch (e) { return false; }
}
