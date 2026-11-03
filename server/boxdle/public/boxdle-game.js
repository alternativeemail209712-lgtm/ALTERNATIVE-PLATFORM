// boxdle-game.js — runs in the browser (host view / display view)
// BOXDLE: a grid of letter tiles; the chat builds real words by chaining touching tiles (up, down, sides and corners).
// Points = letters of the word. The server (boxdle-server.js) owns the grid, the clock and every rule - this page only shows it.

function setRealViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
setRealViewportHeight();
let lastGridSig = "";
function relayout() {
  setRealViewportHeight();
  lastGridSig = "";
  if (lastState) renderGrid(lastState.game);
}
window.addEventListener("resize", relayout);
window.addEventListener("orientationchange", relayout);

const el = {
  brandDot: document.getElementById("brandDot"),
  modeBadge: document.getElementById("modeBadge"),
  lengthBadge: document.getElementById("lengthBadge"),
  hintBtn: document.getElementById("hintBtn"),
  helpBtn: document.getElementById("helpBtn"),
  languageBtn: document.getElementById("languageBtn"),
  languageOverlay: document.getElementById("languageOverlay"),
  closeLanguage: document.getElementById("closeLanguage"),
  applyLanguageBtn: document.getElementById("applyLanguageBtn"),
  languageInfo: document.getElementById("languageInfo"),
  languageWarn: document.getElementById("languageWarn"),
  leaderboardBtn: document.getElementById("leaderboardBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),

  confettiLayer: document.getElementById("confettiLayer"),
  rejectionToast: document.getElementById("rejectionToast"),

  clock: document.getElementById("bxClock"),
  clockNum: document.getElementById("bxClockNum"),
  barFill: document.getElementById("bxBarFill"),
  wordsChip: document.getElementById("bxWordsChip"),
  pointsChip: document.getElementById("bxPointsChip"),
  gridSection: document.getElementById("bxGridSection"),
  gridWrap: document.getElementById("bxGridWrap"),
  grid: document.getElementById("bxGrid"),
  pathSvg: document.getElementById("bxPathSvg"),
  ruleNote: document.getElementById("bxRuleNote"),
  hintChips: document.getElementById("hintChips"),
  offlineNote: document.getElementById("offlineNote"),
  resultBanner: document.getElementById("resultBanner"),
  resultText: document.getElementById("resultText"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  autoContinueNote: document.getElementById("autoContinueNote"),
  idleBanner: document.getElementById("idleBanner"),
  board: document.getElementById("tilesWrap"),
  boardMeta: document.getElementById("bxBoardMeta"),
  wordList: document.getElementById("bxWordList"),
  missed: document.getElementById("bxMissed"),

  controlsHandle: document.getElementById("controlsHandle"),
  controlsBody: document.getElementById("controlsBody"),
  liveControls: document.getElementById("liveControls"),
  testControls: document.getElementById("testControls"),
  offlineControls: document.getElementById("offlineControls"),
  tiktokUsernameBottom: document.getElementById("tiktokUsernameBottom"),
  connectBtnBottom: document.getElementById("connectBtnBottom"),
  offlineGuessInput: document.getElementById("offlineGuessInput"),
  offlineGuessBtn: document.getElementById("offlineGuessBtn"),
  offlineError: document.getElementById("offlineError"),
  giveUpBtn: document.getElementById("giveUpBtn"),
  miniStatus: document.getElementById("miniStatus"),

  settingsOverlay: document.getElementById("settingsOverlay"),
  closeSettings: document.getElementById("closeSettings"),
  modeChip: document.getElementById("modeChip"),
  connChip: document.getElementById("connChip"),
  modePickerBtn: document.getElementById("modePickerBtn"),
  modePickerLabel: document.getElementById("modePickerLabel"),
  tiktokUsername: document.getElementById("tiktokUsername"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  gridSizeSelect: document.getElementById("gridSizeSelect"),
  reuseToggle: document.getElementById("reuseToggle"),
  minLenSelect: document.getElementById("minLenSelect"),
  roundSecondsInput: document.getElementById("roundSecondsInput"),
  roundPresets: document.getElementById("roundPresets"),
  autoContinueToggle: document.getElementById("autoContinueToggle"),
  delayInput: document.getElementById("delayInput"),
  leaderboardShowInput: document.getElementById("leaderboardShowInput"),
  rejectionToastShowInput: document.getElementById("rejectionToastShowInput"),
  applyBtn: document.getElementById("applyBtn"),
  diagToggle: document.getElementById("diagToggle"),
  diagGrid: document.getElementById("diagGrid"),
  resetRoundBtn: document.getElementById("resetRoundBtn"),
  resetTotalBtn: document.getElementById("resetTotalBtn"),

  modePickerOverlay: document.getElementById("modePickerOverlay"),

  leaderboardOverlay: document.getElementById("leaderboardOverlay"),
  closeLeaderboard: document.getElementById("closeLeaderboard"),
  celebrationOverlay: document.getElementById("celebrationOverlay"),
  celebrationBody: document.getElementById("celebrationBody"),
  celebrationDots: document.getElementById("celebrationDots"),
  closeCelebration: document.getElementById("closeCelebration"),
  tabThisRound: document.getElementById("tabThisRound"),
  tabAllTime: document.getElementById("tabAllTime"),
  leaderboardList: document.getElementById("leaderboardList"),
  leaderboardNote: document.getElementById("leaderboardNote"),

  howToOverlay: document.getElementById("howToOverlay"),
  closeHowTo: document.getElementById("closeHowTo"),
  closeHowTo2: document.getElementById("closeHowTo2")
};

const MODE_LABELS = {
  live: { title: "Live", desc: "Counts for the chat leaderboard" },
  test: { title: "Test", desc: "Practice — scores not saved" },
  offline: { title: "Offline", desc: "Host plays solo" }
};


// ------------------------------------------------------------
// Fullscreen toggle (cross-browser, with graceful no-op fallback
// on browsers - notably iOS Safari - that don't support it)
// ------------------------------------------------------------
function isFullscreen() {
  return Boolean(
    document.fullscreenElement || document.webkitFullscreenElement ||
    document.mozFullScreenElement || document.msFullscreenElement
  );
}
function requestFS() {
  const root = document.documentElement;
  const fn = root.requestFullscreen || root.webkitRequestFullscreen || root.mozRequestFullScreen || root.msRequestFullscreen;
  if (!fn) return;
  try {
    const p = fn.call(root);
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* ignore - not supported here */ }
}
function exitFS() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
  if (!fn) return;
  try {
    const p = fn.call(document);
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* ignore */ }
}
el.fullscreenBtn.addEventListener("click", () => {
  if (isFullscreen()) exitFS();
  else requestFS();
});
["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
  document.addEventListener(evt, () => {
    const fs = isFullscreen();
    el.fullscreenBtn.classList.toggle("active", fs);
    el.fullscreenBtn.setAttribute("aria-label", fs ? "Exit fullscreen" : "Enter fullscreen");
    setRealViewportHeight();
    lastGridSig = "";
    if (lastState) renderGrid(lastState.game);
  });
});


// ------------------------------------------------------------
// Settings (staged in the drawer, sent together when the host taps Apply)
// ------------------------------------------------------------
for (let n = 2; n <= 8; n++) {
  const opt = document.createElement("option");
  opt.value = String(n);
  opt.textContent = n + " letters" + (n === 3 ? " (default)" : "");
  if (n === 3) opt.selected = true;
  el.minLenSelect.appendChild(opt);
}

let stagedMode = "test";

function markRoundPresets() {
  const v = Number(el.roundSecondsInput.value);
  el.roundPresets.querySelectorAll(".presetBtn").forEach((b) => b.classList.toggle("active", Number(b.dataset.seconds) === v));
}
el.roundPresets.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".presetBtn");
  if (!b) return;
  el.roundSecondsInput.value = b.dataset.seconds;
  markRoundPresets();
});
el.roundSecondsInput.addEventListener("input", markRoundPresets);

