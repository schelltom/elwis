#!/usr/bin/env node
/* ================================================================
   LOTSE112 ELW-Server – Sync-Zentrale fürs Einsatzstellen-WLAN
   ----------------------------------------------------------------
   - Liefert die gebaute App (dist/) an alle Geräte im WLAN aus
     → Tablets öffnen einfach http://<elw-adresse>:8474/
   - /api/sync führt die Änderungen aller Geräte zusammen
     (last-write-wins je Datensatz, Löschungen über Tombstones)
   - Persistiert den Stand in server/elwis-daten.json
   - Null Abhängigkeiten: nur Node (>= 18) nötig.  Start:
         node server/lotse112-server.mjs        (oder: npm run server)
   ================================================================ */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.argv[2] || 8474);
const BASIS = path.join(HIER, "..");
// Ziel-Ordner der ausgelieferten App. Existiert er noch nicht, holt ihn der
// Auto-Mirror beim ersten Internet-Kontakt selbst von GitHub Pages.
const DIST = [path.join(BASIS, "dist"), path.join(process.cwd(), "dist")]
  .find(p => fs.existsSync(path.join(p, "index.html"))) || path.join(BASIS, "dist");
const STAGING = DIST + ".neu";   // frisch geladene Version wartet hier auf den Neustart
const ALT = DIST + ".alt";       // vorherige Version (Rückfall-Ebene)
const DATEI = path.join(HIER, "elwis-daten.json");

// Basispfad der App (muss zum `base` in astro.config.mjs passen). Der Build
// erzeugt absolute Asset-Pfade wie /elwis/app.js (nötig für GitHub Pages).
// Lokal liegt dist/ direkt an der Wurzel, darum entfernt der Server dieses
// Präfix wieder, sonst landen die Assets im index.html-Fallback (HTML statt JS).
const BASE = (process.env.ELWIS_BASE || "/elwis").replace(/\/+$/, "");

// Quelle + Takt des Auto-Mirrors (per Umgebungsvariable überschreibbar)
const GH_BASIS = (process.env.ELWIS_QUELLE || "https://schelltom.github.io/elwis/").replace(/\/?$/, "/");
const UPDATE_INTERVALL = Math.max(1, Number(process.env.ELWIS_UPDATE_MIN || 5)) * 60 * 1000;
// Auto-Mirror abschaltbar (ELWIS_MIRROR=0) – nötig fürs lokale Testen eines
// eigenen Builds, den der Mirror sonst mit dem GitHub-Pages-Stand überschreibt.
const MIRROR_AKTIV = process.env.ELWIS_MIRROR !== "0";

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
  // Alle Änderungen dieser Merge-Runde bekommen dieselbe Änderungs-Seq (_s) verpasst –
  // Grundlage für Delta-Antworten ("gib mir alles mit _s > meinSeq"). stand.seq wird
  // erst am Ende scharf geschaltet, damit ein abgebrochener Merge nichts halb erhöht.
  const neueSeq = stand.seq + 1;
  const markiere = () => { geaendert = true; return neueSeq; };
  // Client-Zeitstempel (_m) NICHT blind vertrauen: ein Gerät mit falsch gestellter (Zukunfts-)
  // Uhr würde sonst jeden Merge dauerhaft „gewinnen". Auf jetzt + kleine Toleranz clampen.
  const CLAMP_TOLERANZ_MS = 5 * 60 * 1000;
  const jetztM = Date.now();
  const clampM = m => Math.min(Number(m) || 0, jetztM + CLAMP_TOLERANZ_MS);

  // Einsatz-Identität: neuerer Einsatz ersetzt den alten komplett.
  // body.ersetzen = bewusste Aktion am Client (Verwerfen / Neuer Einsatz / Beenden /
  // Import) → erzwingt das Ersetzen unabhängig vom Zeitstempel.
  if(body.einsatzId && body.einsatzId !== stand.einsatzId){
    const neuer = body.ersetzen || !stand.einsatzId ||
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
    if(v) v._m = clampM(v._m);
    const alt = stand.singletons[k];
    if(!alt || (v._m || 0) > (alt._m || 0)){
      if(v) v._s = markiere();
      stand.singletons[k] = v;
    }
  }

  // Sammlungen: last-write-wins je Datensatz
  for(const [name, recs] of Object.entries(body.collections || {})){
    const col = stand.collections[name] = stand.collections[name] || {};
    const tomb = stand.tombstones[name] = stand.tombstones[name] || {};
    for(const rec of recs || []){
      if(!rec || !rec.id) continue;
      rec._m = clampM(rec._m);
      const t = rec._m;
      if(tomb[rec.id] && tomb[rec.id] >= t) continue;       // schon (später) gelöscht
      const alt = col[rec.id];
      if(!alt || t > (alt._m || 0)){ rec._s = markiere(); col[rec.id] = rec; }
    }
  }

  // Löschungen (Tombstones). Für die Delta-Antwort zählt die Live-ID-Liste je Sammlung
  // (deltaAntwort.ids) – ein hier gelöschter Datensatz fällt dort einfach weg.
  for(const [name, ids] of Object.entries(body.tombstones || {})){
    const col = stand.collections[name] = stand.collections[name] || {};
    const tomb = stand.tombstones[name] = stand.tombstones[name] || {};
    for(const [id, t0] of Object.entries(ids || {})){
      const t = clampM(t0);
      if((tomb[id] || 0) >= t) continue;
      tomb[id] = t;
      if(col[id] && (col[id]._m || 0) <= t){ delete col[id]; }
      markiere();
    }
  }

  if(geaendert){ stand.seq = neueSeq; speichern(); }
  return geaendert;
}

