# LOTSE112 – Einsatzleitung

Kräfteerfassung, Lagekarte, Funktagebuch, Lagebesprechungen, Checklisten und
Einsatzmonitor für die Einsatzstelle – als offline-fähige Web-App (PWA).

**Live:** https://schelltom.github.io/elwis/

## Module

- **Einsatz** – Stammdaten, Einsatzabschnitte (mit TMO/DMO + Ansprechpartner),
  Alarm-Foto-OCR, Export/Import als Datei, Einsatzende mit Archiv
- **Kräfte** – Einheiten (Stärke 0/1/8/9, AGT, Fahrzeugkatalog, Bereitstellungsraum),
  Führungskräfte (Einsatzabschnitt oder Einsatzleitung), Nachforderungs-Tracker
- **Funk (ETB)** – Einsatztagebuch mit Zeitstempel, Von/An, Wichtig-Flag, Sprachdiktat, Druck
- **Komm-Skizze** – automatisch generierte Kommunikationsskizze (Leitstelle → EL → Abschnitte)
- **Besprechung** – Protokolle mit Historie, Lagekarten-Snapshot je Besprechung
- **Foto-Doku** – Fotos mit Zeitstempel und Kommentar; Bytes getrennt vom Sync (`/api/foto`)
- **Checklisten** – EL-Erstmaßnahmen, MANV, Gefahrgut; jeder Haken mit Zeitstempel
- **Atemschutz** – FwDV-7-Sammelstelle + Überwachung: Geräteträger, Trupps (Truppname,
  Sicherheitstrupp-Kennzeichnung), Druck-/Zeitüberwachung, Nachweis-Ausdruck
- **Lagekarte** – taktische Zeichen (DV 102), nummerierte Marker mit Legende,
  Fahrzeug-Symbole, Linien/Flächen, Wasserförderung über lange Wegstrecke
  (Verstärker-/Reservepumpen, Höhenprofil), Zoom, Snapshots, Luftbild/Screenshot
- **Monitor** – 22-Zoll-Ansicht mit rotierenden Abschnitts-Kacheln (30 s, Play/Pause,
  Countdown), Kräfteübersicht, Lagekarte, Atemschutz und Komm-Skizze als Seiten
- **Druck** – kompletter Einsatzbericht inkl. Karte, Lagebildern und Fotos (auch als PDF/Word)

## Entwicklung

```bash
npm install
npm run dev       # http://localhost:4321/elwis/
npm run build     # statischer Build nach dist/
npm test          # node --test (keine Abhängigkeiten) – Sync-/Server-Tests
```

Deployment **App**: Push auf `main` → GitHub Actions baut und veröffentlicht auf GitHub Pages.
CI (`ci.yml`) fährt bei Push und PR die Testsuite.

## Sync im Einsatz (ELW-Server)

Für den Multi-Device-Betrieb (iPhone im Fahrerhaus + ELW-Rechner + Erfassungs-Tablets +
Monitor im gleichen WLAN) läuft auf dem NAS ein kleiner Sync-Server **ohne jede
Abhängigkeit** (nur Node):

```bash
npm run build          # einmalig bzw. nach Updates: App bauen
npm run server         # startet den ELW-Server auf Port 8474
# lokal testen ohne den Auto-Mirror:
ELWIS_MIRROR=0 npm run server
```

Der Server zeigt beim Start die WLAN-Adresse an (z. B. `http://192.168.178.20:8474/`) –
**Geräte öffnen genau diese Adresse** und sind damit automatisch am Einsatz gekoppelt:

- Die App erkennt den Server (`/api/info`) und schaltet auf Sync um.
- Alle 3 s: lokale Änderungen pushen, **Delta seit dem letzten Stand** zurückbekommen
  (last-write-wins je Datensatz, Löschungen über die Live-ID-Liste; Rückwärtskompatibel
  zum Vollstand-Protokoll für alte Clients).
- Offline draußen erfassen funktioniert weiter – zurück im WLAN gleicht die App
  automatisch ab („Offline · n lokal“ → „Synchron · n Geräte“).
- Gesynct wird **alles zum Einsatz** (Kräfte, Abschnitte, Funk, Besprechungen,
  Checklisten, Foto-**Metadaten**, Lagekarte inkl. Snapshots). **Fotos** laufen als
  Binärdateien getrennt über `GET/PUT /api/foto/<id>` (Ablage `server/fotos/`).
  Gerätelokal bleiben Einstellungen, Monitor-Kachelauswahl und Archiv.
- Persistenz: `server/elwis-daten.json` (Snapshot, fsync + `.prev`-Rotation) plus
  **Write-Ahead-Journal** `server/journal.ndjson` → harter Absturz kostet ~2 s statt
  ~2 min. Rotierende Backups in `server/backups/`. Persistenz-Probleme melden sich als
  Banner in der App; Details unter `GET /api/health`.

**Deployment Server:** wird **nicht** automatisch aktualisiert. Am NAS im Repo-Ordner
`git pull` + Server neu starten. `server/sync-core.mjs` (Merge-Kern) muss mitkommen.
`elwis-daten.json`, `journal.ndjson`, `backups/`, `fotos/` sind nicht in git.

Vollständig: **`SYNC-ARCHITEKTUR.md`**.

## Architektur

- Astro (statisch) – alle Daten liegen lokal im Browser (IndexedDB), Foto-Bytes unter
  `foto:<id>`-Keys getrennt vom State-Blob. GitHub Pages für Installation/Updates,
  im Einsatz liefert der ELW-Server die App aus (Auto-Mirror holt neue Builds).
- PWA: Service Worker (`public/sw.js`) – offline nur in einem *secure context*
  (HTTPS **oder** NAS-Origin per `chrome://flags` / MDM freigegeben, siehe SYNC-ARCHITEKTUR.md).
- Sync-Merge-Kern rein und testbar in `server/sync-core.mjs`; `lotse112-server.mjs` ist
  die HTTP-/Persistenz-Hülle.
- Der klickbare Prototyp (Design-Vorlage/Spezifikation) liegt unter `prototyp/prototyp.html`
- Planung, Architektur-Entscheidungen und Roadmap: `PLANUNG.md`
