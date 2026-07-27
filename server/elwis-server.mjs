#!/usr/bin/env node
/* ================================================================
   ELWIS ELW-Server – Sync-Zentrale fürs Einsatzstellen-WLAN
   ----------------------------------------------------------------
   - Liefert die gebaute App (dist/) an alle Geräte im WLAN aus
     → Tablets öffnen einfach http://<elw-adresse>:8474/
   - /api/sync führt die Änderungen aller Geräte zusammen
     (last-write-wins je Datensatz, Löschungen über Tombstones)
   - Persistiert den Stand in server/elwis-daten.json
   - Null Abhängigkeiten: nur Node (>= 18) nötig.  Start:
         node server/elwis-server.mjs        (oder: npm run server)
   ================================================================ */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.argv[2] || 8474);
const DIST = [path.join(HIER, "..", "dist"), path.join(process.cwd(), "dist")]
  .find(p => fs.existsSync(path.join(p, "index.html")));
const DATEI = path.join(HIER, "elwis-daten.json");

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".png": "image/png",
  ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2",
};

/* ---------------- Zustand ---------------- */
function leererStand(){
  return { einsatzId: null, einsatzStart: null, seq: 0,
    singletons: {}, collections: {}, tombstones: {} };
}
let stand = leererStand();
let standGeladen = false;
try{
  stand = Object.assign(leererStand(), JSON.parse(fs.readFileSync(DATEI, "utf8")));
  standGeladen = true;
  console.log(`Gespeicherten Einsatz geladen (seq ${stand.seq}).`);
}catch(e){ /* noch keine Daten – frischer Start */ }

/* ---------------- Speichern + automatisches Backup ----------------
   - Atomar: erst in .tmp schreiben, dann umbenennen → nie eine halbe Datei bei Absturz
   - Rotierende Zeitstempel-Backups in server/backups/ (gedrosselt, letzte N behalten)
   - Zusätzlich Sicherung beim Beenden (SIGINT/SIGTERM) */
const SICHER_DIR = path.join(HIER, "backups");
const SICHER_MAX = 40;                 // so viele Backups behalten
const SICHER_INTERVALL = 2 * 60 * 1000; // höchstens alle 2 Minuten ein Backup
let letztesBackup = 0;