function syncStagedSettingsFromState(g) {
  stagedMode = g.mode;
  el.gridSizeSelect.value = String(g.gridSize);
  el.reuseToggle.checked = g.allowReuse === true;
  el.minLenSelect.value = String(g.minWordLength);
  el.roundSecondsInput.value = g.roundSeconds;
  markRoundPresets();
  el.autoContinueToggle.checked = g.autoContinue;
  el.delayInput.value = g.autoContinueDelaySeconds;
  el.leaderboardShowInput.value = g.leaderboardShowSeconds;
  el.rejectionToastShowInput.value = g.rejectionToastSeconds;
  updateModePickerLabel();
}


function updateModePickerLabel() {
  const info = MODE_LABELS[stagedMode];
  el.modePickerLabel.textContent = info.title + " — " + info.desc;
  document.querySelectorAll(".pickerOption").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.mode === stagedMode);
  });
}

el.controlsHandle.addEventListener("click", () => {
  const expanded = el.controlsHandle.getAttribute("aria-expanded") === "true";
  el.controlsHandle.setAttribute("aria-expanded", String(!expanded));
  el.controlsBody.classList.toggle("collapsed", expanded);
});

el.diagToggle.addEventListener("click", () => {
  const showing = el.diagToggle.getAttribute("aria-expanded") === "true";
  el.diagToggle.setAttribute("aria-expanded", String(!showing));
  el.diagToggle.textContent = showing ? "show" : "hide";
  el.diagGrid.style.display = showing ? "none" : "grid";
});

function openDrawer(overlay) { overlay.hidden = false; }
function closeDrawer(overlay) { overlay.hidden = true; }

el.settingsBtn.addEventListener("click", () => {
  if (lastState) syncStagedSettingsFromState(lastState.game);
  openDrawer(el.settingsOverlay);
});
el.closeSettings.addEventListener("click", () => closeDrawer(el.settingsOverlay));
el.settingsOverlay.addEventListener("click", (e) => { if (e.target === el.settingsOverlay) closeDrawer(el.settingsOverlay); });

el.leaderboardBtn.addEventListener("click", () => { openDrawer(el.leaderboardOverlay); renderLeaderboardTab(); });
el.closeLeaderboard.addEventListener("click", () => closeDrawer(el.leaderboardOverlay));
el.leaderboardOverlay.addEventListener("click", (e) => { if (e.target === el.leaderboardOverlay) closeDrawer(el.leaderboardOverlay); });

el.helpBtn.addEventListener("click", () => { el.howToOverlay.hidden = false; });

