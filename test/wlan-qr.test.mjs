/* WLAN-QR-Text (Zugang-Kachel im Monitor) – Format nach dem Standard "WIFI:T:…;S:…;P:…;;". */
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { ladeFunktionen } from "./_ausquelle.mjs";

const APP = fileURLToPath(new URL("../public/app.js", import.meta.url));
const { wlanQrText } = ladeFunktionen(APP, ["wlanQrText"]);

test("WPA mit Passwort", () => {
  assert.equal(wlanQrText("ELW-Einsatz", "geheim123"), "WIFI:T:WPA;S:ELW-Einsatz;P:geheim123;;");
});
test("offenes Netz ohne Passwort", () => {
  assert.equal(wlanQrText("Offen", ""), "WIFI:T:nopass;S:Offen;;");
});
test("Sonderzeichen \\ ; , : \" werden maskiert", () => {
  assert.equal(wlanQrText('a;b', 'p:w,"x\\y'), 'WIFI:T:WPA;S:a\\;b;P:p\\:w\\,\\"x\\\\y;;');
});
