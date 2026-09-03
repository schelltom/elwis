/* Hilfsfunktion für Tests: eine einzelne Top-Level-Funktionsdeklaration aus einer
   Quelldatei herausschneiden und ausführbar machen.

   Nötig, weil public/app.js ein einziges klassisches Browser-Skript ist (kein
   Modulsystem) – die paar reinen Sync-Helfer lassen sich so trotzdem isoliert testen,
   ohne app.js komplett mit DOM-Attrappen zu laden.

   Grenzen: einfacher Klammerzähler ohne String-/Kommentar-/Regex-Erkennung. Nur für
   kleine, selbst­enthaltene Funktionen gedacht (snapGleich, mergeDeltaCollection). */
import fs from "node:fs";

export function funktionsQuelle(pfad, name){
  const src = fs.readFileSync(pfad, "utf8");
  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
  if(start < 0) throw new Error(`Funktion "${name}" nicht in ${pfad} gefunden`);
  let i = src.indexOf("{", start);
  if(i < 0) throw new Error(`Kein Rumpf für "${name}"`);
  let tiefe = 0;
  for(; i < src.length; i++){
    if(src[i] === "{") tiefe++;
    else if(src[i] === "}"){ tiefe--; if(tiefe === 0){ i++; break; } }
  }
  return src.slice(start, i);
}

/* Lädt benannte Funktionen aus `pfad` und gibt sie als Objekt zurück.
   Freie Bezeichner (z. B. SYNC_COLS) werden über `scope` als Parameter reingereicht.
   new Function ⇒ gleiche Realm wie der Test (Arrays/Objekte sind vergleichbar). */
export function ladeFunktionen(pfad, namen, scope = {}){
  const quelle = namen.map(n => funktionsQuelle(pfad, n)).join("\n\n");
  const keys = Object.keys(scope);
  const fabrik = new Function(...keys, `${quelle}\nreturn { ${namen.join(", ")} };`);
  return fabrik(...keys.map(k => scope[k]));
}