// ------------------------------------------------------------
// Languages popup (update 64) - 3 tick boxes -> one of the 7 word-language modes
// ------------------------------------------------------------
const LANG_BOXES = [
  { part: "en", box: document.getElementById("langEn") },
  { part: "id", box: document.getElementById("langId") },
  { part: "ms", box: document.getElementById("langMs") }
];
function langPartsOfMode(mode) {
  const m = String(mode || "en");
  return m === "all" ? ["en", "id", "ms"] : m.split("-");
}
function langModeFromParts(parts) {
  const has = (p) => parts.includes(p);
  const n = parts.length;
  if (n === 3) return "all";
  if (n === 1) return parts[0];
  if (has("en") && has("id")) return "en-id";
  if (has("en") && has("ms")) return "en-ms";
  return "ms-id";
}
function pickedLangParts() { return LANG_BOXES.filter((b) => b.box && b.box.checked).map((b) => b.part); }
function syncLanguageBoxes(g) {
  if (!g || !g.wordLanguage) return;
  const parts = langPartsOfMode(g.wordLanguage);
  LANG_BOXES.forEach((b) => { if (b.box) b.box.checked = parts.includes(b.part); });
  if (el.languageWarn) el.languageWarn.hidden = true;
  const info = g.wordLanguageInfo;
  if (el.languageInfo) {
    el.languageInfo.textContent = info
      ? "Now playing: " + info.label + " — " + info.secretWords.toLocaleString() + " secret words, up to " + info.maxLength + " letters."
      : "";
  }
  if (el.languageBtn) el.languageBtn.title = "Languages: " + (info ? info.short : g.wordLanguage);
}
function openLanguagePopup() {
  if (lastState && lastState.game) syncLanguageBoxes(lastState.game);
  el.languageOverlay.hidden = false;
}
el.languageBtn.addEventListener("click", openLanguagePopup);
el.closeLanguage.addEventListener("click", () => { el.languageOverlay.hidden = true; });
el.languageOverlay.addEventListener("click", (e) => { if (e.target === el.languageOverlay) el.languageOverlay.hidden = true; });
LANG_BOXES.forEach((b) => { if (b.box) b.box.addEventListener("change", () => { el.languageWarn.hidden = pickedLangParts().length > 0; }); });
el.applyLanguageBtn.addEventListener("click", () => {
  const parts = pickedLangParts();
  if (!parts.length) { el.languageWarn.hidden = false; return; }
  send("set_word_language", { mode: langModeFromParts(parts) });
  el.languageOverlay.hidden = true;
});
el.closeHowTo.addEventListener("click", () => { el.howToOverlay.hidden = true; });
el.closeHowTo2.addEventListener("click", () => { el.howToOverlay.hidden = true; });
el.howToOverlay.addEventListener("click", (e) => { if (e.target === el.howToOverlay) el.howToOverlay.hidden = true; });

el.modePickerBtn.addEventListener("click", () => { el.modePickerOverlay.hidden = false; });
el.modePickerOverlay.addEventListener("click", (e) => { if (e.target === el.modePickerOverlay) el.modePickerOverlay.hidden = true; });
document.querySelectorAll(".pickerOption").forEach((btn) => {
  btn.addEventListener("click", () => {
    stagedMode = btn.dataset.mode;
    updateModePickerLabel();
    updateConnectButtons();
    el.modePickerOverlay.hidden = true;
  });
});

let activeLeaderboardTab = "round";
el.tabThisRound.addEventListener("click", () => { activeLeaderboardTab = "round"; renderLeaderboardTab(); });
el.tabAllTime.addEventListener("click", () => { activeLeaderboardTab = "total"; renderLeaderboardTab(); });

let socket = null;
let lastState = null;

// BOXDLE talks to the server over its own Socket.IO namespace "/boxdle"
// (Socket.IO reconnects automatically, so no manual retry loop is needed).
function connectSocket() {
  socket = io("/boxdle");

  socket.on("connect", () => setMiniStatus("Connected to game server."));
  socket.on("disconnect", () => setMiniStatus("Reconnecting to game server…"));
  socket.on("connect_error", () => setMiniStatus("Reconnecting to game server…"));

  socket.on("state", (payload) => {
    try { render(payload); } catch (err) { console.error("Couldn't render server state:", err); }
  });
  socket.on("offline_guess_result", (payload) => handleOfflineGuessResult(payload));
}
connectSocket();

function send(type, payload) {
  if (socket && socket.connected) {
    socket.emit("action", { type: type, payload: payload });
  } else {
    setMiniStatus("Not connected to the game server yet — try again in a moment.");
  }
}
function setMiniStatus(text) { el.miniStatus.textContent = text; }


function doConnect(usernameInput) {
  const username = usernameInput.value.trim();
  if (!username) { setMiniStatus("Type a TikTok username first."); return; }
  // If Live was only just picked in the Mode dropdown (not saved yet), switch the
  // game to Live right now so Connect works immediately - no "Save/Apply, reopen
  // Settings, then connect" detour. Messages on one socket arrive in order, so the
  // server is already in Live mode by the time it sees the connect request.
  const serverIsLive = lastState && lastState.game && lastState.game.mode === "live";
  if (!serverIsLive && stagedMode === "live") {
    send("apply_settings", { mode: "live" });
  }
  send("connect_tiktok", { username: username });
}
el.connectBtn.addEventListener("click", () => doConnect(el.tiktokUsername));
el.connectBtnBottom.addEventListener("click", () => doConnect(el.tiktokUsernameBottom));
el.disconnectBtn.addEventListener("click", () => send("disconnect_tiktok", {}));


el.applyBtn.addEventListener("click", () => {
  send("apply_settings", {
    mode: stagedMode,
    gridSize: Number(el.gridSizeSelect.value),
    allowReuse: el.reuseToggle.checked,
    minWordLength: Number(el.minLenSelect.value),
    roundSeconds: Number(el.roundSecondsInput.value) || 60,
    autoContinue: el.autoContinueToggle.checked,
    autoContinueDelaySeconds: Number(el.delayInput.value) || 3
  });
  closeDrawer(el.settingsOverlay);
});

