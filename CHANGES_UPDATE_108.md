# Update 108 - TOWNDLE: far bigger place list, forgiving matching, Malaysia hints

## Why
Viewers kept typing real Malaysian places that TOWNDLE called "not a place". This update attacks that from four sides.

## 1. A much bigger place list
* `server/towndle/towns-data-1..4.js` - hand-checked places with coordinates (about 920, unchanged).
* NEW `server/towndle/towns-bulk-1..4.js` - about 1,500 more lesser-known / rare places (mukims, townships, small towns, islands, new townships),
  one line per district. They have no hand-written coordinates: each sits at a stable spot near its district seat, so the **state / neighbour colors
  are exact** while the **distance and arrow are only a rough guide** (shown as "≈"). Total built in: about **2,400 places**.
* NEW GeoNames import: the free list of Malaysian populated places (thousands of villages) is downloaded **once, automatically, on the first start with internet**
  (`data/MY.txt`), or by hand with `npm run import:towns`. Each imported place takes the state and district of the nearest hand-checked place.
  Turn the automatic download off with `TOWNDLE_AUTO_GEONAMES=0` in `.env`.
* Everyday chat words that are also village names (sayang, cantik, hello, love ...) are never taken for guesses; they must be typed with the state.

## 2. Forgiving name matching
"Sg Petani", "Sungai-Petani", "Bandar Baru Bangi", "Pekan Pontian", "Kota Kinabalu city", "JB", "KL", "KK", "PJ" and old spellings
(Johor Bahru / Baharu / Baru, Ayer / Air, Telok / Teluk, Tanjong / Tanjung, Kampong / Kampung) now all find the right place.

## 3. "Places chat tried" (Settings)
Every comment that looks like a place name but is not in the list is counted. In Live mode a name that **2 or more different viewers** typed shows up in
Settings -> "Places chat tried". Choose its state and district, press **Add** - it works immediately and is saved in `data/towns-extra.txt`
(format: `Name, State, District, Tier`). **Not a place** dismisses it.

## 4. New hint system (10 kinds, made for Malaysia)
Region - State - Type of place - Neighbouring district (a different one each time) - Near a known place ("within about 15 km of Tumpat") - Starts with
(first letter, words, letters) - District - Reveal a letter (cumulative pattern `K _ _ A  _ _ _ _ _`, never the last letter) - Rule out letters - Place idea
(fits every color and is about as far as the secret place from each guess, well-known places first). The host can switch each kind on or off in Settings -> Hints;
automatic hints go from the vaguest (region) to the strongest.

## Also
* New setting "Rare places (approximate position) can be the secret place" (default ON).
* `npm run check:towns` now also tells how many places have approximate positions.
* Version 2.57.0.

Run `npm install` as usual (no new dependencies) and redeploy the whole folder.
