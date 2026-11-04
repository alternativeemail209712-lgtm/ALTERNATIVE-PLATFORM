/* ==========================================================================
   GAME CUSTOMIZE (update 131) - "🧩 Customize" section of every game's Settings.
   Every visible part of a game (title banner, top-bar buttons, score ribbon, message window, legend, keyboard, the
   game's own panels, guess board, host bar ...) can be shown / hidden and made Small / Normal / Large.
   Choices are kept on this device (per game), apply instantly and can be reset any time.
   Rescue: open the game with  ?gcreset=1  to wipe the layout of that game.
   The ⚙️ Settings button can never be hidden, so Settings is always reachable.
   ========================================================================== */
(function () {
  "use strict";
  if (window.GameCustomize) return;
  var VERSION = 1;
  var SIZE_ZOOM = { s: 0.85, m: 1, l: 1.15 };

  function gameId() {
    var g = (document.body && document.body.getAttribute("data-game")) || "";
    if (!g) g = (location.pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
    return g.toLowerCase();
  }
  var GAME = gameId();

  /* ------------------------------------------------------------------ catalog
     c(id, group, icon, label, description, selector, options)   options: size:true | locked:true | always:true | tags:[...] */
  function c(id, group, icon, label, desc, sel, o) { o = o || {}; return { id: id, group: group, icon: icon, label: label, desc: desc, sel: sel, size: !!o.size, tags: o.tags || [], always: !!o.always, defHide: !!o.defHide }; }

  var GROUPS = {
    title:   { icon: "🎀", title: "Title banner",            help: "The big game name at the top of the screen." },
    ribbon:  { icon: "🔘", title: "Top ribbon buttons",       help: "The row of round buttons under the title. Tap a switch to hide a button you never use." },
    info:    { icon: "📰", title: "Score ribbon & messages",  help: "The scrolling top-10 ribbon and the floating window that tells the audience why a guess was not accepted." },
    legend:  { icon: "🎨", title: "Legend (what the colours mean)", help: "The small guide that explains the colours and symbols." },
    keyboard:{ icon: "⌨️", title: "Keyboard",                 help: "The on-screen keyboard that shows which letters were used." },
    parts:   { icon: "🧩", title: "Game parts",                help: "Parts that only this game has." },
    board:   { icon: "📋", title: "Guess board & banners",    help: "The list of guesses and the helper texts around it." },
    host:    { icon: "🎛️", title: "Host controls bar",        help: "The bar at the bottom with the TikTok connection, secret word and Give up button." }
  };

  var RIBBON_FAMILY = [
    c("btnHome", "ribbon", "🏠", "Home button", "Go back to the game list.", "#homeBtn"),
    c("btnMode", "ribbon", "🔴", "Mode badge", "Shows TEST, LIVE or OFFLINE.", "#modeBadge"),
    c("btnLength", "ribbon", "📏", "Word length badge", "Shows how many letters this round has.", "#lengthBadge"),
    c("btnHint", "ribbon", "💡", "Hint button", "Gives the audience a hint.", "#hintBtn"),
    c("btnLang", "ribbon", "🌐", "Language button", "Switch the word language.", "#languageBtn"),
    c("btnHelp", "ribbon", "❓", "How-to-play button", "Opens the rules.", "#helpBtn"),
    c("btnLb", "ribbon", "🏆", "Leaderboard button", "Opens the scores.", "#leaderboardBtn"),
    c("btnFull", "ribbon", "⛶", "Full-screen button", "Fills the whole phone screen.", "#fullscreenBtn")
  ];
  var TITLE_FAMILY = [
    c("heroBand", "title", "🎀", "Title banner", "The game name and its short description.", "#heroBand", { size: true }),
    c("heroTagline", "title", "💬", "Description line", "The one-line explanation under the name.", "#heroBand .heroTagline")
  ];
  var INFO_FAMILY = [
    c("ticker", "info", "📰", "Score ribbon", "TOP 10 ribbon with the scrolling scores.", "#scoreTickerBar", { size: true }),
    c("toast", "info", "💬", "Floating message window", "Explains why a guess was rejected. It has its own reserved place, so it never covers the game.", ".toastSlot")
  ];
  var LEGEND = [c("legend", "legend", "🎨", "Legend", "Colour and symbol guide.", "#legendSection, .legendSection", { size: true, always: true })];
  var KEYBOARD = [
    c("keyboard", "keyboard", "⌨️", "Keyboard", "All letters, coloured by what the audience learned.", "#keyboardSection", { size: true }),
    c("keyboardHead", "keyboard", "🔤", "Keyboard heading", "The word “Keyboard” and the Reset colors link.", "#keyboardSection .keyboardHead")
  ];
  var BOARD = [
    c("avatars", "board", "🧑", "Player pictures", "The small round picture / initial in front of each guess.", "#tilesWrap .guessAvatar, #tilesWrap .guessAvatarSpacer", { always: true }),
    c("board", "board", "📋", "Guess rows size", "Make the guesses bigger or smaller.", "#tilesWrap", { size: true, tags: ["core"] }),
    c("hintChips", "board", "🏷️", "Hint chips", "The small hint tags that appear after a hint.", "#hintChips"),
    c("hintExplainer", "board", "📖", "Hint explanation", "The sentence that explains the hint button.", "#hintExplainer"),
    c("offlineNote", "board", "✏️", "Solo-practice note", "“Solo practice – type your guess in the box below.”", "#offlineNote"),
    c("idleBanner", "board", "🚦", "“Open Settings to begin” notice", "The notice shown before a round is started.", "#idleBanner")
  ];
  var HOST = [c("host", "host", "🎛️", "Host controls bar", "TikTok connection, secret word, Give up. Hiding it gives the game more room; Settings still has everything.", "#controls", { size: true })];

  // game specific parts
  var PARTS = {
    boxdle: [
      c("bxClock", "parts", "⏱️", "Clock box", "Timer, words and points.", "#bxClock"),
      c("bxWords", "parts", "📝", "Words counter", "How many words were found.", "#bxWordsChip"),
      c("bxPoints", "parts", "⭐", "Points counter", "Total points of the round.", "#bxPointsChip"),
      c("bxBar", "parts", "📶", "Time bar", "The progress bar under the clock.", "#bxClock .bxBar"),
      c("bxGrid", "parts", "🔠", "Letter grid", "The tiles the audience chains into words.", "#bxGridSection"),
      c("bxBoardHead", "parts", "✅", "“Guessed words” heading", "Title and counters above the word list.", "#tilesWrap .bxBoardHead")
    ],
    citydle: [
      c("cdCols", "parts", "🏙️", "Column titles", "CITY / DIRECTION / DISTANCE heading row.", "#cdColHead"),
      c("boardStatus", "parts", "ℹ️", "Board status line", "Small status text under the board.", "#boardStatus"),
      c("cdColors", "ribbon", "🎨", "City colours button", "Opens the colour guide.", "#cdColorsBtn")
    ],
    towndle: [
      c("cdCols", "parts", "🏘️", "Column titles", "PLACE / DIRECTION / DISTANCE heading row.", "#cdColHead"),
      c("boardStatus", "parts", "ℹ️", "Board status line", "Small status text under the board.", "#boardStatus"),
      c("cdColors", "ribbon", "🎨", "Colours button", "Opens the colour guide.", "#cdColorsBtn")
    ],
    expandle: [
      c("exTimer", "parts", "⏱️", "Round timer", "The clock and its bar.", "#exTimer", { size: true }),
      c("exPrompt", "parts", "🪜", "Prompt line", "Tells the audience what to do next.", "#exPrompt"),
      c("boardStatus", "parts", "ℹ️", "Board status line", "Small status text under the board.", "#boardStatus")
    ],
    fixle: [c("boardStatus", "parts", "ℹ️", "Board status line", "Small status text under the board.", "#boardStatus")],
    codedle: [c("codeSection", "parts", "🔐", "Code row", "The code the audience is cracking.", "#codeSection", { size: true })],
    colorblindle: [c("colorCounts", "parts", "🎨", "Colour counts", "How many letters of each colour.", "#colorCounts", { size: true })],
    comparable: [c("patternWrap", "parts", "↔️", "Symbol pattern", "The < > = clues between the letters.", "#patternWrap", { size: true })],
    linedle: [
      c("waveSection", "parts", "🌊", "Wave panel", "The wave / pillars picture.", "#waveSection", { size: true }),
      c("waveLook", "ribbon", "🌊", "Wave look button", "Change how the wave looks.", "#waveLookBtn")
    ],
    minedle: [
      c("mineSection", "parts", "💣", "Mine grid", "The grid with numbers and marks.", "#mineSection", { size: true }),
      c("letterBank", "parts", "🔡", "Letter bank", "Blue letters collected so far.", "#letterBankWrap"),
      c("resetMarks", "parts", "↩️", "Reset marks button", "Wipes every red / blue mark.", "#resetMarksBtn")
    ],
    numberblindle: [
      c("btnKeyboard", "ribbon", "🔢", "Number keyboard button", "Shows / hides the number keyboard.", "#keyboardBtn"),
      c("hideKeyboard", "keyboard", "🙈", "Hide-keyboard button", "The Hide link in the keyboard heading.", "#hideKeyboardBtn")
    ],
    shapedle: [c("symbolSection", "parts", "🔣", "Symbol row", "The shapes the secret word is made of.", "#symbolSection", { size: true })],
    textle: [
      c("btnModeMenu", "ribbon", "🧭", "Mode menu button", "Choose the text mode.", "#modeMenuBtn"),
      c("btnThemeMenu", "ribbon", "🎨", "Theme menu button", "Choose the text theme.", "#themeMenuBtn")
    ],
    twistle: [
      c("metaRow", "parts", "🌀", "Round chip", "“TWISTLE – waiting to start” and the guess counter.", ".metaRow"),
      c("answerTiles", "parts", "🔤", "Answer tiles", "The revealed answer at the end of a round.", "#answerTiles"),
      c("legendRow", "parts", "🎨", "Tile meaning guide", "What lit and dark symbols mean.", "#legendRow", { size: true })
    ],
    betweendle: [], blindle: [], oracle: [], colordle: [], rangedle: [], shiftle: [], structle: [], wordle: [], forbackle: []
  };

  // games whose screens are built differently get their own complete catalogs
  var SPECIAL = {
    crossdle: [
      c("heroBand", "title", "🎀", "Title banner", "The game name and its short description.", "#heroBand", { size: true }),
      c("heroTagline", "title", "💬", "Description line", "The one-line explanation under the name.", "#heroBand .heroTagline"),
      c("btnHome", "ribbon", "🏠", "Home button", "Back to the game list.", ".app-header #homeBtn"),
      c("btnRound", "ribbon", "🔖", "Round badge", "Round number.", "#roundPill"),
      c("btnLb", "ribbon", "🏆", "Leaderboard button", "Opens the scores.", ".app-header #leaderboardBtn"),
      c("btnFull", "ribbon", "⛶", "Full-screen button", "Fills the whole phone screen.", ".app-header #fullscreenBtn"),
      c("btnHelp", "ribbon", "❓", "How-to-play button", "Opens the rules.", "#howToPlayBtn"),
      c("ticker", "info", "📰", "Score ribbon", "TOP 10 ribbon with the scrolling scores.", "#leaderboardTicker", { size: true }),
      c("toast", "info", "💬", "Floating message window", "Explains why a guess was rejected.", ".toast-slot"),
      c("diag", "info", "🩺", "Diagnostics ribbon", "Connection / event counter.", "#diagBar"),
      c("legend", "legend", "🎨", "Legend", "Colour guide.", ".board-legend", { size: true }),
      c("keyboard", "keyboard", "⌨️", "Keyboard", "All letters, coloured by what the audience learned.", ".keyboard-section", { size: true }),
      c("hintChips", "board", "🏷️", "Hint chips", "Hint tags.", "#hintChips"),
      c("hintsRow", "board", "💡", "Hint tiles", "Revealed hint letters.", "#hintsRow, #hintsTiles"),
      c("board", "board", "📋", "Guess rows size", "Make the guesses bigger or smaller.", "#board", { size: true, tags: ["core"] }),
      c("boardEmpty", "board", "🚦", "“Waiting for guesses” box", "The empty-board notice.", "#boardEmpty"),
      c("host", "host", "🎛️", "Host button (bottom right)", "Floating button that opens the host controls.", "#hostFab")
    ],
    flagle: [
      c("btnHome", "ribbon", "🏠", "Home button", "Back to the game list.", "#home-btn"),
      c("btnMode", "ribbon", "🔴", "Mode badge", "Shows LIVE / TEST / OFFLINE.", "#mode-badge"),
      c("topTitle", "ribbon", "🏷️", "“FLAGLE live” title", "The small title in the top bar.", ".topbar-title"),
      c("timer", "ribbon", "⏱️", "Round timer", "Seconds left in the round.", "#round-timer"),
      c("btnLb", "ribbon", "🏆", "Leaderboard button", "Opens the scores.", "#leaderboard-btn"),
      c("btnFull", "ribbon", "⛶", "Full-screen button", "Fills the whole phone screen.", "#fullscreen-btn"),
      c("heartbeat", "ribbon", "🎧", "Chat activity counter", "Shows that chat is being heard.", "#heartbeat"),
      c("liveUser", "ribbon", "👤", "@username", "The TikTok account that is connected.", "#live-username"),
      c("ticker", "info", "📰", "Score ribbon", "Scrolling top scores.", ".ticker-wrap", { size: true }),
      c("toast", "info", "💬", "Floating message window", "Shows the result of each guess.", "#toast-layer"),
      c("flag", "parts", "🚩", "Flag picture", "The flag the audience guesses.", ".radar-wrap", { size: true, tags: ["core"] }),
      c("hintStrip", "parts", "🧭", "Hint line", "“Type the country name in chat to guess.”", "#hint-strip"),
      c("debug", "parts", "🛠️", "“Last heard” line", "Shows the last chat message that was received.", "#debug-strip"),
      c("chat", "board", "💬", "Live chat panel", "The audience chat.", ".comment-panel", { size: true }),
      c("likes", "board", "❤️", "Top likes panel", "Who sent the most likes.", ".fans-section:first-child"),
      c("gifts", "board", "🎁", "Top gifters panel", "Who sent the most gifts.", ".fans-section:last-child"),
      c("host", "host", "🎛️", "Host input bar", "Type a guess / chat as host.", "#host-form", { size: true })
    ],
    travle: [
      c("btnHome", "ribbon", "🏠", "Home button", "Back to the game list.", "#homeBtn"),
      c("btnTiktok", "ribbon", "📡", "TikTok badge", "Connection badge.", "#tiktokBadge"),
      c("btnMode", "ribbon", "🔴", "Mode badge", "LIVE / TEST / OFFLINE.", "#modeBadge"),
      c("btnHint", "ribbon", "💡", "Hint button", "Gives a hint.", "#topHintBtn"),
      c("btnFull", "ribbon", "⛶", "Full-screen button", "Fills the whole phone screen.", "#fullscreenBtn"),
      c("btnLegend", "ribbon", "❓", "Help / legend button", "Opens the rules.", "#legendBtn"),
      c("btnLb", "ribbon", "🏆", "Leaderboard button", "Opens the scores.", "#trophyBtn"),
      c("ticker", "info", "📰", "Score ribbon", "Scrolling top scores.", "#tickerBar", { size: true }),
      c("globeBar", "parts", "🎚️", "Globe zoom bar", "Zoom slider and Recenter / Enlarge buttons.", ".globe-toolbar"),
      c("globeHint", "parts", "👆", "Globe instructions", "“Drag to rotate · pinch to zoom…”", ".globe-caption"),
      c("routeMeta", "parts", "🔢", "Guess counter & optimal length", "Guesses made and the shortest possible trail.", ".route-meta"),
      c("routeLines", "parts", "🧭", "Trail lines", "Shortest trail and the trail so far.", ".route-lines"),
      c("hintDisplay", "parts", "💡", "Hint text", "Explains the current hint.", "#hintDisplay"),
      c("feed", "board", "📰", "Live activity", "The feed of guesses.", "#feedCard", { size: true }),
      c("dockMode", "host", "🧪", "Mode banner", "TEST / OFFLINE banner.", "#modeBanner"),
      c("host", "host", "🎛️", "Host controls dock", "Guess box and round buttons.", ".host-dock", { size: true })
    ],
    contexto: [
      c("btnHome", "ribbon", "🏠", "Home button", "Back to the game list.", "#homeBtn"),
      c("statusWord", "ribbon", "🔴", "Status word", "IDLE / LIVE / NOT LIVE.", "#statusWord"),
      c("viewers", "ribbon", "👁️", "Viewer counter", "How many viewers are watching.", "#viewerChip"),
      c("modePip", "ribbon", "🧭", "Mode dot", "Small mode indicator.", "#modePip"),
      c("theme", "ribbon", "🌙", "Theme button", "Light / dark theme.", "#themeToggle"),
      c("btnHint", "ribbon", "💡", "Hint button", "Gives a hint.", "#hintBtn"),
      c("btnDock", "ribbon", "⌨️", "Keyboard button", "Shows / hides the guess box.", "#dockToggle"),
      c("btnLb", "ribbon", "🏆", "Leaderboard button", "Opens the scores.", "#leaderboardToggle"),
      c("btnRound", "ribbon", "🔁", "Round button", "Start / restart a round.", "#roundBtn"),
      c("btnFull", "ribbon", "⛶", "Full-screen button", "Fills the whole phone screen.", "#fsBtn"),
      c("heroTitle", "title", "🎀", "Game title", "“Contexto LIVE” and its description.", "#game > .hero", { size: true }),
      c("heroSub", "title", "💬", "Description line", "The one-line explanation under the title.", "#heroSub"),
      c("stats", "info", "📊", "Guesses / players counter", "Totals under the title.", "#statsRow"),
      c("points", "info", "✨", "“+N points” popup place", "The reserved place for the floating points popup.", "#pointsPopupHost"),
      c("latest", "parts", "🆕", "Latest guess line", "The most recent guess.", ".latest", { size: true }),
      c("board", "board", "📋", "Guess list size", "Make the guesses bigger or smaller.", "#guessList", { size: true, tags: ["core"] }),
      c("boardHead", "board", "🏷️", "“Live guesses” heading", "Title and counter above the list.", "section.board .board-head")
    ]
  };

  function catalog() {
    if (SPECIAL[GAME]) return SPECIAL[GAME];
    var out = [].concat(TITLE_FAMILY, RIBBON_FAMILY, INFO_FAMILY, LEGEND);
    // ribbon extras sit with the other ribbon buttons
    var extra = PARTS[GAME] || [];
    var keyboardGames = !!document.querySelector("#keyboardSection");
    if (keyboardGames) out = out.concat(KEYBOARD);
    var board = BOARD;
    if (GAME === "twistle") board = BOARD.map(function (it) { return it.id === "board" ? c("board", "board", "📋", "Guess rows size", "Make the guesses bigger or smaller.", "#grid", { size: true, tags: ["core"] }) : it.id === "avatars" ? null : it; }).filter(Boolean);
    if (GAME === "boxdle") board = BOARD.filter(function (it) { return it.id !== "board" && it.id !== "avatars"; });   // BOXDLE fits its own letter grid and word board
    out = out.concat(extra, board, HOST);
    return out;
  }

  /* ------------------------------------------------------------------ presets (by component id) */
  var PRESETS = [
    { id: "all",    icon: "✅", name: "Everything",   desc: "Show every part at normal size.", hide: [], size: {} },
    { id: "clean",  icon: "✨", name: "Clean",        desc: "Hide the explanations (description line, legend, helper texts).", hide: ["heroTagline", "legend", "hintExplainer", "offlineNote", "idleBanner", "heroSub", "globeHint", "debug", "diag", "boardStatus", "dockMode"], size: {} },
    { id: "board",  icon: "🔍", name: "Big board",    desc: "Hide extras to give the guess board the most room.", hide: ["heroTagline", "legend", "hintExplainer", "offlineNote", "idleBanner", "ticker", "heroSub", "globeHint", "debug", "diag", "boardStatus", "dockMode", "keyboardHead", "stats"], size: { board: "l" } },
    { id: "guesses",icon: "🎯", name: "Guesses only", desc: "Only the title, the guesses and the essential buttons.", hide: ["heroTagline", "legend", "hintExplainer", "offlineNote", "idleBanner", "ticker", "keyboard", "heroSub", "globeHint", "debug", "diag", "boardStatus", "dockMode", "hintChips", "btnLang", "btnLength", "btnHelp", "btnHint", "btnFull", "stats", "likes", "gifts", "points"], size: { board: "l" } }
  ];

  /* ------------------------------------------------------------------ storage */
  var KEY = "craft.custom.v" + VERSION + "." + GAME, KEY_ALL = "craft.custom.v" + VERSION + ".__all";
  function blank() { return { hide: {}, size: {}, fit: true, collapse: false }; }
  function load() {
    try {
      var raw = localStorage.getItem(KEY) || localStorage.getItem(KEY_ALL);
      if (!raw) return blank();
      var j = JSON.parse(raw), b = blank();
      b.hide = j.hide || {}; b.size = j.size || {}; b.fit = j.fit !== false; b.collapse = !!j.collapse;
      return b;
    } catch (e) { return blank(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var st = blank();
  if (/[?&]gcreset=1\b/.test(location.search)) { try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_ALL); } catch (e) {} } else st = load();

  /* ------------------------------------------------------------------ apply */
  var styleEl = null;
  var HASFIT = !!document.querySelector('link[href*="fit-screen.css"]');
  function selList(sel) { return sel.split(",").map(function (s) { return "html body " + s.trim(); }); }
  function build() {
    var rules = [], cat = catalog();
    cat.forEach(function (it) {
      if (st.hide[it.id]) rules.push(selList(it.sel).join(",") + "{display:none !important}");
      var z = SIZE_ZOOM[st.size[it.id]];
      if (it.size && z && z !== 1 && !st.hide[it.id]) rules.push(selList(it.sel).join(",") + "{zoom:" + z + " !important}");
    });
    return rules.join("\n");
  }
  function apply() {
    if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = "gcStyle"; (document.head || document.documentElement).appendChild(styleEl); }
    styleEl.textContent = build();
    var fs = window.__fitScreen;
    if (!HASFIT) { /* this game keeps its own fitting */ }
    else if (st.fit === false) { document.documentElement.classList.remove("fs"); document.documentElement.classList.add("gcNoFit"); }
    else { document.documentElement.classList.add("fs"); document.documentElement.classList.remove("gcNoFit"); }
    if (fs && fs.refit) fs.refit();
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
  }
  function collapseHost() {
    if (!st.collapse) return;
    var h = document.getElementById("controlsHandle") || document.getElementById("dockToggle");
    if (h && h.getAttribute("aria-expanded") === "true") { try { h.click(); } catch (e) {} }
  }
  apply();
  document.addEventListener("DOMContentLoaded", function () { apply(); setTimeout(collapseHost, 900); });

  /* ------------------------------------------------------------------ UI (cards inside the Settings workspace) */
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]; }); }
  function exists(it) { try { return it.always || !!document.querySelector(it.sel); } catch (e) { return false; } }

  function section(title, icon, help) {
    var s = mk("section", "drawerSection host-card gcSection");
    s.setAttribute("data-cs-force-cat", "custom"); s.setAttribute("data-cs-icon", icon);
    s.innerHTML = '<h4 class="host-card-title">' + esc(title) + "</h4>" + (help ? '<p class="sectionNote gcHelp">' + esc(help) + "</p>" : "");
    return s;
  }
  function sizeSeg(it) {
    var seg = mk("div", "gcSeg"); seg.setAttribute("role", "group"); seg.setAttribute("aria-label", it.label + " size");
    [["s", "Small"], ["m", "Normal"], ["l", "Large"]].forEach(function (p) {
      var b = mk("button", "gcSegBtn", p[1]); b.type = "button"; b.setAttribute("data-v", p[0]);
      b.addEventListener("click", function () { if (p[0] === "m") delete st.size[it.id]; else st.size[it.id] = p[0]; save(); apply(); refresh(); });
      seg.appendChild(b);
    });
    return seg;
  }
  function row(it) {
    var core = it.tags.indexOf("core") >= 0;
    var wrap = mk("div", "gcItem"); wrap.setAttribute("data-gc-item", it.id);
    var lab = mk("label", "gcRow");
    lab.innerHTML = '<span class="gcIco" aria-hidden="true">' + it.icon + '</span><span class="gcTxt"><b>' + esc(it.label) + "</b><small>" + esc(it.desc) + "</small></span>" +
      (core ? '<span class="gcCore">always on</span>' : '<span class="gcSw"><input type="checkbox" role="switch" data-gc="' + it.id + '"><i></i></span>');
    wrap.appendChild(lab);
    if (!core) {
      var cb = lab.querySelector("input");
      cb.addEventListener("change", function () { if (cb.checked) delete st.hide[it.id]; else st.hide[it.id] = true; save(); apply(); refresh(); });
    }
    if (it.size) { var seg = sizeSeg(it); seg.classList.add("gcSegRow"); wrap.appendChild(seg); }
    return wrap;
  }
  function refresh() {
    var root = document.querySelector(".csMain") || document;
    var cat = catalog();
    cat.forEach(function (it) {
      var cb = root.querySelector('input[data-gc="' + it.id + '"]'); if (cb) cb.checked = !st.hide[it.id];
      var item = root.querySelector('[data-gc-item="' + it.id + '"]');
      if (item) {
        item.classList.toggle("gcOff", !!st.hide[it.id]);
        var seg = item.querySelector(".gcSeg");
        if (seg) { var cur = st.size[it.id] || "m"; Array.prototype.forEach.call(seg.querySelectorAll(".gcSegBtn"), function (b) { b.classList.toggle("on", b.getAttribute("data-v") === cur); b.disabled = !!st.hide[it.id]; }); }
      }
    });
    var fit = root.querySelector('input[data-gc-global="fit"]'); if (fit) fit.checked = st.fit !== false;
    var col = root.querySelector('input[data-gc-global="collapse"]'); if (col) col.checked = !!st.collapse;
    Array.prototype.forEach.call(root.querySelectorAll(".gcPreset"), function (b) { b.classList.toggle("on", presetMatches(b.getAttribute("data-preset"))); });
    var n = Object.keys(st.hide).length; Array.prototype.forEach.call(root.querySelectorAll(".gcCount"), function (e) { e.textContent = n ? n + " hidden" : "nothing hidden"; });
  }
  function presetMatches(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0]; if (!p) return false;
    var cat = catalog().filter(function (it) { return exists(it); }), ids = cat.map(function (i) { return i.id; });
    var want = p.hide.filter(function (h) { return ids.indexOf(h) >= 0; });
    var have = Object.keys(st.hide).filter(function (h) { return st.hide[h]; });
    if (want.length !== have.length) return false;
    for (var i = 0; i < want.length; i++) if (have.indexOf(want[i]) < 0) return false;
    var sz = Object.keys(st.size); var psz = Object.keys(p.size).filter(function (k) { return ids.indexOf(k) >= 0; });
    if (sz.length !== psz.length) return false;
    for (var j = 0; j < psz.length; j++) if (st.size[psz[j]] !== p.size[psz[j]]) return false;
    return true;
  }
  function applyPreset(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var cat = catalog().filter(function (it) { return exists(it); });
    st.hide = {}; st.size = {};
    cat.forEach(function (it) { if (p.hide.indexOf(it.id) >= 0 && it.tags.indexOf("core") < 0) st.hide[it.id] = true; if (p.size[it.id]) st.size[it.id] = p.size[it.id]; });
    save(); apply(); refresh();
  }
  function makeSections() {
    var cat = catalog().filter(exists), out = [];

    // 1. quick layouts
    var q = section("Quick layouts", "🪄", "One tap sets a ready-made layout. You can still change every part below.");
    var grid = mk("div", "gcPresets");
    PRESETS.forEach(function (p) {
      var b = mk("button", "gcPreset", '<span class="gcPIco">' + p.icon + '</span><span class="gcPTxt"><b>' + esc(p.name) + "</b><small>" + esc(p.desc) + "</small></span>");
      b.type = "button"; b.setAttribute("data-preset", p.id);
      b.addEventListener("click", function () { applyPreset(p.id); });
      grid.appendChild(b);
    });
    q.appendChild(grid); q.appendChild(mk("p", "gcCountLine", '<span class="gcCount"></span>'));
    out.push(q);

    // 2. whole-screen switches
    var s = section("Whole screen", "📱", "How the game uses your phone screen.");
    function globalRow(key, icon, label, desc) {
      var r = mk("label", "gcRow gcItem");
      r.innerHTML = '<span class="gcIco" aria-hidden="true">' + icon + '</span><span class="gcTxt"><b>' + esc(label) + "</b><small>" + esc(desc) + '</small></span><span class="gcSw"><input type="checkbox" role="switch" data-gc-global="' + key + '"><i></i></span>';
      return r;
    }
    var rFit = globalRow("fit", "📐", "Fit everything on one screen", "No scrolling: the game shrinks a little on small phones so every part is visible. Switch off to use the original scrolling layout.");
    var rCol = globalRow("collapse", "🔽", "Start with the host bar folded", "Folds “Host controls” when the game opens, to give the guesses more room (tap the bar to open it).");
    rFit.querySelector("input").addEventListener("change", function (e) { st.fit = e.target.checked; save(); apply(); });
    rCol.querySelector("input").addEventListener("change", function (e) { st.collapse = e.target.checked; save(); if (st.collapse) collapseHost(); });
    if (HASFIT) s.appendChild(rFit);
    if (document.getElementById("controlsHandle") || document.getElementById("dockToggle")) s.appendChild(rCol);
    if (s.querySelectorAll(".gcRow").length) out.push(s);

    // 3. one card per group
    ["title", "ribbon", "info", "legend", "keyboard", "parts", "board", "host"].forEach(function (g) {
      var items = cat.filter(function (it) { return it.group === g; });
      if (!items.length) return;
      var G = GROUPS[g];
      var sec = section(g === "parts" ? "Game parts" : G.title, G.icon, G.help);
      if (g === "ribbon") sec.appendChild(mk("p", "gcLock", "🔒 The ⚙️ Settings button is always shown, so you can never lock yourself out."));
      items.forEach(function (it) { sec.appendChild(row(it)); });
      out.push(sec);
    });

    // 4. reset / copy
    var t = section("Reset & share", "♻️", "Undo your changes or use this layout for every game.");
    var bar = mk("div", "gcBtns");
    var bReset = mk("button", "gcBtn", "↩️ Reset this game"); bReset.type = "button";
    bReset.addEventListener("click", function () { st = blank(); try { localStorage.removeItem(KEY); } catch (e) {} apply(); refresh(); });
    var bAll = mk("button", "gcBtn gcBtnPrimary", "📋 Use this layout for all games"); bAll.type = "button";
    bAll.addEventListener("click", function () {
      try { localStorage.setItem(KEY_ALL, JSON.stringify(st)); bAll.textContent = "✔ Saved — other games will start from this layout"; setTimeout(function () { bAll.textContent = "📋 Use this layout for all games"; }, 2600); } catch (e) {}
    });
    bar.appendChild(bReset); bar.appendChild(bAll); t.appendChild(bar);
    t.appendChild(mk("p", "sectionNote gcHelp", "Your choices are kept on this device. A game you have already customized keeps its own layout."));
    out.push(t);
    return out;
  }

  /* ------------------------------------------------------------------ inject once the Settings workspace exists */
  var injected = false;
  function bodyEl() {
    var cs = window.CraftSettings && window.CraftSettings.state;
    if (cs && cs.built && cs.out && cs.out.bodyEl) return cs.out.bodyEl;
    if (cs && cs.failed) return document.querySelector("#settingsOverlay .drawer, .settingsBody, .drawer-body, .sheet-body, .host-cards");
    return null;
  }
  function inject() {
    if (injected) return true;
    var b = bodyEl(); if (!b) return false;
    var secs = makeSections();
    secs.forEach(function (s) { b.appendChild(s); });
    injected = true;
    setTimeout(refresh, 50); setTimeout(refresh, 700); setTimeout(refresh, 1800);
    return true;
  }
  var tries = 0;
  function poll() { if (inject() || ++tries > 60) return; setTimeout(poll, 250); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(poll, 500); }); else setTimeout(poll, 500);

  window.GameCustomize = { catalog: catalog, state: function () { return st; }, apply: apply, game: GAME, exists: exists, reset: function () { st = blank(); save(); apply(); } };
})();
