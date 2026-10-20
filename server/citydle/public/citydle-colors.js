/* ==========================================================================
   CITYDLE COLORS (update 95)
   One place that owns every CITYDLE color. The server keeps the host's choices (server/shared/citydle-colors-store.js) and sends them
   in every state; this script turns them into CSS variables on <html>:
        --cd-green  --cd-green-ink  --cd-green-dark      (same for yellow, orange, gray, dir, km)   --cd-frame   --cd-ring
   The tiles, the badges AND the legend (/shared/legend.js reads the very same variables) all use those variables, so a color
   changed in Settings -> City colors shows in the game and in the legend at once. The legend's own chip color pickers write here too
   (CitydleColors.set), so changing a color in the legend changes the game as well.
   ========================================================================== */
(function () {
  "use strict";

  var DEFAULTS = {
    greenBg: "#4caf50", greenInk: "#ffffff", yellowBg: "#e3b505", yellowInk: "#1b1b1f",
    orangeBg: "#ee7b30", orangeInk: "#1b1b1f", grayBg: "#8a8a92", grayInk: "#121214",
    dirBg: "#3c3c40", dirInk: "#f3f1e6", kmBg: "#3c3c40", kmInk: "#f3f1e6", frame: "#3c3c40", ring: "#ffd700"
  };
  var cur = {};
  Object.keys(DEFAULTS).forEach(function (k) { cur[k] = DEFAULTS[k]; });
  var sender = null;
  var inputs = {}; // part key -> <input type=color> of the Settings card (filled when the card is built)

  // legend entry id -> the color part it shows
  var LEGEND_KEYS = { green: "green", score: "green", yellow: "yellow", orange: "orange", gray: "gray", list: "gray", arrow: "dir", km: "km", latest: "frame" };

  function clampByte(n) { return Math.max(0, Math.min(255, Math.round(n))); }
  function darken(hex, f) {
    var n = parseInt(String(hex).slice(1), 16);
    var r = clampByte(((n >> 16) & 255) * f), g = clampByte(((n >> 8) & 255) * f), b = clampByte((n & 255) * f);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function paint() {
    var root = document.documentElement.style;
    [["green", "greenBg", "greenInk"], ["yellow", "yellowBg", "yellowInk"], ["orange", "orangeBg", "orangeInk"], ["gray", "grayBg", "grayInk"],
     ["dir", "dirBg", "dirInk"], ["km", "kmBg", "kmInk"]].forEach(function (p) {
      root.setProperty("--cd-" + p[0], cur[p[1]]);
      root.setProperty("--cd-" + p[0] + "-ink", cur[p[2]]);
      root.setProperty("--cd-" + p[0] + "-dark", darken(cur[p[1]], 0.72));
    });
    root.setProperty("--cd-frame", cur.frame);
    root.setProperty("--cd-frame-ink", "#ffffff");
    root.setProperty("--cd-frame-dark", darken(cur.frame, 0.72));
    root.setProperty("--cd-ring", cur.ring);
    syncInputs();
    try { window.dispatchEvent(new CustomEvent("citydle-colors", { detail: cur })); } catch (e) { /* old browser */ }
  }

  function cache() { try { localStorage.setItem("citydleColors", JSON.stringify(cur)); } catch (e) { /* private mode */ } }
  function loadCache() {
    try {
      var t = JSON.parse(localStorage.getItem("citydleColors") || "null");
      if (t) Object.keys(DEFAULTS).forEach(function (k) { if (/^#[0-9a-f]{6}$/i.test(t[k])) cur[k] = t[k].toLowerCase(); });
    } catch (e) { /* ignore */ }
  }
  loadCache();
  paint(); // no flash on reload: the last known colors are applied immediately

  // the server's colors (called with every state)
  function update(colors, send) {
    if (send) sender = send;
    if (!colors) return;
    var changed = false;
    Object.keys(DEFAULTS).forEach(function (k) {
      var v = colors[k];
      if (/^#[0-9a-f]{6}$/i.test(v) && cur[k] !== v.toLowerCase()) { cur[k] = v.toLowerCase(); changed = true; }
    });
    if (changed) { cache(); paint(); }
  }

  function push(patch) {
    var changed = false;
    Object.keys(patch).forEach(function (k) {
      if (!(k in DEFAULTS)) return;
      var v = patch[k] === null ? DEFAULTS[k] : patch[k];
      if (/^#[0-9a-f]{6}$/i.test(v) && cur[k] !== v.toLowerCase()) { cur[k] = v.toLowerCase(); changed = true; }
    });
    if (changed) { cache(); paint(); }
    if (sender) sender("set_colors", patch);
  }

  /* ---------------------------------------------------------------- legend bridge */
  function legendKey(id) { return LEGEND_KEYS[id] || null; }
  function getPart(part) { return cur[part + "Bg"] || cur[part] || "#888888"; }
  function setLegendPart(part, hex) { var o = {}; o[part === "frame" ? "frame" : part + "Bg"] = hex; push(o); }
  function resetLegendPart(part) { var o = {}; o[part === "frame" ? "frame" : part + "Bg"] = null; push(o); }

  /* ---------------------------------------------------------------- Settings -> City colors */
  var ROWS = [
    { h: "City tiles", rows: [
      { l: "Green — the right city", bg: "greenBg", ink: "greenInk" },
      { l: "Yellow — right country, wrong city", bg: "yellowBg", ink: "yellowInk" },
      { l: "Orange — right continent, wrong country", bg: "orangeBg", ink: "orangeInk" },
      { l: "Grey — wrong continent", bg: "grayBg", ink: "grayInk" } ] },
    { h: "Direction and distance", rows: [
      { l: "Direction arrow badge", bg: "dirBg", ink: "dirInk" },
      { l: "Distance (km) badge", bg: "kmBg", ink: "kmInk" } ] },
    { h: "Newest guess and winner", rows: [
      { l: "Frame around the newest guess (top row)", bg: "frame" },
      { l: "Ring around the winning row", bg: "ring" } ] }
  ];
  var PRESETS = [
    ["Classic (standard)", null],
    ["Color-blind friendly", { greenBg: "#1e73e8", greenInk: "#ffffff", yellowBg: "#f2c230", yellowInk: "#1b1b1f", orangeBg: "#e8590c", orangeInk: "#ffffff", grayBg: "#8b8f9e", grayInk: "#ffffff", dirBg: "#243b6b", kmBg: "#243b6b", frame: "#243b6b" }],
    ["High contrast", { greenBg: "#00a651", greenInk: "#000000", yellowBg: "#ffe600", yellowInk: "#000000", orangeBg: "#ff7a00", orangeInk: "#000000", grayBg: "#cfcfcf", grayInk: "#000000", dirBg: "#000000", dirInk: "#ffffff", kmBg: "#000000", kmInk: "#ffffff", frame: "#000000" }],
    ["Soft pastel", { greenBg: "#9fd8a3", greenInk: "#1f3d22", yellowBg: "#f6e08a", yellowInk: "#4a3d00", orangeBg: "#f7bb92", orangeInk: "#5a2a08", grayBg: "#d3d3da", grayInk: "#33333a", dirBg: "#6b6f86", dirInk: "#ffffff", kmBg: "#6b6f86", kmInk: "#ffffff", frame: "#6b6f86" }],
    ["Night", { greenBg: "#2e7d32", greenInk: "#e8f5e9", yellowBg: "#a98200", yellowInk: "#fff8e1", orangeBg: "#b45514", orangeInk: "#fff3e8", grayBg: "#4a4a52", grayInk: "#e4e4ea", dirBg: "#111114", dirInk: "#f3f1e6", kmBg: "#111114", kmInk: "#f3f1e6", frame: "#111114" }]
  ];

  function syncInputs() {
    Object.keys(inputs).forEach(function (k) {
      if (document.activeElement !== inputs[k] && inputs[k].value !== cur[k]) inputs[k].value = cur[k];
    });
    var body = document.getElementById("cdColorsBody");
    if (body) body.querySelectorAll(".cdcSample").forEach(function (s) {
      s.style.background = cur[s.dataset.bg]; if (s.dataset.ink) s.style.color = cur[s.dataset.ink];
    });
  }

  function build() {
    var body = document.getElementById("cdColorsBody");
    if (!body || body.dataset.built) return;
    body.dataset.built = "1";
    var pre = document.createElement("div"); pre.className = "cdcPresets";
    PRESETS.forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btnGhost cdcBtn"; b.textContent = p[0];
      b.addEventListener("click", function () {
        var patch = {};
        Object.keys(DEFAULTS).forEach(function (k) { patch[k] = p[1] && p[1][k] ? p[1][k] : null; });
        push(patch);
      });
      pre.appendChild(b);
    });
    body.appendChild(pre);
    ROWS.forEach(function (grp) {
      var box = document.createElement("div"); box.className = "cdcGroup";
      var h = document.createElement("h5"); h.textContent = grp.h; box.appendChild(h);
      grp.rows.forEach(function (r) {
        var row = document.createElement("div"); row.className = "cdcRow";
        var sample = document.createElement("span"); sample.className = "cdcSample"; sample.dataset.bg = r.bg; if (r.ink) sample.dataset.ink = r.ink;
        sample.textContent = r.ink ? "Aa" : "";
        var lab = document.createElement("span"); lab.className = "cdcLabel"; lab.textContent = r.l;
        row.appendChild(sample); row.appendChild(lab);
        [[r.bg, r.ink ? "Tile" : "Color"], r.ink ? [r.ink, "Text"] : null].forEach(function (pair) {
          if (!pair) return;
          var wrap = document.createElement("label"); wrap.className = "cdcPick";
          var cap = document.createElement("small"); cap.textContent = pair[1];
          var inp = document.createElement("input"); inp.type = "color"; inp.value = cur[pair[0]];
          inp.addEventListener("input", function () { var o = {}; o[pair[0]] = inp.value; push(o); });
          inputs[pair[0]] = inp;
          wrap.appendChild(cap); wrap.appendChild(inp); row.appendChild(wrap);
        });
        var rs = document.createElement("button"); rs.type = "button"; rs.className = "cdcReset"; rs.title = "Back to the standard color"; rs.textContent = "↺";
        rs.addEventListener("click", function () { var o = {}; o[r.bg] = null; if (r.ink) o[r.ink] = null; push(o); });
        row.appendChild(rs);
        box.appendChild(row);
      });
      body.appendChild(box);
    });
    var all = document.createElement("button"); all.type = "button"; all.className = "btn btnGhost"; all.textContent = "Reset all CITYDLE colors";
    all.addEventListener("click", function () { var o = {}; Object.keys(DEFAULTS).forEach(function (k) { o[k] = null; }); push(o); if (sender) sender("reset_colors", {}); });
    body.appendChild(all);
    syncInputs();
  }

  window.CitydleColors = { update: update, build: build, set: push, legendKey: legendKey, getPart: getPart, setLegendPart: setLegendPart, resetLegendPart: resetLegendPart, DEFAULTS: DEFAULTS };
})();
