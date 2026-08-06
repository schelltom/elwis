#!/bin/sh
# ================================================================
#  ELWIS Sync-Server auf einem Synology-NAS starten
#  ----------------------------------------------------------------
#  Gedacht für: Systemsteuerung -> Aufgabenplaner
#               -> Ausgeloeste Aufgabe -> "beim Hochfahren"
#               -> Benutzer: root
#               -> Befehl: sh /volume1/elwis/server/start-synology.sh
#
#  Der ELWIS-Server holt die App selbst per Auto-Mirror von GitHub
#  (einmal Internet noetig), danach laeuft er auch offline weiter.
#  Daten + Backups landen neben diesem Skript (server/).
# ================================================================

# --- Wo liegt der Server?  (findet sich selbst, egal wo das Skript liegt) ---
HIER=$(cd "$(dirname "$0")" && pwd)   # .../server
SERVER="$HIER/elwis-server.mjs"
LOG="$HIER/elwis-server.log"

# --- Node aus dem installierten Node.js-Paket finden (Version egal) ---
NODE=$(ls -d /var/packages/Node.js*/target/usr/local/bin/node 2>/dev/null | sort -V | tail -1)
[ -x "$NODE" ] || NODE=$(command -v node)

if [ -z "$NODE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S')  FEHLER: Node.js nicht gefunden. Bitte im Package Center installieren." >> "$LOG"
  exit 1
fi

echo "$(date '+%Y-%m-%d %H:%M:%S')  Starte ELWIS-Server mit $NODE" >> "$LOG"

# exec: der Server ersetzt dieses Skript und laeuft dauerhaft weiter.
exec "$NODE" "$SERVER" >> "$LOG" 2>&1
