/* Alarm-Foto: Fahrzeug-/Führungskraft-Erkennung (ocrKandidaten), Kennungsregel (defaultBesatzung),
   Zusammenführen mehrerer Fotos (ocrMerge). Die Zeilen stammen aus echten Alarm-Screenshots. */
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { ladeFunktionen } from "./_ausquelle.mjs";

const APP = fileURLToPath(new URL("../public/app.js", import.meta.url));
const MATRIX = [{ von:10, bis:19, stk:2 }, { von:40, bis:43, stk:9 }, { von:44, bis:49, stk:6 }];
const mkState = prefixes => ({ config: { besatzungMatrix: MATRIX,
  prefixes: prefixes || { FW:"Florian", BRK:"RK", POL:"Donau", THW:"Heros", SON:"" } } });
const lade = (prefixes, ocrList = []) => ladeFunktionen(APP,
  ["defaultBesatzung", "ocrKandidaten", "ocrIstFk", "ocrMerge"],
  { state: mkState(prefixes), BESATZUNG_MATRIX_DEFAULT: MATRIX, ocrList, ocrKatalogTreffer: () => null });

const ALARM = [
  "3.3.1 WEN FL Neunkirchen 40/1", "3.3.1 WEN FL Frauenricht 46/1", "3.3.1 WEN FL Weiden 1/30/1",
  "3.3.1 WEN FL Weiden 1/41/1", "3.3.1 WEN FL Weiden 1/40/1", "3.3.1 WEN FL Weiden 1/23/1",
  "3.3.2 NEW FL Mantel 47/1", "3.3.2 NEW FL Mantel 55/1", "3.3.1 WEN FL Weiden 1/55/1",
  "3.4 Leitstelle Oberpfalz-Nord Lagedienst ILS (INFO)", "3.3.2 NEW FL Mantel 11/1",
  "3.3.2 NEW FL Neustadt Land 4", "3.3.1 WEN FL Weiden 1", "3.3.2 NEW FL Neustadt Land 1",
  "3.3.1 WEN Kater Weiden 1/12/1", "3.3.1 WEN FL Neunkirchen 11/1", "3.3.1 WEN THW Weiden - Fachberater",
].join("\n");

test("Alarm-Screenshot: Fahrzeuge und Führungskräfte werden getrennt erkannt", () => {
  const { ocrKandidaten, ocrIstFk } = lade();
  const k = ocrKandidaten(ALARM);
  const fk = k.filter(ocrIstFk).map(c => c.name + (c.kennung ? " " + c.kennung : ""));
  const fz = k.filter(c => !ocrIstFk(c)).map(c => c.name + " " + c.kennung);
  assert.deepEqual(fk, ["Florian Neustadt Land 4", "Florian Weiden 1", "Florian Neustadt Land 1", "THW Fachberater"]);
  assert.equal(fz.length, 12);
  assert.ok(fz.includes("Florian Weiden 1/23/1"));
  assert.ok(fz.includes("Kater Weiden 1/12/1"));
  assert.ok(!k.some(c => /Leitstelle/i.test(c.raw)));      // INFO-Zeile ist kein Fahrzeug
});

test("Kennungsregel: Typ-Zahl unter 10 = Führungskraft, ab 10 = Fahrzeug", () => {
  const { defaultBesatzung } = lade();
  const fk = k => defaultBesatzung(k) && defaultBesatzung(k).fuehrung;
  for(const k of ["1", "2", "3", "4", "3/1", "3/2", "1/1", "9/1"]) assert.equal(fk(k), true, k);
  for(const k of ["40/1", "46/1", "11/1", "1/40/1", "1/23/1", "1/12/1", "1/55/1"]) assert.equal(fk(k), false, k);
});

test("Kennungsregel: Standort/Typ (1/23) zählt die zweite Zahl als Typ", () => {
  const { defaultBesatzung } = lade();
  assert.equal(defaultBesatzung("1/23").fuehrung, false);
  assert.equal(defaultBesatzung("1/48").fuehrung, false);
});

test("Kennungsregel: Besatzung aus der Matrix, ohne Treffer = 3", () => {
  const { defaultBesatzung } = lade();
  assert.deepEqual(defaultBesatzung("1/40/1"), { fuehrung:false, f:0, u:1, m:8, total:9 });
  assert.equal(defaultBesatzung("46/1").total, 6);
  assert.equal(defaultBesatzung("55/1").total, 3);
  assert.equal(defaultBesatzung(""), null);
});

test("THW-Fachberater-Zeile → Führungskraft ohne Nummer; Heros Weiden 2 ist eine eigene Person", () => {
  const { ocrKandidaten, ocrIstFk } = lade();
  const k = ocrKandidaten("3.3.1 WEN THW Weiden - Fachberater\n3.3.1 WEN THW Heros Weiden 2\n3.3.1 WEN Heros Weiden 3/2");
  assert.deepEqual(k.map(c => [c.name, c.kennung, c.org]),
    [["THW Fachberater", "", "THW"], ["Heros Weiden", "2", "THW"], ["Heros Weiden", "3/2", "THW"]]);
  assert.ok(k.every(ocrIstFk));
});

test("Funkrufname-Mapping folgt den Präfixen aus den Einstellungen", () => {
  const { ocrKandidaten } = lade({ FW:"Florian", BRK:"Rotkreuz", POL:"Donau", THW:"Heros", SON:"" });
  const k = ocrKandidaten("RK Weiden 1/83/1\nRotkreuz Weiden 1/83/1");
  assert.equal(k.length, 1);                                // nur das konfigurierte Präfix zählt
  assert.deepEqual([k[0].name, k[0].org], ["Rotkreuz Weiden", "BRK"]);
});

test("FL/Fl/F1 (OCR-Fehler) → Florian; Zeilen ohne Kennung werden ignoriert", () => {
  const { ocrKandidaten } = lade();
  assert.equal(ocrKandidaten("FI Mantel 11/1")[0].name, "Florian Mantel");
  assert.equal(ocrKandidaten("F1 Mantel 11/1")[0].name, "Florian Mantel");
  assert.deepEqual(ocrKandidaten("FL Mantel\nFL Mantel Fahrzeug ohne Zahl"), []);
});

test("ocrMerge: gleiche Kennung bei anderem Ort ist eine andere Einheit", () => {
  const liste = [];
  const { ocrKandidaten, ocrMerge } = lade(null, liste);
  ocrMerge(ocrKandidaten("FL Mantel 11/1\nFL Neunkirchen 11/1\nFL Weiden 1\nFL Neustadt Land 1"));
  assert.equal(liste.length, 4);
});

test("ocrMerge: dasselbe Fahrzeug auf mehreren Fotos nur einmal", () => {
  const liste = [];
  const { ocrKandidaten, ocrMerge } = lade(null, liste);
  ocrMerge(ocrKandidaten("FL Mantel 11/1\nFL Weiden 1"));
  ocrMerge(ocrKandidaten("3.3.2 NEW FL Mantel 11/1\n3.3.1 WEN FL Weiden 1\nFL Weiden 2"));
  assert.deepEqual(liste.map(c => c.name + " " + c.kennung), ["Florian Mantel 11/1", "Florian Weiden 1", "Florian Weiden 2"]);
});
