/* Black-Box: echter ELW-Server, Delta-Protokoll + gzip/ETag über HTTP. */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SERVER = fileURLToPath(new URL("../server/lotse112-server.mjs", import.meta.url));
const CWD = fileURLToPath(new URL("..", import.meta.url));

let proc, BASE, tmpDir;

test.before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lotse-test-"));
  const port = 8500 + Math.floor(Math.random() * 400);
  BASE = `http://127.0.0.1:${port}`;
  proc = spawn("node", [SERVER], {
    cwd: CWD,
    env: { ...process.env, PORT: String(port), ELWIS_MIRROR: "0",
      ELWIS_DATEN: path.join(tmpDir, "daten.json") },
    stdio: ["ignore", "pipe", "pipe"],
  });
  // auf "Server läuft" warten
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Server-Start Timeout")), 10000);
    proc.stdout.on("data", (b) => { if(String(b).includes("Server läuft")){ clearTimeout(t); resolve(); } });
    proc.on("error", reject);
  });
});

test.after(() => {
  proc?.kill();
  try{ fs.rmSync(tmpDir, { recursive: true, force: true }); }catch(e){}
});

const sync = (body, headers = {}) => fetch(`${BASE}/api/sync`, {
  method: "POST", headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, headers: r.headers, json: await r.json() }));

test("Erstabgleich: neuer Einsatz + Datensatz → Delta-Antwort", async () => {
  const eid = "http-" + Date.now();
  const { json } = await sync({ clientId: "A", delta: 1, seq: 0, einsatzId: eid,
    einsatzStart: new Date().toISOString(),
    singletons: { "einsatz:ort": { v: "Weiden", _m: Date.now() } },
    collections: { funk: [{ id: "f1", text: "eins", _m: Date.now() }] }, tombstones: {} });
  assert.equal(json.delta, true);
  assert.deepEqual(json.collections.funk.map(r => r.id), ["f1"]);
  assert.deepEqual(json.ids.funk, ["f1"]);
  assert.equal(json.singletons["einsatz:ort"].v, "Weiden");
});

test("zweites Gerät sieht den Stand, Delta bringt nur Neues", async () => {
  const eid = "http2-" + Date.now();
  const a1 = await sync({ clientId: "A", delta: 1, seq: 0, einsatzId: eid,
    einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "f1", text: "eins", _m: Date.now() }] } });
  const seqA = a1.json.seq;

  const b1 = await sync({ clientId: "B", delta: 1, seq: 0, einsatzId: eid });
  assert.deepEqual(b1.json.collections.funk.map(r => r.id), ["f1"]);

  await sync({ clientId: "B", delta: 1, seq: b1.json.seq, einsatzId: eid,
    collections: { funk: [{ id: "f2", text: "zwei", _m: Date.now() }] } });

  const a2 = await sync({ clientId: "A", delta: 1, seq: seqA, einsatzId: eid });
  assert.deepEqual(a2.json.collections.funk.map(r => r.id), ["f2"], "A bekommt nur f2");
  assert.deepEqual(a2.json.ids.funk.sort(), ["f1", "f2"]);

  const a3 = await sync({ clientId: "A", delta: 1, seq: a2.json.seq, einsatzId: eid });
  assert.equal(a3.json.unchanged, true);
});

test("Löschung wird über die Live-ID-Liste sichtbar", async () => {
  const eid = "http3-" + Date.now();
  const a1 = await sync({ clientId: "A", delta: 1, seq: 0, einsatzId: eid,
    einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "f1", _m: Date.now() }, { id: "f2", _m: Date.now() }] } });
  const a2 = await sync({ clientId: "A", delta: 1, seq: a1.json.seq, einsatzId: eid,
    tombstones: { funk: { f1: Date.now() } } });
  assert.deepEqual(a2.json.ids.funk, ["f2"]);
});

test("Alt-Client ohne delta-Flag bekommt Vollstand", async () => {
  const eid = "http4-" + Date.now();
  await sync({ clientId: "A", delta: 1, seq: 0, einsatzId: eid,
    einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "f1", _m: Date.now() }] } });
  const alt = await sync({ clientId: "OLD", seq: 0, einsatzId: eid });
  assert.equal(alt.json.delta, undefined);
  assert.ok(Array.isArray(alt.json.collections.funk));
});

