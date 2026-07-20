# „ELWIS“ – Kräfteerfassung Einsatzstelle – Planung

Arbeitstitel/Produktname: **ELWIS** – das ELW-Informationssystem
Frühere Ideen „Status 4“, „KLAR“ und „KOMPASS“ wurden verworfen. Namenskonflikt prüfen: „ELWIS“ ist auch der Wasserstraßen-Infodienst des Bundes.

Tool zur Erfassung der Einsatzkräfte (Feuerwehr, BRK, Polizei, THW, Sonstige) an einer
Einsatzstelle. Ein Erfasser geht mit dem Tablet **offline** von Fahrzeug zu Fahrzeug,
zurück am ELW wird ins WLAN gesynct; alle Browser (inkl. Einsatzmonitor) zeigen den
aktuellen Stand.

## Entscheidungen (Stand 19.07.2026)

- **Stärkeformat:** 0/1/8/9 (Führer / Unterführer / Mannschaft / Gesamt), Gesamt wird berechnet
- **AGT** (Atemschutzgeräteträger) je Einheit erfassbar
- **Mehrere Erfasser gleichzeitig** müssen möglich sein (Großlage, Abschnitte)
- **Offline-Anforderung präzisiert:** Nur die **Kräfteerfassung** muss offline funktionieren
  (Tablet läuft die Fahrzeuge ab). Einsatz, Funk, Lagekarte und Monitor laufen **am ELW im
  WLAN** → ELW ist die immer verbundene Zentrale, nur die Erfassungs-Tablets brauchen die
  Offline-Warteschlange. Das vereinfacht den Sync erheblich.
- **Geräte-Rollen:** Kräfteerfassung = 10-Zoll-Tablet (Layout max. ~980 px);
  Einsatz/Funk/Lagekarte/Monitor = 22-Zoll-Monitor am ELW (breitere Layouts)
- **Monitor:** Abschnitts-Kacheln als Hauptfläche, **3 nebeneinander**, wachsen nach unten
  (viele Fahrzeuge je Abschnitt); **bei mehr als 3 Abschnitten rotiert die Anzeige
  seitenweise alle 30 s (1–3, 4–6, …), mit sichtbarem Sekunden-Countdown, manuellen
  Vor/Zurück-Pfeilen und anhaltbar per Play/Pause**; je Kachel
  Ansprechpartner, TMO/DMO und alphabetische
  Fahrzeugtabelle; daneben Organisations-Summen, Führungskräfte, letzte Funksprüche und
  **nächste Lagebesprechung** (mit Countdown, erfasst in den Einsatzstammdaten)
- **Funksprüche (Einsatztagebuch):** eigener Menüpunkt; Datum/Zeit (auto, Tageswechsel möglich),
  Von/An (Vorschläge aus Einheiten/Abschnitten/Leitstelle, Tauschen-Knopf), Text, Wichtig-Flag;
  letzte Meldungen am Monitor; vollständige Tabelle im Druckbericht
- **Nachforderungs-Tracker:** unter Kräfte → „Anforderungen“; Status angefordert →
  alarmiert → eingetroffen mit Zeitstempeln; Monitor zeigt „Anrollend“-Kachel; im Bericht
- **Bereitstellungsraum:** Einheiten dem BR zuordenbar (eigener Knopf im Abschnitts-Wähler),
  eigene Gruppe in der Kräfteliste, eigene (goldene) Kachel und Zähler am Monitor
- **Fotodokumentation:** Fotos mit Zeitstempel und Notiz am Einsatz (Tab Einsatz),
  clientseitig verkleinert (1280 px JPEG) für den lokalen Speicher
- **Checklisten:** eigener Menüpunkt; Vorlagen (EL-Erstmaßnahmen, MANV, Gefahrgut,
  später je Mandant pflegbar), jeder Haken mit Zeitstempel, Fortschritt am Monitor, im Bericht
- **Sprachdiktat:** Mikrofon-Knopf bei Funkspruch-Inhalt und Besprechungs-Protokoll
  (Web Speech API, de-DE; Komfortfunktion am ELW, offline eingeschränkt)
