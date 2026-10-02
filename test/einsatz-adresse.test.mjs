/* Einsatzadresse: Zerlegen von Freitext und Zusammensetzen für Anzeige/Berichte/Kartensuche. */
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { ladeFunktionen } from "./_ausquelle.mjs";

const APP = fileURLToPath(new URL("../public/app.js", import.meta.url));
const { adresseSplit, einsatzAdresse } = ladeFunktionen(APP, ["adresseSplit", "einsatzAdresse"]);

test("adresseSplit: Straße, PLZ Ort", () => {
  assert.deepEqual(adresseSplit("Musterweg 5, 92637 Weiden"), { strasse: "Musterweg 5", plz: "92637", ort: "Weiden" });
});
test("adresseSplit: nur PLZ + Ort", () => {
  assert.deepEqual(adresseSplit("92637 Weiden i.d.OPf."), { strasse: "", plz: "92637", ort: "Weiden i.d.OPf." });
});
test("adresseSplit: Straße mit Nr., Ort ohne PLZ", () => {
  assert.deepEqual(adresseSplit("Hauptstr. 12a, Schirmitz"), { strasse: "Hauptstr. 12a", plz: "", ort: "Schirmitz" });
});
test("adresseSplit: nicht erkennbar → alles in ort", () => {
  assert.deepEqual(adresseSplit("Waldstück bei Schirmitz"), { strasse: "", plz: "", ort: "Waldstück bei Schirmitz" });
  assert.deepEqual(adresseSplit(""), { strasse: "", plz: "", ort: "" });
});
test("einsatzAdresse: setzt zusammen, lässt Leeres weg", () => {
  assert.equal(einsatzAdresse({ strasse: "Musterweg 5", plz: "92637", ort: "Weiden" }), "Musterweg 5, 92637 Weiden");
  assert.equal(einsatzAdresse({ ort: "Weiden" }), "Weiden");
  assert.equal(einsatzAdresse({ strasse: "Musterweg 5", ort: "Weiden" }), "Musterweg 5, Weiden");
  assert.equal(einsatzAdresse({}), "");
  assert.equal(einsatzAdresse(null), "");
});
test("einsatzAdresse: Altstand (ort enthält schon die Straße) wird nicht doppelt ausgegeben", () => {
  assert.equal(einsatzAdresse({ strasse: "Musterweg 5", plz: "92637", ort: "Musterweg 5, 92637 Weiden" }), "Musterweg 5, 92637 Weiden");
});

test("adresseSplit: Komma fehlt (OCR)", () => {
  assert.deepEqual(adresseSplit("Musterweg 5 92637 Weiden"), { strasse: "Musterweg 5", plz: "92637", ort: "Weiden" });
  assert.deepEqual(adresseSplit("Obere Hauptstr. 12 a, 92637 Weiden"), { strasse: "Obere Hauptstr. 12 a", plz: "92637", ort: "Weiden" });
});
