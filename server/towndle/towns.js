// towns.js - the TOWNDLE town book: parses towns-data-*.js, answers "which place did the viewer type?", and does the clue maths
// (clue color level, great-circle distance in km, compass direction).
//
// A "place" is any Malaysian city, municipality, district or town. Every place belongs to ONE district and ONE state
// (the 3 Federal Territories - Kuala Lumpur, Putrajaya, Labuan - count together as the 14th state).
//
// The color clue (level numbers are kept the same as CITYDLE so the page styles keep working):
//   level 0 = GREEN   the right place                                   (round won)
//   level 1 = YELLOW  the right STATE, but the wrong place
//   level 2 = ORANGE  a DIRECT NEIGHBOUR of the right place            (same district, or a district that touches it - in any state)
//   level 3 = GREY    wrong place, not a neighbour and not in the right state
// A place that is both a neighbour AND in the right state shows ORANGE (the more exact clue wins).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TOWN_DATA_1 } from "./towns-data-1.js";
import { TOWN_DATA_2 } from "./towns-data-2.js";
import { TOWN_DATA_3 } from "./towns-data-3.js";
import { TOWN_DATA_4 } from "./towns-data-4.js";
import { TOWN_BULK_1 } from "./towns-bulk-1.js";
import { TOWN_BULK_2 } from "./towns-bulk-2.js";
import { TOWN_BULK_3 } from "./towns-bulk-3.js";
import { TOWN_BULK_4 } from "./towns-bulk-4.js";
import { TOWN_ADJACENCY } from "./towns-adjacency.js";

// The 14 "states" of the game (13 states + the 3 Federal Territories counted as the 14th).
export const STATE_LIST = [
  { code: "JH", name: "Johor" },
  { code: "KD", name: "Kedah" },
  { code: "KN", name: "Kelantan" },
  { code: "ML", name: "Melaka" },
  { code: "NS", name: "Negeri Sembilan" },
  { code: "PH", name: "Pahang" },
  { code: "PG", name: "Penang" },
  { code: "PK", name: "Perak" },
  { code: "PL", name: "Perlis" },
  { code: "SB", name: "Sabah" },
  { code: "SK", name: "Sarawak" },
  { code: "SL", name: "Selangor" },
  { code: "TR", name: "Terengganu" },
  { code: "FT", name: "Federal Territories" }
];
export const STATE_NAMES = Object.fromEntries(STATE_LIST.map((s) => [s.code, s.name]));
const STATE_CODE_BY_NAME = new Map();
for (const s of STATE_LIST) STATE_CODE_BY_NAME.set(townKey(s.name), s.code);
for (const [alias, code] of [["pulaupinang", "PG"], ["penang", "PG"], ["malacca", "ML"], ["kualalumpur", "FT"], ["putrajaya", "FT"], ["labuan", "FT"],
  ["wilayahpersekutuan", "FT"], ["federalterritory", "FT"], ["federalterritories", "FT"], ["nsembilan", "NS"]]) STATE_CODE_BY_NAME.set(alias, code);

export const TYPE_NAMES = { C: "City", M: "Municipal", D: "District", T: "Town" };

// "Sungai Petani" / "sungai-petani" / "SungaiPetani" all become "sungaipetani"
// Old / alternative spellings are folded together, so "Johor Bahru" = "Johor Baru" = "Johor Baharu", "Ayer Hitam" = "Air Hitam",
// "Telok Intan" = "Teluk Intan", "Tanjong Malim" = "Tanjung Malim", "Kampong" = "Kampung", "Sungei" = "Sungai".
export function townKey(text) {
  return String(text || "").toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "")
    .replace(/bahru|baharu|bharu/g, "baru").replace(/ayer/g, "air").replace(/telok/g, "teluk").replace(/tanjong/g, "tanjung")
    .replace(/kampong/g, "kampung").replace(/sungei/g, "sungai").replace(/kwala/g, "kuala");
}

export const TOWNS = [];              // { key, name, state, stateName, territory, district, type, typeName, lat, lon, tier, typeAs }
export const TOWN_BY_KEY = new Map(); // key (and every alias key) -> place
export const DISTRICTS = new Map();   // district key -> { name, state, seat (place), places: [] }
export const DISTRICT_NEIGHBOURS = new Map(); // district key -> Set of neighbouring district keys

