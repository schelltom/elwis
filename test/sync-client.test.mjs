/* Reine Sync-Helfer aus public/app.js (per Quelltext-Extraktion geladen). */
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { ladeFunktionen } from "./_ausquelle.mjs";

const APP = fileURLToPath(new URL("../public/app.js", import.meta.url));
const SYNC_COLS = ["einheiten", "funk", "asTrupps"];
const { snapGleich, mergeDeltaCollection } =
  ladeFunktionen(APP, ["snapGleich", "mergeDeltaCollection"], { SYNC_COLS });

const snap = (einsatzId, singles = {}, cols = {}) => {
  const s = { einsatzId, singletons: {}, collections: {} };
  for(const k of Object.keys(singles)) s.singletons[k] = JSON.stringify(singles[k]);
  for(const name of SYNC_COLS){
    s.collections[name] = {};
    for(const r of (cols[name] || [])) s.collections[name][r.id] = JSON.stringify(r);
  }
  return s;
};

test("snapGleich: identische Snapshots sind gleich", () => {
  const a = snap("e1", { "einsatz:ort": "Weiden" }, { funk: [{ id: "f1", t: "x", _m: 1 }] });
  const b = snap("e1", { "einsatz:ort": "Weiden" }, { funk: [{ id: "f1", t: "x", _m: 1 }] });
  assert.equal(snapGleich(a, b), true);
  assert.equal(snapGleich(a, a), true);
});

test("snapGleich: geänderter Datensatz → ungleich", () => {
  const a = snap("e1", {}, { funk: [{ id: "f1", t: "x", _m: 1 }] });
  const b = snap("e1", {}, { funk: [{ id: "f1", t: "GEÄNDERT", _m: 2 }] });
  assert.equal(snapGleich(a, b), false);
});

test("snapGleich: zusätzlicher Datensatz → ungleich", () => {
  const a = snap("e1", {}, { funk: [{ id: "f1", _m: 1 }] });
  const b = snap("e1", {}, { funk: [{ id: "f1", _m: 1 }, { id: "f2", _m: 2 }] });
  assert.equal(snapGleich(a, b), false);
});

test("snapGleich: geändertes Einzelfeld → ungleich", () => {
  const a = snap("e1", { "einsatz:ort": "Weiden" });
  const b = snap("e1", { "einsatz:ort": "Neustadt" });
  assert.equal(snapGleich(a, b), false);
});

test("snapGleich: anderer Einsatz → ungleich", () => {
  assert.equal(snapGleich(snap("e1"), snap("e2")), false);
});

test("snapGleich: null-Fälle", () => {
  assert.equal(snapGleich(null, null), true);
  assert.equal(snapGleich(snap("e1"), null), false);
  assert.equal(snapGleich(null, snap("e1")), false);
});

test("mergeDeltaCollection: Upsert + Löschung über liveIds", () => {
  const aktuell = [{ id: "f1", t: "a" }, { id: "f2", t: "b" }];
  const rein = [{ id: "f2", t: "B" }, { id: "f3", t: "c" }];   // f2 geändert, f3 neu
  const liveIds = ["f2", "f3"];                                 // f1 fehlt → gelöscht
  assert.deepEqual(mergeDeltaCollection(aktuell, rein, liveIds),
    [{ id: "f2", t: "B" }, { id: "f3", t: "c" }]);
});

test("mergeDeltaCollection: leeres Delta lässt Bestand unangetastet", () => {
  const aktuell = [{ id: "f2", t: "B" }, { id: "f3", t: "c" }];
  assert.deepEqual(mergeDeltaCollection(aktuell, [], ["f2", "f3"]).map(r => r.id), ["f2", "f3"]);
});

test("mergeDeltaCollection: fehlende liveIds → alles gelöscht", () => {
  assert.deepEqual(mergeDeltaCollection([{ id: "f1" }], [], undefined), []);
});

test("mergeDeltaCollection: numerische vs. String-IDs", () => {
  const out = mergeDeltaCollection([{ id: 1, t: "a" }], [{ id: 2, t: "b" }], [1, 2]);
  assert.deepEqual(out.map(r => r.id), [1, 2]);
});