- **Funkskizze (Kommunikationsskizze):** eigener Menüpunkt; wird automatisch generiert:
  Leitstelle (Name + TMO-Betriebsgruppe aus den Einstellungen) → Einsatzleitung (ELW) →
  Abschnitts-Kästen mit Ansprechpartner, Einheitenzahl und DMO-Badge; TMO-Gruppen an den
  Verbindungslinien (Vorbild: Lagekarte „Kommunikationsskizze“ KFV Traunstein);
  **rotiert als eigene Seite auf dem Monitor mit** – Lagekarten- und Funkskizzen-Seite
  sind über den Kacheln-Dialog einzeln abschaltbar
- **Lagebesprechungen:** eigener Menüpunkt „Besprechung“; je Besprechung Protokoll mit
  Datum/Zeit und Teilnehmern, Historie aller alten Besprechungen mit Zeitpunkten;
  Pflege der „nächsten Lagebesprechung“ (Monitor-Countdown) dort integriert;
  Protokolle erscheinen im Druckbericht und wandern mit ins Archiv
- **Einsatzabschnitte:** anlegbar mit Name, **Ansprechpartner** (z. B. „Florian Weiden 3/1“)
  und TMO-/DMO-Gruppe (TMO z. B. Sondergruppe „2901“, DMO z. B. „307_F“); Einheiten zuordenbar
- **Führungskräfte** aller Organisationen erfassbar (Name, Funktion, Einheit/Abschnitt)
- **Einsatzende:** Einsatz wird archiviert und als **kompletter Bericht** druckbar
  (Browser-Druck/PDF): Stammdaten, Führungskräfte, Einheiten, Nachforderungen, Checklisten,
  Lagebesprechungen, Funksprüche, **Lagekarte als Grafik mit Legende, alle Lagebild-Snapshots,
  Fotodokumentation**, Summen und Unterschriftszeilen; Archiv speichert Karte + Fotos mit
  (mit Speicher-Fallback: bei vollem localStorage werden Bilder im Archiv weggelassen)
- **Konfigurierbar/mandantenfähig (verkaufbar):** Name der Einheit (z. B. „UG-Weiden“) und
  Funkrufnamen-Präfixe je Organisation (FW „Florian“, BRK „RK“, POL „Donau“, THW „Heros“)
  in den Einstellungen änderbar
- **Kennungs-Schnelleingabe:** Ziffernblock, Komma/Punkt wird automatisch zu „/“ (40,1 → 40/1)
- **Einsatz-Export/-Import als JSON-Datei** (Tab Einsatz): Backup, Gerätewechsel,
  „Sync per USB-Stick“; Import ersetzt den aktiven Einsatz, Archiv/Einstellungen bleiben
- **Feature-Backlog für die echte App:** Einsatz-Zeitstrahl, Übungsmodus (Wasserzeichen),
  Übergabe-Bericht für Ablösung, Lagebesprechungs-Gong am Monitor, Stärke-Verlaufskurve,
  Wappen-Upload, QR-Codes an Fahrzeugen, namentliche Besatzung, Archiv-Statistik
- **Splashscreen** mit Programmtitel und Einheitsname, leitet nach 5 s weiter
- **Technik wie `ffhome`:** Astro, statisch, GitHub Pages, GitHub-Actions-Deploy —
  aber eigenes, unabhängiges Projekt/Repo

## Architektur

### Offline-Fähigkeit: PWA (Progressive Web App)

- Statische Seite auf GitHub Pages, wie ffhome
- Service Worker cached die komplette App → läuft nach dem ersten Besuch **ohne Internet**
- Auf dem Tablet als App installierbar ("Zum Home-Bildschirm hinzufügen"), Vollbild
- Erfasste Daten liegen lokal in **IndexedDB** auf jedem Gerät (local-first)
- Wichtig: **Daten liegen nie im (öffentlichen) Repo** – GitHub Pages liefert nur den App-Code

