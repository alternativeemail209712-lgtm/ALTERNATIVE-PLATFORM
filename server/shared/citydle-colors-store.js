// ===================================================================
// CITYDLE COLORS STORE  (update 95)
// The host's colors for every part of CITYDLE: the four city tiles (green / yellow / orange / grey, each with its text color),
// the direction badge, the distance badge, the frame of the newest guess and the ring of the winning row.
// One shared look for every connected screen AND for the legend (the legend reads the very same CSS variables).
// Written to data/citydle-colors.json so it survives a restart (a read-only disk is fine: it still works for this run).
// ===================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "citydle-colors.json");

export const DEFAULT_COLORS = {
  greenBg: "#4caf50", greenInk: "#ffffff",     // the right city
  yellowBg: "#e3b505", yellowInk: "#1b1b1f",   // right country, wrong city
  orangeBg: "#ee7b30", orangeInk: "#1b1b1f",   // right continent, wrong country
  grayBg: "#8a8a92", grayInk: "#121214",       // wrong continent
  dirBg: "#3c3c40", dirInk: "#f3f1e6",         // the direction arrow badge
  kmBg: "#3c3c40", kmInk: "#f3f1e6",           // the distance badge
  frame: "#3c3c40",                            // the frame around the newest guess
  ring: "#ffd700"                              // the ring around the winning row
};

const colors = { ...DEFAULT_COLORS };
let saveTimer = null;

function clean(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value)) ? String(value).toLowerCase() : undefined;
}

try {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(DEFAULT_COLORS)) {
      const v = clean(raw[k]);
      if (v) colors[k] = v;
    }
  }
} catch (e) {
  // first run / unreadable file: the standard colors stay
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(colors, null, 2));
    } catch (e) {
      // read-only disk - ignore
    }
  }, 300);
  if (saveTimer.unref) saveTimer.unref();
}

export function getColors() {
  return { ...colors };
}

// patch = { greenBg: "#112233", ... } - unknown keys / invalid values are ignored. A value of null resets that one color.
export function patchColors(patch) {
  if (patch && typeof patch === "object") {
    for (const k of Object.keys(patch)) {
      if (!(k in DEFAULT_COLORS)) continue;
      if (patch[k] === null) { colors[k] = DEFAULT_COLORS[k]; continue; }
      const v = clean(patch[k]);
      if (v) colors[k] = v;
    }
    scheduleSave();
  }
  return getColors();
}

export function resetColors() {
  Object.assign(colors, DEFAULT_COLORS);
  scheduleSave();
  return getColors();
}