/* Vollständiger Serverstand (Alt-Protokoll: Client ersetzt seine Sammlungen komplett). */
function standAntwort(){
  const collections = {};
  for(const [name, col] of Object.entries(stand.collections)){
    collections[name] = Object.values(col);
  }
  return { einsatzId: stand.einsatzId, einsatzStart: stand.einsatzStart,
    seq: stand.seq, singletons: stand.singletons, collections,
    clients: aktiveGeraete(), ...updateInfo() };
}

/* Delta-Antwort: nur Einzelfelder/Datensätze mit _s > clientSeq, plus je Sammlung
   die vollständige Liste der noch lebenden IDs (daran erkennt der Client Löschungen).
   clientSeq <= 0 → Erstabgleich, dann kommt alles. */
function deltaAntwort(clientSeq){
  const erst = !(clientSeq > 0);
  const singletons = {};
  for(const [k, v] of Object.entries(stand.singletons)){
    if(erst || (v && (v._s || 0) > clientSeq)) singletons[k] = v;
  }
  const collections = {}, ids = {};
  for(const [name, col] of Object.entries(stand.collections)){
    const alle = [], geaendert = [];
    for(const rec of Object.values(col)){
      alle.push(rec.id);
      if(erst || (rec._s || 0) > clientSeq) geaendert.push(rec);
    }
    ids[name] = alle;
    if(geaendert.length) collections[name] = geaendert;
  }
  return { einsatzId: stand.einsatzId, einsatzStart: stand.einsatzStart,
    seq: stand.seq, delta: true, singletons, collections, ids,
    clients: aktiveGeraete(), ...updateInfo() };
}

/* JSON-Antwort mit gzip für größere Nutzlasten (Delta-/Vollstand, /api/info). */
function sendeJson(req, res, code, obj){
  const body = Buffer.from(JSON.stringify(obj));
  const kopf = { "Content-Type": "application/json; charset=utf-8", "Vary": "Accept-Encoding" };
  if(body.length > 1400 && /\bgzip\b/.test(req.headers["accept-encoding"] || "")){
    const gz = zlib.gzipSync(body);
    res.writeHead(code, { ...kopf, "Content-Encoding": "gzip", "Content-Length": gz.length });
    res.end(req.method === "HEAD" ? undefined : gz);
  }else{
    res.writeHead(code, { ...kopf, "Content-Length": body.length });
    res.end(req.method === "HEAD" ? undefined : body);
  }
}

