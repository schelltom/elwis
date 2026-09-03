# LOTSE112 – Freigabe-Relay (Cloudflare Worker)

Zustandsloser JSON-Relay für den Freigabe-Link. Der ELW-Server pusht im Takt den
aktuellen Einsatz-Snapshot hierher, die Freigabe-Ansicht der App holt ihn per
`GET /snap/:viewToken` (mit dem telefonisch durchgegebenen 6-stelligen Code als
`X-Freigabe-Pin`-Header). Details: `../SYNC-ARCHITEKTUR.md`.

## Routen

| Methode | Pfad | Aufrufer | Zweck |
|---|---|---|---|
| `POST` | `/push/:pushToken` | ELW-Server | Snapshot + Meta in KV, TTL bei jedem Push erneuert |
| `GET`  | `/snap/:viewToken` | Browser | Snapshot holen; PIN via `X-Freigabe-Pin` (oder `?pin=`) |
| `GET`  | `/` | – | Klartext-Hinweis |
| `OPTIONS` | `*` | Browser | CORS-Preflight |

## Lokal testen (kein Cloudflare-Konto nötig)

```bash
cd worker
npx wrangler dev            # Miniflare auf http://127.0.0.1:8787
```

`.dev.vars` (nicht eingecheckt) kann `MAX_BYTES` klein setzen, um den 413-Pfad zu testen:

```
MAX_BYTES = 2000
```

Unit-Tests (laufen auch in der CI mit):

```bash
npm test                    # vom Repo-Wurzelverzeichnis – schließt worker/test/ ein
# oder gezielt:
node --test "worker/test/*.test.mjs"
```

Manueller Durchstich gegen `wrangler dev`:

```bash
PIN=K3Q9R7
PINHASH=$(node -e "crypto.subtle.digest('SHA-256',new TextEncoder().encode('$PIN')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))")

curl -sS -X POST http://127.0.0.1:8787/push/geheim \
  -H 'Content-Type: application/json' \
  -d "{\"viewToken\":\"vt1\",\"pinHash\":\"$PINHASH\",\"relayTtlMin\":120,\"sessionTtlMin\":60,\"pollS\":60,\"data\":{\"elwis\":1,\"einsatz\":{\"stichwort\":\"B2\"},\"lage\":{\"items\":[],\"bg\":\"\"}}}"

curl -sS http://127.0.0.1:8787/snap/vt1 -H "X-Freigabe-Pin: $PIN" | head -c 400
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/snap/vt1          # 401 (kein PIN)
```

## Deployen (Cloudflare-Konto)

```bash
cd worker
npx wrangler login                              # einmalig – echtes Terminal, öffnet den Browser
npx wrangler kv namespace create FREIGABE       # gibt die "id" aus
npx wrangler kv namespace create FREIGABE --preview   # gibt die "preview_id" aus
```

Die beiden IDs in `wrangler.toml` unter `[[kv_namespaces]]` eintragen (Platzhalter ersetzen),
dann:

```bash
npx wrangler deploy
```

Aktuell deployt: **`https://freigabe.lotse112el.workers.dev/`**. Die URL kommt an zwei Stellen:

1. **`public/app.js`** → Konstante `FREIGABE_RELAY_DEFAULT` (schon eingetragen; bei einer
   neuen URL kleiner Folge-Commit, wird beim nächsten GitHub-Pages-Build aktiv).
2. **ELW-Server** → Env-Var `EL_FREIGABE_URL` (auf dem NAS im Startskript gesetzt), z. B.
   `EL_FREIGABE_URL=https://freigabe.lotse112el.workers.dev/`.

## Kosten & Limits (Free-Plan)

Bleibt vollständig im kostenlosen Rahmen:

| Free-Limit | Verbrauch |
|---|---|
| Worker: 100.000 Requests/Tag | 1 Push alle 30 min = 48/Tag + Viewer-Polls (alle 5 min je Betrachter = 288/Tag) |
| KV: **1.000 Writes/Tag** | 1 Push = 1 Write ⇒ 48/Tag. Der Push-Takt ist im Server hart auf ≥ 300 s geklemmt, damit das nie kippt. |
| KV: 100.000 Reads/Tag | 1 Poll = 1 Read |
| KV: 1 GB Speicher | ein Snapshot, wenige MB |

## Rate-Limiting / Brute-Force

**Kein zusätzlicher Schritt nötig.** WAF-Rate-Limiting-Regeln gibt es nur für eigene
Zonen (Domains) – **nicht** für eine `*.workers.dev`-URL. Braucht es hier aber auch nicht:
der 6-Zeichen-Code (Alphabet ohne Verwechsler, ~7·10⁸ Kombinationen) ist über das Netz
nicht durchprobierbar, und schon das 100.000-Requests/Tag-Limit des Free-Plans deckelt
Rateversuche auf < 0,02 % des Schlüsselraums pro Tag – der Link lebt nur Stunden.

Wer später doch einen expliziten Riegel will: die **Workers Rate Limiting API**
(`[[ratelimits]]`-Binding, in-Worker, ohne KV-Writes) auf den `/snap/`-Pfad legen.

## Debugging

```bash
npx wrangler tail                               # Live-Logs des deployten Workers
npx wrangler kv key list --binding FREIGABE --remote
npx wrangler kv key get --binding FREIGABE "view:<viewToken>" --remote
npx wrangler kv key delete --binding FREIGABE "view:<viewToken>" --remote   # Link sofort killen
```
