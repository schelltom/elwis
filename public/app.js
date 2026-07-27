"use strict";

/* ---------------- Datenmodell ---------------- */
const ORGS = {
  FW:  { short:"FW",  label:"Feuerwehr", cssVar:"--fw"  },
  BRK: { short:"BRK", label:"BRK / RD",  cssVar:"--brk" },
  POL: { short:"POL", label:"Polizei",   cssVar:"--pol" },
  THW: { short:"THW", label:"THW",       cssVar:"--thw" },
  SON: { short:"SON", label:"Sonstige",  cssVar:"--son" },
};
/* Fahrzeugkatalog – übernommen vom Fuhrpark der FF Weiden (schelltom.github.io/feuerwehrweiden/fuhrpark).
   Stärke/AGT sind typische Vorbelegungen je Fahrzeugtyp und werden bei der Erfassung angepasst.
   Im Endausbau je Mandant in den Einstellungen pflegbar. */
const FZG_KATALOG = [
  { grp:"Einsatzleitwagen", typ:"KdoW",          name:"Florian Weiden", kennung:"1/10/1", f:1,u:0,m:1, agt:0 },
  { grp:"Einsatzleitwagen", typ:"KdoW 2",        name:"Florian Weiden", kennung:"1/10/2", f:1,u:0,m:1, agt:0 },
  { grp:"Einsatzleitwagen", typ:"ELW 1,5",       name:"Kater Weiden",   kennung:"1/12/1", f:0,u:1,m:2, agt:0 },
  { grp:"Löschfahrzeuge",   typ:"HLF 20",        name:"Florian Weiden", kennung:"1/40/1", f:0,u:1,m:8, agt:4 },
  { grp:"Löschfahrzeuge",   typ:"LF 16-TS",      name:"Florian Weiden", kennung:"1/48/1", f:0,u:1,m:8, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TLF 20/40-SL",  name:"Florian Weiden", kennung:"1/23/1", f:0,u:1,m:2, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TSF-W",         name:"Florian Frauenricht",   kennung:"46/1", f:0,u:1,m:5, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TSF-W",         name:"Florian Mallersricht",  kennung:"46/1", f:0,u:1,m:5, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TSF-W",         name:"Florian Muglhof",       kennung:"46/1", f:0,u:1,m:5, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"HLF 20",        name:"Florian Neunkirchen",   kennung:"40/1", f:0,u:1,m:8, agt:4 },
  { grp:"Löschfahrzeuge",   typ:"LF 20",         name:"Florian Rothenstadt",   kennung:"41/1", f:0,u:1,m:8, agt:4 },
  { grp:"Hubrettung",       typ:"DLAK M32 L-AT", name:"Florian Weiden", kennung:"1/30/1", f:0,u:1,m:1, agt:0 },
  { grp:"Hubrettung",       typ:"DLK 23/12",     name:"Florian Weiden", kennung:"2/30/1", f:0,u:1,m:1, agt:0 },
  { grp:"Rüst-/Gerätewagen",typ:"RW 3",          name:"Florian Weiden", kennung:"1/61/1", f:0,u:1,m:2, agt:2 },
  { grp:"Rüst-/Gerätewagen",typ:"GW-Logistik",   name:"Florian Weiden", kennung:"1/55/1", f:0,u:1,m:2, agt:0 },
  { grp:"Rüst-/Gerätewagen",typ:"GW-Gefahrgut",  name:"Florian Weiden", kennung:"2/52/1", f:0,u:1,m:2, agt:2 },
  { grp:"Rüst-/Gerätewagen",typ:"GW-Strom",      name:"Florian Weiden", kennung:"2/56/1", f:0,u:1,m:2, agt:0 },
  { grp:"Sonstige",         typ:"Dekon-P",       name:"Florian Weiden", kennung:"2/97/1", f:0,u:1,m:5, agt:0 },
  { grp:"Sonstige",         typ:"SW 2000",       name:"Florian Weiden", kennung:"2/58/1", f:0,u:1,m:2, agt:0 },
  { grp:"Sonstige",         typ:"MZF",           name:"Florian Weiden", kennung:"1/11/1", f:1,u:1,m:1, agt:0 },
  { grp:"Sonstige",         typ:"MZF",           name:"Florian Neunkirchen",  kennung:"1/11/1", f:1,u:1,m:1, agt:0 },
  { grp:"Sonstige",         typ:"MTW",           name:"Florian Rothenstadt",  kennung:"14/1",   f:0,u:1,m:5, agt:0 },
];
/* Fahrzeugkatalog: Anzeige-Label = Name + Kennung (z. B. „Florian Weiden 1/55/1") */
function katalogLabel(k){
  return [k.name, k.kennung].filter(Boolean).join(" ");
}
// Flache, alphabetisch sortierte Liste (ohne Fahrzeugart/-typ)
function katalogListe(){
  return (state.config.katalog || []).map((k,i) => ({...k, _i:i}))
    .sort((a,b) => katalogLabel(a).localeCompare(katalogLabel(b), "de"));
}
function katalogGruppen(){
  const kat = (state.config.katalog || []).map((k,i) => ({...k, _i:i}));
  const grps = [...new Set(kat.map(k => k.grp || "Weitere Fahrzeuge"))].sort((a,b) => a.localeCompare(b, "de"));
  return grps.map(g => ({ grp:g,
    items: kat.filter(k => (k.grp||"Weitere Fahrzeuge") === g)
      .sort((a,b) => katalogLabel(a).localeCompare(katalogLabel(b), "de")) }));
}
function katalogHinzufuegen(u){
  const kat = state.config.katalog || (state.config.katalog = []);
  const norm = s => (s||"").trim().toLowerCase();
  const da = kat.some(k => (k.org||"FW") === u.org && norm(k.name) === norm(u.name) && norm(k.kennung) === norm(u.kennung));
  if(da || (!u.name && !u.kennung)) return;
  kat.push({ grp:"Weitere Fahrzeuge", typ:"", name:u.name, kennung:u.kennung,
    f:u.f|0, u:u.u|0, m:u.m|0, agt:u.agt|0, csa:u.csa|0, org:u.org });
}
/* Einsatzstichwort-Katalog – Vorbelegung nach ILS-Systematik (Brand / THL / ABC).
   Beim ersten Start in die Einstellungen übernommen, danach frei erweiterbar und löschbar.
   Weitere Stammdaten (z. B. eigene Stichwörter) lassen sich unter Einstellungen ergänzen. */
const STICHWORT_KATALOG = [
  // Brand – lfd. Nr. 25–75 (ab B3; kleinere Brände sind für die Führungsunterstützung nicht relevant)
  { kat:"Brand", nr:25, text:"B3 – am Gebäude" },
  { kat:"Brand", nr:26, text:"B3 – Brandgeruch" },
  { kat:"Brand", nr:27, text:"B3 – Dachstuhl" },
  { kat:"Brand", nr:28, text:"B3 – Dehnfuge" },
  { kat:"Brand", nr:29, text:"B3 – Garage" },
  { kat:"Brand", nr:30, text:"B3 – Keller" },
  { kat:"Brand", nr:31, text:"B3 – Rauchentwicklung" },
  { kat:"Brand", nr:32, text:"B3 – Zimmer" },
  { kat:"Brand", nr:33, text:"B3 – Berghütte" },
  { kat:"Brand", nr:34, text:"B3 – Fahrzeug / Maschine (Landwirtschaft)" },
  { kat:"Brand", nr:35, text:"B3 – LKW / Bus außerorts" },
  { kat:"Brand", nr:36, text:"B3 – LKW / Bus auf BAB" },
  { kat:"Brand", nr:37, text:"B3 – Alarmstufenerhöhung auf B 3" },
  { kat:"Brand", nr:38, text:"B3 – überhitzter Heustock" },
  { kat:"Brand", nr:39, text:"B 3 PERSON – Dachstuhl (Person in Gefahr)" },
  { kat:"Brand", nr:40, text:"B 3 PERSON – Garage (Person in Gefahr)" },
  { kat:"Brand", nr:41, text:"B 3 PERSON – Keller (Person in Gefahr)" },
  { kat:"Brand", nr:42, text:"B 3 PERSON – Rauchentwicklung (Person in Gefahr)" },
  { kat:"Brand", nr:43, text:"B 3 PERSON – Zimmer (Person in Gefahr)" },
  { kat:"Brand", nr:44, text:"B 3 PERSON – LKW (Person in Gefahr)" },
  { kat:"Brand", nr:45, text:"B 3 PERSON – LKW auf BAB (Person in Gefahr)" },
  { kat:"Brand", nr:46, text:"B 3 PERSON – Alarmstufenerhöhung auf B 3 Person" },
  { kat:"Brand", nr:47, text:"B4 – ausgedehnt / hoch bis 6. OG" },
  { kat:"Brand", nr:48, text:"B4 – Tiefgarage" },
  { kat:"Brand", nr:49, text:"B4 – Wohnheim" },
  { kat:"Brand", nr:50, text:"B4 – Behinderteneinrichtung" },
  { kat:"Brand", nr:51, text:"B4 – Hochhaus ab 7. OG" },
  { kat:"Brand", nr:52, text:"B4 – Supermarkt" },
  { kat:"Brand", nr:53, text:"B4 – Kindergarten" },
  { kat:"Brand", nr:54, text:"B4 – Kino" },
  { kat:"Brand", nr:55, text:"B4 – Kirche" },
  { kat:"Brand", nr:56, text:"B4 – Schule" },
  { kat:"Brand", nr:57, text:"B4 – Theater" },
  { kat:"Brand", nr:58, text:"B4 – Zirkus" },
  { kat:"Brand", nr:59, text:"B4 – Hotel" },
  { kat:"Brand", nr:60, text:"B4 – Sägewerk / Schreinerei" },
  { kat:"Brand", nr:61, text:"B4 – Lagerhalle" },
  { kat:"Brand", nr:62, text:"B4 – Silo (kein Gefahrstoff)" },
  { kat:"Brand", nr:63, text:"B4 – große Höhe – Turm" },
  { kat:"Brand", nr:64, text:"B4 – große Höhe – Windrad" },
  { kat:"Brand", nr:65, text:"B4 – Industriegebäude" },
  { kat:"Brand", nr:66, text:"B4 – Bauernhof" },
  { kat:"Brand", nr:67, text:"B4 – Stall / Scheune" },
  { kat:"Brand", nr:68, text:"B4 – Aussiedlerhof" },
  { kat:"Brand", nr:69, text:"B4 – Alarmstufenerhöhung auf B 4" },
  { kat:"Brand", nr:70, text:"B5 – Pflege-/Altenheim" },
  { kat:"Brand", nr:71, text:"B5 – Kaufhaus" },
  { kat:"Brand", nr:72, text:"B5 – Krankenhaus" },
  { kat:"Brand", nr:73, text:"B5 – Alarmstufenerhöhung auf B 5" },
  { kat:"Brand", nr:74, text:"B6 – Alarmstufenerhöhung auf B 6" },
  { kat:"Brand", nr:75, text:"B7 – Alarmstufenerhöhung auf B 7" },
  // THL – lfd. Nr. 1–29 (Sondereinsätze) …
  { kat:"THL", nr:1,  text:"THL AMOK FW – Amoklage" },
  { kat:"THL", nr:2,  text:"THL BELEUCHTUNG – Einsatzstelle ausleuchten" },
  { kat:"THL", nr:3,  text:"THL BOMBENDROHUNG – Bombendrohung" },
  { kat:"THL", nr:4,  text:"THL BOMBENFUND – Bombenfund" },
  { kat:"THL", nr:5,  text:"THL ERKUNDUNG – Erkundung" },
  { kat:"THL", nr:6,  text:"THL FIRST RESPONDER – First Responder" },
  { kat:"THL", nr:7,  text:"THL GEBÄUDEEINSTURZ – Gebäude eingestürzt" },
  { kat:"THL", nr:8,  text:"THL GROSSTIERRETTUNG – Rettung Großtier (z. B. Kuh, Pferd)" },
  { kat:"THL", nr:9,  text:"THL HUBSCHRAUBERLANDUNG – Hubschrauberlandung sichern" },
  { kat:"THL", nr:10, text:"THL P AUFZUG – Aufzug öffnen akut" },
  { kat:"THL", nr:11, text:"THL P RETTUNG H / T – Person droht zu springen" },
  { kat:"THL", nr:12, text:"THL P RETTUNG H / T – Person absturzgefährdet" },
  { kat:"THL", nr:13, text:"THL P RETTUNG H / T – Person in Höhe" },
  { kat:"THL", nr:14, text:"THL P RETTUNG H / T – Person aus Tiefe / Schacht" },
  { kat:"THL", nr:15, text:"THL P RETTUNG H / T – schwergewichtiger Patient" },
  { kat:"THL", nr:16, text:"THL P RETTUNG H / T – Person auf Windrad / Kran" },
  { kat:"THL", nr:17, text:"THL P RETTUNG H / T – Paraglider / Fallschirmspringer / Drachenflieger abgestürzt" },
  { kat:"THL", nr:18, text:"THL P STRAßENBAHN – Person unter Straßenbahn" },
  { kat:"THL", nr:19, text:"THL P STRAßENBAHN – Straßenbahn" },
  { kat:"THL", nr:20, text:"THL P STROM – Person Stromunfall" },
  { kat:"THL", nr:21, text:"THL P U-BAHN – Person unter U-Bahn" },
  { kat:"THL", nr:22, text:"THL P VERSCHÜTTET – Person verschüttet / Tiefbauunfall" },
  { kat:"THL", nr:23, text:"THL P VERSCHÜTTET – Person in Silo" },
  { kat:"THL", nr:24, text:"THL P EINGESCHLOSSEN – Wohnung öffnen akut" },
  { kat:"THL", nr:25, text:"THL P EINGESCHLOSSEN – Fahrzeug öffnen akut" },
  { kat:"THL", nr:26, text:"THL P ZUG – Person unter Zug" },
  { kat:"THL", nr:27, text:"THL P ZUG – Person unter S-Bahn" },
  { kat:"THL", nr:28, text:"THL P ZUG – Person vom Zug erfasst" },
  { kat:"THL", nr:29, text:"THL RETTUNGSKORB – Drehleiter" },
  // … und lfd. Nr. 55–90 (THL 3/4/5, Schiene, Wasser, Tragehilfe, Unwetter)
  { kat:"THL", nr:55, text:"THL 3 – Person eingeklemmt (nicht VU)" },
  { kat:"THL", nr:56, text:"THL 3 – 1 oder 2 PKW, Person eingeklemmt" },
  { kat:"THL", nr:57, text:"THL 3 – Bus (besetzt)" },
  { kat:"THL", nr:58, text:"THL 3 – Gerüst umgestürzt" },
  { kat:"THL", nr:59, text:"THL 3 – Stromleitungsmast umgestürzt" },
  { kat:"THL", nr:60, text:"THL 3 – Kran umgestürzt" },
  { kat:"THL", nr:61, text:"THL 3 – Waldunfall mit eingeklemmter Person" },
  { kat:"THL", nr:62, text:"THL 4 – mehrere PKW, Personen eingeklemmt" },
  { kat:"THL", nr:63, text:"THL 4 – LKW / Bus (leer), Person eingeklemmt" },
  { kat:"THL", nr:64, text:"THL 5 – Massenkarambolage, Personen eingeklemmt" },
  { kat:"THL", nr:65, text:"THL 5 – Bus besetzt mit eingeklemmten Personen" },
  { kat:"THL", nr:66, text:"THL 5 – mehrere LKW mit eingeklemmten Personen" },
  { kat:"THL", nr:67, text:"THL SCHIENE – Hilfeleistung Straßenbahn" },
  { kat:"THL", nr:68, text:"THL SCHIENE – Hilfeleistung S-Bahn" },
  { kat:"THL", nr:69, text:"THL SCHIENE – Hilfeleistung U-Bahn" },
  { kat:"THL", nr:70, text:"THL WASSER – Bergung Sache / Leiche" },
  { kat:"THL", nr:71, text:"THL WASSER – Rettung Tier" },
  { kat:"THL", nr:72, text:"THL WASSER – Rettung Person" },
  { kat:"THL", nr:73, text:"THL WASSER – Tauchereinsatz ohne Rettung" },
  { kat:"THL", nr:74, text:"THL TRAGEHILFE – Tragehilfe" },
  { kat:"THL", nr:75, text:"THL UNWETTER – Baum / Ast droht zu fallen" },
  { kat:"THL", nr:76, text:"THL UNWETTER – Baum / Ast auf Fahrbahn" },
  { kat:"THL", nr:77, text:"THL UNWETTER – Baum / Ast auf Schiene" },
  { kat:"THL", nr:78, text:"THL UNWETTER – Baum / Ast auf Gebäude" },
  { kat:"THL", nr:79, text:"THL UNWETTER – Baum / Ast auf Stromleitung" },
  { kat:"THL", nr:80, text:"THL UNWETTER – Baum / Ast auf PKW / LKW" },
  { kat:"THL", nr:81, text:"THL UNWETTER – Baum umgestürzt" },
  { kat:"THL", nr:82, text:"THL UNWETTER – Bauteil / Gegenstand droht zu fallen" },
  { kat:"THL", nr:83, text:"THL UNWETTER – Gebäude sichern" },
  { kat:"THL", nr:84, text:"THL UNWETTER – Bauzaun sichern" },
  { kat:"THL", nr:85, text:"THL UNWETTER – Fahrbahn / Gehweg überschwemmt" },
  { kat:"THL", nr:86, text:"THL UNWETTER – Gebäude unter Wasser" },
  { kat:"THL", nr:87, text:"THL UNWETTER – Keller unter Wasser" },
  { kat:"THL", nr:88, text:"THL UNWETTER – Fahrzeug / sonstigen Gegenstand sichern" },
  { kat:"THL", nr:89, text:"THL UNWETTER – Erkundung nicht zeitkritisch" },
  { kat:"THL", nr:90, text:"THL UNWETTER – sonstiger Schaden" },
  // ABC – lfd. Nr. 6–55 (ab ABC 2; Geruch/Kraftstoff sind hier nicht relevant)
  { kat:"ABC", nr:6,  text:"ABC 2 – verdächtiger Stoff" },
  { kat:"ABC", nr:7,  text:"ABC 2 – undefinierbare Flüssigkeit" },
  { kat:"ABC", nr:8,  text:"ABC 2 – undefinierbarer Gegenstand" },
  { kat:"ABC", nr:9,  text:"ABC 2 – kleine Menge" },
  { kat:"ABC", nr:10, text:"ABC 2 – undefinierbares Pulver" },
  { kat:"ABC", nr:11, text:"ABC 2 – Gasaustritt im Freien" },
  { kat:"ABC", nr:12, text:"ABC 3 – große Menge" },
  { kat:"ABC", nr:13, text:"ABC 3 – Gasaustritt brennbar" },
  { kat:"ABC", nr:14, text:"ABC 3 – Gasaustritt im Gebäude" },
  { kat:"ABC", nr:15, text:"ABC B ATOM – Brand Atom im Gebäude" },
  { kat:"ABC", nr:16, text:"ABC B ATOM – Brand Atom im Freien" },
  { kat:"ABC", nr:17, text:"ABC B ATOM – Brand Atom PKW / LKW" },
  { kat:"ABC", nr:18, text:"ABC B ATOM – Brand Atomkraftwerk (AKW)" },
  { kat:"ABC", nr:19, text:"ABC B – Brand Tankstelle" },
  { kat:"ABC", nr:20, text:"ABC B – Brand Biogasanlage" },
  { kat:"ABC", nr:21, text:"ABC B – Brand Raffinerie" },
  { kat:"ABC", nr:22, text:"ABC B – Brand Tanklager" },
  { kat:"ABC", nr:23, text:"ABC B – Brand Tankwagen" },
  { kat:"ABC", nr:24, text:"ABC B BIO / CHEMIE – Brand Bio im Gebäude" },
  { kat:"ABC", nr:25, text:"ABC B BIO / CHEMIE – Brand Bio im Freien" },
  { kat:"ABC", nr:26, text:"ABC B BIO / CHEMIE – Brand Bio PKW / LKW" },
  { kat:"ABC", nr:27, text:"ABC B BIO / CHEMIE – Brand Chemie im Gebäude" },
  { kat:"ABC", nr:28, text:"ABC B BIO / CHEMIE – Brand Chemie im Freien" },
  { kat:"ABC", nr:29, text:"ABC B BIO / CHEMIE – Brand Chemie Zug" },
  { kat:"ABC", nr:30, text:"ABC B BIO / CHEMIE – Brand Chemie LKW" },
  { kat:"ABC", nr:31, text:"ABC THL ATOM – THL Atom Austritt im Gebäude" },
  { kat:"ABC", nr:32, text:"ABC THL ATOM – THL Atom Austritt im Freien" },
  { kat:"ABC", nr:33, text:"ABC THL ATOM – THL Atom PKW / LKW" },
  { kat:"ABC", nr:34, text:"ABC THL ATOM – THL VU Atom PKW / LKW" },
  { kat:"ABC", nr:35, text:"ABC THL BIO / CHEMIE – THL Bio Austritt im Freien" },
  { kat:"ABC", nr:36, text:"ABC THL BIO / CHEMIE – THL Bio Austritt im Gebäude" },
  { kat:"ABC", nr:37, text:"ABC THL BIO / CHEMIE – THL Bio PKW / LKW" },
  { kat:"ABC", nr:38, text:"ABC THL BIO / CHEMIE – THL Chemie Austritt im Gebäude" },
  { kat:"ABC", nr:39, text:"ABC THL BIO / CHEMIE – THL Chemie Austritt im Freien" },
  { kat:"ABC", nr:40, text:"ABC THL BIO / CHEMIE – THL Chemie PKW / LKW" },
  { kat:"ABC", nr:41, text:"ABC THL BIO / CHEMIE – THL VU Bio PKW / LKW" },
  { kat:"ABC", nr:42, text:"ABC THL BIO / CHEMIE – THL VU Chemie PKW / LKW" },
  { kat:"ABC", nr:43, text:"ABC THL BIO / CHEMIE – THL VU Chemie Zug" },
  { kat:"ABC", nr:44, text:"ABC EXPLOSION – Explosion / Verpuffung" },
  { kat:"ABC", nr:45, text:"ABC ÖL WASSER – Öl auf fließendem Gewässer" },
  { kat:"ABC", nr:46, text:"ABC ÖL WASSER – Öl auf stehendem Gewässer" },
  { kat:"ABC", nr:47, text:"ABC ÖL LAND – undichter Heizöltank" },
  { kat:"ABC", nr:48, text:"ABC ÖL LAND – ausgedehnter Ölschaden" },
  { kat:"ABC", nr:49, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage Ammoniak" },
  { kat:"ABC", nr:50, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage Chlor" },
  { kat:"ABC", nr:51, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage Stickstoff" },
  { kat:"ABC", nr:52, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage CO2" },
  { kat:"ABC", nr:53, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage Butan" },
  { kat:"ABC", nr:54, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage Propan" },
  { kat:"ABC", nr:55, text:"ABC GEFAHRSTOFFMELDEANLAGE – Meldeanlage undefiniert" },
];
/* Version der Vorbelegung – hochzählen, wenn sich STICHWORT_KATALOG ändert,
   damit die neue Liste bei bestehenden Installationen einmalig übernommen wird. */
const STICHWORT_VER = 2;
/* Stichwortkatalog: nach Einsatzart gruppiert (Brand → THL → ABC → Weitere) */
const STW_KAT_ORDER = ["Brand","THL","ABC"];
function stichwortGruppen(){
  const list = (state.config.stichworte || []).map((s,i) => ({...s, _i:i}));
  const rang = k => { const i = STW_KAT_ORDER.indexOf(k); return i < 0 ? 99 : i; };
  const grps = [...new Set(list.map(s => s.kat || "Weitere"))]
    .sort((a,b) => rang(a) - rang(b) || a.localeCompare(b, "de"));
  return grps.map(g => ({ grp:g, items:list.filter(s => (s.kat||"Weitere") === g) }));
}
/* Führungskräfte-Stammdaten – je Einheit pflegbar, beim Erfassen per Dropdown wählbar.
   Weitere Stammdaten folgen; alle unter Einstellungen erweiter-/löschbar. */
function fkStammGruppen(){
  const list = (state.config.fkStamm || []).map((p,i) => ({...p, _i:i}));
  const grps = [...new Set(list.map(p => (p.einheit||"").trim() || "Ohne Einheit"))]
    .sort((a,b) => a.localeCompare(b, "de"));
  return grps.map(g => ({ grp:g,
    items: list.filter(p => ((p.einheit||"").trim() || "Ohne Einheit") === g)
      .sort((a,b) => (a.name||"").localeCompare(b.name||"", "de")) }));
}
function fkStammLabel(p){ return [p.name, p.funktion, p.funkrufname].map(s=>(s||"").trim()).filter(Boolean).join(" · "); }
function fkStammHinzufuegen(p){
  const list = state.config.fkStamm || (state.config.fkStamm = []);
  const norm = s => (s||"").trim().toLowerCase();
  if(!(p.name||"").trim() && !(p.funkrufname||"").trim()) return;
  const da = list.some(x => norm(x.name) === norm(p.name) && norm(x.funkrufname) === norm(p.funkrufname));
  if(da) return;
  list.push({ name:(p.name||"").trim(), funktion:(p.funktion||"").trim(),
    funkrufname:(p.funkrufname||"").trim(), einheit:(p.einheit||"").trim(), org:p.org||"FW" });
}
const FUNKTIONEN = ["Einsatzleiter","Örtlicher Einsatzleiter","Abschnittsleiter","Zugführer",
  "Gruppenführer","Organisatorischer Leiter","Einsatzleiter Rettungsdienst","Fachberater THW","Zugtruppführer","Polizeiführer"];
const STORE_KEY = "kraefteerfassung-proto-v1";

const TABS = [
  { id:"einsatz",  label:"Einsatz",
    icon:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5"/>' },
  { id:"kraefte",  label:"Kräfte",
    icon:'<path d="M2.5 15V9.5A1.5 1.5 0 0 1 4 8h9.5v7"/><path d="M13.5 9.5H18l3.5 3.5v2h-8"/><circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M8.5 17h6.5M2.5 15v2h2"/>' },
  { id:"funk",     label:"Funk",
    icon:'<circle cx="12" cy="7" r="2.2"/><path d="M12 9.2V21M8.5 21h7"/><path d="M7.2 2.6a7.4 7.4 0 0 0 0 8.8M16.8 2.6a7.4 7.4 0 0 1 0 8.8"/>' },
  { id:"skizze",   label:"Funkskizze", nurGross:true,
    icon:'<rect x="8.5" y="3" width="7" height="5" rx="1"/><rect x="2.5" y="16" width="7" height="5" rx="1"/><rect x="14.5" y="16" width="7" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>' },
  { id:"bespr",    label:"Besprechung",
    icon:'<path d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"/><path d="M7.5 8.5h9M7.5 12h6"/>' },
  { id:"listen",   label:"Checklisten",
    icon:'<path d="M4 6.5 5.5 8 8 5M4 12.5 5.5 14 8 11M4 18.5 5.5 20 8 17"/><path d="M11 6.5h9M11 12.5h9M11 18.5h9"/>' },
  { id:"atemschutz",label:"Atemschutz",
    icon:'<path d="M12 3v8"/><path d="M9.5 11a4.5 4.5 0 0 0-4.5 4.5V18a2 2 0 0 0 4 0v-7"/><path d="M14.5 11a4.5 4.5 0 0 1 4.5 4.5V18a2 2 0 0 1-4 0v-7"/>' },
  { id:"lagekarte",label:"Lagekarte", nurGross:true,
    icon:'<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14"/>' },
  { id:"monitor",  label:"Monitor", nurGross:true,
    icon:'<rect x="3" y="4.5" width="18" height="12.5" rx="1.5"/><path d="M9 21h6M12 17v4"/>' },
];
// Auf kleinen Geräten (Handy) geht es nur um die Kräfteerfassung – Monitor, Lagekarte
// und Funkskizze brauchen mindestens ein 10-Zoll-Gerät.
function istGrossesGeraet(){ return window.matchMedia("(min-width:900px)").matches; }
function sichtbareTabs(){ return istGrossesGeraet() ? TABS : TABS.filter(t => !t.nurGross); }

function defaultConfig(){
  return {
    ugName:"UG-Weiden",
    prefixes:{ FW:"Florian", BRK:"RK", POL:"Donau", THW:"Heros", SON:"" },
    ilsName:"ILS Nordoberpfalz",
    ilsGruppe:{mode:"TMO",gruppe:""},
    theme:"auto",   // auto (Systemeinstellung) | hell | dunkel
  };
}
function applyTheme(){
  const t = (state.config && state.config.theme) || "auto";
  const root = document.documentElement;
  if(t === "hell") root.setAttribute("data-theme", "light");
  else if(t === "dunkel") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");   // auto → prefers-color-scheme
}
function defaultState(){
  return {
    einsatzId: uid(),                      // Identität für den Sync (welcher Einsatz?)
    einsatzStart: new Date().toISOString(),
    einsatz: { stichwort:"", ort:"", objekt:"", beginn:"", ende:"", leiter:"", bereitstellungsraum:"", bemerkung:"", ilsGruppe:{mode:"TMO",gruppe:"2772"} },
    einheiten: [], fuehrung: [], abschnitte: [], archiv: [],
    lage: { items: [], bg: "", snapshots: [], mode: "raster", mapView: null, mapLayer: "luftbild" },
    funk: [], besprechungen: [], anforderungen: [], checks: [], fotos: [],
    asTraeger: [], asTrupps: [], asSub: "sammelstelle",
    monHide: { panels: {}, ab: {} },
    config: defaultConfig(),
    wlan:false, pending:0, view:"einsatz", ksub:"einheiten",
  };
}
// Synchron mit Defaults vorbelegen, damit Top-Level-Code (Splash etc.) nie auf undefined trifft;
// die echten Daten kommen async aus IndexedDB in boot() und ersetzen diesen Stand.
let state = defaultState();
/* Geladene Rohdaten in den Laufzeit-Zustand überführen (inkl. Migrationen).
   Früher lief das synchron beim Skriptstart; seit IndexedDB (async) in boot(). */
function zustandAufbauen(stored){
  stored = stored || {};
  state = Object.assign(defaultState(), stored);
  state.config = Object.assign(defaultConfig(), stored.config || {});
  state.config.prefixes = Object.assign(defaultConfig().prefixes, (stored.config||{}).prefixes || {});
  // Fahrzeugkatalog: beim ersten Start aus der Vorlage befüllen, danach frei pflegbar
  if(!Array.isArray(state.config.katalog)) state.config.katalog = FZG_KATALOG.map(k => ({...k, org:"FW"}));
  // Einsatzstichwort-Katalog: beim ersten Start aus der Vorlage befüllen, danach frei pflegbar
  if(!Array.isArray(state.config.stichworte) || state.config.stichworteV !== STICHWORT_VER){
    state.config.stichworte = STICHWORT_KATALOG.map(s => ({...s}));
    state.config.stichworteV = STICHWORT_VER;
  }
  // Führungskräfte-Stammdaten: leer starten, wird beim Erfassen automatisch befüllt
  if(!Array.isArray(state.config.fkStamm)) state.config.fkStamm = [];
  applyTheme();
  if(!state.lage || !Array.isArray(state.lage.items)) state.lage = { items: [], bg: "" };
  if(!Array.isArray(state.lage.snapshots)) state.lage.snapshots = [];
  if(!state.lage.mode) state.lage.mode = state.lage.bg ? "bild" : "raster";
  if(!state.lage.mapLayer) state.lage.mapLayer = "luftbild";
  if(!Array.isArray(state.funk)) state.funk = [];
  if(!Array.isArray(state.besprechungen)) state.besprechungen = [];
  if(!Array.isArray(state.anforderungen)) state.anforderungen = [];
  if(!Array.isArray(state.checks)) state.checks = [];
  if(!Array.isArray(state.fotos)) state.fotos = [];
  if(!Array.isArray(state.asTraeger)) state.asTraeger = [];
  if(!Array.isArray(state.asTrupps)) state.asTrupps = [];
  // Abschnitte: alte TMO/DMO-Felder auf Führungs-/Arbeitsrufgruppe (je Modus + Gruppe) migrieren
  state.abschnitte.forEach(a => {
    if(!a.fuehrung) a.fuehrung = { mode:"TMO", gruppe: a.tmo || "" };
    if(!a.arbeit)   a.arbeit   = { mode:"DMO", gruppe: a.dmo || "" };
    if(a.arbeit.via == null) a.arbeit.via = "";   // "", "gateway" oder "repeater"
  });
  // Leitstellen-Rufgruppe (Einsatz + Config) von Freitext „TMO 2772“ auf {mode,gruppe} migrieren
  state.einsatz.ilsGruppe = parseGruppe(state.einsatz.ilsGruppe);
  state.config.ilsGruppe  = parseGruppe(state.config.ilsGruppe);
  if(!state.asSub) state.asSub = "sammelstelle";
  if(!state.monHide || typeof state.monHide !== "object") state.monHide = { panels: {}, ab: {} };
  state.monHide.panels = state.monHide.panels || {};
  state.monHide.ab = state.monHide.ab || {};
  if(!state.einsatzId){
    state.einsatzId = uid();
    const b = state.einsatz && state.einsatz.beginn ? new Date(state.einsatz.beginn) : null;
    state.einsatzStart = (b && !isNaN(b)) ? b.toISOString() : new Date().toISOString();
  }
  // Bestehende Fahrzeug-Symbole ohne Nummer nachnummerieren
  let maxCar = state.lage.items.reduce((m,i) => i.type==="car" ? Math.max(m, i.num||0) : m, 0);
  state.lage.items.forEach(i => { if(i.type === "car" && !i.num) i.num = ++maxCar; });
}
let syncing = false;
let editing = null;   // { unit, isNew } – Einheit
let editingFk = null; // { fk, isNew }  – Führungskraft

/* ---------------- Persistenz: IndexedDB ----------------
   Löst das ~5–10-MB-Limit von localStorage ab (v. a. für Fotos und
   Lagekarten-Snapshots). Der gesamte Zustand liegt als ein Datensatz
   im Key-Value-Store "kv". Bleibt rein gerätelokal – der Abgleich über
   mehrere Geräte läuft unverändert über den ELW-Server (api/sync). */
const DB_NAME = "elwis", DB_STORE = "kv";
let _dbP = null;
function idbOpen(){
  if(_dbP) return _dbP;
  _dbP = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  return _dbP;
}
function idbGet(key){
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  }));
}
function idbSet(key, val){
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  }));
}
/* Zustand laden – aus IndexedDB, mit einmaliger Übernahme aus altem localStorage */
async function ladeZustand(){
  try{
    const s = await idbGet("state");
    if(s) return JSON.parse(s);
    const alt = localStorage.getItem(STORE_KEY);   // Migration bestehender Installationen
    if(alt){
      try{ await idbSet("state", alt); localStorage.removeItem(STORE_KEY); }catch(e){}
      return JSON.parse(alt);
    }
  }catch(e){ console.warn("[ELWIS] IndexedDB nicht verfügbar – Daten werden nicht dauerhaft gespeichert:", e); }
  return {};
}
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
// Wie früher als JSON-String ablegen (identische Semantik, aber ohne localStorage-Limit)
function save(){ if(state) idbSet("state", JSON.stringify(state)).catch(e => console.warn("[ELWIS] Speichern (IndexedDB) fehlgeschlagen:", e)); }
function markChange(){ if(!state.wlan) state.pending++; save(); }
function pfx(org){ return state.config.prefixes[org] ?? ""; }

/* ---------------- Hilfsfunktionen ---------------- */
const $ = sel => document.querySelector(sel);
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------------- Dialoge (statt Browser-alert/confirm) ---------------- */
function modal(opts){
  return new Promise(resolve => {
    const host = $("#modalHost");
    host.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal" role="alertdialog" aria-modal="true">
      ${opts.titel ? `<h2>${esc(opts.titel)}</h2>` : ""}
      <p>${esc(opts.text)}</p>
      <div class="modal-btns">
        ${opts.abbrechen ? `<button class="btn btn-ghost" data-md="0">${esc(opts.abbrechen)}</button>` : ""}
        <button class="btn btn-primary" data-md="1">${esc(opts.ok || "OK")}</button>
      </div>
    </div>`;
    const fertig = v => { host.innerHTML = ""; resolve(v); };
    host.querySelectorAll("[data-md]").forEach(b =>
      b.addEventListener("click", () => fertig(b.dataset.md === "1")));
    host.querySelector(".modal-backdrop").addEventListener("click", () => {
      if(opts.abbrechen) fertig(false);
    });
    const okBtn = host.querySelector('[data-md="1"]');
    if(okBtn) okBtn.focus();
  });
}
function modalConfirm(text, ok = "Ja", abbrechen = "Abbrechen"){
  return modal({ text, ok, abbrechen });
}
function modalInfo(text){ return modal({ text, ok: "OK" }); }

/* QR-Code als Bild-Data-URL (Vendor-Lib qrcode) */
function qrDataUrl(text){
  try{ const qr = qrcode(0, "M"); qr.addData(text); qr.make(); return qr.createDataURL(5, 12); }
  catch(e){ return ""; }
}
function gesamt(u){ return (u.f|0)+(u.u|0)+(u.m|0); }
function staerkeStr(u){ return `${u.f}/${u.u}/${u.m}/${gesamt(u)}`; }
function fullName(u){ return [u.name, u.kennung].map(s => (s||"").trim()).filter(Boolean).join(" "); }
function abNameOf(id, list){
  if(id === "BR") return "Bereitstellungsraum";
  const a = (list || state.abschnitte).find(x => x.id === id);
  return a ? a.name : "";
}
/* Rufgruppe „<TMO|DMO> <Gruppe>“ (leer wenn keine Gruppe hinterlegt) */
function gruppeStr(g){ return (g && g.gruppe) ? `${g.mode || "TMO"} ${g.gruppe}` : ""; }
/* Freitext „TMO 2772“ ⇄ Objekt {mode,gruppe,via}; robust gegen Alt-/Neuformat */
function parseGruppe(v){
  if(v && typeof v === "object") return { mode:v.mode||"TMO", gruppe:v.gruppe||"", via:v.via||"" };
  const s = String(v||"").trim();
  const m = s.match(/^(TMO|DMO)\s+(.*)$/i);
  return m ? { mode:m[1].toUpperCase(), gruppe:m[2].trim(), via:"" } : { mode:"TMO", gruppe:s, via:"" };
}
/* Kurzkürzel für eine Abschnittsfläche: „EA <Nr>“ (Nr. aus dem Namen, sonst Reihenfolge) */
function abKuerzel(id){
  const idx = state.abschnitte.findIndex(a => a.id === id);
  if(idx < 0) return "EA";
  const m = (state.abschnitte[idx].name || "").match(/\d+/);
  return "EA " + (m ? m[0] : (idx + 1));
}
// Flächeninhalt eines Geo-Polygons (nur Kartenmodus, echte lat/lng) in m² – kugelflächen-genau
function geoFlaecheM2(llpoints){
  if(!Array.isArray(llpoints) || llpoints.length < 3) return 0;
  const R = 6378137, rad = d => d * Math.PI / 180;
  let s = 0;
  for(let i = 0; i < llpoints.length; i++){
    const a = llpoints[i], b = llpoints[(i + 1) % llpoints.length];
    s += (rad(b.lng) - rad(a.lng)) * (2 + Math.sin(rad(a.lat)) + Math.sin(rad(b.lat)));
  }
  return Math.abs(s * R * R / 2);
}
function flaecheStr(m2){
  if(!(m2 > 0)) return "";
  if(m2 >= 1e6) return (m2 / 1e6).toFixed(2).replace(".", ",") + " km²";
  if(m2 >= 1e4) return (m2 / 1e4).toFixed(2).replace(".", ",") + " ha";
  return Math.round(m2) + " m²";
}
function fmtZeit(iso){
  if(!iso) return "–";
  const d = new Date(iso);
  return isNaN(d) ? "–" : d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
}
function fmtDatum(iso){
  if(!iso) return "–";
  const d = new Date(iso);
  return isNaN(d) ? "–" : d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function fmtTagKurz(iso){
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}) + ".";
}
function istHeute(iso){
  const d = new Date(iso);
  return !isNaN(d) && d.toDateString() === new Date().toDateString();
}
function fmtDateInput(iso){
  const d = iso ? new Date(iso) : new Date();
  const x = isNaN(d) ? new Date() : d;
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
}
function nowLocalInput(){
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
}
function aktive(){ return state.einheiten.filter(u => !u.abgerueckt); }
function summen(units){
  return units.reduce((a,u)=>({ f:a.f+(u.f|0), u:a.u+(u.u|0), m:a.m+(u.m|0), agt:a.agt+(u.agt|0), csa:a.csa+(u.csa|0) }),{f:0,u:0,m:0,agt:0,csa:0});
}
/* Bilder clientseitig verkleinern, damit der lokale Speicher reicht */
function resizeImage(file, maxDim, cb){
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL("image/jpeg", .72));
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}
/* Sprachdiktat (Web Speech API) – Komfortfunktion am ELW, braucht Browser-Unterstützung */
function attachDictation(btn, target){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ btn.style.display = "none"; return; }
  let rec = null;
  btn.addEventListener("click", () => {
    if(rec){ rec.stop(); return; }
    rec = new SR();
    rec.lang = "de-DE"; rec.continuous = true; rec.interimResults = false;
    rec.onresult = ev => {
      const t = [...ev.results].slice(ev.resultIndex).map(r => r[0].transcript).join(" ").trim();
      if(t) target.value = (target.value ? target.value + " " : "") + t;
      target.dispatchEvent(new Event("input"));
    };
    rec.onend = () => { rec = null; btn.classList.remove("rec"); };
    rec.onerror = e => {
      rec = null; btn.classList.remove("rec");
      if(e.error === "not-allowed" || e.error === "service-not-allowed")
        modalInfo("Spracheingabe nicht verfügbar – Mikrofonberechtigung fehlt oder wird in dieser Umgebung blockiert.");
    };
    btn.classList.add("rec");
    try{ rec.start(); }catch(err){ rec = null; btn.classList.remove("rec"); }
  });
}
function dauerStr(vonIso, bisIso){
  const von = vonIso ? new Date(vonIso) : null;
  if(!von || isNaN(von)) return "";
  const bis = bisIso ? new Date(bisIso) : new Date();
  const min = Math.max(0, Math.floor((bis - von)/60000));
  return `${Math.floor(min/60)}:${String(min%60).padStart(2,"0")} h`;
}

/* ---------------- Splashscreen ---------------- */
(function(){
  const sp = $("#splash");
  $("#splashUg").textContent = state.config.ugName || "";
  const go = () => { sp.classList.add("out"); setTimeout(()=>sp.remove(), 500); };
  const t = setTimeout(go, 5000);
  sp.addEventListener("click", () => { clearTimeout(t); go(); });
})();

/* ---------------- Kopfzeile / Sync ---------------- */
function renderHeader(){
  $("#appSub").textContent = state.config.ugName || "";
  const pill = $("#syncPill"), txt = $("#syncText"), sw = $("#wlanSwitch");
  sw.setAttribute("aria-checked", state.wlan ? "true" : "false");
  pill.classList.toggle("busy", syncing);
  if(syncing){
    pill.classList.remove("good");
    txt.textContent = `Synchronisiere ${state.pending} Änderung${state.pending===1?"":"en"} …`;
  }else if(state.wlan){
    pill.classList.add("good");
    txt.textContent = "Synchron";
  }else{
    pill.classList.remove("good");
    txt.textContent = state.pending > 0 ? `Offline · ${state.pending} lokal` : "Offline · bereit";
  }
}
$("#wlanSwitch").addEventListener("click", () => {
  state.wlan = !state.wlan;
  if(state.wlan && state.pending > 0){
    syncing = true; save(); render();
    setTimeout(() => { syncing = false; state.pending = 0; save(); render(); }, 1400);
    return;
  }
  save(); render();
});
$("#btnSettings").addEventListener("click", () => { if(state) renderSettingsSheet(); });

/* ---------------- Navigation ---------------- */
function buildNav(){
  // Seitenleiste (ab 10 Zoll): alle Ansichten
  const btn = t => `
    <button data-tab="${t.id}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>${t.label}
    </button>`;
  document.querySelector("nav.rail").insertAdjacentHTML("beforeend", TABS.map(btn).join(""));
  document.querySelectorAll("nav.rail [data-tab]").forEach(b =>
    b.addEventListener("click", () => { if(!state) return; state.view = b.dataset.tab; save(); render(); }));
}
buildNav();

/* Burger-Menü (Handy) – nur die auf kleinen Geräten sinnvollen Ansichten */
function openMenu(){
  if(!state) return;   // vor dem async Laden (boot) noch kein Zustand
  const tabs = sichtbareTabs();
  $("#menuHost").innerHTML = `
  <div class="drawer-backdrop" data-menuclose="1"></div>
  <div class="drawer" role="dialog" aria-modal="true" aria-label="Menü">
    <div class="drawer-head">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" style="width:22px;height:22px;stroke:#fff;fill:none;stroke-width:5;stroke-linecap:round">
          <path d="M32 28v22M21 50h22"></path><path d="M20.5 12a16 16 0 0 0 0 20M43.5 12a16 16 0 0 1 0 20"></path>
          <circle cx="32" cy="21" r="5.5" fill="#fff" stroke="none"></circle></svg>
      </div>
      <h2><span class="n-elw">ELW</span><span class="n-is">IS</span></h2>
    </div>
    ${tabs.map(t => `
      <button data-tab="${t.id}" class="${state.view===t.id?"active":""}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>${t.label}
      </button>`).join("")}
  </div>`;
  const close = () => { $("#menuHost").innerHTML = ""; };
  $("#menuHost").querySelector("[data-menuclose]").addEventListener("click", close);
  $("#menuHost").querySelectorAll("[data-tab]").forEach(b =>
    b.addEventListener("click", () => { state.view = b.dataset.tab; close(); save(); render(); }));
}
$("#btnMenu").addEventListener("click", openMenu);

/* ---------------- Einstellungen (mandantenfähig) ---------------- */
function renderSettingsSheet(){
  const c = state.config;
  const prefFields = Object.entries(ORGS).map(([key,o]) => `
    <div class="field">
      <label for="cfg-p-${key}">Präfix ${esc(o.label)}</label>
      <input id="cfg-p-${key}" data-pfx="${key}" class="mono" value="${esc(c.prefixes[key]||"")}"
        placeholder="${key==='SON'?'(leer)':''}" autocomplete="off">
    </div>`).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Einstellungen">
    <div class="sheet-head">
      <h2>Einstellungen</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      ${SYNC.aktiv && SYNC.urls.length ? `
      <div class="field"><label style="margin-bottom:10px">Tablet verbinden</label>
        <div class="cfg-qr">
          <img src="${qrDataUrl(SYNC.urls[0])}" alt="QR-Code zum Verbinden" width="176" height="176">
          <div>
            <p class="hint" style="margin:0 0 8px">Mit der Tablet-Kamera scannen – ELWIS öffnet sich im ELW-WLAN und verbindet sich automatisch mit dem Einsatz.</p>
            ${SYNC.urls.map(u => `<div class="mono" style="font-size:.82rem">${esc(u)}</div>`).join("")}
          </div>
        </div>
      </div>` : `
      <div class="field"><label style="margin-bottom:6px">Tablet verbinden</label>
        <p class="hint" style="margin:0">Der QR-Code zum Verbinden erscheint hier, sobald ELWIS über den ELW-Server läuft (<span class="mono">npm run server</span>) – die Tablets landen dann im gleichen WLAN und synchronisieren automatisch.</p>
      </div>`}
      ${SYNC.aktiv ? `
      <div class="field"><label style="margin-bottom:6px">Datensicherung / Wiederherstellung</label>
        <div id="cfg-backups" class="kat-list"><p class="hint" style="margin:6px 4px">Sicherungen werden geladen …</p></div>
        <p class="hint">Der ELW-Server sichert den Einsatzstand automatisch. Beim Wiederherstellen übernehmen alle verbundenen Geräte den gewählten Stand.</p>
      </div>` : ""}
      <div class="field"><label style="margin-bottom:10px">Darstellung</label>
        <div class="seg" style="max-width:none">
          <button type="button" data-theme-opt="auto" class="${(c.theme||'auto')==='auto'?'active':''}">Automatisch</button>
          <button type="button" data-theme-opt="hell" class="${c.theme==='hell'?'active':''}">Hell</button>
          <button type="button" data-theme-opt="dunkel" class="${c.theme==='dunkel'?'active':''}">Dunkel</button>
        </div>
        <p class="hint">„Automatisch“ folgt der Systemeinstellung des Geräts.</p>
      </div>
      <div class="field">
        <label for="cfg-ug">Name der Einheit / Organisation</label>
        <input id="cfg-ug" value="${esc(c.ugName)}" placeholder="z. B. UG-Weiden" autocomplete="off">
        <p class="hint">Erscheint auf Startbildschirm, Kopfzeile und Einsatzbericht – so ist die Anwendung je Installation anpassbar (UG, Feuerwehr, Landkreis …).</p>
      </div>
      <div class="field"><label style="margin-bottom:10px">Funkskizze / Leitstelle</label>
        <div class="form-grid">
          <div class="field"><label for="cfg-ils">Leitstelle</label>
            <input id="cfg-ils" value="${esc(c.ilsName||"")}" placeholder="z. B. ILS Nordoberpfalz" autocomplete="off"></div>
          <div class="field"><label for="cfg-ilsgrp">Rufgruppe zur Leitstelle</label>
            <div style="display:flex;gap:8px">
              <select id="cfg-ils-mode" style="width:100px;flex:none">
                <option value="TMO" ${(c.ilsGruppe||{}).mode!=="DMO"?"selected":""}>TMO</option>
                <option value="DMO" ${(c.ilsGruppe||{}).mode==="DMO"?"selected":""}>DMO</option>
              </select>
              <input id="cfg-ilsgrp" class="mono" value="${esc((c.ilsGruppe||{}).gruppe||"")}" placeholder="z. B. 2772" autocomplete="off">
            </div></div>
        </div>
      </div>
      <div class="field"><label style="margin-bottom:10px">Funkrufnamen-Präfixe je Organisation</label>
        <div class="form-grid">${prefFields}</div>
        <p class="hint">Wird bei der Erfassung vorbelegt und kann dort jederzeit überschrieben werden.</p>
      </div>
      <div class="field"><label style="margin-bottom:10px">Einsatzstichwörter (${(c.stichworte||[]).length})</label>
        <div class="kat-list">
          ${stichwortGruppen().map(g => `
            <div class="kat-grp">${esc(g.grp)}</div>
            ${g.items.map(s => `
              <div class="kat-row">
                <span>${esc(s.text)}</span>
                <button class="kat-x" data-stwdel="${s._i}" aria-label="Stichwort entfernen">✕</button>
              </div>`).join("")}`).join("")}
        </div>
        <div class="kat-add">
          <select id="cfg-stw-kat" aria-label="Kategorie">
            ${STW_KAT_ORDER.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join("")}
            <option value="Weitere">Weitere</option>
          </select>
          <input id="cfg-stw-neu" placeholder="z. B. B 5 – Menschenrettung" autocomplete="off">
          <button type="button" class="btn btn-ghost" id="cfg-stw-add">Hinzufügen</button>
        </div>
        <p class="hint">Eigene Stichwörter ergänzen oder mit ✕ entfernen. Die Liste erscheint beim Einsatzstichwort zur Auswahl.</p>
      </div>
      <div class="field"><label style="margin-bottom:10px">Führungskräfte-Stammdaten (${(c.fkStamm||[]).length})</label>
        <div class="kat-list">
          ${(c.fkStamm||[]).length ? fkStammGruppen().map(g => `
            <div class="kat-grp">${esc(g.grp)}</div>
            ${g.items.map(p => `
              <div class="kat-row">
                <span>${esc(fkStammLabel(p))}</span>
                <button class="kat-x" data-fkdel="${p._i}" aria-label="Aus Stammdaten entfernen">✕</button>
              </div>`).join("")}`).join("")
            : `<p class="hint" style="margin:6px 4px">Noch keine Führungskräfte hinterlegt.</p>`}
        </div>
        <div class="kat-add kat-add-fk">
          <input id="cfg-fk-name" placeholder="Name" autocomplete="off">
          <input id="cfg-fk-funktion" list="cfg-fk-funktionen" placeholder="Funktion" autocomplete="off">
          <input id="cfg-fk-funkruf" class="mono" placeholder="Funkrufname" autocomplete="off">
          <input id="cfg-fk-einheit" placeholder="Einheit / Abschnitt" autocomplete="off">
          <button type="button" class="btn btn-ghost" id="cfg-fk-add">Hinzufügen</button>
          <datalist id="cfg-fk-funktionen">${FUNKTIONEN.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
        </div>
        <p class="hint">Je Einheit pflegbar. Beim Erfassen einer Führungskraft per Dropdown wählbar – neu erfasste Personen landen automatisch hier.</p>
      </div>
      <div class="field"><label style="margin-bottom:10px">Fahrzeugkatalog (${(c.katalog||[]).length})</label>
        <div class="kat-list">
          ${katalogListe().map(k => `
            <div class="kat-row">
              <span>${esc(katalogLabel(k))}</span>
              <button class="kat-x" data-katdel="${k._i}" aria-label="Aus Katalog entfernen">✕</button>
            </div>`).join("")}
        </div>
        <p class="hint">Name + Funkrufnummer. Neue Fahrzeuge werden bei der Erfassung automatisch aufgenommen. Mit ✕ entfernen.</p>
      </div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" id="cfg-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  const leseSettings = () => {
    state.config.ugName = $("#cfg-ug").value.trim();
    state.config.ilsName = $("#cfg-ils").value.trim();
    state.config.ilsGruppe = { mode: $("#cfg-ils-mode").value, gruppe: $("#cfg-ilsgrp").value.trim() };
    document.querySelectorAll("[data-pfx]").forEach(inp => {
      state.config.prefixes[inp.dataset.pfx] = inp.value.trim();
    });
  };
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-theme-opt]").forEach(b => b.addEventListener("click", () => {
    state.config.theme = b.dataset.themeOpt;
    document.querySelectorAll("[data-theme-opt]").forEach(x => x.classList.toggle("active", x.dataset.themeOpt===state.config.theme));
    applyTheme(); save();   // sofort sichtbar und gespeichert
  }));
  document.querySelectorAll("[data-katdel]").forEach(b => b.addEventListener("click", () => {
    leseSettings();   // laufende Eingaben nicht verlieren
    state.config.katalog.splice(Number(b.dataset.katdel), 1);
    save(); renderSettingsSheet();
  }));
  document.querySelectorAll("[data-stwdel]").forEach(b => b.addEventListener("click", () => {
    leseSettings();
    state.config.stichworte.splice(Number(b.dataset.stwdel), 1);
    save(); renderSettingsSheet();
  }));
  const stwAdd = () => {
    const text = $("#cfg-stw-neu").value.trim();
    if(!text) return;
    const kat = $("#cfg-stw-kat").value || "Weitere";
    const norm = s => s.toLowerCase();
    (state.config.stichworte || (state.config.stichworte = []));
    if(!state.config.stichworte.some(s => norm(s.text) === norm(text)))
      state.config.stichworte.push({ kat, text });
    leseSettings();
    save(); renderSettingsSheet();
  };
  $("#cfg-stw-add").addEventListener("click", stwAdd);
  $("#cfg-stw-neu").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); stwAdd(); } });
  document.querySelectorAll("[data-fkdel]").forEach(b => b.addEventListener("click", () => {
    leseSettings();
    state.config.fkStamm.splice(Number(b.dataset.fkdel), 1);
    save(); renderSettingsSheet();
  }));
  const fkAdd = () => {
    const name = $("#cfg-fk-name").value.trim();
    const funkruf = $("#cfg-fk-funkruf").value.trim();
    if(!name && !funkruf){ $("#cfg-fk-name").focus(); return; }
    fkStammHinzufuegen({ name, funktion:$("#cfg-fk-funktion").value.trim(),
      funkrufname:funkruf, einheit:$("#cfg-fk-einheit").value.trim(), org:"FW" });
    leseSettings();
    save(); renderSettingsSheet();
  };
  $("#cfg-fk-add").addEventListener("click", fkAdd);
  ["cfg-fk-name","cfg-fk-funktion","cfg-fk-funkruf","cfg-fk-einheit"].forEach(id =>
    $("#"+id).addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); fkAdd(); } }));
  $("#cfg-save").addEventListener("click", () => {
    leseSettings();
    markChange(); closeEditor(); render();
  });
  // Backups laden + Wiederherstellung (nur mit ELW-Server)
  const bHost = $("#cfg-backups");
  if(bHost){
    const fmtGroesse = b => b > 1e6 ? (b/1e6).toFixed(1)+" MB" : Math.max(1, Math.round(b/1024))+" KB";
    fetch("./api/backups", { cache:"no-store" }).then(r => r.json()).then(d => {
      const liste = (d.backups || []);
      if(!liste.length){ bHost.innerHTML = `<p class="hint" style="margin:6px 4px">Noch keine Sicherungen vorhanden.</p>`; return; }
      bHost.innerHTML = liste.map(b => `
        <div class="kat-row">
          <span>${fmtDatum(b.zeit)} ${fmtZeit(b.zeit)} Uhr <span style="color:var(--ink3)">· ${fmtGroesse(b.groesse)}</span></span>
          <button class="btn btn-ghost" data-restore="${esc(b.datei)}" style="min-height:34px;padding:4px 12px">Wiederherstellen</button>
        </div>`).join("");
      bHost.querySelectorAll("[data-restore]").forEach(btn => btn.addEventListener("click", async () => {
        const datei = btn.dataset.restore;
        if(!(await modalConfirm(`Diese Sicherung wiederherstellen?\n${datei}\n\nAlle verbundenen Geräte übernehmen diesen Stand.`, "Wiederherstellen", "Abbrechen"))) return;
        try{
          const res = await fetch("./api/restore", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ datei }) });
          if(!res.ok) throw new Error("HTTP " + res.status);
          closeEditor();
          await syncTick();   // Serverstand sofort übernehmen
          render();
          modalInfo("Sicherung wiederhergestellt. Verbundene Tablets übernehmen den Stand automatisch.");
        }catch(e){ modalInfo("Wiederherstellen fehlgeschlagen: " + (e.message||e)); }
      }));
    }).catch(() => { bHost.innerHTML = `<p class="hint" style="margin:6px 4px">Sicherungen nicht abrufbar.</p>`; });
  }
}

/* ---------------- Ansicht: Einsatz ---------------- */
function renderEinsatz(){
  const e = state.einsatz;
  const abRows = state.abschnitte.map(a => {
    const n = state.einheiten.filter(u => u.abschnitt === a.id).length;
    const funk = [a.ansprechpartner ? `AP ${a.ansprechpartner}` : "",
      gruppeStr(a.fuehrung), gruppeStr(a.arbeit)].filter(Boolean).join(" · ");
    return `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">${esc(a.name)}</div>
        <div class="a-s">${n} Einheit${n===1?"":"en"}${funk ? " · " + esc(funk) : ""}</div>
      </div>
      <button class="btn btn-ghost" data-abedit="${esc(a.id)}">Bearbeiten</button>
    </div>`;
  }).join("");
  const archiv = [...state.archiv].sort((a,b) => (b.ende||"").localeCompare(a.ende||""));
  const archList = archiv.length ? archiv.map(a => `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">${esc(a.einsatz.stichwort) || "Ohne Stichwort"}</div>
        <div class="a-s">${fmtDatum(a.ende)} · ${a.einheiten.length} Einheiten · ${a.fuehrung.length} Führungskräfte</div>
      </div>
      <button class="btn btn-ghost" data-aakt="${esc(a.id)}">Aktivieren</button>
      <button class="btn btn-ghost" data-aprint="${esc(a.id)}">Drucken</button>
      <button class="btn btn-danger-ghost" data-adel="${esc(a.id)}" aria-label="Archiveintrag löschen">✕</button>
    </div>`).join("") : `<p class="hint" style="margin:0">Noch keine abgeschlossenen Einsätze.</p>`;
  return `
  <div class="card">
    <h2>Einsatzstammdaten</h2>
    <div class="form-grid">
      <div class="field span2"><label for="f-stw">Einsatzstichwort</label>
        <input id="f-stw" data-ez="stichwort" list="stw-liste" autocomplete="off" value="${esc(e.stichwort)}" placeholder="z. B. B 4 – Brand Gewerbeanlage">
        <datalist id="stw-liste">${stichwortGruppen().flatMap(g => g.items).map(s => `<option value="${esc(s.text)}">`).join("")}</datalist>
        <p class="hint" style="margin:.4rem 0 0">Aus der Liste wählen oder frei eintippen. Stichwörter pflegen in den Einstellungen (Zahnrad).</p></div>
      <div class="field"><label for="f-ort">Einsatzort</label>
        <input id="f-ort" data-ez="ort" value="${esc(e.ort)}" placeholder="Straße, Ort"></div>
      <div class="field"><label for="f-obj">Objekt</label>
        <input id="f-obj" data-ez="objekt" value="${esc(e.objekt||"")}" placeholder="z. B. Klinikum Weiden"></div>
      <div class="field"><label for="f-beg">Alarmzeit</label>
        <input id="f-beg" data-ez="beginn" type="datetime-local" value="${esc(e.beginn)}"></div>
      <div class="field"><label for="f-ende">Einsatzende <span style="text-transform:none;font-weight:500">(wird beim Beenden gesetzt)</span></label>
        <input id="f-ende" data-ez="ende" type="datetime-local" value="${esc(e.ende||"")}"></div>
      <div class="field"><label for="f-el">Einsatzleiter</label>
        <input id="f-el" data-ez="leiter" value="${esc(e.leiter)}" placeholder="Name / Funktion"></div>
      <div class="field"><label for="f-lb">Nächste Lagebesprechung</label>
        <input id="f-lb" data-ez="lagebespr" type="time" class="mono" value="${esc(e.lagebespr||"")}"></div>
      <div class="field span2"><label for="f-br">Bereitstellungsraum</label>
        <input id="f-br" data-ez="bereitstellungsraum" value="${esc(e.bereitstellungsraum||"")}" placeholder="z. B. Parkplatz Süd, Volksfestplatz"></div>
      <div class="field span2" style="margin-bottom:0"><label for="f-bem">Bemerkungen</label>
        <textarea id="f-bem" data-ez="bemerkung" placeholder="Lage, Abschnitte, Besonderheiten …">${esc(e.bemerkung)}</textarea></div>
    </div>
  </div>
  <div class="card">
    <h2>Einsatzabschnitte</h2>
    <div class="field"><label for="f-ils-grp">Rufgruppe zur Leitstelle</label>
      <div style="display:flex;gap:8px;max-width:320px">
        <select id="f-ils-mode" style="width:100px;flex:none">
          <option value="TMO" ${(e.ilsGruppe||{}).mode!=="DMO"?"selected":""}>TMO</option>
          <option value="DMO" ${(e.ilsGruppe||{}).mode==="DMO"?"selected":""}>DMO</option>
        </select>
        <input id="f-ils-grp" class="mono" value="${esc((e.ilsGruppe||{}).gruppe||"")}" placeholder="z. B. 2772"></div></div>
    ${abRows || `<p class="hint" style="margin:0 0 12px">Noch keine Abschnitte – Einheiten lassen sich bei der Erfassung einem Abschnitt zuordnen.</p>`}
    <button class="btn btn-ghost btn-block" id="abAdd" style="margin-top:${abRows?"12px":"0"}">＋&nbsp; Abschnitt anlegen</button>
  </div>
  <div class="card">
    <h2>Fotodokumentation</h2>
    ${state.fotos.length ? `<div class="foto-grid">
      ${state.fotos.map(f => `<img src="${f.data}" alt="Einsatzfoto ${fmtZeit(f.zeit)}" data-foto="${esc(f.id)}">`).join("")}
    </div>` : ""}
    <button class="btn btn-ghost btn-block" id="fotoAdd">＋&nbsp; Foto aufnehmen / auswählen</button>
    <input type="file" id="fotoFile" accept="image/*" capture="environment" style="display:none">
    <p class="hint">Fotos werden mit Zeitstempel am Einsatz gespeichert (Schadenslage, Zwischenstände, Beweissicherung). Antippen für Notiz oder Löschen.</p>
  </div>
  <div class="card">
    <h2>Einsatzende</h2>
    <button class="btn btn-ghost btn-block" id="btnPrintNow" style="margin-bottom:10px">Bericht drucken (Zwischenstand)</button>
    <button class="btn btn-primary btn-block" id="btnEnde">Einsatz beenden &amp; archivieren</button>
    <p class="hint">Beim Beenden wird der Einsatz mit allen Einheiten und Führungskräften gespeichert und kann gedruckt werden (Browser-Druck → auch als PDF).</p>
  </div>
  <div class="card">
    <h2>Abgeschlossene Einsätze</h2>
    ${archList}
  </div>
  <div class="card">
    <h2>Sichern &amp; Übertragen</h2>
    <button class="btn btn-ghost btn-block" id="btnExport" style="margin-bottom:10px">Einsatz exportieren (Datei)</button>
    <button class="btn btn-ghost btn-block" id="btnImport">Einsatz importieren (Datei)</button>
    <input type="file" id="importFile" accept=".json,application/json" style="display:none">
    <p class="hint">Der komplette Einsatz (Kräfte, Abschnitte, Lagekarte, Funk, Besprechungen, Checklisten, Fotos)
    als Datei – für Backup, Gerätewechsel oder die Übergabe per USB-Stick vom Tablet zum ELW-Rechner.
    Beim Import wird der aktuell erfasste Einsatz ersetzt; Archiv und Einstellungen bleiben unberührt.</p>
  </div>
  <div class="card">
    <h2>Prototyp-Werkzeuge</h2>
    <button class="btn btn-ghost btn-block" id="btnDemo" style="margin-bottom:10px">Beispieldaten laden</button>
    <button class="btn btn-danger-ghost btn-block" id="btnReset">Aktuellen Einsatz verwerfen (ohne Archiv)</button>
  </div>`;
}
function wireEinsatz(){
  document.querySelectorAll("[data-ez]").forEach(inp => {
    inp.addEventListener("change", () => {
      state.einsatz[inp.dataset.ez] = inp.value;
      markChange(); renderHeader();
    });
  });
  const ilsMode = $("#f-ils-mode"), ilsGrp = $("#f-ils-grp");
  const saveIls = () => { state.einsatz.ilsGruppe = { mode: ilsMode.value, gruppe: ilsGrp.value.trim() }; markChange(); };
  if(ilsMode) ilsMode.addEventListener("change", saveIls);
  if(ilsGrp) ilsGrp.addEventListener("change", saveIls);
  $("#abAdd").addEventListener("click", () => openAbEditor(null));
  document.querySelectorAll("[data-abedit]").forEach(b =>
    b.addEventListener("click", () => openAbEditor(b.dataset.abedit)));
  $("#btnExport").addEventListener("click", exportEinsatz);
  $("#btnImport").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(file) importEinsatz(file);
    e.target.value = "";
  });
  $("#fotoAdd").addEventListener("click", () => $("#fotoFile").click());
  $("#fotoFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;
    resizeImage(file, 1280, data => {
      state.fotos.push({ id:uid(), zeit:new Date().toISOString(), data, notiz:"" });
      try{ markChange(); }catch(err){ modalInfo("Speicher voll – bitte alte Fotos löschen."); state.fotos.pop(); }
      render();
    });
  });
  document.querySelectorAll("[data-foto]").forEach(img =>
    img.addEventListener("click", () => openFotoSheet(img.dataset.foto)));
  $("#btnDemo").addEventListener("click", loadDemo);
  $("#btnReset").addEventListener("click", () => {
    modalConfirm("Aktuellen Einsatz wirklich verwerfen? Alle erfassten Kräfte gehen verloren (Archiv bleibt).").then(ok => { if(!ok) return;
      const keepArchiv = state.archiv, keepCfg = state.config;
      state = defaultState(); state.archiv = keepArchiv; state.config = keepCfg;
      state.einsatz.beginn = nowLocalInput();
      save(); render();
    });
  });
  $("#btnPrintNow").addEventListener("click", () =>
    doPrint({ einsatz:state.einsatz, einheiten:state.einheiten, fuehrung:state.fuehrung,
      abschnitte:state.abschnitte, funk:state.funk, besprechungen:state.besprechungen,
      anforderungen:state.anforderungen, checks:state.checks,
      asTraeger:state.asTraeger, asTrupps:state.asTrupps,
      lage:state.lage, fotos:state.fotos, ende:null }));
  $("#btnEnde").addEventListener("click", endeEinsatz);
  document.querySelectorAll("[data-aakt]").forEach(b =>
    b.addEventListener("click", () => aktiviereArchiv(b.dataset.aakt)));
  document.querySelectorAll("[data-aprint]").forEach(b => b.addEventListener("click", () => {
    const a = state.archiv.find(x => x.id === b.dataset.aprint);
    if(a) doPrint(a);
  }));
  document.querySelectorAll("[data-adel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diesen Archiveintrag wirklich löschen?").then(ok => { if(!ok) return;
      state.archiv = state.archiv.filter(x => x.id !== b.dataset.adel);
      markChange(); render();
    });
  }));
}
/* Einsatz als Datei sichern / einlesen – Backup, Gerätewechsel, „Sync per USB-Stick“ */
function exportEinsatz(){
  const data = {
    elwis: 1, exportiert: new Date().toISOString(), ugName: state.config.ugName,
    einsatz: state.einsatz, einheiten: state.einheiten, fuehrung: state.fuehrung,
    abschnitte: state.abschnitte, lage: state.lage, funk: state.funk,
    besprechungen: state.besprechungen, anforderungen: state.anforderungen,
    checks: state.checks, fotos: state.fotos,
    asTraeger: state.asTraeger, asTrupps: state.asTrupps,
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const stw = (state.einsatz.stichwort || "einsatz").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 40);
  a.download = `ELWIS_${stw}_${fmtDateInput(new Date().toISOString())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
}
function importEinsatz(file){
  const rd = new FileReader();
  rd.onload = async () => {
    try{
      const d = JSON.parse(rd.result);
      if(!d || d.elwis !== 1 || !d.einsatz) throw new Error("kein ELWIS-Export");
      const wer = [d.einsatz.stichwort || "ohne Stichwort", d.ugName ? `(${d.ugName})` : "",
        d.exportiert ? `– exportiert ${fmtDatum(d.exportiert)} ${fmtZeit(d.exportiert)} Uhr` : ""].join(" ");
      if(!(await modalConfirm(`Einsatz „${wer}“ importieren?\nDer aktuell erfasste Einsatz wird ersetzt (Archiv und Einstellungen bleiben).`))) return;
      state.einsatz = d.einsatz;
      state.einheiten = d.einheiten || [];
      state.fuehrung = d.fuehrung || [];
      state.abschnitte = d.abschnitte || [];
      state.lage = (d.lage && Array.isArray(d.lage.items)) ? d.lage : { items: [], bg: "", snapshots: [] };
      state.lage.snapshots = state.lage.snapshots || [];
      state.funk = d.funk || [];
      state.besprechungen = d.besprechungen || [];
      state.anforderungen = d.anforderungen || [];
      state.checks = d.checks || [];
      state.fotos = d.fotos || [];
      state.asTraeger = d.asTraeger || [];
      state.asTrupps = d.asTrupps || [];
      state.einsatzId = uid(); state.einsatzStart = new Date().toISOString();
      try{ markChange(); }catch(err){
        state.fotos = []; state.lage.bg = "";
        markChange();
        modalInfo("Import gelungen, aber Fotos/Kartenhintergrund passten nicht in den lokalen Speicher und wurden weggelassen.");
      }
      render();
    }catch(err){
      modalInfo("Datei konnte nicht gelesen werden – ist das ein ELWIS-Export (.json)?");
    }
  };
  rd.readAsText(file);
}
function openFotoSheet(id){
  const f = state.fotos.find(x => x.id === id);
  if(!f) return;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Einsatzfoto">
    <div class="sheet-head">
      <h2>Foto · ${fmtDatum(f.zeit)} ${fmtZeit(f.zeit)} Uhr</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <img src="${f.data}" alt="Einsatzfoto" style="width:100%;border-radius:12px;margin-bottom:14px">
      <div class="field"><label for="foto-notiz">Notiz</label>
        <input id="foto-notiz" value="${esc(f.notiz||"")}" placeholder="z. B. Giebelwand Ostseite, Riss sichtbar" autocomplete="off"></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="foto-del">Löschen</button>
      <button class="btn btn-primary" id="foto-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#foto-del").addEventListener("click", () => {
    modalConfirm("Dieses Foto wirklich löschen?").then(ok => { if(!ok) return;
      state.fotos = state.fotos.filter(x => x.id !== f.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#foto-save").addEventListener("click", () => {
    f.notiz = $("#foto-notiz").value.trim();
    markChange(); closeEditor(); render();
  });
}
function baueArchivEintrag(){
  return {
    id: uid(), ende: new Date().toISOString(),
    einsatz: {...state.einsatz},
    einheiten: state.einheiten.map(u => ({...u})),
    fuehrung: state.fuehrung.map(f => ({...f})),
    abschnitte: state.abschnitte.map(a => ({...a})),
    funk: state.funk.map(f => ({...f})),
    besprechungen: state.besprechungen.map(b => ({...b})),
    anforderungen: state.anforderungen.map(a => ({...a})),
    checks: state.checks.map(c => ({...c, punkte:c.punkte.map(p => ({...p}))})),
    asTraeger: state.asTraeger.map(t => ({...t})),
    asTrupps: state.asTrupps.map(t => ({...t, memberIds:[...(t.memberIds||[])]})),
    lage: { bg: state.lage.bg, mode: state.lage.mode, mapView: state.lage.mapView, mapLayer: state.lage.mapLayer,
      items: state.lage.items.map(i => ({...i})),
      snapshots: state.lage.snapshots.map(s => ({...s, items: s.items.map(i => ({...i}))})) },
    fotos: state.fotos.map(f => ({...f})),
  };
}
/* Archivierten Einsatz wieder aktiv machen (aktueller Einsatz wird vorher archiviert) */
async function aktiviereArchiv(id){
  const a = state.archiv.find(x => x.id === id);
  if(!a) return;
  const hatInhalt = state.einheiten.length || state.funk.length || state.besprechungen.length ||
    state.lage.items.length || state.einsatz.stichwort;
  const frage = `Einsatz „${a.einsatz.stichwort || "ohne Stichwort"}“ wieder aktivieren?` +
    (hatInhalt ? "\nDer aktuell erfasste Einsatz wird dabei automatisch archiviert." : "");
  if(!(await modalConfirm(frage, "Aktivieren"))) return;
  if(hatInhalt) state.archiv.push(baueArchivEintrag());
  state.archiv = state.archiv.filter(x => x.id !== id);
  state.einsatz = {...a.einsatz};
  state.einheiten = (a.einheiten || []).map(x => ({...x}));
  state.fuehrung = (a.fuehrung || []).map(x => ({...x}));
  state.abschnitte = (a.abschnitte || []).map(x => ({...x}));
  state.funk = (a.funk || []).map(x => ({...x}));
  state.besprechungen = (a.besprechungen || []).map(x => ({...x}));
  state.anforderungen = (a.anforderungen || []).map(x => ({...x}));
  state.checks = (a.checks || []).map(c => ({...c, punkte:(c.punkte || []).map(p => ({...p}))}));
  state.lage = a.lage
    ? { bg: a.lage.bg || "", items: (a.lage.items || []).map(x => ({...x})),
        snapshots: (a.lage.snapshots || []).map(s => ({...s, items:(s.items || []).map(x => ({...x}))})) }
    : { items: [], bg: "", snapshots: [] };
  state.fotos = (a.fotos || []).map(x => ({...x}));
  state.asTraeger = (a.asTraeger || []).map(x => ({...x}));
  state.asTrupps = (a.asTrupps || []).map(x => ({...x, memberIds:[...(x.memberIds||[])]}));
  // Neue Sync-Identität: der reaktivierte Einsatz wird zum aktuellen (auch am Server)
  state.einsatzId = uid();
  state.einsatzStart = new Date().toISOString();
  markChange(); render();
}
async function endeEinsatz(){
  if(!state.einheiten.length && !state.einsatz.stichwort){
    modalInfo("Es ist kein Einsatz mit Daten vorhanden."); return;
  }
  if(!(await modalConfirm("Einsatz jetzt beenden? Er wird archiviert und die Erfassung geleert."))) return;
  state.einsatz.ende = nowLocalInput();   // Einsatzende auf jetzt setzen (wird mit archiviert/gedruckt)
  const entry = baueArchivEintrag();
  state.archiv.push(entry);
  state.einsatzId = uid(); state.einsatzStart = new Date().toISOString();
  state.einsatz = { stichwort:"", ort:"", objekt:"", beginn:nowLocalInput(), ende:"", leiter:"", bereitstellungsraum:"", bemerkung:"", ilsGruppe:{mode:"TMO",gruppe:"2772"} };
  state.einheiten = []; state.fuehrung = []; state.abschnitte = [];
  state.lage = { items: [], bg: "", snapshots: [], mode: "raster", mapView: null, mapLayer: "luftbild" };
  state.funk = []; state.besprechungen = [];
  state.anforderungen = []; state.checks = []; state.fotos = [];
  state.asTraeger = []; state.asTrupps = [];
  try{ markChange(); }catch(err){
    // Speicher voll: Bilder aus dem Archiveintrag entfernen und erneut versuchen
    entry.fotos = []; entry.lage.bg = ""; entry.lage.snapshots = [];
    try{ markChange(); modalInfo("Archiviert – Fotos/Kartenbilder passten nicht in den lokalen Speicher und wurden im Archiv weggelassen (vorher exportieren sichert alles)."); }
    catch(e2){ state.archiv.pop(); markChange(); modalInfo("Lokaler Speicher voll – Einsatz konnte nicht archiviert werden. Bitte erst exportieren oder alte Archiveinträge löschen."); return; }
  }
  render();
  if(await modalConfirm("Einsatz archiviert. Bericht jetzt drucken?", "Drucken", "Später")) doPrint(entry);
}
function loadDemo(){
  const t = (minAgo) => new Date(Date.now() - minAgo*60000).toISOString();
  const a1 = uid(), a2 = uid();
  const lbT = new Date(Date.now() + 30*60000);
  state.einsatz = {
    stichwort:"B4 – Brand Lagerhalle", ort:"Industriestraße 12, Weiden", objekt:"Lagerhalle Nord", ende:"",
    beginn: nowLocalInput(), leiter:"KBI Mustermann", bemerkung:"Zwei Abschnitte gebildet",
    lagebespr: `${String(lbT.getHours()).padStart(2,"0")}:${String(lbT.getMinutes()).padStart(2,"0")}`,
  };
  state.abschnitte = [
    { id:a1, name:"Abschnitt 1 – Brandbekämpfung",  ansprechpartner:"Florian Weiden 3/1",      fuehrung:{mode:"TMO",gruppe:"2901"}, arbeit:{mode:"DMO",gruppe:"307_F"} },
    { id:a2, name:"Abschnitt 2 – Wasserversorgung", ansprechpartner:"Florian Rothenstadt 10/1", fuehrung:{mode:"TMO",gruppe:"2902"}, arbeit:{mode:"DMO",gruppe:"308_F"} },
  ];
  state.einheiten = [
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"40/1", f:0,u:1,m:8, agt:4, ankunft:t(42), abgerueckt:false, abschnitt:a1 },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"30/1", f:1,u:0,m:2, agt:0, ankunft:t(40), abgerueckt:false, abschnitt:"" },
    { id:uid(), org:"FW",  name:"Florian Rothenstadt", kennung:"42/1", f:0,u:1,m:5, agt:2, ankunft:t(31), abgerueckt:false, abschnitt:a2 },
    { id:uid(), org:"BRK", name:"RK Weiden",           kennung:"71/1", f:0,u:1,m:1, agt:0, ankunft:t(28), abgerueckt:false, abschnitt:"" },
    { id:uid(), org:"POL", name:"Donau",               kennung:"23/1", f:0,u:0,m:2, agt:0, ankunft:t(25), abgerueckt:false, abschnitt:"" },
    { id:uid(), org:"THW", name:"Heros Weiden",        kennung:"21/25",f:0,u:1,m:3, agt:0, ankunft:t(12), abgerueckt:false, abschnitt:a2 },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"11/1", f:1,u:1,m:1, agt:0, ankunft:t(45), abgerueckt:true,  abschnitt:"" },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"1/23/1", f:0,u:1,m:2, agt:2, ankunft:t(6), abgerueckt:false, abschnitt:"BR" },
  ];
  state.anforderungen = [
    { id:uid(), was:"DLK 23/12",              status:"alarmiert",   angefordert:t(28), alarmiert:t(24), eingetroffen:"" },
    { id:uid(), was:"Löschzug FF Nachbarort", status:"angefordert", angefordert:t(10), alarmiert:"",    eingetroffen:"" },
  ];
  state.checks = [
    { id:uid(), name:"Einsatzleiter – Erstmaßnahmen", punkte:[
      { text:"Lage erkunden",                     done:true,  zeit:t(41) },
      { text:"Rückmeldung an Leitstelle",         done:true,  zeit:t(38) },
      { text:"Einsatzstelle absichern",           done:true,  zeit:t(35) },
      { text:"Bereitstellungsraum festlegen",     done:true,  zeit:t(26) },
      { text:"Abschnitte bilden",                 done:true,  zeit:t(24) },
      { text:"Atemschutzüberwachung sicherstellen", done:false, zeit:"" },
      { text:"Lagekarte anlegen",                 done:true,  zeit:t(18) },
      { text:"Presse/Behörden informieren",       done:false, zeit:"" },
      { text:"Lagebesprechung ansetzen",          done:true,  zeit:t(21) },
    ]},
  ];
  state.fotos = [];
  state.fuehrung = [
    { id:uid(), org:"FW",  name:"KBI Mustermann", funktion:"Einsatzleiter",            einheit:"" },
    { id:uid(), org:"FW",  name:"ZF Huber",       funktion:"Abschnittsleiter",         einheit:"Abschnitt 1" },
    { id:uid(), org:"BRK", name:"H. Meier",       funktion:"Organisatorischer Leiter", einheit:"" },
    { id:uid(), org:"THW", name:"S. Schmidt",     funktion:"Fachberater THW",          einheit:"" },
  ];
  const lf = state.einheiten[0], tlf = state.einheiten[2];
  state.lage = { bg:"", snapshots:[], items: [
    { id:uid(), type:"sym", sym:"brand3", label:"Lagerhalle", x:50, y:34 },
    { id:uid(), type:"car",     num:1, unitId:lf.id,  x:34, y:52 },
    { id:uid(), type:"car",     num:2, unitId:tlf.id, x:66, y:56 },
    { id:uid(), type:"el",      label:"ELW 1",       x:16, y:82 },
    { id:uid(), type:"wasser",  label:"Hydrant",     x:82, y:22 },
    { id:uid(), type:"gefahr",  label:"Gasflaschen", x:60, y:24 },
    { id:uid(), type:"num", num:1, text:"Faltbehälter 10.000 Liter",        x:24, y:30 },
    { id:uid(), type:"num", num:2, text:"Bereitstellungsraum Parkplatz Süd", x:78, y:78 },
  ]};
  state.funk = [
    { id:uid(), zeit:t(38), von:"Florian Weiden 40/1", an:"ELW",
      text:"Ankunft Einsatzstelle, Erkundung läuft.", wichtig:false },
    { id:uid(), zeit:t(30), von:"Florian Weiden 40/1", an:"ELW",
      text:"Lagemeldung: Vollbrand Lagerhalle, zwei Trupps unter PA im Innenangriff. Nachforderung: 1 Löschzug, Drehleiter.", wichtig:true },
    { id:uid(), zeit:t(22), von:"ELW", an:"Leitstelle",
      text:"Nachforderung Löschzug + DLK 23/12 bestätigt, Abschnittsbildung eingeleitet.", wichtig:false },
    { id:uid(), zeit:t(8),  von:"Heros Weiden 21/25", an:"ELW",
      text:"Bereitstellungsraum Parkplatz Süd bezogen.", wichtig:false },
  ];
  state.besprechungen = [
    { id:uid(), zeit:t(20), teilnehmer:"EL, AL 1, AL 2, OrgL",
      protokoll:"Lage: Vollbrand Lagerhalle, Ausbreitung auf Nachbargebäude verhindert.\nBeschluss: Abschnitt 2 verstärkt Wasserversorgung über Faltbehälter.\nAuftrag: THW prüft Statik Giebelwand.\nNächste Besprechung 30 min." },
  ];
  markChange(); render();
}

/* ---------------- Ansicht: Kräfte ---------------- */
function renderKraefte(){
  const act = aktive(), s = summen(act);
  const offeneAf = state.anforderungen.filter(a => a.status !== "eingetroffen").length;
  const seg = `
  <div class="seg" role="tablist">
    <button role="tab" data-ksub="einheiten" class="${state.ksub==="einheiten"?"active":""}">Einheiten (${state.einheiten.length})</button>
    <button role="tab" data-ksub="fuehrung" class="${state.ksub==="fuehrung"?"active":""}">Führungskräfte (${state.fuehrung.length})</button>
    <button role="tab" data-ksub="anford" class="${state.ksub==="anford"?"active":""}">Anforderungen (${offeneAf})</button>
  </div>`;
  if(state.ksub === "anford"){
    const list = [...state.anforderungen].sort((a,b) =>
      (a.status==="eingetroffen"?1:0)-(b.status==="eingetroffen"?1:0) ||
      (b.angefordert||"").localeCompare(a.angefordert||""));
    const items = list.length ? `<div class="fs-list">${list.map(a => {
      const abN = (state.abschnitte.find(x => x.id === a.abschnitt) || {}).name;
      return `
      <button class="fs-item ${a.status!=="eingetroffen"?"imp":""}" data-editaf="${esc(a.id)}" ${a.status==="eingetroffen"?'style="opacity:.55"':""}>
        <div class="fs-head">
          <span class="fs-zeit mono">${fmtZeit(a.angefordert)}</span>
          <span class="chip chip-st-${esc(a.status)}">${esc(a.status)}</span>
          ${a.alarmiert ? `<span class="mono">alarmiert ${fmtZeit(a.alarmiert)}</span>` : ""}
          ${a.eingetroffen ? `<span class="mono">eingetroffen ${fmtZeit(a.eingetroffen)}</span>` : ""}
        </div>
        <div class="fs-text">${esc(a.was)}${abN ? ` <span style="color:var(--ink2)">· Abschnitt: ${esc(abN)}</span>` : ""}</div>
      </button>`;
    }).join("")}</div>`
    : `<div class="empty"><p>Keine offenen Anforderungen.<br>Nachgeforderte Kräfte hier verfolgen: angefordert → alarmiert → eingetroffen.</p></div>`;
    return `${seg}
      <button class="btn btn-primary btn-block" id="btnAddAf" style="margin-bottom:16px">＋&nbsp; Kräfte nachfordern</button>
      ${items}`;
  }
  if(state.ksub === "fuehrung"){
    const fkSort = [...state.fuehrung].sort((a,b) => (a.name||"").localeCompare(b.name||"", "de"));
    const list = fkSort.length
      ? `<div class="unit-list">${fkSort.map(fkCard).join("")}</div>`
      : `<div class="empty"><p>Noch keine Führungskräfte erfasst.<br>Einsatzleiter, Abschnittsleiter, Zugführer … aller Organisationen.</p></div>`;
    return `${seg}
      <button class="btn btn-primary btn-block" id="btnAddFk" style="margin-bottom:16px">＋&nbsp; Führungskraft erfassen</button>
      ${list}`;
  }
  const sorted = [...state.einheiten].sort((a,b) =>
    (a.abgerueckt?1:0)-(b.abgerueckt?1:0) || fullName(a).localeCompare(fullName(b), "de"));
  let list;
  if(!sorted.length){
    list = `<div class="empty">
      <p>Noch keine Kräfte erfasst.<br>Mit dem Tablet von Fahrzeug zu Fahrzeug – auch komplett offline.</p>
      <button class="btn btn-ghost" id="btnDemo2">Beispieldaten laden</button>
    </div>`;
  }else if(state.abschnitte.length || sorted.some(u => u.abschnitt === "BR")){
    const groups = [...state.abschnitte, { id:"BR", name:"Bereitstellungsraum" }, { id:"", name:"Ohne Abschnitt" }];
    list = groups.map(g => {
      const us = sorted.filter(u => (u.abschnitt||"") === g.id);
      if(!us.length) return "";
      const funk = [gruppeStr(g.fuehrung), gruppeStr(g.arbeit)].filter(Boolean).join(" · ");
      return `<h3 class="group-h">${esc(g.name)} <span>· ${us.length}${funk ? " · " + esc(funk) : ""}</span></h3>
        <div class="unit-list">${us.map(unitCard).join("")}</div>`;
    }).join("");
  }else{
    list = `<div class="unit-list">${sorted.map(unitCard).join("")}</div>`;
  }
  return `
  <div class="statstrip" role="status" aria-label="Summen">
    <div class="stat"><div class="k">Gesamtstärke</div><div class="v mono">${s.f+s.u+s.m}</div><div class="s mono">${s.f}/${s.u}/${s.m}</div></div>
    <div class="stat"><div class="k">AGT / CSA</div><div class="v mono">${s.agt} / ${s.csa}</div><div class="s">Atemschutz</div></div>
    <div class="stat"><div class="k">Einheiten</div><div class="v mono">${act.length}</div><div class="s">an E-Stelle</div></div>
  </div>
  ${seg}
  <button class="btn btn-primary btn-block" id="btnAdd" style="margin-bottom:${state.ksub==="einheiten"?"8px":"16px"}">＋&nbsp; Kraft erfassen</button>
  ${state.ksub==="einheiten" ? `<button class="btn btn-ghost btn-block" id="btnOcr" style="margin-bottom:16px">📷&nbsp; Fahrzeuge aus Alarm-Foto einlesen</button>` : ""}
  ${list}`;
}
function unitCard(u){
  const org = ORGS[u.org] || ORGS.SON;
  return `
  <button class="unit org-${esc(u.org)} ${u.abgerueckt?"left":""}" data-edit="${esc(u.id)}">
    <div class="u-main">
      <div class="u-name">${esc(fullName(u)) || "<span style='color:var(--ink3)'>ohne Rufname</span>"}</div>
      <div class="u-meta">
        <span class="chip chip-${esc(u.org)}">${esc(org.short)}</span>
        ${u.agt>0 ? `<span class="badge-agt">AGT ${u.agt}</span>` : ""}
        ${u.csa>0 ? `<span class="badge-agt">CSA ${u.csa}</span>` : ""}
        <span class="mono">${fmtZeit(u.ankunft)}</span>
        ${u.abgerueckt ? "<span>abgerückt</span>" : ""}
        ${u.tatsaechlich === false ? `<span class="badge-schaetz">~ Schätzung</span>` : ""}
      </div>
    </div>
    <div class="u-staerke mono">${staerkeStr(u)}<span class="lbl">Stärke</span></div>
  </button>`;
}
function fkCard(f){
  const org = ORGS[f.org] || ORGS.SON;
  return `
  <button class="unit org-${esc(f.org)}" data-editfk="${esc(f.id)}">
    <div class="u-main">
      <div class="u-name sans">${esc(f.name) || "<span style='color:var(--ink3)'>ohne Name</span>"}</div>
      <div class="u-meta">
        <span class="chip chip-${esc(f.org)}">${esc(org.short)}</span>
        <span>${esc(f.funktion)}</span>
        ${f.funkrufname ? `<span class="mono">· ${esc(f.funkrufname)}</span>` : ""}
        ${f.einheit ? `<span>· ${esc(f.einheit)}</span>` : ""}
      </div>
    </div>
  </button>`;
}
function wireKraefte(){
  document.querySelectorAll("[data-ksub]").forEach(b =>
    b.addEventListener("click", () => { state.ksub = b.dataset.ksub; save(); render(); }));
  const add = $("#btnAdd");   if(add) add.addEventListener("click", () => openEditor(null));
  const ocr = $("#btnOcr");   if(ocr) ocr.addEventListener("click", openOcrAssistent);
  const addFk = $("#btnAddFk"); if(addFk) addFk.addEventListener("click", () => openFkEditor(null));
  const addAf = $("#btnAddAf"); if(addAf) addAf.addEventListener("click", () => openAfEditor(null));
  document.querySelectorAll("[data-editaf]").forEach(el =>
    el.addEventListener("click", () => openAfEditor(el.dataset.editaf)));
  const demo = $("#btnDemo2"); if(demo) demo.addEventListener("click", loadDemo);
  document.querySelectorAll("[data-edit]").forEach(el =>
    el.addEventListener("click", () => openEditor(el.dataset.edit)));
  document.querySelectorAll("[data-editfk]").forEach(el =>
    el.addEventListener("click", () => openFkEditor(el.dataset.editfk)));
}

/* ---------------- Offline-OCR: Fahrzeuge aus Alarm-Foto ----------------
   Tesseract.js läuft lokal (public/vendor/tesseract), ganz ohne Cloud. Aus dem gelesenen
   Text werden Fahrzeug-Kandidaten (v. a. Funkkennungen) gezogen, gegen den Fahrzeugkatalog
   gematcht und in einem Fenster gezeigt – einzeln per ✕ entfernbar, dann als Einheiten übernehmen. */
let tessWorkerP = null;
function ladeTesseract(){
  if(window.Tesseract) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "./vendor/tesseract/tesseract.min.js";
    s.onload = () => res(); s.onerror = () => rej(new Error("Tesseract nicht ladbar"));
    document.head.appendChild(s);
  });
}
async function tessWorker(){
  await ladeTesseract();
  if(!tessWorkerP){
    tessWorkerP = window.Tesseract.createWorker("deu", 1, {
      workerPath: "./vendor/tesseract/worker.min.js",
      corePath:   "./vendor/tesseract/",
      langPath:   "./vendor/tesseract/",
      gzip: true,
      logger: m => { const el = $("#ocr-progress"); if(el && m && m.status) el.textContent =
        (m.status === "recognizing text" ? "Lese Text" : m.status) + (m.progress ? ` ${Math.round(m.progress*100)} %` : "…"); },
    });
  }
  return tessWorkerP;
}
function ladePdfJs(){
  if(window.pdfjsLib) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "./vendor/pdfjs/pdf.min.js";
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdfjs/pdf.worker.min.js"; res(); };
    s.onerror = () => rej(new Error("pdf.js nicht ladbar"));
    document.head.appendChild(s);
  });
}
// PDF → ein Canvas je Seite (für die OCR)
async function pdfSeiten(file){
  await ladePdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  const seiten = [];
  for(let p = 1; p <= pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 2 });   // 2× für bessere OCR-Qualität
    const c = document.createElement("canvas");
    c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    seiten.push(c);
  }
  return seiten;
}
function ocrKandidaten(text){
  // Fahrzeugzeilen „… <Funkruf> <Ort> <Funkkennung>": FL = Florian (Löschfahrzeug), Kater = ELW.
  // Danach Ort, danach Kennung. Alle anderen Zeilen werden ignoriert.
  const RE = /\b(F[LI1]|Kater)\b\s+([A-Za-zÄÖÜäöüß.\-]+(?:\s+[A-Za-zÄÖÜäöüß.\-]+){0,2})\s+(\d{1,2}\/\d{1,2}(?:\/\d{1,3})?)/i;
  const out = [];
  (text || "").split(/\r?\n/).forEach(line => {
    const l = line.replace(/\s+/g, " ").trim();
    const m = l.match(RE);
    if(!m) return;
    const funk = /^kater/i.test(m[1]) ? "Kater" : "Florian";
    const ort = m[2].trim();
    out.push({ raw: l, ort, kennung: m[3], name: `${funk} ${ort}`.trim() });
  });
  return out;
}
// Default-Besatzung (Schätzung) aus der Funkkennung. Typ-Zahl = zweitletzte Ziffernstelle
// (z. B. 1/40/2 → 40, 46/1 → 46). < 10 ⇒ Führungskraft. Personenzahl je Typ-Bereich:
// 40–43 → 9 (Gruppe), 44–49 → 6 (Staffel), sonst 3 (Trupp).
function defaultBesatzung(kennung){
  const teile = String(kennung || "").split("/").map(x => parseInt(x, 10)).filter(n => !isNaN(n));
  if(teile.length < 2) return null;
  const typ = teile[teile.length - 2];
  if(!(typ >= 0)) return null;
  if(typ < 10) return { fuehrung: true };
  const total = (typ >= 40 && typ <= 43) ? 9 : (typ >= 44 && typ <= 49) ? 6 : 3;
  return { fuehrung: false, f: 0, u: 1, m: total - 1, total };
}
function ocrKatalogTreffer(kennung){
  if(!kennung) return null;
  const norm = s => (s || "").replace(/\s/g, "").toLowerCase();
  return (state.config.katalog || []).find(k => k.kennung && norm(k.kennung) === norm(kennung)) || null;
}
let ocrList = [];   // { raw, kennung, kat }
function ocrMerge(kandidaten){
  const norm = s => (s || "").replace(/\s/g, "").toLowerCase();
  for(const c of kandidaten){
    const key = c.kennung ? "k:" + norm(c.kennung) : "r:" + norm(c.raw);
    if(ocrList.some(x => (x.kennung ? "k:" + norm(x.kennung) : "r:" + norm(x.raw)) === key)) continue;
    c.kat = ocrKatalogTreffer(c.kennung);
    ocrList.push(c);
  }
}
// Live-Kamera (getUserMedia) – öffnet direkt die Kamera; Fallback auf native Kamera/Datei
async function ocrKamera(){
  const mm = navigator.mediaDevices;
  if(!mm || !mm.getUserMedia || !window.isSecureContext){ $("#ocr-cam").click(); return; }  // http-LAN → native Kamera
  let stream;
  try{ stream = await mm.getUserMedia({ video:{ facingMode:{ ideal:"environment" },
    width:{ ideal:1920 }, height:{ ideal:1080 } }, audio:false }); }
  catch(e){ $("#ocr-cam").click(); return; }  // kein Zugriff → Fallback
  const host = document.createElement("div");
  host.className = "cam-overlay";
  host.innerHTML = `
    <video autoplay playsinline muted></video>
    <div class="cam-bar">
      <button class="btn btn-ghost" data-cam="x">Abbrechen</button>
      <button class="btn btn-primary" data-cam="shot" disabled>Kamera startet …</button>
    </div>`;
  document.body.appendChild(host);
  const video = host.querySelector("video");
  const shotBtn = host.querySelector('[data-cam="shot"]');
  video.srcObject = stream;
  try{ await video.play(); }catch(e){}
  // Auslöser erst freigeben, wenn das Videobild wirklich läuft (sonst leeres/schwarzes Foto)
  const bereit = () => { if(video.videoWidth > 0){ shotBtn.disabled = false; shotBtn.textContent = "📷 Auslösen"; } };
  video.addEventListener("loadedmetadata", bereit);
  video.addEventListener("playing", bereit);
  setTimeout(bereit, 800);
  const stop = () => { try{ stream.getTracks().forEach(t => t.stop()); }catch(e){} host.remove(); };
  host.querySelector('[data-cam="x"]').addEventListener("click", stop);
  shotBtn.addEventListener("click", async () => {
    if(!video.videoWidth){ return; }
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    stop();
    const setProg = t => { const el = $("#ocr-progress"); if(el) el.textContent = t; };
    try{
      setProg("Foto wird gelesen … ");
      const w = await tessWorker();
      const { data } = await w.recognize(c);
      const kand = ocrKandidaten(data.text);
      ocrMerge(kand); renderOcrSheet(); setProg("");
      if(!kand.length) modalInfo("Kein Fahrzeug erkannt. Foto näher/schärfer halten (Funkkennung muss lesbar sein) – oder „Datei / PDF wählen“.");
    }catch(err){ setProg(""); modalInfo("Einlesen nicht möglich: " + (err.message || err)); }
  });
}
function openOcrAssistent(){ ocrList = []; renderOcrSheet(); }
function renderOcrSheet(){
  const rows = ocrList.map((c, i) => {
    const kat = c.kat;
    const label = kat ? katalogLabel(kat) : `${c.name || "Florian"}${c.kennung ? " " + c.kennung : ""}`;
    const schonDa = kat && state.einheiten.some(u => (u.kennung||"").replace(/\s/g,"") === (kat.kennung||"").replace(/\s/g,"") && !u.abgerueckt);
    const tag = kat ? (schonDa ? `<span class="ocr-tag da">bereits erfasst</span>` : `<span class="ocr-tag ok">im Katalog</span>`)
                    : `<span class="ocr-tag neu">neu</span>`;
    return `<div class="kat-row">
      <span>${esc(label)} ${tag}</span>
      <button class="kat-x" data-ocrdel="${i}" aria-label="Entfernen">✕</button>
    </div>`;
  }).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Fahrzeuge aus Alarm-Foto">
    <div class="sheet-head"><h2>Fahrzeuge aus Alarm-Foto</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field">
        <label>Alarm-Foto / Screenshot / Fax-PDF</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary" id="ocr-cam-btn">📷&nbsp; Foto aufnehmen</button>
          <button type="button" class="btn btn-ghost" id="ocr-file-btn">Datei / PDF wählen</button>
        </div>
        <input id="ocr-cam" type="file" accept="image/*" capture="environment" style="display:none">
        <input id="ocr-file" type="file" accept="image/*,application/pdf" multiple style="display:none">
        <p class="hint">Läuft offline auf dem Gerät. Kamera (Tablet) oder Bilder <em>und PDF-Alarmfaxe</em> (alle Seiten); mehrere Dateien werden zusammengeführt (Doppelte fallen weg). Erkannte Fahrzeuge unten per ✕ entfernen. <span id="ocr-progress"></span></p>
      </div>
      <div class="field"><label style="margin-bottom:8px">Erkannte Fahrzeuge (${ocrList.length})</label>
        <div class="kat-list" id="ocr-list">${rows || `<p class="hint" style="margin:6px 4px">Noch nichts eingelesen – Bild wählen.</p>`}</div>
      </div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary" id="ocr-add" style="flex:1"${ocrList.length ? "" : " disabled"}>Als Einheiten übernehmen (${ocrList.length})</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-ocrdel]").forEach(b => b.addEventListener("click", () => {
    ocrList.splice(Number(b.dataset.ocrdel), 1); renderOcrSheet();
  }));
  $("#ocr-cam-btn").addEventListener("click", ocrKamera);
  $("#ocr-file-btn").addEventListener("click", () => $("#ocr-file").click());
  const verarbeite = async e => {
    const files = [...e.target.files]; if(!files.length) return;
    const setProg = t => { const el = $("#ocr-progress"); if(el) el.textContent = t; };
    try{
      const w = await tessWorker();
      for(let i = 0; i < files.length; i++){
        const f = files[i], istPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
        if(istPdf){
          setProg(`Datei ${i+1}/${files.length}: PDF wird gelesen … `);
          const seiten = await pdfSeiten(f);
          for(let s = 0; s < seiten.length; s++){
            setProg(`Datei ${i+1}/${files.length}: Seite ${s+1}/${seiten.length} … `);
            const { data } = await w.recognize(seiten[s]);
            ocrMerge(ocrKandidaten(data.text)); renderOcrSheet();
          }
        }else{
          setProg(`Datei ${i+1}/${files.length} … `);
          const { data } = await w.recognize(f);
          ocrMerge(ocrKandidaten(data.text)); renderOcrSheet();
        }
      }
      setProg("");
    }catch(err){
      setProg("");
      modalInfo("Einlesen nicht möglich: " + (err.message || err));
    }
  };
  $("#ocr-cam").addEventListener("change", verarbeite);
  $("#ocr-file").addEventListener("change", verarbeite);
  $("#ocr-add").addEventListener("click", () => {
    let nE = 0, nF = 0;
    for(const c of ocrList){
      const k = c.kat, bes = defaultBesatzung(c.kennung);
      if(bes && bes.fuehrung){
        // Erster Kennungswert < 10 → Führungskraft (Schätzung, tatsächlich noch nicht bestätigt)
        state.fuehrung.push({ id:uid(), org:"FW", name:c.name || "", funktion:"",
          funkrufname:[c.name, c.kennung].filter(Boolean).join(" "), einheit:"", tatsaechlich:false });
        nF++;
      }else{
        const crew = bes ? { f:bes.f, u:bes.u, m:bes.m }
          : (k ? { f:k.f|0, u:k.u|0, m:k.m|0 } : { f:0, u:1, m:2 });
        state.einheiten.push({ id:uid(), org: k ? (k.org||"FW") : "FW",
          name: k ? k.name : (c.name || "Florian"), kennung: k ? k.kennung : (c.kennung || ""),
          f:crew.f, u:crew.u, m:crew.m, agt: k ? (k.agt|0) : 0, csa: k ? (k.csa|0) : 0,
          ankunft:new Date().toISOString(), abgerueckt:false, abschnitt:"", tatsaechlich:false });
        nE++;
      }
    }
    markChange(); closeEditor(); render();
    modalInfo(`Übernommen als Schätzung: ${nE} Fahrzeug${nE===1?"":"e"}` + (nF ? `, ${nF} Führungskraft/-kräfte` : "") +
      `.\nDie Personalstärke ist ein Schätzwert – bitte je Einheit prüfen und über „Stärke bestätigt" bestätigen.`);
  });
}

/* ---------------- Editor: Einheit ---------------- */
function openEditor(id, prefill){
  if(id){
    const u = state.einheiten.find(x => x.id === id);
    if(!u) return;
    editing = { unit: {...u}, isNew:false };
    if(editing.unit.csa == null) editing.unit.csa = 0;
  }else{
    editing = { unit: { id:uid(), org:"FW", name:pfx("FW"), kennung:"", f:0, u:1, m:8, agt:0, csa:0,
      ankunft:new Date().toISOString(), abgerueckt:false, abschnitt:"", tatsaechlich:true, ...(prefill||{}) }, isNew:true };
  }
  renderSheet();
}
function closeEditor(){
  editing = null; editingFk = null; editingAb = null;
  if(lgSnapObj){ try{ lgSnapObj.remove(); }catch(e){} lgSnapObj = null; }
  $("#sheetHost").innerHTML = "";
}

function orgPickHtml(current){
  return Object.entries(ORGS).map(([key,o]) => `
    <button data-org="${key}" style="--oc:var(${o.cssVar})" aria-pressed="${current===key}">
      ${o.short}<small>${esc(o.label)}</small>
    </button>`).join("");
}
function renderSheet(){
  if(!editing){ $("#sheetHost").innerHTML = ""; return; }
  const u = editing.unit;
  const stepper = (field, label, sub) => `
    <div class="stepper">
      <div class="st-label">${label}<small>${sub}</small></div>
      <button data-step="${field}:-1" aria-label="${label} verringern">−</button>
      <div class="st-val mono" data-val="${field}">${u[field]}</div>
      <button data-step="${field}:1" aria-label="${label} erhöhen">＋</button>
    </div>`;
  const abField = `
    <div class="field"><label>Einsatzabschnitt / Bereitstellung</label>
      <div class="abpick">
        <button data-ab="" aria-pressed="${!u.abschnitt}">Kein Abschnitt</button>
        <button data-ab="BR" aria-pressed="${u.abschnitt==="BR"}">Bereitstellungsraum</button>
        ${state.abschnitte.map(a => `
          <button data-ab="${esc(a.id)}" aria-pressed="${u.abschnitt===a.id}">${esc(a.name)}</button>`).join("")}
      </div>
    </div>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editing.isNew?"Kraft erfassen":"Kraft bearbeiten"}">
    <div class="sheet-head">
      <h2>${editing.isNew ? "Kraft erfassen" : "Kraft bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="e-katalog">Fahrzeugkatalog (Fuhrpark)</label>
        <select id="e-katalog">
          <option value="">– Fahrzeug wählen, füllt alles vor –</option>
          ${katalogListe().map(k => `<option value="${k._i}">${esc(katalogLabel(k))}</option>`).join("")}
        </select>
        <p class="hint">Neue Fahrzeuge landen automatisch im Katalog; verwalten (löschen) in den Einstellungen.</p>
      </div>
      <div class="field"><label>Organisation</label><div class="orgpick">${orgPickHtml(u.org)}</div></div>
      <div class="field">
        <div class="rufname-row">
          <div><label for="e-name">Funkrufname</label>
            <input id="e-name" class="mono" value="${esc(u.name)}" placeholder="z. B. ${esc(pfx("FW"))} Weiden" autocomplete="off"></div>
          <div><label for="e-kennung">Kennung</label>
            <div class="kennung-wrap">
              <input id="e-kennung" class="mono" inputmode="decimal" value="${esc(u.kennung||"")}" placeholder="40,1" autocomplete="off">
              <button class="slashbtn" id="e-slash" aria-label="Schrägstrich einfügen">/</button>
            </div>
          </div>
        </div>
        <div class="ruf-preview mono" id="e-preview"></div>
        <p class="hint">Kennung nur mit Ziffern tippen – Komma oder Punkt wird automatisch zu „/“ (40,1 → 40/1 · 1,40,1 → 1/40/1).</p>
      </div>
      ${abField}
      <div class="field"><label>Stärke (Führer / Unterführer / Mannschaft)</label>
        <div class="steppers">
          ${stepper("f","Führer","Verbands-/Zugführer")}
          ${stepper("u","Unterführer","Gruppen-/Truppführer")}
          ${stepper("m","Mannschaft","")}
        </div>
        <div class="gesamt-row"><span class="g-lbl">Stärke</span>
          <span class="g-not mono" id="e-gesamt">${staerkeStr(u)}</span></div>
      </div>
      <div class="field"><label>Atemschutz &amp; CSA</label>
        <div class="steppers">
          ${stepper("agt","AGT","Atemschutzgeräteträger")}
          ${stepper("csa","CSA","Chemikalienschutzanzug-Träger")}
        </div></div>
      <div class="field"><label for="e-zeit">Ankunft an Einsatzstelle</label>
        <input id="e-zeit" type="time" class="mono" value="${fmtZeit(u.ankunft)==="–"?"":fmtZeit(u.ankunft)}"></div>
      <div class="field">
        <button class="leave-toggle" id="e-tat" aria-pressed="${u.tatsaechlich !== false}">
          <span class="track"></span>
          <span>Stärke bestätigt <small style="display:block;font-size:.75rem;font-weight:500;color:var(--ink3)">tatsächlich abgefragt – nicht (mehr) nur eine Schätzung aus dem Alarm</small></span>
        </button>
      </div>
      ${editing.isNew ? "" : `
      <div class="field">
        <button class="leave-toggle" id="e-left" aria-pressed="${u.abgerueckt}">
          <span class="track"></span>
          <span>Abgerückt <small style="display:block;font-size:.75rem;font-weight:500;color:var(--ink3)">zählt nicht mehr zur Stärke an der Einsatzstelle</small></span>
        </button>
      </div>`}
    </div>
    <div class="sheet-foot">
      ${editing.isNew ? "" : `<button class="btn btn-danger-ghost" id="e-del">Löschen</button>`}
      <button class="btn btn-primary" id="e-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  wireSheet();
}
function wireSheet(){
  const u = editing.unit;
  const updatePreview = () => {
    const el = $("#e-preview");
    const n = fullName(u);
    el.innerHTML = n ? esc(n) : `<span class="ph">Vorschau Funkrufname</span>`;
  };
  updatePreview();
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#e-katalog").addEventListener("change", e => {
    const k = state.config.katalog[Number(e.target.value)];
    if(!k) return;
    u.org = k.org || "FW"; u.name = k.name; u.kennung = k.kennung;
    u.f = k.f|0; u.u = k.u|0; u.m = k.m|0; u.agt = k.agt|0; u.csa = k.csa|0;
    renderSheet(); // alle Felder mit den Katalogwerten neu aufbauen
  });
  document.querySelectorAll("[data-org]").forEach(b => b.addEventListener("click", () => {
    const prevDefault = pfx(u.org);
    u.org = b.dataset.org;
    // Präfix nur ersetzen, wenn der Nutzer noch nichts Eigenes geschrieben hat
    if(!u.name.trim() || u.name.trim() === prevDefault){
      const p = pfx(u.org);
      u.name = p ? p + " " : "";     // Leerzeichen ans Präfix, damit direkt der Ort getippt werden kann
      const inp = $("#e-name");
      inp.value = u.name;
      inp.focus();
      inp.setSelectionRange(u.name.length, u.name.length);   // Cursor ans Ende
    }
    document.querySelectorAll("[data-org]").forEach(x => x.setAttribute("aria-pressed", x.dataset.org===u.org));
    updatePreview();
  }));
  document.querySelectorAll("[data-ab]").forEach(b => b.addEventListener("click", () => {
    u.abschnitt = b.dataset.ab;
    document.querySelectorAll("[data-ab]").forEach(x => x.setAttribute("aria-pressed", x.dataset.ab===u.abschnitt));
  }));
  document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => {
    const [field, d] = b.dataset.step.split(":");
    u[field] = Math.max(0, Math.min(99, (u[field]|0) + Number(d)));
    document.querySelector(`[data-val="${field}"]`).textContent = u[field];
    $("#e-gesamt").textContent = staerkeStr(u);
  }));
  $("#e-name").addEventListener("input", e => { u.name = e.target.value; updatePreview(); });
  const ken = $("#e-kennung");
  ken.addEventListener("input", () => {
    const clean = ken.value.replace(/[.,\s]+/g,"/").replace(/\/{2,}/g,"/");
    if(clean !== ken.value) ken.value = clean;
    u.kennung = clean; updatePreview();
  });
  $("#e-slash").addEventListener("click", () => {
    if(ken.value && !ken.value.endsWith("/")) ken.value += "/";
    u.kennung = ken.value; ken.focus(); updatePreview();
  });
  $("#e-zeit").addEventListener("change", e => {
    if(!e.target.value) return;
    const [h,m] = e.target.value.split(":").map(Number);
    const d = u.ankunft ? new Date(u.ankunft) : new Date();
    d.setHours(h, m, 0, 0); u.ankunft = d.toISOString();
  });
  const left = $("#e-left");
  if(left) left.addEventListener("click", () => {
    u.abgerueckt = !u.abgerueckt;
    left.setAttribute("aria-pressed", u.abgerueckt);
  });
  const tat = $("#e-tat");
  if(tat) tat.addEventListener("click", () => {
    u.tatsaechlich = !(u.tatsaechlich !== false);   // toggelt bestätigt/Schätzung
    tat.setAttribute("aria-pressed", u.tatsaechlich);
  });
  const del = $("#e-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diese Kraft wirklich löschen?").then(ok => { if(!ok) return;
      state.einheiten = state.einheiten.filter(x => x.id !== u.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#e-save").addEventListener("click", () => {
    u.name = (u.name||"").trim();
    u.kennung = (u.kennung||"").replace(/\/+$/,"");
    katalogHinzufuegen(u);   // noch unbekanntes Fahrzeug in den Katalog übernehmen
    const idx = state.einheiten.findIndex(x => x.id === u.id);
    if(idx >= 0) state.einheiten[idx] = u; else state.einheiten.push(u);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Editor: Anforderung (Nachforderungs-Tracker) ---------------- */
let editingAf = null;
function openAfEditor(id){
  if(id){
    const a = state.anforderungen.find(x => x.id === id);
    if(!a) return;
    editingAf = { af: {...a}, isNew:false };
  }else{
    editingAf = { af: { id:uid(), was:"", status:"angefordert",
      angefordert:new Date().toISOString(), alarmiert:"", eingetroffen:"" }, isNew:true };
  }
  const a = editingAf.af;
  const zeile = (label, iso) => iso ? `<div class="fkrow"><span class="fk-n">${label}</span><span class="fk-f mono">${fmtZeit(iso)} Uhr</span></div>` : "";
  const nextBtn = a.status === "angefordert"
    ? `<button class="btn btn-ghost btn-block" id="af-next" style="margin-bottom:10px">Jetzt: alarmiert</button>`
    : a.status === "alarmiert"
    ? `<button class="btn btn-ghost btn-block" id="af-next" style="margin-bottom:10px">Jetzt: eingetroffen</button>`
    : `<p class="hint" style="margin-bottom:10px">Eingetroffen – jetzt unter „Einheiten“ erfassen (Fahrzeugkatalog nutzen).</p>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Anforderung">
    <div class="sheet-head">
      <h2>${editingAf.isNew ? "Kräfte nachfordern" : "Anforderung"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="af-was">Was wird angefordert?</label>
        <input id="af-was" value="${esc(a.was)}" placeholder="z. B. Löschzug FF Nachbarort, DLK 23/12, 2 RTW" autocomplete="off"></div>
      ${state.abschnitte.length ? `
      <div class="field"><label for="af-ab">Vorgesehener Einsatzabschnitt</label>
        <select id="af-ab">
          <option value="">– kein / offen –</option>
          ${state.abschnitte.map(ab => `<option value="${esc(ab.id)}" ${a.abschnitt===ab.id?"selected":""}>${esc(ab.name)}</option>`).join("")}
        </select>
        <p class="hint">Schon beim Anfordern wählbar – beim Eintreffen noch änderbar.</p></div>` : ""}
      <div class="field"><label>Status</label>
        <div style="margin-bottom:10px"><span class="chip chip-st-${esc(a.status)}">${esc(a.status)}</span></div>
        ${nextBtn}
        ${zeile("Angefordert", a.angefordert)}
        ${zeile("Alarmiert", a.alarmiert)}
        ${zeile("Eingetroffen", a.eingetroffen)}
      </div>
    </div>
    <div class="sheet-foot">
      ${editingAf.isNew ? "" : `<button class="btn btn-danger-ghost" id="af-del">Löschen</button>`}
      <button class="btn btn-primary" id="af-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const next = $("#af-next");
  if(next) next.addEventListener("click", () => {
    if(a.status === "angefordert"){ a.status = "alarmiert"; a.alarmiert = new Date().toISOString(); }
    else if(a.status === "alarmiert"){ a.status = "eingetroffen"; a.eingetroffen = new Date().toISOString(); }
    a.was = $("#af-was").value.trim();
    const abSel = $("#af-ab"); if(abSel) a.abschnitt = abSel.value;
    const idx = state.anforderungen.findIndex(x => x.id === a.id);
    if(idx >= 0) state.anforderungen[idx] = {...a}; else state.anforderungen.push({...a});
    markChange();
    if(a.status === "eingetroffen"){
      // Nach dem Eintreffen anbieten, die Besatzung dieser Einheit zu erfassen (Name vorbefüllt)
      closeEditor();
      modalConfirm(`„${a.was}" ist eingetroffen. Kräfte dieser Einheit jetzt erfassen?`, "Erfassen", "Später").then(ok => {
        if(ok) openEditor(null, { name: a.was, abschnitt: a.abschnitt || "" });
        else render();
      });
    }else{
      openAfEditor(a.id); // Sheet mit neuem Status neu aufbauen
    }
  });
  const del = $("#af-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diese Anforderung wirklich löschen?").then(ok => { if(!ok) return;
      state.anforderungen = state.anforderungen.filter(x => x.id !== a.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#af-save").addEventListener("click", () => {
    a.was = $("#af-was").value.trim();
    const abSel = $("#af-ab"); if(abSel) a.abschnitt = abSel.value;
    if(!a.was){ $("#af-was").focus(); return; }
    const idx = state.anforderungen.findIndex(x => x.id === a.id);
    if(idx >= 0) state.anforderungen[idx] = a; else state.anforderungen.push(a);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Editor: Einsatzabschnitt ---------------- */
let editingAb = null; // { ab, isNew }
function openAbEditor(id){
  if(id){
    const a = state.abschnitte.find(x => x.id === id);
    if(!a) return;
    editingAb = { ab: {...a, fuehrung:{...(a.fuehrung||{mode:"TMO",gruppe:""})}, arbeit:{...(a.arbeit||{mode:"DMO",gruppe:""})}}, isNew:false };
  }else{
    editingAb = { ab: { id:uid(), name:"", ansprechpartner:"", fuehrung:{mode:"TMO",gruppe:""}, arbeit:{mode:"DMO",gruppe:""} }, isNew:true };
  }
  renderAbSheet();
}
function renderAbSheet(){
  if(!editingAb){ $("#sheetHost").innerHTML = ""; return; }
  const a = editingAb.ab;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingAb.isNew?"Abschnitt anlegen":"Abschnitt bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingAb.isNew ? "Abschnitt anlegen" : "Abschnitt bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="ab-name">Abschnittsname</label>
        <input id="ab-name" value="${esc(a.name)}" placeholder="z. B. Abschnitt 1 – Brandbekämpfung" autocomplete="off"></div>
      <div class="field"><label for="ab-ap">Ansprechpartner</label>
        <input id="ab-ap" class="mono" value="${esc(a.ansprechpartner||"")}" placeholder="z. B. Florian Weiden 3/1" autocomplete="off">
        <p class="hint">Funkrufname oder Name des Abschnittsleiters / Ansprechpartners.</p></div>
      <div class="field"><label for="ab-fg-mode">Führungsrufgruppe <span style="text-transform:none;font-weight:500">(zur Einsatzleitung)</span></label>
        <div style="display:flex;gap:8px">
          <select id="ab-fg-mode" style="width:110px;flex:none">
            <option value="TMO" ${a.fuehrung.mode==="TMO"?"selected":""}>TMO</option>
            <option value="DMO" ${a.fuehrung.mode==="DMO"?"selected":""}>DMO</option>
          </select>
          <input id="ab-fg-grp" class="mono" value="${esc(a.fuehrung.gruppe||"")}" placeholder="z. B. 2901" autocomplete="off">
        </div>
        <p class="hint">Tipp: Gleiche Führungsrufgruppe bei allen Abschnitten → die Skizze fasst sie zu einer gemeinsamen Linie zusammen.</p></div>
      <div class="field"><label for="ab-ag-mode">Arbeitsrufgruppe <span style="text-transform:none;font-weight:500">(im Abschnitt)</span></label>
        <div style="display:flex;gap:8px">
          <select id="ab-ag-mode" style="width:110px;flex:none">
            <option value="TMO" ${a.arbeit.mode==="TMO"?"selected":""}>TMO</option>
            <option value="DMO" ${a.arbeit.mode==="DMO"?"selected":""}>DMO</option>
          </select>
          <input id="ab-ag-grp" class="mono" value="${esc(a.arbeit.gruppe||"")}" placeholder="z. B. 307_F" autocomplete="off">
        </div></div>
      <div class="field"><label for="ab-ag-via">Verbindung der Arbeitsrufgruppe</label>
        <select id="ab-ag-via">
          <option value="" ${!a.arbeit.via?"selected":""}>direkt (keine)</option>
          <option value="gateway" ${a.arbeit.via==="gateway"?"selected":""}>über Gateway (DMO ↔ TMO)</option>
          <option value="repeater" ${a.arbeit.via==="repeater"?"selected":""}>über Repeater</option>
        </select>
        <p class="hint">Führungsrufgruppe steht in der Skizze an der Linie zur Einsatzleitung, die Arbeitsrufgruppe im Abschnitts-Kästchen. Gateway/Repeater wird als Hinweis dargestellt (FwDV 810).</p>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingAb.isNew ? "" : `<button class="btn btn-danger-ghost" id="ab-del">Löschen</button>`}
      <button class="btn btn-primary" id="ab-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const del = $("#ab-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm(`Abschnitt „${a.name}“ löschen? Zugeordnete Einheiten bleiben erhalten (ohne Abschnitt).`).then(ok => { if(!ok) return;
      state.abschnitte = state.abschnitte.filter(x => x.id !== a.id);
      state.einheiten.forEach(u => { if(u.abschnitt === a.id) u.abschnitt = ""; });
      markChange(); closeEditor(); render();
    });
  });
  $("#ab-save").addEventListener("click", () => {
    a.name = $("#ab-name").value.trim();
    if(!a.name){ $("#ab-name").focus(); return; }
    a.ansprechpartner = $("#ab-ap").value.trim();
    a.fuehrung = { mode: $("#ab-fg-mode").value, gruppe: $("#ab-fg-grp").value.trim() };
    a.arbeit   = { mode: $("#ab-ag-mode").value, gruppe: $("#ab-ag-grp").value.trim(), via: $("#ab-ag-via").value };
    delete a.tmo; delete a.dmo;
    const idx = state.abschnitte.findIndex(x => x.id === a.id);
    if(idx >= 0) state.abschnitte[idx] = a; else state.abschnitte.push(a);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Editor: Führungskraft ---------------- */
function openFkEditor(id){
  if(id){
    const f = state.fuehrung.find(x => x.id === id);
    if(!f) return;
    editingFk = { fk: {...f}, isNew:false };
  }else{
    editingFk = { fk: { id:uid(), org:"FW", name:"", funktion:"", funkrufname:"", einheit:"", tatsaechlich:true }, isNew:true };
  }
  renderFkSheet();
}
function renderFkSheet(){
  if(!editingFk){ $("#sheetHost").innerHTML = ""; return; }
  const f = editingFk.fk;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingFk.isNew?"Führungskraft erfassen":"Führungskraft bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingFk.isNew ? "Führungskraft erfassen" : "Führungskraft bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      ${(state.config.fkStamm||[]).length ? `
      <div class="field"><label for="fk-stamm">Aus Stammdaten übernehmen</label>
        <select id="fk-stamm">
          <option value="">– neue Führungskraft –</option>
          ${fkStammGruppen().map(g => `<optgroup label="${esc(g.grp)}">${g.items.map(p => `<option value="${p._i}">${esc(fkStammLabel(p))}</option>`).join("")}</optgroup>`).join("")}
        </select>
        <p class="hint">Vorhandene Person wählen – die Felder werden ausgefüllt. Neue Person unten erfassen; sie wird beim Speichern in die Stammdaten übernommen.</p></div>` : ""}
      <div class="field"><label>Organisation</label><div class="orgpick">${orgPickHtml(f.org)}</div></div>
      <div class="field"><label for="fk-name">Name</label>
        <input id="fk-name" value="${esc(f.name)}" placeholder="Name" autocomplete="off"></div>
      <div class="field"><label for="fk-funktion">Funktion</label>
        <input id="fk-funktion" value="${esc(f.funktion)}" list="fk-funktionen" placeholder="z. B. Abschnittsleiter" autocomplete="off">
        <datalist id="fk-funktionen">${FUNKTIONEN.map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div>
      <div class="field"><label for="fk-funkruf">Funkrufname</label>
        <input id="fk-funkruf" class="mono" value="${esc(f.funkrufname||"")}" placeholder="z. B. Florian Weiden 1" autocomplete="off"></div>
      <div class="field"><label for="fk-einheit">Einheit / Abschnitt <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="fk-einheit" value="${esc(f.einheit||"")}" placeholder="z. B. Abschnitt 1, ${esc(pfx("FW"))} Weiden 40/1" autocomplete="off"></div>
      <div class="field">
        <button class="leave-toggle" id="fk-tat" aria-pressed="${f.tatsaechlich !== false}">
          <span class="track"></span>
          <span>Bestätigt <small style="display:block;font-size:.75rem;font-weight:500;color:var(--ink3)">tatsächlich vor Ort – nicht (mehr) nur eine Schätzung aus dem Alarm</small></span>
        </button>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingFk.isNew ? "" : `<button class="btn btn-danger-ghost" id="fk-del">Löschen</button>`}
      <button class="btn btn-primary" id="fk-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-org]").forEach(b => b.addEventListener("click", () => {
    f.org = b.dataset.org;
    document.querySelectorAll("[data-org]").forEach(x => x.setAttribute("aria-pressed", x.dataset.org===f.org));
  }));
  const stammSel = $("#fk-stamm");
  if(stammSel) stammSel.addEventListener("change", () => {
    if(stammSel.value === "") return;
    const p = state.config.fkStamm[Number(stammSel.value)];
    if(!p) return;
    f.name = p.name||""; f.funktion = p.funktion||""; f.funkrufname = p.funkrufname||"";
    f.einheit = p.einheit||""; f.org = p.org||f.org;
    renderFkSheet();   // Felder mit den übernommenen Werten neu zeichnen
  });
  $("#fk-name").addEventListener("input", e => { f.name = e.target.value; });
  $("#fk-funktion").addEventListener("input", e => { f.funktion = e.target.value; });
  $("#fk-funkruf").addEventListener("input", e => { f.funkrufname = e.target.value; });
  $("#fk-einheit").addEventListener("input", e => { f.einheit = e.target.value; });
  const fkTat = $("#fk-tat");
  if(fkTat) fkTat.addEventListener("click", () => {
    f.tatsaechlich = !(f.tatsaechlich !== false);
    fkTat.setAttribute("aria-pressed", f.tatsaechlich);
  });
  const del = $("#fk-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diese Führungskraft wirklich löschen?").then(ok => { if(!ok) return;
      state.fuehrung = state.fuehrung.filter(x => x.id !== f.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#fk-save").addEventListener("click", () => {
    fkStammHinzufuegen(f);   // neue Person automatisch in die Stammdaten übernehmen
    const idx = state.fuehrung.findIndex(x => x.id === f.id);
    if(idx >= 0) state.fuehrung[idx] = f; else state.fuehrung.push(f);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Funk (Einsatztagebuch) ---------------- */
let editingFs = null; // { fs, isNew }
function fsSuggestions(){
  // Fahrzeuge zuerst (ALLE erfassten – auch bereits abgerückte), dann Führungskräfte
  // (mit Funkrufname), dann Abschnitte/Leitstelle. Aktive vor abgerückten Einheiten.
  const s = [];
  const add = v => { v = (v||"").trim(); if(v && !s.includes(v)) s.push(v); };
  aktive().forEach(u => add(fullName(u)));
  state.einheiten.filter(u => u.abgerueckt).forEach(u => add(fullName(u)));
  state.fuehrung.forEach(f => { add(f.funkrufname); add(f.name); });
  state.abschnitte.forEach(a => { add(a.ansprechpartner); add(a.name); });
  ["Leitstelle", "ELW", state.config.ugName].forEach(add);
  return s;
}
function renderFunk(){
  const list = [...state.funk].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||""));
  const items = list.length ? `<div class="fs-list">${list.map(f => `
    <button class="fs-item ${f.wichtig?"imp":""}" data-editfs="${esc(f.id)}">
      <div class="fs-head">
        <span class="fs-zeit mono">${istHeute(f.zeit) ? "" : fmtTagKurz(f.zeit) + " "}${fmtZeit(f.zeit)}</span>
        <span class="fs-route"><strong>${esc(f.von)}</strong> → <strong>${esc(f.an)}</strong></span>
        ${f.wichtig ? `<span class="chip chip-imp">WICHTIG</span>` : ""}
      </div>
      <div class="fs-text">${esc(f.text)}</div>
    </button>`).join("")}</div>`
  : `<div class="empty"><p>Noch keine Funksprüche erfasst.<br>Sender, Empfänger, Inhalt – Zeitstempel kommt automatisch.</p></div>`;
  return `
  <div class="statstrip" role="status">
    <div class="stat"><div class="k">Funksprüche</div><div class="v mono">${state.funk.length}</div><div class="s">gesamt</div></div>
    <div class="stat"><div class="k">Wichtig</div><div class="v mono">${state.funk.filter(f=>f.wichtig).length}</div><div class="s">markiert</div></div>
    <div class="stat"><div class="k">Zuletzt</div><div class="v mono">${list.length?fmtZeit(list[0].zeit):"–"}</div><div class="s">Uhrzeit</div></div>
  </div>
  <button class="btn btn-primary btn-block" id="btnAddFs" style="margin-bottom:10px">＋&nbsp; Funkspruch erfassen</button>
  ${state.funk.length ? `<button class="btn btn-ghost btn-block" id="btnPrintFs" style="margin-bottom:16px">Funksprüche drucken (Einsatztagebuch)</button>` : ""}
  ${items}`;
}
function wireFunk(){
  $("#btnAddFs").addEventListener("click", () => openFsEditor(null));
  const pr = $("#btnPrintFs");
  if(pr) pr.addEventListener("click", doPrintFunk);
  document.querySelectorAll("[data-editfs]").forEach(el =>
    el.addEventListener("click", () => openFsEditor(el.dataset.editfs)));
}
function doPrintFunk(){
  const e = state.einsatz;
  const sorted = [...state.funk].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""));
  const mehrtaegig = new Set(sorted.map(f => new Date(f.zeit).toDateString())).size > 1;
  $("#printArea").innerHTML = `
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Einsatztagebuch · Funksprüche</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}${e.beginn ? " · Alarm " + fmtDatum(e.beginn) + " " + fmtZeit(e.beginn) + " Uhr" : ""}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    <table><thead><tr><th>Nr.</th><th>Zeit</th><th>Von</th><th>An</th><th>Inhalt</th></tr></thead><tbody>
      ${sorted.map((f,idx) => `
      <tr>
        <td class="p-mono">${idx+1}${f.wichtig ? " !" : ""}</td>
        <td class="p-mono">${mehrtaegig ? fmtTagKurz(f.zeit) + " " : ""}${fmtZeit(f.zeit)}</td>
        <td>${esc(f.von)}</td>
        <td>${esc(f.an)}</td>
        <td>${f.wichtig ? `<strong>${esc(f.text)}</strong>` : esc(f.text)}</td>
      </tr>`).join("")}
    </tbody></table>
    <div class="p-foot">
      <div class="p-sign">Ort, Datum</div>
      <div class="p-sign">Unterschrift</div>
    </div>
    <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Kräfteerfassung (Prototyp) · ${esc(state.config.ugName)}</p>`;
  window.print();
}
function openFsEditor(id){
  if(id){
    const f = state.funk.find(x => x.id === id);
    if(!f) return;
    editingFs = { fs: {...f}, isNew:false };
  }else{
    editingFs = { fs: { id:uid(), zeit:new Date().toISOString(), von:"", an:state.config.ugName||"ELW",
      text:"", wichtig:false }, isNew:true };
  }
  renderFsSheet();
}
function renderFsSheet(){
  if(!editingFs){ $("#sheetHost").innerHTML = ""; return; }
  const f = editingFs.fs;
  const sugg = fsSuggestions().map(x => `<option value="${esc(x)}">`).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingFs.isNew?"Funkspruch erfassen":"Funkspruch bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingFs.isNew ? "Funkspruch erfassen" : "Funkspruch bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="width:190px"><label for="fs-datum">Datum</label>
            <input id="fs-datum" type="date" class="mono" value="${fmtDateInput(f.zeit)}"></div>
          <div style="width:150px"><label for="fs-zeit">Uhrzeit</label>
            <input id="fs-zeit" type="time" class="mono" step="60" value="${fmtZeit(f.zeit)==="–"?"":fmtZeit(f.zeit)}"></div>
        </div>
        <p class="hint">Vorbelegt mit jetzt – bei Einsätzen über Mitternacht Datum anpassen.</p>
      </div>
      <div class="field">
        <div class="swap-row">
          <div><label for="fs-von">Von (Sender)</label>
            <input id="fs-von" value="${esc(f.von)}" list="fs-sugg" placeholder="z. B. Florian Weiden 40/1" autocomplete="off"></div>
          <button class="swapbtn" id="fs-swap" title="Sender und Empfänger tauschen" aria-label="Sender und Empfänger tauschen">⇄</button>
          <div><label for="fs-an">An (Empfänger)</label>
            <input id="fs-an" value="${esc(f.an)}" list="fs-sugg" placeholder="z. B. ELW" autocomplete="off"></div>
        </div>
        <datalist id="fs-sugg">${sugg}</datalist>
      </div>
      <div class="field"><label for="fs-text">Inhalt</label>
        <div style="display:flex;gap:8px;align-items:stretch">
          <textarea id="fs-text" style="flex:1" placeholder="Wortlaut / Zusammenfassung des Funkspruchs …">${esc(f.text)}</textarea>
          <button class="micbtn" id="fs-mic" aria-label="Diktieren" title="Diktieren">
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>
          </button>
        </div></div>
      <div class="field">
        <button class="leave-toggle" id="fs-imp" aria-pressed="${f.wichtig}">
          <span class="track"></span>
          <span>Wichtig <small style="display:block;font-size:.75rem;font-weight:500;color:var(--ink3)">wird hervorgehoben – z. B. Lagemeldung, Anforderung, Freigabe</small></span>
        </button>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingFs.isNew ? "" : `<button class="btn btn-danger-ghost" id="fs-del">Löschen</button>`}
      <button class="btn btn-primary" id="fs-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  attachDictation($("#fs-mic"), $("#fs-text"));
  $("#fs-swap").addEventListener("click", () => {
    const v = $("#fs-von").value;
    $("#fs-von").value = $("#fs-an").value;
    $("#fs-an").value = v;
  });
  $("#fs-imp").addEventListener("click", () => {
    f.wichtig = !f.wichtig;
    $("#fs-imp").setAttribute("aria-pressed", f.wichtig);
  });
  const del = $("#fs-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diesen Funkspruch wirklich löschen?").then(ok => { if(!ok) return;
      state.funk = state.funk.filter(x => x.id !== f.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#fs-save").addEventListener("click", () => {
    const dv = $("#fs-datum").value, tv = $("#fs-zeit").value;
    if(dv && tv){
      const d = new Date(`${dv}T${tv}:00`);
      if(!isNaN(d)) f.zeit = d.toISOString();
    }else if(tv){
      const [h,m] = tv.split(":").map(Number);
      const d = f.zeit ? new Date(f.zeit) : new Date();
      d.setHours(h, m, 0, 0); f.zeit = d.toISOString();
    }
    f.von = $("#fs-von").value.trim();
    f.an = $("#fs-an").value.trim();
    f.text = $("#fs-text").value.trim();
    if(!f.text && !f.von){ $("#fs-von").focus(); return; }
    const idx = state.funk.findIndex(x => x.id === f.id);
    if(idx >= 0) state.funk[idx] = f; else state.funk.push(f);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Checklisten ---------------- */
/* Vorlagen – im Endausbau je Mandant in den Einstellungen pflegbar */
const CHECK_VORLAGEN = [
  { name:"Einsatzleiter – Erstmaßnahmen", punkte:[
    "Lage erkunden", "Rückmeldung an Leitstelle", "Einsatzstelle absichern",
    "Bereitstellungsraum festlegen", "Abschnitte bilden", "Atemschutzüberwachung sicherstellen",
    "Lagekarte anlegen", "Presse/Behörden informieren", "Lagebesprechung ansetzen" ] },
  { name:"MANV", punkte:[
    "MANV-Stufe festlegen", "Patientenablage einrichten", "ELRD / OrgL anfordern",
    "Sichtung veranlassen", "Transportorganisation aufbauen", "Betreuung anfordern" ] },
  { name:"Gefahrgut", punkte:[
    "Gefahr erkennen (Kennzeichnung)", "Absperrbereich 50/100 m", "Anfahrt mit Wind beachten",
    "GW-Gefahrgut anfordern", "Dekon-Platz einrichten", "Fachberater hinzuziehen" ] },
];
function renderListen(){
  const cards = state.checks.map(c => {
    const done = c.punkte.filter(p => p.done).length;
    return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 style="margin:0;flex:1">${esc(c.name)} · <span class="mono">${done}/${c.punkte.length}</span></h2>
        <button class="btn btn-danger-ghost" data-checkdel="${esc(c.id)}" style="min-height:40px;padding:6px 12px;font-size:.8rem">✕</button>
      </div>
      <div class="check-progress"><i style="width:${Math.round(done/c.punkte.length*100)}%"></i></div>
      ${c.punkte.map((p,idx) => `
      <button class="check-item ${p.done ? "done" : ""}" data-check="${esc(c.id)}:${idx}">
        <span class="check-box">✓</span>
        <span class="check-text">${esc(p.text)}</span>
        ${p.zeit ? `<span class="check-zeit mono">${fmtZeit(p.zeit)}</span>` : ""}
      </button>`).join("")}
    </div>`;
  }).join("");
  return `
  <div class="card">
    <h2>Checkliste starten</h2>
    <div class="addrow">
      <select id="checkVorlage">
        ${CHECK_VORLAGEN.map((v,idx) => `<option value="${idx}">${esc(v.name)} (${v.punkte.length} Punkte)</option>`).join("")}
      </select>
      <button class="btn btn-ghost" id="checkStart">Starten</button>
    </div>
    <p class="hint">Jeder Haken bekommt einen Zeitstempel – so ist später belegbar, wann was veranlasst wurde. Vorlagen werden im Endausbau je Organisation pflegbar sein.</p>
  </div>
  ${cards || `<div class="empty"><p>Noch keine Checkliste aktiv.</p></div>`}`;
}
function wireListen(){
  $("#checkStart").addEventListener("click", () => {
    const v = CHECK_VORLAGEN[Number($("#checkVorlage").value)];
    if(!v) return;
    state.checks.push({ id:uid(), name:v.name,
      punkte: v.punkte.map(text => ({ text, done:false, zeit:"" })) });
    markChange(); render();
  });
  document.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => {
    const [cid, idx] = b.dataset.check.split(":");
    const c = state.checks.find(x => x.id === cid);
    const p = c && c.punkte[Number(idx)];
    if(!p) return;
    p.done = !p.done;
    p.zeit = p.done ? new Date().toISOString() : "";
    markChange(); render();
  }));
  document.querySelectorAll("[data-checkdel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diese Checkliste wirklich entfernen?").then(ok => { if(!ok) return;
      state.checks = state.checks.filter(x => x.id !== b.dataset.checkdel);
      markChange(); render();
    });
  }));
}

/* ---------------- Ansicht: Atemschutz (Sammelstelle + Überwachung) ---------------- */
const AS_GERAETETYP        = "300 bar";   // einheitlicher Gerätetyp
const AS_START_DEFAULT     = 300;         // bar – Vorbelegung Startdruck
const AS_START_MAX         = 350;         // bar – Höchstwert
const AS_START_MIN         = 50;          // bar – Wert muss darüber liegen (> 50)
const AS_RESERVE_DEFAULT   = 60;          // bar – Sicherheitsreserve / Warnschwelle (Restdruckwarner)
const AS_ERWARTET_DEFAULT  = 30;          // min – Richtwert erwartete Einsatzzeit (300-bar-PA)
let editingTraeger = null, editingTrupp = null;
let asOrderSig = "";   // Signatur der Dringlichkeits-Reihenfolge (für Auto-Sortierung)

/* --- FwDV 7 – Druckberechnung & Überwachung (Hilfsmittel, ersetzt nicht die Eigenkontrolle) --- */
function asReserve(t){ const v = Number(t && t.reserve); return v>0 ? v : AS_RESERVE_DEFAULT; }
function asErwartet(t){ const v = Number(t && t.erwartetMin); return v>0 ? v : AS_ERWARTET_DEFAULT; }
// Rückzugsdruck: FwDV 7 – für den Rückweg die doppelte Atemluftmenge wie für den Hinweg.
// Vom nutzbaren Vorrat (Start − Reserve) wird 1/3 für den Hinweg verplant, 2/3 bleiben für Rückweg.
// ⇒ Umkehren, sobald der Druck (2·Start + Reserve)/3 erreicht (z. B. 300/60 → 220 bar).
function asRueckzugsdruck(start, reserve){
  const s = Number(start); if(!s) return null;
  return Math.round((2*s + (Number(reserve)||AS_RESERVE_DEFAULT)) / 3);
}
// Rückzugsdruck je Träger: sobald der Druck bei „Einsatzziel erreicht" (ziel) vorliegt,
// dynamisch nach FwDV 7 (Rückweg = doppelter Hinwegverbrauch): Reserve + 2·(Start − Ziel).
// Ohne Zieldruck → konservativer Vorabwert (2·Start + Reserve)/3.
function asRzMember(start, ziel, reserve){
  const s = Number(start); if(!s) return null;
  const r = Number(reserve)||AS_RESERVE_DEFAULT;
  const z = Number(ziel);
  const roh = (z>0 && z<s) ? Math.round(r + 2*(s-z)) : Math.round((2*s + r)/3);
  // Rückzugsdruck ≥ Startdruck ⇒ Hinweg zu verbrauchsintensiv, normgerechter Rückweg nicht mehr möglich → sofort umkehren
  return { bar: Math.min(roh, s), dyn: (z>0 && z<s), sofort: roh >= s };
}
// Maßgeblicher Rückzugsdruck des Trupps = frühester Umkehrpunkt (höchster Wert).
function asRzTrupp(t){
  const r = asReserve(t);
  const vals = (t.memberIds||[]).map(id => {
    const d = (t.druck||{})[id] || {}; return asRzMember(d.start, d.ziel, r);
  }).filter(Boolean);
  if(!vals.length) return null;
  const top = vals.reduce((a,b) => b.bar>a.bar ? b : a);
  return { bar: top.bar, dyn: vals.every(v => v.dyn), sofort: vals.some(v => v.sofort) };
}
// Rückzug fällig: ein Träger hat seinen Umkehrdruck erreicht/unterschritten (oder Hinweg zu verbrauchsintensiv → sofort)
function asBelow(t){
  const r = asReserve(t);
  return (t.memberIds||[]).some(id => {
    const d = (t.druck||{})[id] || {}; const rz = asRzMember(d.start, d.ziel, r); const ist = d.k23 || d.k13 || d.ziel;
    return rz && (rz.sofort || (ist && Number(ist) <= rz.bar));
  });
}
// Referenzuhr der Überwachung: ab „angeschlossen" (Luftversorgung), sonst ab „ausgerückt".
function asMonitorStart(t){ return t.angeschlossen || t.ausgerueckt || ""; }
// Kleinster Startdruck im Trupp = maßgeblicher Träger (größter Luftverbrauch bestimmt die Einsatzdauer).
function asMinStart(t){
  const werte = (t.memberIds||[]).map(id => Number((t.druck||{})[id]?.start)).filter(v => v>0);
  return werte.length ? Math.min(...werte) : null;
}
// FwDV 7 – dynamische Restzeit: Rate = NOMINALWERT aus dem Richtwert, (Startdruck − Reserve) ÷
// erwartete Einsatzzeit (bar/min). Stabil und realistisch – der kurze Hinweg (Gehen) verfälscht
// nichts. Der Countdown wird bei jeder Druckmessung (Ziel/1.3/2.3) neu auf den echten Ist-Druck
// gesetzt: er zählt also immer von der Realität aus, nur die Steigung ist nominal.
function asMemberProjektion(d, t){
  if(!d || !(Number(d.start) > 0)) return null;
  let druck = null, zeit = null;                         // jüngste Basis-Messung (Druck + Zeit)
  if(d.k23 && t.checks && t.checks.zweidrittel){ druck = Number(d.k23); zeit = t.checks.zweidrittel; }
  else if(d.k13 && t.checks && t.checks.drittel){ druck = Number(d.k13); zeit = t.checks.drittel; }
  else if(d.ziel && t.zielZeit){ druck = Number(d.ziel); zeit = t.zielZeit; }
  if(!(druck > 0) || !zeit) return null;                 // erst ab „Einsatzziel erreicht"
  const rate = (Number(d.start) - asReserve(t)) / asErwartet(t);
  if(!(rate > 0)) return null;
  const rz = asRzMember(Number(d.start), d.ziel, asReserve(t)); if(!rz) return null;
  return { rate, druck, zeit, rueckzug: rz.bar, sofort: rz.sofort };
}
// Maßgebliche Prognose des Trupps = SCHWÄCHSTER Träger = frühester Umkehrzeitpunkt (kleinste Restzeit).
function asRestzeit(t){
  const projs = (t.memberIds||[]).map(id => asMemberProjektion((t.druck||{})[id], t)).filter(Boolean);
  if(!projs.length) return null;
  const now = Date.now();
  const mit = projs.map(p => {
    const cur = p.druck - p.rate * ((now - new Date(p.zeit).getTime()) / 60000);
    return { ...p, mins: (cur - p.rueckzug) / p.rate };
  });
  return mit.reduce((a,b) => b.mins < a.mins ? b : a);   // kleinste Restzeit gewinnt (schwächster Mann)
}

function asNextTruppNr(){
  // AST beginnt bei 10; jeder (auch wiederholte) Einsatz bekommt eine neue Nummer
  return state.asTrupps.reduce((m,t) => Math.max(m, t.nr||0), 9) + 1;
}
function asTraegerName(id){ const t = state.asTraeger.find(x => x.id === id); return t ? t.name : "?"; }
function asTruppOf(traegerId){
  return state.asTrupps.find(t => t.status !== "zurueck" && (t.memberIds||[]).includes(traegerId));
}
function asFreieTraeger(){ return state.asTraeger.filter(t => !asTruppOf(t.id)); }

function renderAtemschutz(){
  const seg = `
  <div class="seg" role="tablist">
    <button role="tab" data-assub="sammelstelle" class="${state.asSub==="sammelstelle"?"active":""}">Sammelstelle</button>
    <button role="tab" data-assub="ueberwachung" class="${state.asSub==="ueberwachung"?"active":""}">Überwachung (${state.asTrupps.filter(t=>t.status==="einsatz").length})</button>
  </div>`;
  return seg + (state.asSub === "ueberwachung" ? renderASUeberwachung() : renderASSammelstelle());
}

function asNrBadge(t, big){
  return `<span class="as-nr ${t.status} ${big?"big":""}">${t.nr}</span>`;
}
function truppCard(t){
  const mitglieder = (t.memberIds||[]).map(id => {
    const tr = state.asTraeger.find(x => x.id === id);
    if(!tr) return "?";
    const d = (t.druck||{})[id] || {};
    const dr = (d.start || d.end) ? ` <span class="as-druck">${d.start?esc(d.start):"–"}${d.end?"→"+esc(d.end):""} bar</span>` : "";
    return `${esc(tr.name)}${t.tf===id?` <span class="as-typ">TF</span>`:""}${tr.csa?` <span class="as-typ">CSA</span>`:""}${dr}`;
  }).join("<br>");
  const rz = asRzTrupp(t);
  const zeile = [
    t.abschnitt ? `Abschnitt: <strong>${esc(t.abschnitt)}</strong>` : "",
    t.funkruf ? `Funk: <strong>${esc(t.funkruf)}</strong>` : "",
    t.ausgerueckt ? `ausgerückt ${fmtZeit(t.ausgerueckt)} Uhr` : "",
    t.angeschlossen ? `angeschl. ${fmtZeit(t.angeschlossen)} Uhr` : "",
    t.rueckkehr ? `zurück ${fmtZeit(t.rueckkehr)} Uhr` : "",
    (t.status!=="zurueck" && rz) ? `Rückzugsdruck <strong>${rz.sofort?"sofort umkehren":rz.bar+" bar"}</strong>${(rz.dyn||rz.sofort)?"":" (vorläufig)"}` : "",
  ].filter(Boolean).join(" · ");
  const aktionen = t.status === "registriert"
    ? `<button class="btn btn-primary" data-asein="${t.id}">Ausrücken</button>
       <button class="btn btn-ghost" data-astruppedit="${t.id}">Bearbeiten</button>
       <button class="btn btn-danger-ghost" data-astruppdel="${t.id}" aria-label="Trupp auflösen">✕</button>`
    : t.status === "einsatz"
    ? `${!t.angeschlossen ? `<button class="btn btn-primary" data-asang="${t.id}">Angeschlossen</button>` : ""}
       <button class="btn ${t.angeschlossen?"btn-primary":"btn-ghost"}" data-aszurueck="${t.id}">Zurückgemeldet</button>
       <button class="btn btn-ghost" data-astruppedit="${t.id}">Bearbeiten</button>`
    : `<button class="btn btn-ghost" data-aswieder="${t.id}">Erneut einsetzen</button>
       <button class="btn btn-danger-ghost" data-astruppdel="${t.id}" aria-label="Löschen">✕</button>`;
  return `
  <div class="as-trupp status-${t.status}">
    <div class="as-trupp-head">
      ${asNrBadge(t)}
      <div style="flex:1;min-width:0">
        <div class="as-mit">${mitglieder || "<span style='color:var(--ink3)'>keine Mitglieder</span>"}</div>
        ${zeile ? `<div class="as-sub2">${zeile}</div>` : ""}
        ${t.zusatz ? `<div class="as-sub2">Zusatz: ${esc(t.zusatz)}</div>` : ""}
      </div>
    </div>
    <div class="as-actions">${aktionen}</div>
  </div>`;
}
function renderASSammelstelle(){
  const trupps = [...state.asTrupps].sort((a,b) =>
    ({registriert:0,einsatz:1,zurueck:2}[a.status]) - ({registriert:0,einsatz:1,zurueck:2}[b.status]) || (a.nr-b.nr));
  const frei = asFreieTraeger();
  const truppList = trupps.length ? trupps.map(truppCard).join("")
    : `<div class="empty"><p>Noch keine Trupps gebildet.<br>Träger registrieren, dann zu einem Trupp (2–3 Mann) zusammenführen.</p></div>`;
  const traegerList = state.asTraeger.length ? `<div class="as-traeger-list">${state.asTraeger.map(tr => {
    const trupp = asTruppOf(tr.id);
    return `
    <button class="as-traeger ${trupp?"gebunden":""}" data-astraegeredit="${tr.id}">
      <div style="flex:1;min-width:0">
        <div class="as-tr-name">${esc(tr.name) || "<span style='color:var(--ink3)'>ohne Name</span>"}</div>
        <div class="as-sub2">${esc(tr.feuerwehr||"")}${tr.geraeteNr?` · Gerät ${esc(tr.geraeteNr)}`:""}${tr.maskeNr?` · Maske ${esc(tr.maskeNr)}`:""}${tr.lungenNr?` · LA ${esc(tr.lungenNr)}`:""}</div>
      </div>
      ${tr.csa ? `<span class="badge-agt" style="margin-right:6px">CSA</span>` : ""}
      ${trupp ? `<span class="chip">Trupp ${trupp.nr}</span>` : `<span class="chip chip-POL">frei</span>`}
    </button>`;
  }).join("")}</div>` : `<p class="hint" style="margin:0">Noch keine Geräteträger registriert.</p>`;
  return `
  <div class="statstrip" role="status">
    <div class="stat"><div class="k">Träger</div><div class="v mono">${state.asTraeger.length}</div><div class="s">${frei.length} frei</div></div>
    <div class="stat"><div class="k">Trupps</div><div class="v mono">${state.asTrupps.length}</div><div class="s">gesamt</div></div>
    <div class="stat"><div class="k">Im Einsatz</div><div class="v mono">${state.asTrupps.filter(t=>t.status==="einsatz").length}</div><div class="s">unter PA</div></div>
  </div>
  <div class="card">
    <h2>Trupps</h2>
    <button class="btn btn-primary btn-block" id="btnTruppBilden" style="margin-bottom:14px" ${frei.length<2?"disabled":""}>＋&nbsp; Trupp bilden${frei.length<2?" (min. 2 freie Träger)":""}</button>
    ${state.asTrupps.length ? `<button class="btn btn-ghost btn-block" id="btnPrintAs" style="margin-bottom:14px">🖨&nbsp; Atemschutz-Nachweis drucken (FwDV 7)</button>` : ""}
    ${truppList}
  </div>
  <div class="card">
    <h2>Geräteträger</h2>
    <button class="btn btn-ghost btn-block" id="btnTraegerReg" style="margin-bottom:14px">＋&nbsp; Träger registrieren</button>
    ${traegerList}
  </div>`;
}
function renderASUeberwachung(){
  // Auto-Sortierung: dringliche Trupps (Rückzug, fällige Druckabfrage) zuerst
  const aktiv = state.asTrupps.filter(t => t.status === "einsatz").sort((a,b) => asPrio(b)-asPrio(a) || a.nr-b.nr);
  asOrderSig = asOrderKey();
  if(!aktiv.length) return `<div class="empty"><p>Kein Trupp im Einsatz.<br>Trupps unter PA erscheinen hier mit laufender Einsatzzeit.</p></div>`;
  const help = tip => `<span class="as-help" tabindex="0" role="button" aria-label="Erklärung" data-tip="${esc(tip)}">?</span>`;
  const tipRz = "Umkehren, sobald ein Träger diesen Druck erreicht. Mit gemeldetem Zieldruck: Reserve + 2×(Start − Zieldruck). Ohne Zieldruck: Vorabwert (2×Start + Reserve)/3. „sofort“ = Hinweg zu verbrauchsintensiv, normgerechter Rückweg nicht mehr möglich → sofort umkehren.";
  const tipReserve = "Sicherheitsreserve / Warnschwelle (Restdruckwarner ~50–60 bar) – Druck, der beim Rückzug übrig bleiben soll.";
  const tipErwartet = "Richtwert der erwarteten Einsatzzeit ab Anschluss. FwDV 7: Hinweis an den Trupp bei 1/3 und 2/3 dieser Zeit.";
  const tipAus = "Uhrzeit, zu der der Trupp ausgerückt ist – Beginn der Gesamteinsatzzeit.";
  const tipGesamt = "Laufende Gesamtzeit seit Ausrücken.";
  const cards = aktiv.map(t => {
    const reserve = asReserve(t), erwartet = asErwartet(t);
    const connected = !!t.angeschlossen;
    const anchor = asMonitorStart(t);
    const rzGov = asRzTrupp(t);
    const prog = asRestzeit(t);   // dynamische Restzeit-Prognose (frühester Umkehrzeitpunkt)
    const checks = t.checks || {};
    const below = asBelow(t);   // Rückzug fällig (Umkehrdruck erreicht oder Hinweg zu verbrauchsintensiv)
    const mit = (t.memberIds||[]).map(id => {
      const tr = state.asTraeger.find(x => x.id === id) || {};
      const d = (t.druck||{})[id] || {};
      const rz = asRzMember(d.start, d.ziel, reserve);
      const ist = d.k23 || d.k13;   // gemeldeter Ist-Druck bei der Druckkontrolle
      const istLow = rz && (rz.sofort || (ist && Number(ist) <= rz.bar));
      const umkehr = rz ? (rz.sofort ? "sofort" : rz.bar) : null;
      return `<div class="as-uz">${esc(tr.name||"?")}${t.tf===id?` <span class="as-typ">TF</span>`:""}${tr.csa?` <span class="as-typ">CSA</span>`:""}
        <span class="as-druck">${d.start?esc(d.start)+" bar":"– bar"}${d.ziel?` → Ziel ${esc(d.ziel)}`:""}${ist?` → jetzt <b class="${istLow?"as-low":""}">${esc(ist)}</b>`:""}${umkehr!=null?` → Umkehr <b class="${rz.sofort?"as-low":""}">${umkehr}</b>`:""}</span></div>`;
    }).join("");
    return `
    <div class="as-ueber" data-as-card data-as-elapsed="${esc(anchor)}" data-as-connected="${connected?1:0}" data-as-erwartet="${erwartet}" data-as-c13="${checks.drittel?1:0}" data-as-c23="${checks.zweidrittel?1:0}" data-as-below="${below?1:0}" data-as-rate="${prog?prog.rate:0}" data-as-mzeit="${prog?esc(prog.zeit):""}" data-as-mdruck="${prog?prog.druck:0}" data-as-rz="${prog?prog.rueckzug:0}" data-as-umkehrok="${esc(t.umkehrOk||"")}">
      ${asNrBadge(t, true)}
      <div style="flex:1;min-width:0">
        <div class="as-mit">${mit}</div>
        <div class="as-loc"><strong>${esc(t.abschnitt||"–")}</strong>${t.funkruf?` <span class="as-loc-funk mono">${esc(t.funkruf)}</span>`:""}${t.zielZeit?` <span class="as-sub2">· Ziel ${fmtZeit(t.zielZeit)} Uhr</span>`:""}</div>
        <div class="as-meta">
          <span class="as-chip hot"><b>Rückzugsdruck ${help(tipRz)}</b><i>${rzGov?(rzGov.sofort?"sofort":rzGov.bar+" bar"):"–"}${rzGov&&!rzGov.dyn&&!rzGov.sofort?` <span class="as-vorlauf">vorl.</span>`:""}</i></span>
          <span class="as-chip"><b>Reserve ${help(tipReserve)}</b><i>${reserve} bar</i></span>
          <span class="as-chip"><b>erwartet ${help(tipErwartet)}</b><i>${erwartet} min</i></span>
          <span class="as-chip"><b>ausgerückt ${help(tipAus)}</b><i>${fmtZeit(t.ausgerueckt)} Uhr</i></span>
          ${connected?`<span class="as-chip"><b>gesamt ${help(tipGesamt)}</b><i data-as-aus="${esc(t.ausgerueckt||"")}">–</i></span>`:""}
        </div>
        <div class="as-phase" data-as-phase>–</div>
      </div>
      <div class="as-timer">
        <span class="mono" data-as-clock>–</span>
        <small class="as-sub2" data-as-sublabel>${connected ? "an PA" : "seit Ausrücken"}</small>
        ${!connected ? `<button class="btn btn-primary" data-asang="${t.id}" style="min-height:44px">Angeschlossen</button>` : ""}
        ${connected ? `<button class="btn as-ack" data-asack="${t.id}" style="min-height:44px;display:none">Druck geprüft</button>` : ""}
        ${connected ? `<button class="btn btn-primary" data-asumkehr="${t.id}" style="min-height:44px;display:none">Umkehren bestätigen</button>` : ""}
        <button class="btn btn-ghost" data-asziel="${t.id}" style="min-height:44px">Einsatzziel erreicht</button>
        <button class="btn ${connected?"btn-primary":"btn-ghost"}" data-aszurueck="${t.id}" style="min-height:44px">Zurück</button>
      </div>
    </div>`;
  }).join("");
  return `
  <p class="hint" style="margin:0 0 12px">FwDV 7: Überwachungsuhr läuft ab <strong>„Angeschlossen"</strong>. Ab <strong>„Einsatzziel erreicht"</strong> (und jeder Druckkontrolle) rechnet der Timer aus dem gemeldeten Druck den Verbrauch hoch und zählt <strong>rückwärts bis zum Umkehren</strong>.
  <strong>Hilfsmittel – ersetzt nicht die Eigenkontrolle des Trupps.</strong></p>
  <div class="as-ueber-list">${cards}</div>`;
}
function asElapsedStr(iso){
  const d = iso ? new Date(iso) : null;
  if(!d || isNaN(d)) return "–";
  const s = Math.max(0, Math.floor((Date.now()-d.getTime())/1000));
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")} min`;
}
// Dringlichkeit eines Trupps für die Auto-Sortierung (3=Rückzug, 2=Druckabfrage fällig, 1=über 2/3, 0=normal)
function asPrio(t){
  if(t.status !== "einsatz") return -1;
  const erwartet = asErwartet(t), connected = !!t.angeschlossen;
  const anchor = asMonitorStart(t);
  const min = anchor ? (Date.now()-new Date(anchor).getTime())/60000 : 0;
  if(asBelow(t)) return 3;
  const c = t.checks || {};
  if(connected && ((min>=erwartet/3 && !c.drittel) || (min>=erwartet*2/3 && !c.zweidrittel))) return 2;
  if(connected && min>=erwartet*2/3) return 1;
  return 0;
}
function asOrderKey(){
  return state.asTrupps.filter(t => t.status==="einsatz")
    .slice().sort((a,b) => asPrio(b)-asPrio(a) || a.nr-b.nr)
    .map(t => t.id+":"+asPrio(t)).join(",");
}
function asPhaseInfo(min, erwartet, connected, c13, c23){
  if(!connected) return { txt:"vor PA-Anschluss – Uhr läuft ab „Angeschlossen“", cls:"", due:false };
  const due13 = min >= erwartet/3   && !c13;   // 1/3-Druckabfrage offen
  const due23 = min >= erwartet*2/3 && !c23;   // 2/3-Druckabfrage offen
  if(due23)               return { txt:`⚠ 2/3 (${Math.round(erwartet*2/3)} min) – Druckabfrage fällig!`, cls:"krit", due:true };
  if(due13)               return { txt:`⚠ 1/3 (${Math.round(erwartet/3)} min) – Druckabfrage fällig!`, cls:"warn", due:true };
  if(min >= erwartet)     return { txt:`Richtwert ${erwartet} min erreicht – Rückzug einleiten`, cls:"krit", due:false };
  if(min >= erwartet*2/3) return { txt:`2/3-Kontrolle quittiert – Rückzug vorbereiten`, cls:"warn", due:false };
  if(min >= erwartet/3)   return { txt:`1/3-Kontrolle quittiert`, cls:"ok", due:false };
  return { txt:"überwacht seit PA-Anschluss", cls:"ok", due:false };
}
function asTick(){
  document.querySelectorAll("[data-as-card]").forEach(card => {
    const anchor = card.dataset.asElapsed;
    const connected = card.dataset.asConnected === "1";
    const erwartet = Number(card.dataset.asErwartet) || AS_ERWARTET_DEFAULT;
    const c13 = card.dataset.asC13 === "1", c23 = card.dataset.asC23 === "1";
    const min = anchor ? (Date.now()-new Date(anchor).getTime())/60000 : 0;
    // Haupttimer: ab „Einsatzziel erreicht" / Druckkontrolle als Countdown bis Umkehren
    // (aus gemessenem Verbrauch hochgerechnet), davor die verstrichene Zeit ab „Angeschlossen".
    const rate = Number(card.dataset.asRate), mzeit = card.dataset.asMzeit;
    const mdruck = Number(card.dataset.asMdruck), rzBar = Number(card.dataset.asRz);
    const hasProj = connected && rate > 0 && mzeit;
    const clock = card.querySelector("[data-as-clock]");
    const sub = card.querySelector("[data-as-sublabel]");
    let umkehrByTime = false;   // Countdown auf/unter 0 → Umkehren rechnerisch fällig
    if(hasProj){
      const cur = mdruck - rate * ((Date.now() - new Date(mzeit).getTime()) / 60000);
      const remSec = Math.round(((cur - rzBar) / rate) * 60);
      umkehrByTime = remSec <= 0;
      const a = Math.abs(remSec);
      if(clock){
        // reines MM:SS (Countdown) – kein „min", damit Minuten/Sekunden nicht verwechselt werden
        clock.textContent = remSec > 0 ? `${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}` : "umkehren";
        clock.classList.toggle("warn", remSec > 0 && remSec <= 120);
        clock.classList.toggle("krit", remSec <= 0);
      }
      if(sub) sub.textContent = remSec > 0 ? "min:sek bis Umkehr" : "Rückzugsdruck erreicht";
    }else{
      if(clock){
        clock.textContent = asElapsedStr(anchor);
        clock.classList.toggle("warn", connected && min >= erwartet*2/3 && min < erwartet);
        clock.classList.toggle("krit", connected && min >= erwartet);
      }
      if(sub) sub.textContent = connected ? "an PA" : "seit Ausrücken";
    }
    const info = asPhaseInfo(min, erwartet, connected, c13, c23);
    const checkDue = !!info.due;                         // 1/3- oder 2/3-Druckabfrage offen
    const below = card.dataset.asBelow === "1";          // ein Träger hat den Umkehrdruck erreicht
    const umkehr = below || umkehrByTime;                // Umkehren fällig (Druck erreicht ODER Zeit abgelaufen)
    const umkehrOk = card.dataset.asUmkehrok || "";      // Zeitstempel „Trupp informiert" (leer = offen)
    const phase = card.querySelector("[data-as-phase]");
    const ph = (umkehr && umkehrOk) ? { txt:`✓ Umkehren bestätigt ${fmtZeit(umkehrOk)} Uhr – Trupp informiert`, cls:"ok" }
      : umkehr ? { txt:"⚠ Umkehren – Trupp informieren und bestätigen!", cls:"krit" }
      : info;
    if(phase){ phase.textContent = ph.txt; phase.className = "as-phase " + ph.cls; }
    // Blinken bei fälliger Druckabfrage oder Umkehren – hört auf, sobald die Umkehr bestätigt ist
    card.classList.toggle("blink", checkDue || (umkehr && !umkehrOk));
    card.classList.toggle("danger", umkehr);             // rot, solange Rückzug/Umkehren läuft
    const ack = card.querySelector("[data-asack]");
    if(ack) ack.style.display = checkDue ? "" : "none";  // „Druck geprüft" nur bei fälliger Kontrolle
    const umk = card.querySelector("[data-asumkehr]");   // „Umkehren bestätigen" nur wenn fällig & offen
    if(umk) umk.style.display = (umkehr && !umkehrOk) ? "" : "none";
    const aus = card.querySelector("[data-as-aus]");
    if(aus) aus.textContent = asElapsedStr(aus.dataset.asAus);
  });
  // Auto-Sortierung: ändert sich die Dringlichkeits-Reihenfolge, Ansicht neu aufbauen (Warn-Trupps nach oben)
  if(!document.querySelector(".sheet") && asOrderKey() !== asOrderSig){ asOrderSig = asOrderKey(); render(); }
}
setInterval(() => { if(state && state.view === "atemschutz" && state.asSub === "ueberwachung") asTick(); }, 1000);

function wireAtemschutz(){
  document.querySelectorAll("[data-assub]").forEach(b =>
    b.addEventListener("click", () => { state.asSub = b.dataset.assub; save(); render(); }));
  const reg = $("#btnTraegerReg"); if(reg) reg.addEventListener("click", () => openTraegerEditor(null));
  const bild = $("#btnTruppBilden"); if(bild) bild.addEventListener("click", () => openTruppEditor(null));
  const pas = $("#btnPrintAs"); if(pas) pas.addEventListener("click", doPrintAtemschutz);
  document.querySelectorAll("[data-astraegeredit]").forEach(b =>
    b.addEventListener("click", () => openTraegerEditor(b.dataset.astraegeredit)));
  document.querySelectorAll("[data-astruppedit]").forEach(b =>
    b.addEventListener("click", () => openTruppEditor(b.dataset.astruppedit)));
  document.querySelectorAll("[data-asein]").forEach(b => b.addEventListener("click", () => {
    const t = state.asTrupps.find(x => x.id === b.dataset.asein);
    if(t){ t.status = "einsatz"; t.ausgerueckt = new Date().toISOString(); markChange(); render(); }
  }));
  document.querySelectorAll("[data-asang]").forEach(b => b.addEventListener("click", () => {
    const t = state.asTrupps.find(x => x.id === b.dataset.asang);
    if(t){ t.angeschlossen = new Date().toISOString(); markChange(); render(); }  // FwDV 7: Uhrzeit beim Anschließen der Luftversorgung → Überwachungsuhr startet
  }));
  document.querySelectorAll("[data-aszurueck]").forEach(b =>
    b.addEventListener("click", () => openRueckmeldung(b.dataset.aszurueck)));
  document.querySelectorAll("[data-asziel]").forEach(b =>
    b.addEventListener("click", () => openZielmeldung(b.dataset.asziel)));
  document.querySelectorAll("[data-asack]").forEach(b =>
    b.addEventListener("click", () => openDruckkontrolle(b.dataset.asack)));
  document.querySelectorAll("[data-asumkehr]").forEach(b => b.addEventListener("click", () => {
    const t = state.asTrupps.find(x => x.id === b.dataset.asumkehr);
    if(t){ t.umkehrOk = new Date().toISOString(); markChange(); render(); }  // Umkehren an Trupp bestätigt
  }));
  document.querySelectorAll("[data-aswieder]").forEach(b => b.addEventListener("click", () => {
    const t = state.asTrupps.find(x => x.id === b.dataset.aswieder);
    if(!t) return;
    openTruppEditor(null, t.memberIds);   // neuer Trupp, neue Nummer, Mitglieder vorbelegt
  }));
  document.querySelectorAll("[data-astruppdel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diesen Trupp wirklich entfernen? Die Träger werden wieder frei.").then(ok => { if(!ok) return;
      state.asTrupps = state.asTrupps.filter(x => x.id !== b.dataset.astruppdel);
      markChange(); render();
    });
  }));
  if(state.asSub === "ueberwachung") asTick();
}

function openRueckmeldung(id){
  const t = state.asTrupps.find(x => x.id === id);
  if(!t) return;
  const jetzt = fmtZeit(new Date().toISOString());
  const rows = (t.memberIds||[]).map(mid => {
    const tr = state.asTraeger.find(x => x.id === mid) || {};
    const d = t.druck[mid] || {};
    return `<div class="as-druckrow">
      <span>${esc(tr.name||"?")}<br><small class="mono" style="color:var(--ink3)">Start ${d.start?esc(d.start)+" bar":"–"}</small></span>
      <input data-endd="${esc(mid)}" class="mono" inputmode="numeric" value="${esc(d.end||"")}" placeholder="Enddruck bar"></div>`;
  }).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Trupp zurückgemeldet">
    <div class="sheet-head"><h2>Trupp ${t.nr} zurückgemeldet</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field" style="max-width:170px"><label for="rm-zeit">Rückkehr-Uhrzeit</label>
        <input id="rm-zeit" type="time" class="mono" value="${jetzt}"></div>
      <div class="field"><label>Enddruck je Träger (bar)</label><div>${rows}</div></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" id="rm-save" style="flex:1">Rückmeldung speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#rm-save").addEventListener("click", () => {
    document.querySelectorAll("[data-endd]").forEach(inp => {
      t.druck[inp.dataset.endd] = t.druck[inp.dataset.endd] || {};
      t.druck[inp.dataset.endd].end = inp.value.trim();
    });
    const tv = $("#rm-zeit").value;
    const d = new Date();
    if(tv){ const [h,m] = tv.split(":").map(Number); d.setHours(h,m,0,0); }
    t.status = "zurueck"; t.rueckkehr = d.toISOString();
    markChange(); closeEditor(); render();
  });
}
// FwDV 7: „Erreichen des Einsatzziels" – Druck je Träger erfassen → dynamischer Rückzugsdruck
function openZielmeldung(id){
  const t = state.asTrupps.find(x => x.id === id);
  if(!t) return;
  const jetzt = fmtZeit(t.zielZeit || new Date().toISOString());
  const reserve = asReserve(t);
  const rows = (t.memberIds||[]).map(mid => {
    const tr = state.asTraeger.find(x => x.id === mid) || {};
    const d = t.druck[mid] || {};
    return `<div class="as-druckrow">
      <span>${esc(tr.name||"?")}<br><small class="mono" style="color:var(--ink3)">Start ${d.start?esc(d.start)+" bar":"–"}</small></span>
      <input data-zield="${esc(mid)}" class="mono" inputmode="numeric" value="${esc(d.ziel||"")}" placeholder="Druck am Ziel"></div>`;
  }).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Einsatzziel erreicht">
    <div class="sheet-head"><h2>Trupp ${t.nr} – Einsatzziel erreicht</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field" style="max-width:170px"><label for="zm-zeit">Uhrzeit</label>
        <input id="zm-zeit" type="time" class="mono" value="${jetzt==="–"?"":jetzt}"></div>
      <div class="field"><label>Druck bei Zielerreichung je Träger (bar)</label><div>${rows}</div>
        <p class="hint">Daraus wird der Rückzugsdruck berechnet: Reserve ${reserve} bar + 2 × (Start − Zieldruck).</p></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" id="zm-save" style="flex:1">Zieldruck speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#zm-save").addEventListener("click", () => {
    document.querySelectorAll("[data-zield]").forEach(inp => {
      t.druck[inp.dataset.zield] = t.druck[inp.dataset.zield] || {};
      t.druck[inp.dataset.zield].ziel = inp.value.trim();
    });
    const tv = $("#zm-zeit").value;
    const d = new Date();
    if(tv){ const [h,m] = tv.split(":").map(Number); d.setHours(h,m,0,0); }
    t.zielZeit = d.toISOString();
    markChange(); closeEditor(); render();
  });
}
// FwDV 7: Druckkontrolle bei 1/3 bzw. 2/3 – gemeldeten Ist-Druck je Träger erfassen und Zeit registrieren
function openDruckkontrolle(id){
  const t = state.asTrupps.find(x => x.id === id);
  if(!t) return;
  t.checks = t.checks || {};
  const erwartet = asErwartet(t);
  const anchor = asMonitorStart(t);
  const min = anchor ? (Date.now()-new Date(anchor).getTime())/60000 : 0;
  // fällige Stufe = früheste offene (1/3 vor 2/3)
  const stage = (min >= erwartet/3 && !t.checks.drittel) ? "drittel"
    : (min >= erwartet*2/3 && !t.checks.zweidrittel) ? "zweidrittel" : "drittel";
  const stageKey = stage === "drittel" ? "k13" : "k23";
  const stageLbl = stage === "drittel" ? "1/3" : "2/3";
  const reserve = asReserve(t);
  const jetzt = fmtZeit(new Date().toISOString());
  const rows = (t.memberIds||[]).map(mid => {
    const tr = state.asTraeger.find(x => x.id === mid) || {};
    const d = t.druck[mid] || {};
    const rz = asRzMember(d.start, d.ziel, reserve);
    return `<div class="as-druckrow">
      <span>${esc(tr.name||"?")}<br><small class="mono" style="color:var(--ink3)">Start ${d.start?esc(d.start):"–"} · Umkehr ${rz?rz.bar:"–"} bar</small></span>
      <input data-kd="${esc(mid)}" class="mono" inputmode="numeric" value="${esc(d[stageKey]||"")}" placeholder="Ist-Druck bar"></div>`;
  }).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Druckkontrolle">
    <div class="sheet-head"><h2>Trupp ${t.nr} – Druckkontrolle ${stageLbl}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field" style="max-width:170px"><label for="kd-zeit">Uhrzeit</label>
        <input id="kd-zeit" type="time" class="mono" value="${jetzt}"></div>
      <div class="field"><label>Gemeldeter Behälterdruck je Träger (bar)</label><div>${rows}</div>
        <p class="hint">FwDV 7: Hinweis bei ${stageLbl} der Einsatzzeit. Maßgeblich ist der niedrigste Druck; erreicht er den Umkehr-/Rückzugsdruck, ist der Rückzug einzuleiten.</p></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" id="kd-save" style="flex:1">Druckkontrolle ${stageLbl} speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#kd-save").addEventListener("click", () => {
    document.querySelectorAll("[data-kd]").forEach(inp => {
      t.druck[inp.dataset.kd] = t.druck[inp.dataset.kd] || {};
      const v = inp.value.trim();
      if(v) t.druck[inp.dataset.kd][stageKey] = v;
    });
    const tv = $("#kd-zeit").value;
    const d = new Date();
    if(tv){ const [h,m] = tv.split(":").map(Number); d.setHours(h,m,0,0); }
    t.checks[stage] = d.toISOString();
    markChange(); closeEditor(); render();
  });
}
function openTraegerEditor(id){
  const neu = !id;
  const tr = id ? {...state.asTraeger.find(x => x.id === id)}
    : { id:uid(), name:"", feuerwehr:"", geraetetyp:AS_GERAETETYP, geraeteNr:"", maskeNr:"", lungenNr:"", csa:false };
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${neu?"Träger registrieren":"Träger bearbeiten"}">
    <div class="sheet-head"><h2>${neu?"Geräteträger registrieren":"Geräteträger"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field"><label for="tr-name">Name</label>
        <input id="tr-name" value="${esc(tr.name)}" placeholder="Nachname, Vorname" autocomplete="off"></div>
      <div class="field"><label for="tr-fw">Feuerwehr</label>
        <input id="tr-fw" value="${esc(tr.feuerwehr)}" list="tr-fw-list" placeholder="Name der Feuerwehr" autocomplete="off">
        <datalist id="tr-fw-list">${[...new Set(state.asTraeger.map(x=>x.feuerwehr).filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div>
      <div class="field"><label style="margin-bottom:8px">Gerät, Maske &amp; Lungenautomat <span style="text-transform:none;font-weight:500;color:var(--accent)">· Pflicht (${esc(AS_GERAETETYP)})</span></label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px"><label for="tr-gnr" style="font-size:.72rem">Gerätenummer</label>
            <input id="tr-gnr" class="mono" value="${esc(tr.geraeteNr||"")}" placeholder="PA-Nr." inputmode="numeric" autocomplete="off"></div>
          <div style="flex:1;min-width:120px"><label for="tr-mnr" style="font-size:.72rem">Maskennummer</label>
            <input id="tr-mnr" class="mono" value="${esc(tr.maskeNr||"")}" placeholder="Masken-Nr." inputmode="numeric" autocomplete="off"></div>
          <div style="flex:1;min-width:120px"><label for="tr-lnr" style="font-size:.72rem">Lungenautomat-Nr.</label>
            <input id="tr-lnr" class="mono" value="${esc(tr.lungenNr||"")}" placeholder="LA-Nr." inputmode="numeric" autocomplete="off"></div>
        </div>
        <p class="hint">Lungenautomat wird mit der Gerätenummer vorbelegt (oft identisch) – bei Bedarf überschreiben.</p></div>
      <div class="field"><label>Zusatz</label>
        <label class="as-check"><input type="checkbox" id="tr-csa" ${tr.csa?"checked":""}> CSA-Träger (Chemikalienschutzanzug)</label></div>
    </div>
    <div class="sheet-foot">
      ${neu?"":`<button class="btn btn-danger-ghost" id="tr-del">Löschen</button>`}
      <button class="btn btn-primary" id="tr-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  // Lungenautomat-Nr. mit Gerätenummer vorbelegen, solange sie nicht eigenständig bearbeitet wurde
  const gnr = $("#tr-gnr"), lnr = $("#tr-lnr");
  let laManuell = !!(tr.lungenNr && tr.lungenNr !== tr.geraeteNr);
  const syncLA = () => { if(!laManuell) lnr.value = gnr.value.trim(); };
  gnr.addEventListener("input", syncLA);
  lnr.addEventListener("input", () => { laManuell = lnr.value.trim() !== "" && lnr.value.trim() !== gnr.value.trim(); });
  const del = $("#tr-del");
  if(del) del.addEventListener("click", () => {
    const trupp = asTruppOf(tr.id);
    if(trupp){ modalInfo(`Träger ist in Trupp ${trupp.nr} eingeteilt – erst dort entfernen.`); return; }
    state.asTraeger = state.asTraeger.filter(x => x.id !== tr.id);
    markChange(); closeEditor(); render();
  });
  $("#tr-save").addEventListener("click", () => {
    tr.name = $("#tr-name").value.trim();
    tr.feuerwehr = $("#tr-fw").value.trim();
    tr.geraetetyp = AS_GERAETETYP;
    tr.geraeteNr = $("#tr-gnr").value.trim();
    tr.maskeNr = $("#tr-mnr").value.trim();
    tr.lungenNr = $("#tr-lnr").value.trim() || tr.geraeteNr;
    tr.csa = $("#tr-csa").checked;
    delete tr.zusatz;
    if(!tr.name){ $("#tr-name").focus(); return; }
    const fehlt = !tr.geraeteNr ? "#tr-gnr" : !tr.maskeNr ? "#tr-mnr" : !tr.lungenNr ? "#tr-lnr" : null;
    if(fehlt){ modalInfo("Geräte-, Masken- und Lungenautomatennummer sind Pflichtfelder."); $(fehlt).focus(); return; }
    const i = state.asTraeger.findIndex(x => x.id === tr.id);
    if(i>=0) state.asTraeger[i] = tr; else state.asTraeger.push(tr);
    markChange(); closeEditor(); render();
  });
}

function openTruppEditor(id, vorbelegt){
  const neu = !id;
  const src = id ? state.asTrupps.find(x => x.id === id) : null;
  const t = id ? {...src, memberIds:[...(src.memberIds||[])], druck: JSON.parse(JSON.stringify(src.druck||{}))}
    : { id:uid(), nr:asNextTruppNr(), memberIds:[...(vorbelegt||[])], abschnitt:"", funkruf:"", zusatz:"",
        status:"registriert", ausgerueckt:"", angeschlossen:"", rueckkehr:"", druck:{},
        reserve:AS_RESERVE_DEFAULT, erwartetMin:AS_ERWARTET_DEFAULT };
  if(t.reserve == null) t.reserve = AS_RESERVE_DEFAULT;
  if(t.erwartetMin == null) t.erwartetMin = AS_ERWARTET_DEFAULT;
  // Auswählbare Träger: freie + die bereits in diesem Trupp
  const waehlbar = state.asTraeger.filter(tr => {
    const trupp = asTruppOf(tr.id);
    return !trupp || trupp.id === t.id || t.memberIds.includes(tr.id);
  });
  // Einsatzabschnitt aus den bestehenden Abschnitten; Abschnittsleiter-Funkruf übernehmbar
  const abList = state.abschnitte.map(a => ({ name:a.name, ap:a.ansprechpartner||"" }));
  const abLegacy = t.abschnitt && !abList.some(a => a.name === t.abschnitt);
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${neu?"Trupp bilden":"Trupp bearbeiten"}">
    <div class="sheet-head"><h2>Trupp ${t.nr}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field"><label>Mitglieder (2–3 Träger)</label>
        <div class="as-pick">
          ${waehlbar.length ? waehlbar.map(tr => `
            <button type="button" data-pick="${tr.id}" class="${t.memberIds.includes(tr.id)?"active":""}">
              <span>${esc(tr.name)}${tr.csa?" · CSA":""}</span><small>${esc(tr.feuerwehr||"")}${tr.geraeteNr?` · Gerät ${esc(tr.geraeteNr)}`:""}</small>
            </button>`).join("") : `<p class="hint" style="margin:0">Keine freien Träger – erst welche registrieren.</p>`}
        </div>
        <p class="hint" id="tr-count">${t.memberIds.length} ausgewählt</p></div>
      <div class="field" id="tp-druck-feld"><label>Startdruck je Träger (bar)</label>
        <div id="tp-druck"></div>
        <p class="hint">Vorbelegt ${AS_START_DEFAULT} bar, änderbar – zulässig über ${AS_START_MIN} bis ${AS_START_MAX} bar.</p></div>
      <div class="field" id="tp-tf-feld"><label>Truppführer</label>
        <div class="as-pick" id="tp-tf"></div>
        <p class="hint">Wird im Ausdruck oben mit den Zeiten geführt.</p></div>
      <div class="field"><label for="tp-ab">Einsatzabschnitt</label>
        <select id="tp-ab">
          <option value="">– Abschnitt wählen –</option>
          ${abLegacy ? `<option value="${esc(t.abschnitt)}" selected>${esc(t.abschnitt)}</option>` : ""}
          ${abList.map(a=>`<option value="${esc(a.name)}" data-ap="${esc(a.ap)}" ${t.abschnitt===a.name?"selected":""}>${esc(a.name)}</option>`).join("")}
        </select>
        ${abList.length ? "" : `<p class="hint">Noch keine Einsatzabschnitte angelegt (Tab „Einsatz").</p>`}</div>
      <div class="field"><label for="tp-funk">Funkruf Abschnittsleiter</label>
        <div style="display:flex;gap:8px">
          <input id="tp-funk" class="mono" style="flex:1" value="${esc(t.funkruf)}" data-auto="" placeholder="Funkrufname des Abschnittsleiters" autocomplete="off">
          <button type="button" class="btn btn-ghost" id="tp-funk-copy" style="flex:none">Übernehmen</button>
        </div>
        <p class="hint">Wird bei Abschnittswahl automatisch aus dem Abschnittsleiter übernommen – überschreibbar.</p></div>
      <div class="field" style="display:flex;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:130px"><label for="tp-reserve">Sicherheitsreserve (bar)</label>
          <input id="tp-reserve" class="mono" inputmode="numeric" value="${esc(String(asReserve(t)))}" placeholder="${AS_RESERVE_DEFAULT}"></div>
        <div style="flex:1;min-width:130px"><label for="tp-erwartet">Erwartete Zeit (min)</label>
          <input id="tp-erwartet" class="mono" inputmode="numeric" value="${esc(String(asErwartet(t)))}" placeholder="${AS_ERWARTET_DEFAULT}"></div>
      </div>
      <p class="hint" style="margin:-4px 0 0">FwDV 7: Rückzugsdruck = (2·Start + Reserve)/3 · Hinweise bei 1/3 &amp; 2/3 der erwarteten Zeit (Richtwert).</p>
      <div class="field"><label for="tp-zusatz">Auftrag / Bemerkung <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="tp-zusatz" value="${esc(t.zusatz)}" placeholder="Einsatzauftrag" autocomplete="off"></div>
      ${!neu ? `<div class="field" style="display:flex;gap:10px;flex-wrap:wrap">
        <div style="width:140px"><label for="tp-aus">Ausgerückt</label><input id="tp-aus" type="time" class="mono" value="${fmtZeit(t.ausgerueckt)==="–"?"":fmtZeit(t.ausgerueckt)}"></div>
        <div style="width:140px"><label for="tp-ang">Angeschlossen</label><input id="tp-ang" type="time" class="mono" value="${fmtZeit(t.angeschlossen)==="–"?"":fmtZeit(t.angeschlossen)}"></div>
        <div style="width:140px"><label for="tp-ret">Zurück</label><input id="tp-ret" type="time" class="mono" value="${fmtZeit(t.rueckkehr)==="–"?"":fmtZeit(t.rueckkehr)}"></div>
      </div>` : ""}
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary" id="tp-save" style="flex:1">${neu?"Trupp bilden":"Speichern"}</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const leseDruck = () => document.querySelectorAll("[data-druck]").forEach(inp => {
    t.druck[inp.dataset.druck] = t.druck[inp.dataset.druck] || {};
    t.druck[inp.dataset.druck].start = inp.value.trim();
  });
  const baueDruck = () => {
    $("#tp-druck-feld").style.display = t.memberIds.length ? "" : "none";
    $("#tp-druck").innerHTML = t.memberIds.map(mid => {
      const tr = state.asTraeger.find(x => x.id === mid) || {};
      const d = (t.druck[mid]||{}).start || String(AS_START_DEFAULT);
      return `<div class="as-druckrow">
        <span>${esc(tr.name||"?")}${tr.geraeteNr?` <small class="mono">(${esc(tr.geraeteNr)})</small>`:""}</span>
        <input data-druck="${esc(mid)}" class="mono" inputmode="numeric" value="${esc(d)}" placeholder="${AS_START_DEFAULT}"></div>`;
    }).join("");
  };
  const baueTf = () => {
    $("#tp-tf-feld").style.display = t.memberIds.length ? "" : "none";
    if(!t.memberIds.includes(t.tf)) t.tf = t.memberIds[0] || "";   // Standard: erster Träger
    const host = $("#tp-tf");
    host.innerHTML = t.memberIds.map(mid => {
      const tr = state.asTraeger.find(x => x.id === mid) || {};
      return `<button type="button" data-tf="${esc(mid)}" class="${t.tf===mid?"active":""}"><span>${esc(tr.name||"?")}</span></button>`;
    }).join("");
    host.querySelectorAll("[data-tf]").forEach(b => b.addEventListener("click", () => {
      t.tf = b.dataset.tf;
      host.querySelectorAll("[data-tf]").forEach(x => x.classList.toggle("active", x.dataset.tf === t.tf));
    }));
  };
  baueDruck(); baueTf();
  // Funkruf des Abschnittsleiters bei Abschnittswahl übernehmen
  const abSel = $("#tp-ab"), funkInp = $("#tp-funk");
  const abAp = () => { const o = abSel.selectedOptions[0]; return o ? (o.dataset.ap||"") : ""; };
  abSel.addEventListener("change", () => {
    const ap = abAp();
    if(ap && (!funkInp.value.trim() || funkInp.value.trim() === funkInp.dataset.auto)){
      funkInp.value = ap; funkInp.dataset.auto = ap;
    }
  });
  $("#tp-funk-copy").addEventListener("click", () => {
    const ap = abAp();
    if(ap){ funkInp.value = ap; funkInp.dataset.auto = ap; }
    else modalInfo("Für den gewählten Abschnitt ist kein Abschnittsleiter/Funkruf hinterlegt.");
  });
  document.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", () => {
    leseDruck();  // aktuelle Eingaben sichern, bevor neu aufgebaut wird
    const pid = b.dataset.pick;
    if(t.memberIds.includes(pid)) t.memberIds = t.memberIds.filter(x => x !== pid);
    else if(t.memberIds.length < 3) t.memberIds.push(pid);
    document.querySelectorAll("[data-pick]").forEach(x => x.classList.toggle("active", t.memberIds.includes(x.dataset.pick)));
    $("#tr-count").textContent = `${t.memberIds.length} ausgewählt`;
    baueDruck(); baueTf();
  }));
  const setTime = (field, val) => {
    if(!val) return;
    const [h,m] = val.split(":").map(Number);
    const d = t[field] ? new Date(t[field]) : new Date();
    d.setHours(h,m,0,0); t[field] = d.toISOString();
  };
  $("#tp-save").addEventListener("click", () => {
    if(t.memberIds.length < 2){ modalInfo("Ein Trupp braucht mindestens 2 Träger."); return; }
    leseDruck();
    // Druck-Einträge auf aktuelle Mitglieder begrenzen
    Object.keys(t.druck).forEach(k => { if(!t.memberIds.includes(k)) delete t.druck[k]; });
    // Startdruck prüfen: über 50, höchstens 350 bar
    for(const mid of t.memberIds){
      const s = Number((t.druck[mid]||{}).start);
      if(!(s > AS_START_MIN && s <= AS_START_MAX)){
        modalInfo(`Startdruck muss über ${AS_START_MIN} und höchstens ${AS_START_MAX} bar sein (${asTraegerName(mid)}).`);
        return;
      }
    }
    t.abschnitt = $("#tp-ab").value.trim();
    t.funkruf = $("#tp-funk").value.trim();
    t.zusatz = $("#tp-zusatz").value.trim();
    const rv = Number($("#tp-reserve").value); t.reserve = rv>0 ? rv : AS_RESERVE_DEFAULT;
    const ev = Number($("#tp-erwartet").value); t.erwartetMin = ev>0 ? ev : AS_ERWARTET_DEFAULT;
    if($("#tp-aus")) setTime("ausgerueckt", $("#tp-aus").value);
    if($("#tp-ang")) setTime("angeschlossen", $("#tp-ang").value);
    if($("#tp-ret")) setTime("rueckkehr", $("#tp-ret").value);
    const i = state.asTrupps.findIndex(x => x.id === t.id);
    if(i>=0) state.asTrupps[i] = t; else state.asTrupps.push(t);
    markChange(); closeEditor(); render();
  });
}

/* Atemschutz-Nachweis nach FwDV 7 – nur die Trupp-Tabelle, ohne den gesamten Einsatzbericht */
function doPrintAtemschutz(){
  const e = state.einsatz;
  const trupps = [...state.asTrupps].sort((a,b) => a.nr-b.nr);
  const rows = trupps.map(t => {
    const mem = t.memberIds||[];
    // Truppführer zuerst listen (steht oben mit den Zeiten)
    const ids = (t.tf && mem.includes(t.tf)) ? [t.tf, ...mem.filter(x => x !== t.tf)] : mem;
    const rz = asRzTrupp(t);
    const dauer = dauerStr(asMonitorStart(t), t.rueckkehr);
    return ids.map((id,idx) => {
      const tr = (state.asTraeger||[]).find(x=>x.id===id) || {};
      const d = (t.druck||{})[id] || {};
      const istTf = t.tf ? id === t.tf : idx === 0;
      return `<tr>
        <td class="p-mono">${idx===0?t.nr:""}</td>
        <td>${esc(tr.name||"?")}${istTf?` <b>(TF)</b>`:""}${tr.feuerwehr?` <span style="color:#666">(${esc(tr.feuerwehr)})</span>`:""}</td>
        <td class="p-mono">${esc(tr.geraeteNr||"–")} / ${esc(tr.maskeNr||"–")} / ${esc(tr.lungenNr||"–")}</td>
        <td style="text-align:center">${tr.csa?"CSA":""}</td>
        <td class="p-mono">${d.start?esc(d.start):""}</td>
        <td class="p-mono">${d.ziel?esc(d.ziel):""}</td>
        <td class="p-mono">${d.end?esc(d.end):""}</td>
        <td class="p-mono">${idx===0&&rz?(rz.sofort?"sofort":rz.bar+(rz.dyn?"":" (vorl.)")):""}</td>
        <td>${idx===0?esc(t.abschnitt||"–")+(t.funkruf?" / "+esc(t.funkruf):""):""}</td>
        <td class="p-mono">${idx===0&&t.ausgerueckt?fmtZeit(t.ausgerueckt):""}</td>
        <td class="p-mono">${idx===0&&t.angeschlossen?fmtZeit(t.angeschlossen):""}</td>
        <td class="p-mono">${idx===0&&t.zielZeit?fmtZeit(t.zielZeit):""}</td>
        <td class="p-mono">${idx===0&&t.rueckkehr?fmtZeit(t.rueckkehr):""}</td>
        <td class="p-mono">${idx===0?dauer:""}</td>
      </tr>`;
    }).join("");
  }).join("");
  $("#printArea").innerHTML = `
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Atemschutz-Nachweis · FwDV 7</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}${e.beginn ? " · Alarm " + fmtDatum(e.beginn) + " " + fmtZeit(e.beginn) + " Uhr" : ""}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    <table class="meta">
      <tr><td>Gerätetyp</td><td>${esc(AS_GERAETETYP)} (Pressluftatmer)</td></tr>
      <tr><td>Einsatzleiter</td><td>${esc(e.leiter) || "–"}</td></tr>
      <tr><td>Trupps gesamt</td><td>${trupps.length}</td></tr>
    </table>
    <h2>Atemschutztrupps (${trupps.length})</h2>
    ${trupps.length ? `<table><thead><tr><th>Nr.</th><th>Träger (Feuerwehr)</th><th>Gerät / Maske / LA</th><th>CSA</th><th>Start</th><th>Ziel</th><th>Ende</th><th>Rückzugsdr.</th><th>Abschnitt / Funk</th><th>ausgerückt</th><th>angeschl.</th><th>Ziel</th><th>zurück</th><th>Einsatzzeit</th></tr></thead><tbody>${rows}</tbody></table>` : "<p>Keine Atemschutztrupps erfasst.</p>"}
    <p style="font-size:8.5pt;color:#444;margin-top:10px">
      FwDV 7 – Registrierung: Uhrzeit beim Anschließen der Luftversorgung, Hinweise an den Trupp bei 1/3 und 2/3 der erwarteten Einsatzzeit,
      Erreichen des Einsatzziels und Beginn des Rückzugs. Rückzugsdruck = (2·Startdruck + Reserve)/3.
      Angaben sind ein Hilfsmittel und ersetzen nicht die Eigenkontrolle des Trupps.
    </p>
    <div class="p-foot">
      <div class="p-sign">Ort, Datum</div>
      <div class="p-sign">Atemschutzüberwachung</div>
    </div>
    <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Kräfteerfassung (Prototyp) · ${esc(state.config.ugName)}</p>`;
  window.print();
}

/* ---------------- Ansicht: Lagebesprechungen ---------------- */
let editingBespr = null; // { b, isNew }
function renderBespr(){
  const list = [...state.besprechungen].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||""));
  const items = list.length ? `<div class="fs-list">${list.map(b => {
    const snap = b.snapshotId ? (state.lage.snapshots||[]).find(s => s.id === b.snapshotId) : null;
    return `
    <div class="fs-item" role="button" tabindex="0" style="cursor:pointer" data-editbespr="${esc(b.id)}">
      <div class="fs-head">
        <span class="fs-zeit mono">${istHeute(b.zeit) ? "" : fmtTagKurz(b.zeit) + " "}${fmtZeit(b.zeit)} Uhr</span>
        <span class="fs-route"><strong>Lagebesprechung</strong></span>
        ${b.teilnehmer ? `<span>· ${esc(b.teilnehmer)}</span>` : ""}
      </div>
      <div class="fs-text" style="white-space:pre-wrap">${esc(b.protokoll)}</div>
      ${snap ? `<button class="btn btn-ghost" data-viewsnap="${esc(snap.id)}" style="min-height:40px;padding:6px 12px;font-size:.8rem;margin-top:8px">Lagebild ${fmtZeit(snap.zeit)} Uhr ansehen</button>` : ""}
    </div>`;
  }).join("")}</div>`
  : `<div class="empty"><p>Noch keine Lagebesprechung protokolliert.<br>Beschlüsse, Aufträge und Lageeinschätzung je Besprechung festhalten – die Zeitpunkte bleiben als Historie erhalten.</p></div>`;
  return `
  <div class="card">
    <h2>Nächste Lagebesprechung</h2>
    <div class="form-grid">
      <div class="field" style="margin-bottom:0;max-width:200px"><label for="b-next">Uhrzeit</label>
        <input id="b-next" data-ez="lagebespr" type="time" class="mono" value="${esc(state.einsatz.lagebespr||"")}"></div>
    </div>
    <p class="hint">Wird auf dem Einsatzmonitor mit Countdown angezeigt.</p>
  </div>
  <button class="btn btn-primary btn-block" id="btnAddBespr" style="margin-bottom:16px">＋&nbsp; Lagebesprechung protokollieren</button>
  ${items}`;
}
function wireBespr(){
  $("#b-next").addEventListener("change", e => {
    state.einsatz.lagebespr = e.target.value;
    markChange(); renderHeader();
  });
  $("#btnAddBespr").addEventListener("click", () => openBesprEditor(null));
  document.querySelectorAll("[data-editbespr]").forEach(el =>
    el.addEventListener("click", e => {
      if(e.target.closest("[data-viewsnap]")) return; // Lagebild-Knopf nicht als Bearbeiten werten
      openBesprEditor(el.dataset.editbespr);
    }));
  document.querySelectorAll("[data-viewsnap]").forEach(b =>
    b.addEventListener("click", () => openLgSnapshot(b.dataset.viewsnap)));
}
function openBesprEditor(id){
  if(id){
    const b = state.besprechungen.find(x => x.id === id);
    if(!b) return;
    editingBespr = { b: {...b}, isNew:false };
  }else{
    editingBespr = { b: { id:uid(), zeit:new Date().toISOString(), teilnehmer:"", protokoll:"" }, isNew:true };
  }
  const b = editingBespr.b;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingBespr.isNew?"Lagebesprechung protokollieren":"Protokoll bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingBespr.isNew ? "Lagebesprechung protokollieren" : "Protokoll bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="width:190px"><label for="b-datum">Datum</label>
            <input id="b-datum" type="date" class="mono" value="${fmtDateInput(b.zeit)}"></div>
          <div style="width:150px"><label for="b-zeit">Uhrzeit</label>
            <input id="b-zeit" type="time" class="mono" value="${fmtZeit(b.zeit)==="–"?"":fmtZeit(b.zeit)}"></div>
        </div>
      </div>
      <div class="field"><label for="b-teiln">Teilnehmer <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="b-teiln" value="${esc(b.teilnehmer||"")}" placeholder="z. B. EL, Abschnittsleiter 1+2, OrgL" autocomplete="off"></div>
      <div class="field"><label for="b-prot">Protokoll</label>
        <div style="display:flex;gap:8px;align-items:stretch">
          <textarea id="b-prot" style="flex:1;min-height:180px" placeholder="Lage, Beschlüsse, Aufträge, nächste Schritte …">${esc(b.protokoll)}</textarea>
          <button class="micbtn" id="b-mic" aria-label="Diktieren" title="Diktieren">
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>
          </button>
        </div></div>
      <div class="field">
        <button class="btn btn-ghost btn-block" id="b-freeze">Lagekarte jetzt einfrieren</button>
        <p class="hint" id="b-freeze-info">${b.snapshotId ? "Lagebild ist mit dieser Besprechung verknüpft – ansehen über den Knopf in der Liste." : "Friert den aktuellen Kartenstand ein und verknüpft das Lagebild mit dieser Besprechung."}</p>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingBespr.isNew ? "" : `<button class="btn btn-danger-ghost" id="b-del">Löschen</button>`}
      <button class="btn btn-primary" id="b-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  attachDictation($("#b-mic"), $("#b-prot"));
  $("#b-freeze").addEventListener("click", () => {
    const s = lgFreeze();
    b.snapshotId = s.id;
    $("#b-freeze-info").textContent = `Lagebild ${fmtZeit(s.zeit)} Uhr eingefroren und mit dieser Besprechung verknüpft.`;
  });
  const del = $("#b-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Dieses Protokoll wirklich löschen?").then(ok => { if(!ok) return;
      state.besprechungen = state.besprechungen.filter(x => x.id !== b.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#b-save").addEventListener("click", () => {
    const dv = $("#b-datum").value, tv = $("#b-zeit").value;
    if(dv && tv){
      const d = new Date(`${dv}T${tv}:00`);
      if(!isNaN(d)) b.zeit = d.toISOString();
    }
    b.teilnehmer = $("#b-teiln").value.trim();
    b.protokoll = $("#b-prot").value.trim();
    if(!b.protokoll){ $("#b-prot").focus(); return; }
    const idx = state.besprechungen.findIndex(x => x.id === b.id);
    if(idx >= 0) state.besprechungen[idx] = b; else state.besprechungen.push(b);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Monitor ---------------- */
let monAbPage = 0;                 // aktuelle Abschnitts-Seite (3 Kacheln je Seite)
let monAbLast = Date.now();        // Zeitpunkt des letzten Seitenwechsels
let monAbPaused = false;           // Rotation per Play/Pause anhaltbar
let monFull = false;               // Monitor-Vollbild: nur der graue Monitor, ohne App-Menü
function rotateAbschnitte(){
  if(monAbPaused) return;
  const pages = monAbPagesCount();
  if(pages <= 1){ monAbPage = 0; return; }
  if(Date.now() - monAbLast >= 30000){
    monAbLast = Date.now();
    monAbPage = (monAbPage + 1) % pages;
    render();
  }
}
function renderMonitor(){
  const e = state.einsatz;
  const act = aktive(), s = summen(act);
  // Fortschritt: wie viele Kräfte sind tatsächlich abgefragt (nicht mehr Schätzung)?
  const bestKraefte = act.filter(u => u.tatsaechlich !== false).length + state.fuehrung.filter(f => f.tatsaechlich !== false).length;
  const gesKraefte = act.length + state.fuehrung.length;
  const byOrg = Object.keys(ORGS).map(key => {
    const units = act.filter(u => u.org === key);
    return { key, ...ORGS[key], units, sum: summen(units) };
  }).filter(o => o.units.length);
  const maxG = Math.max(1, ...byOrg.map(o => o.sum.f+o.sum.u+o.sum.m));
  const orgRows = byOrg.map(o => {
    const g = o.sum.f+o.sum.u+o.sum.m;
    return `
    <div class="orgrow">
      <span class="chip chip-${o.key}">${o.short}</span>
      <div class="bar-wrap"><div class="bar" style="width:${Math.round(g/maxG*100)}%;background:var(${o.cssVar})"></div></div>
      <span class="num mono">${o.sum.f}/${o.sum.u}/${o.sum.m}/${g} <small>· ${o.units.length} Einh.</small></span>
    </div>`;
  }).join("") || `<p class="hint">Noch keine Kräfte an der Einsatzstelle.</p>`;

  const fkRows = [...state.fuehrung].sort((a,b) => (a.name||"").localeCompare(b.name||"", "de")).map(f => `
    <div class="fkrow">
      <span class="chip chip-${esc(f.org)}">${esc((ORGS[f.org]||ORGS.SON).short)}</span>
      <span class="fk-n">${esc(f.name)}${f.funkrufname?` <span class="mono" style="font-weight:600;color:var(--ink2)">${esc(f.funkrufname)}</span>`:""}</span>
      <span class="fk-f">${esc(f.funktion)}${f.einheit?` · ${esc(f.einheit)}`:""}</span>
    </div>`).join("");

  const fsMonRows = [...state.funk].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||""))
    .slice(0, 6).map(f => `
    <div class="fsm">
      <div class="fsm-top">
        ${f.wichtig ? `<span class="imp-dot" title="Wichtig"></span>` : ""}
        <span class="z mono">${istHeute(f.zeit) ? "" : fmtTagKurz(f.zeit) + " "}${fmtZeit(f.zeit)}</span>
        <span>${esc(f.von)} → ${esc(f.an)}</span>
      </div>
      <div class="fsm-text">${esc(f.text)}</div>
    </div>`).join("");

  // Abschnitts-Kacheln: Stärke, Erreichbarkeit, Fahrzeuge ausgeschrieben & alphabetisch
  const abCard = (title, units, opts) => {
    const su = summen(units);
    const g = su.f+su.u+su.m;
    // Kacheln wachsen nach unten – bei Großlagen stehen viele Fahrzeuge im Abschnitt
    const sorted = [...units].sort((x,y) => fullName(x).localeCompare(fullName(y), "de"));
    const rows = sorted.map(u => `
      <tr>
        <td><span class="chip chip-${esc(u.org)}">${esc((ORGS[u.org]||ORGS.SON).short)}</span></td>
        <td class="name mono">${esc(fullName(u))}</td>
        <td class="num mono">${staerkeStr(u)}</td>
        <td class="num mono">${u.agt||"–"}</td>
      </tr>`).join("");
    const funk = [
      gruppeStr(opts.fuehrung) ? `<span class="funk-badge"><small>Führung</small>${esc(gruppeStr(opts.fuehrung))}</span>` : "",
      gruppeStr(opts.arbeit) ? `<span class="funk-badge"><small>Arbeit</small>${esc(gruppeStr(opts.arbeit))}</span>` : "",
    ].join("");
    return `
    <div class="ab-card ${opts.none ? "none" : ""} ${opts.br ? "br" : ""}">
      <div class="ab-head">
        <div style="flex:1;min-width:0">
          <h4>${esc(title)}</h4>
          ${opts.sub ? `<div class="ab-cardsub">${esc(opts.sub)}</div>` : ""}
        </div>
        <div class="ab-staerke mono">${su.f}/${su.u}/${su.m}/${g}</div>
      </div>
      <div class="ab-sub">
        <span><strong class="mono">${units.length}</strong> Einheiten</span>
        <span>AGT <strong class="mono">${su.agt}</strong></span>
        <span>CSA <strong class="mono">${su.csa}</strong></span>
        ${opts.ansprechpartner ? `<span>Ansprechpartner <strong class="mono">${esc(opts.ansprechpartner)}</strong></span>` : ""}
      </div>
      ${funk ? `<div class="funkrow">${funk}</div>` : ""}
      ${rows ? `
      <div class="mon-tablewrap" style="margin-top:8px">
        <table class="mon-table ab-table">
          <thead><tr><th>Org.</th><th>Fahrzeug</th><th>Stärke</th><th>AGT</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>` : `<p class="hint" style="margin-top:12px">Keine Einheiten zugeordnet.</p>`}
    </div>`;
  };
  // Kachel-Daten sammeln (gefiltert um ausgeblendete); Rotation seitenweise
  const brUnits = act.filter(u => u.abschnitt === "BR");
  const cardsData = monCardsData();
  const AB_PER_PAGE = 3;
  const abPages = Math.max(1, Math.ceil(cardsData.length / AB_PER_PAGE));
  const specials = monSpecialPages();
  const totalPages = abPages + specials.length;
  if(monAbPage >= totalPages) monAbPage = 0;
  const specialKey = monAbPage >= abPages ? specials[monAbPage - abPages] : null;
  const isLagePage = specialKey === "karte";
  const isSkizzePage = specialKey === "skizze";
  const visible = specialKey ? [] : cardsData.slice(monAbPage*AB_PER_PAGE, monAbPage*AB_PER_PAGE + AB_PER_PAGE);
  const abCards = visible.map(c => abCard(c.title, c.units, c.opts)).join("");
  const pagerLabel = isLagePage ? "Lagekarte" : isSkizzePage ? "Funkskizze"
    : `${monAbPage*AB_PER_PAGE+1}–${Math.min((monAbPage+1)*AB_PER_PAGE, cardsData.length)} von ${cardsData.length}`;
  const abPager = totalPages > 1 ? `
    <div class="ab-pager" title="${monAbPaused ? "Rotation angehalten" : "Wechselt alle 30 Sekunden"}">
      <span>${pagerLabel}</span>
      ${Array.from({length:totalPages}, (_,i) => `<span class="dot ${i===monAbPage?"on":""}"></span>`).join("")}
      <span class="ab-cd mono" id="monAbCd">${monAbPaused ? "Pause" : ""}</span>
      ${specials.includes("karte") ? `
      <button class="ab-jump" id="monAbKarte" aria-label="${isLagePage ? "Zur Kräfteansicht" : "Zur Lagekarte"}">
        ${isLagePage
          ? `<svg viewBox="0 0 24 24"><path d="M2.5 15V9.5A1.5 1.5 0 0 1 4 8h9.5v7"/><path d="M13.5 9.5H18l3.5 3.5v2h-8"/><circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Kräfte`
          : `<svg viewBox="0 0 24 24"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14"/></svg>Karte`}
      </button>` : ""}
      <button class="ab-play" id="monAbPrev" aria-label="Vorherige Seite">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5z"/></svg>
      </button>
      <button class="ab-play" id="monAbNext" aria-label="Nächste Abschnitte">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5z"/></svg>
      </button>
      <button class="ab-play" id="monAbToggle" aria-label="${monAbPaused ? "Rotation fortsetzen" : "Rotation anhalten"}">
        ${monAbPaused
          ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`
          : `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/></svg>`}
      </button>
    </div>` : "";

  return `
  <div class="mon-root">
    <div class="monitor">
      <div class="mon-head">
        <div class="mon-title">
          <div class="eyebrow"><span style="color:var(--accent)">ELW</span><span style="color:var(--ink)">IS</span> · ${esc(state.config.ugName)} · Kräfteübersicht</div>
          <h2>${esc(e.stichwort) || "Kein Einsatz angelegt"}</h2>
          <div class="ort">${esc(e.ort)}${e.leiter ? " · EL: " + esc(e.leiter) : ""}</div>
        </div>
        <div class="mon-clockbox">
          <div class="mon-clock mono" id="monClock">--:--</div>
          <div class="mon-dauer" id="monDauer"></div>
        </div>
        <div class="mon-headctrl">
          <button class="btn btn-ghost" id="btnMonHide">Kacheln</button>
          <button class="btn btn-ghost" id="btnFull">${monFull ? "✕ Beenden" : "Vollbild"}</button>
        </div>
      </div>
      ${abPager ? `<div class="mon-abctrl">${abPager}</div>` : ""}
      <div class="kpis-compact">
        <div class="kpic accent"><span class="k">Gesamtstärke</span><span class="v mono">${s.f+s.u+s.m}</span><span class="s mono">${s.f}/${s.u}/${s.m}</span></div>
        <div class="kpic"><span class="k">AGT</span><span class="v mono">${s.agt}</span></div>
        <div class="kpic"><span class="k">CSA</span><span class="v mono">${s.csa}</span></div>
        <div class="kpic"><span class="k">Einheiten</span><span class="v mono">${act.length}</span><span class="s">${state.einheiten.length - act.length} abgerückt</span></div>
        <div class="kpic"><span class="k">Führungskräfte</span><span class="v mono">${state.fuehrung.length}</span></div>
        ${gesKraefte ? `<div class="kpic ${bestKraefte < gesKraefte ? "warn" : ""}"><span class="k">Ist-Stärke bestätigt</span><span class="v mono">${bestKraefte}/${gesKraefte}</span><span class="kpi-bar"><i style="width:${Math.round(bestKraefte/gesKraefte*100)}%"></i></span></div>` : ""}
        ${brUnits.length ? `<div class="kpic"><span class="k">Bereitstellung</span><span class="v mono">${brUnits.length}</span><span class="s">Einheiten</span></div>` : ""}
        ${state.anforderungen.some(a => a.status !== "eingetroffen") ? `<div class="kpic warn"><span class="k">Anrollend</span><span class="v mono">${state.anforderungen.filter(a => a.status !== "eingetroffen").length}</span><span class="s">nachgefordert</span></div>` : ""}
        ${e.lagebespr ? `<div class="kpic warn"><span class="k">Nächste Lagebespr.</span><span class="v mono">${esc(e.lagebespr)}</span><span class="s" id="monLbRel"></span></div>` : ""}
      </div>
      ${isLagePage ? (() => {
        const nums = state.lage.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
        const gefahren = state.lage.items.filter(i => i.type === "gefahr").sort((a,b) => (a.num||0)-(b.num||0));
        const forms = state.lage.items.filter(i => i.type === "form");
        const lines = state.lage.items.filter(i => i.type === "line");
        const cars = state.lage.items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
        const sc = i => `var(--${LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw"})`;
        // Legende wie im Präsentationsmodus (read-only): Marker/Gefahren links, Fahrzeuge rechts
        const markerItems = [
          ...nums.map(i => `<div class="lg-leg-item"><span class="lg-leg-num">${esc(i.num)}</span><span class="lg-leg-text">${esc(i.text||"")}</span></div>`),
          ...forms.map(f => `<div class="lg-leg-item"><span class="lg-leg-badge"><span class="lg-mini-form ${f.shape||"rect"}" style="--sc:${sc(f)}"></span></span><span class="lg-leg-text">${esc(f.text||"")}</span></div>`),
          ...lines.map(l => `<div class="lg-leg-item"><span class="lg-leg-badge"><span class="lg-mini-line" style="--sc:${sc(l)}"></span></span><span class="lg-leg-text">${esc(l.text||"")}</span></div>`),
        ].join("");
        const gefItems = gefahren.map(i => `<div class="lg-leg-item"><span class="lg-leg-num tri">${esc(i.num)}</span><span class="lg-leg-text">${esc(i.text||"")}</span></div>`).join("");
        const carItems = cars.map(i => {
          const u = state.einheiten.find(x => x.id === i.unitId);
          const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
          return `<div class="lg-leg-car"><span class="lg-car" style="color:${color}">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></span><span class="lg-leg-carname">${u ? esc(fullName(u)) : "nicht zugeordnet"}</span></div>`;
        }).join("");
        const legendLeft = `<div class="lg-legend"><div class="lg-leg-body">
          <div class="lg-leg-sec"><h3>Marker</h3>${markerItems || `<p class="hint" style="margin:0">Noch keine Marker.</p>`}</div>
          ${gefItems ? `<div class="lg-leg-sec"><h3>Gefahren</h3>${gefItems}</div>` : ""}
        </div></div>`;
        const legendRight = carItems ? `<div class="lg-legend"><div class="lg-leg-body"><div class="lg-leg-sec"><h3>Fahrzeuge</h3>${carItems}</div></div></div>` : "";
        const cols = carItems ? "260px minmax(0,1fr) 260px" : "260px minmax(0,1fr)";
        return `
      <div class="mon-grid">
        <div class="panel mon-lg-panel" style="grid-column:1/-1;display:grid;grid-template-columns:${cols};gap:16px;align-items:start">
          ${legendLeft}
          <div style="min-width:0">
            <div class="panel-head"><h3>Lagekarte</h3>
              <button class="ab-jump" id="monLgEdit" style="margin-left:10px">Karte bearbeiten</button></div>
            ${state.lage.mode === "karte" ? `
            <div class="lg-wrap" style="overflow:hidden"><div id="lgMonMap" style="width:100%;height:100%"></div></div>` : `
            <div class="lg-wrap" style="pointer-events:none;overflow:hidden">
              <div class="lg-canvas ${state.lage.bg ? "hasbg" : ""}" ${state.lage.bg ? `style="background-image:url('${state.lage.bg}')"` : ""}>
                ${lgShapesSvg(state.lage.items, null)}
                ${state.lage.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
              </div>
            </div>`}
          </div>
          ${legendRight}
        </div>
      </div>`;
      })() : isSkizzePage ? `
      <div class="mon-grid" style="grid-template-columns:1fr">
        <div class="panel">
          <div class="panel-head"><h3>Funkskizze</h3>
            <button class="ab-jump" id="monSkEdit" style="margin-left:10px">Öffnen</button></div>
          ${renderFunkskizze()}
        </div>
      </div>` : (() => {
        const hp = state.monHide.panels;
        const leftPanels = [
          !hp.org ? `<div class="panel"><h3>Stärke nach Organisation</h3>${orgRows}</div>` : "",
          !hp.fk ? `<div class="panel"><h3>Führungskräfte</h3>${fkRows || `<p class="hint">Noch keine erfasst.</p>`}</div>` : "",
          !hp.funk ? `<div class="panel"><h3>Letzte Funksprüche</h3>${fsMonRows || `<p class="hint">Noch keine erfasst.</p>`}</div>` : "",
          (!hp.checks && state.checks.length) ? `<div class="panel"><h3>Checklisten</h3>
            ${state.checks.map(c => {
              const done = c.punkte.filter(p => p.done).length;
              return `<div class="fkrow"><span class="fk-n">${esc(c.name)}</span><span class="fk-f mono">${done}/${c.punkte.length}</span></div>`;
            }).join("")}
          </div>` : "",
        ].join("");
        return `
      <div class="mon-grid" ${leftPanels ? "" : `style="grid-template-columns:1fr"`}>
        ${leftPanels ? `<div class="mon-col">${leftPanels}</div>` : ""}
        <div class="panel">
          <div class="panel-head"><h3>Einsatzabschnitte</h3></div>
          <div class="ab-grid">${abCards}</div>
        </div>
      </div>`;
      })()}
    </div>
  </div>`;
}
/* Kachel-Daten des Monitors – ausgeblendete Abschnitte fliegen auch aus der Rotation */
function monCardsData(){
  const act = aktive();
  const hid = state.monHide.ab;
  const cards = [];
  const brUnits = act.filter(u => u.abschnitt === "BR");
  if(state.abschnitte.length){
    state.abschnitte.forEach(a => { if(!hid[a.id]) cards.push({
      key:a.id, title:a.name, units:act.filter(u => u.abschnitt === a.id),
      opts:{ fuehrung:a.fuehrung, arbeit:a.arbeit, ansprechpartner:a.ansprechpartner } }); });
    const rest = act.filter(u => u.abschnitt !== "BR" &&
      (!u.abschnitt || !state.abschnitte.some(a => a.id === u.abschnitt)));
    if(rest.length && !hid.rest) cards.push({ key:"rest", title:"Ohne Abschnitt", units:rest, opts:{ none:true } });
  }else{
    cards.push({ key:"all", title:"Alle Einheiten an der Einsatzstelle",
      units:act.filter(u => u.abschnitt !== "BR"), opts:{ none:true } });
  }
  if(brUnits.length && !hid.BR) cards.push({ key:"BR", title:"Bereitstellungsraum", units:brUnits, opts:{ br:true, sub: state.einsatz.bereitstellungsraum } });
  return cards;
}
/* Sonderseiten des Monitors (Lagekarte, Funkskizze) – über den Kacheln-Dialog abschaltbar */
function monSpecialPages(){
  const hp = state.monHide.panels;
  const s = [];
  if(!hp.karte) s.push("karte");
  if(!hp.skizze) s.push("skizze");
  return s;
}
function monAbPagesCount(){
  return Math.max(1, Math.ceil(Math.max(1, monCardsData().length) / 3)) + monSpecialPages().length;
}
function openMonHideSheet(){
  const hp = state.monHide.panels, ha = state.monHide.ab;
  const row = (label, hidden, key) => `
    <button class="check-item ${hidden ? "" : "done"}" data-monhide="${esc(key)}">
      <span class="check-box">✓</span>
      <span class="check-text" style="text-decoration:none;color:${hidden ? "var(--ink3)" : "var(--ink)"}">${esc(label)}</span>
      <span class="check-zeit">${hidden ? "ausgeblendet" : "sichtbar"}</span>
    </button>`;
  const act = aktive();
  const hatBR = act.some(u => u.abschnitt === "BR");
  const hatRest = state.abschnitte.length > 0 && act.some(u => u.abschnitt !== "BR" &&
    (!u.abschnitt || !state.abschnitte.some(a => a.id === u.abschnitt)));
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Monitor-Kacheln">
    <div class="sheet-head">
      <h2>Monitor-Kacheln</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Info-Kacheln</label>
        ${row("Stärke nach Organisation", hp.org, "p:org")}
        ${row("Führungskräfte", hp.fk, "p:fk")}
        ${row("Letzte Funksprüche", hp.funk, "p:funk")}
        ${row("Checklisten", hp.checks, "p:checks")}
      </div>
      <div class="field"><label>Rotierende Seiten</label>
        ${row("Lagekarte", hp.karte, "p:karte")}
        ${row("Funkskizze", hp.skizze, "p:skizze")}
      </div>
      <div class="field"><label>Einsatzabschnitte</label>
        ${state.abschnitte.map(a => row(a.name, ha[a.id], "a:" + a.id)).join("")}
        ${hatBR ? row("Bereitstellungsraum", ha.BR, "a:BR") : ""}
        ${hatRest ? row("Ohne Abschnitt", ha.rest, "a:rest") : ""}
        ${!state.abschnitte.length && !hatBR ? `<p class="hint">Noch keine Abschnitte angelegt.</p>` : ""}
      </div>
      <p class="hint">Ausgeblendete Abschnitte laufen auch nicht in der Rotation mit. Die Einstellung gilt nur für die Anzeige – erfasst bleibt alles.</p>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" data-close="1" style="flex:1">Fertig</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el =>
    el.addEventListener("click", () => { closeEditor(); render(); }));
  document.querySelectorAll("[data-monhide]").forEach(b => b.addEventListener("click", () => {
    const [typ, key] = b.dataset.monhide.split(":");
    if(typ === "p") state.monHide.panels[key] = !state.monHide.panels[key];
    else state.monHide.ab[key] = !state.monHide.ab[key];
    save();
    openMonHideSheet(); // Dialog mit neuem Stand neu aufbauen
  }));
}
function wireMonitor(){
  const hideBtn = $("#btnMonHide");
  if(hideBtn) hideBtn.addEventListener("click", openMonHideSheet);
  const abToggle = $("#monAbToggle");
  if(abToggle) abToggle.addEventListener("click", () => {
    monAbPaused = !monAbPaused;
    if(!monAbPaused) monAbLast = Date.now(); // frisch starten, nicht sofort springen
    render();
  });
  const step = dir => {
    const pages = monAbPagesCount();
    monAbPage = (monAbPage + dir + pages) % pages;
    monAbLast = Date.now(); // manueller Wechsel setzt die 30 s neu
    render();
  };
  const prev = $("#monAbPrev"), next = $("#monAbNext");
  if(prev) prev.addEventListener("click", () => step(-1));
  if(next) next.addEventListener("click", () => step(1));
  const jump = $("#monAbKarte");
  if(jump) jump.addEventListener("click", () => {
    const specials = monSpecialPages();
    const abPages = monAbPagesCount() - specials.length;
    const lagePage = abPages + specials.indexOf("karte");
    monAbPage = (monAbPage === lagePage) ? 0 : lagePage;
    monAbLast = Date.now();
    render();
  });
  const lgEdit = $("#monLgEdit");
  if(lgEdit) lgEdit.addEventListener("click", () => { state.view = "lagekarte"; save(); render(); });
  if(document.getElementById("lgMonMap")) lgMonMapSetup();   // Online-Karte auf dem Monitor
  const skEdit = $("#monSkEdit");
  if(skEdit) skEdit.addEventListener("click", () => { state.view = "skizze"; save(); render(); });
  // Vollbild: nur der graue Monitor (App-Menü/Topbar aus) + Browser-Vollbild.
  // Body-Klasse übersteht die 30-s-Rotation (wird in render() nachgeführt).
  $("#btnFull").addEventListener("click", () => {
    monFull = !monFull;
    if(monFull){
      const rf = document.documentElement.requestFullscreen;
      if(rf) rf.call(document.documentElement).catch(() => {});
    }else if(document.fullscreenElement){
      document.exitFullscreen();
    }
    render();
  });
  tickClock();
}
function tickClock(){
  const c = $("#monClock");
  if(!c) return;
  c.textContent = new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const d = $("#monDauer");
  if(d && state.einsatz.beginn){
    d.innerHTML = `Einsatzdauer <strong class="mono">${dauerStr(state.einsatz.beginn)}</strong>`;
  }else if(d){ d.textContent = ""; }
  const lb = $("#monLbRel");
  if(lb && state.einsatz.lagebespr){
    const [h,m] = state.einsatz.lagebespr.split(":").map(Number);
    const t = new Date(); t.setHours(h, m, 0, 0);
    const diff = Math.round((t - Date.now())/60000);
    lb.textContent = diff >= 0 ? `(in ${diff} min)` : `(vor ${-diff} min)`;
  }
  const cd = $("#monAbCd");
  if(cd) cd.textContent = monAbPaused ? "Pause"
    : `${Math.max(0, Math.ceil((30000 - (Date.now() - monAbLast))/1000))} s`;
}
setInterval(() => { if(state && state.view === "monitor"){ tickClock(); rotateAbschnitte(); } }, 1000);

/* ---------------- Ansicht: Lagekarte ---------------- */
let lgTool = null;        // aktives Symbol-Werkzeug
let lgSubmenu = null;     // offenes Werkzeug-Untermenü (z. B. "brand", "wasser")
// Werkzeuge mit Auswahl-Untermenü: Klick öffnet die Optionen, Auswahl setzt das passende Symbol.
const LG_SUBMENUS = {
  brand:  { label:"Brandstelle", opts:[
    { sym:"brand1", n:"Kleinbrand" }, { sym:"brand2", n:"Mittelbrand" }, { sym:"brand3", n:"Großbrand" } ] },
  wasser: { label:"Wasserentnahme", opts:[
    { sym:"hydrant", n:"Hydrant" }, { sym:"hydrantO", n:"Überflurhydrant" },
    { sym:"gewaesser", n:"Offenes Gewässer" }, { sym:"zisterne", n:"Zisterne / Behälter" } ] },
};
let lgBig = false;        // Legende ausgeblendet (Karte über volle Breite, Werkzeuge bleiben)
let lgPresent = false;    // Präsentationsmodus: Karte + Legende bildschirmfüllend, nur Zoom
let lgZoom = 1;           // Zoomstufe 1–4, Verschieben per Wischgeste (Scroll)
let lgDraw = null;        // laufende Linien-/Flächen-Zeichnung {type, points}
const LG_CAR_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M2.5 15V9.5A1.5 1.5 0 0 1 4 8h9.5v7"/><path d="M13.5 9.5H18l3.5 3.5v2h-8"/>
  <circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M8.5 17h6.5M2.5 15v2h2"/>
</svg>`;
const LG_TOOLS = [
  { t:"num",     n:"Marker 1·2·3",    preview:'<span class="lg-num">1</span>' },
  { t:"car",     n:"Fahrzeug",        preview:`<span class="lg-car" style="color:var(--fw)">${LG_CAR_SVG}</span>` },
  { t:"el",      n:"Einsatzleitung",  preview:'<span class="lg-rect" style="--oc:var(--warn)">EL</span>' },
  { t:"brand",   n:"Brandstelle",     preview:lgFlameSvg() },
  { t:"gefahr",  n:"Gefahr",          preview:'<span class="lg-tri">!</span>' },
  { t:"wasser",  n:"Wasserentnahme",  preview:'<span class="lg-circle">W</span>' },
  { t:"text",    n:"Text",            preview:'<span class="lg-text">Abc</span>' },
  { t:"form",    n:"Form",            preview:'<svg viewBox="0 0 40 30" style="width:34px;height:26px"><rect x="4" y="7" width="15" height="15" rx="2" style="fill:none;stroke:var(--brk);stroke-width:3"/><circle cx="30" cy="14.5" r="7.5" style="fill:none;stroke:var(--fw);stroke-width:3"/></svg>' },
  { t:"line",    n:"Linie",           preview:'<svg viewBox="0 0 40 30" style="width:38px;height:28px"><polyline points="4,24 16,10 26,18 36,6" style="fill:none;stroke:var(--thw);stroke-width:3;stroke-linecap:round;stroke-linejoin:round"/></svg>' },
  { t:"area",    n:"Fläche",          preview:'<svg viewBox="0 0 40 30" style="width:38px;height:28px"><polygon points="5,25 12,6 33,8 36,22 20,27" style="fill:var(--brk);fill-opacity:.3;stroke:var(--brk);stroke-width:2.5;stroke-linejoin:round"/></svg>' },
  { t:"symsearch", n:"Taktische Zeichen", preview:'<svg viewBox="0 0 24 24" style="width:30px;height:30px;stroke:var(--ink2);fill:none;stroke-width:2;stroke-linecap:round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/></svg>' },
];
const LG_SHAPE_COLORS = ["fw","thw","brk","pol"];

/* Taktische Zeichen nach DV 102 (vereinfachte Darstellung) – Brandstufen als 1–3 Flammen */
function symFlames(n){
  const fl = `<svg viewBox="0 0 24 24" style="width:13px;height:17px;fill:currentColor;stroke:none">
    <path d="M12 2c1.2 3.6-3.8 6-3.8 10.4a3.8 3.8 0 0 0 7.6 0c0-1.5-.8-2.6-.8-2.6s3.4 1.4 3.4 5A6.4 6.4 0 0 1 5.6 15C5.6 8.4 10.8 7.2 12 2z"/></svg>`;
  return fl.repeat(n);
}
// Taktisches Zeichen „Bereitstellungsraum" (Quelle: Wikimedia Commons, T. Schuff, CC BY-SA 3.0):
// gelbe Scheibe mit schwarzem Rand + oben offener „Behälter".
const SYM_BEREITSTELLUNG = `<svg viewBox="0 0 601 599" aria-hidden="true"><circle cx="300.5" cy="299.3" r="300" fill="#1a1a1a"/><circle cx="300.5" cy="299.3" r="270" fill="#ffd400"/><path d="M489.8 438.5 L110.2 438.5 L110.2 158.9 C110.2 158.9 201.3 216.8 296.2 216.8 C391.1 216.8 489.8 158.9 489.8 158.9 Z" fill="none" stroke="#1a1a1a" stroke-width="22"/></svg>`;
// Weitere taktische Zeichen (DV 102) als SVG – originalgetreu nachgebaut
const SYM_OEL = `<svg viewBox="0 0 120 84" aria-hidden="true"><rect x="5" y="7" width="110" height="70" rx="4" fill="#F4C21A" stroke="#1A1A1A" stroke-width="6"/><text x="60" y="57" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="40" text-anchor="middle" fill="#1A1A1A">ÖEL</text></svg>`;
const SYM_VERPFLEGUNG = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 50 L12 28 A44 44 0 1 1 12 72 Z" fill="#F4C21A" stroke="#1A1A1A" stroke-width="5" stroke-linejoin="round"/></svg>`;
const SYM_SAMMELSTELLE = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#F7F3EA" stroke="#1A1A1A" stroke-width="5"/><g stroke="#1A1A1A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="50" x2="60" y2="50"/><polyline points="52,43 62,50 52,57"/></g><circle cx="72" cy="50" r="7" fill="none" stroke="#1A1A1A" stroke-width="5"/></svg>`;
const SYM_KATALOG = [
  { key:"brand1",   name:"Kleinbrand / Entstehungsbrand", color:"var(--fw)",  flames:1 },
  { key:"brand2",   name:"Mittelbrand / fortgeschrittener Brand", color:"var(--fw)", flames:2 },
  { key:"brand3",   name:"Großbrand / Vollbrand",         color:"var(--fw)",  flames:3 },
  { key:"expl",     name:"Explosionsgefahr",              color:"var(--fw)",  kurz:"EXPL" },
  { key:"gefstoff", name:"Gefährliche Stoffe / Gefahrgut",color:"var(--brk)", kurz:"GG" },
  { key:"strom",    name:"Gefahr durch Elektrizität",     color:"var(--brk)", kurz:"⚡" },
  { key:"einsturz", name:"Einsturzgefahr / Gebäudeschaden",color:"var(--fw)", kurz:"EINST" },
  { key:"wasser2",  name:"Überschwemmung / Hochwasser",   color:"var(--thw)", kurz:"≈≈" },
  { key:"hydrant",  name:"Hydrant (Unterflur)",           color:"var(--thw)", kurz:"H", circle:true },
  { key:"hydrantO", name:"Hydrant (Überflur)",            color:"var(--thw)", kurz:"ÜH", circle:true },
  { key:"gewaesser",name:"Offenes Gewässer (Entnahme)",   color:"var(--thw)", kurz:"OG" },
  { key:"zisterne", name:"Löschwasserbehälter / Zisterne",color:"var(--thw)", kurz:"Z", circle:true },
  { key:"bhp",      name:"Behandlungsplatz",              color:"var(--fw)",  kurz:"BHP" },
  { key:"vablage",  name:"Verletztenablage",              color:"var(--fw)",  kurz:"V-ABL" },
  { key:"sammel",   name:"Sammelplatz Betroffene",        color:"var(--pol)", kurz:"SP" },
  { key:"vermisst", name:"Person vermisst / verschüttet", color:"var(--son)", kurz:"?" , circle:true },
  { key:"hlp",      name:"Hubschrauberlandeplatz",        color:"var(--thw)", kurz:"HLP" },
  { key:"dekon",    name:"Dekon-Platz",                   color:"var(--brk)", kurz:"DEK" },
  { key:"bereitstellung", name:"Bereitstellungsraum",     color:"var(--warn)", svg:SYM_BEREITSTELLUNG },
  { key:"oel",      name:"Örtliche Einsatzleitung (ÖEL)", color:"var(--warn)", svg:SYM_OEL },
  { key:"verpflegung", name:"Versorgungsstelle / Verpflegung", color:"var(--warn)", svg:SYM_VERPFLEGUNG },
  { key:"as-sammel", name:"Atemschutzsammelstelle",       color:"var(--fw)",  svg:SYM_SAMMELSTELLE },
];
function symTile(s, small){
  if(s.svg) return `<span class="lg-symsvg"${small ? ' style="transform:scale(.85)"' : ""}>${s.svg}</span>`;
  const inner = s.flames ? symFlames(s.flames) : esc(s.kurz);
  return `<span class="lg-sym ${s.circle ? "circle" : ""}" style="--sc:${s.color};${small ? "transform:scale(.85)" : ""}">${inner}</span>`;
}
function lgShapesSvg(items, draw){
  items = items.filter(i => i.type === "line" || i.type === "area");
  const shape = i => {
    if(!Array.isArray(i.points)) return "";   // Geo-Flächen (Kartenmodus) hier überspringen
    const pts = i.points.map(p => `${p.x},${p.y}`).join(" ");
    const col = `var(--${LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw"})`;
    return i.type === "area"
      ? `<polygon data-shape="${esc(i.id)}" points="${pts}" style="fill:${col};fill-opacity:.22;stroke:${col}"></polygon>`
      : `<polyline data-shape="${esc(i.id)}" points="${pts}" style="stroke:${col}"></polyline>`;
  };
  let tmp = "";
  if(draw && draw.points.length){
    const pts = draw.points.map(p => `${p.x},${p.y}`).join(" ");
    tmp = `<${draw.type === "area" ? "polygon" : "polyline"} class="tmp" points="${pts}"></${draw.type === "area" ? "polygon" : "polyline"}>`
      + draw.points.map(p => `<circle class="tmp-dot" cx="${p.x}" cy="${p.y}" r="1.1"></circle>`).join("");
  }
  const svg = `<svg class="lg-shapes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    ${items.filter(i => i.type === "line" || i.type === "area").map(shape).join("")}${tmp}
  </svg>`;
  // Beschriftung verknüpfter Abschnittsflächen (HTML-Overlay, damit Text nicht verzerrt)
  const labels = items.filter(i => i.type === "area" && i.abschnittId && Array.isArray(i.points)).map(i => {
    const a = state.abschnitte.find(x => x.id === i.abschnittId);
    if(!a) return "";
    const cx = i.labelPos ? i.labelPos.x : i.points.reduce((s,p) => s + p.x, 0) / i.points.length;
    const cy = i.labelPos ? i.labelPos.y : i.points.reduce((s,p) => s + p.y, 0) / i.points.length;
    const col = LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw";
    return `<span class="lg-ealbl" data-ealbl="${esc(i.id)}" style="left:${cx}%;top:${cy}%;color:var(--${col})">${esc(abKuerzel(i.abschnittId))}</span>`;
  }).join("");
  return svg + labels;
}
const LG_ORG_OF = { fw:"--fw", thw:"--thw", brk:"--brk", pol:"--pol" };
function lgFlameSvg(){
  return `<span class="lg-flame"><svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2c1.2 3.6-3.8 6-3.8 10.4a3.8 3.8 0 0 0 7.6 0c0-1.5-.8-2.6-.8-2.6s3.4 1.4 3.4 5A6.4 6.4 0 0 1 5.6 15C5.6 8.4 10.8 7.2 12 2z"/>
  </svg></span>`;
}
function lgDefaultLabel(t){
  return { el:"Einsatzleitung", brand:"Brand", gefahr:"Gefahr", wasser:"Wasser",
    patient:"V-Ablage", text:"Text", fw:"", thw:"", brk:"", pol:"" }[t] ?? "";
}
/* Symbol + Beschriftung eines Markers (ohne Positionierung) – für Prozent-Canvas UND Leaflet-DivIcon */
function lgMarkerInner(i){
  let sym, lbl = "";
  if(i.type === "car"){
    const u = state.einheiten.find(x => x.id === i.unitId);
    const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
    const kurz = u ? (u.kennung || u.name) : "";
    sym = `<span class="lg-car" style="color:${color}">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></span>`;
    if(kurz) lbl = `<span class="lg-lbl">${esc(kurz)}</span>`;
    return sym + lbl;
  }
  if(i.type === "unit"){
    sym = `<span class="lg-rect" style="--oc:var(${(ORGS[i.org]||ORGS.SON).cssVar})">${esc(i.kurz || "?")}</span>`;
  }else if(LG_ORG_OF[i.type]){
    sym = `<span class="lg-rect" style="--oc:var(${LG_ORG_OF[i.type]})">${esc(i.type.toUpperCase())}</span>`;
  }else if(i.type === "el"){
    sym = `<span class="lg-rect" style="--oc:var(--warn)">EL</span>`;
  }else if(i.type === "brand"){ sym = lgFlameSvg(); }
  else if(i.type === "gefahr"){ sym = `<span class="lg-tri">${i.num ? esc(i.num) : "!"}</span>`; }
  else if(i.type === "wasser"){ sym = `<span class="lg-circle">W</span>`; }
  else if(i.type === "patient"){ sym = `<span class="lg-cross">+</span>`; }
  else if(i.type === "num"){ sym = `<span class="lg-num">${esc(i.num)}</span>`; }
  else if(i.type === "form"){
    const col = `var(--${LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw"})`;
    sym = `<span class="lg-form ${i.shape || "rect"}" style="--sc:${col}">${esc(i.text || "")}</span>`;
  }
  else if(i.type === "sym"){
    const s = SYM_KATALOG.find(x => x.key === i.sym);
    sym = s ? symTile(s) : `<span class="lg-text">?</span>`;
  }
  else { sym = `<span class="lg-text">${esc(i.label || "Text")}</span>`; }
  // Marker/Gefahr: erstes Wort der Beschreibung als Kurzlabel unter das Symbol (Rest steht in der Legende)
  if((i.type === "num" || i.type === "gefahr") && i.text){
    const wort = i.text.trim().split(/\s+/)[0];
    if(wort) lbl = `<span class="lg-lbl">${esc(wort)}</span>`;
  }else if(i.type !== "text" && i.type !== "num" && i.type !== "gefahr" && i.label){
    lbl = `<span class="lg-lbl">${esc(i.label)}</span>`;
  }
  return sym + lbl;
}
function lgMarkerHtml(i){
  return `<div class="lg-item" data-id="${esc(i.id)}" style="left:${i.x}%;top:${i.y}%">${lgMarkerInner(i)}</div>`;
}
function lgCarOptions(currentUnitId){
  const usedIds = new Set(state.lage.items
    .filter(i => i.type === "car" && i.unitId && i.unitId !== currentUnitId)
    .map(i => i.unitId));
  const opts = aktive().filter(u => !usedIds.has(u.id))
    .sort((a,b) => fullName(a).localeCompare(fullName(b), "de"))
    .map(u => `<option value="${esc(u.id)}" ${u.id===currentUnitId?"selected":""}>${esc(fullName(u))}</option>`)
    .join("");
  return `<option value="" ${!currentUnitId?"selected":""}>– Fahrzeug wählen –</option>${opts}`;
}
function renderLagekarte(){
  const tools = LG_TOOLS.map(t => `
    <button class="lg-tool" data-lgtool="${t.t}" aria-pressed="${lgTool===t.t || lgSubmenu===t.t}">
      ${t.preview}<span>${t.n}</span>
    </button>`).join("");
  let statusText = "", drawButtons = "";
  if(lgDraw){
    const need = lgDraw.type === "area" ? 3 : 2;
    statusText = `${lgDraw.type === "area" ? "Fläche" : "Linie"}: Punkte antippen (${lgDraw.points.length} gesetzt${lgDraw.points.length < need ? `, mind. ${need}` : ""})`;
    drawButtons = lgDraw.points.length >= need ? `<button id="lgDrawDone" style="margin-right:14px">Fertig</button>` : "";
  }else if(lgTool && lgTool.startsWith("sym:")){
    const s = SYM_KATALOG.find(x => x.key === lgTool.slice(4));
    statusText = s ? `Auf die Karte tippen, um „${s.name}“ zu platzieren` : "";
  }else if(lgTool){
    const t = LG_TOOLS.find(x => x.t === lgTool);
    statusText = (lgTool === "line" || lgTool === "area")
      ? `${t.n}: Punkte nacheinander auf die Karte tippen`
      : `Auf die Karte tippen, um „${t.n}“ zu platzieren`;
  }
  const nums = state.lage.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  const gefahren = state.lage.items.filter(i => i.type === "gefahr").sort((a,b) => (a.num||0)-(b.num||0));
  const forms = state.lage.items.filter(i => i.type === "form");
  const lines = state.lage.items.filter(i => i.type === "line");
  const cars = state.lage.items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
  const shpCol = i => `var(--${LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw"})`;
  const carRows = cars.map(i => {
    const u = state.einheiten.find(x => x.id === i.unitId);
    const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
    const carName = u ? esc(fullName(u)) : "nicht zugeordnet";
    // Voller Name als umbrechender Text (Spalte bleibt schmal). Klick → Zuordnungs-Dialog.
    // In der Präsentation nur lesen (kein Klick).
    const rechts = lgPresent
      ? `<span class="lg-leg-carname">${carName}</span>`
      : `<button class="lg-leg-carname" data-lgedit="${esc(i.id)}">${carName}</button>`;
    return `
    <div class="lg-leg-car">
      <button class="lg-car lg-find" style="color:${color}" data-lgfind="${esc(i.id)}" aria-label="Fahrzeug ${esc(i.num||"")} auf der Karte zeigen">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></button>
      ${rechts}
    </div>`;
  }).join("");
  // Legenden-Eintrag: Symbol/Badge antippen → wackelt/blinkt auf der Karte; Text antippen → bearbeiten.
  const legRow = (badgeHtml, item, ph) => {
    const haupt = item.text ? esc(item.text) : (item.sub ? "" : `<span class="ph">${ph}</span>`);
    const sub = item.sub ? `${haupt ? " " : ""}<span class="lg-leg-qm">${esc(item.sub)}</span>` : "";
    return `
    <div class="lg-leg-item">
      <button class="lg-leg-badge" data-lgfind="${esc(item.id)}" aria-label="Auf der Karte zeigen">${badgeHtml}</button>
      <button class="lg-leg-text" data-lgedit="${esc(item.id)}">${haupt}${sub}</button>
    </div>`;
  };
  const numBadge  = (cls, n) => `<span class="lg-leg-num ${cls}">${n}</span>`;
  // Einsatzabschnitt-Flächen zuerst: Badge „EA n" (Klick → Fläche blinkt), Text = Abschnittsname (Klick → bearbeiten)
  const eaItems = state.lage.items
    .filter(i => i.type === "area" && i.abschnittId && state.abschnitte.some(a => a.id === i.abschnittId))
    .map(i => {
      const a = state.abschnitte.find(x => x.id === i.abschnittId);
      const fl = flaecheStr(geoFlaecheM2(i.llpoints));   // nur Kartenmodus (echte Koordinaten)
      // „Abschnitt 1 -" weglassen (steht schon im EA-Badge), nur den Zusatz + Größe zeigen
      const rest = (a.name || "").replace(/^\s*(einsatz)?abschnitt\s*\d*\s*[-–:]?\s*/i, "").trim();
      return legRow(`<span class="lg-leg-ea" style="--sc:${shpCol(i)}">${esc(abKuerzel(i.abschnittId))}</span>`,
        { id:i.id, text: rest, sub: fl }, "Abschnitt");
    }).join("");
  // Freie Flächen (ohne Abschnitt) mit Flächennamen + Größe
  const areaItems = state.lage.items
    .filter(i => i.type === "area" && !i.abschnittId)
    .map(i => {
      const fl = flaecheStr(geoFlaecheM2(i.llpoints));
      return legRow(`<span class="lg-mini-area" style="--sc:${shpCol(i)}"></span>`, { id:i.id, text:(i.text||"").trim(), sub:fl }, "Fläche beschriften …");
    }).join("");
  const numItems  = nums.map(i => legRow(numBadge("", esc(i.num)), i, "Beschreibung antippen …")).join("");
  const formItems = forms.map(f => legRow(`<span class="lg-mini-form ${f.shape||"rect"}" style="--sc:${shpCol(f)}"></span>`, f, "Form beschriften …")).join("");
  const lineItems = lines.map(l => legRow(`<span class="lg-mini-line" style="--sc:${shpCol(l)}"></span>`, l, "Linie beschriften …")).join("");
  const secMarker = `
        <div class="lg-leg-sec"><h3>Marker</h3>
          ${(eaItems || areaItems || nums.length || forms.length || lines.length) ? eaItems + areaItems + numItems + formItems + lineItems
          : `<p class="hint" style="margin:0">Noch keine Marker. Werkzeug wählen und auf die Karte tippen.</p>`}
        </div>`;
  const secGefahr = gefahren.length ? `
        <div class="lg-leg-sec"><h3>Gefahren</h3>${gefahren.map(i => legRow(numBadge("tri", esc(i.num)), i, "Beschreibung antippen …")).join("")}</div>` : "";
  const secCars = cars.length ? `<div class="lg-leg-sec"><h3>Fahrzeuge</h3>${carRows}</div>` : "";
  // Legende links (Marker + Gefahren) und rechts (Fahrzeuge) neben der Karte
  const legendLeft  = `<div class="lg-legend"><div class="lg-leg-body">${secMarker}${secGefahr}</div></div>`;
  const legendRight = secCars ? `<div class="lg-legend"><div class="lg-leg-body">${secCars}</div></div>` : "";
  const legShow = lgPresent || !lgBig;   // Präsentation zeigt die Legende immer
  const legCols = !legShow ? "minmax(0,1fr)"
    : (secCars ? "260px minmax(0,1fr) 260px" : "260px minmax(0,1fr)");
  return `
  <div class="card lg-card${lgPresent ? " lg-present" : ""}">
    ${lgPresent ? `
    <div class="lg-present-ctrl" style="right:${(secCars ? 284 : 0) + 14}px">
      <button id="lgPzoomOut" aria-label="Herauszoomen">−</button>
      <button id="lgPzoomIn" aria-label="Hineinzoomen">＋</button>
      <button id="lgPexit" aria-label="Präsentation beenden">✕</button>
    </div>` : ""}
    <h2>Lagekarte – taktische Skizze</h2>
    <div class="lg-headrow">
      <div class="lg-zoom" role="group" aria-label="Zoom">
        <button id="lgZoomOut" aria-label="Herauszoomen">−</button>
        <span class="z-val mono">${Math.round(lgZoom*100)} %</span>
        <button id="lgZoomIn" aria-label="Hineinzoomen">＋</button>
      </div>
      <button class="btn btn-ghost" id="lgSnapBtn" style="margin-right:8px">Snapshot einfrieren</button>
      <button class="btn btn-ghost" id="lgBigBtn" style="margin-right:8px">${lgBig ? "Legende einblenden" : "Legende ausblenden"}</button>
      <button class="btn btn-ghost" id="lgPresentBtn" style="margin-right:8px">Präsentation / Vollbild</button>
      <button class="btn btn-primary" id="lgToMonitor">Zum Monitor</button>
    </div>
    <div class="lg-modes">
      <div class="seg" role="tablist" style="max-width:420px;margin:0">
        <button role="tab" data-lgmode="raster" class="${state.lage.mode==="raster"?"active":""}">Raster</button>
        <button role="tab" data-lgmode="bild" class="${state.lage.mode==="bild"?"active":""}">Bild</button>
        <button role="tab" data-lgmode="karte" class="${state.lage.mode==="karte"?"active":""}">Karte (online)</button>
      </div>
      ${state.lage.mode === "karte" ? `
      <div class="lg-layerpick" role="group" aria-label="Kartengrundlage">
        <button data-lglayer="luftbild" class="${state.lage.mapLayer==="luftbild"?"active":""}">Luftbild</button>
        <button data-lglayer="basis" class="${state.lage.mapLayer==="basis"?"active":""}">Bayern-Karte</button>
        <button data-lglayer="strasse" class="${state.lage.mapLayer==="strasse"?"active":""}">Straße</button>
      </div>
      ${lgEinsatzAdresse() ? `<button class="btn btn-ghost" id="lgToAddr" style="min-height:42px;padding:6px 14px;font-size:.85rem">⌖ Einsatzadresse</button>` : ""}` : ""}
    </div>
    <div class="lg-toolbar">${tools}</div>
    ${lgSubmenu && LG_SUBMENUS[lgSubmenu] ? `
    <div class="lg-submenu">
      <span class="lg-sub-lbl">${esc(LG_SUBMENUS[lgSubmenu].label)}:</span>
      ${LG_SUBMENUS[lgSubmenu].opts.map(o => {
        const s = SYM_KATALOG.find(x => x.key === o.sym);
        return `<button class="lg-subopt" data-lgsub="${esc(o.sym)}">${s ? symTile(s, true) : ""}<span>${esc(o.n)}</span></button>`;
      }).join("")}
    </div>` : ""}
    ${statusText ? `<div class="lg-status">${esc(statusText)}<span style="margin-left:auto">${drawButtons}</span><button id="lgCancel">Abbrechen</button></div>` : ""}
    ${state.lage.mode === "karte" ? `
    <div class="lg-layout" style="grid-template-columns:${legCols}">
      ${legShow ? legendLeft : ""}
      <div class="lg-wrap" id="lgWrap" style="overflow:hidden">
        <div id="lgMap"></div>
      </div>
      ${legShow ? legendRight : ""}
    </div>` : `
    <div class="lg-layout" style="grid-template-columns:${legCols}">
      ${legShow ? legendLeft : ""}
      <div class="lg-wrap" id="lgWrap">
        <div class="lg-canvas ${(state.lage.mode==="bild" && state.lage.bg) ? "hasbg" : ""}" id="lgCanvas"
          style="width:${lgZoom*100}%;height:${lgZoom*100}%;${(state.lage.mode==="bild" && state.lage.bg) ? `background-image:url('${state.lage.bg}')` : ""}">
          ${lgShapesSvg(state.lage.items, lgDraw)}
          ${state.lage.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
        </div>
      </div>
      ${legShow ? legendRight : ""}
    </div>`}
    <p class="hint">Symbol wählen und auf die Karte tippen · Symbole mit dem Finger verschieben · Antippen zum Beschriften oder Löschen · Nummern-Marker halten die Karte frei, der Text steht in der Legende.</p>
    <div class="lg-bgrow">
      <button class="btn btn-ghost" id="lgPrint">Lagekarte drucken</button>
      <button class="btn btn-ghost" id="lgBgBtn">Foto / Lageplan als Hintergrund</button>
      <button class="btn btn-ghost" id="lgBgPaste" title="z. B. Screenshot aus dem BayernAtlas – auch mit Strg+V">Aus Zwischenablage einfügen</button>
      ${state.lage.bg ? `<button class="btn btn-ghost" id="lgBgDel">Hintergrund entfernen</button>` : ""}
      ${state.lage.items.length ? `<button class="btn btn-danger-ghost" id="lgClear">Karte leeren</button>` : ""}
      <input type="file" id="lgBgFile" accept="image/*" style="display:none">
    </div>
  </div>
  ${(state.lage.snapshots||[]).length ? `
  <div class="card">
    <h2>Lagebilder (eingefrorene Stände)</h2>
    ${[...state.lage.snapshots].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||"")).map(s => `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">Lagebild ${fmtZeit(s.zeit)} Uhr</div>
        <div class="a-s">${fmtDatum(s.zeit)} · ${s.items.length} Symbole</div>
      </div>
      <button class="btn btn-ghost" data-lgsnap="${esc(s.id)}">Ansehen</button>
      <button class="btn btn-danger-ghost" data-lgsnapdel="${esc(s.id)}" aria-label="Lagebild löschen">✕</button>
    </div>`).join("")}
    <p class="hint">Ein Snapshot friert den aktuellen Kartenstand ein – die Lagekarte entwickelt sich danach normal weiter (z. B. für die Dokumentation je Lagebesprechung).</p>
  </div>` : ""}
  `;
}
function setLgBg(data){
  state.lage.bg = data;
  state.lage.mode = "bild";
  try{ markChange(); }catch(err){ modalInfo("Bild zu groß für den lokalen Speicher."); state.lage.bg = ""; }
  render();
}
/* Strg+V / Cmd+V auf der Lagekarte: Bild aus der Zwischenablage als Hintergrund */
document.addEventListener("paste", e => {
  if(state.view !== "lagekarte") return;
  const t = e.target;
  if(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return; // Textfelder nicht kapern
  const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
  if(!item) return;
  const file = item.getAsFile();
  if(file){
    e.preventDefault();
    resizeImage(file, 1920, data => setLgBg(data));
  }
});
function lgFreeze(){
  const s = { id:uid(), zeit:new Date().toISOString(),
    bg: state.lage.bg, mode: state.lage.mode, mapLayer: state.lage.mapLayer,
    mapView: state.lage.mapView ? { center:[...state.lage.mapView.center], zoom: state.lage.mapView.zoom } : null,
    items: state.lage.items.map(i => ({...i})) };
  state.lage.snapshots.push(s);
  markChange();
  return s;
}
/* ---------------- Ansicht: Funkskizze (Kommunikationsskizze) ---------------- */
function renderSkizzeView(){
  return `
  <div class="card">
    <h2>Funkskizze / Kommunikationsskizze</h2>
    ${renderFunkskizze()}
    <p class="hint">Wird automatisch aus den Einsatzabschnitten und deren TMO-/DMO-Rufgruppen erzeugt
    (Abschnitte pflegen im Tab „Einsatz“). Leitstelle und Rufgruppe stehen in den Einstellungen (Zahnrad).</p>
  </div>`;
}
/* Kommunikationsskizze: ILS → Einsatzleitung → Abschnitte, Rufgruppen an den Linien */
/* Rufgruppe als farbig markierter Chip (Betriebsart TMO/DMO) */
function fkGrpHtml(g){
  const s = gruppeStr(g); if(!s) return "";
  return `<span class="fk-grp mode-${(g && g.mode)||"TMO"}">${esc(s)}</span>`;
}
function fkVia(via){
  return via==="gateway" ? `<span class="fk-via">⇄ Gateway ↔ TMO</span>`
    : via==="repeater" ? `<span class="fk-via">⟳ Repeater</span>` : "";
}
function renderFunkskizze(){
  const c = state.config;
  const act = aktive();
  const ilsG = (state.einsatz.ilsGruppe && state.einsatz.ilsGruppe.gruppe) ? state.einsatz.ilsGruppe : c.ilsGruppe;
  const elBox = `
    <div class="fkbox el">
      <strong>Einsatzleitung</strong>
      <small>${esc(c.ugName)} · ELW${state.einsatz.leiter ? " · EL: " + esc(state.einsatz.leiter) : ""}</small>
    </div>`;
  const ilsTeil = `
    <div class="fkbox ils"><strong>${esc(c.ilsName || "Leitstelle")}</strong><small>Leitstelle</small></div>
    <div class="fk-vline">${fkGrpHtml(ilsG) || `<span class="fk-grp">—</span>`}</div>`;
  const legende = `<div class="fk-legende">
    <span><i class="fk-dot mode-TMO"></i>TMO · Netzbetrieb</span>
    <span><i class="fk-dot mode-DMO"></i>DMO · Direktbetrieb</span>
    <span>⇄ Gateway · ⟳ Repeater</span></div>`;
  if(!state.abschnitte.length){
    return `<div class="fk-skizze">${ilsTeil}${elBox}</div>${legende}
      <p class="hint" style="text-align:center">Noch keine Einsatzabschnitte angelegt – die Skizze wächst automatisch mit (Tab „Einsatz“).</p>`;
  }
  const n = state.abschnitte.length;
  // Gemeinsame Führungsrufgruppe: haben alle Abschnitte dieselbe → einmal an der Sammellinie darstellen
  const fgS = state.abschnitte.map(a => gruppeStr(a.fuehrung));
  const commonFg = (n > 1 && fgS.every(s => s && s === fgS[0])) ? state.abschnitte[0].fuehrung : null;
  const branches = state.abschnitte.map(a => {
    const units = act.filter(u => u.abschnitt === a.id);
    const via = a.arbeit && a.arbeit.via;
    return `
    <div class="fk-branch">
      <div class="fk-vline">${commonFg ? "" : (fkGrpHtml(a.fuehrung) || `<span class="fk-grp">—</span>`)}</div>
      <div class="fkbox">
        <strong>${esc(a.name)}</strong>
        ${a.ansprechpartner ? `<small class="mono">${esc(a.ansprechpartner)}</small>` : ""}
        <small>${units.length} Einheit${units.length===1?"":"en"}</small>
        <div class="fk-badges">
          ${gruppeStr(a.arbeit) ? `<span class="funk-badge mode-${(a.arbeit.mode)||"DMO"}"><small>Arbeit</small>${esc(gruppeStr(a.arbeit))}</span>` : `<span class="hint" style="margin:0">keine Arbeitsrufgruppe</span>`}
          ${fkVia(via)}
        </div>
      </div>
    </div>`;
  }).join("");
  return `
  <div class="fk-skizze">
    ${ilsTeil}
    ${elBox}
    ${n > 1 ? `<div class="fk-vline" style="height:26px">${commonFg ? fkGrpHtml(commonFg) : ""}</div>
    <div class="fk-hline" style="width:calc(100% - 100%/${n} - 14px)"></div>` : ""}
    <div class="fk-hwrap">${branches}</div>
  </div>
  ${legende}`;
}
/* ==================== Lagekarte: Online-Karten-Modus (Leaflet) ==================== */
let lgMapObj = null, lgMapLayer = null, lgMonObj = null, lgSnapObj = null;
function lgMapTeardown(){
  if(lgMapObj){ try{ lgMapObj.remove(); }catch(e){} }
  if(lgMonObj){ try{ lgMonObj.remove(); }catch(e){} }
  lgMapObj = null; lgMapLayer = null; lgMonObj = null;
}
function lgAccentHex(name){
  const v = getComputedStyle(document.documentElement).getPropertyValue("--" + (LG_SHAPE_COLORS.includes(name)?name:"fw")).trim();
  return v || "#C4232B";
}
/* Kartengrundlage (OpenData) je Schlüssel als frische Leaflet-Ebene */
function lgBaseLayer(key){
  const bayVV = "Bayerische Vermessungsverwaltung – geodaten.bayern.de";
  if(key === "basis") return L.tileLayer("https://wmtsod{s}.bayernwolke.de/wmts/by_webkarte/smerc/{z}/{x}/{y}",
    { subdomains:["1","2","3","4","5","6","7"], maxZoom:20, attribution:bayVV });
  if(key === "strasse") return L.tileLayer("https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png",
    { maxZoom:18, attribution:"© Bundesamt für Kartographie und Geodäsie (TopPlusOpen)" });
  return L.tileLayer.wms("https://geoservices.bayern.de/od/wms/dop/v1/dop40",
    { layers:"by_dop40c", format:"image/png", version:"1.3.0", maxZoom:20, attribution:"Luftbild: " + bayVV });
}
function lgDivIcon(inner, id){
  return L.divIcon({ html:`<div class="lg-mk"${id ? ` data-id="${esc(id)}"` : ""}>${inner}</div>`, className:"lg-divicon", iconSize:[0,0] });
}
/* Adresse → Koordinaten (OpenStreetMap/Nominatim, nur online) */
function lgGeocode(q, cb){
  if(!q){ cb(null); return; }
  fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=" + encodeURIComponent(q),
    { headers:{ "Accept":"application/json" } })
    .then(r => r.ok ? r.json() : [])
    .then(a => cb(a && a[0] ? [parseFloat(a[0].lat), parseFloat(a[0].lon)] : null))
    .catch(() => cb(null));
}
function lgEinsatzAdresse(){ return (state.einsatz.ort || state.einsatz.objekt || "").trim(); }
/* Symbole/Linien/Flächen in eine Ebene zeichnen; interactive=false → schreibgeschützt (Monitor) */
function lgAddItems(layer, interactive, items){
  items = items || state.lage.items;
  for(const i of items){
    if((i.type === "line" || i.type === "area") && Array.isArray(i.llpoints)){
      const col = lgAccentHex(i.color);
      const ll = i.llpoints.map(p => [p.lat, p.lng]);
      const shp = i.type === "area"
        ? L.polygon(ll, { color:col, weight:3.5, fillOpacity:0.22, interactive })
        : L.polyline(ll, { color:col, weight:3.5, interactive });
      if(interactive) shp.on("click", ev => { L.DomEvent.stop(ev); openLgShapeEdit(i.id); });
      shp.addTo(layer);
      const pe = shp.getElement && shp.getElement(); if(pe) pe.setAttribute("data-shape", i.id);   // fürs Blinken
      if(i.type === "area" && i.abschnittId){
        const a = state.abschnitte.find(x => x.id === i.abschnittId);
        if(a){
          const pos = i.labelLL ? [i.labelLL.lat, i.labelLL.lng] : shp.getBounds().getCenter();
          const lcol = LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw";
          const lm = L.marker(pos, { draggable:interactive, interactive,
            icon: lgDivIcon(`<span class="lg-ealbl" style="position:static;transform:none;color:var(--${lcol})">${esc(abKuerzel(i.abschnittId))}</span>`) });
          if(interactive) lm.on("dragend", () => { const p = lm.getLatLng(); i.labelLL = { lat:p.lat, lng:p.lng }; markChange(); });
          lm.addTo(layer);
        }
      }
    }
  }
  for(const i of items){
    if(!i.ll) continue;
    const m = L.marker(i.ll, { draggable:interactive, interactive, icon: lgDivIcon(lgMarkerInner(i), i.id) });
    if(interactive){
      m.on("click", () => openLgEdit(i.id));
      m.on("dragend", () => { const p = m.getLatLng(); i.ll = [p.lat, p.lng]; markChange(); });
    }
    m.addTo(layer);
  }
}
function lgMapSetup(){
  const el = document.getElementById("lgMap");
  if(!el || typeof L === "undefined") return;
  lgMapTeardown();
  const v = state.lage.mapView || { center:[49.6767, 12.1625], zoom:14 };
  lgMapObj = L.map(el, { zoomControl:true }).setView(v.center, v.zoom);
  lgBaseLayer(state.lage.mapLayer).addTo(lgMapObj);   // Umschaltung über die kleine App-Auswahl oben
  lgMapLayer = L.layerGroup().addTo(lgMapObj);
  lgMapObj.on("moveend zoomend", () => {
    if(!lgMapObj) return;
    const c = lgMapObj.getCenter();
    state.lage.mapView = { center:[c.lat, c.lng], zoom: lgMapObj.getZoom() };
    save();
  });
  lgMapObj.on("click", e => lgMapClick(e.latlng));
  setTimeout(() => { if(lgMapObj) lgMapObj.invalidateSize(); }, 60);
  lgMapRenderLayers();
  // Beim ersten Öffnen automatisch auf die Einsatzadresse zoomen (Luftbild)
  if(!state.lage.mapView && lgEinsatzAdresse()){
    lgGeocode(lgEinsatzAdresse(), ll => {
      if(ll && lgMapObj){ lgMapObj.setView(ll, 17); state.lage.mapView = { center:ll, zoom:17 }; save(); }
    });
  }
}
/* Read-only-Karte auf dem Einsatzmonitor */
function lgMonMapSetup(){
  const el = document.getElementById("lgMonMap");
  if(!el || typeof L === "undefined") return;
  if(lgMonObj){ try{ lgMonObj.remove(); }catch(e){} lgMonObj = null; }
  const v = state.lage.mapView || { center:[49.6767, 12.1625], zoom:14 };
  // Interaktiv: mit der Maus schieben + zoomen (Scrollrad, Doppelklick, +/–-Buttons)
  lgMonObj = L.map(el, { zoomControl:true, attributionControl:true }).setView(v.center, v.zoom);
  lgBaseLayer(state.lage.mapLayer).addTo(lgMonObj);
  lgAddItems(L.layerGroup().addTo(lgMonObj), false);
  lgMonObj.on("moveend zoomend", () => {   // Ausschnitt merken (übersteht die Rotation)
    if(!lgMonObj) return;
    const c = lgMonObj.getCenter();
    state.lage.mapView = { center:[c.lat, c.lng], zoom: lgMonObj.getZoom() };
    save();
  });
  setTimeout(() => { if(lgMonObj) lgMonObj.invalidateSize(); }, 60);
}
function lgMapRenderLayers(){
  if(!lgMapLayer) return;
  lgMapLayer.clearLayers();
  lgAddItems(lgMapLayer, true);
  // Zeichnung in Arbeit
  if(lgDraw && lgDraw.geo && lgDraw.points.length){
    const pts = lgDraw.points.map(p => [p.lat, p.lng]);
    L.polyline(pts, { color:"#C4232B", dashArray:"6 6", weight:3 }).addTo(lgMapLayer);
    for(const p of pts) L.circleMarker(p, { radius:4, color:"#C4232B", fillColor:"#C4232B", fillOpacity:1 }).addTo(lgMapLayer);
  }
  lgDrawbar();
}
function lgDrawbar(){
  const el = document.getElementById("lgMap");
  if(!el) return;
  let bar = el.querySelector(".lg-drawbar");
  if(!(lgDraw && lgDraw.geo)){ if(bar) bar.remove(); return; }
  const need = lgDraw.type === "area" ? 3 : 2;
  if(!bar){ bar = document.createElement("div"); bar.className = "lg-drawbar"; el.appendChild(bar); }
  bar.innerHTML = `<span>${lgDraw.type === "area" ? "Fläche" : "Linie"}: ${lgDraw.points.length} Punkt${lgDraw.points.length===1?"":"e"}${lgDraw.points.length<need?` (mind. ${need})`:""}</span>
    ${lgDraw.points.length>=need?`<button data-dr="ok">Fertig</button>`:""}
    <button data-dr="x">Abbrechen</button>`;
  bar.querySelectorAll("[data-dr]").forEach(b => b.addEventListener("click", ev => {
    ev.stopPropagation();
    if(b.dataset.dr === "x"){ lgDraw = null; lgTool = null; render(); return; }
    const it = { id:uid(), type:lgDraw.type, llpoints:lgDraw.points.slice(), color:"fw" };
    state.lage.items.push(it); const nid = it.id;
    lgDraw = null; lgTool = null; markChange(); render(); openLgShapeEdit(nid);
  }));
}
function lgMapClick(latlng){
  const ll = [latlng.lat, latlng.lng];
  if(lgTool === "line" || lgTool === "area"){
    if(!lgDraw || !lgDraw.geo) lgDraw = { type:lgTool, geo:true, points:[] };
    lgDraw.points.push({ lat:latlng.lat, lng:latlng.lng });
    lgMapRenderLayers();
    return;
  }
  if(!lgTool) return;
  if(lgTool === "car"){
    const num = state.lage.items.filter(i => i.type==="car").reduce((m,i)=>Math.max(m,i.num||0),0)+1;
    const it = { id:uid(), type:"car", num, unitId:"", ll };
    state.lage.items.push(it); lgTool = null; markChange(); render(); openLgEdit(it.id); return;
  }
  if(lgTool === "num" || lgTool === "gefahr"){
    const typ = lgTool;
    const num = state.lage.items.filter(i => i.type===typ).reduce((m,i)=>Math.max(m,i.num||0),0)+1;
    const it = { id:uid(), type:typ, num, text:"", ll };
    state.lage.items.push(it); lgTool = null; markChange(); render(); openLgEdit(it.id); return;
  }
  if(lgTool === "form"){
    const it = { id:uid(), type:"form", shape:"rect", color:"fw", text:"", ll };
    state.lage.items.push(it); lgTool = null; markChange(); render(); openLgFormEdit(it.id); return;
  }
  if(lgTool.startsWith("sym:")){
    state.lage.items.push({ id:uid(), type:"sym", sym:lgTool.slice(4), label:"", ll });
    lgTool = null; markChange(); render(); return;
  }
  state.lage.items.push({ id:uid(), type:lgTool, label:lgDefaultLabel(lgTool), ll });
  lgTool = null; markChange(); render();
}

function wireLagekarte(){
  $("#lgToMonitor").addEventListener("click", () => { state.view = "monitor"; save(); render(); });
  if(state.lage.mode === "karte") lgMapSetup();
  document.querySelectorAll("[data-lgmode]").forEach(b => b.addEventListener("click", () => {
    state.lage.mode = b.dataset.lgmode;
    lgTool = null; lgDraw = null;
    markChange(); render();
  }));
  document.querySelectorAll("[data-lglayer]").forEach(b => b.addEventListener("click", () => {
    state.lage.mapLayer = b.dataset.lglayer;
    markChange(); render();
  }));
  const toAddr = $("#lgToAddr");
  if(toAddr) toAddr.addEventListener("click", () => {
    const q = lgEinsatzAdresse();
    if(!q){ modalInfo("Kein Einsatzort in den Stammdaten hinterlegt."); return; }
    lgGeocode(q, ll => {
      if(ll && lgMapObj){ lgMapObj.setView(ll, 17); state.lage.mapView = { center:ll, zoom:17 }; save(); }
      else modalInfo("Adresse konnte nicht gefunden werden – bitte Einsatzort prüfen.");
    });
  });
  $("#lgSnapBtn").addEventListener("click", () => { lgFreeze(); render(); });
  document.querySelectorAll("[data-lgsnap]").forEach(b =>
    b.addEventListener("click", () => openLgSnapshot(b.dataset.lgsnap)));
  document.querySelectorAll("[data-lgsnapdel]").forEach(b =>
    b.addEventListener("click", () => {
      modalConfirm("Dieses Lagebild wirklich löschen?").then(ok => { if(!ok) return;
        state.lage.snapshots = state.lage.snapshots.filter(s => s.id !== b.dataset.lgsnapdel);
        markChange(); render();
      });
    }));
  $("#lgBigBtn").addEventListener("click", () => { lgBig = !lgBig; render(); });
  const presentZoom = dir => {
    if(lgMapObj){ dir > 0 ? lgMapObj.zoomIn() : lgMapObj.zoomOut(); return; }  // Kartenmodus: Leaflet
    lgZoom = Math.min(4, Math.max(1, lgZoom + dir * 0.5)); render();           // Raster/Bild: Canvas-Zoom
  };
  const pIn = $("#lgPzoomIn"), pOut = $("#lgPzoomOut"), pExit = $("#lgPexit");
  if(pIn)  pIn.addEventListener("click", () => presentZoom(1));
  if(pOut) pOut.addEventListener("click", () => presentZoom(-1));
  if(pExit) pExit.addEventListener("click", () => { lgPresent = false; if(document.fullscreenElement) document.exitFullscreen(); render(); });
  const presentBtn = $("#lgPresentBtn");
  if(presentBtn) presentBtn.addEventListener("click", () => {
    lgPresent = true;
    const rf = document.documentElement.requestFullscreen;
    if(rf) rf.call(document.documentElement).catch(() => {});
    render();
  });
  document.querySelectorAll("[data-lgtool]").forEach(b => b.addEventListener("click", () => {
    const tool = b.dataset.lgtool;
    if(tool === "symsearch"){ openSymSearch(); return; }
    if(LG_SUBMENUS[tool]){                       // Werkzeug mit Untermenü (Brand, Wasser)
      lgSubmenu = (lgSubmenu === tool) ? null : tool;
      lgTool = null; lgDraw = null; render(); return;
    }
    lgTool = (lgTool === tool) ? null : tool;
    lgSubmenu = null; lgDraw = null;
    render();
  }));
  document.querySelectorAll("[data-lgsub]").forEach(b => b.addEventListener("click", () => {
    lgTool = "sym:" + b.dataset.lgsub;           // Untermenü-Auswahl → passendes Symbol platzieren
    lgSubmenu = null; lgDraw = null; render();
  }));
  const cancel = $("#lgCancel");
  if(cancel) cancel.addEventListener("click", () => { lgTool = null; lgDraw = null; lgSubmenu = null; render(); });
  const drawDone = $("#lgDrawDone");
  if(drawDone) drawDone.addEventListener("click", () => {
    if(lgDraw && lgDraw.points.length >= (lgDraw.type === "area" ? 3 : 2)){
      state.lage.items.push({ id:uid(), type:lgDraw.type, points:lgDraw.points, color:"fw" });
      const newId = state.lage.items[state.lage.items.length-1].id;
      lgDraw = null; lgTool = null;
      markChange(); render();
      openLgShapeEdit(newId); // direkt Farbe wählen
    }
  });
  document.querySelectorAll("[data-lgedit]").forEach(b =>
    b.addEventListener("click", () => openLgEdit(b.dataset.lgedit)));
  document.querySelectorAll("[data-lgfind]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.lgfind;
    const pt = document.querySelector(`.lg-item[data-id="${id}"], .lg-mk[data-id="${id}"]`);
    const sh = pt ? null : document.querySelector(`[data-shape="${id}"]`);   // Linie/Fläche (SVG bzw. Karte)
    const el = pt || sh;
    if(!el) return;
    const cls = pt ? "wackel" : "flash";   // Punkt-Marker wackeln, Linien blinken
    el.classList.remove(cls); void el.getBoundingClientRect();   // Reflow → Animation startet neu
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  }));
  const lgPr = $("#lgPrint"); if(lgPr) lgPr.addEventListener("click", doPrintLagekarte);
  document.querySelectorAll("select[data-lgcar]").forEach(sel =>
    sel.addEventListener("change", () => {
      const it = state.lage.items.find(i => i.id === sel.dataset.lgcar);
      if(it){ it.unitId = sel.value; markChange(); render(); }
    }));
  $("#lgBgBtn").addEventListener("click", () => $("#lgBgFile").click());
  $("#lgBgFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;
    resizeImage(file, 1920, data => {
      state.lage.bg = data;
      state.lage.mode = "bild";
      try{ markChange(); }catch(err){ modalInfo("Bild zu groß für den lokalen Speicher – bitte kleineres Foto wählen."); state.lage.bg = ""; }
      render();
    });
  });
  const bgDel = $("#lgBgDel");
  if(bgDel) bgDel.addEventListener("click", () => { state.lage.bg = ""; state.lage.mode = "raster"; markChange(); render(); });
  $("#lgBgPaste").addEventListener("click", async () => {
    try{
      const items = await navigator.clipboard.read();
      for(const it of items){
        const type = it.types.find(t => t.startsWith("image/"));
        if(type){
          const blob = await it.getType(type);
          resizeImage(blob, 1920, data => { setLgBg(data); });
          return;
        }
      }
      modalInfo("Kein Bild in der Zwischenablage gefunden – erst einen Screenshot kopieren (z. B. aus dem BayernAtlas).");
    }catch(err){
      modalInfo("Zugriff auf die Zwischenablage nicht möglich. Alternativ: Strg+V direkt auf der Lagekarte, oder den Foto-Knopf nutzen.");
    }
  });
  const clear = $("#lgClear");
  if(clear) clear.addEventListener("click", () => {
    modalConfirm("Alle Symbole von der Lagekarte entfernen?").then(ok => { if(!ok) return;
      state.lage.items = []; markChange(); render();
    });
  });

  // Zoom + Zeichnen nur im Raster-/Bild-Modus (im Karten-Modus gibt es keine Canvas)
  const wrap = $("#lgWrap");
  const canvas = $("#lgCanvas");
  if(!wrap || !canvas) return;
  const setZoom = z => {
    const old = lgZoom;
    lgZoom = Math.min(4, Math.max(1, z));
    if(lgZoom === old) return;
    // Bildmitte beim Zoomen beibehalten
    const cx = (wrap.scrollLeft + wrap.clientWidth/2) / canvas.offsetWidth;
    const cy = (wrap.scrollTop + wrap.clientHeight/2) / canvas.offsetHeight;
    render();
    const w2 = $("#lgWrap"), c2 = $("#lgCanvas");
    w2.scrollLeft = cx * c2.offsetWidth - w2.clientWidth/2;
    w2.scrollTop  = cy * c2.offsetHeight - w2.clientHeight/2;
  };
  $("#lgZoomIn").addEventListener("click", () => setZoom(lgZoom + 0.5));
  $("#lgZoomOut").addEventListener("click", () => setZoom(lgZoom - 0.5));

  // Platzieren, Verschieben, Bearbeiten
  let drag = null;
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.min(98, Math.max(2, (e.clientX - r.left) / r.width * 100)),
      y: Math.min(96, Math.max(4, (e.clientY - r.top) / r.height * 100)),
    };
  };
  wrap.addEventListener("pointerdown", e => {
    const el = e.target.closest(".lg-item, [data-ealbl]");
    drag = { el, id: el ? (el.dataset.id || el.dataset.ealbl) : null,
      ealbl: el ? el.hasAttribute("data-ealbl") : false, sx:e.clientX, sy:e.clientY, moved:false };
    if(el){ wrap.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  wrap.addEventListener("pointermove", e => {
    if(!drag || !drag.el) return;
    if(Math.abs(e.clientX-drag.sx) + Math.abs(e.clientY-drag.sy) > 6) drag.moved = true;
    if(!drag.moved) return;
    const p = pos(e);
    drag.el.style.left = p.x + "%"; drag.el.style.top = p.y + "%";
    drag.x = p.x; drag.y = p.y;
  });
  wrap.addEventListener("pointercancel", () => { drag = null; });
  wrap.addEventListener("pointerup", e => {
    const d = drag; drag = null;
    if(!d) return;
    if(d.el){
      const it = state.lage.items.find(i => i.id === d.id);
      if(!it) return;
      if(d.ealbl){
        if(d.moved){ it.labelPos = { x:d.x, y:d.y }; markChange(); }
      }else if(d.moved){ it.x = d.x; it.y = d.y; markChange(); }
      else openLgEdit(it.id);
      return;
    }
    // Wischen/Pannen nicht als Platzieren werten
    if(Math.abs(e.clientX-d.sx) + Math.abs(e.clientY-d.sy) > 6) return;
    // Tipp auf Linie/Fläche (ohne aktives Werkzeug) → bearbeiten
    const sh = e.target.closest("[data-shape]");
    if(sh && !lgTool && !lgDraw){ openLgShapeEdit(sh.dataset.shape); return; }
    if(lgTool === "line" || lgTool === "area"){
      const p = pos(e);
      if(!lgDraw) lgDraw = { type: lgTool, points: [] };
      lgDraw.points.push({ x:p.x, y:p.y });
      render();
      return;
    }
    if(lgTool && lgTool.startsWith("sym:")){
      const p = pos(e);
      state.lage.items.push({ id:uid(), type:"sym", sym:lgTool.slice(4), label:"", x:p.x, y:p.y });
      lgTool = null;
      markChange(); render();
      return;
    }
    if(lgTool === "form"){
      const p = pos(e);
      const it = { id:uid(), type:"form", shape:"rect", color:"fw", text:"", x:p.x, y:p.y };
      state.lage.items.push(it); lgTool = null; markChange(); render(); openLgFormEdit(it.id);
      return;
    }
    if(lgTool){
      const p = pos(e);
      if(lgTool === "car"){
        const nextCarNum = state.lage.items.filter(i => i.type === "car")
          .reduce((m,i) => Math.max(m, i.num||0), 0) + 1;
        const item = { id:uid(), type:"car", num:nextCarNum, unitId:"", x:p.x, y:p.y };
        state.lage.items.push(item);
        lgTool = null;
        markChange(); render();
        openLgEdit(item.id); // direkt Fahrzeug zuordnen
      }else if(lgTool === "num" || lgTool === "gefahr"){
        const typ = lgTool;
        const nextNum = state.lage.items.filter(i => i.type === typ)
          .reduce((m,i) => Math.max(m, i.num||0), 0) + 1;
        const item = { id:uid(), type:typ, num:nextNum, text:"", x:p.x, y:p.y };
        state.lage.items.push(item);
        lgTool = null;
        markChange(); render();
        openLgEdit(item.id); // direkt Beschreibung eintragen
      }else{
        state.lage.items.push({ id:uid(), type:lgTool, label:lgDefaultLabel(lgTool), x:p.x, y:p.y });
        lgTool = null;
        markChange(); render();
      }
    }
  });
}
function openLgSnapshot(id){
  const s = (state.lage.snapshots||[]).find(x => x.id === id);
  if(!s) return;
  const nums = s.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Lagebild ${fmtZeit(s.zeit)} Uhr">
    <div class="sheet-head">
      <h2>Lagebild ${fmtZeit(s.zeit)} Uhr <span style="font-weight:500;color:var(--ink3);font-size:.85rem">· eingefroren, ${fmtDatum(s.zeit)}</span></h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      ${s.mode === "karte" ? `
      <div class="lg-wrap" style="overflow:hidden"><div id="lgSnapMap" style="width:100%;height:100%"></div></div>` : `
      <div class="lg-wrap" style="pointer-events:none;overflow:hidden">
        <div class="lg-canvas ${s.bg ? "hasbg" : ""}" ${s.bg ? `style="background-image:url('${s.bg}')"` : ""}>
          ${lgShapesSvg(s.items, null)}
          ${s.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
        </div>
      </div>`}
      ${nums.length ? `
      <div class="lg-legend" style="margin-top:12px">
        <h3>Legende</h3>
        <div class="lg-leg-cols">
          ${nums.map(i => `
          <div class="lg-leg-item">
            <span class="lg-leg-num">${esc(i.num)}</span>
            <span class="lg-leg-text">${esc(i.text || "")}</span>
          </div>`).join("")}
        </div>
      </div>` : ""}
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" data-close="1" style="flex:1">Schließen</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  if(s.mode === "karte" && typeof L !== "undefined"){
    const el = document.getElementById("lgSnapMap");
    if(el){
      if(lgSnapObj){ try{ lgSnapObj.remove(); }catch(e){} }
      const v = s.mapView || { center:[49.6767, 12.1625], zoom:15 };
      lgSnapObj = L.map(el, { zoomControl:false, dragging:false, scrollWheelZoom:false,
        doubleClickZoom:false, boxZoom:false, keyboard:false, touchZoom:false, tap:false }).setView(v.center, v.zoom);
      lgBaseLayer(s.mapLayer).addTo(lgSnapObj);
      lgAddItems(L.layerGroup().addTo(lgSnapObj), false, s.items);
      setTimeout(() => { if(lgSnapObj) lgSnapObj.invalidateSize(); }, 60);
    }
  }
}
/* Symbolsuche: die gängigsten taktischen Zeichen (DV 102) mit Filterfeld */
function openSymSearch(){
  const rows = q => SYM_KATALOG
    .filter(s => !q || s.name.toLowerCase().includes(q))
    .map(s => `
      <button class="sym-row" data-symkey="${esc(s.key)}">
        ${symTile(s, true)}<span class="sym-name">${esc(s.name)}</span>
      </button>`).join("") || `<p class="hint" style="padding:14px 4px">Kein Zeichen gefunden.</p>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Taktische Zeichen">
    <div class="sheet-head">
      <h2>Taktische Zeichen (DV 102)</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="symSearch">Suchen</label>
        <input id="symSearch" placeholder="z. B. Brand, Hydrant, Behandlungsplatz …" autocomplete="off"></div>
      <div id="symList">${rows("")}</div>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const wireRows = () => document.querySelectorAll("[data-symkey]").forEach(b =>
    b.addEventListener("click", () => {
      lgTool = "sym:" + b.dataset.symkey;
      lgDraw = null;
      closeEditor(); render();
    }));
  wireRows();
  const inp = $("#symSearch");
  inp.focus();
  inp.addEventListener("input", () => {
    $("#symList").innerHTML = rows(inp.value.trim().toLowerCase());
    wireRows();
  });
}
function openLgShapeEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  const names = { fw:"Rot", thw:"Blau", brk:"Gold", pol:"Grün" };
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${it.type==="area"?"Fläche":"Linie"} bearbeiten" style="max-height:55vh">
    <div class="sheet-head">
      <h2>${it.type === "area" ? "Fläche" : "Linie"} bearbeiten</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Farbe</label>
        <div class="swatches">
          ${LG_SHAPE_COLORS.map(c => `
            <button data-shcolor="${c}" style="--sc:var(--${c})" aria-pressed="${(it.color||"fw")===c}" aria-label="${names[c]}"></button>`).join("")}
        </div>
        <p class="hint">z. B. Blau = Schlauchleitung/Wasser, Rot = Absperrung, Gold = Fläche/Bereitstellung, Grün = Abschnitt.</p>
      </div>
      <div class="field"><label for="sh-text">Beschriftung <span style="text-transform:none;font-weight:500">(erscheint in der Legende)</span></label>
        <input id="sh-text" value="${esc(it.text||"")}" placeholder="z. B. Schlauchleitung B, Absperrung" autocomplete="off"></div>
      ${it.type === "area" && geoFlaecheM2(it.llpoints) > 0 ? `
      <div class="field"><label>Flächeninhalt</label>
        <div class="mono" style="font-size:1.1rem;font-weight:800">${flaecheStr(geoFlaecheM2(it.llpoints))}</div></div>` : ""}
      ${it.type === "area" ? `
      <div class="field"><label for="sh-abschnitt">Einsatzabschnitt</label>
        <select id="sh-abschnitt">
          <option value="">– keiner –</option>
          ${state.abschnitte.map(a => `<option value="${esc(a.id)}" ${it.abschnittId===a.id?"selected":""}>${esc(a.name)}</option>`).join("")}
        </select>
        <p class="hint">${state.abschnitte.length ? "Die Fläche wird mit dem Abschnitt verknüpft und dessen Name auf der Karte angezeigt." : "Noch keine Abschnitte angelegt (Tab „Einsatz“)."}</p>
      </div>` : ""}
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="sh-del">Entfernen</button>
      <button class="btn btn-primary" id="sh-save" style="flex:1">Fertig</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-shcolor]").forEach(b => b.addEventListener("click", () => {
    it.color = b.dataset.shcolor;
    document.querySelectorAll("[data-shcolor]").forEach(x =>
      x.setAttribute("aria-pressed", x.dataset.shcolor === it.color));
    markChange(); render();   // Fläche und EA-Label sofort in der neuen Farbe zeichnen
  }));
  const abSel = $("#sh-abschnitt");
  if(abSel) abSel.addEventListener("change", () => {
    it.abschnittId = abSel.value || "";
    markChange(); render();   // Label sofort ein-/ausblenden (Farbe bleibt frei wählbar)
  });
  $("#sh-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#sh-save").addEventListener("click", () => {
    const t = $("#sh-text"); if(t) it.text = t.value.trim();
    markChange(); closeEditor(); render();
  });
}
// Editor für frei einfügbare Formen (Kreis/Quadrat/Rechteck) mit Farbe und optionalem Text.
function openLgFormEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  const names = { fw:"Rot", thw:"Blau", brk:"Gold", pol:"Grün" };
  const shapes = [ { s:"circle", n:"Kreis" }, { s:"square", n:"Quadrat" }, { s:"rect", n:"Rechteck" } ];
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Form bearbeiten" style="max-height:70vh">
    <div class="sheet-head"><h2>Form</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field"><label>Form</label>
        <div class="seg" style="max-width:none">
          ${shapes.map(sh => `<button type="button" data-formshape="${sh.s}" class="${(it.shape||"rect")===sh.s?"active":""}">${sh.n}</button>`).join("")}
        </div></div>
      <div class="field"><label>Farbe</label>
        <div class="swatches">
          ${LG_SHAPE_COLORS.map(c => `<button data-shcolor="${c}" style="--sc:var(--${c})" aria-pressed="${(it.color||"fw")===c}" aria-label="${names[c]}"></button>`).join("")}
        </div></div>
      <div class="field"><label for="form-text">Text <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="form-text" value="${esc(it.text||"")}" placeholder="z. B. BR, RTW, Absperrung …" autocomplete="off">
        <p class="hint">Kurzer Text steht in der Form – bei „Rechteck" ist mehr Platz.</p></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="form-del">Entfernen</button>
      <button class="btn btn-primary" id="form-save" style="flex:1">Fertig</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const txt = $("#form-text"); txt.focus();
  document.querySelectorAll("[data-formshape]").forEach(b => b.addEventListener("click", () => {
    it.shape = b.dataset.formshape;
    document.querySelectorAll("[data-formshape]").forEach(x => x.classList.toggle("active", x.dataset.formshape === it.shape));
    it.text = txt.value.trim(); markChange(); render();
  }));
  document.querySelectorAll("[data-shcolor]").forEach(b => b.addEventListener("click", () => {
    it.color = b.dataset.shcolor;
    document.querySelectorAll("[data-shcolor]").forEach(x => x.setAttribute("aria-pressed", x.dataset.shcolor === it.color));
    it.text = txt.value.trim(); markChange(); render();
  }));
  txt.addEventListener("keydown", e => { if(e.key === "Enter") $("#form-save").click(); });
  $("#form-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#form-save").addEventListener("click", () => { it.text = txt.value.trim(); markChange(); closeEditor(); render(); });
}
function openLgEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  if(it.type === "form") return openLgFormEdit(id);   // Form hat eigenen Editor (Form/Farbe/Text)
  if(it.type === "line" || it.type === "area") return openLgShapeEdit(id);   // Linie/Fläche: Farbe + Beschriftung
  const isNum = it.type === "num", isCar = it.type === "car", isGef = it.type === "gefahr";
  const numbered = isNum || isGef;
  const fields = numbered ? `
      <div class="field" style="max-width:140px"><label for="lg-num">Nummer</label>
        <input id="lg-num" class="mono" type="number" min="1" max="99" value="${esc(it.num)}"></div>
      <div class="field"><label for="lg-label">Beschreibung (steht in der Legende)</label>
        <input id="lg-label" value="${esc(it.text||"")}" placeholder="${isGef ? "z. B. Gasaustritt, Stromleitung" : "z. B. Faltbehälter 10.000 Liter"}" autocomplete="off"></div>`
    : isCar ? `
      <div class="field"><label for="lg-unit">Fahrzeug (aus den erfassten Einheiten)</label>
        <select id="lg-unit">${lgCarOptions(it.unitId)}</select>
        <p class="hint">Die Zuordnung geht auch jederzeit über die Dropdown-Liste in der Legende.</p></div>`
    : `
      <div class="field"><label for="lg-label">Beschriftung</label>
        <input id="lg-label" value="${esc(it.label||"")}" autocomplete="off"></div>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Symbol bearbeiten" style="max-height:70vh">
    <div class="sheet-head">
      <h2>${isGef ? `Gefahr ${esc(it.num||"")}` : isNum ? `Marker ${esc(it.num)}` : isCar ? `Fahrzeug ${esc(it.num||"")}` : "Symbol bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">${fields}</div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="lg-del">Entfernen</button>
      <button class="btn btn-primary" id="lg-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const inp = $("#lg-label");
  if(inp){
    inp.focus();
    inp.addEventListener("keydown", e => { if(e.key === "Enter") $("#lg-save").click(); });
  }
  $("#lg-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#lg-save").addEventListener("click", () => {
    if(numbered){
      it.num = Math.max(1, Math.min(99, parseInt($("#lg-num").value, 10) || it.num));
      it.text = inp.value.trim();
    }else if(isCar){
      it.unitId = $("#lg-unit").value;
    }else{
      it.label = inp.value.trim();
    }
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Druck: Einsatzbericht ---------------- */
function printMapHtml(lage){
  if(lage.mode === "karte"){
    return `<p style="font-size:10pt">Lagekarte im Online-Kartenmodus – für den Ausdruck bitte am Gerät
      einen Screenshot der Karte erstellen und als Bild-Hintergrund einfügen. Die Legende steht unten.</p>`;
  }
  return `<div class="p-map">
    <div class="lg-canvas ${lage.bg ? "hasbg" : ""}" ${lage.bg ? `style="background-image:url('${lage.bg}')"` : ""}>
      ${lgShapesSvg(lage.items, null)}
      ${lage.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
    </div>
  </div>`;
}
function printLegendHtml(items, units){
  const nums = items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  const gefahren = items.filter(i => i.type === "gefahr").sort((a,b) => (a.num||0)-(b.num||0));
  const forms = items.filter(i => i.type === "form" && (i.text||"").trim());
  const lines = items.filter(i => i.type === "line" && (i.text||"").trim());
  const cars = items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
  const rows = [
    ...nums.map(i => `<div><strong class="p-mono">▲ ${esc(i.num)}</strong> ${esc(i.text||"")}</div>`),
    ...gefahren.map(i => `<div><strong class="p-mono">⚠ ${esc(i.num)}</strong> ${esc(i.text||"")}</div>`),
    ...forms.map(i => `<div><strong class="p-mono">◆</strong> ${esc(i.text)}</div>`),
    ...lines.map(i => `<div><strong class="p-mono">—</strong> ${esc(i.text)}</div>`),
    ...cars.map(i => {
      const u = (units || []).find(x => x.id === i.unitId);
      return `<div><strong class="p-mono">Fzg ${esc(i.num||"?")}</strong> ${u ? esc(fullName(u)) : "nicht zugeordnet"}</div>`;
    }),
  ].join("");
  return rows ? `<div class="p-legend">${rows}</div>` : "";
}
/* Nur die Lagekarte drucken (Karte + Legende), ohne den gesamten Einsatzbericht */
function doPrintLagekarte(){
  const e = state.einsatz;
  $("#printArea").innerHTML = `
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Lagekarte</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}${e.beginn ? " · Alarm " + fmtDatum(e.beginn) + " " + fmtZeit(e.beginn) + " Uhr" : ""}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    ${printMapHtml(state.lage)}
    ${printLegendHtml(state.lage.items, state.einheiten)}
    <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Lagekarte · ${esc(state.config.ugName)}</p>`;
  window.print();
}
function doPrint(data){
  const e = data.einsatz;
  const pEnde = e.ende || data.ende;   // Einsatzende: Stammdatenfeld, sonst Archiv-Zeitstempel
  const abs = data.abschnitte || [];
  const showAb = abs.length > 0;
  const s = summen(data.einheiten.filter(u => !u.abgerueckt));
  const sAll = summen(data.einheiten);
  const units = [...data.einheiten].sort((a,b) => fullName(a).localeCompare(fullName(b), "de"));
  const unitRows = units.map(u => `
    <tr>
      <td class="p-mono">${fmtZeit(u.ankunft)}</td>
      <td>${esc((ORGS[u.org]||ORGS.SON).label)}</td>
      <td class="p-mono">${esc(fullName(u))}</td>
      ${showAb ? `<td>${esc(abNameOf(u.abschnitt, abs)) || "–"}</td>` : ""}
      <td class="p-mono" style="text-align:right">${staerkeStr(u)}</td>
      <td class="p-mono" style="text-align:right">${u.agt||"–"}</td>
      <td class="p-mono" style="text-align:right">${u.csa||"–"}</td>
      <td>${u.abgerueckt?"abgerückt":"vor Ort"}</td>
    </tr>`).join("");
  const fkRows = [...data.fuehrung].sort((a,b) => (a.name||"").localeCompare(b.name||"", "de")).map(f => `
    <tr>
      <td>${esc(f.name)}</td>
      <td>${esc(f.funktion)}</td>
      <td class="p-mono">${esc(f.funkrufname||"")}</td>
      <td>${esc((ORGS[f.org]||ORGS.SON).label)}</td>
      <td>${esc(f.einheit||"–")}</td>
    </tr>`).join("");
  $("#printArea").innerHTML = `
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Einsatzbericht · Kräfteübersicht${pEnde ? "" : " · Zwischenstand"}</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}${e.objekt ? " · " + esc(e.objekt) : ""}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    <table class="meta">
      ${e.objekt ? `<tr><td>Objekt</td><td>${esc(e.objekt)}</td></tr>` : ""}
      <tr><td>Alarmzeit</td><td>${e.beginn ? fmtDatum(e.beginn)+" "+fmtZeit(e.beginn)+" Uhr" : "–"}</td></tr>
      <tr><td>Einsatzende</td><td>${pEnde ? fmtDatum(pEnde)+" "+fmtZeit(pEnde)+" Uhr" : "– (Einsatz läuft)"}</td></tr>
      <tr><td>Einsatzdauer</td><td>${dauerStr(e.beginn, pEnde) || "–"}</td></tr>
      <tr><td>Einsatzleiter</td><td>${esc(e.leiter) || "–"}</td></tr>
      ${(!pEnde && e.lagebespr) ? `<tr><td>Nächste Lagebesprechung</td><td>${esc(e.lagebespr)} Uhr</td></tr>` : ""}
      ${gruppeStr(e.ilsGruppe) ? `<tr><td>Leitstelle</td><td>${esc(state.config.ilsName||"Leitstelle")} · ${esc(gruppeStr(e.ilsGruppe))}</td></tr>` : ""}
      ${showAb ? `<tr><td>Abschnitte</td><td>${abs.map(a=>{
        const funk=[a.ansprechpartner?`AP ${a.ansprechpartner}`:"",
          gruppeStr(a.fuehrung), gruppeStr(a.arbeit)].filter(Boolean).join(", ");
        return esc(a.name)+(funk?` (${esc(funk)})`:"");
      }).join(" · ")}</td></tr>` : ""}
      ${e.bemerkung ? `<tr><td>Bemerkungen</td><td>${esc(e.bemerkung)}</td></tr>` : ""}
    </table>
    <h2>Führungskräfte (${data.fuehrung.length})</h2>
    ${fkRows ? `<table><thead><tr><th>Name</th><th>Funktion</th><th>Funkrufname</th><th>Organisation</th><th>Einheit / Abschnitt</th></tr></thead><tbody>${fkRows}</tbody></table>` : "<p>Keine erfasst.</p>"}
    <h2>Einheiten (${data.einheiten.length})</h2>
    ${unitRows ? `<table><thead><tr><th>Ankunft</th><th>Organisation</th><th>Funkrufname</th>${showAb?"<th>Abschnitt</th>":""}<th>Stärke</th><th>AGT</th><th>CSA</th><th>Status</th></tr></thead><tbody>${unitRows}</tbody></table>` : "<p>Keine erfasst.</p>"}
    ${(data.asTrupps||[]).length ? `
    <h2>Atemschutz – Trupps (${data.asTrupps.length})</h2>
    <table><thead><tr><th>Nr.</th><th>Träger</th><th>Feuerwehr</th><th>Gerät</th><th>Maske</th><th>LA</th><th>CSA</th><th>Start</th><th>Ende</th><th>Abschnitt / Funk</th><th>ausgerückt</th><th>angeschl.</th><th>zurück</th></tr></thead><tbody>
      ${[...data.asTrupps].sort((a,b)=>a.nr-b.nr).map(t => {
        const ids = t.memberIds||[];
        return ids.map((id,idx) => {
          const tr = (data.asTraeger||[]).find(x=>x.id===id) || {};
          const d = (t.druck||{})[id] || {};
          return `<tr>
            <td class="p-mono">${idx===0?t.nr:""}</td>
            <td>${esc(tr.name||"?")}</td><td>${esc(tr.feuerwehr||"")}</td>
            <td class="p-mono">${esc(tr.geraeteNr||"")}</td><td class="p-mono">${esc(tr.maskeNr||"")}</td>
            <td class="p-mono">${esc(tr.lungenNr||"")}</td>
            <td style="text-align:center">${tr.csa?"CSA":""}</td>
            <td class="p-mono">${d.start?esc(d.start):""}</td><td class="p-mono">${d.end?esc(d.end):""}</td>
            <td>${idx===0?esc(t.abschnitt||"–")+(t.funkruf?" / "+esc(t.funkruf):""):""}</td>
            <td class="p-mono">${idx===0&&t.ausgerueckt?fmtZeit(t.ausgerueckt):""}</td>
            <td class="p-mono">${idx===0&&t.angeschlossen?fmtZeit(t.angeschlossen):""}</td>
            <td class="p-mono">${idx===0&&t.rueckkehr?fmtZeit(t.rueckkehr):""}</td>
          </tr>`;
        }).join("");
      }).join("")}
    </tbody></table>` : ""}
    <h2>Nachforderungen (${(data.anforderungen||[]).length})</h2>
    ${(data.anforderungen||[]).length ? `<table><thead><tr><th>Was</th><th>Status</th><th>Angefordert</th><th>Alarmiert</th><th>Eingetroffen</th></tr></thead><tbody>
      ${[...data.anforderungen].sort((a,b) => (a.angefordert||"").localeCompare(b.angefordert||"")).map(a => `
      <tr>
        <td>${esc(a.was)}</td><td>${esc(a.status)}</td>
        <td class="p-mono">${fmtZeit(a.angefordert)}</td>
        <td class="p-mono">${a.alarmiert ? fmtZeit(a.alarmiert) : "–"}</td>
        <td class="p-mono">${a.eingetroffen ? fmtZeit(a.eingetroffen) : "–"}</td>
      </tr>`).join("")}
    </tbody></table>` : "<p>Keine.</p>"}
    <h2>Checklisten (${(data.checks||[]).length})</h2>
    ${(data.checks||[]).length ? (data.checks).map(c => `
      <p style="margin:8px 0 4px"><strong>${esc(c.name)}</strong> – ${c.punkte.filter(p=>p.done).length}/${c.punkte.length} erledigt</p>
      <table><tbody>
        ${c.punkte.map(p => `<tr>
          <td style="width:24px">${p.done ? "☑" : "☐"}</td>
          <td>${esc(p.text)}</td>
          <td class="p-mono" style="width:70px;text-align:right">${p.zeit ? fmtZeit(p.zeit) : ""}</td>
        </tr>`).join("")}
      </tbody></table>`).join("") : "<p>Keine.</p>"}
    <h2>Lagebesprechungen (${(data.besprechungen||[]).length})</h2>
    ${(data.besprechungen||[]).length ? `<table><thead><tr><th style="width:110px">Zeit</th><th style="width:180px">Teilnehmer</th><th>Protokoll</th></tr></thead><tbody>
      ${[...data.besprechungen].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||"")).map(b => `
      <tr>
        <td class="p-mono">${fmtTagKurz(b.zeit)} ${fmtZeit(b.zeit)}</td>
        <td>${esc(b.teilnehmer||"–")}</td>
        <td style="white-space:pre-wrap">${esc(b.protokoll)}</td>
      </tr>`).join("")}
    </tbody></table>` : "<p>Keine protokolliert.</p>"}
    <h2>Funksprüche / Einsatztagebuch (${(data.funk||[]).length})</h2>
    ${(data.funk||[]).length ? (() => {
      const sorted = [...data.funk].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""));
      // Datum nur anzeigen, wenn das Tagebuch über einen Tageswechsel geht
      const mehrtaegig = new Set(sorted.map(f => new Date(f.zeit).toDateString())).size > 1;
      return `<table><thead><tr><th>Nr.</th><th>Zeit</th><th>Von</th><th>An</th><th>Inhalt</th></tr></thead><tbody>
      ${sorted.map((f,idx) => `
      <tr>
        <td class="p-mono">${idx+1}${f.wichtig ? " !" : ""}</td>
        <td class="p-mono">${mehrtaegig ? fmtTagKurz(f.zeit) + " " : ""}${fmtZeit(f.zeit)}</td>
        <td>${esc(f.von)}</td>
        <td>${esc(f.an)}</td>
        <td>${f.wichtig ? `<strong>${esc(f.text)}</strong>` : esc(f.text)}</td>
      </tr>`).join("")}
    </tbody></table>`;})() : "<p>Keine erfasst.</p>"}
    ${(data.lage && data.lage.items && data.lage.items.length) ? `
    <h2>Lagekarte${data.ende ? " (Stand Einsatzende)" : " (aktueller Stand)"}</h2>
    ${printMapHtml(data.lage)}
    ${printLegendHtml(data.lage.items, data.einheiten)}
    ${(data.lage.snapshots||[]).length ? [...data.lage.snapshots]
      .sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""))
      .map(s => `
      <h2>Lagebild ${fmtZeit(s.zeit)} Uhr (${fmtDatum(s.zeit)})</h2>
      ${printMapHtml(s)}
      ${printLegendHtml(s.items, data.einheiten)}`).join("") : ""}` : ""}
    ${(data.fotos||[]).length ? `
    <h2>Fotodokumentation (${data.fotos.length})</h2>
    <div class="p-fotos">
      ${[...data.fotos].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||"")).map(f => `
      <figure>
        <img src="${f.data}" alt="Einsatzfoto">
        <figcaption class="p-mono">${fmtZeit(f.zeit)} Uhr${f.notiz ? " – " + esc(f.notiz) : ""}</figcaption>
      </figure>`).join("")}
    </div>` : ""}
    <p class="p-sum">
      Gesamtstärke über den Einsatz: <span class="p-mono">${sAll.f}/${sAll.u}/${sAll.m}/${sAll.f+sAll.u+sAll.m}</span> · AGT: ${sAll.agt} · CSA: ${sAll.csa}
      ${data.ende ? "" : ` &nbsp;|&nbsp; aktuell vor Ort: <span class="p-mono">${s.f}/${s.u}/${s.m}/${s.f+s.u+s.m}</span>`}
    </p>
    <div class="p-foot">
      <div class="p-sign">Ort, Datum</div>
      <div class="p-sign">Unterschrift Einsatzleiter</div>
    </div>
    <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Kräfteerfassung (Prototyp) · ${esc(state.config.ugName)}</p>`;
  window.print();
}

/* ---------------- Render-Hauptschleife ---------------- */
function render(){
  lgMapTeardown();  // Leaflet-Karte vor dem Neuaufbau des DOM sauber entfernen
  // Auf kleinen Geräten sind Monitor/Lagekarte/Funkskizze nicht verfügbar
  if(!istGrossesGeraet() && (TABS.find(t => t.id === state.view) || {}).nurGross){
    state.view = "kraefte";
  }
  renderHeader();
  // Monitor-Vollbild: App-Menü/Topbar ausblenden, nur wenn der Monitor aktiv ist
  document.body.classList.toggle("mon-fullscreen", state.view === "monitor" && monFull);
  document.querySelectorAll("nav [data-tab]").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === state.view));
  const main = $("#view");
  main.classList.toggle("wide", state.view === "monitor" || state.view === "lagekarte");
  main.classList.toggle("w-tablet", state.view === "kraefte");
  main.classList.toggle("w-desk", ["einsatz","funk","bespr","listen","skizze"].includes(state.view));
  $("#footNote").style.display = state.view === "monitor" ? "none" : "";
  if(state.view === "einsatz"){ main.innerHTML = renderEinsatz(); wireEinsatz(); }
  else if(state.view === "kraefte"){ main.innerHTML = renderKraefte(); wireKraefte(); }
  else if(state.view === "funk"){ main.innerHTML = renderFunk(); wireFunk(); }
  else if(state.view === "bespr"){ main.innerHTML = renderBespr(); wireBespr(); }
  else if(state.view === "listen"){ main.innerHTML = renderListen(); wireListen(); }
  else if(state.view === "atemschutz"){ main.innerHTML = renderAtemschutz(); wireAtemschutz(); }
  else if(state.view === "skizze"){ main.innerHTML = renderSkizzeView(); }
  else if(state.view === "lagekarte"){ main.innerHTML = renderLagekarte(); wireLagekarte(); }
  else { main.innerHTML = renderMonitor(); wireMonitor(); }
}
// Der erste Render passiert async in boot() (unten), sobald der Zustand aus
// IndexedDB geladen ist.

// Bei Größenwechsel (Drehen/Fenster) neu bewerten, falls die aktive Ansicht wegfällt
window.matchMedia("(min-width:900px)").addEventListener("change", () => {
  if(state && !istGrossesGeraet() && (TABS.find(t => t.id === state.view) || {}).nurGross){ render(); }
});

// Sicherheitsnetz: IndexedDB-Schreibvorgänge sind async – beim Verlassen/Schließen der
// Seite den letzten Stand noch anstoßen, damit die letzte Eingabe nicht verloren geht.
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") save(); });
window.addEventListener("pagehide", () => save());

/* ---------------- PWA: Service Worker registrieren ---------------- */
if("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* ================================================================
   Echter Sync mit dem ELW-Server (server/elwis-server.mjs)
   ----------------------------------------------------------------
   Läuft die App vom ELW-Server (gleiche Adresse), wird der Sync
   automatisch aktiv: alle 3 s werden lokale Änderungen gepusht und
   der zusammengeführte Serverstand übernommen (last-write-wins je
   Datensatz, Löschungen über Tombstones). Gesynct wird ALLES zum
   Einsatz; gerätelokal bleiben: Einstellungen, Monitor-Kacheln, Archiv.
   ================================================================ */
const SYNC = { aktiv:false, verbunden:false, seq:0, urls:[], clients:1, pending:0, busy:false };
const SYNC_COLS = ["einheiten","fuehrung","abschnitte","funk","besprechungen",
  "anforderungen","checks","fotos","asTraeger","asTrupps","lageItems","lageSnapshots"];

function syncClientId(){
  let id = localStorage.getItem("elwis-client-id");
  if(!id){ id = uid(); localStorage.setItem("elwis-client-id", id); }
  return id;
}
function syncColOf(name){
  if(name === "lageItems") return state.lage.items;
  if(name === "lageSnapshots") return state.lage.snapshots;
  return state[name];
}
// Sync-Snapshot: im Speicher gehalten (syncDiff liest synchron), in IndexedDB gespiegelt
let _syncSnap = null;
function syncSnapLoad(){ return _syncSnap; }
function syncSnapSave(s){ _syncSnap = s; idbSet("sync-snap", s).catch(()=>{}); }
function syncSnapshotVomZustand(){
  const snap = { einsatzId: state.einsatzId,
    singletons: { einsatz: JSON.stringify(state.einsatz), lageBg: JSON.stringify(state.lage.bg) },
    collections: {} };
  for(const name of SYNC_COLS){
    const col = {};
    for(const rec of (syncColOf(name) || [])) col[rec.id] = JSON.stringify(rec);
    snap.collections[name] = col;
  }
  return snap;
}
/* Änderungen seit dem letzten Abgleich ermitteln (Diff gegen Snapshot) */
function syncDiff(){
  const snap = syncSnapLoad();
  const passt = snap && snap.einsatzId === state.einsatzId;
  const now = Date.now();
  const out = { clientId: syncClientId(), einsatzId: state.einsatzId, einsatzStart: state.einsatzStart,
    seq: SYNC.seq, singletons: {}, collections: {}, tombstones: {} };
  let pending = 0;
  const singles = { einsatz: state.einsatz, lageBg: state.lage.bg };
  for(const k of Object.keys(singles)){
    const j = JSON.stringify(singles[k]);
    if(!passt || !snap.singletons || snap.singletons[k] !== j){
      out.singletons[k] = { v: singles[k], _m: now };
      pending++;
    }
  }
  for(const name of SYNC_COLS){
    const arr = syncColOf(name) || [];
    const snapCol = (passt && snap.collections && snap.collections[name]) || {};
    const changed = [];
    const ids = new Set();
    for(const rec of arr){
      ids.add(String(rec.id));
      if(snapCol[rec.id] !== JSON.stringify(rec)){
        rec._m = now;
        changed.push(rec);
      }
    }
    const tomb = {};
    for(const id of Object.keys(snapCol)){
      if(!ids.has(id)){ tomb[id] = now; pending++; }
    }
    if(changed.length) out.collections[name] = changed;
    if(Object.keys(tomb).length) out.tombstones[name] = tomb;
    pending += changed.length;
  }
  return { out, pending };
}
/* Zusammengeführten Serverstand übernehmen (eigene Änderungen waren im Push enthalten) */
function syncApply(server){
  state.einsatzId = server.einsatzId;
  state.einsatzStart = server.einsatzStart;
  if(server.singletons && server.singletons.einsatz) state.einsatz = server.singletons.einsatz.v;
  if(server.singletons && server.singletons.lageBg) state.lage.bg = server.singletons.lageBg.v || "";
  for(const name of SYNC_COLS){
    const arr = (server.collections && server.collections[name]) || [];
    if(name === "lageItems") state.lage.items = arr;
    else if(name === "lageSnapshots") state.lage.snapshots = arr;
    else state[name] = arr;
  }
  syncSnapSave(syncSnapshotVomZustand());
  save();
}
function syncTipptGerade(){
  const a = document.activeElement;
  return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT");
}
async function syncTick(){
  if(SYNC.busy) return;
  SYNC.busy = true;
  try{
    const { out, pending } = syncDiff();
    SYNC.pending = pending;
    const vorher = JSON.stringify(syncSnapshotVomZustand());
    const res = await fetch("./api/sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(out),
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();
    SYNC.verbunden = true;
    SYNC.clients = d.clients || 1;
    SYNC.seq = d.seq;
    if(!d.unchanged){
      syncApply(d);
      SYNC.pending = 0;
      // Nur neu zeichnen, wenn sich wirklich etwas geändert hat und niemand gerade tippt
      if(JSON.stringify(syncSnapshotVomZustand()) !== vorher && !syncTipptGerade()) render();
      else renderHeader();
    }else{
      if(pending === 0) SYNC.pending = 0;
      renderHeader();
    }
  }catch(err){
    SYNC.verbunden = false;
    renderHeader();
  }finally{
    SYNC.busy = false;
  }
}
function syncPill(){
  if(!SYNC.aktiv) return;
  const pill = $("#syncPill"), txt = $("#syncText"), sw = $("#wlanSwitch");
  if(sw) sw.style.display = "none"; // Simulations-Schalter weg, der Sync ist echt
  if(!pill || !txt) return;
  pill.classList.remove("busy");
  if(SYNC.verbunden){
    pill.classList.add("good");
    txt.textContent = `Synchron · ${SYNC.clients} Gerät${SYNC.clients === 1 ? "" : "e"}`;
  }else{
    pill.classList.remove("good");
    txt.textContent = `Offline · ${SYNC.pending} lokal`;
  }
  const fn = $("#footNote");
  if(fn && SYNC.urls.length){
    fn.textContent = "ELWIS-Sync aktiv · Tablets im gleichen WLAN verbinden über: " + SYNC.urls.join("  ·  ");
  }
}
const _origRenderHeader = renderHeader;
renderHeader = function(){ _origRenderHeader(); syncPill(); };

async function syncInit(){
  try{
    const res = await fetch("./api/info", { cache: "no-store" });
    if(!res.ok) return;
    const d = await res.json();
    if(!d || !d.elwis) return;
    SYNC.aktiv = true;
    SYNC.urls = d.urls || [];
    syncTick();
    setInterval(syncTick, 3000);
    render();
  }catch(e){ /* kein ELW-Server erreichbar → App läuft eigenständig weiter */ }
}

/* ---------------- Start: Zustand laden, dann rendern ---------------- */
async function boot(){
  const stored = await ladeZustand();
  zustandAufbauen(stored);
  const spUg = $("#splashUg"); if(spUg) spUg.textContent = state.config.ugName || "";  // Splash mit echtem Namen
  // Sync-Snapshot laden (mit einmaliger Übernahme aus altem localStorage)
  try{
    _syncSnap = await idbGet("sync-snap");
    if(!_syncSnap){
      const altSnap = localStorage.getItem("elwis-sync-snap");
      if(altSnap){
        _syncSnap = JSON.parse(altSnap);
        try{ await idbSet("sync-snap", _syncSnap); localStorage.removeItem("elwis-sync-snap"); }catch(e){}
      }
    }
  }catch(e){ /* ohne Snapshot wird beim ersten Abgleich einmalig alles gepusht */ }
  if(!state.einsatz.beginn) state.einsatz.beginn = nowLocalInput();
  if(!TABS.some(t => t.id === state.view)) state.view = "einsatz";
  render();
  syncInit();
}
boot();