// Ordinary words that are ALSO place names. A viewer's chat comment of exactly one of these words must never be taken for a guess,
// so such places are typed with their state added instead (for example "gurun kedah", "song sarawak") - the page shows that spelling.
const BLOCKED_PLAIN = new Set(["pantai", "labu", "lega", "pusing", "tawar", "kati", "batu", "kota", "pasir", "kuala", "sungai", "bukit", "teluk", "tanjung",
  "padang", "bandar", "kampung", "simpang", "alor", "parit", "lubok", "ayer", "air", "pulau", "pekan", "song", "bau", "jeli", "tenang", "karak", "rantau",
  "gurun", "kuah", "sura", "mela", "dong", "tras", "jeram", "damai", "keramat", "setapak", "tioman", "perlis", "labuan"].filter((w) => w !== "tioman" && w !== "perlis" && w !== "labuan"));

// Everyday chat words (Malay / English / Indonesian) that are ALSO the name of some village. A comment of exactly one of these words is never
// taken for a guess; such a place has to be typed with its state ("sayang perlis"). Keeps the huge GeoNames village list from reacting to chat.
const COMMON_WORDS = new Set(("sayang cinta cantik hebat mantap bagus baik jahat kasih rindu comel handsome love game play hello hai hi halo wow nice good great cool lol haha hehe thanks thank please " +
  "terima kasih selamat pagi malam petang tengah siang makan minum tidur bangun kawan abang kakak adik mama papa ayah ibu anak orang semua habis lagi sudah belum tidak bukan mahu nak boleh jangan tolong " +
  "betul salah benar cuba jawab soalan pilih bantu kalah menang untung rugi putih hitam merah biru hijau kuning besar kecil panjang pendek tinggi rendah jauh dekat lama baru muda tua senang susah mudah " +
  "satu dua tiga empat lima enam tujuh lapan sembilan sepuluh hari bulan tahun minggu esok semalam sekarang nanti tadi mana siapa apa kenapa macam mana bila berapa sini situ sana ini itu yang dan atau " +
  "kerana tetapi juga pula lah kah pun saja sahaja amat sangat paling lebih kurang banyak sikit besar mari pergi balik datang masuk keluar naik turun buka tutup lihat tengok dengar cakap kata beri ambil " +
  "terbaik tercantik pertama kedua ketiga akhir sempurna bahagia gembira sedih marah takut berani kuat lemah cepat lambat panas sejuk basah kering kosong penuh hidup mati rumah sekolah kerja duit harga " +
  "followers follow subscribe share gift rose heart thanks bro sis guys everyone morning night afternoon welcome sorry yes no okay ok maybe next back stop start win lose first last bagus").split(/\s+/).filter(Boolean));
function stateCodeOf(name) {
  const k = townKey(name);
  return STATE_CODE_BY_NAME.get(k) || null;
}

function territoryLabel(rawState, code) {
  return code === "FT" ? rawState : STATE_NAMES[code];
}

function districtKey(name) {
  return townKey(name);
}

function addPlace(rec, aliases) {
  const wantedKey = townKey(rec.name);
  const stateWord = rec.state === "FT" ? rec.territory : rec.stateName; // "Setapak Kuala Lumpur", "Gurun Kedah"
  const stateKey = townKey(rec.name + " " + stateWord);
  const blocked = BLOCKED_PLAIN.has(wantedKey) || COMMON_WORDS.has(wantedKey) || wantedKey.length < 3;
  let key = blocked ? stateKey : wantedKey;
  if (TOWN_BY_KEY.has(key)) key = stateKey; // two places with the same name: the first one keeps the plain name, the other is "name + state"
  if (!key || key.length < 3 || TOWN_BY_KEY.has(key)) return null;
  rec.key = key;
  if (key !== wantedKey) rec.typeAs = rec.name + " " + stateWord;
  TOWNS.push(rec);
  TOWN_BY_KEY.set(key, rec);
  if (!TOWN_BY_KEY.has(stateKey)) TOWN_BY_KEY.set(stateKey, rec); // "name + state" always works too
  const distName = townKey(rec.name + " " + rec.district);
  if (!TOWN_BY_KEY.has(distName) && rec.name !== rec.district) TOWN_BY_KEY.set(distName, rec);
  for (const a of aliases || []) {
    const ak = townKey(a);
    if (ak.length >= 3 && !BLOCKED_PLAIN.has(ak) && !TOWN_BY_KEY.has(ak)) TOWN_BY_KEY.set(ak, rec);
  }
  return rec;
}

