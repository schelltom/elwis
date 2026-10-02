/* OCR der Alarm-Meldung: aus dem Text kommt eine Adresse, die adresseSplit in Straße/PLZ/Ort teilt. */
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { ladeFunktionen } from "./_ausquelle.mjs";

const APP = fileURLToPath(new URL("../public/app.js", import.meta.url));
const { ocrAdresse, adresseSplit } = ladeFunktionen(APP, ["ocrAdresse", "adresseSplit"]);

test("Label Straße + Label Ort → drei Felder", () => {
  const a = ocrAdresse("Straße: Musterweg 5\nOrt: 92637 Weiden i.d.OPf.");
  assert.deepEqual(adresseSplit(a), { strasse: "Musterweg 5", plz: "92637", ort: "Weiden i.d.OPf." });
});
test("PLZ steht schon in der Einsatzort-Zeile → Ort nicht doppelt", () => {
  const a = ocrAdresse("Einsatzort: Musterweg 5, 92637 Weiden\nOrt: 92637 Weiden");
  assert.deepEqual(adresseSplit(a), { strasse: "Musterweg 5", plz: "92637", ort: "Weiden" });
  assert.equal((a.match(/92637/g) || []).length, 1);
});
