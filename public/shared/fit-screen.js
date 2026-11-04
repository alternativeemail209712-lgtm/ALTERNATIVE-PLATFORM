/* fit-screen.js (update 131) - see fit-screen.css. Makes the game one screen without scrolling.
   Only ever SHRINKS the game (CSS zoom, crisp text) when the screen is too small for everything at full size.
   It starts from full size again only when the window size / rotation changes. No jumping up and down. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var MIN_ZOOM = 0.7;      // never smaller than this (text stays readable)
  var STEP = 0.02;
  var GROW_MARGIN = 40;   // extra px of spare list height needed before the game is allowed to grow back
  var MIN_LIST = 130;      // px (at the current zoom) the guess list must keep
  var app = null, list = null, card = null, zoom = 1, lastW = 0, lastH = 0, queued = false, timer = null, observer = null;
  doc.classList.add("fs");

  function setZoom(z) {
    zoom = Math.max(MIN_ZOOM, Math.min(1, z));
    doc.style.setProperty("--fs-zoom", String(zoom));
  }
  function setVh() { doc.style.setProperty("--fs-vh", window.innerHeight + "px"); }
  function overflowing() {
    if (!app) return false;
    if (window.__fitScreenPre) window.__fitScreenPre();   // (TRAVLE) let the globe take / give back its share first
    if (app.scrollHeight > app.clientHeight + 1) return true;
    // the card that holds legend + keyboard + guess list must hold ALL of them (it clips instead of scrolling)
    if (card && card.scrollHeight > card.clientHeight + 1) return true;
    var box = list && list.parentNode && list.parentNode.classList && list.parentNode.classList.contains("fxBoard") ? list.parentNode : list;
    if (box && box.offsetParent !== null && box.clientHeight < MIN_LIST - 1) return true;
    return false;
  }
  function fit(fromFull) {
    queued = false;
    app = app || document.querySelector(".app") || document.getElementById("app");
    if (!app) return;
    list = list || app.querySelector(".tilesWrap") || app.querySelector(".round-card > .grid") || app.querySelector(".board-section > #board") || app.querySelector("#game > .board > .guess-list");
    card = card || app.querySelector(".round-card") || app.querySelector(".board-section") || app.querySelector("main.board") || app.querySelector("#game");
    setVh();
    if (fromFull) setZoom(1);
    var guard = 0;
    while (overflowing() && zoom > MIN_ZOOM + 0.0001 && guard++ < 40) setZoom(zoom - STEP);
    if (zoom < 1) scheduleGrow();
  }
  // Grow back (after something big - a panel, a banner - went away). Only when there is CLEAR spare room (the guess
  // list would still keep MIN_LIST + GROW_MARGIN px at the bigger size), so the size can never bounce up and down.
  var growTimer = 0;
  function listBox() {
    return list && list.parentNode && list.parentNode.classList && list.parentNode.classList.contains("fxBoard") ? list.parentNode : list;
  }
  function scheduleGrow() {
    if (growTimer) return;
    growTimer = setTimeout(function () { growTimer = 0; grow(); }, 1800);
  }
  function grow() {
    if (!app || zoom >= 1) return;
    var start = zoom, ok = zoom, guard = 0;
    while (ok < 1 && guard++ < 40) {
      setZoom(ok + STEP);
      var box = listBox();
      var roomy = !overflowing() && (!box || box.offsetParent === null || box.clientHeight >= MIN_LIST + GROW_MARGIN);
      if (!roomy) break;
      ok = zoom;
    }
    setZoom(ok);
    if (ok < 1 && ok !== start) scheduleGrow();
  }
  function schedule(fromFull) {
    if (fromFull) { lastW = -1; }
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { fit(fromFull === true); });
  }
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 1) return;
    lastW = w; lastH = h;
    clearTimeout(timer);
    timer = setTimeout(function () { schedule(true); }, 80);
  }
  function start() {
    app = document.querySelector(".app") || document.getElementById("app");
    if (!app) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    fit(true);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", function () { setTimeout(onResize, 200); });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
    // anything inside the game that appears / disappears / changes size (legend, hint chips, banners, host bar...)
    if (window.MutationObserver) {
      observer = new MutationObserver(function () { if (observer._t) return; observer._t = setTimeout(function () { observer._t = 0; schedule(false); }, 120); });
      observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style"] });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { schedule(true); });
    window.addEventListener("load", function () { schedule(true); });
    window.__fitScreen = { refit: function () { schedule(true); }, zoom: function () { return zoom; } };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
