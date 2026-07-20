# ELWIS – ELW-Informationssystem

Kräfteerfassung, Lagekarte, Funktagebuch, Lagebesprechungen, Checklisten und
Einsatzmonitor für die Einsatzstelle – als offline-fähige Web-App (PWA).

**Live:** https://schelltom.github.io/elwis/

## Module

- **Einsatz** – Stammdaten, Einsatzabschnitte (mit TMO/DMO + Ansprechpartner),
  Fotodokumentation, Export/Import als Datei, Einsatzende mit Archiv
- **Kräfte** – Einheiten (Stärke 0/1/8/9, AGT, Fahrzeugkatalog, Bereitstellungsraum),
  Führungskräfte, Nachforderungs-Tracker
- **Funk** – Einsatztagebuch mit Zeitstempel, Von/An, Wichtig-Flag, Sprachdiktat, Druck
- **Funkskizze** – automatisch generierte Kommunikationsskizze (Leitstelle → EL → Abschnitte)
- **Besprechung** – Protokolle mit Historie, Lagekarten-Snapshot je Besprechung
- **Checklisten** – EL-Erstmaßnahmen, MANV, Gefahrgut; jeder Haken mit Zeitstempel
- **Monitor** – 22-Zoll-Ansicht mit rotierenden Abschnitts-Kacheln (30 s, Play/Pause,
  Countdown), Lagekarte und Funkskizze als Seiten, Kacheln einzeln abschaltbar
- **Lagekarte** – taktische Zeichen (DV 102), nummerierte Marker mit Legende,
  Fahrzeug-Symbole, Linien/Flächen, Zoom, Snapshots, Foto/Screenshot als Hintergrund
- **Druck** – kompletter Einsatzbericht inkl. Karte, Lagebildern und Fotos (auch als PDF)

## Entwicklung

```bash
npm install
npm run dev       # http://localhost:4321/elwis/
npm run build     # statischer Build nach dist/
```

Deployment: Push auf `main` → GitHub Actions baut und veröffentlicht auf GitHub Pages.

## Sync im Einsatz (ELW-Server)

Für den Multi-Device-Betrieb (ELW-Rechner + Erfassungs-Tablets im gleichen WLAN)
gibt es einen kleinen Sync-Server **ohne jede Abhängigkeit** (nur Node ≥ 18):

```bash
npm run build          # einmalig bzw. nach Updates: App bauen
npm run server         # startet den ELW-Server auf Port 8474
```

Der Server zeigt beim Start die WLAN-Adresse an (z. B. `http://192.168.178.20:8474/`) –
**Tablets öffnen genau diese Adresse** und sind damit automatisch am Einsatz gekoppelt:

- Die App erkennt den Server selbst (`/api/info`) und schaltet von Simulation auf echten Sync
- Alle 3 s: lokale Änderungen pushen, zusammengeführten Stand übernehmen
  (last-write-wins je Datensatz, Löschungen über Tombstones)
- Offline draußen erfassen funktioniert weiter – zurück im WLAN gleicht die App
  automatisch ab („Offline · n lokal“ → „Synchron · n Geräte“)
- Gesynct wird **alles zum Einsatz** (Kräfte, Abschnitte, Funk, Besprechungen,
  Checklisten, Fotos, Lagekarte inkl. Snapshots); gerätelokal bleiben Einstellungen,
  Monitor-Kachelauswahl und das Archiv
- Persistenz: `server/elwis-daten.json` (übersteht Server-Neustarts)

## Architektur

- Astro (statisch) – alle Daten liegen lokal im Browser (localStorage);
  GitHub Pages dient für Installation/Updates, im Einsatz liefert der ELW-Server die App aus
- PWA: Service Worker (`public/sw.js`) macht die App nach dem ersten Besuch offline nutzbar
- Der klickbare Prototyp (Design-Vorlage/Spezifikation) liegt unter `prototyp/prototyp.html`
- Planung, Architektur-Entscheidungen und Roadmap: `PLANUNG.md`

Geplant: QR-Code am Monitor für die Tablet-Kopplung, IndexedDB-Datenschicht – siehe PLANUNG.md.
