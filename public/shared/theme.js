/* ==========================================================================
   PLATFORM THEME SYSTEM — apply / persist / wire up <select data-theme-select>
   Shared by the hub and EVERY game, so a theme picked on any one page carries
   over to all the others (stored in localStorage).

   Two kinds of choices live in the same "Appearance" dropdown:
     1. the 6 plain colors (Cream, Sky Blue, Meadow Green, Blossom Pink, Lavender Violet, Honey Gold)
        - defined in /shared/theme.css as [data-theme="..."].
     2. the "Box colors & look" designs (update 120): 15 cute scrapbook looks inspired by the
        BOXDLE cover picture (Strawberry, Lavender, Mint, Peach, Sky, Night, Bubblegum, Lemon, Ocean,
        Cocoa, Sakura, Matcha, Coral, Blueberry, Cotton Candy).
        - each look is ONE palette of 11 colors. For every game except BOXDLE the palette is turned
          into the same --theme-* tokens the plain colors use (so every game picks it up with no
          per-game work) plus a few --look-* extras used by the graph-paper / stitched decoration
          in theme.css. BOXDLE uses the palette directly for its own boxes, tiles and title.
   ========================================================================== */
(function () {
  var PLAIN = ["cream", "blue", "green", "pink", "violet", "honey"];
  var STORAGE_KEY = "platformTheme";

  // key order: page, card, cardBorder, clockBox, gridBox, wordsBox, tile, tileInk, ink, accent, navy
  var KEYS = ["page", "card", "cardBorder", "clockBox", "gridBox", "wordsBox", "tile", "tileInk", "ink", "accent", "navy"];
  var LOOK_DEFS = [
    ["strawberry", "🍓 Strawberry",   "#fbf3e4", "#fff8ec", "#f4a6be", "#ede4fa", "#ffe9ef", "#fff2cf", "#ffffff", "#1f2a5c", "#2b2a4c", "#e8708f", "#1f2a5c"],
    ["lavender",   "💜 Lavender",     "#f4eefc", "#fbf7ff", "#b9a2e8", "#e6dcf7", "#efe6fb", "#fdf1ff", "#ffffff", "#3b2a78", "#33284f", "#8f6fdc", "#3b2a78"],
    ["mint",       "🍃 Mint",         "#eefaf3", "#f8fffb", "#7fcfa3", "#d9f3e6", "#e6f8ef", "#fffbe0", "#ffffff", "#1c5a43", "#25443a", "#33b383", "#1c5a43"],
    ["peach",      "🍑 Peach",        "#fff1e6", "#fffaf5", "#f6b08a", "#ffe3d1", "#fff0e0", "#fff7d6", "#ffffff", "#7a3320", "#4a2e26", "#f0824f", "#7a3320"],
    ["sky",        "☁️ Sky",          "#eaf4ff", "#f8fbff", "#8ec3f0", "#dcecfc", "#e5f1ff", "#fff6d9", "#ffffff", "#1d3f78", "#25365a", "#4a9be0", "#1d3f78"],
    ["night",      "🌙 Night",        "#1b1b3a", "#262650", "#8a7be0", "#303066", "#2b2b5c", "#34305f", "#3b3b78", "#ffffff", "#f1efff", "#ff8fb4", "#ffd6e6"],
    ["bubblegum",  "🍬 Bubblegum",    "#fff0f7", "#fffafd", "#ff8fc4", "#e4f4ff", "#ffe3f1", "#f3ecff", "#ffffff", "#7a1f5c", "#4a2340", "#ff5fa8", "#8a1f66"],
    ["lemon",      "🍋 Lemon Cream",  "#fffbe0", "#fffdf0", "#f0cf4d", "#e7f3d4", "#fff3b8", "#ffeede", "#fffdf5", "#5e4a00", "#4a3f12", "#e6a800", "#6b5300"],
    ["ocean",      "🌊 Ocean",        "#e3f7f6", "#f4fffe", "#4fc1c1", "#cfeef0", "#d6f2f1", "#fff7e0", "#ffffff", "#0b4f5c", "#17434d", "#1fa5ad", "#0b4f5c"],
    ["cocoa",      "🧸 Cocoa Bear",   "#f6ebdf", "#fff8f0", "#c99a72", "#ecd8c4", "#f3e1cd", "#fdf0d2", "#fffaf3", "#5a3520", "#4a3224", "#b8744a", "#5a3520"],
    ["sakura",     "🌸 Sakura",       "#fdeef0", "#fff8f9", "#f3a5b5", "#fbe0e6", "#fde6ea", "#f2f0ff", "#ffffff", "#8a2d48", "#55303a", "#ec7b96", "#8a2d48"],
    ["matcha",     "🍵 Matcha",       "#f0f5e1", "#fafdf0", "#9bbf5a", "#e1edc6", "#e8f2d2", "#fdf6dc", "#ffffff", "#34521a", "#34431f", "#7aa83a", "#34521a"],
    ["coral",      "🧡 Coral Sunset", "#fff0e8", "#fff9f5", "#ff9a7a", "#ffe0d4", "#ffe6da", "#fff3c9", "#ffffff", "#8a2a14", "#55291d", "#ff6b4a", "#8a2a14"],
    ["blueberry",  "🫐 Blueberry",    "#eceefc", "#f8f8ff", "#8b93e6", "#dcdffa", "#e3e6fb", "#f6efff", "#ffffff", "#25306e", "#2a3060", "#5b6bd6", "#25306e"],
    ["cotton",     "🍭 Cotton Candy", "#f3f0ff", "#fcfaff", "#b8a9f0", "#fde0f0", "#e0f0ff", "#e8fff4", "#ffffff", "#4a3a8a", "#3d3566", "#ff8fc8", "#4a3a8a"]
  ];

  var LOOKS = LOOK_DEFS.map(function (d) {
    var c = {};
    for (var i = 0; i < KEYS.length; i++) c[KEYS[i]] = d[i + 2];
    return { id: d[0], theme: "look-" + d[0], name: d[1], c: c };
  });
  var THEMES = PLAIN.concat(LOOKS.map(function (l) { return l.theme; }));

  // the 6 plain colors expressed as the same 11-color palette (BOXDLE uses this so the plain colors work there too)
  var PLAIN_PALETTES = {
    cream:  { page: "#fff3dc", card: "#fffbf2", cardBorder: "#d9be93", clockBox: "#f2e4c8", gridBox: "#f5e3c0", wordsBox: "#fff3dc", tile: "#ffffff", tileInk: "#6b4423", ink: "#5b4636", accent: "#d9a441", navy: "#6b4423" },
    blue:   { page: "#dcf0fa", card: "#f2fafd", cardBorder: "#6fafcb", clockBox: "#dceff7", gridBox: "#b9e0f2", wordsBox: "#dcf0fa", tile: "#ffffff", tileInk: "#1e5c7a", ink: "#5b4636", accent: "#3a9ac4", navy: "#1e5c7a" },
    green:  { page: "#e4f5dc", card: "#f4fbf0", cardBorder: "#6fa867", clockBox: "#ddeed2", gridBox: "#c4e7b4", wordsBox: "#e4f5dc", tile: "#ffffff", tileInk: "#2e5b26", ink: "#5b4636", accent: "#4f9d45", navy: "#2e5b26" },
    pink:   { page: "#fce3ee", card: "#fff6fa", cardBorder: "#d9678d", clockBox: "#fadce7", gridBox: "#f6c0d9", wordsBox: "#fce3ee", tile: "#ffffff", tileInk: "#8e2e52", ink: "#5b4636", accent: "#d9678d", navy: "#8e2e52" },
    violet: { page: "#eee1fa", card: "#f9f4fe", cardBorder: "#9c6fd1", clockBox: "#e9dbf7", gridBox: "#d9bef2", wordsBox: "#eee1fa", tile: "#ffffff", tileInk: "#4e2e78", ink: "#5b4636", accent: "#9c6fd1", navy: "#4e2e78" },
    honey:  { page: "#fdebbd", card: "#fffbef", cardBorder: "#d9a72e", clockBox: "#f7e7be", gridBox: "#fbd57f", wordsBox: "#fdebbd", tile: "#ffffff", tileInk: "#7a5109", ink: "#5b4636", accent: "#d9a72e", navy: "#7a5109" }
  };

  var listeners = [];
  var current = "cream";

  // ---- small color helpers ----
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbHex(r) { return "#" + r.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); }).join(""); }
  function mix(a, b, t) { var x = hexRgb(a), y = hexRgb(b); return rgbHex([0, 1, 2].map(function (i) { return x[i] * (1 - t) + y[i] * t; })); }
  function lum(h) { return hexRgb(h).reduce(function (s, v, i) { v /= 255; v = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function rgba(h, a) { var c = hexRgb(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  var TOKEN_NAMES = ["--theme-bg-top", "--theme-bg", "--theme-bg-deep", "--theme-card", "--theme-surface-2", "--theme-line", "--theme-deep",
    "--theme-ink", "--theme-ink-soft", "--theme-shadow", "--theme-name", "--look-accent", "--look-grid", "--look-tape1", "--look-tape2", "--look-tile", "--look-tile-ink", "--look-sticker", "--look-ribbon", "--look-deep-accent"];

  function findLook(theme) {
    for (var i = 0; i < LOOKS.length; i++) if (LOOKS[i].theme === theme) return LOOKS[i];
    return null;
  }

  function clearLook(root) {
    for (var i = 0; i < TOKEN_NAMES.length; i++) root.style.removeProperty(TOKEN_NAMES[i]);
    root.removeAttribute("data-look");
    root.removeAttribute("data-look-dark");
  }

  function applyLook(root, look) {
    var c = look.c, dark = lum(c.page) < 0.2, s = root.style;
    s.setProperty("--theme-bg-top", dark ? mix(c.page, "#ffffff", 0.06) : mix(c.page, "#ffffff", 0.45));
    s.setProperty("--theme-bg", c.page);
    s.setProperty("--theme-bg-deep", dark ? mix(c.page, "#000000", 0.25) : mix(c.page, c.cardBorder, 0.3));
    s.setProperty("--theme-card", c.card);
    s.setProperty("--theme-surface-2", c.clockBox);
    s.setProperty("--theme-line", c.cardBorder);
    s.setProperty("--theme-deep", c.navy);
    s.setProperty("--theme-ink", c.ink);
    s.setProperty("--theme-ink-soft", mix(c.ink, c.card, 0.42));
    s.setProperty("--theme-shadow", dark ? "rgba(0,0,0,.45)" : rgba(c.navy, 0.2));
    s.setProperty("--theme-name", '"' + look.name.replace(/^\S+\s/, "") + '"');
    s.setProperty("--look-accent", c.accent);
    s.setProperty("--look-grid", dark ? "rgba(255,255,255,.06)" : rgba(c.accent, 0.13));
    s.setProperty("--look-tape1", rgba(c.accent, 0.45));
    s.setProperty("--look-tape2", rgba(mix(c.accent, "#a78be0", 0.55), 0.45));
    s.setProperty("--look-tile", c.tile);
    s.setProperty("--look-tile-ink", c.tileInk);
    s.setProperty("--look-sticker", dark ? c.page : "#ffffff");
    s.setProperty("--look-ribbon", mix(c.accent, "#a78be0", 0.6));
    s.setProperty("--look-deep-accent", mix(c.accent, "#000000", dark ? 0.35 : 0.42));
    root.setAttribute("data-look", look.id);
    if (dark) root.setAttribute("data-look-dark", "1"); else root.removeAttribute("data-look-dark");
  }

  // update 126: the cute decorations (graph paper, washi tape, ribbon, sparkles, stickers) now ALSO work with the 6 plain colors.
  // A plain color gets the same --look-* decoration tokens, built from its own palette, and the page is marked data-look="plain".
  function applyPlainDecor(root, theme) {
    var c = PLAIN_PALETTES[theme], s = root.style;
    if (!c) return;
    s.setProperty("--look-accent", c.accent);
    s.setProperty("--look-grid", rgba(c.accent, 0.13));
    s.setProperty("--look-tape1", rgba(c.accent, 0.45));
    s.setProperty("--look-tape2", rgba(mix(c.accent, "#a78be0", 0.55), 0.45));
    s.setProperty("--look-tile", c.tile);
    s.setProperty("--look-tile-ink", c.tileInk);
    s.setProperty("--look-sticker", "#ffffff");
    s.setProperty("--look-ribbon", mix(c.accent, "#a78be0", 0.6));
    s.setProperty("--look-deep-accent", mix(c.accent, "#000000", 0.42));
    root.setAttribute("data-look", "plain");
    root.removeAttribute("data-look-dark");
  }

  // the cute rounded fonts (Fredoka / Quicksand) are only fetched while a look is active
  function ensureLookFonts() {
    if (document.getElementById("look-fonts") || !document.head) return;
    var l = document.createElement("link");
    l.id = "look-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@500;600;700&display=swap";
    document.head.appendChild(l);
  }

  function readSaved() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return THEMES.indexOf(v) !== -1 ? v : "cream";
    } catch (e) {
      return "cream";
    }
  }

  function apply(theme, opts) {
    if (THEMES.indexOf(theme) === -1) theme = "cream";
    var root = document.documentElement;
    current = theme;
    root.setAttribute("data-theme", theme);
    var look = findLook(theme);
    if (look) { applyLook(root, look); } else { clearLook(root); applyPlainDecor(root, theme); }
    if (document.head) ensureLookFonts(); else document.addEventListener("DOMContentLoaded", ensureLookFonts);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    var selects = document.querySelectorAll("[data-theme-select]");
    for (var i = 0; i < selects.length; i++) {
      if (selects[i].value !== theme) selects[i].value = theme;
    }
    setTimeout(function () { if (document.getElementById("heroBand")) { var t = document.querySelector(".heroTitle"); fitTitle(); } relayout(); }, 0);
    if (!(opts && opts.silent)) {
      for (var j = 0; j < listeners.length; j++) {
        try { listeners[j](theme); } catch (e) {}
      }
    }
  }


  // ======================================================================
  // TITLE & HEADER STYLES (update 122) - the hero banner of every game, inspired by the BOXDLE header
  //   classic  : the update-121 banner (gradient title)
  //   sticker  : BOXDLE's header - two-tone sticker title, purple dashed ribbon, sparkles + crown   (default)
  //   candy    : puffy 3D extruded title, notched banner ribbon, hearts
  //   note     : notebook-paper label card with washi tape, punch holes, handwritten tagline pill
  // They only show while one of the 15 looks is active. The structure (ribbon, sparkles, split title) is added once
  // by the code below; the styling is all in theme.css.
  // ======================================================================
  var HSTYLES = [
    { id: "sticker", name: "🎀 Sticker (BOXDLE style)" },
    { id: "candy",   name: "🍬 Candy 3D" },
    { id: "note",    name: "📒 Notebook label" },
    { id: "classic", name: "🖼️ Classic banner" }
  ];
  var HKEY = "platformHeaderStyle";
  var hstyle = "sticker";
  var RIBBONS = {
    wordle: "WORD GUESS", blindle: "BLIND WORDS", colordle: "COLOR GUESS", colorblindle: "COLOR MIX", betweendle: "IN BETWEEN",
    citydle: "CITY HUNT", codedle: "CRACK THE CODE", comparable: "HIGHER · LOWER", crossdle: "CROSSWORD", expandle: "GROW THE WORD",
    fixle: "FIX THE WORD", forbackle: "FORWARD · BACK", linedle: "LINE UP", minedle: "MINE THE WORD", numberblindle: "NUMBER HUNT",
    oracle: "ASK THE ORACLE", rangedle: "FIND THE RANGE", shapedle: "SHAPE UP", shiftle: "SHIFT IT", structle: "WORD BUILDER",
    textle: "TEXT GUESS", towndle: "TOWN HUNT", twistle: "TWIST & SOLVE", findle: "FIND IT"
  };

  function readHStyle() {
    try {
      var v = localStorage.getItem(HKEY);
      for (var i = 0; i < HSTYLES.length; i++) if (HSTYLES[i].id === v) return v;
    } catch (e) {}
    return "sticker";
  }

  function splitTitle(t) {
    if (t.querySelector(".hT1")) return;
    var txt = (t.textContent || "").trim();
    if (!txt) return;
    var cut = txt.length >= 8 ? txt.length - 3 : Math.ceil(txt.length / 2);
    var a = document.createElement("span"), b = document.createElement("span");
    a.className = "hT1"; a.textContent = txt.slice(0, cut);
    b.className = "hT2"; b.textContent = txt.slice(cut);
    t.setAttribute("aria-label", txt);
    t.textContent = "";
    t.appendChild(a); t.appendChild(b);
  }

  // update 125: a color / header / depth / size change alters how much room the board has, but the games only measure it on "resize".
  // So after every appearance change we tell them to measure again (this is what makes every choice take effect fully, at once).
  var relayoutTimer = null;
  function relayout() {
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(function () {
      try { window.dispatchEvent(new Event("resize")); } catch (e) {}
      setTimeout(function () { try { window.dispatchEvent(new Event("resize")); } catch (e) {} }, 350); // once more after the fonts / animations settle
    }, 60);
  }

  function fitTitle() {
    var t = document.querySelector(".heroTitle"), band = document.getElementById("heroBand");
    if (!t || !band || !document.documentElement.hasAttribute("data-look")) return;
    t.style.fontSize = "";
    var max = band.clientWidth - (band.classList.contains("hasDiag") ? 120 : 44);
    if (max <= 0) return;
    var size = parseFloat(getComputedStyle(t).fontSize), guard = 60;
    while (t.scrollWidth > max && size > 14 && guard-- > 0) { size -= 1; t.style.fontSize = size + "px"; }
  }

  function enhanceHeader() {
    var band = document.getElementById("heroBand");
    if (!band || band.getAttribute("data-cute") === "1") { fitTitle(); return; }
    var t = band.querySelector(".heroTitle");
    if (!t) return;
    band.setAttribute("data-cute", "1");
    splitTitle(t);
    var deco = ["✨", "🎀", "⭐", "🧸", "💗"];
    for (var i = 0; i < deco.length; i++) {
      var d = document.createElement("span");
      d.className = "cuteDeco heroDeco d" + (i + 1); d.setAttribute("aria-hidden", "true"); d.textContent = deco[i];
      band.appendChild(d);
    }
    var crown = document.createElement("span");
    crown.className = "cuteDeco heroCrown"; crown.setAttribute("aria-hidden", "true"); crown.textContent = "👑";
    band.appendChild(crown);
    var game = document.body ? document.body.getAttribute("data-game") : "";
    var rib = document.createElement("div");
    rib.className = "cuteRibbon";
    rib.textContent = RIBBONS[game] || "LIVE GAME";
    var tag = band.querySelector(".heroTagline");
    band.insertBefore(rib, tag || null);
    // the title keeps its place: ribbon goes right under it
    if (t.nextSibling !== rib) band.insertBefore(rib, t.nextSibling);
    fitTitle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  }

  function setHStyle(id) {
    hstyle = id;
    document.documentElement.setAttribute("data-hstyle", id);
    try { localStorage.setItem(HKEY, id); } catch (e) {}
    var sel = document.querySelectorAll("[data-hstyle-select]");
    for (var i = 0; i < sel.length; i++) if (sel[i].value !== id) sel[i].value = id;
    setTimeout(fitTitle, 0);
    relayout();
  }

  // ---- Display & layout (update 125): space, banner, info text, decorations. Shared by every game. ----
  var DKEYS = "platformDisplay";
  var DISPLAY_DEFAULTS = { width: "wide", banner: "compact", itext: "normal", deco: "on", nshadow: "off" };
  var DISPLAY_OPTS = {
    width:  { label: "↔️ Game area width", opts: [["standard", "Standard"], ["wide", "Wide (default)"], ["full", "Full screen width"]] },
    banner: { label: "🪧 Title banner",    opts: [["compact", "Compact (default)"], ["full", "Full size"], ["hidden", "Hidden (most room)"]] },
    itext:  { label: "🔠 Info text size",  opts: [["normal", "Normal"], ["large", "Large"], ["xlarge", "Extra large"]] },
    deco:   { label: "✨ Decorations",     opts: [["on", "On (sparkles, tape, hearts)"], ["off", "Off (cleaner)"]] },
    nshadow:{ label: "🔢 Shadow under numbers", opts: [["off", "Off (clean, default)"], ["on", "On (3D numbers)"]] }
  };
  var display = {};
  function readDisplay() {
    var d = {}, k, saved = {};
    try { saved = JSON.parse(localStorage.getItem(DKEYS) || "{}") || {}; } catch (e) {}
    for (k in DISPLAY_DEFAULTS) {
      var ok = false;
      if (saved[k]) for (var i = 0; i < DISPLAY_OPTS[k].opts.length; i++) if (DISPLAY_OPTS[k].opts[i][0] === saved[k]) ok = true;
      d[k] = ok ? saved[k] : DISPLAY_DEFAULTS[k];
    }
    return d;
  }
  function paintDisplay() {
    var root = document.documentElement;
    for (var k in display) root.setAttribute("data-" + k, display[k]);
  }
  display = readDisplay();
  paintDisplay();
  function setDisplay(k, v) {
    display[k] = v; paintDisplay();
    try { localStorage.setItem(DKEYS, JSON.stringify(display)); } catch (e) {}
    var sel = document.querySelectorAll("[data-display-select='" + k + "']");
    for (var i = 0; i < sel.length; i++) if (sel[i].value !== v) sel[i].value = v;
    setTimeout(fitTitle, 0);
    relayout();
  }
  function resetDisplay() {
    display = JSON.parse(JSON.stringify(DISPLAY_DEFAULTS)); paintDisplay();
    try { localStorage.setItem(DKEYS, JSON.stringify(display)); } catch (e) {}
    setHStyle("sticker"); setDepth("soft");
    var sel = document.querySelectorAll("[data-display-select]");
    for (var i = 0; i < sel.length; i++) sel[i].value = display[sel[i].getAttribute("data-display-select")];
    relayout();
  }
  function dispRow(container, label, selectEl) {
    var row = document.createElement("label");
    row.className = "dispRow";
    var t = document.createElement("span"); t.className = "dispLabel"; t.textContent = label;
    row.appendChild(t); row.appendChild(selectEl);
    container.appendChild(row);
  }
  // fills a container with the whole "Display & layout" card (used inside every game's Settings, the homepage and Contexto)
  function buildDisplayBlock(container, opts) {
    opts = opts || {};
    if (!container || container.getAttribute("data-disp-built") === "1") return;
    container.setAttribute("data-disp-built", "1");
    container.classList.add("dispBlock");
    var h = document.createElement("div"); h.className = "dispHead"; h.textContent = "🎛️ Display & layout";
    container.appendChild(h);
    var intro = document.createElement("p"); intro.className = "dispNote";
    intro.textContent = "Shared by all games. Make the board as big as your screen allows, and choose how much decoration you want.";
    container.appendChild(intro);
    function mkSel(attr, list, val, onchange, label) {
      var sel = document.createElement("select");
      sel.setAttribute(attr[0], attr[1]); sel.setAttribute("aria-label", label);
      list.forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
      sel.value = val; sel.addEventListener("change", function (e) { onchange(e.target.value); });
      return sel;
    }
    if (!opts.noHeader) dispRow(container, "🎀 Title & header style", mkSel(["data-hstyle-select", "1"], HSTYLES.map(function (x) { return [x.id, x.name]; }), hstyle, setHStyle, "Title and header style"));
    ["width", "banner", "itext", "deco", "nshadow"].forEach(function (k) {
      if (opts.noBanner && k === "banner") return;
      if (opts.only && opts.only.indexOf(k) < 0) return;
      if (k === "width" && document.body && document.body.hasAttribute("data-no-width")) return;
      dispRow(container, DISPLAY_OPTS[k].label, mkSel(["data-display-select", k], DISPLAY_OPTS[k].opts, display[k], function (v) { setDisplay(k, v); }, DISPLAY_OPTS[k].label));
    });
    if (!opts.noDepth) dispRow(container, "🧊 3D depth", makeDepthSelect());
    var rb = document.createElement("button");
    rb.type = "button"; rb.className = "dispReset"; rb.textContent = "↺ Reset display & layout";
    rb.addEventListener("click", resetDisplay);
    container.appendChild(rb);
  }

  function addHeaderSelect(themeSel) {
    var host = themeSel.closest("label") || themeSel.parentNode;
    if (!host || !host.parentNode || host.parentNode.querySelector("[data-hstyle-wrap]")) return;
    var wrap = document.createElement("div");
    wrap.setAttribute("data-hstyle-wrap", "1");
    wrap.style.marginTop = "10px";
    host.parentNode.insertBefore(wrap, host.nextSibling);
    buildDisplayBlock(wrap, { noBanner: !document.getElementById("heroBand"), noHeader: !!(document.body && document.body.getAttribute("data-game") === "boxdle") });
  }

  hstyle = readHStyle();
  document.documentElement.setAttribute("data-hstyle", hstyle);

  // ---- 3D depth (update 124): off | soft | strong, shared by every game, works with every color ----
  var DEPTHS = [
    { id: "soft",   name: "🧊 Soft 3D (default)" },
    { id: "strong", name: "🧱 Strong 3D" },
    { id: "off",    name: "▫️ Flat (no 3D)" }
  ];
  var DKEY = "platformDepth";
  function readDepth() {
    try { var v = localStorage.getItem(DKEY); for (var i = 0; i < DEPTHS.length; i++) if (DEPTHS[i].id === v) return v; } catch (e) {}
    return "soft";
  }
  var depth = readDepth();
  document.documentElement.setAttribute("data-depth", depth);
  function setDepth(id) {
    depth = id;
    document.documentElement.setAttribute("data-depth", id);
    try { localStorage.setItem(DKEY, id); } catch (e) {}
    var sel = document.querySelectorAll("[data-depth-select]");
    for (var i = 0; i < sel.length; i++) if (sel[i].value !== id) sel[i].value = id;
    relayout();
  }
  function makeDepthSelect() {
    var sel = document.createElement("select");
    sel.setAttribute("data-depth-select", "1"); sel.setAttribute("aria-label", "3D depth");
    DEPTHS.forEach(function (h) { var o = document.createElement("option"); o.value = h.id; o.textContent = h.name; sel.appendChild(o); });
    sel.value = depth;
    sel.addEventListener("change", function (e) { setDepth(e.target.value); });
    return sel;
  }

  // Apply immediately (before DOMContentLoaded) so there's no flash of the
  // wrong theme on load.
  apply(readSaved(), { silent: true });

  // Every Appearance dropdown gets the "Box colors & look" designs added under the 6 plain colors.
  function addLookOptions(sel) {
    if (sel.querySelector("optgroup[data-box-looks]")) return;
    var plainGroup = document.createElement("optgroup");
    plainGroup.label = "Plain colors";
    var opts = Array.prototype.slice.call(sel.querySelectorAll(":scope > option"));
    opts.forEach(function (o) { plainGroup.appendChild(o); });
    sel.appendChild(plainGroup);
    var g = document.createElement("optgroup");
    g.label = "🧸 Box colors & looks";
    g.setAttribute("data-box-looks", "1");
    LOOKS.forEach(function (l) {
      var o = document.createElement("option");
      o.value = l.theme;
      o.textContent = l.name;
      g.appendChild(o);
    });
    sel.appendChild(g);
  }

  function wireSelects() {
    var selects = document.querySelectorAll("[data-theme-select]");
    var onHome = /^\/(index\.html)?$/.test(location.pathname);
    for (var i = 0; i < selects.length; i++) {
      if (selects[i].getAttribute("data-wired") === "1") continue;
      selects[i].setAttribute("data-wired", "1");
      addLookOptions(selects[i]);
      if (!onHome) addHeaderSelect(selects[i]);
      selects[i].value = current;
      selects[i].addEventListener("change", function (e) {
        apply(e.target.value);
      });
    }
  }

  // update 126: every game page has a fullscreen button. If one is ever missing (or hidden), add a working one next to the other toolbar buttons.
  function ensureFullscreenButton() {
    var body = document.body;
    if (!body || !body.getAttribute("data-game")) return;
    var de = document.documentElement;
    if (!(de.requestFullscreen || de.webkitRequestFullscreen)) return;   // e.g. iPhone Safari: nothing to offer
    var found = document.querySelector("#fullscreenBtn, #fullscreen-btn, #fsBtn, [aria-label*='ullscreen'], [aria-label*='ull screen'], .fsAutoBtn");
    if (found && found.offsetParent !== null) return;
    var bar = document.querySelector(".toolbarRow, .topbar-actions, .topbar, .app-header");
    if (!bar) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "iconBtn icon-btn fsAutoBtn"; b.textContent = "⛶";
    b.setAttribute("aria-label", "Toggle full screen"); b.title = "Full screen";
    b.addEventListener("click", function () {
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
      } catch (e) {}
    });
    bar.appendChild(b);
  }
  function onReady() { wireSelects(); enhanceHeader(); ensureFullscreenButton(); window.addEventListener("resize", fitTitle); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  window.PlatformTheme = {
    apply: apply,
    wire: wireSelects, // for selects created later (the HOME settings > Appearance tab)
    themes: THEMES,
    plain: PLAIN,
    looks: LOOKS,
    keys: KEYS,
    current: function () { return current; },
    headerStyle: function () { return hstyle; },
    display: function () { return display; },
    setDisplay: setDisplay,
    buildDisplayBlock: buildDisplayBlock,
    relayout: relayout,
    depth: function () { return depth; },
    setDepth: setDepth,
    makeDepthSelect: makeDepthSelect,
    depths: DEPTHS,
    setHeaderStyle: setHStyle,
    headerStyles: HSTYLES,
    onChange: function (fn) { listeners.push(fn); },
    // the 11-color palette of any theme (a look, or one of the 6 plain colors) - BOXDLE paints its boxes with it
    palette: function (theme) {
      var l = findLook(theme);
      if (l) return Object.assign({}, l.c);
      return Object.assign({}, PLAIN_PALETTES[theme] || PLAIN_PALETTES.cream);
    },
    isLook: function (theme) { return !!findLook(theme); },
    mix: mix, lum: lum, rgba: rgba
  };
})();