test("große Antworten kommen gzip-komprimiert", async () => {
  const eid = "http5-" + Date.now();
  const viel = Array.from({ length: 50 }, (_, i) =>
    ({ id: "e" + i, name: "Fahrzeug " + i, text: "x".repeat(200), _m: Date.now() }));
  const r = await fetch(`${BASE}/api/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Encoding": "gzip" },
    body: JSON.stringify({ clientId: "A", delta: 1, seq: 0, einsatzId: eid,
      einsatzStart: new Date().toISOString(), collections: { einheiten: viel } }),
  });
  assert.equal(r.headers.get("content-encoding"), "gzip");
  const j = await r.json();   // fetch entpackt transparent
  assert.equal(j.collections.einheiten.length, 50);
});

test("Fotos: PUT speichert, GET liefert, /api/fotos listet, DELETE entfernt", async () => {
  const bytes = Buffer.from("\xFF\xD8\xFF\xE0JPEGDUMMY" + "x".repeat(200), "binary");
  const put = await fetch(`${BASE}/api/foto/testbild1`, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: bytes });
  assert.equal(put.status, 200);

  const get = await fetch(`${BASE}/api/foto/testbild1`);
  assert.equal(get.status, 200);
  assert.equal(get.headers.get("content-type"), "image/jpeg");
  assert.match(get.headers.get("cache-control") || "", /immutable/);
  const back = Buffer.from(await get.arrayBuffer());
  assert.equal(back.length, bytes.length);

  const etag = get.headers.get("etag");
  const get304 = await fetch(`${BASE}/api/foto/testbild1`, { headers: { "If-None-Match": etag } });
  assert.equal(get304.status, 304);

  const liste = await (await fetch(`${BASE}/api/fotos`)).json();
  assert.ok(liste.ids.includes("testbild1"));

  await fetch(`${BASE}/api/foto/testbild1`, { method: "DELETE" });
  assert.equal((await fetch(`${BASE}/api/foto/testbild1`)).status, 404);
});

test("Fotos: ungültige ID → 400, unbekannte ID → 404", async () => {
  assert.equal((await fetch(`${BASE}/api/foto/..%2Fetc`)).status, 400);
  assert.equal((await fetch(`${BASE}/api/foto/gibtsnicht`)).status, 404);
});

test("Alt-Client mit Inline-Foto: data wird ausgelagert, nicht im Stand gespeichert", async () => {
  const eid = "fotoinline-" + Date.now();
  const px = "data:image/jpeg;base64," + Buffer.from("JPEGDUMMYINLINE").toString("base64");
  const r = await sync({ clientId: "OLD", seq: 0, einsatzId: eid, einsatzStart: new Date().toISOString(),
    collections: { fotos: [{ id: "inl1", zeit: new Date().toISOString(), notiz: "x", data: px, _m: Date.now() }] } });
  // Antwort (Vollstand, Alt-Client) darf das data-Feld nicht mehr tragen
  const rec = (r.json.collections.fotos || []).find(f => f.id === "inl1");
  assert.ok(rec, "Foto-Metadaten da");
  assert.equal(rec.data, undefined, "data ausgelagert");
  // Bild ist als Datei abrufbar
  assert.equal((await fetch(`${BASE}/api/foto/inl1`)).status, 200);
});

test("statische Assets: ETag → 304 beim zweiten Abruf", async (t) => {
  const r1 = await fetch(`${BASE}/app.js`);
  if(r1.status === 503){ t.skip("dist/ nicht gebaut (npm run build)"); return; }
  const etag = r1.headers.get("etag");
  assert.ok(etag, "ETag gesetzt");
  assert.equal(r1.headers.get("content-encoding"), "gzip");
  const r2 = await fetch(`${BASE}/app.js`, { headers: { "If-None-Match": etag } });
  assert.equal(r2.status, 304);
});

test("Persistenz: Stand überlebt in der Datendatei", async () => {
  const eid = "persist-" + Date.now();
  await sync({ clientId: "A", delta: 1, seq: 0, einsatzId: eid,
    einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "p1", text: "merk dir das", _m: Date.now() }] } });
  await new Promise(r => setTimeout(r, 900));   // debounced speichern (500 ms)
  const roh = JSON.parse(fs.readFileSync(path.join(tmpDir, "daten.json"), "utf8"));
  assert.equal(roh.einsatzId, eid);
  assert.ok(roh.collections.funk.p1);
});
