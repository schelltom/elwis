/* Tests für den Freigabe-Relay-Worker – node --test, keine Abhängigkeiten.
   crypto.subtle ist in Node 22 global vorhanden, sha256Hex läuft also 1:1. */
import { test } from "node:test";
import assert from "node:assert/strict";
import handler, { clamp, sha256Hex } from "../src/index.mjs";

/* Mini-KV: nur get(json) / put(mit expirationTtl). */
function fakeKV() {
  const m = new Map();
  return {
    _m: m,
    async get(key, typ) {
      const v = m.get(key);
      if (v === undefined) return null;
      return typ === "json" ? JSON.parse(v) : v;
    },
    async put(key, val, opts) { m.set(key, val); m.set(key + "::opts", opts); },
  };
}
const ENV = (kv) => ({ FREIGABE: kv, MAX_BYTES: 25165824 });

const gueltigeDaten = { elwis: 1, einsatz: { stichwort: "B2" }, lage: { items: [], bg: "" } };

async function push(kv, pushToken, body) {
  return handler.fetch(new Request("https://r/push/" + pushToken, {
    method: "POST", body: JSON.stringify(body),
  }), ENV(kv));
}
async function snap(kv, viewToken, pin) {
  return handler.fetch(new Request("https://r/snap/" + viewToken, {
    method: "GET", headers: pin ? { "X-Freigabe-Pin": pin } : {},
  }), ENV(kv));
}

test("clamp: Grenzen, Rundung, Fallback", () => {
  assert.equal(clamp(50, 60, 100, 70), 60);
  assert.equal(clamp(200, 60, 100, 70), 100);
  assert.equal(clamp("83.6", 60, 100, 70), 84);
  assert.equal(clamp(undefined, 60, 100, 70), 70);
  assert.equal(clamp("abc", 60, 100, 70), 70);
});

test("Push + Snap: kompletter Kreislauf mit korrektem PIN", async () => {
  const kv = fakeKV();
  const pinHash = await sha256Hex("K3Q9R7");
  const r1 = await push(kv, "geheim", {
    viewToken: "vt1", pinHash, relayTtlMin: 120, sessionTtlMin: 60, pollS: 60, data: gueltigeDaten,
  });
  assert.equal(r1.status, 200);
  assert.equal(kv._m.get("view:vt1::opts").expirationTtl, 120 * 60);

  const r2 = await snap(kv, "vt1", "k3q9r7"); // case-insensitive
  assert.equal(r2.status, 200);
  const d = await r2.json();
  assert.equal(d.einsatz.stichwort, "B2");
  assert.equal(d._freigabe.sessionTtlMin, 60);
  assert.equal(r2.headers.get("Access-Control-Allow-Origin"), "*");
});

test("Snap ohne PIN → 401", async () => {
  const kv = fakeKV();
  await push(kv, "geheim", { viewToken: "vt1", pinHash: await sha256Hex("ABCDEF"), data: gueltigeDaten });
  const r = await snap(kv, "vt1", null);
  assert.equal(r.status, 401);
  assert.equal((await r.json()).fehler, "pin");
});

test("Snap mit falschem PIN → 401", async () => {
  const kv = fakeKV();
  await push(kv, "geheim", { viewToken: "vt1", pinHash: await sha256Hex("ABCDEF"), data: gueltigeDaten });
  const r = await snap(kv, "vt1", "ZZZZZZ");
  assert.equal(r.status, 401);
});

test("Snap auf unbekannten viewToken → 404 (nicht von TTL-Ablauf unterscheidbar)", async () => {
  const r = await snap(fakeKV(), "gibtsnicht", "ABCDEF");
  assert.equal(r.status, 404);
});

test("Zweiter Push mit anderem pushToken → 403 (TOFU-Bindung)", async () => {
  const kv = fakeKV();
  const pinHash = await sha256Hex("ABCDEF");
  assert.equal((await push(kv, "erster", { viewToken: "vt1", pinHash, data: gueltigeDaten })).status, 200);
  assert.equal((await push(kv, "anderer", { viewToken: "vt1", pinHash, data: gueltigeDaten })).status, 403);
  assert.equal((await push(kv, "erster", { viewToken: "vt1", pinHash, data: gueltigeDaten })).status, 200);
});

test("Push zu groß → 413", async () => {
  const kv = fakeKV();
  const env = { FREIGABE: kv, MAX_BYTES: 50 };
  const r = await handler.fetch(new Request("https://r/push/geheim", {
    method: "POST",
    body: JSON.stringify({ viewToken: "vt1", pinHash: "x".repeat(64), data: gueltigeDaten }),
  }), env);
  assert.equal(r.status, 413);
  assert.equal((await r.json()).fehler, "zu_gross");
});

test("Push ohne pinHash / ohne data / falsches elwis → 400", async () => {
  const kv = fakeKV();
  assert.equal((await push(kv, "g", { viewToken: "vt1", data: gueltigeDaten })).status, 400);
  assert.equal((await push(kv, "g", { viewToken: "vt1", pinHash: "x" })).status, 400);
  assert.equal((await push(kv, "g", { viewToken: "vt1", pinHash: "x", data: { elwis: 0 } })).status, 400);
});

test("Relay-TTL wird geklemmt (unter 60 min → 60, über 7 d → 7 d)", async () => {
  const kv = fakeKV();
  const pinHash = await sha256Hex("ABCDEF");
  await push(kv, "g", { viewToken: "a", pinHash, relayTtlMin: 5, data: gueltigeDaten });
  assert.equal(kv._m.get("view:a::opts").expirationTtl, 60 * 60);
  await push(kv, "g", { viewToken: "b", pinHash, relayTtlMin: 999999, data: gueltigeDaten });
  assert.equal(kv._m.get("view:b::opts").expirationTtl, 10080 * 60);
});

test("OPTIONS → 204 mit CORS-Headern", async () => {
  const r = await handler.fetch(new Request("https://r/snap/x", { method: "OPTIONS" }), ENV(fakeKV()));
  assert.equal(r.status, 204);
  assert.equal(r.headers.get("Access-Control-Allow-Headers").includes("X-Freigabe-Pin"), true);
});
