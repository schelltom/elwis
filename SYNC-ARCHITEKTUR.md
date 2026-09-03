# LOTSE112 – Sync-Architektur

Wie sich iPhone, ELW-Desktop, Erfassungs-Tablets und Einsatzmonitor auf **einen**
gemeinsamen Einsatzstand einigen.

> Kurzfassung: **Der Server auf dem NAS ist der Chef.** Alle Endgeräte sind
> gleichberechtigte Clients mit vollständiger lokaler Kopie. Zusammengeführt wird
> serverseitig, *last-write-wins pro Datensatz* über Zeitstempel.

---

## 1. Bausteine

| Baustein | Datei / Ort | Aufgabe |
|---|---|---|
| **ELW-Server** | `server/lotse112-server.mjs` auf dem NAS, Port **8474** | Liefert die App aus, führt `/api/sync` zusammen, persistiert |
| **Maßgeblicher Stand** | NAS: `server/elwis-daten.json` | **Die Wahrheit.** Snapshot, atomar + `fsync` geschrieben; davor rotiert der letzte gute Stand nach `.prev` |
| **Write-Ahead-Journal** | NAS: `server/journal.ndjson` | Jeder ändernde Merge als eine Zeile; beim Start über den Snapshot gelegt → Verlust bei hartem Absturz ≈ 2 s statt ≈ 2 min |
| **Backups** | NAS: `server/backups/elwis-daten-<zeit>.json` | Snapshot höchstens alle **2 min**, letzte **40** / **30 Tage** / min. **10**; zusätzlich beim Serverstart und beim Beenden |
| **Fotos** | NAS: `server/fotos/<id>` (JPEG) | getrennt vom Einsatzstand, siehe „Fotos (Sonderfall)" |
| **Client** | App im Browser jedes Geräts | Hält **vollständige lokale Kopie** in IndexedDB → offlinefähig |
| **Client-Snapshot** | Browser: IndexedDB `sync-snap` | Referenz für den Diff „was hat sich seit dem letzten Abgleich geändert?" |

Keine externen Abhängigkeiten – nur Node (≥ 18) auf dem NAS.

### Persistenz-Ablauf pro ändernder `/api/sync`

1. Merge in den RAM-Stand (`mergeStand`), `seq` erhöht.
2. **Journal**: der rohe Client-Body wird als Zeile `{ s: seq, m: jetzt, b: body }` angehängt (alle 2 s `fsync`).
3. **Snapshot**: entprellt (~500 ms) `elwis-daten.json` neu schreiben (`.prev`-Rotation, `fsync`), dann das Journal auf Einträge `> seq` kürzen.
4. **Start**: `elwis-daten.json` → `.prev` → neueste Backups (je auf Plausibilität geprüft), dann Journal-Einträge mit `s > snapshot.seq` nachspielen (`mergeStand` mit der ursprünglichen Uhrzeit `m` → deterministisch), sofort ein frischer Checkpoint.
5. Persistenz-Probleme (kein Platz, Schreibfehler) landen als `serverWarnung` in jeder Antwort → Client-Banner „Einsatz jetzt exportieren"; Details unter `GET /api/health`.

---

## 2. Datenfluss

```
 iPhone (Fahrerhaus) ─┐
 Desktop (ELW)      ──┤                ┌─ server/elwis-daten.json   ← maßgeblich
 Tablet Abschnitt 1 ──┼──► NAS-Server ─┤
 Tablet Abschnitt 2 ──┤   (merge)      └─ server/backups/           ← ≤ 2 min
 Monitor (22")      ──┘
        ▲                    │
        └──── alle 3 s ──────┘
        POST /api/sync  (Diff hoch, zusammengeführter Stand runter)
```

- **Takt:** jedes Gerät ruft alle **3 Sekunden** `POST /api/sync` auf
  (`setInterval(syncTick, 3000)` in `public/app.js`).
- **Hoch** geht nur der **Diff** (geänderte Datensätze, neue Tombstones, geänderte
  Einzelfelder) – ermittelt gegen den lokalen Snapshot (`syncDiff()`). Der Client
  schickt `delta: 1` und seinen Änderungs-Zähler `seq` mit.
