/* Server-Haltbarkeit: Write-Ahead-Journal (A), Korruptionsschutz (B), Health/Warnung (D). */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SERVER = fileURLToPath(new URL("../server/lotse112-server.mjs", import.meta.url));
const CWD = fileURLToPath(new URL("..", import.meta.url));

/* Server auf eigenem Datenverzeichnis + Port starten, auf "Server läuft" warten. */
async function starte(dir, port){
  const p = spawn("node", [SERVER], {
    cwd: CWD, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(port), ELWIS_MIRROR: "0", ELWIS_DATEN: path.join(dir, "daten.json") },
  });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("Start-Timeout\n" + logbuf)), 10000);
    let logbuf = "";
    p.stdout.on("data", b => { logbuf += b; if(String(b).includes("Server läuft")){ clearTimeout(t); res(); } });
    p.stderr.on("data", b => { logbuf += b; });
    p.on("error", rej);
  });
  return p;
}
const sync = (port, body) => fetch(`http://127.0.0.1:${port}/api/sync`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}).then(r => r.json());

let portZ = 8620;
function tmp(){ return fs.mkdtempSync(path.join(os.tmpdir(), "lotse-dur-")); }
async function stoppe(p, dir){
  try{ p.kill("SIGKILL"); }catch(_){}
  await new Promise(res => setTimeout(res, 250));
  try{ fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }catch(_){}
}

test("A: harter Absturz (SIGKILL) – Journal spielt die Änderungen seit dem letzten Snapshot zurück", async (t) => {
  const dir = tmp(); const port = portZ++;
  let p = await starte(dir, port);
  const eid = "dur-" + Date.now();

  // Erstabgleich + ein paar schnelle Änderungen (innerhalb des 500-ms-Entprellfensters)
  await sync(port, { clientId: "A", delta: 1, seq: 0, einsatzId: eid, einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "f1", text: "eins", _m: Date.now() }] } });
  await sync(port, { clientId: "A", delta: 1, seq: 99, einsatzId: eid, collections: { funk: [{ id: "f2", text: "zwei", _m: Date.now() }] } });
  const r3 = await sync(port, { clientId: "A", delta: 1, seq: 99, einsatzId: eid, collections: { funk: [{ id: "f3", text: "drei", _m: Date.now() }] } });
  const seqVorAbsturz = r3.seq;

  p.kill("SIGKILL");                       // kein SIGTERM-Handler → kein sauberes Speichern
  await new Promise(res => setTimeout(res, 300));

  p = await starte(dir, port);             // Neustart → Journal-Replay
  const nach = await sync(port, { clientId: "B", delta: 1, seq: 0, einsatzId: eid });
  assert.deepEqual(nach.collections.funk.map(x => x.id).sort(), ["f1", "f2", "f3"], "alle 3 Funksprüche zurück");
  assert.equal(nach.seq, seqVorAbsturz, "seq unverändert nach Replay");

  await stoppe(p, dir);
});

test("A: nach sauberem Checkpoint ist das Journal leer", async () => {
  const dir = tmp(); const port = portZ++;
  let p = await starte(dir, port);
  const eid = "dur2-" + Date.now();
  await sync(port, { clientId: "A", delta: 1, seq: 0, einsatzId: eid, einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "f1", _m: Date.now() }] } });
  await new Promise(res => setTimeout(res, 900));   // Snapshot-Entprellung (500 ms) abwarten
  const h = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json();
  assert.equal(h.journalZeilen, 0, "Journal nach Snapshot gekürzt");
  assert.ok(h.letzterSaveOk, "letzter Save vermerkt");
  await stoppe(p, dir);
});

test("B: kaputte daten.json → Vorgänger (.prev) wird geladen", async () => {
  const dir = tmp(); const port = portZ++;
  let p = await starte(dir, port);
  const eid = "durB-" + Date.now();
  await sync(port, { clientId: "A", delta: 1, seq: 0, einsatzId: eid, einsatzStart: new Date().toISOString(),
    collections: { funk: [{ id: "gut1", text: "im prev", _m: Date.now() }] } });
  await new Promise(res => setTimeout(res, 900));      // Snapshot #1
  await sync(port, { clientId: "A", delta: 1, seq: 99, einsatzId: eid, collections: { funk: [{ id: "gut2", _m: Date.now() }] } });
  await new Promise(res => setTimeout(res, 900));      // Snapshot #2 → .prev = Snapshot #1
  p.kill("SIGKILL");
  await new Promise(res => setTimeout(res, 300));

  // daten.json zerstören + Journal leeren (sonst repariert das Journal)
  fs.writeFileSync(path.join(dir, "daten.json"), "{ kaputt");
  fs.writeFileSync(path.join(dir, "journal.ndjson"), "");

  p = await starte(dir, port);
  const nach = await sync(port, { clientId: "B", delta: 1, seq: 0, einsatzId: eid });
  assert.ok(nach.collections.funk.some(x => x.id === "gut1"), "Daten aus .prev da");
  await stoppe(p, dir);
});

test("D: /api/health liefert Kennzahlen, serverWarnung normalerweise null", async () => {
  const dir = tmp(); const port = portZ++;
  let p = await starte(dir, port);
  await sync(port, { clientId: "A", delta: 1, seq: 0, einsatzId: "durD-" + Date.now(),
    einsatzStart: new Date().toISOString(), collections: { funk: [{ id: "f1", _m: Date.now() }] } });
  await new Promise(res => setTimeout(res, 300));   // pruefePlatz() (async statfs) durchlassen
  const h = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json();
  assert.equal(h.ok, true);
  assert.equal(h.warnung, null);
  assert.ok(h.freierPlatzMB === null || typeof h.freierPlatzMB === "number");
  assert.equal(typeof h.seq, "number");

  const info = await (await fetch(`http://127.0.0.1:${port}/api/info`)).json();
  assert.ok("serverWarnung" in info);
  await stoppe(p, dir);
});
