// import-geonames.mjs - `npm run import:towns`
// Downloads the free GeoNames list of Malaysian places into data/MY.txt (needs internet). Restart the server afterwards: TOWNDLE then knows
// thousands more villages and small places (each gets the state / district of the nearest hand-checked place).
import { downloadGeonamesMY, DATA_DIR } from "../server/towndle/geonames-fetch.js";
console.log("Downloading the GeoNames list of Malaysian places ...");
try {
  const text = await downloadGeonamesMY();
  const rows = text.split("\n").filter((l) => l.split("\t")[8] === "MY" && l.split("\t")[6] === "P").length;
  console.log(`Saved ${DATA_DIR}/MY.txt  (${rows} populated places). Restart the server, then run  npm run check:towns  to see the new total.`);
} catch (e) {
  console.error("Could not download: " + e.message);
  console.error("Download MY.zip by hand from https://download.geonames.org/export/dump/ , unzip it and put MY.txt into the data folder.");
  process.exit(1);
}
