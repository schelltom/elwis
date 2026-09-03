/* Kernlogik des Sync-Merge (server/sync-core.mjs) – rein, ohne HTTP. */
import test from "node:test";
import assert from "node:assert/strict";
import { leererStand, mergeSync, vollStand, deltaStand } from "../server/sync-core.mjs";

// Feste Zeitquelle, damit Clamping deterministisch ist.
const T0 = 1_000_000_000_000;
const opts = { jetzt: () => T0 };
const rec = (id, m, extra = {}) => ({ id, _m: m, ...extra });

function frischerEinsatz(id = "e1"){
  let stand = leererStand();
  ({ stand } = mergeSync(stand, { einsatzId: id, einsatzStart: "2026-09-03T10:00:00Z" }, opts));
  return stand;
}

test("neuer Einsatz wird übernommen, seq steigt", () => {
  let stand = leererStand();
  const r = mergeSync(stand, { einsatzId: "e1", einsatzStart: "2026-09-03T10:00:00Z" }, opts);
  assert.equal(r.geaendert, true);
  assert.equal(r.stand.einsatzId, "e1");
  assert.equal(r.stand.seq, 1);
});

test("Datensatz anlegen und per _m aktualisieren (last-write-wins)", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 5000, { text: "alt" })] } }, opts));
  assert.equal(stand.collections.funk.f1.text, "alt");

  // älterer Schreibversuch verliert
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 9000, { text: "noch älter" })] } }, opts));
  assert.equal(stand.collections.funk.f1.text, "alt");

  // neuerer gewinnt
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 1000, { text: "neu" })] } }, opts));
  assert.equal(stand.collections.funk.f1.text, "neu");
});

test("Zukunfts-Zeitstempel wird auf jetzt+Toleranz geclamped", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 + 999_999_999, { text: "aus der Zukunft" })] } }, opts));
  assert.ok(stand.collections.funk.f1._m <= T0 + 5 * 60 * 1000);
});

test("Tombstone löscht den Datensatz und hält ihn gelöscht", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 5000)] } }, opts));
  ({ stand } = mergeSync(stand, { einsatzId: "e1", tombstones: { funk: { f1: T0 - 1000 } } }, opts));
  assert.equal(stand.collections.funk.f1, undefined);

  // verspäteter Re-Insert mit älterem _m darf nicht wiederauferstehen
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 3000, { text: "zombie" })] } }, opts));
  assert.equal(stand.collections.funk.f1, undefined);
});

test("Einzelfelder feldweise mergen", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", singletons: { "einsatz:ort": { v: "Weiden", _m: T0 - 5000 } } }, opts));
  ({ stand } = mergeSync(stand, { einsatzId: "e1", singletons: { "einsatz:stichwort": { v: "B2", _m: T0 - 4000 } } }, opts));
  assert.equal(stand.singletons["einsatz:ort"].v, "Weiden");
  assert.equal(stand.singletons["einsatz:stichwort"].v, "B2");
});

test("no-op-Merge meldet geaendert=false, seq bleibt", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 5000)] } }, opts));
  const seqVorher = stand.seq;
  const r = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 8000)] } }, opts);
  assert.equal(r.geaendert, false);
  assert.equal(r.stand.seq, seqVorher);
});

test("neuerer Einsatz ersetzt den alten komplett", () => {
  let stand = frischerEinsatz("alt");
  ({ stand } = mergeSync(stand, { einsatzId: "alt", collections: { funk: [rec("f1", T0 - 5000)] } }, opts));
  const r = mergeSync(stand, { einsatzId: "neu", einsatzStart: "2026-09-03T12:00:00Z" }, opts);
  assert.equal(r.stand.einsatzId, "neu");
  assert.deepEqual(r.stand.collections, {});
});

test("älterer Einsatz eines Clients wird abgelehnt (kein Merge)", () => {
  let stand = frischerEinsatz("aktuell");   // einsatzStart 2026-09-03T10:00
  stand.einsatzStart = "2026-09-03T12:00:00Z";
  const r = mergeSync(stand, { einsatzId: "veraltet", einsatzStart: "2026-09-03T08:00:00Z",
    collections: { funk: [rec("x", T0)] } }, opts);
  assert.equal(r.geaendert, false);
  assert.equal(r.stand.einsatzId, "aktuell");
  assert.equal(r.stand.collections.funk, undefined);
});

test("ersetzen:true erzwingt Übernahme trotz älterem einsatzStart", () => {
  let stand = frischerEinsatz("aktuell");
  stand.einsatzStart = "2026-09-03T12:00:00Z";
  const r = mergeSync(stand, { einsatzId: "verworfen-neu", einsatzStart: "2026-09-03T08:00:00Z", ersetzen: true }, opts);
  assert.equal(r.stand.einsatzId, "verworfen-neu");
});

test("deltaStand: Erstabgleich (seq 0) liefert alles + ids", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1",
    singletons: { "einsatz:ort": { v: "Weiden", _m: T0 } },
    collections: { funk: [rec("f1", T0), rec("f2", T0)] } }, opts));
  const d = deltaStand(stand, 0);
  assert.equal(d.delta, true);
  assert.deepEqual(d.collections.funk.map(r => r.id).sort(), ["f1", "f2"]);
  assert.deepEqual(d.ids.funk.sort(), ["f1", "f2"]);
  assert.equal(d.singletons["einsatz:ort"].v, "Weiden");
});

test("deltaStand: inkrementell liefert nur Neues seit clientSeq", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 5000)] } }, opts));
  const seqNachF1 = stand.seq;
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f2", T0 - 1000)] } }, opts));

  const d = deltaStand(stand, seqNachF1);
  assert.deepEqual(d.collections.funk.map(r => r.id), ["f2"]);   // f1 NICHT
  assert.deepEqual(d.ids.funk.sort(), ["f1", "f2"]);             // aber in den Live-IDs
});

test("deltaStand: Löschung erscheint nur in ids (nicht mehr), nicht als Datensatz", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0 - 5000), rec("f2", T0 - 5000)] } }, opts));
  const seq = stand.seq;
  ({ stand } = mergeSync(stand, { einsatzId: "e1", tombstones: { funk: { f1: T0 - 1000 } } }, opts));
  const d = deltaStand(stand, seq);
  assert.deepEqual(d.ids.funk, ["f2"]);
  assert.equal(d.collections.funk, undefined);
});

test("vollStand: Sammlungen als Arrays", () => {
  let stand = frischerEinsatz();
  ({ stand } = mergeSync(stand, { einsatzId: "e1", collections: { funk: [rec("f1", T0), rec("f2", T0)] } }, opts));
  const v = vollStand(stand);
  assert.ok(Array.isArray(v.collections.funk));
  assert.equal(v.collections.funk.length, 2);
  assert.equal(v.delta, undefined);
});