// Leaderboard-show duration and message duration apply immediately, without restarting the round.
el.leaderboardShowInput.addEventListener("change", () => {
  send("set_leaderboard_show_seconds", { seconds: Number(el.leaderboardShowInput.value) || 3 });
});
el.rejectionToastShowInput.addEventListener("change", () => {
  send("set_rejection_toast_seconds", { seconds: Number(el.rejectionToastShowInput.value) || 4 });
});

el.playAgainBtn.addEventListener("click", () => send("play_again", {}));
el.giveUpBtn.addEventListener("click", () => send("give_up", {}));
el.hintBtn.addEventListener("click", () => send("use_hint", {}));
el.resetRoundBtn.addEventListener("click", () => send("reset_round_leaderboard", {}));
el.resetTotalBtn.addEventListener("click", () => send("reset_total_leaderboard", {}));


function submitOfflineGuess() {
  const word = el.offlineGuessInput.value.trim();
  if (!word) return;
  send("submit_offline_guess", { word: word });
}
el.offlineGuessBtn.addEventListener("click", submitOfflineGuess);
el.offlineGuessInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitOfflineGuess(); });

function handleOfflineGuessResult(result) {
  if (result.ok) {
    el.offlineError.textContent = "";
    el.offlineGuessInput.value = "";
  } else {
    el.offlineError.textContent = result.error || "That guess didn't work.";
  }
}


// ------------------------------------------------------------
// Win celebration: confetti + winner callout + auto-popup leaderboard
// ------------------------------------------------------------
const CONFETTI_COLORS = ["#F5A3D0", "#A9D6FB", "#ffffff", "#ffb100", "#7c5cff"];
function spawnConfetti() {
  const count = 70;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confettiPiece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const duration = 1.6 + Math.random() * 1.3;
    piece.style.animationDuration = duration + "s";
    piece.style.animationDelay = (Math.random() * 0.3) + "s";
    el.confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + 0.6) * 1000);
  }
}

let celebrationTimer = null;
let celebrationStage = 0;
const CELEBRATION_STAGES = ["winner", "round", "total"];

function renderCelebBoard(list) {
  if (!list || list.length === 0) {
    return '<li class="empty">No scores yet</li>';
  }
  return list
    .map((row, i) =>
      '<li><span class="rank">#' + (i + 1) + '</span>' + avatarChipHtml(row.username, row.avatarUrl, 22) + '<span class="lbName">' + escapeHtml(row.username) + '</span><span class="lbScore">' + row.score + "</span></li>"
    )
    .join("");
}

function showCelebrationStage(stageIndex, g) {
  const stage = CELEBRATION_STAGES[stageIndex];
  el.celebrationDots.querySelectorAll(".celebDot").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.stage) === stageIndex);
  });

  if (stage === "winner") {
    const info = g.lastWinInfo;
    const winnerName = (info && info.username) || "Someone";
    const winnerAvatar = info && info.avatarUrl;
    const word = ((info && info.word) || "").toUpperCase();
    const pts = info && typeof info.roundPoints === "number" ? info.roundPoints : 0;
    const words = info && info.words ? info.words : 0;
    el.celebrationBody.innerHTML =
      '<div class="celebLabel">🎉 Round winner</div>' +
      '<div class="celebWinnerRow">' + avatarChipHtml(winnerName, winnerAvatar, 34) + '<span>' + escapeHtml(winnerName) + "</span></div>" +
      '<div class="celebPoints">' + pts + " points · " + words + (words === 1 ? " word" : " words") + "</div>" +
      (word ? '<div class="celebAnswerRow">Longest: ' + escapeHtml(word) + "</div>" : "");
  } else if (stage === "round") {
    el.celebrationBody.innerHTML =
      '<div class="celebBoardTitle">🏆 Top scorers this round</div>' +
      '<ul class="celebBoardList">' + renderCelebBoard(lastState ? lastState.roundLeaderboard : []) + "</ul>";
  } else {
    el.celebrationBody.innerHTML =
      '<div class="celebBoardTitle">👑 All-time top scorers</div>' +
      '<ul class="celebBoardList">' + renderCelebBoard(lastState ? lastState.totalLeaderboard : []) + "</ul>";
  }
}

function hideCelebration() {
  clearTimeout(celebrationTimer);
  el.celebrationOverlay.hidden = true;
}

function advanceCelebration(g) {
  celebrationStage += 1;
  if (celebrationStage >= CELEBRATION_STAGES.length) {
    hideCelebration();
    return;
  }
  showCelebrationStage(celebrationStage, g);
  const seconds = g.leaderboardShowSeconds || 3;
  celebrationTimer = setTimeout(() => advanceCelebration(g), seconds * 1000);
}

function triggerWinCelebration(g) {
  spawnConfetti();
  celebrationStage = 0;
  el.celebrationOverlay.hidden = false;
  showCelebrationStage(0, g);
  const seconds = g.leaderboardShowSeconds || 3;
  clearTimeout(celebrationTimer);
  celebrationTimer = setTimeout(() => advanceCelebration(g), seconds * 1000);
}

el.closeCelebration.addEventListener("click", hideCelebration);
el.celebrationOverlay.addEventListener("click", (e) => { if (e.target === el.celebrationOverlay) hideCelebration(); });

let wasWon = false;
function detectWinTransition(g) {
  const isWon = g.status === "won";
  if (isWon && !wasWon) triggerWinCelebration(g);
  wasWon = isWon;
}