/* ================================================================
   Auto-Mirror: App-Updates von GitHub Pages holen
   ----------------------------------------------------------------
   - Prüft (nur wenn Internet da ist) die manifest.json der Quelle.
   - Neue Version → wird VOLLSTÄNDIG in dist.neu/ geladen (atomar),
     der laufende Betrieb bleibt unangetastet.
   - Aktiviert wird eine geladene Version beim Serverstart
     (aktiviereBereitgestellte) ODER im laufenden Betrieb, sobald kein Gerät
     mehr verbunden ist (versucheLeerlaufAktivierung) – so ändert sich nie
     etwas mitten im Einsatz, aber das 24/7-NAS bekommt Updates trotzdem live.
   - Beim allerersten Start ohne App wird sofort scharf geschaltet
     (da läuft ja noch kein Betrieb).
   ================================================================ */
let updateStatus = null;   // {version, erstellt} sobald eine neue Version bereitliegt
let updateLaeuft = false;

function manifestVon(dir){
  try{ return JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")); }
  catch(e){ return null; }
}
function versionVon(dir){ const m = manifestVon(dir); return (m && m.version) || null; }
function appVorhanden(){ return fs.existsSync(path.join(DIST, "index.html")); }
function updateInfo(){ return { version: versionVon(DIST), update: updateStatus }; }

// Bereitgestellte Version (dist.neu/) scharf schalten – nur beim Start aufrufen.
function aktiviereBereitgestellte(){
  const sm = manifestVon(STAGING);
  if(!sm || !sm.version) return false;
  if(sm.version === versionVon(DIST)){ fs.rmSync(STAGING, { recursive:true, force:true }); return false; }
  try{
    fs.rmSync(ALT, { recursive:true, force:true });
    if(fs.existsSync(DIST)) fs.renameSync(DIST, ALT);   // alte Version als Rückfall behalten
    fs.renameSync(STAGING, DIST);
    console.log(`App-Version aktiviert: ${sm.version} (Stand ${sm.erstellt || "?"}).`);
    return true;
  }catch(e){ console.error("Aktivierung fehlgeschlagen:", e.message); return false; }
}

// Leerlauf-Aktivierung: das NAS läuft 24/7 und startet nie neu. Damit eine
// bereitliegende Version trotzdem live geht, wird sie aktiviert, sobald KEIN
// Gerät mehr verbunden ist – so ändert sich nie etwas mitten in der Erfassung.
function versucheLeerlaufAktivierung(){
  if(updateLaeuft) return;                     // gerade wird geladen
  const sv = versionVon(STAGING);
  if(!sv || sv === versionVon(DIST)) return;   // nichts Neues bereitgestellt
  if(aktiveGeraete() > 0) return;              // jemand arbeitet gerade → warten
  if(aktiviereBereitgestellte()){
    updateStatus = null;
    console.log("Leerlauf-Aktivierung: neue Version ist jetzt live (kein Gerät verbunden).");
  }
}

// Komplette neue Version in dist.neu/ laden – erst .tmp füllen, dann atomar umbenennen.
async function ladeInBereitstellung(remote){
  const tmp = STAGING + ".tmp";
  fs.rmSync(tmp, { recursive:true, force:true });
  fs.mkdirSync(tmp, { recursive:true });
  for(const f of remote.dateien){
    const rel = String(f.pfad || "");
    if(!rel || rel.includes("..") || path.isAbsolute(rel)) throw new Error("Ungültiger Pfad im Manifest: " + rel);
    const r = await fetch(GH_BASIS + rel, { cache:"no-store" });
    if(!r.ok) throw new Error(`Download fehlgeschlagen: ${rel} (HTTP ${r.status})`);
    const buf = Buffer.from(await r.arrayBuffer());
    if(f.sha256){
      const h = crypto.createHash("sha256").update(buf).digest("hex");
      if(h !== f.sha256) throw new Error("Prüfsumme falsch: " + rel);
    }
    const ziel = path.join(tmp, rel);
    if(!path.normalize(ziel).startsWith(tmp)) throw new Error("Pfad-Ausbruch: " + rel);
    fs.mkdirSync(path.dirname(ziel), { recursive:true });
    fs.writeFileSync(ziel, buf);
  }
  fs.writeFileSync(path.join(tmp, "manifest.json"), JSON.stringify(remote));
  fs.rmSync(STAGING, { recursive:true, force:true });
  fs.renameSync(tmp, STAGING);
  console.log(`Neue Version ${remote.version} geladen (${remote.dateien.length} Dateien) – aktiv beim nächsten Neustart.`);
}

async function pruefeAufUpdate(){
  if(updateLaeuft) return;
  updateLaeuft = true;
  try{
    const r = await fetch(GH_BASIS + "manifest.json", { cache:"no-store" });
    if(!r.ok) throw new Error("HTTP " + r.status);
    const remote = await r.json();
    if(!remote || !remote.version || !Array.isArray(remote.dateien)) throw new Error("Ungültiges Manifest");

    const liveV = versionVon(DIST);
    if(remote.version === liveV){                      // schon aktuell
      if(fs.existsSync(STAGING)) fs.rmSync(STAGING, { recursive:true, force:true });
      updateStatus = null;
      return;
    }
    if(remote.version !== versionVon(STAGING)){        // noch nicht geladen → jetzt holen
      await ladeInBereitstellung(remote);
    }
    if(!appVorhanden()){                               // Erststart ohne App → sofort scharf
      if(aktiviereBereitgestellte()) updateStatus = null;
    }else{                                             // App läuft → Hinweis setzen ...
      updateStatus = { version: remote.version, erstellt: remote.erstellt || null };
      versucheLeerlaufAktivierung();                   // ... und sofort live, wenn niemand verbunden ist
    }
  }catch(e){
    // kein Internet / Pages nicht erreichbar → still bleiben, nächster Versuch später
  }finally{
    updateLaeuft = false;
  }
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
  // Ungültige Anfrage-URLs (z. B. "//", Scanner) dürfen den Server nicht abstürzen lassen.
  let u;
  try{ u = new URL(req.url, "http://x"); }
  catch(_){ res.writeHead(400); res.end("Ungültige Anfrage"); return; }

  /* --- API --- */
  if(u.pathname === "/api/info"){
    sendeJson(req, res, 200, { elwis: true, seq: stand.seq, einsatzId: stand.einsatzId,
      clients: aktiveGeraete(), urls: lanUrls(), ...updateInfo() });
    return;
  }
  if(u.pathname === "/api/sync" && req.method === "POST"){
    let body = "";
    req.on("data", c => { body += c; if(body.length > 80e6) req.destroy(); });
    req.on("end", () => {
      try{
        const d = JSON.parse(body || "{}");
        if(d.clientId) geraete.set(d.clientId, Date.now());
        const veraendert = mergeSync(d);
        const gleicherEinsatz = !d.einsatzId || d.einsatzId === stand.einsatzId;
        if(gleicherEinsatz && !veraendert && (Number(d.seq) || 0) === stand.seq){
          // Client ist auf demselben Stand und hat nichts geändert
          sendeJson(req, res, 200, { unchanged: true, seq: stand.seq, clients: aktiveGeraete(), ...updateInfo() });
        }else if(d.delta && stand.einsatzId && d.einsatzId === stand.einsatzId){
          // Neues Protokoll: nur Änderungen seit d.seq (+ Live-ID-Listen für Löschungen)
          sendeJson(req, res, 200, deltaAntwort(Number(d.seq) || 0));
        }else{
          // Alt-Client oder Einsatzwechsel → kompletter Stand
          sendeJson(req, res, 200, standAntwort());
        }
      }catch(err){
        sendeJson(req, res, 400, { fehler: String(err.message || err) });
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
  if(!appVorhanden()){
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("LOTSE112: App noch nicht geladen. Der Server holt sie beim ersten Internet-Kontakt automatisch von GitHub – bitte gleich neu laden.");
    return;
  }
  let rel;
  try{ rel = decodeURIComponent(u.pathname); }
  catch(_){ res.writeHead(400); res.end("Ungültiger Pfad"); return; }
  // Basis-Präfix (/elwis) abstreifen – die App liegt lokal an der Wurzel.
  if(BASE && (rel === BASE || rel.startsWith(BASE + "/"))) rel = rel.slice(BASE.length) || "/";
  if(rel === "/" || rel === "") rel = "/index.html";
  const datei = path.normalize(path.join(DIST, rel));
  if(!datei.startsWith(DIST)){ res.writeHead(403); res.end(); return; }
  sendeStatisch(req, res, datei, false);
});

/* Statische Datei ausliefern – mit ETag/If-None-Match (304 spart den Transfer bei
   Reloads) und gzip für Text-Assets (app.js unkomprimiert ~490 KB → ~110 KB).
   Komprimate werden je Datei/ETag im Speicher gehalten, nicht pro Request neu gepackt. */
const GZ_CACHE = new Map();   // datei → { etag, gz }
function sendeStatisch(req, res, datei, istFallback){
  fs.stat(datei, (err, st) => {
    if(err || !st.isFile()){
      // Unbekannte Pfade → App-Einstieg (SPA-freundlich)
      if(istFallback){ res.writeHead(404); res.end("Nicht gefunden"); return; }
      sendeStatisch(req, res, path.join(DIST, "index.html"), true);
      return;
    }
    const etag = `"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
    const typ = MIME[path.extname(datei)] || "application/octet-stream";
    const kopf = { "Content-Type": typ, "Cache-Control": "no-cache", "ETag": etag };
    if((req.headers["if-none-match"] || "") === etag){
      res.writeHead(304, kopf); res.end(); return;
    }
    const magGzip = /javascript|css|html|json|svg|manifest/.test(typ)
      && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    fs.readFile(datei, (e2, inhalt) => {
      if(e2){ res.writeHead(500); res.end("Lesefehler"); return; }
      if(magGzip){
        let c = GZ_CACHE.get(datei);
        if(!c || c.etag !== etag){ c = { etag, gz: zlib.gzipSync(inhalt) }; GZ_CACHE.set(datei, c); }
        res.writeHead(200, { ...kopf, "Content-Encoding": "gzip",
          "Vary": "Accept-Encoding", "Content-Length": c.gz.length });
        res.end(req.method === "HEAD" ? undefined : c.gz);
      }else{
        res.writeHead(200, { ...kopf, "Content-Length": inhalt.length });
        res.end(req.method === "HEAD" ? undefined : inhalt);
      }
    });
  });
}

// Beim Start eine ggf. vorab geladene Version scharf schalten (nie im Betrieb).
aktiviereBereitgestellte();

server.listen(PORT, () => {
  console.log("");
  console.log("  ┌─────────────────────────────────────────────┐");
  console.log("  │  LOTSE112 ELW-Server läuft                     │");
  console.log("  └─────────────────────────────────────────────┘");
  console.log(`  Lokal:      http://localhost:${PORT}/`);
  for(const url of lanUrls()) console.log(`  Im WLAN:    ${url}   ← Tablets hiermit verbinden`);
  console.log(`  Daten:      ${DATEI}`);
  console.log(`  App-Build:  ${appVorhanden() ? `${DIST} (Version ${versionVon(DIST) || "?"})` : "wird beim ersten Internet-Kontakt von GitHub geladen"}`);
  console.log(`  Auto-Mirror: ${MIRROR_AKTIV ? `${GH_BASIS}  (Prüfung alle ${Math.round(UPDATE_INTERVALL/60000)} Min)` : "AUS (ELWIS_MIRROR=0)"}`);
  console.log("");

  // Auto-Mirror: gleich prüfen, dann im Takt. Neue Versionen werden geladen,
  // aber erst beim nächsten Neustart aktiv (Hinweis erscheint in der App).
  if(MIRROR_AKTIV){
    pruefeAufUpdate();
    setInterval(pruefeAufUpdate, UPDATE_INTERVALL);
    // Bereitliegende Version zeitnah scharf schalten, sobald kein Gerät mehr verbunden ist.
    setInterval(versucheLeerlaufAktivierung, 20000);
  } else {
    console.log("  Auto-Mirror: AUS (ELWIS_MIRROR=0) – lokaler Build wird ausgeliefert.");
  }
});
