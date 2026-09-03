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
| **Maßgeblicher Stand** | NAS: `server/elwis-daten.json` | **Die Wahrheit.** Atomar geschrieben (`.tmp` → rename) |
| **Backups** | NAS: `server/backups/elwis-daten-<zeit>.json` | Snapshot höchstens alle **2 min**, letzte **40** behalten; zusätzlich beim Serverstart und beim Beenden |
| **Client** | App im Browser jedes Geräts | Hält **vollständige lokale Kopie** in IndexedDB → offlinefähig |
| **Client-Snapshot** | Browser: IndexedDB `sync-snap` | Referenz für den Diff „was hat sich seit dem letzten Abgleich geändert?" |

Keine externen Abhängigkeiten – nur Node (≥ 18) auf dem NAS.

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
  Einzelfelder) – ermittelt gegen den lokalen Snapshot (`syncDiff()`).
- **Runter** kommt der zusammengeführte Serverstand; hat sich nichts geändert,
  antwortet der Server `{ unchanged: true }` und spart die Nutzlast.
- Der Client übernimmt den Serverstand (`syncApply()`), schreibt einen neuen
  Snapshot und rendert neu – **außer** es tippt gerade jemand in ein Feld
  (3-Sekunden-Schonfrist, `syncTipptGerade()`), dann wird nur der Kopf aktualisiert.

### API-Endpunkte des Servers

| Endpoint | Zweck |
|---|---|
| `GET /api/info` | „Bin ein ELW-Server", aktuelle `einsatzId`, `seq`, verbundene Geräte, LAN-URLs, App-Update-Status |
| `POST /api/sync` | Diff entgegennehmen, mergen, zusammengeführten Stand (oder `unchanged`) zurückgeben |
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

Die App (HTML/JS/CSS) wird im ELW-Betrieb **ausschließlich vom NAS** ausgeliefert
(`http://<nas>:8474/`). Der Service Worker, der die App offline vorhalten würde,
registriert sich laut `public/app.js` **nur auf HTTPS** – im ELW-WLAN läuft aber
plain `http`. Daraus folgt praktischerweise:

- **Kein NAS → keine App ladbar.** Der Fall „App gestartet, aber NAS noch nicht da"
  kann im ELW-Betrieb gar nicht eintreten.
- **Wenn die App lädt, läuft der NAS** → `syncInit()` erreicht `/api/info` → das
  Gerät landet **immer** im Server-Einsatz.

`syncInit()` läuft nur **einmal beim App-Start**. Ein einmal laufender `syncTick`
übersteht kurze WLAN-Aussetzer von selbst (Wiederverbindung alle 3 s).

**Einziger Rest-Fall:** Tab ist bereits offen, der **NAS startet neu**, und *dann*
wird die Seite neu geladen → weiße Seite, bis der NAS wieder da ist. Die schon
laufende Sitzung **ohne** Reload läuft dagegen weiter und verbindet sich nach dem
NAS-Neustart automatisch wieder. Reine NAS-Verfügbarkeit (NAS läuft 24/7), kein
Einsatz-Konflikt.

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
| **NAS = Single Point of Failure** | Fällt das NAS aus, laufen alle Geräte lokal weiter, mergen aber nicht mehr untereinander | Desktop als Hot-Standby-Server; „dieses Gerät als Server"-Modus; Recovery = NAS neu starten (lädt `elwis-daten.json`) oder ein Gerät per „meinen Einsatz erzwingen" |
| **Echtzeit** | 3-s-Polling | WebSocket/SSE senkt Latenz und NAS-Last, kostet Komplexität |
| **Backups** | nur auf dem NAS | zusätzlicher Export auf zweites Medium (USB / zweite Freigabe) |
| **Gleiches Feld gleichzeitig** | last-write-wins, kein Merge | bei Bedarf Feld-Sperre / „wird gerade bearbeitet"-Hinweis |
| **Boot-Race** | nur wenn der NAS **leer** hochkommt (Datendatei verloren) *und* mehrere Geräte mit je eigenem Einsatz fast gleichzeitig pushen → erster besetzt die `einsatzId`, zweiter bekommt Konfliktdialog. Bei normalem NAS-Neustart (lädt `elwis-daten.json`) tritt das nicht auf. | organisatorisch: iPhone eröffnet, Rest verbindet; NAS-Backups schützen vor „leer hochkommen" |
| **Discovery** | IP/QR-Code manuell | mDNS (`elw.local`), feste IP, Startseite mit „Verbinden"-Knopf |

---

## 8. Verweise in den Quellen

- Server-Merge: `server/lotse112-server.mjs` → `mergeSync()`, `standAntwort()`, Routen ab `http.createServer`
- Client-Sync: `public/app.js` → `SYNC`, `SYNC_COLS`, `syncDiff()`, `syncApply()`,
  `syncTick()`, `syncInit()`, `frageEinsatzKonflikt()`
- Persistenz Client: `idbGet` / `idbSet`, `ladeZustand()`, `boot()`
- Auto-Mirror der App-Version (unabhängig vom Einsatz-Sync): `pruefeAufUpdate()`,
  `aktiviereBereitgestellte()`, abschaltbar mit `ELWIS_MIRROR=0`