// ------------------------------------------------------------
// Floating message window - one slot above everything else, so it never covers anything.
// Green ✓ = a new valid word (with its points), red ✗ = a skipped word (with the reason).
// ------------------------------------------------------------
let lastToastAt = 0;
let toastHideTimer = null;
function maybeShowToast(g) {
  const t = g.lastToast;
  if (!t || t.at <= lastToastAt) return;
  lastToastAt = t.at;
  if ((g.serverNow || Date.now()) - t.at > 6000) return; // an old message seen only because the page was (re)opened
  const seconds = t.kind === "ok" ? Math.min(g.rejectionToastSeconds || 4, 3) : g.rejectionToastSeconds || 4;
  el.rejectionToast.className = "rejectionToast " + (t.kind === "ok" ? "ok" : "bad");
  el.rejectionToast.textContent = t.text;
  el.rejectionToast.hidden = false;
  el.rejectionToast.style.animation = "none";
  void el.rejectionToast.offsetWidth;
  el.rejectionToast.style.animation = "toast-flash " + seconds + "s ease forwards";
  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => { el.rejectionToast.hidden = true; }, seconds * 1000);
}

// ------------------------------------------------------------
// The round clock. The server sends when the round ends (roundEndsAt) and its own clock (serverNow); the page counts
// down by itself, so the clock stays smooth without a message every second. The last 10 seconds turn it red.
// ------------------------------------------------------------
let clockState = { endsAt: null, offset: 0, total: 60, status: "idle" };
let clockTimer = null;
function fmtTime(secs, asMinutes) {
  if (!asMinutes) return String(secs);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ":" + String(s).padStart(2, "0");
}
function renderClock(g) {
  clockState = { endsAt: g.roundEndsAt || null, offset: (g.serverNow || Date.now()) - Date.now(), total: g.roundSeconds || 60, status: g.status };
  el.clock.hidden = g.status === "idle";
  el.wordsChip.textContent = "📝 " + g.foundCount + (g.foundCount === 1 ? " word" : " words");
  el.pointsChip.textContent = "⭐ " + g.totalPoints + (g.totalPoints === 1 ? " pt" : " pts");
  if (g.status === "idle") el.lengthBadge.textContent = "⏱ " + fmtTime(g.roundSeconds || 60, (g.roundSeconds || 60) >= 100);
  tickClock();
  if (!clockTimer) clockTimer = setInterval(tickClock, 200);
}
function tickClock() {
  const st = clockState;
  if (st.status === "idle") return;
  const live = st.status === "live" && st.endsAt;
  const left = live ? Math.max(0, st.endsAt - (Date.now() + st.offset)) : 0;
  const secs = Math.ceil(left / 1000);
  const asMin = st.total >= 100;
  el.clockNum.textContent = fmtTime(secs, asMin);
  el.barFill.style.width = (live ? Math.max(0, Math.min(100, (left / (st.total * 1000)) * 100)) : 0) + "%";
  el.clock.classList.toggle("low", Boolean(live) && secs <= 10);
  el.lengthBadge.textContent = live ? "⏱ " + fmtTime(secs, asMin) : "⏱ time!";
  if (hl && hl.until <= Date.now()) { hl = null; applyHighlights(); }
}

// ------------------------------------------------------------
// The letter grid. Every tile is a plain letter. The word that was just found lights up gold with a line through its tiles
// (tap a word in the board to see its path again); the 💡 hint tile is purple.
// ------------------------------------------------------------
let tileEls = [];
let curMetrics = { n: 0, size: 0, gap: 0 };
let hl = null; // { path, until }
let hlTimer = null;

function gridMetrics(n) {
  const secW = el.gridSection.clientWidth || 320;
  const avail = Math.max(120, secW - 22);
  const gap = n <= 6 ? 6 : n <= 8 ? 5 : n <= 10 ? 4 : 3;
  const maxTile = n <= 6 ? 58 : n <= 8 ? 46 : n <= 10 ? 38 : 32;
  const size = Math.max(16, Math.min(maxTile, Math.floor((avail - gap * (n - 1)) / n)));
  return { n, size, gap, font: Math.max(10, Math.round(size * 0.52)) };
}

function renderGrid(g) {
  const n = g.boardSize || 0;
  const show = g.status !== "idle" && n > 0 && g.letters.length === n * n;
  el.gridSection.hidden = !show;
  if (!show) { lastGridSig = ""; tileEls = []; return; }

  const sig = [g.roundNumber, n, el.gridSection.clientWidth].join("|");
  if (sig !== lastGridSig) {
    lastGridSig = sig;
    const m = gridMetrics(n);
    curMetrics = m;
    const w = n * m.size + (n - 1) * m.gap;
    el.gridWrap.style.width = w + "px";
    el.grid.style.gridTemplateColumns = "repeat(" + n + ", " + m.size + "px)";
    el.grid.style.gap = m.gap + "px";
    el.grid.innerHTML = "";
    tileEls = [];
    const radius = Math.max(5, Math.round(m.size * 0.2)) + "px";
    for (let i = 0; i < g.letters.length; i++) {
      const t = document.createElement("div");
      t.className = "bxTile";
      t.style.width = m.size + "px";
      t.style.height = m.size + "px";
      t.style.fontSize = m.font + "px";
      t.style.borderRadius = radius;
      t.textContent = g.letters[i];
      el.grid.appendChild(t);
      tileEls.push(t);
    }
    el.pathSvg.setAttribute("width", w);
    el.pathSvg.setAttribute("height", w);
    el.pathSvg.setAttribute("viewBox", "0 0 " + w + " " + w);
  }
  el.grid.classList.toggle("over", g.status !== "live");
  el.ruleNote.textContent = g.allowReuse
    ? "Touching tiles only — up, down, sideways & corners · a tile may be reused in a word · " + g.minWordLength + "+ letters"
    : "Touching tiles only — up, down, sideways & corners · each tile once per word · " + g.minWordLength + "+ letters";
  applyHighlights(g);
}

