#!/bin/sh
# ================================================================
#  LOTSE112 Sync-Server auf einem Synology-NAS starten
#  ----------------------------------------------------------------
#  Gedacht für: Systemsteuerung -> Aufgabenplaner
#               -> Ausgeloeste Aufgabe -> "beim Hochfahren"
#               -> Benutzer: root
#               -> Befehl: sh /volume1/elwis/server/start-synology.sh
#
#  Der LOTSE112-Server holt die App selbst per Auto-Mirror von GitHub
#  (einmal Internet noetig), danach laeuft er auch offline weiter.
#  Daten + Backups landen neben diesem Skript (server/).
# ================================================================

# --- Wo liegt der Server?  (findet sich selbst, egal wo das Skript liegt) ---
HIER=$(cd "$(dirname "$0")" && pwd)   # .../server
SERVER="$HIER/lotse112-server.mjs"
LOG="$HIER/lotse112-server.log"

# --- Node aus dem installierten Node.js-Paket finden (Version egal) ---
NODE=$(ls -d /var/packages/Node.js*/target/usr/local/bin/node 2>/dev/null | sort -V | tail -1)
[ -x "$NODE" ] || NODE=$(command -v node)

if [ -z "$NODE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S')  FEHLER: Node.js nicht gefunden. Bitte im Package Center installieren." >> "$LOG"
  exit 1
fi

echo "$(date '+%Y-%m-%d %H:%M:%S')  Starte LOTSE112-Server mit $NODE" >> "$LOG"

# ================================================================
#  Optional: Freigabe-Link (externe Sicht, z. B. FueGK)
#  ----------------------------------------------------------------
#  Aus, solange EL_FREIGABE_URL leer bleibt. Zum Aktivieren die
#  folgenden Zeilen einkommentieren (fuehrendes #  entfernen).
#  Der Link selbst wird spaeter in der App unter Zahnrad ->
#  "Freigabe-Link" erzeugt; hier steht nur, WOHIN der Server pusht.
# ================================================================
# EL_FREIGABE_URL="https://freigabe.lotse112el.workers.dev/"
# EL_FREIGABE_PUSH_S=1800        # Push-Takt in Sekunden (Default 1800 = 30 min; Minimum 300)
# EL_FREIGABE_TTL_MIN=60         # Link laeuft so viele Minuten nach dem letzten Push ab
# EL_FREIGABE_SESSION_MIN=120    # offene Ansicht sperrt sich nach so vielen Minuten ohne neuen Stand
# EL_FREIGABE_POLL_S=300         # wie oft die Ansicht auf Neues prueft
# export EL_FREIGABE_URL EL_FREIGABE_PUSH_S EL_FREIGABE_TTL_MIN EL_FREIGABE_SESSION_MIN EL_FREIGABE_POLL_S

# exec: der Server ersetzt dieses Skript und laeuft dauerhaft weiter.
exec "$NODE" "$SERVER" >> "$LOG" 2>&1
