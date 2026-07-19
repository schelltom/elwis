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

## Architektur

- Astro (statisch), kein Server nötig – alle Daten liegen lokal im Browser (localStorage)
- PWA: Service Worker (`public/sw.js`) macht die App nach dem ersten Besuch offline nutzbar
- Der klickbare Prototyp (Design-Vorlage/Spezifikation) liegt unter `prototyp/prototyp.html`
- Planung, Architektur-Entscheidungen und Roadmap: `PLANUNG.md`

Geplant: IndexedDB-Datenschicht mit Änderungs-Queue und ELW-Sync-Serverteil
(QR-Kopplung, lokales WLAN) – siehe PLANUNG.md.
