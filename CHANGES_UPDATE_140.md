# UPDATE 140

Client-side only (CSS + 2 JS files). No server code, no settings, no data files changed. Deploy by replacing the folder and restarting as usual.

## 1. TWISTLE and CROSSDLE - rows cut off at the bottom, line between rows
**Twistle** (`public/twistle/style.css`)
- Cause: each `.guessRow` is an `overflow-x:auto` box, and a box that scrolls on one axis also clips on the other. Inside the fixed-height list the rows were also shrunk by flex below their own height (measured: 9 guesses -> rows 13px tall holding 21px of content), slicing the tile bottoms, their 3D edge and the symbol shadows.
- Fix: rows never shrink (`flex: 0 0 auto`) and carry room for the 3D edge/shadow inside their own box; negative margins give the room back, so row spacing is unchanged.

**Crossdle** (`public/crossdle/style.css`)
- Cause: every guess was a bordered card with a drop shadow (plus a 3D edge line from the shared theme) inside a board that scrolls and clips; the last row's shadow was sliced at the bottom edge and the sides.
- Fix: borderless, shadow-free rows (the tiles carry the look), a correct guess is marked with a soft green tint instead of a border, the shared theme's row edge line is turned off for these rows, and the board has enough padding around its content that tile glows are never sliced.

## 2. MINEDLE - result panel / Play again / countdown below the screen
(`server/minedle/public/minedle-game.js`)
- Cause: the board always took ~46% of the screen height, so after a round ended (result panel added) the page was taller than the screen. fit-screen shrank everything to 70% and then fell back to scrolling, leaving the panel under the bottom edge.
- Fix 1: the board now gives way first. fit-screen asks the board (`window.__fitScreenPre`, the same hook TRAVLE uses) to fit; the board is re-measured from its natural size and made only as small as needed (never below 20 screen px per tile).
- Fix 2 (safety net for very small phones): if the page still has to scroll, the result panel is scrolled into view once when a round ends.
- Measured on a 392x864 phone with a compact legend: result panel was at 869-958px (off-screen), now 739-834px (on-screen, no scrolling needed).

## 3. ALL GAMES - floating guess window vs the game panel
(`public/shared/theme.css`, `public/shared/theme.js`)
- Before: a reserved 44-52px message slot plus ~32px of padding sat between the score ticker and the game card (~76px of blank space whenever no message was showing).
- Now the message window is DOCKED into the ticker strip: it appears exactly where the ticker is (centred in it) and the ticker is hidden only while a message is on screen. Nothing is covered, nothing overlaps, the layout never jumps, and the blank band is gone: the game card moved up ~45px in all 23 games that have a message slot (Contexto has none and is unchanged).
- The gap above the card is now only as tall as the washi tape / heart that sticks out of it.
- Crossdle keeps its slot inside a clipping board section, so theme.js moves the slot next to the ticker so the message can sit in the ticker strip.
- Safe fallback: if the host hides the ticker, the old reserved slot comes back automatically (message still never overlaps).

## Not changed / known limits
- Minedle on a very small phone (~360x740) with a large board still needs a little scrolling; the result panel is auto-scrolled into view when the round ends.
- The cause of "cannot scroll" on the phone could not be reproduced in a desktop emulation (scrolling worked there); the fix removes the need to scroll in the normal case.
- Tested with a stub test harness (real client code, simulated game states, headless Chromium at 360x740, 392x864, 412x915). Not tested on a physical phone or against the live server / TikTok.
