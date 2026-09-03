/* standAlsExport (server/sync-core.mjs): Serverstand → exportEinsatz()-Form
   für den Freigabe-Link. Rein, ohne HTTP/Datei. */
import test from "node:test";
import assert from "node:assert/strict";
import { leererStand, mergeSync, standAlsExport } from "../server/sync-core.mjs";

const T0 = 1_700_000_000_000;
const opts = { jetzt: () => T0 };

function beispielStand(){
  let stand = leererStand();
  ({ stand } = mergeSync(stand, {
    einsatzId: "e1", einsatzStart: "2026-09-03T10:00:00Z",
    singletons: {
      "einsatz:stichwort": { v: "B3 Wohnhaus", _m: T0 },
      "einsatz:ort":       { v: "Musterstr. 1", _m: T0 },
      "config:ugName":     { v: "UG Nord", _m: T0 },
      "config:ilsName":    { v: "ILS Musterstadt", _m: T0 },
      "lageBg":            { v: "data:image/png;base64,AAAA", _m: T0 },
    },
    collections: {
      einheiten:     [{ id: "u1", _m: T0, funk: "Florian 1/44" }],
      abschnitte:    [{ id: "a1", _m: T0, name: "Brandbekämpfung" }],
      lageItems:     [{ id: "l1", _m: T0, typ: "symbol" }],
      lageSnapshots: [{ id: "s1", _m: T0, bild: "data:image/png;base64,BBBB" }],
      fotos:         [{ id: "foto_a", _m: T0, zeit: "2026-09-03T11:00:00Z", notiz: "Giebel" },
                      { id: "foto_b", _m: T0, zeit: "2026-09-03T11:05:00Z", notiz: "" }],
    },
  }, opts));
  return stand;
}

const fotoDaten = (id) => id === "foto_a" ? "data:image/jpeg;base64,ZZZZ" : null;

test("Stufe 0: Grundform stimmt, Singletons feldweise entpackt", () => {
  const d = standAlsExport(beispielStand(), { fotoDaten });
  assert.equal(d.elwis, 1);
  assert.equal(d.einsatz.stichwort, "B3 Wohnhaus");
  assert.equal(d.einsatz.ort, "Musterstr. 1");
  assert.equal(d.config.ugName, "UG Nord");
  assert.equal(d.ugName, "UG Nord");
  assert.equal(d.einheiten[0].funk, "Florian 1/44");
  assert.equal(d.abschnitte[0].name, "Brandbekämpfung");
  assert.equal(d.lage.items[0].id, "l1");
  assert.equal(d.lage.bg, "data:image/png;base64,AAAA");
  assert.equal(d.lage.snapshots.length, 1);
});

test("Stufe 0: interne Merge-Marker (_m/_s) werden nicht mitexportiert", () => {
  const d = standAlsExport(beispielStand(), { fotoDaten });
  assert.equal("_m" in d.einheiten[0], false);
  assert.equal("_s" in d.einheiten[0], false);
});

test("Stufe 0: Fotobytes werden über fotoDaten injiziert, fehlende bleiben Metadaten", () => {
  const d = standAlsExport(beispielStand(), { fotoDaten });
  assert.equal(d.fotos.length, 2);
  assert.equal(d.fotos[0].data, "data:image/jpeg;base64,ZZZZ");
  assert.equal(d.fotos[0].notiz, "Giebel");
  assert.equal("data" in d.fotos[1], false);
});

test("Stufe 1: keine Fotobytes, lage.snapshots noch drin", () => {
  const d = standAlsExport(beispielStand(), { stufe: 1, fotoDaten });
  assert.equal("data" in d.fotos[0], false);
  assert.equal(d.fotos[0].id, "foto_a");
  assert.equal(d.lage.snapshots.length, 1);
  assert.equal(d.lage.items.length, 1);
});

test("Stufe 2: zusätzlich ohne lage.snapshots, items/bg bleiben", () => {
  const d = standAlsExport(beispielStand(), { stufe: 2, fotoDaten });
  assert.equal(d.lage.snapshots.length, 0);
  assert.equal(d.lage.items.length, 1);
  assert.equal(d.lage.bg, "data:image/png;base64,AAAA");
});

test("leerer Stand: keine Ausnahme, sinnvolle Defaults", () => {
  const d = standAlsExport(leererStand(), {});
  assert.equal(d.elwis, 1);
  assert.deepEqual(d.einsatz, {});
  assert.deepEqual(d.einheiten, []);
  assert.equal(d.lage.bg, "");
  assert.deepEqual(d.fotos, []);
});