const ITEM_RE = /^(.+?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+([123])([CMDT])$/;

function loadBuiltIn(text) {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    const [rawState, district, rest] = trimmed.split("|");
    if (!rest) continue;
    const state = stateCodeOf(rawState);
    if (!state) continue;
    const dk = districtKey(district);
    if (!DISTRICTS.has(dk)) DISTRICTS.set(dk, { name: district.trim(), state, seat: null, places: [] });
    const items = rest.split(";");
    items.forEach((chunk, idx) => {
      const [main, aliasPart] = chunk.split("=");
      const m = main.trim().match(ITEM_RE);
      if (!m) return;
      const rec = {
        name: m[1].trim(), state, stateName: STATE_NAMES[state], territory: territoryLabel(rawState.trim(), state), district: district.trim(),
        districtKey: dk, type: m[5], typeName: TYPE_NAMES[m[5]], lat: Number(m[2]), lon: Number(m[3]), tier: Number(m[4])
      };
      const placed = addPlace(rec, aliasPart ? aliasPart.split(",") : []);
      if (placed) {
        DISTRICTS.get(dk).places.push(placed);
        if (idx === 0) DISTRICTS.get(dk).seat = placed;
      }
    });
  }
}
loadBuiltIn(TOWN_DATA_1);
loadBuiltIn(TOWN_DATA_2);
loadBuiltIn(TOWN_DATA_3);
loadBuiltIn(TOWN_DATA_4);

const R = 6371; // earth radius, km
const rad = (d) => (d * Math.PI) / 180;
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
}

// ---- BULK lists (towns-bulk-*.js): one line per district, only NAMES:   State | District | + Name, Name, Name ...
// These are the many lesser-known and rare places (mukims, townships, small towns, new townships). They have no hand-written coordinates:
// each one is placed at a stable, name-based spot near its district's seat (marked `approx`), so the state / neighbour colors are exact and
// the distance / arrow are only a rough guide (the page shows "≈" for them). A name that already exists is skipped.
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function districtRadiusKm(d) {
  let r = 0;
  for (const p of d.places) if (!p.approx) r = Math.max(r, distanceKm(p, d.seat));
  const borneo = d.state === "SB" || d.state === "SK";
  return Math.min(borneo ? 90 : 35, Math.max(borneo ? 18 : 7, r * 0.9));
}
function approxSpot(d, name) {
  const h = hash32(townKey(name));
  const ang = ((h & 0xffff) / 0xffff) * 2 * Math.PI;
  const frac = 0.3 + 0.7 * (((h >>> 16) & 0xffff) / 0xffff);
  const km = districtRadiusKm(d) * frac;
  const lat = d.seat.lat + (km * Math.cos(ang)) / 111;
  const lon = d.seat.lon + (km * Math.sin(ang)) / (111 * Math.max(0.2, Math.cos(rad(d.seat.lat))));
  return { lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000 };
}
export function addApproxPlace(d, name, tier = 3, type = "T", rawState) {
  const spot = approxSpot(d, name);
  const rec = { name, state: d.state, stateName: STATE_NAMES[d.state], territory: territoryLabel(rawState || d.seat.territory, d.state), district: d.name, districtKey: districtKey(d.name),
    type, typeName: TYPE_NAMES[type], lat: spot.lat, lon: spot.lon, tier, approx: true };
  const placed = addPlace(rec, []);
  if (placed) d.places.push(placed);
  return placed;
}
export const BULK_PROBLEMS = [];
function loadBulk(text) {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("//")) continue;
    const [rawState, district, rest] = t.split("|");
    if (!rest || !rest.trim().startsWith("+")) continue;
    const d = DISTRICTS.get(districtKey(district));
    if (!d || !d.seat) { BULK_PROBLEMS.push("unknown district: " + district.trim()); continue; }
    for (const raw of rest.trim().slice(1).split(",")) {
      const [namePart, aliasPart] = raw.split("=");
      const name = namePart.trim().replace(/\s+/g, " ");
      if (townKey(name).length < 3) continue;
      const placed = addApproxPlace(d, name, 3, "T", rawState.trim());
      if (placed && aliasPart) for (const a of aliasPart.split("/")) { const ak = townKey(a); if (ak.length >= 3 && !BLOCKED_PLAIN.has(ak) && !TOWN_BY_KEY.has(ak)) TOWN_BY_KEY.set(ak, placed); }
    }
  }
}
loadBulk(TOWN_BULK_1);
loadBulk(TOWN_BULK_2);
loadBulk(TOWN_BULK_3);
loadBulk(TOWN_BULK_4);