- **Runter** kommt eine **Delta-Antwort** (`deltaAntwort()`): nur Einzelfelder und
  Datensätze mit `_s > seq` (serverseitige Änderungs-Seq) plus je Sammlung die
  vollständige Liste der noch lebenden IDs (`ids`) – daran erkennt der Client
  Löschungen anderer Geräte. Hat sich nichts geändert: `{ unchanged: true }`.
  Beim Erstabgleich (`seq` 0) und bei einem Alt-Client ohne `delta`-Flag liefert
  der Server den **kompletten** Stand (`standAntwort()`).
- Der Client pflegt die Änderungen ein (`syncApply()`: Upsert + Löschungen über
  `ids`), stellt seinen `seq`-Cursor **erst nach erfolgreichem Übernehmen** weiter,
  schreibt einen neuen Snapshot und rendert neu – **außer** es tippt gerade jemand
  in ein Feld (3-Sekunden-Schonfrist, `syncTipptGerade()`), dann nur der Kopf.
- Größere `/api/sync`-Antworten werden gzip-komprimiert.

### API-Endpunkte des Servers

| Endpoint | Zweck |
|---|---|
| `GET /api/info` | „Bin ein ELW-Server", aktuelle `einsatzId`, `seq`, verbundene Geräte, LAN-URLs, App-Update-Status |
| `POST /api/sync` | Diff entgegennehmen, mergen, Delta seit `seq` zurückgeben (oder `unchanged` / kompletten Stand beim Erstabgleich bzw. Alt-Client) |
| `GET/PUT/DELETE /api/foto/<id>` | Foto-Binärdatei (JPEG) abrufen / hochladen / löschen – getrennt vom Einsatzstand, `Cache-Control: immutable` |
| `GET /api/fotos` | IDs der Fotos, die der Server hat (Upload-Abgleich) |
| `GET /api/health` | Persistenz-Kennzahlen: letzter Save, `saveFehler`, `warnung`, Journal-Zeilen, freier Platz, Backup-/Foto-Anzahl |
| `GET /api/backups` | Backup-Liste (Name, Größe, Zeit) |
| `POST /api/restore` | Backup wiederherstellen → neue `einsatzId` mit „jetzt", alle Clients ziehen nach |
| alles andere | statische App aus `dist/` (SPA-Fallback auf `index.html`) |

---

## 3. Merge-Regeln (Server, `mergeSync()`)

### Einsatz-Identität
- Jedes Gerät erzeugt beim ersten Start eine `einsatzId` (`uid()`), aber ein Gerät
  „hat einen Einsatz" erst, wenn **echte Inhalte** erfasst sind (`einsatzHatDaten()`).
- Kommt ein Gerät mit einer **anderen** `einsatzId` als der Server:
  - Server hat noch keinen Einsatz **oder** der Client-Einsatz ist **neuer**
    (`einsatzStart` später) **oder** der Client erzwingt es (`ersetzen`-Flag)
    → Server **übernimmt den Einsatz des Clients komplett** (alter Stand wird verworfen).
  - sonst → Client bekommt den Serverstand zurück und richtet sich danach.

### Einzelfelder (Singletons)
Einsatz-Stammdaten werden **feldweise** synchronisiert
(`einsatz:stichwort`, `einsatz:ort`, `einsatz:leiter`, … sowie `lageBg`, `lwbilanz`).
Pro Feld gewinnt der **jüngste Zeitstempel**. Zwei Personen an **verschiedenen**
Feldern stören sich also nicht; an **demselben** Feld gewinnt der letzte Speichervorgang.

### Fotos (Sonderfall)

`state.fotos` trägt im Sync nur die Metadaten `{ id, zeit, notiz }`. Die Bilddaten
laufen **nicht** durch `/api/sync` und liegen **nicht** im State-Blob, sondern:

- gerätelokal in IndexedDB unter `foto:<id>` (aufgenommene / vom Server geholte)
- am ELW-Server als JPEG-Datei unter `server/fotos/<id>`, abrufbar über `GET /api/foto/<id>`

Ablauf: Aufnahme → lokal ablegen → Metadaten syncen → Binärdatei per `PUT` hochladen
(offline: Warteschlange, Abgleich bei Verbindung über `GET /api/fotos`). Andere Geräte
rendern `<img data-foto>` und ziehen das Bild von `/api/foto/<id>` (Platzhalter, solange
noch nicht hochgeladen). Bericht/Word/Export holen die Bytes vorher über `fotosMitBytes()`;
das lokale Archiv bettet sie eingebettet. Alt-Stände / Alt-Clients mit Inline-`data`
werden serverseitig automatisch in Dateien ausgelagert.

