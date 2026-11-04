# UPDATE 131 - every game fits ONE screen (no page scrolling)

## What changed
Every game page now sits in a box exactly as tall as the screen. Nothing is cut off and the page itself never scrolls.

* NEW `public/shared/one-screen.css` + `public/shared/one-screen.js`, linked into all 28 game pages
  (the 22 word games, Twistle, Boxdle, Crossdle, Travle, Contexto, Findle display + Findle host).
* The BOARD (guessed words / grid / globe / guess list) is the flexible part: it takes the height that is left and only
  its own list scrolls when there are more guesses than rows that fit. Word-game tiles are sized so about 3 guess rows fit.
* If the fixed parts (title banner, bars, keyboard, legend, host controls) need more than the screen has, the layout
  tightens in 3 steps (smaller banner / spacing, TikTok safe-top reserve shrinks only when needed), and only if that is
  still not enough the whole page is scaled evenly (CSS zoom, so text and symbols stay sharp). Floor 50%.
* It re-checks on every resize, rotation and layout change. On tall screens (e.g. a phone) most games stay at 100%.
* Crossdle + Findle host: the "Display & layout" card was sitting inside the top bar (made it 500-650 px tall). It now
  lives in the Host Controls panel (Crossdle) / Settings drawer (Findle host).
* Findle: the grid square is sized from the room that is left (container units), not from viewport units.
* Travle: the globe is now a circle as large as the room left; route card + feed + host dock always visible.
* Contexto: page locked, only the guess list scrolls inside itself.
* Boxdle: grid / clock / guessed words are measured against the real card height.

## Not changed on purpose
Flagle's pre-game SETUP form (a long settings form) still scrolls; its game screen already fits one screen.

## To disable for a page
Remove the two `one-screen` lines from that page's `<head>`.