// a district can also be typed by its own name when no town carries that name (for example "kualamuda", "hululangat")
for (const [dk, d] of DISTRICTS) {
  if (!TOWN_BY_KEY.has(dk) && d.seat && dk.length >= 3 && !BLOCKED_PLAIN.has(dk)) TOWN_BY_KEY.set(dk, d.seat);
}

// ---- district borders ---------------------------------------------------------------------------------------------------
export const ADJACENCY_PROBLEMS = [];
for (const dk of DISTRICTS.keys()) DISTRICT_NEIGHBOURS.set(dk, new Set());
for (const line of TOWN_ADJACENCY.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("//")) continue;
  const [left, right] = t.split(":");
  if (!right) continue;
  const a = districtKey(left);
  if (!DISTRICTS.has(a)) { ADJACENCY_PROBLEMS.push("unknown district: " + left.trim()); continue; }
  for (const n of right.split(",")) {
    const b = districtKey(n);
    if (!b) continue;
    if (!DISTRICTS.has(b)) { ADJACENCY_PROBLEMS.push("unknown district: " + n.trim() + " (in the line of " + left.trim() + ")"); continue; }
    if (a === b) continue;
    DISTRICT_NEIGHBOURS.get(a).add(b);
    DISTRICT_NEIGHBOURS.get(b).add(a); // a border always works both ways
  }
}

// ---- optional extra places in the project's data/ folder -------------------------------------------------------------------
//  1) data/towns-extra.txt : one place per line   Name, State, District (may be empty), Tier 1-3, latitude, longitude [, Type C/M/D/T]
//     State = Johor, Kedah, ... Penang, ... Sarawak, Selangor, Terengganu or Kuala Lumpur / Putrajaya / Labuan.  Lines starting with # are ignored.
//  2) GeoNames: a file named MY.txt (all of Malaysia) or cities500.txt / cities1000.txt ... from download.geonames.org/export/dump/ . Only the populated
//     places (feature class P) of Malaysia are read. Their state and district are copied from the NEAREST place of the built-in list.
export const LOAD_REPORT = { builtIn: TOWNS.length, geonames: 0, extra: 0, files: [] };

