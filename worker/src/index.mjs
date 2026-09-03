/* ================================================================
   LOTSE112 – Freigabe-Relay (Cloudflare Worker)
   ----------------------------------------------------------------
   Zustandsloser JSON-Relay mit genau zwei Datenrouten:

     POST /push/:pushToken   – nur vom ELW-Server. Legt den aktuellen
                               Einsatz-Snapshot in KV (view:<viewToken>),
                               TTL bei jedem Push erneuert.
     GET  /snap/:viewToken   – nur vom Browser (die Freigabe-Ansicht der
                               App). Verlangt den 6-stelligen Code als
                               Header  X-Freigabe-Pin  (oder ?pin= für curl).

   Sicherheit:
   - pushToken (Geheimnis) steckt im Pfad, geht nie in den Link.
   - Beim ersten Push bindet der Worker sha256(pushToken) an den Eintrag
     (TOFU). Späterer Push mit anderem pushToken → 403.
   - Der PIN wird server-seitig geprüft (sha256), falsch/fehlt → 401.
   - CORS nur auf den Browser-Routen (GET/OPTIONS).
   ================================================================ */

const ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-Freigabe-Pin, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(obj, status = 200, cors = false) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(cors ? ORIGIN_HEADERS : {}),
    },
  });
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function clamp(wert, min, max, fallback) {
  const n = Number(wert);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname: path } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: ORIGIN_HEADERS });
    }

    // ---- POST /push/:pushToken ------------------------------------
    if (method === "POST" && path.startsWith("/push/")) {
      const pushToken = decodeURIComponent(path.slice("/push/".length));
      if (!pushToken) return json({ fehler: "kein_push_token" }, 400);

      const raw = await request.text();
      const maxBytes = Number(env.MAX_BYTES) || 25165824;
      if (raw.length > maxBytes) {
        return json({ fehler: "zu_gross", maxBytes, receivedBytes: raw.length }, 413);
      }

      let body;
      try { body = JSON.parse(raw); } catch { return json({ fehler: "ungueltiges_json" }, 400); }

      const viewToken = String(body.viewToken || "");
      if (!viewToken || !body.pinHash || !body.data || body.data.elwis !== 1) {
        return json({ fehler: "ungueltige_nutzlast" }, 400);
      }

      const relayTtlMin   = clamp(body.relayTtlMin,   60, 10080, 120);
      const sessionTtlMin = clamp(body.sessionTtlMin, 10,  1440,  60);
      const pollS         = clamp(body.pollS,         20,  3600,  60);

      const key = "view:" + viewToken;
      const pushHash = await sha256Hex(pushToken);
      const existing = await env.FREIGABE.get(key, "json");
      if (existing && existing.pushHash !== pushHash) {
        return json({ fehler: "token_konflikt" }, 403);
      }

      await env.FREIGABE.put(
        key,
        JSON.stringify({
          pushHash,
          pinHash: String(body.pinHash),
          updatedAt: new Date().toISOString(),
          relayTtlMin, sessionTtlMin, pollS,
          data: body.data,
        }),
        { expirationTtl: relayTtlMin * 60 },
      );
      return json({ ok: true, relayTtlMin }, 200);
    }

    // ---- GET /snap/:viewToken -----------------------------------
    if (method === "GET" && path.startsWith("/snap/")) {
      const viewToken = decodeURIComponent(path.slice("/snap/".length));
      const rec = viewToken ? await env.FREIGABE.get("view:" + viewToken, "json") : null;
      // Nicht gefunden und TTL-abgelaufen sind bewusst nicht unterscheidbar.
      if (!rec) return json({ fehler: "nicht_gefunden" }, 404, true);

      const pin = (request.headers.get("X-Freigabe-Pin") || url.searchParams.get("pin") || "")
        .trim().toUpperCase();
      if (!pin || (await sha256Hex(pin)) !== rec.pinHash) {
        return json({ fehler: "pin" }, 401, true);
      }

      return json({
        ...rec.data,
        _freigabe: {
          empfangenAmRelay: rec.updatedAt,
          sessionTtlMin: rec.sessionTtlMin,
          pollS: rec.pollS,
        },
      }, 200, true);
    }

    // ---- GET / -------------------------------------------------
    if (method === "GET" && path === "/") {
      return new Response(
        "LOTSE112 Freigabe-Relay. Kein öffentlicher Endpunkt – Zugang nur über einen " +
        "Freigabe-Link der Einsatzleitung.\n",
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }

    return json({ fehler: "unbekannte_route" }, 404);
  },
};