### Sync (der einzige Punkt, den GitHub Pages nicht kann)

**Umgesetzt (v1, 20.07.2026):** `server/elwis-server.mjs` (null Abhängigkeiten, `npm run server`,
Port 8474) liefert die App im WLAN aus und führt Änderungen aller Geräte zusammen
(LWW je Datensatz per `_m`-Zeitstempel, Tombstones für Löschungen, Diff-basierte Erkennung
in der App gegen einen Sync-Snapshot in localStorage, Poll alle 3 s, kompakte Antwort bei
unverändertem Stand). Kopplung v1 = Tablets öffnen die angezeigte Server-URL (QR folgt).
Neuer Einsatz (`einsatzId` + `einsatzStart`) ersetzt serverseitig den alten.

**Ursprüngliches Konzept:** Szenario ist meist „ELW-Rechner + 1 Tablet
unterwegs, Rückkehr ins gleiche WLAN“.

- **Kern: lokaler Serverteil im ELW** – kleines Node-Programm (~100–200 Zeilen:
  Änderungsliste entgegennehmen, JSON-Datei, WebSocket-Verteilung an alle Clients),
  läuft auf dem Rechner, der ohnehin den Monitor zeigt; Autostart. Komplett autark,
  kein Internet nötig.
- **Kopplung:** ELW legt Einsatz an → QR-Code/Einsatz-Code am Monitor → Tablet scannt
  einmal „Einsatz beitreten“; danach automatischer Abgleich (Offline-Queue push/pull,
  UUID + Zeitstempel je Datensatz, last-write-wins).