function nearestBuiltIn(lat, lon, builtInCount, stateCode) {
  let best = null, bestD = Infinity;
  const cosLat = Math.cos(rad(lat));
  for (let i = 0; i < builtInCount; i++) {
    const p = TOWNS[i];
    if (p.approx) continue; // positions of bulk places are only approximate - never use them to place other places
    if (stateCode && p.state !== stateCode) continue;
    const dy = p.lat - lat, dx = (p.lon - lon) * cosLat;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best ? { place: best, km: Math.sqrt(bestD) * 111 } : null;
}

// Adds the Malaysian populated places (feature class P) of a GeoNames dump (MY.txt or cities*.txt). State and district come from the NEAREST place with a
// hand-checked position; the place is tier 3 / type Town / approximate. Returns { rows, added }. Safe to call while the game runs.
export function importGeonamesText(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const c = line.split("\t");
    if (c.length < 15 || c[8] !== "MY" || c[6] !== "P") continue;
    const lat = Number(c[4]), lon = Number(c[5]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    rows.push({ name: (c[2] || c[1]).trim(), lat, lon, pop: Number(c[14]) || 0 });
  }
  rows.sort((a, b) => b.pop - a.pop);
  const baseCount = TOWNS.length;
  let added = 0;
  for (const r of rows) {
    const name = r.name.replace(/\s+/g, " ");
    const key = townKey(name);
    if (key.length < 4 || key.length > 40 || TOWN_BY_KEY.has(key) || BLOCKED_PLAIN.has(key) || COMMON_WORDS.has(key)) continue;
    const near = nearestBuiltIn(r.lat, r.lon, baseCount, null);
    if (!near || near.km > 120) continue; // too far from every known place: state unknown, skip
    const base = near.place;
    const rec = { name, state: base.state, stateName: base.stateName, territory: base.territory, district: base.district, districtKey: base.districtKey,
      type: "T", typeName: TYPE_NAMES.T, lat: r.lat, lon: r.lon, tier: 3 };
    const placed = addPlace(rec, []);
    if (placed) { DISTRICTS.get(base.districtKey).places.push(placed); added++; LOAD_REPORT.geonames++; }
  }
  return { rows: rows.length, added };
}

function loadExternalFiles() {
  let dir;
  try { dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data"); } catch (e) { return; }
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { return; }
  const builtInCount = TOWNS.length; // curated + bulk places (the nearest one decides state / district of an imported place)

  // 1) the simple extra list
  const extra = names.find((n) => /^towns-extra\.(txt|csv)$/i.test(n));
  if (extra) {
    try {
      for (const line of fs.readFileSync(path.join(dir, extra), "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const p = t.split(",").map((x) => x.trim());
        if (p.length < 2 || !p[0]) continue;
        const state = stateCodeOf(p[1]);
        if (!state) continue;
        const hasPos = p.length >= 6 && p[4] !== "" && p[5] !== "" && Number.isFinite(Number(p[4])) && Number.isFinite(Number(p[5]));
        const lat = Number(p[4]), lon = Number(p[5]);
        const tier = Math.min(3, Math.max(1, Math.round(Number(p[3]) || 3)));
        const type = /^[CMDT]$/i.test(p[6] || "") ? p[6].toUpperCase() : "T";
        let dist = p[2] ? DISTRICTS.get(districtKey(p[2])) : null;
        if (!dist && hasPos) { const near = nearestBuiltIn(lat, lon, builtInCount, state); dist = near ? DISTRICTS.get(near.place.districtKey) : null; }
        if (!dist || dist.state !== state) continue;
        if (!hasPos) { // "Name, State, District[, Tier]" : placed near the district seat (approximate)
          if (addApproxPlace(dist, p[0], tier, type, p[1])) LOAD_REPORT.extra++;
          continue;
        }
        const rec = { name: p[0], state, stateName: STATE_NAMES[state], territory: territoryLabel(p[1], state), district: dist.name, districtKey: districtKey(dist.name),
          type, typeName: TYPE_NAMES[type], lat, lon, tier };
        const placed = addPlace(rec, []);
        if (placed) { dist.places.push(placed); LOAD_REPORT.extra++; }
      }
      LOAD_REPORT.files.push(extra);
    } catch (e) { console.error("[TOWNDLE] could not read " + extra + ": " + e.message); }
  }

  // 2) GeoNames files (MY.txt, cities*.txt) - Malaysian populated places only
  for (const f of names.filter((n) => /^(MY|cities.*)\.txt$/i.test(n) && !/^cities-extra/i.test(n))) {
    try {
      const added = importGeonamesText(fs.readFileSync(path.join(dir, f), "utf8"));
      if (added.rows) LOAD_REPORT.files.push(f + " (" + added.rows + " Malaysian places read, " + added.added + " new)");
    } catch (e) { console.error("[TOWNDLE] could not read " + f + ": " + e.message); }
  }
}
loadExternalFiles();

export function findTown(text) {
  return TOWN_BY_KEY.get(townKey(text)) || null;
}

// compass bearing (degrees, 0 = north, clockwise) from the GUESS toward the SECRET place - "where to guess next"
export function bearingDeg(from, to) {
  const y = Math.sin(rad(to.lon - from.lon)) * Math.cos(rad(to.lat));
  const x = Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) - Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lon - from.lon));
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

// true when the two places are direct neighbours: the same district, or districts that touch each other
export function areNeighbours(a, b) {
  if (a.districtKey === b.districtKey) return true;
  const set = DISTRICT_NEIGHBOURS.get(a.districtKey);
  return Boolean(set && set.has(b.districtKey));
}

export function levelOf(guess, secret) {
  if (guess.key === secret.key) return 0;
  if (areNeighbours(guess, secret)) return 2; // ORANGE - a direct neighbour (wins over "same state")
  if (guess.state === secret.state) return 1; // YELLOW - right state
  return 3;                                   // GREY
}

export function clueOf(guess, secret) {
  return { level: levelOf(guess, secret), km: distanceKm(guess, secret), bearing: guess.key === secret.key ? null : bearingDeg(guess, secret) };
}

// ---- forgiving name lookup ---------------------------------------------------------------------------------------------------
// A viewer types "Sg Petani", "Bandar Baru Bangi", "Pekan Pontian", "Kg Pandan", "Kota Kinabalu city" ... : abbreviations are spelled out and
// generic words (bandar / pekan / taman / kampung / mukim / daerah / city / town ...) are tried with and without, so a real place is not refused.
const ABBREV = { sg: "sungai", sgi: "sungai", kg: "kampung", kmpg: "kampung", tg: "tanjung", tj: "tanjong", bt: "batu", pkn: "pekan", bdr: "bandar", bndr: "bandar",
  tmn: "taman", tlk: "teluk", tel: "teluk", bkt: "bukit", pdg: "padang", sbg: "sabak", pnt: "pantai", lbk: "lubok", pl: "pulau", plau: "pulau", p: "pulau", jln: "jalan" };
const SHORT_NAMES = { jb: "johorbahru", kl: "kualalumpur", kk: "kotakinabalu", pj: "petalingjaya", kb: "kotabharu", kt: "kualaterengganu", sj: "subangjaya", sa: "shahalam" };
const LEAD_WORDS = new Set(["bandar", "pekan", "taman", "kampung", "kampong", "mukim", "daerah", "district", "town", "city", "the", "di", "ke", "ni"]);
const TAIL_WORDS = new Set(["city", "town", "district", "daerah", "mukim", "bandar", "pekan", "municipal", "municipality"]);
export function lookupTown(raw) {
  const text = String(raw || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (text.length < 2 || text.length > 60) return null;
  let tokens = text.split(/[^a-z]+/).filter(Boolean);
  if (!tokens.length || tokens.length > 6) return null;
  const direct = TOWN_BY_KEY.get(townKey(tokens.join("")));
  if (direct) return direct;
  if (tokens.length === 1 && SHORT_NAMES[tokens[0]]) return TOWN_BY_KEY.get(townKey(SHORT_NAMES[tokens[0]])) || null;
  tokens = tokens.map((t) => ABBREV[t] || t);
  const variants = new Set([townKey(tokens.join(""))]);
  let core = tokens.slice();
  while (core.length > 1 && LEAD_WORDS.has(core[0])) core = core.slice(1);
  while (core.length > 1 && TAIL_WORDS.has(core[core.length - 1])) core = core.slice(0, -1);
  const coreKey = townKey(core.join(""));
  variants.add(coreKey);
  if (coreKey.length >= 3) { variants.add("bandar" + coreKey); variants.add("pekan" + coreKey); variants.add("taman" + coreKey); }
  if (core[0] === "baru" || core[0] === "baharu") { variants.add("bandar" + coreKey); }
  for (const v of variants) { const hit = TOWN_BY_KEY.get(v); if (hit) return hit; }
  return null;
}

// ---- places added while the game runs (the host's "Add place" button) ---------------------------------------------------------------
export function districtsOfState(stateCode) {
  return [...DISTRICTS.values()].filter((d) => d.state === stateCode).map((d) => d.name).sort();
}
export function addRuntimePlace({ name, stateCode, district, tier = 3, type = "T" }) {
  const clean = String(name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (townKey(clean).length < 3) return { ok: false, error: "That name is too short." };
  const d = DISTRICTS.get(districtKey(district));
  if (!d || d.state !== stateCode) return { ok: false, error: "Pick the state and then one of its districts." };
  if (TOWN_BY_KEY.has(townKey(clean))) return { ok: false, error: "That name is already in the list." };
  const placed = addApproxPlace(d, clean, Math.min(3, Math.max(1, tier)), "CMDT".includes(type) ? type : "T");
  if (!placed) return { ok: false, error: "Could not add that place." };
  try { // remember it for the next start: data/towns-extra.txt  (Name, State, District, Tier)
    const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "towns-extra.txt"), `${placed.name}, ${placed.state === "FT" ? placed.territory : placed.stateName}, ${d.name}, ${placed.tier}\n`);
  } catch (e) { /* read-only disk: the place still works until the next restart */ }
  return { ok: true, place: placed };
}

// region / kind helpers for the hints
const REGION_OF_STATE = { PL: "Northern Peninsular Malaysia", KD: "Northern Peninsular Malaysia", PG: "Northern Peninsular Malaysia", PK: "Northern Peninsular Malaysia",
  SL: "Central Peninsular Malaysia (Klang Valley area)", FT: "Central Peninsular Malaysia or Borneo (Federal Territory)", NS: "Southern Peninsular Malaysia", ML: "Southern Peninsular Malaysia", JH: "Southern Peninsular Malaysia",
  KN: "East Coast of Peninsular Malaysia", TR: "East Coast of Peninsular Malaysia", PH: "East Coast of Peninsular Malaysia", SB: "East Malaysia (Borneo)", SK: "East Malaysia (Borneo)" };
export function regionOf(p) {
  if (p.state === "FT") return p.territory === "Labuan" ? "East Malaysia (Borneo island territory)" : "Central Peninsular Malaysia (Federal Territory)";
  return REGION_OF_STATE[p.state] || "Malaysia";
}
export function districtNeighbourNames(p) {
  const set = DISTRICT_NEIGHBOURS.get(p.districtKey);
  return set ? [...set].map((k) => DISTRICTS.get(k).name) : [];
}