### Sammlungen (`SYNC_COLS`)
`einheiten`, `fuehrung`, `abschnitte`, `funk`, `besprechungen`, `anforderungen`,
`checks`, `fotos`, `asTraeger`, `asTrupps`, `lageItems`, `lageSnapshots`

- **Last-write-wins pro Datensatz** über den Zeitstempel `_m`.
- Verschiedene Datensätze (z. B. zwei neue Fahrzeuge auf zwei Tablets) → **beide** bleiben.
- Derselbe Datensatz gleichzeitig bearbeitet → der **letzte** Stand gewinnt, kein Feld-Merge.

### Löschungen (Tombstones)
Eine Löschung wird als `tombstone[id] = zeit` propagiert. Ein Datensatz, der älter
als sein Tombstone ist, verschwindet überall und kann durch einen verspäteten Push
nicht „wiederauferstehen".

### Uhren-Schutz
Client-Zeitstempel werden serverseitig auf **jetzt + 5 min** gedeckelt
(`CLAMP_TOLERANZ_MS`). Ein Gerät mit falsch gestellter Zukunfts-Uhr kann so nicht
dauerhaft jeden Merge „gewinnen".

---

## 4. Offline-Verhalten

- Ein Client ohne Serververbindung arbeitet **normal weiter**; der Diff wächst,
  die Statuspille zeigt „Offline · N lokal".
- Bei nächster Verbindung wird der gesamte aufgelaufene Diff auf einmal gepusht und
  zusammengeführt.
- Der Server merkt sich verbundene Geräte 15 s lang (`aktiveGeraete()`); danach
  gilt ein Gerät als weg (relevant für die Leerlauf-Aktivierung von App-Updates).

### App-Auslieferung und Erreichbarkeit

Die App (HTML/JS/CSS) wird im ELW-Betrieb vom NAS ausgeliefert (`http://<nas>:8474/`).
Ob sie **offline** verfügbar ist, hängt am Service Worker (`public/sw.js`), und der
läuft nur in einem **secure context** (`window.isSecureContext`):

**A) Ohne Freigabe (plain `http`, Standard):** kein Service Worker, **kein
App-Offline-Cache**. Praktische Folge:

- **Kein NAS → keine App ladbar.** Der Fall „App gestartet, aber NAS noch nicht da"
  kann gar nicht eintreten.
- **Wenn die App lädt, läuft der NAS** → `syncInit()` erreicht `/api/info` → das
  Gerät landet **immer** im Server-Einsatz.
- Solange der Tab offen bleibt, arbeitet das Gerät auch bei WLAN-Verlust weiter
  (JS im Speicher, Schreiben in IndexedDB). **Reload außerhalb der Reichweite =
  weiße Seite.**

**B) ELW-Origin als „secure" freigegeben → echte Offline-PWA (empfohlen für
mobil genutzte Tablets):**

Auf den Tablets (Chrome/Android) die NAS-Origin freigeben:

- manuell: `chrome://flags/#unsafely-treat-insecure-origin-as-secure` →
  `http://<nas-ip>:8474` eintragen, aktivieren, Chrome neu starten; **oder**
- verwaltet: MDM-Policy `OverrideSecurityRestrictionsOnInsecureOrigin` mit derselben
  Origin (empfohlen, weil update- und resetfest).

Dann registriert die App den Service Worker, precached die App-Shell
(`index.html`, `app.js`, `app.css`, `leaflet`, `qrcode`, Icons) und liefert sie
danach **auch komplett offline** aus (stale-while-revalidate: aus dem Cache
antworten, im Hintergrund aktualisieren). Schwergewichte (Tesseract-OCR, PDF.js)
werden erst bei Nutzung geladen und dann opportunistisch gecacht – einmal online
„vorwärmen".

Voraussetzungen/Fallstricke:
- Die Freigabe ist **an die konkrete Origin gebunden** – ändert sich die NAS-IP
  oder der Port, muss sie angepasst werden. Feste NAS-IP vergeben.
- App-Updates: `sw.js` cached versioniert (`VERSION`-Konstante). Jeder Deploy muss
  die `VERSION` erhöhen, sonst sieht ein Tablet die neue Version erst verzögert.
  Der Hinweis-Banner „Neue Version liegt am ELW bereit" greift weiterhin.
