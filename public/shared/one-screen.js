/* ==========================================================================
   ONE SCREEN (update 131) - keeps every game page on ONE screen, with nothing scrolling and nothing cut.
   See one-screen.css for the rules. This script only decides HOW MUCH tightening a given screen needs:
     level 0  = normal look           level 1..3 = tighter spacing / smaller banner (CSS data-os)
     then     = an even scale-down of the whole page (CSS zoom) if it still does not fit.
   It re-checks after every resize, rotation and layout change of the page, and it never touches the games' own logic.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__oneScreen) return;
  var de = document.documentElement;
  de.classList.add("os");
  var MIN_ZOOM = 0.5, MAX_LEVEL = 3;
  var root = null, level = 0, zoom = 1, timer = 0, busy = false, observer = null, lastKey = "";

  var PAGES = { travle: { root: "#app", board: "#globeWrap", min: 150 }, findle: { root: "body", board: "#gridWrap", min: 180 }, contexto: { root: "#app", board: "#guessList", min: 110 }, boxdle: { board: "#tilesWrap", min: 80 } };
  function page() { var b = document.body; return b ? (b.getAttribute("data-os-page") || (b.getAttribute("data-game") === "boxdle" ? "boxdle" : "")) : ""; }
  function findRoot() {
    var pg = PAGES[page()]; if (pg && pg.root) { var r = pg.root === "body" ? document.body : document.querySelector(pg.root); if (r) return r; }
    return document.querySelector("body[data-game] > .app, body[data-game] > #app") ||
           document.querySelector(".app") || document.getElementById("app") || null;
  }
  function boardEl() {
    var pg = PAGES[page()]; if (pg && pg.board) { var e = document.querySelector(pg.board); if (e) return e; }
    return document.getElementById("tilesWrap") || document.getElementById("grid") || document.getElementById("board") || null;
  }
  function vh() { return Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight); }
  function vw() { return Math.round((window.visualViewport && window.visualViewport.width) || window.innerWidth); }

  /** Smallest board height worth having: about three guess rows, never more than a fifth of the screen. */
  function minBoard(virtualH) { var pg = PAGES[page()]; if (pg) return Math.min(pg.min, Math.round(virtualH * 0.32)); return Math.max(96, Math.min(170, Math.round(virtualH * 0.16))); }

  function clipped(e) { return !!e && e.offsetParent !== null && e.scrollHeight - e.clientHeight > 1; }
  function fits(virtualH) {
    var over = root.scrollHeight - root.clientHeight;
    if (over > 1) return false;
    // something inside the game card (grid, legend, banners) must not be cut off either
    if (clipped(root.querySelector(".stage")) || clipped(root.querySelector(".round-card")) || clipped(root.querySelector(".main-content")) || clipped(root.querySelector(".board-section"))) return false;
    var b = boardEl();
    if (b && b.offsetParent !== null && !b.hidden && b.clientHeight < minBoard(virtualH)) return false;
    return true;
  }
  function setZoom(z) {
    if (z >= 0.999) {
      root.style.removeProperty("zoom"); root.style.removeProperty("width"); root.style.removeProperty("height"); root.style.removeProperty("max-height");
      de.style.removeProperty("--os-zoom"); zoom = 1; return;
    }
    zoom = z;
    root.style.setProperty("zoom", String(z), "important");
    root.style.setProperty("width", (vw() / z) + "px", "important");
    root.style.setProperty("height", (vh() / z) + "px", "important");
    root.style.setProperty("max-height", (vh() / z) + "px", "important");
    de.style.setProperty("--os-zoom", String(z));
  }
  function setLevel(n) { level = n; if (n) de.setAttribute("data-os", String(n)); else de.removeAttribute("data-os"); }

  function fit() {
    if (busy) return; busy = true;
    root = root || findRoot();
    if (!root) { busy = false; return; }
    if (observer) observer.disconnect();
    var H = vh();
    setZoom(1); setLevel(0);
    var ok = fits(H);
    for (var n = 1; !ok && n <= MAX_LEVEL; n++) { setLevel(n); ok = fits(H); }
    if (!ok) {
      var z = 1;
      for (var i = 0; i < 8 && !ok; i++) {
        var over = root.scrollHeight / Math.max(1, root.clientHeight);
        var board = boardEl(), short = board && board.clientHeight < minBoard(H / z) ? 0.94 : 1;
        z = Math.max(MIN_ZOOM, z / Math.max(1.0, over) * 0.99 * short);
        setZoom(z); ok = fits(H / z);
        if (z <= MIN_ZOOM) break;
      }
    }
    if (!ok && zoom <= MIN_ZOOM + 0.001) { root.style.setProperty("overflow-y", "auto", "important"); } else { root.style.removeProperty("overflow-y"); }
    var key = level + "|" + zoom.toFixed(3) + "|" + vw() + "x" + vh();
    var changed = key !== lastKey; lastKey = key;
    busy = false; arm();
    if (changed) { internalResize = true; window.dispatchEvent(new Event("resize")); internalResize = false; }
  }
  var internalResize = false;
  function schedule(delay) { clearTimeout(timer); timer = setTimeout(fit, delay == null ? 90 : delay); }
  function arm() {
    if (!root || typeof MutationObserver === "undefined") return;
    if (!observer) observer = new MutationObserver(function () { schedule(70); });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
  }

  window.__oneScreen = { fit: fit, level: function () { return level; }, zoom: function () { return zoom; } };

  window.addEventListener("resize", function () { if (!internalResize) schedule(60); });
  window.addEventListener("orientationchange", function () { schedule(250); });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", function () { schedule(80); });
  window.addEventListener("load", function () {
    // the games size their tiles from the height the board really has (not from the window height minus a guess)
    try {
      if (typeof window.computeAvailableTilesHeight === "function") {
        window.computeAvailableTilesHeight = function () { var w = document.getElementById("tilesWrap"); var h = (w && w.clientHeight) || 160; return Math.max(40, Math.floor((h - 16) / 3)); }; // tiles are sized so about three guess rows are visible
      }
    } catch (e) {}
    schedule(30); setTimeout(fit, 600); setTimeout(fit, 1800);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { schedule(30); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { schedule(0); }); else schedule(0);
})();