function zeitStempel(){
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function backupSchreiben(json){
  try{
    fs.mkdirSync(SICHER_DIR, { recursive: true });
    fs.writeFileSync(path.join(SICHER_DIR, `elwis-daten-${zeitStempel()}.json`), json);
    const alte = fs.readdirSync(SICHER_DIR)
      .filter(f => f.startsWith("elwis-daten-") && f.endsWith(".json")).sort();
    for(const f of alte.slice(0, Math.max(0, alte.length - SICHER_MAX)))
      fs.unlinkSync(path.join(SICHER_DIR, f));   // älteste über dem Limit entfernen
  }catch(e){ console.error("Backup fehlgeschlagen:", e.message); }
}

let speicherTimer = null;
function speichern(){
  clearTimeout(speicherTimer);
  speicherTimer = setTimeout(() => {
    const json = JSON.stringify(stand);
    const tmp = DATEI + ".tmp";
    fs.writeFile(tmp, json, err => {
      if(err){ console.error("Speichern fehlgeschlagen:", err.message); return; }
      try{ fs.renameSync(tmp, DATEI); }
      catch(e){ console.error("Speichern (Umbenennen) fehlgeschlagen:", e.message); return; }
      const jetzt = Date.now();
      if(jetzt - letztesBackup >= SICHER_INTERVALL){ letztesBackup = jetzt; backupSchreiben(json); }
    });
  }, 500);
}
function beendenUndSichern(){
  try{
    const json = JSON.stringify(stand);
    fs.writeFileSync(DATEI, json);
    backupSchreiben(json);
    console.log("\nStand beim Beenden gesichert.");
  }catch(e){ console.error("Sichern beim Beenden fehlgeschlagen:", e.message); }
  process.exit(0);
}
process.on("SIGINT", beendenUndSichern);
process.on("SIGTERM", beendenUndSichern);
if(standGeladen){ backupSchreiben(JSON.stringify(stand)); letztesBackup = Date.now(); }  // Snapshot beim Start

/* Aktive Geräte (Client-IDs, zuletzt gesehen) */
const geraete = new Map();
function aktiveGeraete(){
  const jetzt = Date.now();
  for(const [id, t] of geraete) if(jetzt - t > 15000) geraete.delete(id);
  return geraete.size;
}

/* ---------------- Merge-Logik ---------------- */
function mergeSync(body){
  let geaendert = false;

  // Einsatz-Identität: neuerer Einsatz ersetzt den alten komplett
  if(body.einsatzId && body.einsatzId !== stand.einsatzId){
    const neuer = !stand.einsatzId ||
      (body.einsatzStart || "") > (stand.einsatzStart || "");
    if(neuer){
      console.log(`Neuer Einsatz übernommen (${body.einsatzId}).`);
      stand = leererStand();
      stand.einsatzId = body.einsatzId;
      stand.einsatzStart = body.einsatzStart || new Date().toISOString();
      geaendert = true;
    }else{
      // Client hängt an einem älteren Einsatz → er bekommt den Serverstand
      return false;
    }
  }
  if(!stand.einsatzId && body.einsatzId){
    stand.einsatzId = body.einsatzId;
    stand.einsatzStart = body.einsatzStart || new Date().toISOString();
    geaendert = true;
  }

  // Einzelobjekte (Stammdaten, Kartenhintergrund)
  for(const [k, v] of Object.entries(body.singletons || {})){
    const alt = stand.singletons[k];
    if(!alt || (v._m || 0) > (alt._m || 0)){
      stand.singletons[k] = v;
      geaendert = true;
    }
  }

  // Sammlungen: last-write-wins je Datensatz
  for(const [name, recs] of Object.entries(body.collections || {})){
    const col = stand.collections[name] = stand.collections[name] || {};
    const tomb = stand.tombstones[name] = stand.tombstones[name] || {};
    for(const rec of recs || []){
      if(!rec || !rec.id) continue;
      const t = rec._m || 0;
      if(tomb[rec.id] && tomb[rec.id] >= t) continue;       // schon (später) gelöscht
      const alt = col[rec.id];
      if(!alt || t > (alt._m || 0)){ col[rec.id] = rec; geaendert = true; }
    }
  }

  // Löschungen (Tombstones)
  for(const [name, ids] of Object.entries(body.tombstones || {})){
    const col = stand.collections[name] = stand.collections[name] || {};
    const tomb = stand.tombstones[name] = stand.tombstones[name] || {};
    for(const [id, t] of Object.entries(ids || {})){
      if((tomb[id] || 0) >= t) continue;
      tomb[id] = t;
      if(col[id] && (col[id]._m || 0) <= t){ delete col[id]; }
      geaendert = true;
    }
  }

  if(geaendert){ stand.seq++; speichern(); }
  return geaendert;
}

function standAntwort(){
  const collections = {};
  for(const [name, col] of Object.entries(stand.collections)){
    collections[name] = Object.values(col);
  }
  return { einsatzId: stand.einsatzId, einsatzStart: stand.einsatzStart,
    seq: stand.seq, singletons: stand.singletons, collections,
    clients: aktiveGeraete() };
}

/* ---------------- HTTP ---------------- */
function lanUrls(){
  const urls = [];
  for(const liste of Object.values(os.networkInterfaces())){
    for(const ni of liste || []){
      if(ni.family === "IPv4" && !ni.internal) urls.push(`http://${ni.address}:${PORT}/`);
    }
  }
  return urls;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");

  /* --- API --- */
  if(u.pathname === "/api/info"){
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ elwis: true, seq: stand.seq, einsatzId: stand.einsatzId,
      clients: aktiveGeraete(), urls: lanUrls() }));
    return;
  }
  if(u.pathname === "/api/sync" && req.method === "POST"){
    let body = "";
    req.on("data", c => { body += c; if(body.length > 80e6) req.destroy(); });
    req.on("end", () => {
      try{
        const d = JSON.parse(body || "{}");
        if(d.clientId) geraete.set(d.clientId, Date.now());
        const hatteAenderungen = Object.keys(d.collections || {}).length ||
          Object.keys(d.singletons || {}).length || Object.keys(d.tombstones || {}).length;
        mergeSync(d);
        res.writeHead(200, { "Content-Type": "application/json" });
        if(!hatteAenderungen && d.seq === stand.seq){
          res.end(JSON.stringify({ unchanged: true, seq: stand.seq, clients: aktiveGeraete() }));
        }else{
          res.end(JSON.stringify(standAntwort()));
        }
      }catch(err){
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ fehler: String(err.message || err) }));
      }
    });
    return;
  }
  /* --- Backups auflisten --- */
  if(u.pathname === "/api/backups"){
    let liste = [];
    try{
      liste = fs.readdirSync(SICHER_DIR)
        .filter(f => f.startsWith("elwis-daten-") && f.endsWith(".json"))
        .sort().reverse()
        .map(f => {
          const st = fs.statSync(path.join(SICHER_DIR, f));
          return { datei: f, groesse: st.size, zeit: st.mtime.toISOString() };
        });
    }catch(e){ /* noch keine Backups */ }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ backups: liste }));
    return;
  }
  /* --- Backup wiederherstellen --- */
  if(u.pathname === "/api/restore" && req.method === "POST"){
    let body = "";
    req.on("data", c => { body += c; if(body.length > 5e6) req.destroy(); });
    req.on("end", () => {
      try{
        const d = JSON.parse(body || "{}");
        const name = path.basename(String(d.datei || ""));   // Pfad-Traversal verhindern
        if(!/^elwis-daten-[\d-]+\.json$/.test(name)) throw new Error("Ungültiger Backup-Name");
        const quelle = path.join(SICHER_DIR, name);
        const geladen = JSON.parse(fs.readFileSync(quelle, "utf8"));
        stand = Object.assign(leererStand(), geladen);
        // Neue Einsatz-Identität mit „jetzt" → alle Clients übernehmen den wiederhergestellten Stand
        // (mergeSync: älterer Einsatz der Clients ⇒ sie bekommen den Serverstand)
        stand.einsatzId = "restore-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
        stand.einsatzStart = new Date().toISOString();
        stand.seq = (stand.seq || 0) + 1;
        speichern();
        console.log(`Backup wiederhergestellt: ${name} (seq ${stand.seq}).`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, seq: stand.seq }));
      }catch(err){
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ fehler: String(err.message || err) }));
      }
    });
    return;
  }

  /* --- Statische App (dist/) --- */
  if(!DIST){
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ELWIS: dist/ fehlt – bitte zuerst `npm run build` ausführen.");
    return;
  }
  let rel = decodeURIComponent(u.pathname);
  if(rel === "/" || rel === "") rel = "/index.html";
  const datei = path.normalize(path.join(DIST, rel));
  if(!datei.startsWith(DIST)){ res.writeHead(403); res.end(); return; }
  fs.readFile(datei, (err, inhalt) => {
    if(err){
      // Unbekannte Pfade → App-Einstieg (SPA-freundlich)
      fs.readFile(path.join(DIST, "index.html"), (e2, html) => {
        if(e2){ res.writeHead(404); res.end("Nicht gefunden"); return; }
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" });
    res.end(inhalt);
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log("  ┌─────────────────────────────────────────────┐");
  console.log("  │  ELWIS ELW-Server läuft                     │");
  console.log("  └─────────────────────────────────────────────┘");
  console.log(`  Lokal:      http://localhost:${PORT}/`);
  for(const url of lanUrls()) console.log(`  Im WLAN:    ${url}   ← Tablets hiermit verbinden`);
  console.log(`  Daten:      ${DATEI}`);
  console.log(`  App-Build:  ${DIST || "FEHLT – erst `npm run build`!"}`);
  console.log("");
});