function drawPath(path) {
  const m = curMetrics;
  if (!path || path.length < 2 || !m.n) { el.pathSvg.innerHTML = ""; return; }
  const step = m.size + m.gap;
  const half = m.size / 2;
  const pts = path.map((i) => (i % m.n) * step + half + "," + (Math.floor(i / m.n) * step + half)).join(" ");
  const first = path[0];
  const cx = (first % m.n) * step + half;
  const cy = Math.floor(first / m.n) * step + half;
  el.pathSvg.innerHTML =
    '<polyline points="' + pts + '" fill="none" stroke="var(--bx-path-dark)" stroke-opacity="0.72" stroke-width="' + Math.max(3, Math.round(m.size * 0.17)) +
    '" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.max(3, Math.round(m.size * 0.14)) + '" fill="var(--bx-path-dark)"></circle>';
}

function applyHighlights(g) {
  const gg = g || (lastState && lastState.game);
  const active = hl && hl.until > Date.now() ? hl.path : null;
  const set = new Set(active || []);
  const hintCell = gg && gg.status === "live" && gg.hint ? gg.hint.cell : -1;
  for (let i = 0; i < tileEls.length; i++) {
    tileEls[i].classList.toggle("hl", set.has(i));
    tileEls[i].classList.toggle("hint", i === hintCell && !set.has(i));
  }
  drawPath(active);
}

function setHighlight(path, ms) {
  hl = { path: path.slice(), until: Date.now() + ms };
  applyHighlights();
  clearTimeout(hlTimer);
  hlTimer = setTimeout(() => { hl = null; applyHighlights(); }, ms + 40);
}

// a new word was found: light up its path (only for words that are really new, not when the page is just opened)
let seenFoundAt = 0;
let seenRound = -1;
function detectNewWord(g) {
  if (g.roundNumber !== seenRound) {
    seenRound = g.roundNumber;
    seenFoundAt = 0;
    hl = null;
  }
  const newest = g.found[g.found.length - 1];
  if (!newest || newest.at <= seenFoundAt) return;
  seenFoundAt = newest.at;
  if (g.status === "live" && (g.serverNow || Date.now()) - newest.at < 5000) pendingHighlight = newest.path;
}
let pendingHighlight = null;

// ------------------------------------------------------------
// The board of guessed words: every valid word of the round, newest first, with who found it and its points.
// Tap a word to see its path on the grid.
// ------------------------------------------------------------
let lastBoardSig = "";
let boardRows = [];
function renderBoard(g) {
  const show = g.status !== "idle";
  el.board.hidden = !show;
  if (!show) { lastBoardSig = ""; return; }

  el.boardMeta.textContent =
    g.foundCount + (g.foundCount === 1 ? " word" : " words") + " · " + g.totalPoints + (g.totalPoints === 1 ? " point" : " points") +
    (g.playerCount ? " · 👥 " + g.playerCount : "");

  const newest = g.found[g.found.length - 1];
  const sig = [g.roundNumber, g.foundCount, g.status, newest ? newest.avatarUrl || "" : "", g.missed.join(",")].join("|");
  if (sig === lastBoardSig) return;
  lastBoardSig = sig;

  const keepScroll = el.wordList.scrollTop;
  boardRows = g.found.slice().reverse();
  if (boardRows.length === 0) {
    el.wordList.innerHTML = '<li class="bxEmpty">' + (g.status === "live" ? "No words yet — type a word you can trace on the grid in the chat!" : "No words were found this round.") + "</li>";
  } else {
    const freshAt = newest && g.status === "live" && (g.serverNow || Date.now()) - newest.at < 2500 ? newest.at : -1;
    el.wordList.innerHTML = boardRows
      .map((f, i) =>
        '<li class="bxWordRow' + (f.at === freshAt ? " fresh" : "") + '" data-i="' + i + '" title="Tap to show the path on the grid">' +
        avatarChipHtml(f.caller, f.avatarUrl, 24) +
        '<span class="bxWordText">' + escapeHtml(f.word) + "</span>" +
        '<span class="bxWho">' + escapeHtml(f.caller) + "</span>" +
        '<span class="bxPts">+' + f.points + "</span></li>"
      )
      .join("");
    el.wordList.scrollTop = keepScroll;
  }

  if (g.status !== "live" && g.missed.length > 0) {
    el.missed.hidden = false;
    el.missed.innerHTML = "💡 Words that were hiding on this grid: " + g.missed.map((w) => "<b>" + escapeHtml(w) + "</b>").join(" ");
  } else {
    el.missed.hidden = true;
    el.missed.innerHTML = "";
  }
}
el.wordList.addEventListener("click", (e) => {
  const row = e.target.closest && e.target.closest(".bxWordRow");
  if (!row) return;
  const f = boardRows[Number(row.dataset.i)];
  if (f && f.path) setHighlight(f.path, 4000);
});