- **Mixed-Content-Detail:** https (GitHub Pages) darf nicht zu http (LAN) verbinden →
  der ELW-Serverteil liefert die App im Einsatz selbst aus (z. B. http://elw:8080);
  GitHub Pages dient für Installation/Updates außerhalb des Einsatzes.
- **Später optional: Supabase als zweites Sync-Ziel** (gehostete DB mit Realtime,
  Free-Tier, EU-Region) – gleiche Sync-Logik, andere URL → hybrid: Sync auch über LTE
  unterwegs, Monitor extern; Abwägung: Internetpflicht + Cloud-Datenschutz (Behörden).
- **Echtzeit-Sync vom Feld (Tablet am iPhone-Hotspot, ELW mit LTE) – Optionen (offen,
  Stand 20.07.2026):** Ohne Treffpunkt im Internet nicht möglich (getrennte Netze, LTE-NAT).
  1. **Tailscale-VPN (Favorit):** beide Geräte im Overlay-Netz, vorhandener Server
     funktioniert unverändert über die Tailscale-Adresse; ~1 h Aufwand, kostenlos, E2E.
  2. **ELWIS-Server auf Mini-VPS** (https + Zugangs-Token nötig, ~½ Tag Entwicklung).
  3. **Supabase-Adapter** (~1–2 Tage) – der richtige Weg fürs Verkaufsprodukt.
- PouchDB/CouchDB bleibt als Alternative notiert, ist für 2 Geräte aber überdimensioniert.

### Konfliktfreiheit bei mehreren Erfassern

- Jede Einheit/jedes Fahrzeug = eigener Datensatz (UUID)
- Verschiedene Erfasser bearbeiten i. d. R. verschiedene Fahrzeuge → kein Konflikt
- Bei echtem Konflikt: letzte Änderung gewinnt (Zeitstempel), CouchDB-Revisionen als Absicherung

## Datenmodell (Entwurf)

```
Einsatz:  id, stichwort, ort, beginn (Alarmzeit), einsatzleiter, bemerkung, status
Einheit:  id, einsatzId, organisation (FW|BRK|POL|THW|SON), funkrufname,
          staerke {fuehrer, unterfuehrer, mannschaft}, agt,
          ankunft, abgerueckt, bemerkung, geaendertAm, geaendertVon
```

Summen (Monitor): Gesamtstärke f/u/m/g, AGT gesamt, Einheiten je Organisation.

## Module / Ausbaustufen

1. **MVP:** Einsatz anlegen, Kräfte erfassen (offline, IndexedDB), Monitor-Sicht lokal
2. **Sync:** PouchDB/CouchDB-Replikation (erst eine Variante, dann hybrid)
3. **Multi-Device live:** mehrere Tablets + Monitor im ELW, Changes-Feed
4. **Export:** PDF/CSV für den Einsatzbericht
5. **Lagekarte:** im Prototyp bereits als taktische Skizze umgesetzt (Symbole für
   EL/Brand/Gefahr/Wasser/V-Ablage/Text sowie **nummerierte Marker mit Legende**;
   **taktische Zeichen nach DV 102** über durchsuchbaren Katalog (17 gängigste Zeichen:
   Brandstufen als 1–3 Flammen = Klein-/Mittel-/Großbrand, Explosionsgefahr, Gefahrgut,
   Elektrizität, Einsturz, Hochwasser, Hydranten UF/ÜF, offenes Gewässer, Zisterne,
   Behandlungsplatz, Sammelplatz, Person vermisst, HLP, Dekon);
   **Fahrzeuge nur als Auto-Symbol** auf der Karte, Zuordnung zur erfassten Einheit über
   **Dropdown in der Legende am Rand** (Symbol färbt sich nach Organisation);
   per Tipp platzieren und verschieben,
   **Linien und Flächen zeichnen** (Punkte antippen → Fertig; 4 Farben, z. B. Blau =
   Schlauchleitung, Grün = Abschnitt), Foto/Lageplan als Hintergrund,
   **Zoom 100–400 % mit Pan**, **Großansicht/Vollbild**,
   **Snapshots** = eingefrorene Lagebilder je Lagebesprechung (aus der Besprechung heraus
   einfrierbar und mit dem Protokoll verknüpft), Karte entwickelt sich weiter;
   **Lagekarte rotiert als eigene Seite auf dem Einsatzmonitor** mit (inkl. Legende).
   **Fahrzeugkatalog:** Fuhrpark der FF Weiden (von der Website übernommen, 22 Fahrzeuge
   inkl. Ortsteil-/Nachbarwehren) als Dropdown im Erfassungsdialog – füllt Rufname,
   Kennung, Stärke und AGT vor; im Endausbau je Mandant pflegbar.
   **Kartenhintergrund-Ausbaustufen (BayernAtlas):**
   1. Sofort: Screenshot aus dem BayernAtlas als Hintergrundbild einfügen (geht schon)
   2. Echte App: Leaflet mit TopPlusOpen (BKG, frei) als Grundkarte + bayerische
      DOP40-Luftbilder (OpenData CC BY 4.0, WMS/WMTS der Bayer. Vermessungsverwaltung)
      als Ebene; Quellenvermerk erforderlich
   3. Offline: Kacheln fürs Schutzgebiet vorab im Feuerwehrhaus herunterladen und in
      Cache/IndexedDB speichern → Karte funktioniert an der Einsatzstelle ohne Internet
   Kartendaten nie ins Repo (Lizenz/Größe) – Laufzeit-Laden + lokaler Cache.

## UI-Prototyp

Klickbarer Prototyp (Artefakt): https://claude.ai/code/artifact/b654c169-a260-46b4-b777-fdc248cd0dfd

- Drei Ansichten: **Einsatz** (Stammdaten) · **Kräfte** (Erfassung) · **Monitor** (dunkler Vollbild-Screen)
- Organisationsfarben nach taktischen Zeichen (FW rot, BRK gold, POL grün, THW blau),
  für Hell-/Dunkelmodus farbfehlsicht-validiert; Farbe nie ohne Textlabel
- Stärke-Eingabe über große Stepper (handschuhtauglich, ≥48 px Touch-Ziele)
- Sync-Simulation über "ELW-WLAN"-Schalter im Kopf (Offline-Zähler → Synchronisieren)
- Daten nur in localStorage – reiner UI-Prototyp, noch kein echter Sync
