/* Lokaler Schutz: Ein veralteter dist/-Ordner (Build fehlgeschlagen, z. B. fehlendes Rolldown-Binary)
   liefert den alten App-Stand aus, ohne dass es auffällt. Ohne dist/ (frische Checkouts, CI) wird übersprungen. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const wurzel = p => fileURLToPath(new URL("../" + p, import.meta.url));
const hatDist = fs.existsSync(wurzel("dist/app.js"));

for(const datei of ["app.js", "app.css", "sw.js"]){
  test(`dist/${datei} entspricht public/${datei} (npm run build ausführen, wenn nicht)`, { skip: !hatDist && "kein dist/-Ordner" }, () => {
    assert.ok(fs.readFileSync(wurzel("dist/" + datei)).equals(fs.readFileSync(wurzel("public/" + datei))),
      `dist/${datei} ist veraltet – „npm run build“ fehlgeschlagen oder nicht gelaufen?`);
  });
}