function renderHint(g) {
  let html = "";
  if (g.status === "live" && g.hint) {
    html = '<div class="bxHintLine">💡 A <b>' + g.hint.length + "-letter</b> word starts at the purple tile (letter <b>" + escapeHtml(g.hint.letter.toUpperCase()) + "</b>).</div>";
  } else if (g.status === "live" && g.hintNote) {
    html = '<div class="bxHintLine note">' + escapeHtml(g.hintNote.text) + "</div>";
  }
  el.hintChips.innerHTML = html;
}

function renderModeNotes(g) {
  el.offlineNote.hidden = !(g.status === "live" && g.mode === "offline");
}

function renderBanners(g) {
  el.idleBanner.hidden = g.status !== "idle";
  el.resultBanner.hidden = g.status !== "won" && g.status !== "lost";

  if (g.status === "won") {
    const info = g.lastWinInfo;
    el.resultBanner.className = "resultBanner win";
    if (info && info.username) {
      el.resultText.textContent =
        "🎉 " + info.username + " wins the round with " + info.roundPoints + " points (" + info.words + (info.words === 1 ? " word" : " words") + ")! " +
        g.foundCount + (g.foundCount === 1 ? " word" : " words") + " and " + g.totalPoints + " points were found in total.";
    } else {
      el.resultText.textContent = "🎉 Time's up! " + g.foundCount + " words found for " + g.totalPoints + " points.";
    }
  } else if (g.status === "lost") {
    el.resultBanner.className = "resultBanner lost";
    el.resultText.textContent = "⏱ Time's up! No words were found this round.";
  }

  if ((g.status === "won" || g.status === "lost") && g.autoContinue) {
    el.autoContinueNote.hidden = false;
    el.autoContinueNote.textContent = "Next grid in " + g.autoContinueSecondsLeft + "s…";
  } else {
    el.autoContinueNote.hidden = true;
  }
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------
const CONNECTION_LABELS = {
  idle: "Idle", connecting: "Connecting…", retrying: "Retrying…",
  live: "LIVE", test_mode: "Simulating (Test Mode)", error: "Connection issue", disconnected: "Disconnected"
};

function render(state) {
  lastState = state;
  const g = state.game;
  if (window.ScoreTicker) window.ScoreTicker.update(state); // scrolling top-scorers ticker
  if (window.WordLanguage) window.WordLanguage.update(g, (mode) => send("set_word_language", { mode })); // word language
  if (el.languageOverlay && el.languageOverlay.hidden) syncLanguageBoxes(g); // languages popup mirrors the server (not while it is open)
  detectWinTransition(g);
  detectNewWord(g);
  renderHeader(state);
  renderModeUI(g);
  renderClock(g);
  renderGrid(g);
  if (pendingHighlight) { const p = pendingHighlight; pendingHighlight = null; setHighlight(p, 3500); }
  renderBoard(g);
  renderHint(g);
  renderModeNotes(g);
  renderBanners(g);
  maybeShowToast(g);
  renderSettingsChips(state);
  renderDiagnostics(state.diagnostics);
  if (!el.leaderboardOverlay.hidden) renderLeaderboardTab();
}

function renderHeader(state) {
  const connStatus = state.diagnostics.connectionStatus || "idle";
  el.brandDot.className = "brandDot " + (state.game.mode === "test" ? "test_mode" : connStatus);
  el.modeBadge.textContent = state.game.mode.toUpperCase();
  el.modeBadge.className = "modeBadge " + state.game.mode;
  el.hintBtn.disabled = state.game.status !== "live";
  el.giveUpBtn.disabled = state.game.status !== "live";
}

function renderModeUI(g) {
  el.liveControls.hidden = g.mode !== "live";
  el.testControls.hidden = g.mode !== "test";
  el.offlineControls.hidden = g.mode !== "offline";
}


// ------------------------------------------------------------
// Per-guesser avatar - a deterministic "colored circle + initial"
// generated from the username (TikTok chat events don't reliably give
// us a hotlinkable profile-photo URL here, so this is a stable stand-in
// that's always the same color/letter for the same person every time).
// ------------------------------------------------------------
const AVATAR_PALETTE = [
  "#e0699c", "#4fa0c4", "#6faa5c", "#e0a934", "#9c6fd1",
  "#e0724a", "#3aa6a6", "#c4577a", "#5c8ae0", "#8aa63a"
];
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function avatarColorFor(username) {
  return AVATAR_PALETTE[hashString(username || "?") % AVATAR_PALETTE.length];
}
function avatarInitial(username) {
  const clean = String(username || "").trim();
  return clean ? Array.from(clean)[0].toUpperCase() : "?"; // Array.from keeps emoji (the 🎲 starter label) intact
}

// Builds an actual DOM avatar node (used inside the guess grid, where
// rows are built as real elements, not innerHTML strings). Shows the
// viewer's real TikTok profile picture when we have one; if the image
// URL is missing, blocked, or fails to load, it falls back to the
// deterministic colored-initial circle instead of leaving a blank hole.
function buildAvatarNode(username, avatarUrl, sizePx, fontPx, className) {
  const wrap = document.createElement("div");
  wrap.className = className || "guessAvatar";
  wrap.style.width = sizePx + "px";
  wrap.style.height = sizePx + "px";
  wrap.title = username || "Unknown viewer";

  function showFallback() {
    wrap.innerHTML = "";
    wrap.style.background = avatarColorFor(username);
    wrap.style.fontSize = fontPx + "px";
    wrap.textContent = avatarInitial(username);
  }

  if (avatarUrl) {
    const img = document.createElement("img");
    img.className = "avatarImg";
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.onerror = showFallback;
    img.src = avatarUrl;
    wrap.appendChild(img);
  } else {
    showFallback();
  }
  return wrap;
}

// Same idea as buildAvatarNode, but returns an HTML string for spots
// that build their markup with innerHTML (leaderboard rows, the win
// celebration banner) rather than individual DOM nodes.
function avatarChipHtml(username, avatarUrl, sizePx) {
  sizePx = sizePx || 22;
  const initial = escapeHtml(avatarInitial(username));
  const color = avatarColorFor(username);
  const title = escapeHtml(username || "Unknown viewer");
  if (avatarUrl) {
    return (
      '<span class="lbAvatar" style="width:' + sizePx + "px;height:" + sizePx + 'px;" title="' + title + '">' +
      '<img class="avatarImg" alt="" referrerpolicy="no-referrer" src="' + escapeHtml(avatarUrl) + '" ' +
      "onerror=\"this.parentElement.classList.add('lbAvatarFallback');this.parentElement.style.background='" + color + "';this.replaceWith('" + initial + "')\" />" +
      "</span>"
    );
  }
  return (
    '<span class="lbAvatar lbAvatarFallback" style="width:' + sizePx + "px;height:" + sizePx + "px;background:" + color + ';" title="' + title + '">' +
    initial +
    "</span>"
  );
}


function renderSettingsChips(state) {
  const g = state.game;
  const modeInfo = MODE_LABELS[g.mode];
  el.modeChip.textContent = "Mode: " + modeInfo.title + " — " + modeInfo.desc;
  el.modeChip.className = "statusChip " + (g.mode === "live" ? "good" : "");

  const connStatus = state.diagnostics.connectionStatus;
  el.connChip.textContent = "TikTok: " + (CONNECTION_LABELS[connStatus] || connStatus);
  el.connChip.className = "statusChip " + (connStatus === "live" ? "good" : connStatus === "error" ? "bad" : "");

  updateConnectButtons();
}

// The drawer's Connect button is usable as soon as "Live" is chosen in the Mode
// dropdown (even before Apply/Save); the bottom-bar one only exists in Live mode.
function updateConnectButtons() {
  const serverIsLive = !!(lastState && lastState.game && lastState.game.mode === "live");
  el.connectBtn.disabled = !(serverIsLive || stagedMode === "live");
  el.connectBtnBottom.disabled = !serverIsLive;
}

function renderDiagnostics(diag) {
  const dictLabel = diag.dictionaryLoading
    ? "Loading…"
    : diag.dictionaryWordCount.toLocaleString() + " words (" + (diag.dictionarySource === "full" ? "full list" : "fallback list") + ")";
  const dictTone = diag.dictionaryLoading ? "warn" : diag.dictionarySource === "full" ? "good" : "bad";

  const rows = [
    ["Raw events received", diag.rawEventCount, "good"],
    ["Last received", diag.lastReceivedUser ? diag.lastReceivedUser + ": " + (diag.lastReceivedText || "(empty)") : "—", null],
    ["Connection status", CONNECTION_LABELS[diag.connectionStatus] || diag.connectionStatus, statusTone(diag.connectionStatus)],
    ["Signing key set up?", diag.signKeyConfigured ? "Yes" : "No — see setup guide", diag.signKeyConfigured ? "good" : "bad"],
    ["Word dictionary", dictLabel, dictTone],
    ["Retry attempts", diag.retryAttempt + " / " + diag.maxRetries, diag.retryAttempt > 0 ? "warn" : null],
    ["Last message", diag.lastErrorMessage || "—", diag.lastErrorMessage ? "bad" : null]
  ];

  el.diagGrid.innerHTML = rows
    .map(([key, val, tone]) =>
      '<div class="diagRow"><span class="diagKey">' + escapeHtml(key) + '</span><span class="diagVal ' + (tone || "") + '">' + escapeHtml(String(val)) + "</span></div>"
    )
    .join("");
}

function statusTone(status) {
  if (status === "live" || status === "test_mode") return "good";
  if (status === "error" || status === "disconnected") return "bad";
  if (status === "connecting" || status === "retrying") return "warn";
  return null;
}

function renderLeaderboardTab() {
  el.tabThisRound.classList.toggle("active", activeLeaderboardTab === "round");
  el.tabAllTime.classList.toggle("active", activeLeaderboardTab === "total");
  if (!lastState) return;

  const g = lastState.game;
  const list = activeLeaderboardTab === "round" ? lastState.roundLeaderboard : lastState.totalLeaderboard;

  if (g.mode === "test") {
    el.leaderboardList.innerHTML = "";
    el.leaderboardNote.hidden = false;
    el.leaderboardNote.textContent = "Test Mode scores aren't saved to the leaderboard.";
    return;
  }
  if (g.mode === "offline") {
    el.leaderboardList.innerHTML = "";
    el.leaderboardNote.hidden = false;
    el.leaderboardNote.textContent = "Offline mode is solo — there's no chat leaderboard here.";
    return;
  }

  el.leaderboardNote.hidden = true;
  if (!list || list.length === 0) {
    el.leaderboardList.innerHTML = '<li class="empty">No scores yet — guesses made in Live mode will show up here.</li>';
    return;
  }
  el.leaderboardList.innerHTML = list
    .map((row, i) =>
      '<li><span class="rank">#' + (i + 1) + '</span>' + avatarChipHtml(row.username, row.avatarUrl, 22) + '<span class="lbName">' + escapeHtml(row.username) + '</span><span class="lbScore">' + row.score + "</span></li>"
    )
    .join("");
}


function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
