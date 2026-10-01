/* Regression: Dauer-Syncs mehrerer Geräte dürfen den Snapshot nicht endlos nach hinten schieben. */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SERVER = fileURLToPath(new URL("../server/lotse112-server.mjs", import.meta.url));
const CWD = fileURLToPath(new URL("..", import.meta.url));

test("Snapshot wird trotz Dauer-Syncs (< 500 ms Abstand) spätestens nach der Maximalwartezeit geschrieben", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lotse-test-"));
  const port = 8500 + Math.floor(Math.random() * 400);
  const BASE = `http://127.0.0.1:${port}`;
  const proc = spawn("node", [SERVER], {
    cwd: CWD,
    env: { ...process.env, PORT: String(port), ELWIS_MIRROR: "0",
      ELWIS_DATEN: path.join(tmpDir, "daten.json"), ELWIS_SPEICHER_MAXWARTE_MS: "1500" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try{
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Server-Start Timeout")), 10000);
      proc.stdout.on("data", (b) => { if(String(b).includes("Server läuft")){ clearTimeout(t); resolve(); } });
      proc.on("error", reject);
    });
    const sync = (i) => fetch(`${BASE}/api/sync`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "c" + (i % 3), einsatzId: "E1", einsatzStart: "2026-01-01T00:00:00Z",
        collections: { funk: [{ id: "f" + i, text: "x", _m: Date.now() }] } }),
    });
    // 4 s lang alle 200 ms ein ändernder Sync → ohne Obergrenze würde nie gespeichert
    for(let i = 0; i < 20; i++){ await sync(i); await new Promise(r => setTimeout(r, 200)); }
    const h = await (await fetch(`${BASE}/api/health`)).json();
    assert.ok(h.letzteGespeicherteSeq > 0, "während der Dauer-Syncs wurde mindestens einmal gespeichert");
    assert.equal(h.saveFehler, null);
  }finally{
    proc.kill();
    try{ fs.rmSync(tmpDir, { recursive: true, force: true }); }catch(e){}
  }
});
