/* ================================================================
   LOTSE112 – Sync-Kernlogik (rein, ohne HTTP/Datei/Netz)
   ----------------------------------------------------------------
   Hier liegt das Zusammenführen der Geräte-Stände, damit es isoliert
   testbar ist (test/sync-core.test.mjs). Der ELW-Server
   (lotse112-server.mjs) ist nur noch die HTTP-/Persistenz-Hülle drumherum.
   ================================================================ */

// Client-Zeitstempel (_m) NICHT blind vertrauen: ein Gerät mit falsch gestellter
// (Zukunfts-)Uhr würde sonst jeden Merge dauerhaft „gewinnen". Auf jetzt + Toleranz clampen.
export const CLAMP_TOLERANZ_MS = 5 * 60 * 1000;

export function leererStand(){
  return { einsatzId: null, einsatzStart: null, seq: 0,
    singletons: {}, collections: {}, tombstones: {} };
}

/* Einen Client-Sync-Body in `stand` einmergen.
   Rückgabe: { stand, geaendert }. `stand` kann ersetzt werden (neuer Einsatz) –
   immer den zurückgegebenen weiterverwenden. Die Seq (stand.seq) wird nur bei
   echter Änderung erhöht; alle Änderungen einer Runde teilen sich diese Seq (`_s`),
   das ist die Grundlage der Delta-Antwort.
   opts.jetzt(): Zeitquelle (Default Date.now) – für Tests injizierbar.
   opts.log(msg): z. B. console.log für den Einsatzwechsel-Hinweis. */
export function mergeSync(stand, body, opts = {}){
  const jetzt = opts.jetzt || Date.now;
  const log = opts.log || (() => {});
  let geaendert = false;
  const neueSeq = stand.seq + 1;
  const markiere = () => { geaendert = true; return neueSeq; };
  const jetztM = jetzt();
  const clampM = m => Math.min(Number(m) || 0, jetztM + CLAMP_TOLERANZ_MS);

  // Einsatz-Identität: neuerer Einsatz ersetzt den alten komplett.
  // body.ersetzen = bewusste Aktion am Client (Verwerfen / Neuer Einsatz / Beenden / Import).
  if(body.einsatzId && body.einsatzId !== stand.einsatzId){
    const neuer = body.ersetzen || !stand.einsatzId ||
      (body.einsatzStart || "") > (stand.einsatzStart || "");
    if(neuer){
      log(`Neuer Einsatz übernommen (${body.einsatzId}).`);
      stand = leererStand();
      stand.einsatzId = body.einsatzId;
      stand.einsatzStart = body.einsatzStart || new Date(jetztM).toISOString();
      geaendert = true;
    }else{
      // Client hängt an einem älteren Einsatz → er bekommt den Serverstand
      return { stand, geaendert: false };
    }
  }
  if(!stand.einsatzId && body.einsatzId){
    stand.einsatzId = body.einsatzId;
    stand.einsatzStart = body.einsatzStart || new Date(jetztM).toISOString();
    geaendert = true;
  }

  // Einzelobjekte (Stammdaten feldweise, Kartenhintergrund)
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

  // Löschungen (Tombstones). Für die Delta-Antwort zählt die Live-ID-Liste je Sammlung –
  // ein hier gelöschter Datensatz fällt dort einfach weg.
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

  if(geaendert) stand.seq = neueSeq;
  return { stand, geaendert };
}

/* Datenteil einer Vollstand-Antwort (Alt-Protokoll: Client ersetzt Sammlungen komplett).
   Der Server ergänzt clients + updateInfo. */
export function vollStand(stand){
  const collections = {};
  for(const [name, col] of Object.entries(stand.collections)) collections[name] = Object.values(col);
  return { einsatzId: stand.einsatzId, einsatzStart: stand.einsatzStart,
    seq: stand.seq, singletons: stand.singletons, collections };
}

/* Datenteil einer Delta-Antwort: nur Einzelfelder/Datensätze mit _s > clientSeq,
   plus je Sammlung die vollständige Liste der noch lebenden IDs (Löscherkennung).
   clientSeq <= 0 → Erstabgleich, dann kommt alles. */
export function deltaStand(stand, clientSeq){
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
    seq: stand.seq, delta: true, singletons, collections, ids };
}