- iOS/Safari (das iPhone im Fahrerhaus) hat **kein** Flag-Äquivalent – braucht es
  aber auch nicht, weil es immer in NAS-Nähe ist. Die Offline-PWA ist eine
  Android-Chrome-Sache für die herumlaufenden Erfassungs-Tablets.
- Alternative wäre echtes HTTPS am NAS (self-signed CA auf den Tablets ausrollen) –
  gleicher Pro-Gerät-Aufwand, daher ist die Origin-Freigabe der pragmatische Weg.

`syncInit()` läuft in beiden Fällen nur **einmal beim App-Start**; ein einmal
laufender `syncTick` übersteht kurze WLAN-Aussetzer von selbst (alle 3 s).

**Rest-Fall bei A):** Tab offen, **NAS startet neu**, *dann* Reload → weiße Seite,
bis der NAS wieder da ist. Die Sitzung **ohne** Reload läuft weiter und verbindet
sich automatisch wieder. Bei B) rendert die App-Shell auch dann aus dem Cache.

---

## 5. Verbinden eines neuen Geräts (`syncInit()`)

Beim Start prüft der Client `GET /api/info`:

1. **Kein ELW-Server erreichbar** → App läuft eigenständig weiter (Solo-Betrieb).
2. **Server führt denselben Einsatz** → normaler `syncTick`, fertig.
3. **Server führt einen anderen Einsatz**:
   - Client hat **selbst nichts erfasst** *oder* Server-Einsatz ist **neuer**
     → Server-Einsatz wird **automatisch übernommen** (kein Dialog).
   - Client hat **eigene, nicht-ältere Daten** → **Konfliktdialog**
     („Am ELW läuft bereits ein Einsatz"):
     - *Diesen (ELW-)Einsatz übernehmen* → lokale Daten verworfen.
     - *Meinen Einsatz verwenden* → ersetzt den Stand am ELW für alle Geräte.

---

## 6. Dein Szenario: kein Problem ✅

**Ablauf:** iPhone erfasst auf der Anfahrt im ELW-WLAN → an der Einsatzstelle
Desktop hochfahren, der verbindet sich über `http://192.168.x.x:8474/`.

| Schritt | Was passiert | Ergebnis |
|---|---|---|
| iPhone erfasst unterwegs | iPhone pusht alle 3 s; NAS hat noch keinen Einsatz | NAS **übernimmt den iPhone-Einsatz**, Daten liegen ab jetzt auf dem NAS |
| WLAN-Aussetzer auf der Fahrt | iPhone arbeitet lokal weiter, Diff wächst | Beim nächsten Kontakt automatisch aufgeholt |
| Desktop startet an der E-Stelle | frische App, **kein eigener Einsatzinhalt** (`einsatzHatDaten()` = false) | Desktop **übernimmt automatisch** den Server-(= iPhone-)Einsatz, **ohne Nachfrage** |
| iPhone + Desktop arbeiten parallel | verschiedene Felder / verschiedene Datensätze | mergen sauberer über das NAS, alle 3 s |
| Monitor / weitere Tablets dazu | wie Desktop: nichts eigenes → still übernehmen | zeigen denselben Stand |

**Warum kein Konflikt:** Der Konfliktdialog kommt nur, wenn ein *zweites* Gerät
**selbst schon einen Einsatz mit Inhalten** angelegt hat. Solange nur das iPhone
den Einsatz „eröffnet" und alle anderen sich bloß **verbinden**, gibt es genau
eine Wahrheit. Beim bloßen Aufruf der URL kann man **keinen** versehentlichen
Zweit-Einsatz erzeugen – die App übernimmt beim Start still den Server-Einsatz.

**Einen neuen Einsatz gibt es nur über einen bewussten Knopf** – und der drückt
ihn dem Server dann **erzwungen** auf (`ersetzen`-Flag, ohne Konfliktdialog):

- Einstellungen → „Aktuellen Einsatz verwerfen (ohne Archiv)"
- „Einsatz beenden" (archiviert + leert)
- „Beispieldaten laden"
- „Einsatz importieren"
- einen archivierten Einsatz reaktivieren

→ Auf Zweitgeräten während eines laufenden Einsatzes **keine** dieser Aktionen.

### Damit es so bleibt

- **Nur ein Gerät eröffnet den Einsatz** (das iPhone). Auf Desktop/Tablets/Monitor
  **keinen** „Neuen Einsatz" starten – nur die Adresse aufrufen und verbinden.
- **Browser zwischen Einsätzen aufräumen:** nach dem Einsatz „Einsatz beenden".
  Sonst klebt ein Gerät an alten Daten und löst beim nächsten Mal den Konfliktdialog aus.
- **Uhren synchron** halten (idealerweise alle Geräte per NTP / gleiche Zeitquelle).
- **Alle im gleichen Subnetz.** Verbindungs-URL/QR-Code steht in der App unter
  Einstellungen; eine feste NAS-IP oder ein `elw.local`-Name macht es robuster.

---

## 7. Grenzen & mögliche Verbesserungen

| Thema | Heute | Idee |
|---|---|---|
| **NAS-Prozess weg / Absturz** | Journal + `.prev`-Kaskade holen den Stand bis ~2 s vor den Crash zurück; Clients laufen lokal weiter, mergen bis zum Neustart nicht untereinander | Desktop als Hot-Standby-Server / „dieses Gerät als Server"-Modus (größerer Umbau) |
| **Total­verlust NAS-Platte** | alles auf dem NAS weg (Snapshot, Journal, Backups, Fotos) | periodische Kopie des Datenverzeichnisses auf USB / zweite Freigabe (Shell-Skript / Cron) |
| **Echtzeit** | 3-s-Polling | WebSocket/SSE senkt Latenz und NAS-Last, kostet Komplexität |
| **Delta-Overhead** | jede Delta-Antwort enthält die vollständige ID-Liste je Sammlung (für die Löscherkennung) – wenige KB, aber wächst mit dem Einsatz | Tombstones mit eigener `_s` führen und nur Lösch-IDs seit `seq` senden |
| **Foto-Speicher am NAS** | `server/fotos/` wächst; kein GC verwaister Dateien | GC nach Einsatzende (IDs gegen den Stand abgleichen) |
| **`app.js` unminifiziert** | ~490 KB → 140 KB gzip (reicht meist) | esbuild-Schritt für ~110 KB |
| **Gleiches Feld gleichzeitig** | last-write-wins, kein Merge | bei Bedarf Feld-Sperre / „wird gerade bearbeitet"-Hinweis |
| **Boot-Race** | nur wenn der NAS **leer** hochkommt (Datendatei verloren) *und* mehrere Geräte mit je eigenem Einsatz fast gleichzeitig pushen → erster besetzt die `einsatzId`, zweiter bekommt Konfliktdialog. Bei normalem NAS-Neustart (lädt `elwis-daten.json`) tritt das nicht auf. | organisatorisch: iPhone eröffnet, Rest verbindet; NAS-Backups schützen vor „leer hochkommen" |
| **Discovery** | IP/QR-Code manuell | mDNS (`elw.local`), feste IP, Startseite mit „Verbinden"-Knopf |
| **App offline (Tablets)** | ohne Origin-Freigabe kein App-Cache → Reload außer Reichweite = weiße Seite | NAS-Origin auf den Tablets als „secure" freigeben (Flag/MDM) → echte Offline-PWA, siehe Abschnitt 4 B) |

---

## 8. Tests

`npm test` (`node --test`, keine Abhängigkeiten). Läuft auch in CI
(`.github/workflows/ci.yml`) bei Push und Pull Request.

| Datei | prüft |
|---|---|
| `test/sync-core.test.mjs` | Merge-Kern (`server/sync-core.mjs`): last-write-wins, Clamping, Tombstones, Einsatzwechsel/`ersetzen`, Delta-Filter, Erstabgleich |
| `test/sync-client.test.mjs` | reine Client-Helfer aus `public/app.js` (`snapGleich`, `mergeDeltaCollection`) – per Quelltext-Extraktion |
| `test/sync-http.test.mjs` | echter Server über HTTP: Delta-Protokoll, Löscherkennung, Alt-Client-Fallback, gzip, ETag/304, Fotos (`/api/foto*`), Persistenz |
| `test/sync-durability.test.mjs` | Write-Ahead-Journal (SIGKILL → Replay), Checkpoint, `.prev`-Kaskade bei defekter Datei, `/api/health` |

Server-Datei per `ELWIS_DATEN=<pfad>` umlenkbar (Tests nutzen ein Temp-Verzeichnis);
`journal.ndjson`, `.prev`, `backups/` und `fotos/` liegen daneben.

## 9. Verweise in den Quellen

- Merge-Kern (rein, testbar): `server/sync-core.mjs` → `mergeSync()` (stempelt `_s`), `deltaStand()`, `vollStand()`
- Server-Hülle: `server/lotse112-server.mjs` → `mergeSync()`-Wrapper, `deltaAntwort()`, `standAntwort()`, Routen ab `http.createServer`
- Client-Sync: `public/app.js` → `SYNC`, `SYNC_COLS`, `syncDiff()`, `syncApply()`,
  `mergeDeltaCollection()`, `snapGleich()`, `syncTick()`, `syncInit()`, `frageEinsatzKonflikt()`
- Foto-Speicher: `public/app.js` → `fotoAufnehmen()`, `fotoDatenHolen()`, `fotosEinblenden()`,
  `fotoUploadsAbgleichen()`, `fotosMitBytes()`; Server → `fotoDataAuslagern()`, Routen `/api/foto*`
- Persistenz Server: `server/lotse112-server.mjs` → `ladeSnapshot()`, `journalNachspielen()`,
  `journalAnhaengen()` / `journalKuerzen()`, `snapshotSchreiben()` (fsync + `.prev`),
  `serverWarnung()`, Route `/api/health`
- Persistenz Client: `idbGet` / `idbSet`, `ladeZustand()`, `boot()`, `zeigeServerWarnung()`
- Auto-Mirror der App-Version (unabhängig vom Einsatz-Sync): `pruefeAufUpdate()`,
  `aktiviereBereitgestellte()`, abschaltbar mit `ELWIS_MIRROR=0`

---

## 10. Deployment

| Teil | Update | Wie |
|---|---|---|
| **App** (`dist/`) | **automatisch** | Push auf `main` → GitHub Actions → GitHub Pages. Der **Auto-Mirror** am NAS holt den neuen Build in ~5 min und schaltet ihn beim nächsten Serverneustart / bei 0 verbundenen Geräten scharf. |
| **Server** (`lotse112-server.mjs` **+ `sync-core.mjs`**) | **manuell** | Am NAS im Repo-Ordner `git pull`, dann Node-Prozess neu starten (`start-synology.sh`). Der Mirror fasst Servercode nie an. |

- `server/sync-core.mjs` ist ein **eigenständiges Modul** (reiner Merge-Kern), das
  `lotse112-server.mjs` importiert – muss beim `git pull` mitkommen, sonst startet
  der Server nicht.
- **Nicht in git** (bleiben beim `git pull` unangetastet): `elwis-daten.json`,
  `elwis-daten.json.prev`, `journal.ndjson`, `backups/`, `fotos/`.
- Erststart mit neuem Code: `ladeSnapshot()`-Kaskade, (leeres) Journal-Replay und
  `fotosBeimLadenAuslagern()` laufen automatisch.
- Lokal testen: `ELWIS_MIRROR=0 npm run server` (Mirror aus, damit der lokale Build
  nicht überschrieben wird), App-URL `http://localhost:8474/`.

### Kompatibilität (Übergangsphase)

| Kombination | Ergebnis |
|---|---|
| neue App + neuer Server | voll |
| neue App + **alter** Server | Sync ok (alter Server ignoriert `delta:1` → Vollstand). **Fotos:** Upload `PUT /api/foto/…` läuft ins Leere (404, still wiederholt); Metadaten syncen, das aufnehmende Gerät behält das Bild lokal, andere sehen Platzhalter bis Server-Update. Kein Datenverlust. |
| **alte App** (gecacht) + neuer Server | Sync ok (kein `delta:1` → Vollstand). Inline-Foto-`data` wird serverseitig ausgelagert. Alte App kann Fotos danach nicht mehr anzeigen (Bytes sicher am Server) – bis sie die neue Version nachlädt. |

Rückwärtskompatibel in beide Richtungen; die neue App kann dauerhaft gegen einen
alten Server laufen. Empfohlen: NAS zeitnah `git pull` + Neustart.

### Nach jedem App-Deploy

`public/sw.js` → `VERSION` erhöhen (aktuell `elwis-v155`), sonst sehen Tablets mit
Offline-PWA (Abschnitt 4 B) die neue Version verzögert.
