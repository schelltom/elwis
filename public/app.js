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
  { id:"skizze",   label:"Komm-Skizze", nurGross:true,
    icon:'<rect x="8.5" y="3" width="7" height="5" rx="1"/><rect x="2.5" y="16" width="7" height="5" rx="1"/><rect x="14.5" y="16" width="7" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>' },
  { id:"bespr",    label:"Besprechung",
    icon:'<path d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"/><path d="M7.5 8.5h9M7.5 12h6"/>' },
  { id:"fotodoku", label:"Foto-Doku",
    icon:'<rect x="3" y="6.5" width="18" height="13" rx="2"/><path d="M8.5 6.5 10 4h4l1.5 2.5"/><circle cx="12" cy="13" r="3.2"/>' },
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
// und Komm-Skizze brauchen mindestens ein 10-Zoll-Gerät.
function istGrossesGeraet(){ return window.matchMedia("(min-width:900px)").matches; }
function sichtbareTabs(){ return istGrossesGeraet() ? TABS : TABS.filter(t => !t.nurGross); }

function defaultConfig(){
  return {
    ugName:"UG-Weiden",
    elwFunk:"Kater Weiden 1/12/1",   // Funkrufname des ELW – vorbelegt als Empfänger im Funktagebuch
    w3wKey:"VLTV5K26",                // what3words-API-Key (für die 3-Wörter → Adresse-Umwandlung, nur online)
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
    einsatz: { stichwort:"", ort:"", objekt:"", beginn:"", ende:"", leiter:"", bereitstellungsraum:"", bereitstellung:false, bemerkung:"", ilsGruppe:{mode:"TMO",gruppe:"2772"} },
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
  if(!state.config.w3wKey) state.config.w3wKey = defaultConfig().w3wKey;   // Key auch bei Altkonfig sicherstellen
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
  // Bestehende Fahrzeug- und Gefahr-Symbole ohne Nummer nachnummerieren (fortlaufend)
  let maxCar = state.lage.items.reduce((m,i) => i.type==="car" ? Math.max(m, i.num||0) : m, 0);
  state.lage.items.forEach(i => { if(i.type === "car" && !i.num) i.num = ++maxCar; });
  let maxGef = state.lage.items.reduce((m,i) => i.type==="gefahr" ? Math.max(m, i.num||0) : m, 0);
  state.lage.items.forEach(i => { if(i.type === "gefahr" && !i.num) i.num = ++maxGef; });
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
/* Funkrufname normalisieren: führendes Gattungswort (z. B. „Feuerwehr"/„FF") durch das je
   Organisation konfigurierte Präfix ersetzen – „Feuerwehr Schirmitz" → „Florian Schirmitz". */
function normFunkname(name, org){
  name = (name || "").trim();
  const p = (state.config.prefixes[org] || "").trim();
  if(!name || !p) return name;
  const alias = { FW:"feuerwehr|ff|florian", BRK:"brk|rk|rotes kreuz|rot[- ]?kreuz|rettungsdienst",
    POL:"polizei|pol|donau", THW:"thw|technisches hilfswerk|heros" }[org];
  if(!alias) return name;
  const re = new RegExp("^(?:" + alias + "|" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")\\b[\\s.\\-]*", "i");
  return re.test(name) ? (p + " " + name.replace(re, "")).trim() : name;
}

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
      ${opts.html ? opts.html : `<p>${esc(opts.text)}</p>`}
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
/* Virtuelle „Einsatzleitung": kein echter Abschnitt, aber als Zuordnungsziel
   überall wählbar und in den Abschnittslisten sichtbar (feste ID "EL"). */
const AB_EL_ID = "EL";
const AB_EL = { id:AB_EL_ID, name:"Einsatzleitung", el:true };
/* Abschnitte für Auswahl-Listen: Einsatzleitung immer vorne, dann echte Abschnitte. */
function abschnitteWahl(){ return [AB_EL, ...state.abschnitte]; }
/* Ansprechpartner + optionale Telefonnummer des Abschnittsleiters als eine Zeile. */
function abAnsprech(a){
  const ap = (a.ansprechpartner || "").trim();
  const tel = (a.telefon || "").trim();
  return [ap, tel ? `☎ ${tel}` : ""].filter(Boolean).join(" · ");
}
function abNameOf(id, list){
  if(id === AB_EL_ID) return AB_EL.name;
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
// Länge einer Geo-Linie (nur Kartenmodus, echte lat/lng) in Metern – Haversine über alle Segmente
function geoLineM(llpoints){
  if(!Array.isArray(llpoints) || llpoints.length < 2) return 0;
  const R = 6378137, rad = d => d * Math.PI / 180;
  let m = 0;
  for(let i = 1; i < llpoints.length; i++){
    const a = llpoints[i - 1], b = llpoints[i];
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    m += 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  return m;
}
function laengeStr(m){
  if(!(m > 0)) return "";
  if(m >= 1000) return (m / 1000).toFixed(2).replace(".", ",") + " km";
  return Math.round(m) + " m";
}
/* ---- Wind & Gefahrenbereich (Keil) ---- */
// Beaufort aus km/h (untere Grenzen Bft 1..12)
function windBft(kmh){
  const g = [1,6,12,20,29,39,50,62,75,89,103,118];
  let b = 0; for(const x of g){ if(kmh >= x) b++; else break; } return b;
}
// 16-teilige Windrose, deg = Richtung, AUS der der Wind weht
function windHimmel(deg){
  const r = ["N","NNO","NO","ONO","O","OSO","SO","SSO","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return r[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
// Zielpunkt: geographischer Kurs (0=N, im Uhrzeigersinn), Distanz m (Flach-Näherung, Einsatzstellen-Maßstab)
function geoDestPoint(lat, lng, bearingDeg, distM){
  const br = bearingDeg * Math.PI / 180;
  return [ lat + (distM * Math.cos(br)) / 111320,
           lng + (distM * Math.sin(br)) / (111320 * Math.cos(lat * Math.PI / 180)) ];
}
// Geographischer Kurs von a nach b (0=N, im Uhrzeigersinn)
function geoBearing(a, b){
  const dLat = b.lat - a.lat;
  const dLng = (b.lng - a.lng) * Math.cos((a.lat + b.lat) / 2 * Math.PI / 180);
  return (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
}
// Polygon eines Gefahrenbereich-Keils: Apex + Bogen nach Lee
function lgSectorLatLngs(ll, bearingDeg, reachM, halfAngleDeg){
  const pts = [[ll[0], ll[1]]];
  const steps = 16;
  for(let k = 0; k <= steps; k++){
    const b = bearingDeg - halfAngleDeg + (2 * halfAngleDeg) * k / steps;
    pts.push(geoDestPoint(ll[0], ll[1], b, reachM));
  }
  return pts;
}
// Windpfeil (zeigt nach Norden/oben, wird per Rotation in die Zugrichtung gedreht)
const LG_WIND_ARROW_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L18.5 20 L12 15.5 L5.5 20 Z" fill="currentColor"/></svg>`;
// Kleines Keil-Symbol für die Legende
function lgSectorBadge(c){ return `<svg viewBox="0 0 26 20" style="width:26px;height:20px" aria-hidden="true"><path d="M3 10 L25 2 L25 18 Z" fill="${c}" fill-opacity="0.3" stroke="${c}" stroke-width="2" stroke-linejoin="round"/></svg>`; }
/* n gleichmäßig verteilte Punkte entlang eines Polylinien-Wegs (für das Höhenprofil) */
function lgSamplePolyline(llpoints, n){
  const segLen = []; let total = 0;
  for(let i = 1; i < llpoints.length; i++){ const L = geoLineM([llpoints[i-1], llpoints[i]]); segLen.push(L); total += L; }
  if(total === 0) return [llpoints[0], llpoints[llpoints.length-1]];
  const out = [];
  for(let k = 0; k < n; k++){
    const target = total * k / (n-1);
    let acc = 0, si = 0;
    while(si < segLen.length-1 && acc + segLen[si] < target){ acc += segLen[si]; si++; }
    const a = llpoints[si], b = llpoints[si+1] || llpoints[si];
    const f = segLen[si] > 0 ? (target - acc) / segLen[si] : 0;
    out.push({ lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f });
  }
  return out;
}
/* Höhenprofil einer Linie über Open-Meteo (kostenlos, ohne Key); liefert Start/Ende/Anstieg/Gefälle */
async function lgLineElevFetch(llpoints){
  if(navigator.onLine === false) return { err:"Gerät ist offline." };
  if(!Array.isArray(llpoints) || llpoints.length < 2) return { err:"Keine Linie mit Koordinaten." };
  const total = geoLineM(llpoints);
  const pts = lgSamplePolyline(llpoints, 100);
  const lat = pts.map(p => p.lat.toFixed(5)).join(",");
  const lng = pts.map(p => p.lng.toFixed(5)).join(",");
  try{
    const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    const d = await r.json();
    const el = d && d.elevation;
    if(!Array.isArray(el) || !el.length) return { err:"Keine Höhendaten erhalten." };
    let gain = 0, loss = 0;
    for(let i = 1; i < el.length; i++){ const dd = el[i] - el[i-1]; if(dd > 0) gain += dd; else loss += -dd; }
    const profile = el.map((e, i) => ({ lat:pts[i].lat, lng:pts[i].lng, d: total * i / (el.length - 1), elev:e }));
    return { start:el[0], end:el[el.length-1], min:Math.min(...el), max:Math.max(...el), gain, loss, dhEnd: el[el.length-1] - el[0], profile };
  }catch(e){ return { err: e.message || "Abfrage fehlgeschlagen." }; }
}
function lgElevStr(e){
  if(!e) return "–";
  const s = v => (v >= 0 ? "+" : "") + Math.round(v);
  return `Δ ${s(e.dhEnd)} m  ·  Start ${Math.round(e.start)} m → Ziel ${Math.round(e.end)} m  ·  Anstieg ${Math.round(e.gain)} m / Gefälle ${Math.round(e.loss)} m`;
}
/* ---- Wasserförderung über lange Wegstrecke (Faustformel) ---- */
// Standardwerte (Feuerwehr-Lernbar): 800 l/min, 0,2 bar je B-Schlauch (20 m), 1 bar = 10 m Höhe
const LG_FOERDER = { pOut:8, pIn:1.5, reibSchlauch:0.2, schlauchLen:20, hoehe:0.1, q:800 };
function lgFoerderParams(line){ return Object.assign({}, LG_FOERDER, (line && line.foerder) || {}); }
// Punkt (lat/lng/elev) an einer Weg-Distanz d im Höhenprofil
function lgProfileAt(profile, d){
  if(!profile.length) return null;
  if(d <= profile[0].d) return profile[0];
  const last = profile[profile.length - 1];
  if(d >= last.d) return last;
  for(let j = 1; j < profile.length; j++){
    if(profile[j].d >= d){
      const a = profile[j-1], b = profile[j], f = (d - a.d) / ((b.d - a.d) || 1);
      return { lat:a.lat+(b.lat-a.lat)*f, lng:a.lng+(b.lng-a.lng)*f, d, elev:a.elev+(b.elev-a.elev)*f };
    }
  }
  return last;
}
// Positionen der Verstärkerpumpen ab startD: Reibung + Höhe bis nutzbare Druckdifferenz erschöpft
function lgFoerderPumps(profile, params, startD){
  startD = startD || 0;
  const nutzbar = params.pOut - params.pIn;
  const reibPerM = params.reibSchlauch / params.schlauchLen;
  const pumps = [];
  let prev = lgProfileAt(profile, startD), acc = 0, guard = 0;
  for(let j = 0; j < profile.length; j++){
    const s = profile[j];
    if(s.d <= prev.d) continue;
    const seg = s.d - prev.d, dEl = s.elev - prev.elev;
    const dP = reibPerM * seg + params.hoehe * dEl;   // Reibung (+) + Höhe (bergauf +, bergab −)
    if(acc + dP >= nutzbar && dP > 0 && guard < 200){
      const frac = (nutzbar - acc) / dP;
      const pd = prev.d + seg * frac, at = lgProfileAt(profile, pd);
      pumps.push({ d:pd, lat:at.lat, lng:at.lng });
      acc = (1 - frac) * dP; guard++;
    }else{
      acc += dP;
    }
    prev = s;
  }
  return pumps;
}
// Restdruck (bar) am Ende einer Stufe: von fromD bis zum Streckenende
function lgFoerderRest(profile, params, fromD){
  const reibPerM = params.reibSchlauch / params.schlauchLen;
  const a = lgProfileAt(profile, fromD || 0), b = profile[profile.length - 1];
  return params.pOut - (reibPerM * (b.d - a.d) + params.hoehe * (b.elev - a.elev));
}
// Materialübersicht einer berechneten Wasserförderungs-Strecke
function lgFoerderUebersichtHtml(line){
  const p = lgFoerderParams(line);
  const len = geoLineM(line.llpoints);
  const schlaeuche = Math.ceil(len / p.schlauchLen);
  const reserve = Math.max(2, Math.ceil(schlaeuche * 0.1));
  const pumps = line.pumps || [];
  const verst = pumps.length, pumpen = verst + 1;
  const dh = line.elev ? line.elev.dhEnd : null;
  const lastD = pumps.length ? pumps[pumps.length - 1].d : 0;
  const rest = (line.elev && line.elev.profile) ? lgFoerderRest(line.elev.profile, p, lastD) : null;
  const trupps = Math.max(1, Math.ceil(len / 350));
  const fpZeile = `FP – Förderpumpe (Saugstelle) bei 0 m · ${line.fpAddr ? esc(line.fpAddr) : "Adresse wird ermittelt …"} · fördert mit ${p.pOut} bar`;
  const relay = pumps.length
    ? pumps.map((pu, i) => `P${i+1} bei ${laengeStr(pu.d)} · ${pu.addr ? esc(pu.addr) : "Adresse wird ermittelt …"} · Eingang ~${p.pIn} bar → auf ${p.pOut} bar`)
    : ["keine Verstärkerpumpe nötig"];
  const pumpList = [fpZeile].concat(relay).join("<br>");
  const restStr = rest != null ? `${rest.toFixed(1)} bar${rest < 3 ? " ⚠ knapp – Strecke/Förderstrom prüfen" : ""}` : "–";
  const rows = [
    ["Wegstrecke", esc(laengeStr(len) + (dh != null ? ` · Höhe Δ ${dh>=0?"+":""}${Math.round(dh)} m` : ""))],
    ["Förderstrom", esc(`${p.q} l/min`)],
    ["Pumpen gesamt", esc(`${pumpen}  (1 Förderpumpe + ${verst} Verstärkerpumpe${verst===1?"":"n"})`)],
    ["Pumpen-Standorte", pumpList],
    ["Restdruck am Verteiler", esc(restStr)],
    ["B-Schläuche", esc(`${schlaeuche} × ${p.schlauchLen} m  +  ${reserve} Reserve  =  ${schlaeuche+reserve}`)],
    ["Verteiler", "1 (an der Brandstelle)"],
    ["Sammelstück", "1 (A-B, an der Förderpumpe)"],
    ["Saugstelle", "1 Satz A-Saugschläuche + Saugkorb + Halte-/Ventilleine"],
    ["Schlauchbrücken", "je Straßenquerung 1 (nach Erkundung)"],
    ["Kupplungsschlüssel", esc(`mind. ${pumpen*2} (2 je Pumpe)`)],
    ["Personal (Faustwert)", esc(`${pumpen} Maschinist${pumpen===1?"":"en"} + ${trupps} Schlauchtrupp${trupps===1?"":"s"} zum Verlegen`)],
  ];
  if(line.elev && line.elev.loss > 30) rows.push(["Achtung Gefälle", "Druckbegrenzungsventil an der/den Pumpe(n) vorsehen"]);
  return `<table class="lg-ueber"><tbody>${rows.map(([k,v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join("")}</tbody></table>`;
}
// Straße + Hausnummer für Saugstelle + Pumpen (Nominatim, sequenziell wegen Rate-Limit)
function lgPumpAddresses(line, onEach){
  if(navigator.onLine === false) return;
  const targets = [];
  const src = line.llpoints && line.llpoints[0];
  if(src && !line.fpAddr) targets.push({ lat:src.lat, lng:src.lng, apply:v => line.fpAddr = v });
  (line.pumps || []).forEach(p => { if(!p.addr) targets.push({ lat:p.lat, lng:p.lng, apply:v => p.addr = v }); });
  let i = 0;
  const next = () => {
    if(i >= targets.length) return;
    const t = targets[i++];
    reverseGeocode(t.lat, t.lng, d => {
      const a = (d && d.address) || {};
      t.apply([a.road, a.house_number].filter(Boolean).join(" ")   // bevorzugt Straße + Hausnr.
        || a.hamlet || a.neighbourhood || a.suburb || a.village || a.town || a.city   // sonst Ortsteil/Ort
        || (d && d.display_name ? d.display_name.split(",").slice(0, 2).join(",").trim() : "")
        || "freies Gelände");
      if(onEach) onEach();
      setTimeout(next, 1200);
    });
  };
  next();
}
// Materialübersicht drucken (fürs Klemmbrett)
function lgPrintFoerder(line){
  const e = state.einsatz;
  $("#printArea").innerHTML = `
    <section class="p-doc">
      <div class="p-head">
        <div>
          <div class="p-sub">${esc(state.config.ugName)} · Wasserförderung über lange Wegstrecke</div>
          <h1>${esc(e.stichwort) || "Wasserförderung"}</h1>
          <div>${esc(e.ort)}${line.text ? " · " + esc(line.text) : ""}</div>
        </div>
        <div class="p-mark">ELWIS</div>
      </div>
      ${lgFoerderUebersichtHtml(line)}
      <p style="font-size:8pt;color:#666;margin-top:16px">Anhalt nach Faustformel – keine hydraulische Berechnung. Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS · ${esc(state.config.ugName)}</p>
    </section>`;
  window.print();
}
// Nächster Punkt auf dem Weg zu pt → Distanz d (m), planar cos-korrigiert
function lgProjectOnPolyline(llpoints, pt){
  const kx = 111320 * Math.cos(pt.lat * Math.PI / 180), ky = 110540;
  const P = { x:pt.lng*kx, y:pt.lat*ky };
  let best = { d:0, dist:Infinity }, cum = 0;
  for(let i = 1; i < llpoints.length; i++){
    const a = llpoints[i-1], b = llpoints[i];
    const Ax = a.lng*kx, Ay = a.lat*ky, vx = b.lng*kx - Ax, vy = b.lat*ky - Ay, len2 = vx*vx + vy*vy;
    let t = len2 ? ((P.x-Ax)*vx + (P.y-Ay)*vy) / len2 : 0; t = Math.max(0, Math.min(1, t));
    const dist = Math.hypot(P.x - (Ax+vx*t), P.y - (Ay+vy*t)), segLen = Math.sqrt(len2);
    if(dist < best.dist) best = { d: cum + segLen*t, dist };
    cum += segLen;
  }
  return best.d;
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
  // Nur iPhone/iPad ausblenden (WebKit kann kein Web-Diktat → Tastatur-🎤 nutzen).
  // Android und Desktop-Browser behalten das Mikro.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if(isIOS){ btn.style.display = "none"; return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    // Nicht-iOS ohne Web-Speech (z. B. Firefox): Symbol sichtbar lassen, Hinweis beim Antippen.
    btn.addEventListener("click", () => modalInfo("Dieser Browser unterstützt kein direktes Diktat. Am zuverlässigsten mit Chrome/Edge (über HTTPS bzw. localhost) – sonst die Mikrofon-Taste der Tastatur nutzen."));
    return;
  }
  let rec = null;
  btn.addEventListener("click", () => {
    if(rec){ rec.stop(); return; }
    rec = new SR();
    rec.lang = "de-DE"; rec.continuous = true; rec.interimResults = true;
    // Bestehenden Feldinhalt merken; bei jedem Ereignis das Feld live neu aufbauen:
    // erkannte (finale) + noch vorläufige Wörter direkt anzeigen, nicht erst beim Stoppen.
    const base = target.value ? target.value.replace(/\s+$/, "") : "";
    rec.onresult = ev => {
      const fin = [], vorlaeufig = [];
      for(let i = 0; i < ev.results.length; i++){
        const r = ev.results[i];
        (r.isFinal ? fin : vorlaeufig).push(r[0].transcript.trim());
      }
      const gesprochen = [...fin, ...vorlaeufig].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      target.value = base ? (gesprochen ? base + " " + gesprochen : base) : gesprochen;
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
      <div class="field">
        <label for="cfg-elw">Standard-Empfänger Funkgespräche (ELW)</label>
        <input id="cfg-elw" class="mono" value="${esc(c.elwFunk||"")}" placeholder="z. B. Kater Weiden 1/12/1" autocomplete="off">
        <p class="hint">Funkrufname des ELW – wird im Funktagebuch als Empfänger („An“) vorbelegt.</p>
      </div>
      <div class="field">
        <label for="cfg-w3w">what3words API-Key</label>
        <input id="cfg-w3w" class="mono" value="${esc(c.w3wKey||"")}" placeholder="kostenlos bei what3words registrieren" autocomplete="off">
        <p class="hint">Ermöglicht in den Einsatzstammdaten die Umwandlung von <em>3 Wörtern</em> in eine echte Adresse (nur online). Ohne Key bleibt die Funktion inaktiv.</p>
      </div>
      <div class="field"><label style="margin-bottom:10px">Komm-Skizze / Leitstelle</label>
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
    <div class="sheet-foot" style="flex-wrap:wrap">
      <button class="btn btn-primary btn-block" id="cfg-save" style="flex:1">Speichern</button>
      <div id="cfgVer" class="mono" style="width:100%;text-align:center;opacity:.55;font-size:.72rem;margin-top:8px"></div>
    </div>
  </div>`;
  zeigeAppVersion();
  const leseSettings = () => {
    state.config.ugName = $("#cfg-ug").value.trim();
    state.config.elwFunk = $("#cfg-elw").value.trim();
    state.config.w3wKey = $("#cfg-w3w").value.trim();
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
      bHost.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="cfg-backup-sel" style="flex:1;min-width:180px">
            ${liste.map(b => `<option value="${esc(b.datei)}">${fmtDatum(b.zeit)} ${fmtZeit(b.zeit)} Uhr · ${fmtGroesse(b.groesse)}</option>`).join("")}
          </select>
          <button class="btn btn-ghost" id="cfg-backup-restore" style="min-height:48px;flex:none">Wiederherstellen</button>
        </div>
        <p class="hint" style="margin:6px 4px">${liste.length} Sicherung${liste.length===1?"":"en"} · neueste zuerst. Vor dem Wiederherstellen kommt eine Rückfrage.</p>`;
      $("#cfg-backup-restore").addEventListener("click", async () => {
        const datei = $("#cfg-backup-sel").value;
        const b = liste.find(x => x.datei === datei);
        const wann = b ? `${fmtDatum(b.zeit)} ${fmtZeit(b.zeit)} Uhr` : datei;
        if(!(await modalConfirm(`Sicherung vom ${wann} wiederherstellen?\n\nDer aktuelle Einsatzstand wird überschrieben – alle verbundenen Geräte übernehmen diesen (älteren) Stand.`, "Wiederherstellen", "Abbrechen"))) return;
        try{
          const res = await fetch("./api/restore", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ datei }) });
          if(!res.ok) throw new Error("HTTP " + res.status);
          closeEditor();
          await syncTick();   // Serverstand sofort übernehmen
          render();
          modalInfo("Sicherung wiederhergestellt. Verbundene Tablets übernehmen den Stand automatisch.");
        }catch(e){ modalInfo("Wiederherstellen fehlgeschlagen: " + (e.message||e)); }
      });
    }).catch(() => { bHost.innerHTML = `<p class="hint" style="margin:6px 4px">Sicherungen nicht abrufbar.</p>`; });
  }
}

/* ---------------- Ansicht: Einsatz ---------------- */
function renderEinsatz(){
  const e = state.einsatz;
  const elN = state.einheiten.filter(u => u.abschnitt === AB_EL_ID).length;
  const elRow = `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">${esc(AB_EL.name)} <span class="badge-schaetz" style="vertical-align:middle">fest</span></div>
        <div class="a-s">${elN} Einheit${elN===1?"":"en"} · kein echter Abschnitt – für Kräfte direkt bei der Einsatzleitung</div>
      </div>
    </div>`;
  const abRows = state.abschnitte.map(a => {
    const n = state.einheiten.filter(u => u.abschnitt === a.id).length;
    const funk = [abAnsprech(a) ? `AP ${abAnsprech(a)}` : "",
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
      <div class="field span2"><label for="f-w3w">Einsatzort per what3words</label>
        <div class="w3w-row">
          <input id="f-w3w" placeholder="wort.wort.wort" autocomplete="off" spellcheck="false">
          <button type="button" class="btn btn-ghost" id="f-w3w-go">→ Einsatzort</button>
        </div>
        <p class="hint" style="margin:.4rem 0 0">3 Wörter in eine Adresse umwandeln und in den Einsatzort übernehmen (online; API-Key im Zahnrad).</p></div>
      <div class="field"><label for="f-beg">Alarmzeit</label>
        <input id="f-beg" data-ez="beginn" type="datetime-local" value="${esc(e.beginn)}"></div>
      <div class="field"><label for="f-ende">Einsatzende <span style="text-transform:none;font-weight:500">(wird beim Beenden gesetzt)</span></label>
        <input id="f-ende" data-ez="ende" type="datetime-local" value="${esc(e.ende||"")}"></div>
      <div class="field"><label for="f-el">Einsatzleiter</label>
        <input id="f-el" data-ez="leiter" value="${esc(e.leiter)}" placeholder="Name / Funktion"></div>
      <div class="field"><label for="f-lb">Nächste Lagebesprechung</label>
        <input id="f-lb" data-ez="lagebespr" type="time" class="mono" value="${esc(e.lagebespr||"")}"></div>
      <div class="field span2">
        <div class="field-head">
          <label for="f-br" style="margin:0">${e.bereitstellung ? "Bereitstellungsraum" : "Verfügungsraum"}</label>
          <button type="button" id="br-switch" class="wlan-switch" role="switch" aria-checked="${e.bereitstellung ? "true" : "false"}" title="Als Bereitstellungsraum kennzeichnen – legt automatisch einen Einsatzabschnitt an">
            <span>Bereitstellungsraum</span><span class="track"></span>
          </button>
        </div>
        <input id="f-br" data-ez="bereitstellungsraum" value="${esc(e.bereitstellungsraum||"")}" placeholder="z. B. Parkplatz Süd, Volksfestplatz">
        ${e.bereitstellung ? `<p class="hint" style="margin:.4rem 0 0">Einsatzabschnitt „Bereitstellungsraum“ ist angelegt. Schalter aus → Abschnitt wird wieder gelöscht.</p>` : ""}</div>
      <div class="field span2"><label for="f-bem">Bemerkungen</label>
        <textarea id="f-bem" data-ez="bemerkung" placeholder="Lage, Abschnitte, Besonderheiten …">${esc(e.bemerkung)}</textarea></div>
    </div>
    <button class="btn btn-ghost btn-block" id="btnOcr" style="margin-top:14px">📷&nbsp; Aus Alarm-Foto einlesen (Einsatzort &amp; Fahrzeuge)</button>
    <p class="hint" style="margin:.5rem 0 0">Foto/Screenshot/Fax der Alarmierung offline auslesen: Einsatzadresse und alarmierte Fahrzeuge werden vorgeschlagen und vor der Übernahme im Fenster geprüft.</p>
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
    ${elRow}
    ${abRows || `<p class="hint" style="margin:12px 0">Noch keine echten Abschnitte – Einheiten lassen sich bei der Erfassung einem Abschnitt oder direkt der Einsatzleitung zuordnen.</p>`}
    <button class="btn btn-ghost btn-block" id="abAdd" style="margin-top:12px">＋&nbsp; Abschnitt anlegen</button>
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
    <p class="hint">Die Datei enthält <strong>alles</strong>: den kompletten Einsatz (Kräfte, Abschnitte,
    Lagekarte inkl. Lagebilder, Funk, Besprechungen, Checklisten, Fotos, Atemschutz) sowie
    <strong>Archiv und Einstellungen/Kataloge</strong> – also ein vollständiges Backup zur Wiederherstellung.
    Beim Import wird der aktuelle Einsatz ersetzt; Archiv &amp; Einstellungen übernimmst du auf Nachfrage
    (für die reine Übergabe eines Einsatzes zwischen Geräten → „Nein“).</p>
  </div>
  <div class="card">
    <h2>Prototyp-Werkzeuge</h2>
    <button class="btn btn-ghost btn-block" id="btnDemo" style="margin-bottom:10px">Beispieldaten laden</button>
    <button class="btn btn-danger-ghost btn-block" id="btnReset">Aktuellen Einsatz verwerfen (ohne Archiv)</button>
  </div>`;
}
function wireEinsatz(){
  document.querySelectorAll("[data-ez]").forEach(inp => {
    const commit = () => {
      state.einsatz[inp.dataset.ez] = inp.value;
      if(inp.dataset.ez === "leiter") syncEinsatzleiterFk();
      markChange(); renderHeader();
    };
    inp.addEventListener("change", commit);   // beim Verlassen sofort
    // ... und schon beim Tippen (leicht verzögert), damit andere Geräte es zeitnah sehen
    let t = null;
    inp.addEventListener("input", () => { clearTimeout(t); t = setTimeout(commit, 700); });
  });
  const ilsMode = $("#f-ils-mode"), ilsGrp = $("#f-ils-grp");
  const saveIls = () => { state.einsatz.ilsGruppe = { mode: ilsMode.value, gruppe: ilsGrp.value.trim() }; markChange(); };
  if(ilsMode) ilsMode.addEventListener("change", saveIls);
  if(ilsGrp) ilsGrp.addEventListener("change", saveIls);
  const brSw = $("#br-switch"); if(brSw) brSw.addEventListener("click", toggleBereitstellung);
  const w3wGo = $("#f-w3w-go"); if(w3wGo) w3wGo.addEventListener("click", w3wAufloesen);
  const w3wIn = $("#f-w3w"); if(w3wIn) w3wIn.addEventListener("keydown", ev => { if(ev.key === "Enter"){ ev.preventDefault(); w3wAufloesen(); } });
  const ocr = $("#btnOcr"); if(ocr) ocr.addEventListener("click", openOcrAssistent);
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
  $("#btnDemo").addEventListener("click", loadDemo);
  $("#btnReset").addEventListener("click", () => {
    modalConfirm("Aktuellen Einsatz wirklich verwerfen? Alle erfassten Kräfte gehen verloren (Archiv bleibt).").then(ok => { if(!ok) return;
      const keepArchiv = state.archiv, keepCfg = state.config;
      state = defaultState(); state.archiv = keepArchiv; state.config = keepCfg;
      state.einsatz.beginn = nowLocalInput();
      einsatzErsetzenErzwingen();   // leeren Stand erzwungen an den Server (löscht auch dort alles)
      save(); render();
    });
  });
  $("#btnPrintNow").addEventListener("click", () =>
    openPrintDialog({ einsatz:state.einsatz, einheiten:state.einheiten, fuehrung:state.fuehrung,
      abschnitte:state.abschnitte, funk:state.funk, besprechungen:state.besprechungen,
      anforderungen:state.anforderungen, checks:state.checks,
      asTraeger:state.asTraeger, asTrupps:state.asTrupps,
      lage:state.lage, fotos:state.fotos, ende:null }));
  $("#btnEnde").addEventListener("click", endeEinsatz);
  document.querySelectorAll("[data-aakt]").forEach(b =>
    b.addEventListener("click", () => aktiviereArchiv(b.dataset.aakt)));
  document.querySelectorAll("[data-aprint]").forEach(b => b.addEventListener("click", () => {
    const a = state.archiv.find(x => x.id === b.dataset.aprint);
    if(a) openPrintDialog(a);
  }));
  document.querySelectorAll("[data-adel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diesen Archiveintrag wirklich löschen?").then(ok => { if(!ok) return;
      state.archiv = state.archiv.filter(x => x.id !== b.dataset.adel);
      markChange(); render();
    });
  }));
}
/* Schalter „Bereitstellungsraum": ein → Feld heißt „Bereitstellungsraum" und ein gleichnamiger
   Einsatzabschnitt wird automatisch angelegt (Marker br:true); aus → Feld heißt wieder
   „Verfügungsraum" und der automatische Abschnitt wird gelöscht. */
function toggleBereitstellung(){
  const e = state.einsatz;
  if(!e.bereitstellung){
    e.bereitstellung = true;
    if(!state.abschnitte.some(a => a.br)){
      state.abschnitte.push({ id:uid(), name:"Bereitstellungsraum", ansprechpartner:"",
        fuehrung:{ mode:"TMO", gruppe:"" }, arbeit:{ mode:"DMO", gruppe:"" }, br:true });
    }
    markChange(); render();
  }else{
    const ea = state.abschnitte.find(a => a.br);
    const zugeordnet = ea ? state.einheiten.filter(u => u.abschnitt === ea.id).length : 0;
    const weiter = () => {
      e.bereitstellung = false;
      if(ea){
        state.abschnitte = state.abschnitte.filter(a => !a.br);
        state.einheiten.forEach(u => { if(u.abschnitt === ea.id) u.abschnitt = ""; });
      }
      markChange(); render();
    };
    if(zugeordnet) modalConfirm(`Bereitstellungsraum ausschalten? Der Einsatzabschnitt „Bereitstellungsraum" wird gelöscht; ${zugeordnet} zugeordnete Einheit${zugeordnet===1?"":"en"} bleiben erhalten (ohne Abschnitt).`).then(ok => { if(ok) weiter(); });
    else weiter();
  }
}
/* Einsatzleiter-Feld ↔ Führungskraft koppeln: Eingetragener EL wird automatisch als
   Führungskraft „Einsatzleiter" geführt (Marker elAuto); beim Leeren wieder entfernt. */
function syncEinsatzleiterFk(){
  const val = (state.einsatz.leiter || "").trim();
  let fk = state.einsatz.leiterFkId ? state.fuehrung.find(f => f.id === state.einsatz.leiterFkId) : null;
  if(val){
    if(!fk){
      fk = { id:uid(), org:"FW", name:val, funktion:"Einsatzleiter", funkrufname:"", einheit:"", tatsaechlich:true, elAuto:true };
      state.fuehrung.push(fk);
      state.einsatz.leiterFkId = fk.id;
    }
    fk.name = val;
    if(!fk.funktion) fk.funktion = "Einsatzleiter";
  }else if(fk){
    if(fk.elAuto) state.fuehrung = state.fuehrung.filter(f => f.id !== fk.id);   // nur automatisch angelegte wieder entfernen
    state.einsatz.leiterFkId = "";
  }
}
/* Einsatz als Datei sichern / einlesen – Backup, Gerätewechsel, „Sync per USB-Stick“ */
function exportEinsatz(){
  const data = {
    elwis: 1, full: 1, exportiert: new Date().toISOString(), ugName: state.config.ugName,
    einsatz: state.einsatz, einheiten: state.einheiten, fuehrung: state.fuehrung,
    abschnitte: state.abschnitte, lage: state.lage, funk: state.funk,
    besprechungen: state.besprechungen, anforderungen: state.anforderungen,
    checks: state.checks, fotos: state.fotos,
    asTraeger: state.asTraeger, asTrupps: state.asTrupps,
    archiv: state.archiv, config: state.config,   // Komplett-Backup: auch Archiv + Einstellungen/Kataloge
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
      // Komplett-Backup: auf Wunsch auch Archiv + Einstellungen/Kataloge wiederherstellen
      // (beim reinen Übertragen eines Einsatzes „Nein“, damit lokale Einstellungen bleiben).
      if(d.config || Array.isArray(d.archiv)){
        const anz = Array.isArray(d.archiv) ? d.archiv.length : 0;
        if(await modalConfirm(`Auch Einstellungen (UG-Name, Präfixe, Kataloge, ELW-Funkrufname, w3w-Key) und Archiv (${anz} abgeschlossene${anz===1?"r Einsatz":" Einsätze"}) aus der Sicherung übernehmen?\n\nJa = Komplett-Wiederherstellung · Nein = nur diesen Einsatz übernehmen (lokale Einstellungen/Archiv bleiben).`, "Ja, alles", "Nein")){
          if(d.config){
            state.config = Object.assign(defaultConfig(), d.config);
            state.config.prefixes = Object.assign(defaultConfig().prefixes, d.config.prefixes || {});
            applyTheme();
          }
          if(Array.isArray(d.archiv)) state.archiv = d.archiv;
        }
      }
      state.einsatzId = uid(); state.einsatzStart = new Date().toISOString();
      einsatzErsetzenErzwingen();   // importierten Einsatz erzwungen zur Server-Wahrheit machen
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
      <div class="field"><label for="foto-notiz">Kommentar</label>
        <div class="dictate-wrap">
          <textarea id="foto-notiz" rows="3" placeholder="z. B. Giebelwand Ostseite, Riss sichtbar">${esc(f.notiz||"")}</textarea>
          <button type="button" class="dictate-btn" id="foto-mic" aria-label="Diktieren" title="Kommentar sprechen">🎤</button>
        </div>
        <p class="hint" style="margin:.4rem 0 0">Tippen oder auf 🎤 tippen und sprechen.</p></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="foto-del">Löschen</button>
      <button class="btn btn-primary" id="foto-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  attachDictation($("#foto-mic"), $("#foto-notiz"));
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
/* ---------------- Ansicht: Foto-Dokumentation (eigener Menüpunkt, 10-Zoll-tauglich) ---------------- */
function renderFotodoku(){
  const fotos = [...state.fotos].sort((a, b) => (b.zeit||"").localeCompare(a.zeit||""));
  const grid = fotos.length ? `<div class="foto-doku-grid">
    ${fotos.map(f => `<figure class="foto-doku-item" data-foto="${esc(f.id)}">
      <img src="${f.data}" alt="Einsatzfoto ${fmtZeit(f.zeit)}">
      <figcaption>
        <span class="foto-zeit mono">${fmtDatum(f.zeit)} · ${fmtZeit(f.zeit)} Uhr</span>
        <span class="foto-note ${f.notiz ? "" : "leer"}">${f.notiz ? esc(f.notiz) : "Kommentar hinzufügen …"}</span>
      </figcaption>
    </figure>`).join("")}
  </div>` : `<div class="empty"><p>Noch keine Fotos.<br>Schadenslage, Zwischenstände und Beweissicherung direkt am Einsatz festhalten – jeweils mit Zeitstempel und Kommentar.</p></div>`;
  return `
  <div class="card">
    <h2>Foto-Dokumentation${fotos.length ? ` <span class="mono" style="color:var(--ink3);font-weight:600">(${fotos.length})</span>` : ""}</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button class="btn btn-primary" id="fotoCam">📷&nbsp; Kamera öffnen</button>
      <button class="btn btn-ghost" id="fotoFileBtn">Dateien hinzufügen</button>
      <input type="file" id="fotoFile" accept="image/*" multiple style="display:none">
      <input type="file" id="fotoCamNative" accept="image/*" capture="environment" multiple style="display:none">
    </div>
    <p class="hint" style="margin-top:0">Kamera bleibt für mehrere Aufnahmen geöffnet. „Dateien hinzufügen" wählt Bilder vom Gerät (z. B. per Mail erhaltene Drohnen-Fotos) – Mehrfachauswahl möglich. Foto antippen für Kommentar (Tastatur <em>oder Sprache 🎤</em>) oder zum Löschen.</p>
    ${grid}
  </div>`;
}
function fotoSpeichern(file, onDone){
  resizeImage(file, 1600, data => {
    state.fotos.push({ id:uid(), zeit:new Date().toISOString(), data, notiz:"" });
    try{ markChange(); }catch(err){ state.fotos.pop(); modalInfo("Speicher voll – bitte alte Fotos löschen."); }
    if(onDone) onDone();
  });
}
// Live-Kamera für die Foto-Doku – bleibt offen, mehrere Aufnahmen nacheinander
async function fotoDokuKamera(){
  const mm = navigator.mediaDevices;
  if(!mm || !mm.getUserMedia || !window.isSecureContext){ $("#fotoCamNative").click(); return; }  // http-LAN → native Kamera
  let stream;
  try{ stream = await mm.getUserMedia({ video:{ facingMode:{ ideal:"environment" },
    width:{ ideal:1920 }, height:{ ideal:1080 } }, audio:false }); }
  catch(e){ $("#fotoFile").click(); return; }
  const host = document.createElement("div");
  host.className = "cam-overlay";
  host.innerHTML = `
    <video autoplay playsinline muted></video>
    <div class="cam-count" data-cam="count"></div>
    <div class="cam-bar">
      <button class="btn btn-ghost" data-cam="x">Fertig</button>
      <button class="btn btn-primary" data-cam="shot" disabled>Kamera startet …</button>
    </div>`;
  document.body.appendChild(host);
  const video = host.querySelector("video");
  const shotBtn = host.querySelector('[data-cam="shot"]');
  const countEl = host.querySelector('[data-cam="count"]');
  let n = 0;
  video.srcObject = stream;
  try{ await video.play(); }catch(e){}
  const bereit = () => { if(video.videoWidth > 0){ shotBtn.disabled = false; shotBtn.textContent = "📷 Auslösen"; } };
  video.addEventListener("loadedmetadata", bereit);
  video.addEventListener("playing", bereit);
  setTimeout(bereit, 800);
  const stop = () => { try{ stream.getTracks().forEach(t => t.stop()); }catch(e){} host.remove(); render(); };
  host.querySelector('[data-cam="x"]').addEventListener("click", stop);
  shotBtn.addEventListener("click", () => {
    if(!video.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    state.fotos.push({ id:uid(), zeit:new Date().toISOString(), data:c.toDataURL("image/jpeg", .72), notiz:"" });
    try{ markChange(); }catch(err){ state.fotos.pop(); modalInfo("Speicher voll – bitte alte Fotos löschen."); return; }
    n++; countEl.textContent = n + (n === 1 ? " Foto" : " Fotos") + " aufgenommen";
    shotBtn.classList.add("flash"); setTimeout(() => shotBtn.classList.remove("flash"), 160);
  });
}
function wireFotodoku(){
  $("#fotoCam").addEventListener("click", fotoDokuKamera);
  $("#fotoFileBtn").addEventListener("click", () => $("#fotoFile").click());
  const fotoImport = e => {
    const files = [...e.target.files]; e.target.value = "";
    let i = 0;
    const next = () => { if(i >= files.length){ render(); return; } fotoSpeichern(files[i++], next); };
    next();
  };
  $("#fotoFile").addEventListener("change", fotoImport);
  $("#fotoCamNative").addEventListener("change", fotoImport);
  document.querySelectorAll("[data-foto]").forEach(el =>
    el.addEventListener("click", () => openFotoSheet(el.dataset.foto)));
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
  einsatzErsetzenErzwingen();   // reaktivierter Einsatz wird erzwungen zur Server-Wahrheit
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
  einsatzErsetzenErzwingen();   // geleerten Stand erzwungen an den Server (Archiv bleibt lokal)
  state.einsatz = { stichwort:"", ort:"", objekt:"", beginn:nowLocalInput(), ende:"", leiter:"", bereitstellungsraum:"", bereitstellung:false, bemerkung:"", ilsGruppe:{mode:"TMO",gruppe:"2772"} };
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
  if(await modalConfirm("Einsatz archiviert. Bericht jetzt drucken?", "Drucken", "Später")) openPrintDialog(entry);
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
    { id:a1, name:"Abschnitt 1 – Brandbekämpfung",  ansprechpartner:"Florian Weiden 3/1",      telefon:"0961 12345", fuehrung:{mode:"TMO",gruppe:"2901"}, arbeit:{mode:"DMO",gruppe:"307_F"} },
    { id:a2, name:"Abschnitt 2 – Wasserversorgung", ansprechpartner:"Florian Rothenstadt 10/1", telefon:"", fuehrung:{mode:"TMO",gruppe:"2902"}, arbeit:{mode:"DMO",gruppe:"308_F"} },
  ];
  state.einheiten = [
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"40/1", f:0,u:1,m:8, agt:4, ankunft:t(42), abgerueckt:false, abschnitt:a1 },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"30/1", f:1,u:0,m:2, agt:0, ankunft:t(40), abgerueckt:false, abschnitt:"EL" },
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
    { id:uid(), type:"gefahr",  num:1, text:"Gasflaschen", x:60, y:24 },
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
      const abN = abNameOf(a.abschnitt);
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
  }else if(state.abschnitte.length || sorted.some(u => u.abschnitt === "BR" || u.abschnitt === AB_EL_ID)){
    // Legacy-„BR" nur, wenn kein echter Bereitstellungs-Abschnitt existiert (sonst doppelt)
    const legacyBR = (!state.abschnitte.some(a => a.br) && sorted.some(u => u.abschnitt === "BR"))
      ? [{ id:"BR", name:"Bereitstellungsraum" }] : [];
    // Einsatzleitung nur einblenden, wenn ihr Einheiten zugeordnet sind (leere Gruppen fallen ohnehin raus)
    const elGrp = sorted.some(u => u.abschnitt === AB_EL_ID) ? [AB_EL] : [];
    const groups = [...state.abschnitte, ...legacyBR, ...elGrp, { id:"", name:"Ohne Abschnitt" }];
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
    <div class="stat"><div class="k">Gesamtstärke</div><div class="v mono">${s.f+s.u+s.m+state.fuehrung.length}</div><div class="s mono">${s.f+state.fuehrung.length}/${s.u}/${s.m}</div></div>
    <div class="stat"><div class="k">AGT / CSA</div><div class="v mono">${s.agt} / ${s.csa}</div><div class="s">Atemschutz</div></div>
    <div class="stat"><div class="k">Einheiten</div><div class="v mono">${act.length}</div><div class="s">an E-Stelle</div></div>
  </div>
  ${seg}
  <button class="btn btn-primary btn-block" id="btnAdd" style="margin-bottom:16px">＋&nbsp; Kraft erfassen</button>
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
        ${f.funkrufname && f.funkrufname !== f.name ? `<span class="mono">· ${esc(f.funkrufname)}</span>` : ""}
        ${f.tatsaechlich === false ? `<span class="badge-schaetz">~ Schätzung</span>` : ""}
        ${f.einheit ? `<span>· ${esc(f.einheit)}</span>` : ""}
      </div>
    </div>
  </button>`;
}
function wireKraefte(){
  document.querySelectorAll("[data-ksub]").forEach(b =>
    b.addEventListener("click", () => { state.ksub = b.dataset.ksub; save(); render(); }));
  const add = $("#btnAdd");   if(add) add.addEventListener("click", () => openEditor(null));
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
  // Fahrzeugzeilen „… <Funkruf> <Ort> <Funkkennung>": FL = Florian (Löschfahrzeug), Kater = ELW
  // → Feuerwehr; Heros = THW. Danach Ort, danach Kennung. Andere Zeilen werden ignoriert.
  const RE = /\b(F[LI1]|Kater|Heros)\b\s+([A-Za-zÄÖÜäöüß.\-]+(?:\s+[A-Za-zÄÖÜäöüß.\-]+){0,2})\s+(\d{1,2}\/\d{1,2}(?:\/\d{1,3})?)/i;
  const out = [];
  (text || "").split(/\r?\n/).forEach(line => {
    const l = line.replace(/\s+/g, " ").trim();
    const m = l.match(RE);
    if(!m) return;
    const funk = /^kater/i.test(m[1]) ? "Kater" : /^heros/i.test(m[1]) ? "Heros" : "Florian";
    const org = funk === "Heros" ? "THW" : "FW";
    const ort = m[2].trim();
    out.push({ raw: l, ort, kennung: m[3], name: `${funk} ${ort}`.trim(), org });
  });
  return out;
}
/* Einsatzadresse aus dem Alarm-Foto lesen (steht im Screenshot/Fax über der Fahrzeug-Liste).
   Erst label-basiert (Straße:/Ort:/Einsatzort:), sonst heuristisch:
   - Ort  = PLZ + Ort (z. B. „92637 Weiden i.d.OPf.“)
   - Straße = ganze Zeile mit Straßen-Suffix (inkl. Zusatz wie „Obere …“), bevorzugt mit Hausnummer;
     „Abschnitt:“-Zeilen werden ausgeschlossen.
   Ergebnis ist ein Vorschlag – wird im Fenster geprüft, bevor es übernommen wird. */
function ocrAdresse(text){
  const lines = (text || "").split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const SUF = "(?:stra[ßs]{1,2}e|str\\.|weg|platz|gasse|allee|ring|damm|ufer|steig|markt)";
  const sufRe = new RegExp(SUF + "\\b", "i");
  let strasse = "", ort = "";
  for(const l of lines){
    let m;
    if(!strasse && (m = l.match(new RegExp("^(?:einsatz\\s*)?(?:" + SUF + "|adresse|einsatzort)\\s*[:.\\-]\\s*(.+)$", "i")))) strasse = m[1].trim();
    else if(!ort && (m = l.match(/^(?:plz\s*\/?\s*)?ort\s*[:.\-]\s*(.+)$/i))) ort = m[1].trim();
  }
  if(!ort) for(const l of lines){ const m = l.match(/\b(\d{5}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-]+(?:\s+[A-Za-zÄÖÜäöüß.\-]+){0,3})/); if(m){ ort = m[1].trim(); break; } }
  if(!strasse){
    const kand = lines.filter(l => !/^abschnitt\b/i.test(l) && sufRe.test(l));
    const hit = kand.find(l => /\d{1,4}\s*[a-z]?$/.test(l)) || kand[0] || "";
    strasse = hit.replace(/^abschnitt\s*[:.\-]\s*/i, "").trim();
  }
  // OCR-Müll entfernen: Pipes raus, führenden und nachlaufenden Nicht-Adress-Müll
  // (Ziffern/Striche vorn, Klammern/Quotes/Backslash hinten) abschneiden.
  strasse = strasse.replace(/\|/g, " ")
                   .replace(/^[^A-Za-zÄÖÜäöüß]+/, "")
                   .replace(/[^0-9A-Za-zÄÖÜäöüß.]+$/, "")
                   .replace(/\s+/g, " ").trim();
  return [strasse, ort].filter(Boolean).join(", ");
}
/* Alarmzeit aus dem Alarm-Foto lesen (steht ganz oben, z. B. „27.07.26 08:42  Alarmierung“).
   Erste/oberste Datum-Uhrzeit gewinnt (Alarmierung steht über dem Einsatzende).
   Rückgabe: { val: datetime-local-Wert, roh: Anzeige } oder null. */
function ocrDatum(text){
  const m = (text || "").match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\s+(\d{1,2}):(\d{2})\b/);
  if(!m) return null;
  let [, d, mo, y, h, mi] = m;
  if(y.length === 2) y = "20" + y;
  const p2 = n => String(n).padStart(2, "0");
  const val = `${y}-${p2(mo)}-${p2(d)}T${p2(h)}:${p2(mi)}`;
  if(isNaN(new Date(val))) return null;
  return { val, roh: `${p2(d)}.${p2(mo)}.${y} ${p2(h)}:${p2(mi)}` };
}
/* Einsatzstichwort aus dem Alarm-Foto lesen: steht über dem Label „Stichwort“
   (z. B. „B BMA“ oder „B 4 Brand Gewerbe“). Der Block darüber gehört zur Auslöser-/eMID-Sektion –
   diese Zeilen (eMID, D_150, Wachalarm, #-Codes, ELP) werden ausgeschlossen. Bevorzugt eine Zeile,
   die wie ein Feuerwehr-Stichwort beginnt (B/THL/H/…); sonst Kurzform aus einer Klammer „(B BMA)“. */
function ocrStichwort(text){
  const raw = (text || "").split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim());
  const idx = raw.findIndex(l => /^stichwort\b/i.test(l) && l.length <= 20);
  if(idx < 0) return "";
  const HARD = /^(alarmierung|ausl[öo0eéë]*s?er|einsatzplan|einsatzort|geforderte|beendet|meldebild|priorit|ort$)/i;
  const JUNK = l => !l || /^[#>|]/.test(l) || /^emid\b/i.test(l) || /^elp\b/i.test(l)
    || /\bD[_ ]?\d{2,}\b/i.test(l) || /wachalarm|wa[- ]?technik/i.test(l) || /^stichwort/i.test(l);
  const STW = /^(B|THL|TH|RD|R|ABC|H|IUK|SEG|Ö[Ll]|OEL|VU|VER|MANV|ELW|IN|SI)\b/;
  const block = [], clean = [];
  for(let i = idx - 1; i >= 0 && block.length < 8; i--){
    const l = raw[i];
    if(l === ""){ if(block.length) break; else continue; }
    if(HARD.test(l)) break;
    block.unshift(l);
    if(!JUNK(l)) clean.unshift(l);
  }
  let val = clean.find(l => STW.test(l));
  if(!val){ const par = (block.join(" ").match(/\(([^)]{2,40})\)/) || [])[1]; if(par && STW.test(par.trim())) val = par.trim(); }
  if(!val) val = clean[0] || "";
  return val.replace(/\|/g, "").replace(/^[#>\s]+/, "").replace(/\s+/g, " ").trim();
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
let ocrList = [];   // Fahrzeuge: { raw, kennung, kat, org }
// Erkannte Kopfdaten (im Fenster prüf-/editier-/entfernbar). „Touched“ = manuell geändert,
// „Erkannt“ = kam aus einem Scan. Über mehrere Fotos hinweg gewinnt der erste Treffer.
let ocrAddr = "", ocrAddrTouched = false, ocrAddrErkannt = false;
let ocrDateVal = "", ocrDateTouched = false, ocrDateErkannt = false;
let ocrStw = "", ocrStwTouched = false, ocrStwErkannt = false;
function ocrMergeAdresse(text){ const a = ocrAdresse(text);   if(a && !ocrAddrTouched && !ocrAddr){ ocrAddr = a;    ocrAddrErkannt = true; } }
function ocrMergeDatum(text){   const d = ocrDatum(text);     if(d && !ocrDateTouched && !ocrDateVal){ ocrDateVal = d.val; ocrDateErkannt = true; } }
function ocrMergeStichwort(text){ const s = ocrStichwort(text); if(s && !ocrStwTouched && !ocrStw){ ocrStw = s;    ocrStwErkannt = true; } }
function ocrMergeKopf(text){ ocrMergeDatum(text); ocrMergeStichwort(text); ocrMergeAdresse(text); }
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
      ocrMerge(kand); ocrMergeKopf(data.text); renderOcrSheet(); setProg("");
      const hinweis = ocrNixErkannt(); if(hinweis) modalInfo(hinweis);
    }catch(err){ setProg(""); modalInfo("Einlesen nicht möglich: " + (err.message || err)); }
  });
}
function openOcrAssistent(){
  ocrList = [];
  ocrAddr = ""; ocrAddrTouched = false; ocrAddrErkannt = false;
  ocrDateVal = ""; ocrDateTouched = false; ocrDateErkannt = false;
  ocrStw = ""; ocrStwTouched = false; ocrStwErkannt = false;
  renderOcrSheet();
}
// Prüft nach einem Scan, ob nichts erkannt/eingetragen wurde. Rückgabe: Hinweistext, sonst "".
// Mehrere Fotos sind erlaubt – der Hinweis kommt nur, solange gar nichts vorliegt.
function ocrNixErkannt(){
  if(ocrList.length || ocrAddr || ocrDateVal || ocrStw) return "";
  return "Nichts erkannt (weder Alarmzeit, Stichwort, Einsatzort noch Fahrzeug). Bitte ein neues, schärferes Foto aufnehmen oder „Datei / PDF wählen“ – du kannst mehrere Fotos nacheinander einlesen.";
}
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
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Aus Alarm-Foto einlesen">
    <div class="sheet-head"><h2>Aus Alarm-Foto einlesen</h2>
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
        <p class="hint">Läuft offline auf dem Gerät. <strong>Mehrere Fotos nacheinander</strong> möglich (z. B. Startseite + Fahrzeugliste); Erkanntes wird zusammengeführt, Doppelte fallen weg. Alarmzeit, Stichwort, Einsatzort und Fahrzeuge lassen sich per ✕ verwerfen; vor der Übernahme kommt eine Übersicht. <span id="ocr-progress"></span></p>
      </div>
      <div class="field"><label for="ocr-date">Alarmzeit (erkannt – bitte prüfen)</label>
        <div class="ocr-kopf">
          <input id="ocr-date" type="datetime-local" value="${esc(ocrDateVal)}">
          <button type="button" class="kat-x" data-ocr-clear="date" aria-label="Alarmzeit verwerfen"${ocrDateVal ? "" : " disabled"}>✕</button>
        </div></div>
      <div class="field"><label for="ocr-stw">Einsatzstichwort (erkannt – bitte prüfen)</label>
        <div class="ocr-kopf">
          <input id="ocr-stw" value="${esc(ocrStw)}" placeholder="z. B. B BMA / B 4 Brand Gewerbe">
          <button type="button" class="kat-x" data-ocr-clear="stw" aria-label="Stichwort verwerfen"${ocrStw ? "" : " disabled"}>✕</button>
        </div></div>
      <div class="field"><label for="ocr-addr">Einsatzort (erkannt – bitte prüfen)</label>
        <div class="ocr-kopf">
          <input id="ocr-addr" value="${esc(ocrAddr)}" placeholder="Straße Nr., PLZ Ort">
          <button type="button" class="kat-x" data-ocr-clear="addr" aria-label="Einsatzort verwerfen"${ocrAddr ? "" : " disabled"}>✕</button>
        </div></div>
      <div class="field"><label style="margin-bottom:8px">Erkannte Fahrzeuge (${ocrList.length})</label>
        <div class="kat-list" id="ocr-list">${rows || `<p class="hint" style="margin:6px 4px">Noch nichts eingelesen – Bild wählen.</p>`}</div>
      </div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary" id="ocr-add" style="flex:1"${(ocrList.length || ocrDateVal || (ocrStw||"").trim() || (ocrAddr||"").trim()) ? "" : " disabled"}>Übernehmen …</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-ocrdel]").forEach(b => b.addEventListener("click", () => {
    ocrList.splice(Number(b.dataset.ocrdel), 1); renderOcrSheet();
  }));
  const setAddBtn = () => { const add = $("#ocr-add"); if(add) add.disabled =
    !(ocrList.length || ($("#ocr-date") && $("#ocr-date").value) || ($("#ocr-stw") && $("#ocr-stw").value.trim()) || ($("#ocr-addr") && $("#ocr-addr").value.trim())); };
  const dInp = $("#ocr-date"); if(dInp) dInp.addEventListener("input", () => { ocrDateVal = dInp.value; ocrDateTouched = true; setAddBtn(); });
  const sInp = $("#ocr-stw");  if(sInp) sInp.addEventListener("input", () => { ocrStw = sInp.value; ocrStwTouched = true; setAddBtn(); });
  const aInp = $("#ocr-addr"); if(aInp) aInp.addEventListener("input", () => { ocrAddr = aInp.value; ocrAddrTouched = true; setAddBtn(); });
  document.querySelectorAll("[data-ocr-clear]").forEach(b => b.addEventListener("click", () => {
    const w = b.dataset.ocrClear;
    if(w === "date"){ ocrDateVal = ""; ocrDateTouched = true; }
    else if(w === "stw"){ ocrStw = ""; ocrStwTouched = true; }
    else if(w === "addr"){ ocrAddr = ""; ocrAddrTouched = true; }
    renderOcrSheet();
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
            ocrMerge(ocrKandidaten(data.text)); ocrMergeKopf(data.text); renderOcrSheet();
          }
        }else{
          setProg(`Datei ${i+1}/${files.length} … `);
          const { data } = await w.recognize(f);
          ocrMerge(ocrKandidaten(data.text)); ocrMergeKopf(data.text); renderOcrSheet();
        }
      }
      setProg("");
      const hinweis = ocrNixErkannt(); if(hinweis) modalInfo(hinweis);
    }catch(err){
      setProg("");
      modalInfo("Einlesen nicht möglich: " + (err.message || err));
    }
  };
  $("#ocr-cam").addEventListener("change", verarbeite);
  $("#ocr-file").addEventListener("change", verarbeite);
  $("#ocr-add").addEventListener("click", ocrUebernehmen);
}
// Übernahme aus dem Alarm-Foto: Auswahl zusammenstellen, Duplikate (bereits erfasste Kennungen)
// überspringen, Übersicht als Rückfrage zeigen und erst nach Bestätigung alles übernehmen.
function ocrUebernehmen(){
  const datum = ($("#ocr-date") ? $("#ocr-date").value : ocrDateVal).trim();
  const stw   = ($("#ocr-stw")  ? $("#ocr-stw").value  : ocrStw).trim();
  const ort   = ($("#ocr-addr") ? $("#ocr-addr").value : ocrAddr).trim();
  const norm = s => (s || "").replace(/\s/g, "").toLowerCase();
  const vorhanden = new Set(state.einheiten.filter(u => !u.abgerueckt).map(u => norm(u.kennung)).filter(Boolean));
  const neueEinheiten = [], neueFk = [], fahrzeugeDisp = [], fkDisp = [], dubletten = [];
  for(const c of ocrList){
    const k = c.kat, bes = defaultBesatzung(c.kennung);
    if(bes && bes.fuehrung){
      // Kennung < 10 → Führungskraft (Schätzung); Funkrufname bis zur Klärung im Namensfeld.
      const funkruf = [c.name, c.kennung].filter(Boolean).join(" ");
      neueFk.push({ id:uid(), org: c.org || "FW", name:funkruf, funktion:"", funkrufname:funkruf, einheit:"", tatsaechlich:false });
      fkDisp.push({ org: c.org || "FW", label: funkruf });
    }else{
      const org = k ? (k.org||"FW") : (c.org || "FW");
      const name = k ? k.name : (c.name || "Florian");
      const kennung = k ? k.kennung : (c.kennung || "");
      const label = [name, kennung].filter(Boolean).join(" ");
      if(kennung && vorhanden.has(norm(kennung))){ dubletten.push({ org, label }); continue; }   // schon erfasst → überspringen
      if(kennung) vorhanden.add(norm(kennung));
      const crew = bes ? { f:bes.f, u:bes.u, m:bes.m } : (k ? { f:k.f|0, u:k.u|0, m:k.m|0 } : { f:0, u:1, m:2 });
      neueEinheiten.push({ id:uid(), org, name, kennung, f:crew.f, u:crew.u, m:crew.m,
        agt: k ? (k.agt|0) : 0, csa: k ? (k.csa|0) : 0,
        ankunft:new Date().toISOString(), abgerueckt:false, abschnitt:"", tatsaechlich:false });
      fahrzeugeDisp.push({ org, label });
    }
  }
  const body = ocrUebersichtHtml({ datum, stw, ort, fahrzeugeDisp, fkDisp, dubletten });
  modal({ titel: "Diese Daten übernehmen?", html: body, ok: "Übernehmen", abbrechen: "Abbrechen" }).then(ok => {
    if(!ok) return;
    if(datum) state.einsatz.beginn = datum;
    if(stw)   state.einsatz.stichwort = stw;
    if(ort)   state.einsatz.ort = ort;
    neueEinheiten.forEach(u => state.einheiten.push(u));
    neueFk.forEach(f => state.fuehrung.push(f));
    markChange(); closeEditor(); render();
  });
}
// Übersicht (Rückfrage) vor der Übernahme – Absätze + Org-Farben.
function ocrUebersichtHtml({ datum, stw, ort, fahrzeugeDisp, fkDisp, dubletten }){
  const chip = o => `<span class="chip chip-${esc(o)}">${esc((ORGS[o]||ORGS.SON).short)}</span>`;
  const sektion = (ico, titel, inhalt, cls) => `
    <div class="ok-row ${cls || ""}">
      <span class="ok-ico">${ico}</span>
      <div class="ok-body"><div class="ok-tt">${titel}</div>${inhalt}</div>
    </div>`;
  const liste = arr => `<ul class="ok-ul">${arr.map(x => `<li>${chip(x.org)} <span>${esc(x.label)}</span></li>`).join("")}</ul>`;
  const teile = [];
  if(datum){ const dt = new Date(datum);
    const disp = isNaN(dt) ? datum : dt.toLocaleString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) + " Uhr";
    teile.push(sektion("🕑", "Alarmzeit", `<div class="ok-addr">${esc(disp)}</div>`, "ok-ort")); }
  if(stw) teile.push(sektion("🔺", "Einsatzstichwort", `<div class="ok-addr">${esc(stw)}</div>`));
  if(ort) teile.push(sektion("📍", "Einsatzort", `<div class="ok-addr">${esc(ort)}</div>`, "ok-ort"));
  if(fahrzeugeDisp.length) teile.push(sektion("🚒", `${fahrzeugeDisp.length} Fahrzeug${fahrzeugeDisp.length===1?"":"e"}`, liste(fahrzeugeDisp), "ok-fz"));
  if(fkDisp.length) teile.push(sektion("👤", `${fkDisp.length} Führungskraft${fkDisp.length===1?"":"/-kräfte"}`, liste(fkDisp), "ok-fk"));
  if(dubletten.length) teile.push(sektion("↩︎", `${dubletten.length} bereits erfasst – wird übersprungen`, liste(dubletten), "ok-dup"));
  if(!teile.length) return `<p>Nichts ausgewählt.</p>`;
  return `<div class="ok-list">${teile.join("")}</div>
    <p class="ok-hint">Fahrzeuge und Führungskräfte sind eine <strong>Schätzung</strong> – bitte je Einheit prüfen und über „Stärke bestätigt“ bestätigen.</p>`;
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
  if(lgCmpA){ try{ lgCmpA.remove(); }catch(e){} lgCmpA = null; }
  if(lgCmpB){ try{ lgCmpB.remove(); }catch(e){} lgCmpB = null; }
  if(document.fullscreenElement){ try{ document.exitFullscreen(); }catch(e){} }
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
    <div class="field"><label>Einsatzabschnitt</label>
      <div class="abpick">
        <button data-ab="" aria-pressed="${!u.abschnitt}">Kein Abschnitt</button>
        ${abschnitteWahl().map(a => `
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
    u.name = normFunkname(u.name, u.org);   // „Feuerwehr Schirmitz“ → „Florian Schirmitz“
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
      <div class="field"><label for="af-ab">Vorgesehener Einsatzabschnitt</label>
        <select id="af-ab">
          <option value="">– kein / offen –</option>
          ${abschnitteWahl().map(ab => `<option value="${esc(ab.id)}" ${a.abschnitt===ab.id?"selected":""}>${esc(ab.name)}</option>`).join("")}
        </select>
        <p class="hint">Schon beim Anfordern wählbar – beim Eintreffen noch änderbar.</p></div>
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
      modalConfirm(`„${a.was}" ist eingetroffen. Jetzt in die Kräfteerfassung wechseln und diese Einheit erfassen?`, "Zur Kräfteerfassung", "Später").then(ok => {
        if(ok){
          state.view = "kraefte"; state.ksub = "einheiten";   // aktiv in die Kräfteerfassung wechseln
          openEditor(null, { name: a.was, abschnitt: a.abschnitt || "" });
        }else render();
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
    editingAb = { ab: { id:uid(), name:"", ansprechpartner:"", telefon:"", fuehrung:{mode:"TMO",gruppe:""}, arbeit:{mode:"DMO",gruppe:""} }, isNew:true };
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
      <div class="field"><label for="ab-tel">Telefon Abschnittsleiter <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="ab-tel" class="mono" type="tel" value="${esc(a.telefon||"")}" placeholder="z. B. 0961 12345" autocomplete="off" inputmode="tel">
        <p class="hint">Direkte Erreichbarkeit des Abschnittsleiters – erscheint in der Übersicht und im Bericht.</p></div>
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
      if(a.br) state.einsatz.bereitstellung = false;   // Auto-Abschnitt manuell gelöscht → Schalter aus
      markChange(); closeEditor(); render();
    });
  });
  $("#ab-save").addEventListener("click", () => {
    a.name = $("#ab-name").value.trim();
    if(!a.name){ $("#ab-name").focus(); return; }
    a.ansprechpartner = $("#ab-ap").value.trim();
    a.telefon = $("#ab-tel").value.trim();
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
      <div class="field"><label for="fk-abschnitt">Einsatzabschnitt <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <select id="fk-abschnitt">
          <option value="">– keinem Abschnitt zugeordnet –</option>
          <option value="${esc(AB_EL.name)}" ${f.einheit===AB_EL.name?"selected":""}>${esc(AB_EL.name)}</option>
          ${state.abschnitte.map(a => `<option value="${esc(a.name)}" ${f.einheit===a.name?"selected":""}>${esc(a.name)}</option>`).join("")}
        </select>
        <p class="hint" style="margin:.4rem 0 0">Einsatzleitung oder vorhandenen Abschnitt wählen – oder unten frei eintragen.</p></div>
      <div class="field"><label for="fk-einheit">Einheit / Abschnitt <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="fk-einheit" value="${esc(f.einheit||"")}" placeholder="z. B. Abschnitt 1, ${esc(pfx("FW"))} Weiden 1/40/1" autocomplete="off"></div>
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
  const fkAb = $("#fk-abschnitt");
  if(fkAb) fkAb.addEventListener("change", () => {
    if(fkAb.value){ f.einheit = fkAb.value; const inp = $("#fk-einheit"); if(inp) inp.value = fkAb.value; }
  });
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
  ["Leitstelle", "ELW", state.config.elwFunk, state.config.ugName].forEach(add);
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
    editingFs = { fs: { id:uid(), zeit:new Date().toISOString(), von:"", an:state.config.elwFunk||"Kater Weiden 1/12/1",
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
            <input id="fs-von" value="${esc(f.von)}" list="fs-sugg" placeholder="z. B. Florian Weiden 1/40/1" autocomplete="off"></div>
          <button class="swapbtn" id="fs-swap" title="Sender und Empfänger tauschen" aria-label="Sender und Empfänger tauschen">⇄</button>
          <div><label for="fs-an">An (Empfänger)</label>
            <input id="fs-an" value="${esc(f.an)}" list="fs-sugg" placeholder="z. B. Kater Weiden 1/12/1" autocomplete="off"></div>
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
/* Checklisten-Vorlagen (Inhalte angelehnt an FwDV 100 / Einsatzleiterwiki). Ein Eintrag mit
   führendem "# " ist eine Abschnitts-Überschrift (nicht abhakbar), alles andere ein Prüfpunkt. */
const CHECK_VORLAGEN = [
  { name:"Einsatzleiter – Erstmaßnahmen (Führungsvorgang)", punkte:[
    "# Erkundung & Lage",
    "Eigene Sicherheit / Gefahren der Einsatzstelle prüfen (4A/1C/4E)",
    "Lage erkunden: Was ist passiert? Menschen in Gefahr? Ausdehnung?",
    "Besondere Gefahren ausschließen (Gefahrgut, Elektro, Absturz, Einsturz)",
    "# Melden & Nachfordern",
    "Erste Rückmeldung an Leitstelle (Lage – Maßnahmen – Nachforderung)",
    "Kräfte/Fachdienste nachfordern (Fahrzeuge, Führung, RD, THW)",
    "# Sicherheit",
    "Einsatzstelle absichern (Verkehr, Absperrgrenzen)",
    "Gefahrenbereich festlegen, Unbeteiligte fernhalten",
    "# Ordnung des Raumes",
    "Verfügungs-/Bereitstellungsraum festlegen",
    "Einsatzabschnitte bilden",
    "An- und Abfahrts-/Rettungswege freihalten",
    "# Kräfte führen",
    "Aufträge erteilen (Auftrag – Ort – Weg – Mittel – Ziel)",
    "Atemschutzüberwachung sicherstellen",
    "Abschnittsleiter / Führungsstruktur benennen",
    "# Kommunikation & Doku",
    "Rufgruppen / Komm-Skizze festlegen",
    "Lagekarte anlegen und fortführen",
    "Einsatztagebuch & Kräfteübersicht führen",
    "Presse / Behörden / Angehörige berücksichtigen",
    "# Fortlaufend",
    "Regelmäßige Lagekontrolle (Lage – Möglichkeiten – Entschluss – Befehl)",
    "Nächste Lagebesprechung ansetzen",
    "Ablösung, Verpflegung und Kräftereserve planen" ] },
  { name:"Brandeinsatz", punkte:[
    "# Erkundung",
    "Menschen in Gefahr? Lage und Ausdehnung erkunden",
    "Objekt/Nutzung und Gefahren (Gas, Elektro, Absturz, Rückzündung)",
    "Anfahrt/Aufstellung, Windrichtung beachten",
    "# Menschenrettung",
    "Menschenrettung einleiten (Trupps, Rettungsgeräte)",
    "Anzahl / Vermisste klären",
    "# Brandbekämpfung",
    "Innen-/Außenangriff festlegen",
    "Riegelstellung / Nachbarbereiche schützen",
    "Ausreichend Rohre & Trupps, Rückzugsweg sichern",
    "# Wasserversorgung",
    "Löschwasser sicherstellen (Hydrant / offenes Gewässer)",
    "Wasserförderung über lange Wegstrecke prüfen",
    "# Atemschutz",
    "Atemschutzüberwachung einrichten",
    "Rückzugssignal / Notfallmeldung festlegen, Sicherheitstrupp bereit",
    "# Kontrolle & Abschluss",
    "Kontrolle auf Brandausbreitung / Glutnester (Wärmebildkamera)",
    "Nachlösch-/Aufräumarbeiten, Objektübergabe",
    "BMA / Schlüsseldepot zurücksetzen, Betreiber informieren" ] },
  { name:"Technische Hilfe – Verkehrsunfall", punkte:[
    "# Absichern",
    "Einsatzstelle & Verkehr absichern, Eigensicherung (Warnkleidung)",
    "Auslaufende Betriebsstoffe / Brandgefahr beachten",
    "# Sofortmaßnahmen",
    "Brandschutz sicherstellen (Löschbereitschaft)",
    "Fahrzeug gegen Wegrollen/Kippen stabilisieren",
    "Zündung aus / Batterie abklemmen",
    "Nicht ausgelöste Airbags / Rückhaltesysteme beachten",
    "# Patient",
    "Zugang schaffen, Erstkontakt und Erstversorgung",
    "Rettungsdienst/Notarzt einbinden (medizinische Rettung)",
    "# Rettung",
    "Rettungsart festlegen (Crash- vs. schonende Rettung)",
    "Rettungsöffnung schaffen, patientengerecht befreien",
    "# Umwelt & Abschluss",
    "Betriebsstoffe binden/auffangen (Umweltschutz)",
    "Einsatzstelle an Polizei/Abschleppdienst übergeben" ] },
  { name:"Gefahrgut / ABC (GAMS-Regel)", punkte:[
    "# G – Gefahr erkennen",
    "Kennzeichnung erkennen (ADR/Gefahrzettel, GHS, UN-Nummer)",
    "Beförderungspapiere / Sicherheitsdatenblatt / ERICard sichern",
    "# A – Absperren",
    "Gefahren-/Absperrbereich festlegen (mind. 50 m, ggf. 100 m)",
    "Anfahrt/Aufstellung mit dem Wind (luvseitig, oberhalb)",
    "Unbeteiligte fernhalten / evakuieren",
    "# M – Menschenrettung",
    "Menschenrettung nur mit geeignetem Schutz (CSA/Atemschutz)",
    "Kontaminationsverschleppung vermeiden",
    "# S – Spezialkräfte",
    "Messtrupp zur Stofferkundung einsetzen",
    "Fachberater / Umweltzug / analytische Task Force anfordern",
    "TUIS / Giftnotruf zur Fachberatung kontaktieren",
    "# Weitere Maßnahmen",
    "Austritt eindämmen (Bindemittel, Abdichten)",
    "Dekon-Platz (Personen/Geräte) einrichten",
    "Behörden alarmieren (Wasser-/Umweltbehörde bei Gewässergefahr)",
    "# Abschluss",
    "Kontaminationsnachweis, Probenahme, Dokumentation" ] },
  { name:"MANV – Massenanfall von Verletzten", punkte:[
    "# Sofort (erste 15 Minuten)",
    "Sofort-/Lagemeldung absetzen, MANV-Stufe festlegen",
    "Gefahren prüfen (CBRN/Bedrohung?), Ereignis abgeschlossen?",
    "Massiv nachfordern (RD, Führung, Fachdienste)",
    "# Führung & Fachdienst",
    "OrgL und Leitenden Notarzt (LNA) anfordern/einbinden",
    "Einsatzabschnitte bilden (RD/FW getrennt)",
    "# Raumordnung",
    "Zu-/Abfahrten freihalten (ggf. Einbahnregelung)",
    "Patientenablage einrichten (ab ~10, mit Witterungsschutz)",
    "Behandlungsplatz aufbauen (ab ~30 Verletzten)",
    "Rettungsmittel-Halteplatz / Bereitstellungsraum",
    "Hubschrauberlandeplatz / ggf. Dekon-Platz",
    "# Sichtung & Behandlung",
    "Sichtung/Triage veranlassen (SK I–IV dokumentieren)",
    "Behandlung nach Sichtungskategorie sicherstellen",
    "# Transport & Kliniken",
    "Transportorganisation aufbauen, Kliniken früh informieren",
    "Leichtverletzte (SK III) gesammelt verteilen/betreuen",
    "# Registrierung & Betreuung",
    "Patienten registrieren (Verbleib / Zielklinik)",
    "Betreuung Unverletzter, PSNV alarmieren",
    "Ablösung und Verpflegung planen" ] },
];
function renderListen(){
  const cards = state.checks.map(c => {
    const punkte = c.punkte.filter(p => !p.head);   // Überschriften zählen nicht
    const done = punkte.filter(p => p.done).length;
    const total = punkte.length || 1;
    return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 style="margin:0;flex:1">${esc(c.name)} · <span class="mono">${done}/${punkte.length}</span></h2>
        <button class="btn btn-danger-ghost" data-checkdel="${esc(c.id)}" style="min-height:40px;padding:6px 12px;font-size:.8rem">✕</button>
      </div>
      <div class="check-progress"><i style="width:${Math.round(done/total*100)}%"></i></div>
      ${c.punkte.map((p,idx) => p.head
        ? `<div class="check-head">${esc(p.text)}</div>`
        : `<button class="check-item ${p.done ? "done" : ""}" data-check="${esc(c.id)}:${idx}">
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
        ${CHECK_VORLAGEN.map((v,idx) => `<option value="${idx}">${esc(v.name)} (${v.punkte.filter(t => !t.startsWith("# ")).length} Punkte)</option>`).join("")}
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
      punkte: v.punkte.map(t => t.startsWith("# ") ? { text:t.slice(2), head:true } : { text:t, done:false, zeit:"" }) });
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
let monAbPage = 0;                 // aktuelle Abschnitts-Seite
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
// Spalten nach Auflösung: große Fläche → 3 Abschnitte, sonst 2 (klein 1). Mehr als 3 passen nicht auf einen Screen.
function monAbColumns(){
  const hp = state.monHide.panels;
  const leftShown = (!hp.org || !hp.fk);   // linke Spalte (Stärke/FK) sichtbar → Kachelfläche schmaler
  const w = window.innerWidth || 1280;
  const gridW = (leftShown ? w * 0.78 : w) - 40;
  return gridW >= 1080 ? 3 : gridW >= 640 ? 2 : 1;
}
// Eine Reihe je Seite: so viele Kacheln wie Spalten (2 bzw. 3), Rest rotiert.
function monAbPages(){
  const n = monCardsData().length;
  const cols = monAbColumns();
  const pages = [];
  for(let i = 0; i < n; i += cols) pages.push({ start:i, count: Math.min(cols, n - i) });
  return pages.length ? pages : [{ start: 0, count: 0 }];
}
function renderMonitor(){
  const e = state.einsatz;
  const act = aktive(), s = summen(act);
  // Fortschritt: wie viele Einträge (alle Einheiten + Führungskräfte) sind tatsächlich abgefragt
  // (nicht mehr Schätzung)? Zählt Einträge, nicht Personenstärke – daher alle, inkl. abgerückt.
  const bestKraefte = state.einheiten.filter(u => u.tatsaechlich !== false).length + state.fuehrung.filter(f => f.tatsaechlich !== false).length;
  const gesKraefte = state.einheiten.length + state.fuehrung.length;
  const byOrg = Object.keys(ORGS).map(key => {
    const units = act.filter(u => u.org === key);
    const fks = state.fuehrung.filter(f => (f.org || "SON") === key);
    const sum = summen(units);
    sum.f += fks.length;   // Führungskräfte der Organisation in die erste Spalte (Führer)
    return { key, ...ORGS[key], units, fks, sum };
  }).filter(o => o.units.length || o.fks.length);
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
        <td class="name mono">${esc(fullName(u).replace(/\bFlorian\b/gi, "Fl."))}</td>
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
  const abCols = monAbColumns();
  const abPageList = monAbPages();
  const abPages = abPageList.length;
  const specials = monSpecialPages();
  const totalPages = abPages + specials.length;
  if(monAbPage >= totalPages) monAbPage = 0;
  const specialKey = monAbPage >= abPages ? specials[monAbPage - abPages] : null;
  const isLagePage = specialKey === "karte";
  const isSkizzePage = specialKey === "skizze";
  const isFunkPage = specialKey === "funkchecks";
  const isAsPage = specialKey === "as";
  const pg = (!specialKey && abPageList[monAbPage]) ? abPageList[monAbPage] : { start:0, count:0 };
  const visible = specialKey ? [] : cardsData.slice(pg.start, pg.start + pg.count);
  const abCards = visible.map(c => abCard(c.title, c.units, c.opts)).join("");
  const pagerLabel = isLagePage ? "Lagekarte" : isSkizzePage ? "Komm-Skizze"
    : isFunkPage ? "Funk & Checklisten" : isAsPage ? "Atemschutz-Trupps"
    : `${pg.start+1}–${pg.start+pg.count} von ${cardsData.length}`;
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
          <div class="ort">${esc(e.ort)}</div>
          ${e.leiter ? `<div class="mon-el">EL: ${esc(e.leiter)}</div>` : ""}
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
        <div class="kpic accent"><span class="k">Gesamtstärke</span><span class="v mono">${s.f+s.u+s.m+state.fuehrung.length}</span><span class="s mono">${s.f+state.fuehrung.length}/${s.u}/${s.m}</span></div>
        ${gesKraefte ? (() => { const pct = Math.round(bestKraefte/gesKraefte*100);
          const ampel = pct <= 40 ? "ist-rot" : pct <= 70 ? "ist-gelb" : "ist-gruen";
          return `<div class="kpic ${bestKraefte < gesKraefte ? "warn" : ""} ${ampel}"><span class="k">Ist-Stärke bestätigt</span><span class="v mono">${bestKraefte}/${gesKraefte}</span><span class="kpi-bar"><i style="width:${pct}%"></i></span></div>`; })() : ""}
        <div class="kpic"><span class="k">Führungskräfte</span><span class="v mono">${state.fuehrung.length}</span></div>
        <div class="kpic"><span class="k">AGT</span><span class="v mono">${s.agt}</span></div>
        <div class="kpic"><span class="k">CSA</span><span class="v mono">${s.csa}</span></div>
        <div class="kpi-break"></div>
        ${state.anforderungen.some(a => a.status !== "eingetroffen") ? `<div class="kpic warn"><span class="k">Anrollend</span><span class="v mono">${state.anforderungen.filter(a => a.status !== "eingetroffen").length}</span><span class="s">nachgefordert</span></div>` : ""}
        ${brUnits.length ? `<div class="kpic"><span class="k">Bereitstellung</span><span class="v mono">${brUnits.length}</span><span class="s">Einheiten</span></div>` : ""}
        <div class="kpic"><span class="k">Abgerückt</span><span class="v mono">${state.einheiten.length - act.length}</span><span class="s">Einheiten</span></div>
        ${e.lagebespr ? `<div class="kpic warn"><span class="k">Nächste Lagebespr.</span><span class="v mono">${esc(e.lagebespr)}</span><span class="s" id="monLbRel"></span></div>` : ""}
        ${(!e.bereitstellung && (e.bereitstellungsraum||"").trim()) ? `<div class="kpic vr"><span class="k">Verfügungsraum</span><span class="v vr-val">${esc(e.bereitstellungsraum.trim())}</span></div>` : ""}
      </div>
      ${isLagePage ? (() => {
        const nums = state.lage.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
        const gefahren = state.lage.items.filter(i => i.type === "gefahr").sort((a,b) => (a.num||0)-(b.num||0));
        const forms = state.lage.items.filter(i => i.type === "form");
        const lines = state.lage.items.filter(i => i.type === "line");
        const arrows = state.lage.items.filter(i => i.type === "arrow");
        const circles = state.lage.items.filter(i => i.type === "circle");
        const sectors = state.lage.items.filter(i => i.type === "sector");
        const cars = state.lage.items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
        const sc = i => lgColorCss(i.color);
        // Legende wie im Präsentationsmodus: Badge antippen → Symbol wackelt/blinkt auf der Karte
        const legText = (haupt, sub) => `<span class="lg-leg-text">${haupt}${sub ? `${haupt ? " " : ""}<span class="lg-leg-qm">${esc(sub)}</span>` : ""}</span>`;
        const markerItems = [
          ...nums.map(i => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(i.id)}" aria-label="Auf der Karte zeigen"><span class="lg-leg-num">${esc(i.num)}</span></button>${legText(esc(i.text||""))}</div>`),
          ...forms.map(f => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(f.id)}" aria-label="Auf der Karte zeigen"><span class="lg-mini-form ${f.shape||"rect"}" style="--sc:${sc(f)}"></span></button>${legText(esc(f.text||""))}</div>`),
          ...lines.map(l => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(l.id)}" aria-label="Auf der Karte zeigen"><span class="lg-mini-line" style="--sc:${sc(l)}"></span></button>${legText(esc(l.text||""), laengeStr(geoLineM(l.llpoints)) + (l.pumps && l.pumps.length ? " · " + (l.pumps.length+1) + " Pumpen" : ""))}</div>`),
          ...arrows.map(a => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(a.id)}" aria-label="Auf der Karte zeigen">${lgArrowBadge(sc(a))}</button>${legText(esc(a.text||""), laengeStr(geoLineM(a.llpoints)))}</div>`),
          ...circles.map(c => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(c.id)}" aria-label="Auf der Karte zeigen">${lgCircleBadge(sc(c))}</button>${legText(esc(c.text||""), c.radiusM > 0 ? "r " + laengeStr(c.radiusM) : "")}</div>`),
          ...sectors.map(s => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(s.id)}" aria-label="Auf der Karte zeigen">${lgSectorBadge(sc(s))}</button>${legText(esc(s.text||""), s.reachM > 0 ? laengeStr(s.reachM) + " · " + windHimmel(s.bearingDeg) : "")}</div>`),
        ].join("");
        const gefItems = gefahren.map(i => `<div class="lg-leg-item"><button class="lg-leg-badge" data-lgfind="${esc(i.id)}" aria-label="Auf der Karte zeigen"><span class="lg-leg-num tri">${esc(i.num)}</span></button>${legText(esc(i.text||""))}</div>`).join("");
        const carItems = cars.map(i => {
          const u = state.einheiten.find(x => x.id === i.unitId);
          const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
          return `<div class="lg-leg-car"><button class="lg-car lg-find" style="color:${color}" data-lgfind="${esc(i.id)}" aria-label="Fahrzeug ${esc(i.num||"")} auf der Karte zeigen">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></button><span class="lg-leg-carname">${u ? esc(fullName(u)) : "nicht zugeordnet"}</span></div>`;
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
          <div class="panel-head"><h3>Komm-Skizze</h3>
            <button class="ab-jump" id="monSkEdit" style="margin-left:10px">Öffnen</button></div>
          ${renderFunkskizze()}
        </div>
      </div>`
      : isFunkPage ? (() => {
        // Eigene Seite: Funksprüche + Checklisten nebeneinander – Checklisten mit einzelnen Punkten
        const checksListe = state.checks.map(c => {
          const pk = c.punkte.filter(p => !p.head);
          const done = pk.filter(p => p.done).length;
          const pct = pk.length ? Math.round(done/pk.length*100) : 0;
          const punkte = c.punkte.map(p => p.head
            ? `<div class="mon-chk-head2">${esc(p.text)}</div>`
            : `<div class="mon-chk-pt ${p.done ? "done" : ""}"><span class="mon-chk-box">${p.done ? "✓" : ""}</span><span class="mon-chk-txt">${esc(p.text)}</span></div>`).join("");
          return `<div class="mon-chk">
            <div class="mon-chk-head"><span class="mon-chk-name">${esc(c.name)}</span><span class="mono">${done}/${pk.length}</span></div>
            <div class="check-progress"><i style="width:${pct}%"></i></div>
            ${punkte}
          </div>`;
        }).join("");
        return `
      <div class="mon-grid" style="grid-template-columns:1fr 1fr">
        <div class="panel"><h3>Letzte Funksprüche</h3>${fsMonRows || `<p class="hint">Noch keine erfasst.</p>`}</div>
        <div class="panel"><h3>Checklisten</h3>${checksListe || `<p class="hint">Noch keine Checkliste.</p>`}</div>
      </div>`;
      })()
      : isAsPage ? (() => {
        // Eigene Seite: Atemschutz-Trupps in 3 Spalten (Bereitschaft / Einsatz / abgelegt)
        const spalten = [
          { key:"registriert", titel:"In Bereitschaft" },
          { key:"einsatz",      titel:"Im Einsatz" },
          { key:"zurueck",      titel:"Abgelegt" },
        ];
        const kachel = t => {
          const mit = (t.memberIds||[]).map(id => { const tr = state.asTraeger.find(x=>x.id===id)||{};
            return `${esc(tr.name||"?")}${t.tf===id?" (TF)":""}`; }).join("<br>");
          const rz = t.status==="einsatz" ? asRzTrupp(t) : null;
          return `<div class="as-mon-kachel st-${esc(t.status)}">
            ${asNrBadge(t)}
            <div class="as-mon-info"><div class="as-mon-mit">${mit || "—"}</div>
              ${t.abschnitt?`<div class="as-mon-sub">${esc(t.abschnitt)}</div>`:""}
              ${rz?`<div class="as-mon-sub">Rückzug ${rz.sofort?"sofort":rz.bar+" bar"}</div>`:""}
            </div></div>`;
        };
        const frei = asFreieTraeger().length;
        return `
      <div class="mon-grid" style="grid-template-columns:1fr">
        <div class="panel">
          <div class="as-mon-head">
            <h3 style="margin:0">Atemschutz-Trupps (${state.asTrupps.length})</h3>
            <div class="as-mon-reg"><span class="as-mon-reg-v mono">${frei}</span> registriert, noch keinem Trupp zugeteilt</div>
          </div>
          <div class="as-mon-cols">
            ${spalten.map(sp => { const trs = state.asTrupps.filter(t => t.status===sp.key);
              return `<div class="as-mon-col"><div class="as-mon-coltitel">${sp.titel} <span class="mono">(${trs.length})</span></div>
                ${trs.map(kachel).join("") || `<p class="hint" style="margin:4px 0">—</p>`}</div>`; }).join("")}
          </div></div>
      </div>`;
      })()
      : (() => {
        const hp = state.monHide.panels;
        const leftPanels = [
          !hp.org ? `<div class="panel"><h3>Stärke nach Organisation</h3>${orgRows}</div>` : "",
          !hp.fk ? `<div class="panel"><h3>Führungskräfte</h3>${fkRows || `<p class="hint">Noch keine erfasst.</p>`}</div>` : "",
        ].join("");
        return `
      <div class="mon-grid" ${leftPanels ? "" : `style="grid-template-columns:1fr"`}>
        ${leftPanels ? `<div class="mon-col">${leftPanels}</div>` : ""}
        <div class="panel">
          <div class="panel-head"><h3>Einsatzabschnitte</h3></div>
          <div class="ab-grid" id="monAbGrid" style="grid-template-columns:repeat(${abCols},minmax(0,1fr))">${abCards}</div>
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
  const elUnits = act.filter(u => u.abschnitt === AB_EL_ID);
  // Reihenfolge: 1) echte Abschnitte  2) Bereitstellungsraum  3) Einsatzleitung  4) Ohne Abschnitt (immer zuletzt)
  state.abschnitte.forEach(a => { if(!hid[a.id]) cards.push({
    key:a.id, title:a.name, units:act.filter(u => u.abschnitt === a.id),
    opts:{ fuehrung:a.fuehrung, arbeit:a.arbeit, ansprechpartner:abAnsprech(a) } }); });
  // Legacy-BR-Kachel nur, wenn kein echter Bereitstellungs-Abschnitt existiert (sonst doppelt)
  if(brUnits.length && !hid.BR && !state.abschnitte.some(a => a.br)) cards.push({ key:"BR", title:"Bereitstellungsraum", units:brUnits, opts:{ br:true, sub: state.einsatz.bereitstellungsraum } });
  if(elUnits.length && !hid[AB_EL_ID]) cards.push({ key:AB_EL_ID, title:AB_EL.name, units:elUnits, opts:{ none:true } });
  const rest = act.filter(u => u.abschnitt !== "BR" && u.abschnitt !== AB_EL_ID &&
    (!u.abschnitt || !state.abschnitte.some(a => a.id === u.abschnitt)));
  if(state.abschnitte.length){
    if(rest.length && !hid.rest) cards.push({ key:"rest", title:"Ohne Abschnitt", units:rest, opts:{ none:true } });
  }else{
    cards.push({ key:"all", title:"Alle Einheiten an der Einsatzstelle", units:rest, opts:{ none:true } });
  }
  return cards;
}
/* Sonderseiten des Monitors (Lagekarte, Komm-Skizze, Funk & Checklisten, Atemschutz)
   – als eigene durchschaltbare Seiten in der Rotation, über den Kacheln-Dialog abschaltbar */
function monSpecialPages(){
  const hp = state.monHide.panels;
  const s = [];
  if(!hp.karte) s.push("karte");
  if(!hp.skizze) s.push("skizze");
  if(!hp.funkchecks && (state.funk.length || state.checks.length)) s.push("funkchecks");
  if(!hp.as && state.asTrupps.length) s.push("as");
  return s;
}
function monAbPagesCount(){
  return monAbPages().length + monSpecialPages().length;
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
  const hatRest = state.abschnitte.length > 0 && act.some(u => u.abschnitt !== "BR" && u.abschnitt !== AB_EL_ID &&
    (!u.abschnitt || !state.abschnitte.some(a => a.id === u.abschnitt)));
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Monitor-Kacheln">
    <div class="sheet-head">
      <h2>Monitor-Kacheln</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Info-Kacheln (Kräfteseite)</label>
        ${row("Stärke nach Organisation", hp.org, "p:org")}
        ${row("Führungskräfte", hp.fk, "p:fk")}
      </div>
      <div class="field"><label>Rotierende Seiten</label>
        ${row("Lagekarte", hp.karte, "p:karte")}
        ${row("Komm-Skizze", hp.skizze, "p:skizze")}
        ${row("Funk & Checklisten", hp.funkchecks, "p:funkchecks")}
        ${row("Atemschutz-Trupps", hp.as, "p:as")}
      </div>
      <div class="field"><label>Einsatzabschnitte</label>
        ${state.abschnitte.map(a => row(a.name, ha[a.id], "a:" + a.id)).join("")}
        ${hatBR ? row("Bereitstellungsraum", ha.BR, "a:BR") : ""}
        ${row(AB_EL.name, ha[AB_EL_ID], "a:" + AB_EL_ID)}
        ${hatRest ? row("Ohne Abschnitt", ha.rest, "a:rest") : ""}
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
  // Legenden-Badge antippen → Symbol wackelt (Punkt) bzw. blinkt (Linie/Fläche) auf der Karte
  document.querySelectorAll(".mon-lg-panel [data-lgfind]").forEach(b => b.addEventListener("click", () => lgRevealWackel(b.dataset.lgfind, lgMonObj)));
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
// Pfeilspitze (zeigt nach rechts/Osten) – wird per CSS-Rotation ausgerichtet
const LG_ARROWHEAD_SVG = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3 L18 10 L3 17 Z" fill="currentColor"/></svg>`;
// Kleine Legenden-Symbole für Pfeil/Radius-Kreis (Farbe via CSS-Variable, z. B. var(--fw))
function lgArrowBadge(c){ return `<svg viewBox="0 0 30 12" style="width:28px;height:12px" aria-hidden="true"><line x1="2" y1="6" x2="20" y2="6" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M18 1.5 L29 6 L18 10.5 Z" fill="${c}"/></svg>`; }
function lgCircleBadge(c){ return `<svg viewBox="0 0 24 24" style="width:22px;height:22px" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="12" cy="12" r="1.7" fill="${c}"/></svg>`; }
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
  { t:"arrow",   n:"Pfeil",           preview:'<svg viewBox="0 0 40 30" style="width:38px;height:28px"><line x1="5" y1="15" x2="27" y2="15" stroke="var(--thw)" stroke-width="3" stroke-linecap="round"/><path d="M25 8 L37 15 L25 22 Z" fill="var(--thw)"/></svg>' },
  { t:"circle",  n:"Radius-Kreis",    preview:'<svg viewBox="0 0 40 30" style="width:34px;height:26px"><circle cx="20" cy="15" r="11" fill="none" stroke="var(--fw)" stroke-width="3"/><circle cx="20" cy="15" r="2" fill="var(--fw)"/></svg>' },
  { t:"sector",  n:"Gefahrenbereich", preview:'<svg viewBox="0 0 40 30" style="width:38px;height:28px"><path d="M6 15 L36 5 L36 25 Z" fill="var(--fw)" fill-opacity="0.3" stroke="var(--fw)" stroke-width="2.5" stroke-linejoin="round"/></svg>' },
  { t:"symsearch", n:"Taktische Zeichen", preview:'<svg viewBox="0 0 24 24" style="width:30px;height:30px;stroke:var(--ink2);fill:none;stroke-width:2;stroke-linecap:round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/></svg>' },
];
const LG_SHAPE_COLORS = ["fw","thw","brk","pol","orange","violett","tuerkis"];
const LG_COLOR_NAMES = { fw:"Rot", thw:"Blau", brk:"Gold", pol:"Grün", orange:"Orange", violett:"Violett", tuerkis:"Türkis" };

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
    const col = lgColorCss(i.color);
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
    return `<span class="lg-ealbl" data-ealbl="${esc(i.id)}" style="left:${cx}%;top:${cy}%;color:${lgColorCss(i.color)}">${esc(abKuerzel(i.abschnittId))}</span>`;
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
    const col = lgColorCss(i.color);
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
  // Pfeil + Radius-Kreis nur im Karten-Modus (Richtung/Radius sind nur georeferenziert sinnvoll)
  const tools = LG_TOOLS.filter(t => state.lage.mode === "karte" || (t.t !== "arrow" && t.t !== "circle" && t.t !== "sector")).map(t => `
    <button class="lg-tool" data-lgtool="${t.t}" aria-pressed="${lgTool===t.t || lgSubmenu===t.t}">
      ${t.preview}<span>${t.n}</span>
    </button>`).join("");
  const drawName = { area:"Fläche", line:"Linie", arrow:"Pfeil", circle:"Radius-Kreis" };
  let statusText = "", drawButtons = "";
  if(lgDraw){
    const need = lgDraw.type === "area" ? 3 : 2;
    statusText = `${drawName[lgDraw.type] || "Linie"}: Punkte antippen (${lgDraw.points.length} gesetzt${lgDraw.points.length < need ? `, mind. ${need}` : ""})`;
    // Pfeil/Kreis werden nach dem 2. Punkt automatisch fertig – kein „Fertig“-Knopf
    drawButtons = (lgDraw.type !== "arrow" && lgDraw.type !== "circle" && lgDraw.points.length >= need) ? `<button id="lgDrawDone" style="margin-right:14px">Fertig</button>` : "";
  }else if(lgTool && lgTool.startsWith("sym:")){
    const s = SYM_KATALOG.find(x => x.key === lgTool.slice(4));
    statusText = s ? `Auf die Karte tippen, um „${s.name}“ zu platzieren` : "";
  }else if(lgTool){
    const t = LG_TOOLS.find(x => x.t === lgTool);
    statusText = lgTool === "line" || lgTool === "area"
      ? `${t.n}: Punkte nacheinander auf die Karte tippen`
      : lgTool === "arrow"  ? "Pfeil: Start antippen, dann Ziel"
      : lgTool === "circle" ? "Radius-Kreis: Mittelpunkt antippen, dann einen Randpunkt"
      : lgTool === "sector" ? "Gefahrenbereich: auf Unfallstelle/Quelle tippen – Keil richtet sich nach Lee aus"
      : `Auf die Karte tippen, um „${t.n}“ zu platzieren`;
  }
  const nums = state.lage.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  const gefahren = state.lage.items.filter(i => i.type === "gefahr").sort((a,b) => (a.num||0)-(b.num||0));
  const forms = state.lage.items.filter(i => i.type === "form");
  const lines = state.lage.items.filter(i => i.type === "line");
  const cars = state.lage.items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
  const shpCol = i => lgColorCss(i.color);
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
  const lineItems = lines.map(l => legRow(`<span class="lg-mini-line" style="--sc:${shpCol(l)}"></span>`,
    { id:l.id, text:(l.text||"").trim(), sub: laengeStr(geoLineM(l.llpoints)) + (l.pumps && l.pumps.length ? " · " + (l.pumps.length+1) + " Pumpen" : "") }, "Linie beschriften …")).join("");
  const arrows  = state.lage.items.filter(i => i.type === "arrow");
  const circles = state.lage.items.filter(i => i.type === "circle");
  const arrowItems = arrows.map(a => legRow(lgArrowBadge(shpCol(a)),
    { id:a.id, text:(a.text||"").trim(), sub: laengeStr(geoLineM(a.llpoints)) }, "Pfeil beschriften …")).join("");
  const circleItems = circles.map(c => legRow(lgCircleBadge(shpCol(c)),
    { id:c.id, text:(c.text||"").trim(), sub: c.radiusM > 0 ? "r " + laengeStr(c.radiusM) : "" }, "Kreis beschriften …")).join("");
  const sectors = state.lage.items.filter(i => i.type === "sector");
  const sectorItems = sectors.map(s => legRow(lgSectorBadge(shpCol(s)),
    { id:s.id, text:(s.text||"").trim(), sub: s.reachM > 0 ? laengeStr(s.reachM) + " · " + windHimmel(s.bearingDeg) : "" }, "Gefahrenbereich beschriften …")).join("");
  const secMarker = `
        <div class="lg-leg-sec"><h3>Marker</h3>
          ${(eaItems || areaItems || nums.length || forms.length || lines.length || arrows.length || circles.length || sectors.length) ? eaItems + areaItems + numItems + formItems + lineItems + arrowItems + circleItems + sectorItems
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
      <label class="lgsnap-pick" title="Zum Vergleich markieren"><input type="checkbox" data-lgsnapsel="${esc(s.id)}" ${lgSnapSel.includes(s.id)?"checked":""}></label>
      <div class="a-main">
        <div class="a-t">Lagebild ${fmtZeit(s.zeit)} Uhr</div>
        <div class="a-s">${fmtDatum(s.zeit)} · ${s.items.length} Symbole</div>
      </div>
      <button class="btn btn-ghost" data-lgsnap="${esc(s.id)}">Ansehen</button>
      <button class="btn btn-danger-ghost" data-lgsnapdel="${esc(s.id)}" aria-label="Lagebild löschen">✕</button>
    </div>`).join("")}
    <button class="btn btn-ghost btn-block" id="lgSnapCompare" style="margin-top:8px"${lgSnapSel.length===2?"":" disabled"}>Zwei Lagebilder nebeneinander vergleichen${lgSnapSel.length?` (${lgSnapSel.length}/2 markiert)`:""}</button>
    <p class="hint">Ein Snapshot friert den aktuellen Kartenstand ein. Zwei Lagebilder ankreuzen und vergleichen – Änderungen wackeln. „Ansehen" öffnet ein Lagebild (mit Vollbild).</p>
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
/* ---------------- Ansicht: Komm-Skizze (Kommunikationsskizze) ---------------- */
function renderSkizzeView(){
  return `
  <div class="card">
    <h2>Komm-Skizze</h2>
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
function renderFunkskizze(src){
  src = src || state;                    // Standard: laufender Einsatz; für Archiv-Druck: Archiv-Eintrag
  const c = state.config;                // Konfiguration (ILS-Name, UG-Name) ist app-global
  const einsatz = src.einsatz || {};
  const abschnitte = src.abschnitte || [];
  const act = (src.einheiten || []).filter(u => !u.abgerueckt);
  const ilsG = (einsatz.ilsGruppe && einsatz.ilsGruppe.gruppe) ? einsatz.ilsGruppe : c.ilsGruppe;
  const elBox = `
    <div class="fkbox el">
      <strong>Einsatzleitung</strong>
      <small>${esc(c.ugName)}${einsatz.leiter ? " · EL: " + esc(einsatz.leiter) : ""}</small>
    </div>`;
  const ilsTeil = `
    <div class="fkbox ils"><strong>${esc(c.ilsName || "Leitstelle")}</strong><small>Leitstelle</small></div>
    <div class="fk-vline">${fkGrpHtml(ilsG) || `<span class="fk-grp">—</span>`}</div>`;
  const legende = `<div class="fk-legende">
    <span><i class="fk-dot mode-TMO"></i>TMO · Netzbetrieb</span>
    <span><i class="fk-dot mode-DMO"></i>DMO · Direktbetrieb</span>
    <span>⇄ Gateway · ⟳ Repeater</span></div>`;
  if(!abschnitte.length){
    return `<div class="fk-skizze">${ilsTeil}${elBox}</div>${legende}
      <p class="hint" style="text-align:center">Noch keine Einsatzabschnitte angelegt – die Skizze wächst automatisch mit (Tab „Einsatz“).</p>`;
  }
  const n = abschnitte.length;
  // Gemeinsame Führungsrufgruppe: haben alle Abschnitte dieselbe → einmal an der Sammellinie darstellen
  const fgS = abschnitte.map(a => gruppeStr(a.fuehrung));
  const commonFg = (n > 1 && fgS.every(s => s && s === fgS[0])) ? abschnitte[0].fuehrung : null;
  const branchEls = abschnitte.map(a => {
    const units = act.filter(u => u.abschnitt === a.id);
    const via = a.arbeit && a.arbeit.via;
    return `
    <div class="fk-branch">
      <div class="fk-vline">${commonFg ? "" : (fkGrpHtml(a.fuehrung) || `<span class="fk-grp">—</span>`)}</div>
      <div class="fkbox">
        <strong>${esc(a.name)}</strong>
        ${abAnsprech(a) ? `<small class="mono">${esc(abAnsprech(a))}</small>` : ""}
        <small>${units.length} Einheit${units.length===1?"":"en"}</small>
        <div class="fk-badges">
          ${gruppeStr(a.arbeit) ? `<span class="funk-badge mode-${(a.arbeit.mode)||"DMO"}"><small>Arbeit</small>${esc(gruppeStr(a.arbeit))}</span>` : `<span class="hint" style="margin:0">keine Arbeitsrufgruppe</span>`}
          ${fkVia(via)}
        </div>
      </div>
    </div>`;
  });
  // Abschnitte auf mehrere Reihen verteilen, wenn sie in der Breite nicht passen –
  // jede Reihe mittig, per Sammellinie verbunden (analog Führungs-/Kommunikationsskizze).
  // Gilt für Bildschirm-Ansicht und Druck (dieselbe Funktion).
  const MAX_PRO_REIHE = 4;
  const reihenAnzahl = Math.ceil(n / MAX_PRO_REIHE);
  const proReihe = Math.ceil(n / reihenAnzahl);
  const chunks = [];
  for(let i = 0; i < branchEls.length; i += proReihe) chunks.push(branchEls.slice(i, i + proReihe));
  // Sammellinie je Reihe: reicht von Boxmitte links bis Boxmitte rechts (also bis zu den
  // äußeren Abschnitten). Breite = Gesamtbreite minus eine Boxbreite (bei Lücken 14px je Spalt).
  const busBreite = c => `calc(100% - (100% - ${(c.length - 1) * 14}px) / ${c.length})`;
  const reihenHtml = chunks.map((c, idx) => {
    const abstand = idx > 0 ? "margin-top:24px" : "";
    const hline = c.length > 1
      ? `<div class="fk-hline" style="width:${busBreite(c)};${abstand}"></div>`
      : (idx > 0 ? `<div style="height:24px"></div>` : "");
    return `${hline}<div class="fk-hwrap">${c.join("")}</div>`;
  }).join("");
  // Durchgehende zentrale Stammlinie verbindet alle Reihen-Sammellinien (liegt hinter den
  // Boxen, sichtbar nur in den Lücken → Verbindung läuft zwischen zwei Abschnitten hindurch).
  const stamm = chunks.length > 1 ? `<div class="fk-trunk"></div>` : "";
  return `
  <div class="fk-skizze">
    ${stamm}
    ${ilsTeil}
    ${elBox}
    ${n > 1 ? `<div class="fk-vline" style="height:26px">${commonFg ? fkGrpHtml(commonFg) : ""}</div>` : ""}
    ${reihenHtml}
  </div>
  ${legende}`;
}
/* ==================== Lagekarte: Online-Karten-Modus (Leaflet) ==================== */
let lgMapObj = null, lgMapLayer = null, lgMonObj = null, lgSnapObj = null, lgCmpA = null, lgCmpB = null;
let lgSnapSel = [];   // markierte Lagebilder (max. 2) für den Vergleich
function lgMapTeardown(){
  if(lgMapObj){ try{ lgMapObj.remove(); }catch(e){} }
  if(lgMonObj){ try{ lgMonObj.remove(); }catch(e){} }
  lgMapObj = null; lgMapLayer = null; lgMonObj = null;
}
function lgAccentHex(name){
  if(typeof name === "string" && name[0] === "#") return name;   // freie Farbe (Hex) direkt
  const v = getComputedStyle(document.documentElement).getPropertyValue("--" + (LG_SHAPE_COLORS.includes(name)?name:"fw")).trim();
  return v || "#C4232B";
}
// Farbe einer Form als CSS-Wert: bekannter Key → var(--key), freie Farbe → Hex direkt
function lgColorCss(c){
  return LG_SHAPE_COLORS.includes(c) ? `var(--${c})` : (typeof c === "string" && c[0] === "#" ? c : "var(--fw)");
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
/* Kleiner Zieh-Griff (Ring) für Kreis/Pfeil – zum Verschieben/Ändern auf der Karte */
function lgDragHandleIcon(){
  return L.divIcon({ html:`<div class="lg-mk"><span class="lg-handle"></span></div>`, className:"lg-divicon", iconSize:[0,0] });
}
/* Maß-Angabe (Radius/Länge) einer Form live in der Legende nachziehen – ohne kompletten Re-Render */
function lgSetLegMeasure(id, text){
  document.querySelectorAll(`[data-lgedit="${id}"] .lg-leg-qm`).forEach(el => el.textContent = text);
}
/* Beschriftungstext einer Form live in der Legende nachziehen (Maß-Span bleibt erhalten) */
function lgSetLegLabel(id, text){
  document.querySelectorAll(`[data-lgedit="${id}"]`).forEach(btn => {
    const qm = btn.querySelector(".lg-leg-qm");
    btn.textContent = (text || "").trim();
    if(qm){ btn.append(" "); btn.append(qm); }
  });
}
/* Repräsentative Geo-Position eines Items (Marker/Kreis/Sektor: ll; Linie/Fläche/Pfeil: Mittel) */
function lgItemLatLng(i){
  if(Array.isArray(i.ll)) return i.ll;
  if(Array.isArray(i.llpoints) && i.llpoints.length){
    const n = i.llpoints.length;
    return [ i.llpoints.reduce((s,p) => s+p.lat, 0)/n, i.llpoints.reduce((s,p) => s+p.lng, 0)/n ];
  }
  return null;
}
/* Legenden-Klick: Karte zum Symbol schwenken (falls außerhalb) und es wackeln/blinken lassen */
function lgRevealWackel(id, map){
  const i = state.lage.items.find(x => x.id === id);
  const ll = i ? lgItemLatLng(i) : null;
  let panned = false;
  if(map && ll && !map.getBounds().contains(ll)){ map.panTo(ll); panned = true; }
  const doWackel = () => {
    const pt = document.querySelector(`.lg-item[data-id="${id}"], .lg-mk[data-id="${id}"]`);
    const el = pt || document.querySelector(`[data-shape="${id}"]`);
    if(!el) return;
    if(!map) el.scrollIntoView({ block:"center", inline:"center", behavior:"smooth" });   // Raster/Bild: ins Sichtfeld scrollen
    const cls = pt ? "wackel" : "flash";
    el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  };
  panned ? setTimeout(doWackel, 320) : doWackel();
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
/* Koordinaten → Adresse (OpenStreetMap/Nominatim Reverse, nur online) */
function reverseGeocode(lat, lng, cb){
  fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=" + lat + "&lon=" + lng,
    { headers:{ "Accept":"application/json" } })
    .then(r => r.ok ? r.json() : null)
    .then(d => cb(d && !d.error ? d : null))
    .catch(() => cb(null));
}
function nominatimAdresse(d){
  const a = (d && d.address) || {};
  const strasse = [a.road, a.house_number].filter(Boolean).join(" ");
  const ort = [a.postcode, a.city || a.town || a.village || a.suburb || a.municipality].filter(Boolean).join(" ");
  return [strasse, ort].filter(Boolean).join(", ") || (d && d.display_name) || "";
}
/* what3words: 3 Wörter → Koordinaten (w3w-API, Key nötig) → Adresse (Nominatim) → Einsatzort.
   Läuft nur online. Key wird im Zahnrad hinterlegt. */
async function w3wAufloesen(){
  const key = (state.config.w3wKey || "").trim();
  const roh = ($("#f-w3w") ? $("#f-w3w").value : "").trim();
  const w = roh.replace(/^\/+/, "").replace(/\s+/g, ".").toLowerCase();
  if(!/^[^.\s]+\.[^.\s]+\.[^.\s]+$/.test(w)){ modalInfo("Bitte drei Wörter eingeben – Format „wort.wort.wort“ (oder ///wort.wort.wort)."); return; }
  if(!key){ modalInfo("Kein what3words-API-Key hinterlegt. Bitte im Zahnrad (Einstellungen) eintragen – kostenlos bei what3words registrierbar."); return; }
  if(navigator.onLine === false){ modalInfo("what3words benötigt Internet – Gerät ist aktuell offline."); return; }
  const btn = $("#f-w3w-go");
  const reset = () => { if(btn){ btn.disabled = false; btn.textContent = "→ Einsatzort"; } };
  if(btn){ btn.disabled = true; btn.textContent = "…"; }
  try{
    const res = await fetch("https://api.what3words.com/v3/convert-to-coordinates?words=" + encodeURIComponent(w) + "&key=" + encodeURIComponent(key));
    const data = await res.json().catch(() => null);
    const c = data && data.coordinates;
    if(!c){ reset(); modalInfo("what3words: " + ((data && data.error && (data.error.message || data.error)) || "Adresse zu diesen Wörtern nicht gefunden.")); return; }
    reverseGeocode(c.lat, c.lng, rd => {
      const adr = nominatimAdresse(rd);
      if(!adr){ reset(); modalInfo(`Keine Adresse zu diesen Koordinaten gefunden (${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}).`); return; }
      state.einsatz.ort = adr; markChange(); render();
      modalInfo(`Einsatzort aus ///${w} gesetzt:\n${adr}`);
    });
  }catch(e){ reset(); modalInfo("what3words-Abfrage fehlgeschlagen: " + (e.message || e)); }
}
/* Symbole/Linien/Flächen in eine Ebene zeichnen; interactive=false → schreibgeschützt (Monitor) */
function lgAddItems(layer, interactive, items){
  items = items || state.lage.items;
  for(const i of items){
    if(i.type === "circle" && Array.isArray(i.ll) && i.radiusM > 0){
      const col = lgAccentHex(i.color);
      const shp = L.circle(i.ll, { radius:i.radiusM, color:col, weight:3, fillOpacity:0.12, interactive });
      if(interactive) shp.on("click", ev => { L.DomEvent.stop(ev); openLgShapeEdit(i.id); });
      shp.addTo(layer);
      const pe = shp.getElement && shp.getElement();
      if(pe){ pe.setAttribute("data-shape", i.id); pe.style.pointerEvents = "stroke"; }   // Füllung lässt Klicks durch → Symbole überlagerbar
      if(interactive){
        // Griff in der Mitte → Kreis verschieben
        const center = L.marker(i.ll, { draggable:true, icon:lgDragHandleIcon(), zIndexOffset:1000 });
        center.on("drag", () => shp.setLatLng(center.getLatLng()));
        center.on("dragend", () => { const p = center.getLatLng(); i.ll = [p.lat, p.lng]; markChange(); lgMapRenderLayers(); });
        center.addTo(layer);
        // Griff am Rand (östlich) → Radius ändern, mit Live-Maß
        const dLng = i.radiusM / (111320 * Math.cos(i.ll[0] * Math.PI / 180));
        const edge = L.marker([i.ll[0], i.ll[1] + dLng], { draggable:true, icon:lgDragHandleIcon(), zIndexOffset:1000 });
        const edgeR = () => geoLineM([{ lat:i.ll[0], lng:i.ll[1] }, { lat:edge.getLatLng().lat, lng:edge.getLatLng().lng }]);
        edge.bindTooltip("", { direction:"top", offset:[0,-8], className:"lg-measure" });
        edge.on("dragstart", () => edge.setTooltipContent("r " + laengeStr(edgeR())).openTooltip());
        edge.on("drag", () => { shp.setRadius(edgeR()); edge.setTooltipContent("r " + laengeStr(edgeR())); });
        edge.on("dragend", () => { i.radiusM = edgeR(); edge.closeTooltip(); markChange(); lgSetLegMeasure(i.id, "r " + laengeStr(i.radiusM)); lgMapRenderLayers(); });
        edge.addTo(layer);
      }
      continue;
    }
    if(i.type === "sector" && Array.isArray(i.ll) && i.reachM > 0){
      const col = lgAccentHex(i.color);
      const shp = L.polygon(lgSectorLatLngs(i.ll, i.bearingDeg, i.reachM, i.halfAngleDeg),
        { color:col, weight:2.5, fillOpacity:0.18, dashArray:"6 5", interactive });
      if(interactive) shp.on("click", ev => { L.DomEvent.stop(ev); openLgShapeEdit(i.id); });
      shp.addTo(layer);
      const pe = shp.getElement && shp.getElement();
      if(pe){ pe.setAttribute("data-shape", i.id); pe.style.pointerEvents = "stroke"; }
      if(interactive){
        // Apex-Griff → Gefahrenbereich verschieben
        const apex = L.marker(i.ll, { draggable:true, icon:lgDragHandleIcon(), zIndexOffset:1000 });
        apex.on("drag", () => { const p = apex.getLatLng(); shp.setLatLngs(lgSectorLatLngs([p.lat, p.lng], i.bearingDeg, i.reachM, i.halfAngleDeg)); });
        apex.on("dragend", () => { const p = apex.getLatLng(); i.ll = [p.lat, p.lng]; markChange(); lgMapRenderLayers(); });
        apex.addTo(layer);
        // Fern-Griff → Richtung + Reichweite, mit Live-Maß
        const far = L.marker(geoDestPoint(i.ll[0], i.ll[1], i.bearingDeg, i.reachM), { draggable:true, icon:lgDragHandleIcon(), zIndexOffset:1000 });
        const calc = () => { const f = far.getLatLng(), a = { lat:i.ll[0], lng:i.ll[1] }; return { br:geoBearing(a, { lat:f.lat, lng:f.lng }), r:geoLineM([a, { lat:f.lat, lng:f.lng }]) }; };
        far.bindTooltip("", { direction:"top", offset:[0,-8], className:"lg-measure" });
        far.on("dragstart", () => far.setTooltipContent(laengeStr(calc().r)).openTooltip());
        far.on("drag", () => { const c = calc(); shp.setLatLngs(lgSectorLatLngs(i.ll, c.br, c.r, i.halfAngleDeg)); far.setTooltipContent(laengeStr(c.r)); });
        far.on("dragend", () => { const c = calc(); i.bearingDeg = c.br; i.reachM = c.r; far.closeTooltip(); markChange(); lgSetLegMeasure(i.id, laengeStr(c.r)); lgMapRenderLayers(); });
        far.addTo(layer);
      }
      continue;
    }
    if((i.type === "line" || i.type === "area" || i.type === "arrow") && Array.isArray(i.llpoints)){
      const col = lgAccentHex(i.color);
      const ll = i.llpoints.map(p => [p.lat, p.lng]);
      const shp = i.type === "area"
        ? L.polygon(ll, { color:col, weight:3.5, fillOpacity:0.22, interactive })
        : L.polyline(ll, { color:col, weight:3.5, interactive });
      if(interactive) shp.on("click", ev => { L.DomEvent.stop(ev); openLgShapeEdit(i.id); });
      shp.addTo(layer);
      const pe = shp.getElement && shp.getElement();
      if(pe){ pe.setAttribute("data-shape", i.id); if(i.type === "area") pe.style.pointerEvents = "stroke"; }   // Fläche: Klicks durch die Füllung → Symbole überlagerbar
      if(i.type === "arrow" && i.llpoints.length >= 2){   // Pfeilspitze am Ziel, per CSS-Rotation ausgerichtet
        const a = i.llpoints[i.llpoints.length - 2], b = i.llpoints[i.llpoints.length - 1];
        const latMid = (a.lat + b.lat) / 2 * Math.PI / 180;   // Mercator-korrigierter Bildschirmwinkel (0° = Osten)
        const ang = Math.atan2(-(b.lat - a.lat) / Math.cos(latMid), b.lng - a.lng) * 180 / Math.PI;
        L.marker([b.lat, b.lng], { interactive:false, zIndexOffset:2000, icon: L.divIcon({ className:"lg-divicon", iconSize:[0,0],
          html:`<div class="lg-mk"><span class="lg-arrowhead" style="transform:rotate(${ang}deg);color:${col}">${LG_ARROWHEAD_SVG}</span></div>` }) }).addTo(layer);
      }
      if(i.type === "arrow" && interactive){   // Griffe an Start + Ziel → verschieben / neu ausrichten, mit Live-Länge
        const arrowLen = () => geoLineM(shp.getLatLngs().map(p => ({ lat:p.lat, lng:p.lng })));
        i.llpoints.forEach((pt, idx) => {
          const hm = L.marker([pt.lat, pt.lng], { draggable:true, icon:lgDragHandleIcon(), zIndexOffset:1000 });
          hm.bindTooltip("", { direction:"top", offset:[0,-8], className:"lg-measure" });
          hm.on("dragstart", () => hm.setTooltipContent(laengeStr(arrowLen())).openTooltip());
          hm.on("drag", () => { const lls = shp.getLatLngs(); lls[idx] = hm.getLatLng(); shp.setLatLngs(lls); hm.setTooltipContent(laengeStr(arrowLen())); });
          hm.on("dragend", () => { const p = hm.getLatLng(); i.llpoints[idx] = { lat:p.lat, lng:p.lng }; hm.closeTooltip(); markChange(); lgSetLegMeasure(i.id, laengeStr(geoLineM(i.llpoints))); lgMapRenderLayers(); });
          hm.addTo(layer);
        });
      }
      if(i.type === "line" && Array.isArray(i.pumps) && i.llpoints.length){   // Wasserförderung: Förderpumpe + Verstärkerpumpen
        const src = i.llpoints[0];   // Förderpumpe (FP) an der Saugstelle / offenes Gewässer
        L.marker([src.lat, src.lng], { interactive:false, zIndexOffset:1500,
          icon: L.divIcon({ className:"lg-divicon", iconSize:[0,0], html:`<div class="lg-mk"><span class="lg-pump fp">FP</span></div>` }) }).addTo(layer);
        i.pumps.forEach((p, idx) => {
          const pm = L.marker([p.lat, p.lng], { draggable:interactive, zIndexOffset:1500,
            icon: L.divIcon({ className:"lg-divicon", iconSize:[0,0], html:`<div class="lg-mk"><span class="lg-pump">P${idx+1}</span></div>` }) });
          if(interactive) pm.on("dragend", () => {   // verschieben → auf den Weg projizieren, Folgepumpen neu
            const q = pm.getLatLng(), nd = lgProjectOnPolyline(i.llpoints, { lat:q.lat, lng:q.lng });
            const at = (i.elev && i.elev.profile) ? lgProfileAt(i.elev.profile, nd) : { lat:q.lat, lng:q.lng };
            i.pumps[idx] = { d:nd, lat:at.lat, lng:at.lng, manual:true };
            if(i.elev && i.elev.profile) i.pumps = i.pumps.slice(0, idx+1).concat(lgFoerderPumps(i.elev.profile, lgFoerderParams(i), nd));
            markChange(); lgMapRenderLayers();
            lgPumpAddresses(i, () => markChange());   // verschobene/neue Pumpen: Adresse nachladen

          });
          pm.addTo(layer);
        });
      }
      if(i.type === "area" && i.abschnittId){
        const a = state.abschnitte.find(x => x.id === i.abschnittId);
        if(a){
          const pos = i.labelLL ? [i.labelLL.lat, i.labelLL.lng] : shp.getBounds().getCenter();
          const lm = L.marker(pos, { draggable:interactive, interactive,
            icon: lgDivIcon(`<span class="lg-ealbl" style="position:static;transform:none;color:${lgColorCss(i.color)}">${esc(abKuerzel(i.abschnittId))}</span>`) });
          if(interactive) lm.on("dragend", () => { const p = lm.getLatLng(); i.labelLL = { lat:p.lat, lng:p.lng }; markChange(); });
          lm.addTo(layer);
        }
      }
    }
  }
  for(const i of items){
    if(!i.ll || i.type === "circle" || i.type === "sector") continue;   // Kreis/Sektor nutzen i.ll als Mittel-/Apexpunkt, sind aber keine Marker
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
  lgWindBadge("lgMap", true);   // Wind-Fahne (antippbar)
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
  lgWindBadge("lgMonMap", false);   // Wind-Fahne (Monitor, nur Anzeige)
  lgMonObj.on("moveend zoomend", () => {   // Ausschnitt merken (übersteht die Rotation)
    if(!lgMonObj) return;
    const c = lgMonObj.getCenter();
    state.lage.mapView = { center:[c.lat, c.lng], zoom: lgMonObj.getZoom() };
    save();
  });
  setTimeout(() => { if(lgMonObj) lgMonObj.invalidateSize(); }, 60);
}
/* Wind-Fahne (Richtung + Stärke) auf eine Karte legen; interactive → antippbar zum Bearbeiten */
function lgWindBadge(mapElId, interactive){
  const el = document.getElementById(mapElId);
  if(!el) return;
  const old = el.querySelector(".lg-windbadge"); if(old) old.remove();
  const w = state.lage.wind;
  if(!w && !interactive) return;   // Monitor ohne Wind: nichts anzeigen
  const badge = document.createElement("div");
  badge.className = "lg-windbadge" + (interactive ? " clickable" : "");
  if(!w){
    badge.innerHTML = `<span class="lg-wind-add">＋ Wind</span>`;
  }else{
    const travel = (w.dir + 180) % 360;   // Pfeil zeigt in die Zugrichtung (nach Lee)
    badge.innerHTML =
      `<span class="lg-wind-arrow" style="transform:rotate(${travel}deg)">${LG_WIND_ARROW_SVG}</span>` +
      `<span class="lg-wind-txt"><b>aus ${windHimmel(w.dir)}</b><span>${w.kmh} km/h · ${windBft(w.kmh)} Bft</span></span>`;
  }
  ["mousedown","dblclick","click"].forEach(ev => badge.addEventListener(ev, e => e.stopPropagation()));
  if(interactive) badge.addEventListener("click", () => openLgWindEdit());
  el.appendChild(badge);
}
/* Winddaten vom Open-Meteo-Dienst (kostenlos, ohne Key) für den aktuellen Kartenausschnitt */
async function lgWindFetch(){
  if(navigator.onLine === false) return { err:"Gerät ist offline." };
  const c = lgMapObj ? lgMapObj.getCenter()
    : (state.lage.mapView ? { lat:state.lage.mapView.center[0], lng:state.lage.mapView.center[1] } : null);
  if(!c) return { err:"Kein Kartenausschnitt." };
  try{
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${(+c.lat).toFixed(4)}&longitude=${(+c.lng).toFixed(4)}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`);
    const d = await r.json();
    const cur = d && d.current;
    if(!cur || cur.wind_direction_10m == null) return { err:"Keine Winddaten erhalten." };
    return { dir:Math.round(cur.wind_direction_10m), kmh:Math.round(cur.wind_speed_10m) };
  }catch(e){ return { err:e.message || "Abfrage fehlgeschlagen." }; }
}
/* Wind bearbeiten: Richtung (8 Himmelsrichtungen) + Stärke, optional aus Open-Meteo */
function openLgWindEdit(){
  const w = state.lage.wind || { dir:270, kmh:10 };
  const dirs = [0,45,90,135,180,225,270,315];
  const opts = dirs.map(d => `<option value="${d}" ${w.dir===d?"selected":""}>${windHimmel(d)} (${d}°)</option>`).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Wind" style="max-height:60vh">
    <div class="sheet-head"><h2>Wind</h2><button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field"><label for="wind-dir">Windrichtung <span style="text-transform:none;font-weight:500">(woher der Wind weht)</span></label>
        <select id="wind-dir">${opts}</select></div>
      <div class="field"><label for="wind-kmh">Windstärke</label>
        <div style="display:flex;align-items:center;gap:10px">
          <input id="wind-kmh" type="number" min="0" max="200" value="${w.kmh}" style="max-width:120px"><span class="mono">km/h</span>
          <span id="wind-bft" class="lg-leg-qm"></span></div></div>
      <button class="btn btn-ghost btn-block" id="wind-fetch">Aus Open-Meteo holen (online)</button>
      <p class="hint">Der Gefahrenbereich-Keil richtet sich nach Lee (windabgewandt) aus. „Aus Open-Meteo" nutzt den aktuellen Kartenausschnitt.</p>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="wind-del">Wind entfernen</button>
      <button class="btn btn-primary" id="wind-save" style="flex:1">Fertig</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const dirSel = $("#wind-dir"), kmhInp = $("#wind-kmh"), bft = $("#wind-bft");
  const showBft = () => { bft.textContent = windHimmel(Number(dirSel.value)) + " · " + windBft(Number(kmhInp.value)||0) + " Bft"; };
  showBft();
  kmhInp.addEventListener("input", showBft);
  dirSel.addEventListener("change", showBft);
  $("#wind-fetch").addEventListener("click", async () => {
    const btn = $("#wind-fetch"); btn.disabled = true; btn.textContent = "…";
    const r = await lgWindFetch();
    btn.disabled = false; btn.textContent = "Aus Open-Meteo holen (online)";
    if(r.err){ modalInfo("Open-Meteo: " + r.err); return; }
    dirSel.value = String((Math.round(r.dir / 45) * 45) % 360);   // auf nächste 8er-Richtung runden
    kmhInp.value = r.kmh; showBft();
  });
  $("#wind-del").addEventListener("click", () => { state.lage.wind = null; markChange(); closeEditor(); render(); });
  $("#wind-save").addEventListener("click", () => {
    state.lage.wind = { dir:Number(dirSel.value), kmh:Math.max(0, Number(kmhInp.value)||0) };
    markChange(); closeEditor(); render();
  });
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
  const nm = { area:"Fläche", line:"Linie", arrow:"Pfeil", circle:"Radius-Kreis" }[lgDraw.type] || "Linie";
  // Live-Maß während des Zeichnens: Linie/Pfeil → Länge, Fläche → Flächeninhalt
  const mass = lgDraw.type === "area" ? flaecheStr(geoFlaecheM2(lgDraw.points))
    : lgDraw.type === "circle" ? "" : laengeStr(geoLineM(lgDraw.points));
  const hint = lgDraw.type === "circle" ? " · Randpunkt antippen" : lgDraw.points.length < need ? ` (mind. ${need})` : mass ? ` · ${mass}` : "";
  // „Fertig“ nur für Linie/Fläche – Pfeil & Kreis werden nach 2 Punkten automatisch fertig
  const showDone = lgDraw.type !== "arrow" && lgDraw.type !== "circle" && lgDraw.points.length >= need;
  bar.innerHTML = `<span>${nm}: ${lgDraw.points.length} Punkt${lgDraw.points.length===1?"":"e"}${hint}</span>
    ${showDone?`<button data-dr="ok">Fertig</button>`:""}
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
  if(lgTool === "line" || lgTool === "area" || lgTool === "arrow"){
    if(!lgDraw || !lgDraw.geo) lgDraw = { type:lgTool, geo:true, points:[] };
    lgDraw.points.push({ lat:latlng.lat, lng:latlng.lng });
    if(lgTool === "arrow" && lgDraw.points.length >= 2){   // Pfeil: Start→Ziel, nach 2 Punkten fertig
      const it = { id:uid(), type:"arrow", llpoints:lgDraw.points.slice(0, 2), color:"fw" };
      state.lage.items.push(it); const nid = it.id;
      lgDraw = null; lgTool = null; markChange(); render(); openLgShapeEdit(nid); return;
    }
    lgMapRenderLayers();
    return;
  }
  if(lgTool === "circle"){                                 // Mittelpunkt, dann Randpunkt → Radius
    if(!lgDraw || !lgDraw.geo) lgDraw = { type:"circle", geo:true, points:[] };
    lgDraw.points.push({ lat:latlng.lat, lng:latlng.lng });
    if(lgDraw.points.length >= 2){
      const c = lgDraw.points[0], edge = lgDraw.points[1];
      const it = { id:uid(), type:"circle", ll:[c.lat, c.lng], radiusM:geoLineM([c, edge]), color:"fw" };
      state.lage.items.push(it); const nid = it.id;
      lgDraw = null; lgTool = null; markChange(); render(); openLgShapeEdit(nid); return;
    }
    lgMapRenderLayers();
    return;
  }
  if(lgTool === "sector"){                                 // Gefahrenbereich: Apex setzen, Keil nach Lee
    const w = state.lage.wind;
    const bearing = w ? (w.dir + 180) % 360 : 90;          // Zugrichtung = windabgewandt, sonst Ost
    const it = { id:uid(), type:"sector", ll:[latlng.lat, latlng.lng], bearingDeg:bearing, reachM:200, halfAngleDeg:22.5, color:"fw" };
    state.lage.items.push(it); const nid = it.id;
    lgTool = null; markChange(); render(); openLgShapeEdit(nid); return;
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
  document.querySelectorAll("[data-lgsnapsel]").forEach(cb =>
    cb.addEventListener("change", () => {
      const id = cb.dataset.lgsnapsel;
      lgSnapSel = lgSnapSel.filter(x => x !== id);
      if(cb.checked) lgSnapSel.push(id);
      while(lgSnapSel.length > 2) lgSnapSel.shift();   // nur die letzten 2 behalten
      render();
    }));
  const cmpBtn = $("#lgSnapCompare");
  if(cmpBtn) cmpBtn.addEventListener("click", () => { if(lgSnapSel.length === 2) openLgCompare(lgSnapSel[0], lgSnapSel[1]); });
  document.querySelectorAll("[data-lgsnapdel]").forEach(b =>
    b.addEventListener("click", () => {
      modalConfirm("Dieses Lagebild wirklich löschen?").then(ok => { if(!ok) return;
        state.lage.snapshots = state.lage.snapshots.filter(s => s.id !== b.dataset.lgsnapdel);
        lgSnapSel = lgSnapSel.filter(x => x !== b.dataset.lgsnapdel);
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
  document.querySelectorAll("[data-lgfind]").forEach(b => b.addEventListener("click", () => lgRevealWackel(b.dataset.lgfind, lgMapObj)));
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
  <div class="sheet sheet-wide" id="lgSnapSheet" role="dialog" aria-modal="true" aria-label="Lagebild ${fmtZeit(s.zeit)} Uhr">
    <div class="sheet-head">
      <h2>Lagebild ${fmtZeit(s.zeit)} Uhr <span style="font-weight:500;color:var(--ink3);font-size:.85rem">· eingefroren, ${fmtDatum(s.zeit)}</span></h2>
      ${lgFullBtn()}
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      ${s.mode === "karte" ? `
      <div class="lg-wrap" style="overflow:hidden"><div id="lgSnapMap" style="width:100%;height:100%"></div></div>
      <p class="hint" style="margin:8px 2px 0">Karte frei zoom-/verschiebbar (nur online) – die eingefrorenen Lage-Symbole bleiben ortsfest.</p>` : `
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
  wireLgFull();
  if(s.mode === "karte" && typeof L !== "undefined"){
    const el = document.getElementById("lgSnapMap");
    if(el){
      if(lgSnapObj){ try{ lgSnapObj.remove(); }catch(e){} }
      const v = s.mapView || { center:[49.6767, 12.1625], zoom:15 };
      // Karte frei zoom-/verschiebbar (nur Ansicht) – die Lage-Symbole sind geografisch verankert
      // und bleiben ortsfest. Der Ausschnitt wird NICHT in den Snapshot zurückgeschrieben.
      lgSnapObj = L.map(el, { zoomControl:true }).setView(v.center, v.zoom);
      lgBaseLayer(s.mapLayer).addTo(lgSnapObj);
      lgAddItems(L.layerGroup().addTo(lgSnapObj), false, s.items);
      setTimeout(() => { if(lgSnapObj) lgSnapObj.invalidateSize(); }, 60);
    }
  }
}
/* Vollbild-Umschalter für Lagebild-/Vergleichs-Fenster (nutzt das Sheet-Element). */
function lgFullBtn(){ return `<button type="button" class="btn btn-ghost lg-fullbtn" data-lgfull="1" title="Vollbild">⛶</button>`; }
function wireLgFull(){
  document.querySelectorAll("[data-lgfull]").forEach(b => b.addEventListener("click", () => {
    const sheet = b.closest(".sheet");
    if(!sheet) return;
    if(document.fullscreenElement){ document.exitFullscreen().catch(()=>{}); }
    else if(sheet.requestFullscreen){ sheet.requestFullscreen().catch(()=>{}); }
  }));
}
/* Vergleichs-Signatur eines Lage-Items (Position + darstellungsrelevante Felder). */
function lgItemSig(i){
  const pos = Array.isArray(i.ll) ? i.ll.map(n => (+n).toFixed(6)).join(",")
    : Array.isArray(i.llpoints) ? i.llpoints.map(p => `${(+p.lat).toFixed(6)},${(+p.lng).toFixed(6)}`).join(";")
    : (i.x != null ? `${(+i.x).toFixed(2)},${(+i.y).toFixed(2)}` : "");
  return [i.type, i.sym||"", i.num||"", i.text||"", i.label||"", i.color||"", i.shape||"", i.kurz||"", i.org||"", i.unitId||"", pos].join("|");
}
/* IDs der Symbole, die sich zwischen zwei Lagebildern geändert haben (neu/entfernt/verschoben/geändert). */
function lgChangedIds(itemsA, itemsB){
  const A = new Map((itemsA||[]).map(i => [i.id, lgItemSig(i)]));
  const B = new Map((itemsB||[]).map(i => [i.id, lgItemSig(i)]));
  const changed = new Set();
  A.forEach((sig, id) => { if(!B.has(id) || B.get(id) !== sig) changed.add(id); });
  B.forEach((sig, id) => { if(!A.has(id) || A.get(id) !== sig) changed.add(id); });
  return changed;
}
/* Geänderte Symbole in einem Panel dauerhaft wackeln lassen (Marker + Formen). */
function lgApplyWackel(container, changed){
  if(!container || !changed || !changed.size) return;
  container.querySelectorAll("[data-id]").forEach(el => { if(changed.has(el.getAttribute("data-id"))) el.classList.add("wackel-dauer"); });
  container.querySelectorAll("[data-shape]").forEach(el => { if(changed.has(el.getAttribute("data-shape"))) el.classList.add("wackel-dauer"); });
}
/* Ein Lagebild als Panel (Karte oder Raster) für den Vergleich rendern. */
function lgSnapPanelHtml(s, side){
  if(s.mode === "karte") return `<div class="lg-wrap lg-cmp-map" style="overflow:hidden"><div id="lgCmpMap${side}" style="width:100%;height:100%"></div></div>`;
  return `<div class="lg-wrap lg-cmp-map" style="pointer-events:none;overflow:hidden">
    <div class="lg-canvas ${s.bg ? "hasbg" : ""}" id="lgCmpCanvas${side}" ${s.bg ? `style="background-image:url('${s.bg}')"` : ""}>
      ${lgShapesSvg(s.items, null)}
      ${s.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
    </div></div>`;
}
function lgSnapPanelSetup(s, side, changed, view){
  if(s.mode === "karte" && typeof L !== "undefined"){
    const el = document.getElementById("lgCmpMap" + side);
    if(!el) return;
    const v = view || s.mapView || { center:[49.6767, 12.1625], zoom:15 };   // gemeinsamer Start-Ausschnitt, falls übergeben
    const map = L.map(el, { zoomControl:true }).setView(v.center, v.zoom);
    lgBaseLayer(s.mapLayer).addTo(map);
    lgAddItems(L.layerGroup().addTo(map), false, s.items);
    if(side === "A") lgCmpA = map; else lgCmpB = map;
    setTimeout(() => { try{ map.invalidateSize(); }catch(e){} lgApplyWackel(el, changed); }, 80);
  }else{
    lgApplyWackel(document.getElementById("lgCmpCanvas" + side), changed);
  }
}
/* Zwei Lagebilder nebeneinander vergleichen; geänderte Symbole wackeln dauerhaft. */
function openLgCompare(idA, idB){
  const snaps = state.lage.snapshots || [];
  const a = snaps.find(x => x.id === idA), b = snaps.find(x => x.id === idB);
  if(!a || !b) return;
  const [s1, s2] = (a.zeit||"") <= (b.zeit||"") ? [a, b] : [b, a];   // älter links, neuer rechts
  const changed = lgChangedIds(s1.items, s2.items);
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet sheet-wide" id="lgCmpSheet" role="dialog" aria-modal="true" aria-label="Lagebilder vergleichen">
    <div class="sheet-head">
      <h2>Lagebilder vergleichen <span style="font-weight:500;color:var(--ink3);font-size:.85rem">· ${changed.size} Änderung${changed.size===1?"":"en"} wackeln</span></h2>
      ${lgFullBtn()}
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="lg-cmp">
        <div class="lg-cmp-col">
          <div class="lg-cmp-t">${fmtDatum(s1.zeit)} · ${fmtZeit(s1.zeit)} Uhr <span>(älter)</span></div>
          ${lgSnapPanelHtml(s1, "A")}
        </div>
        <div class="lg-cmp-col">
          <div class="lg-cmp-t">${fmtDatum(s2.zeit)} · ${fmtZeit(s2.zeit)} Uhr <span>(neuer)</span></div>
          ${lgSnapPanelHtml(s2, "B")}
        </div>
      </div>
      <p class="hint" style="margin:8px 2px 0">Geänderte, neue oder entfernte Symbole wackeln dauerhaft. Karten frei zoom-/verschiebbar (nur online). ⛶ für Vollbild.</p>
    </div>
    <div class="sheet-foot"><button class="btn btn-primary btn-block" data-close="1">Schließen</button></div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  wireLgFull();
  // Beide Karten mit demselben Ausschnitt/Zoom starten (neuerer Snapshot gibt den Rahmen vor) → direkt vergleichbar
  const cmpView = (s1.mode === "karte" && s2.mode === "karte") ? (s2.mapView || s1.mapView || null) : null;
  lgSnapPanelSetup(s1, "A", changed, cmpView);
  lgSnapPanelSetup(s2, "B", changed, cmpView);
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
  const names = LG_COLOR_NAMES;
  const shName = { area:"Fläche", arrow:"Pfeil", circle:"Radius-Kreis", sector:"Gefahrenbereich" }[it.type] || "Linie";
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${shName} bearbeiten" style="max-height:55vh">
    <div class="sheet-head">
      <h2>${shName} bearbeiten</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Farbe</label>
        <div class="swatches">
          ${LG_SHAPE_COLORS.map(c => `
            <button data-shcolor="${c}" style="--sc:var(--${c})" aria-pressed="${(it.color||"fw")===c}" aria-label="${names[c]}"></button>`).join("")}
          <label class="sw-custom${LG_SHAPE_COLORS.includes(it.color)?"":" active"}" title="Eigene Farbe">
            <input type="color" data-shcustom value="${lgAccentHex(it.color||"fw")}" aria-label="Eigene Farbe"></label>
        </div>
        <p class="hint">Voreingestellte Farben oder rechts eine eigene wählen. z. B. Blau = Wasser, Rot = Absperrung, Gold = Bereitstellung, Grün = Abschnitt.</p>
      </div>
      <div class="field"><label for="sh-text">Beschriftung <span style="text-transform:none;font-weight:500">(erscheint in der Legende)</span></label>
        <input id="sh-text" value="${esc(it.text||"")}" placeholder="z. B. Schlauchleitung B, Absperrung" autocomplete="off"></div>
      ${it.type === "area" && geoFlaecheM2(it.llpoints) > 0 ? `
      <div class="field"><label>Flächeninhalt</label>
        <div class="mono" style="font-size:1.1rem;font-weight:800">${flaecheStr(geoFlaecheM2(it.llpoints))}</div></div>` : ""}
      ${(it.type === "line" || it.type === "arrow") && geoLineM(it.llpoints) > 0 ? `
      <div class="field"><label>${it.type === "arrow" ? "Länge (Pfeil)" : "Länge"}</label>
        <div class="mono" style="font-size:1.1rem;font-weight:800">${laengeStr(geoLineM(it.llpoints))}</div></div>` : ""}
      ${it.type === "line" && Array.isArray(it.llpoints) ? `
      <div class="field"><label>Höhenprofil</label>
        <div id="sh-elev" class="mono" style="font-size:.92rem;font-weight:700;line-height:1.5">${it.elev ? lgElevStr(it.elev) : "– noch nicht ermittelt –"}</div>
        <button class="btn btn-ghost btn-block" id="sh-elev-btn" style="margin-top:8px">Höhe &amp; Profil ermitteln (online)</button></div>
      ${(() => { const p = lgFoerderParams(it); return `
      <div class="field"><label>Wasserförderung über lange Wegstrecke</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label class="lg-fparam">Ausgangsdruck <input id="f-pout" type="number" step="0.5" value="${p.pOut}"> bar</label>
          <label class="lg-fparam">Min. Eingangsdruck <input id="f-pin" type="number" step="0.5" value="${p.pIn}"> bar</label>
          <label class="lg-fparam">Reibung je B-Schlauch <input id="f-reib" type="number" step="0.05" value="${p.reibSchlauch}"> bar</label>
          <label class="lg-fparam">Förderstrom <input id="f-q" type="number" step="100" value="${p.q}"> l/min</label>
        </div>
        <div id="sh-pumps" class="mono" style="font-size:.9rem;font-weight:700;margin-top:8px">${Array.isArray(it.pumps) ? it.pumps.length + " Verstärkerpumpe" + (it.pumps.length===1?"":"n") : ""}</div>
        <button class="btn btn-primary btn-block" id="sh-pumps-btn" style="margin-top:8px"${it.elev && it.elev.profile ? "" : " disabled"}>Verstärkerpumpen berechnen</button>
        <div id="sh-uebersicht">${Array.isArray(it.pumps) && it.pumps.length ? lgFoerderUebersichtHtml(it) : ""}</div>
        <button class="btn btn-ghost btn-block" id="sh-print-btn" style="margin-top:8px${Array.isArray(it.pumps) && it.pumps.length ? "" : ";display:none"}">Übersicht drucken</button>
        <p class="hint">Erst „Höhe & Profil ermitteln", dann berechnen. Pumpen (P1, P2 …) lassen sich auf dem Weg verschieben – die Folgepumpen rücken automatisch nach. Anhalt nach Faustformel (${p.reibSchlauch} bar/B-Schlauch bei ${p.q} l/min, 1 bar = 10 m Höhe).</p>
      </div>`; })()}` : ""}
      ${it.type === "circle" && it.radiusM > 0 ? `
      <div class="field"><label>Radius · Durchmesser · Fläche</label>
        <div class="mono" style="font-size:1.1rem;font-weight:800">r ${laengeStr(it.radiusM)} · ⌀ ${laengeStr(it.radiusM*2)} · ${flaecheStr(Math.PI*it.radiusM*it.radiusM)}</div></div>` : ""}
      ${it.type === "sector" && it.reachM > 0 ? `
      <div class="field"><label>Reichweite · Zugrichtung</label>
        <div class="mono" style="font-size:1.1rem;font-weight:800">${laengeStr(it.reachM)} · nach ${windHimmel(it.bearingDeg)}</div></div>
      <div class="field"><label>Öffnungswinkel</label>
        <div class="seg" style="max-width:none">
          ${[["Schmal",15],["Normal",22.5],["Breit",35]].map(([n,a]) => `<button type="button" data-secang="${a}" class="${Math.abs((it.halfAngleDeg||22.5)-a)<0.1?"active":""}">${n} (${a*2}°)</button>`).join("")}
        </div></div>
      ${state.lage.wind ? `<button class="btn btn-ghost btn-block" id="sec-wind">↻ Nach aktuellem Wind ausrichten (aus ${windHimmel(state.lage.wind.dir)})</button>`
        : `<p class="hint">Kein Wind gesetzt – über die Wind-Fahne oben rechts auf der Karte setzen, dann ausrichten.</p>`}
      <p class="hint">Orientierungshilfe (Anhalt) – keine Ausbreitungsberechnung. Griffe: Apex verschieben, Fernpunkt = Richtung + Reichweite.</p>` : ""}
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
  const cur = () => state.lage.items.find(i => i.id === it.id) || it;   // frisch aus State (Sync-sicher)
  // Beschriftung live speichern (nicht erst bei „Fertig“) + sofort in die Legende ziehen
  const shTxt = $("#sh-text");
  if(shTxt) shTxt.addEventListener("input", () => { cur().text = shTxt.value; markChange(); lgSetLegLabel(it.id, shTxt.value); });
  document.querySelectorAll("[data-shcolor]").forEach(b => b.addEventListener("click", () => {
    const c = cur(); c.color = b.dataset.shcolor;
    document.querySelectorAll("[data-shcolor]").forEach(x =>
      x.setAttribute("aria-pressed", x.dataset.shcolor === c.color));
    markChange(); render();   // Fläche und EA-Label sofort in der neuen Farbe zeichnen
  }));
  const shCustom = $("[data-shcustom]");
  if(shCustom) shCustom.addEventListener("change", () => {   // eigene Farbe (Colorpicker)
    cur().color = shCustom.value;
    document.querySelectorAll("[data-shcolor]").forEach(x => x.setAttribute("aria-pressed", "false"));
    markChange(); render();
  });
  document.querySelectorAll("[data-secang]").forEach(b => b.addEventListener("click", () => {   // Öffnungswinkel
    cur().halfAngleDeg = Number(b.dataset.secang);
    document.querySelectorAll("[data-secang]").forEach(x => x.classList.toggle("active", x === b));
    markChange(); render();
  }));
  const secWind = $("#sec-wind");
  if(secWind) secWind.addEventListener("click", () => {   // Keil nach aktuellem Wind ausrichten
    if(state.lage.wind){ cur().bearingDeg = (state.lage.wind.dir + 180) % 360; markChange(); render(); }
  });
  const elevBtn = $("#sh-elev-btn");
  if(elevBtn) elevBtn.addEventListener("click", async () => {   // Höhenprofil über Open-Meteo
    elevBtn.disabled = true; elevBtn.textContent = "… wird ermittelt";
    const r = await lgLineElevFetch(cur().llpoints);
    elevBtn.disabled = false; elevBtn.textContent = "Höhe & Profil ermitteln (online)";
    if(r.err){ modalInfo("Höhe: " + r.err); return; }
    cur().elev = r; markChange();
    const disp = $("#sh-elev"); if(disp) disp.textContent = lgElevStr(r);
    const pb = $("#sh-pumps-btn"); if(pb) pb.disabled = false;
  });
  const pumpsBtn = $("#sh-pumps-btn");
  if(pumpsBtn) pumpsBtn.addEventListener("click", () => {   // Verstärkerpumpen berechnen
    const c = cur();
    if(!(c.elev && c.elev.profile)){ modalInfo("Bitte zuerst „Höhe & Profil ermitteln“ ausführen."); return; }
    c.foerder = {
      pOut: Number($("#f-pout").value) || LG_FOERDER.pOut,
      pIn:  Number($("#f-pin").value)  || LG_FOERDER.pIn,
      reibSchlauch: Number($("#f-reib").value) || LG_FOERDER.reibSchlauch,
      q:    Number($("#f-q").value)    || LG_FOERDER.q,
    };
    c.pumps = lgFoerderPumps(c.elev.profile, lgFoerderParams(c), 0);
    markChange();
    const disp = $("#sh-pumps"); if(disp) disp.textContent = c.pumps.length + " Verstärkerpumpe" + (c.pumps.length===1?"":"n");
    const refresh = () => { const u = $("#sh-uebersicht"); if(u) u.innerHTML = lgFoerderUebersichtHtml(c); markChange(); };
    refresh();
    const pbtn = $("#sh-print-btn"); if(pbtn) pbtn.style.display = "";
    lgMapRenderLayers();
    lgPumpAddresses(c, refresh);   // Straße/Hausnummer im Hintergrund nachladen
  });
  const printBtn = $("#sh-print-btn");
  if(printBtn) printBtn.addEventListener("click", () => lgPrintFoerder(cur()));
  const abSel = $("#sh-abschnitt");
  if(abSel) abSel.addEventListener("change", () => {
    cur().abschnittId = abSel.value || "";
    markChange(); render();   // Label sofort ein-/ausblenden (Farbe bleibt frei wählbar)
  });
  $("#sh-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#sh-save").addEventListener("click", () => {
    const t = $("#sh-text"); if(t) cur().text = t.value.trim();
    markChange(); closeEditor(); render();
  });
}
// Editor für frei einfügbare Formen (Kreis/Quadrat/Rechteck) mit Farbe und optionalem Text.
function openLgFormEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  const names = LG_COLOR_NAMES;
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
          <label class="sw-custom${LG_SHAPE_COLORS.includes(it.color)?"":" active"}" title="Eigene Farbe">
            <input type="color" data-shcustom value="${lgAccentHex(it.color||"fw")}" aria-label="Eigene Farbe"></label>
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
  const cur = () => state.lage.items.find(i => i.id === it.id) || it;   // frisch aus State (Sync-sicher)
  document.querySelectorAll("[data-formshape]").forEach(b => b.addEventListener("click", () => {
    const c = cur(); c.shape = b.dataset.formshape;
    document.querySelectorAll("[data-formshape]").forEach(x => x.classList.toggle("active", x.dataset.formshape === c.shape));
    c.text = txt.value.trim(); markChange(); render();
  }));
  document.querySelectorAll("[data-shcolor]").forEach(b => b.addEventListener("click", () => {
    const c = cur(); c.color = b.dataset.shcolor;
    document.querySelectorAll("[data-shcolor]").forEach(x => x.setAttribute("aria-pressed", x.dataset.shcolor === c.color));
    c.text = txt.value.trim(); markChange(); render();
  }));
  const formCustom = $("[data-shcustom]");
  if(formCustom) formCustom.addEventListener("change", () => {   // eigene Farbe (Colorpicker)
    const c = cur(); c.color = formCustom.value;
    document.querySelectorAll("[data-shcolor]").forEach(x => x.setAttribute("aria-pressed", "false"));
    c.text = txt.value.trim(); markChange(); render();
  });
  txt.addEventListener("keydown", e => { if(e.key === "Enter") $("#form-save").click(); });
  $("#form-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#form-save").addEventListener("click", () => { cur().text = txt.value.trim(); markChange(); closeEditor(); render(); });
}
function openLgEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  if(it.type === "form") return openLgFormEdit(id);   // Form hat eigenen Editor (Form/Farbe/Text)
  if(it.type === "line" || it.type === "area") return openLgShapeEdit(id);   // Linie/Fläche: Farbe + Beschriftung
  const isNum = it.type === "num", isCar = it.type === "car", isGef = it.type === "gefahr";
  const numbered = isNum || isGef;
  const numField = isGef
    ? `<div class="field" style="max-width:220px"><label>Gefahr-Nummer</label>
        <div class="ruf-preview mono">${esc(it.num)}<span class="hint" style="margin:0 0 0 10px">automatisch fortlaufend</span></div></div>`
    : `<div class="field" style="max-width:140px"><label for="lg-num">Nummer</label>
        <input id="lg-num" class="mono" type="number" min="1" max="99" value="${esc(it.num)}"></div>`;
  const fields = numbered ? `
      ${numField}
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
    // Item frisch aus dem State holen – ein Sync-Tick kann state.lage.items zwischenzeitlich
    // durch neue Objekte ersetzt haben (sonst ginge die Zuordnung beim 1. Speichern verloren).
    const cur = state.lage.items.find(i => i.id === it.id) || it;
    if(numbered){
      const numInp = $("#lg-num");   // nur Marker hat ein Nummernfeld; Gefahr-Nummer bleibt automatisch
      if(numInp) cur.num = Math.max(1, Math.min(99, parseInt(numInp.value, 10) || cur.num));
      cur.text = inp.value.trim();
    }else if(isCar){
      cur.unitId = $("#lg-unit").value;
    }else{
      cur.label = inp.value.trim();
    }
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Druck: Einsatzbericht ---------------- */
function printMapHtml(lage){
  if(lage.mode === "karte"){
    return `<p style="font-size:10pt">Lagekarte im Online-Luftbild-Modus – Kartenkacheln lassen sich offline nicht
      in den Ausdruck rastern. Für ein echtes Kartenbild in der Doku: am Gerät einen Screenshot der Karte machen
      und in der Lagekarte per Einfügen (Strg&nbsp;+&nbsp;V) als Bild-Hintergrund setzen – dann erscheint die Karte
      hier als Bild. Die taktische Legende steht unten.</p>`;
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
    <section class="p-land">
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
      <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Lagekarte · ${esc(state.config.ugName)}</p>
    </section>`;
  window.print();
}
function doPrint(data, sel){
  const on = id => !sel || sel[id] !== false;   // ohne Auswahl: alle Bereiche drucken
  const e = data.einsatz;
  const pEnde = e.ende || data.ende;   // Einsatzende: Stammdatenfeld, sonst Archiv-Zeitstempel
  const abs = data.abschnitte || [];
  const showAb = abs.length > 0 || (data.einheiten||[]).some(u => u.abschnitt === AB_EL_ID);
  const s = summen(data.einheiten.filter(u => !u.abgerueckt));
  const sAll = summen(data.einheiten);
  const fkN = (data.fuehrung||[]).length;
  // Gesamtzahl der Kräfte (Personen): Einheiten-Stärke + Führungskräfte (je 1 Person)
  const persGesamt = sAll.f + sAll.u + sAll.m + fkN;
  const persVorOrt = s.f + s.u + s.m + fkN;
  const staerkeGesamt = `${s.f+fkN}/${s.u}/${s.m}/${s.f+s.u+s.m+fkN}`;
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
  // Laufender Seitenkopf/-fuß über @page-Randboxen (kein position:fixed → keine Überlagerung
   // des Inhalts). Die Kopfzeile stammt aus dieser versteckten Quelle (CSS string-set).
  const runSrc = `<div class="p-run-src">${esc(state.config.ugName)} · ${esc(e.stichwort) || "Einsatzbericht"}${pEnde ? "" : " · Zwischenstand"}</div>`;
  const secEinsatz = on("einsatz") ? `
    <table class="meta">
      ${e.objekt ? `<tr><td>Objekt</td><td>${esc(e.objekt)}</td></tr>` : ""}
      <tr><td>Einsatzort</td><td>${esc(e.ort) || "–"}</td></tr>
      <tr><td>Alarmzeit</td><td>${e.beginn ? fmtDatum(e.beginn)+" "+fmtZeit(e.beginn)+" Uhr" : "–"}</td></tr>
      <tr><td>Einsatzende</td><td>${pEnde ? fmtDatum(pEnde)+" "+fmtZeit(pEnde)+" Uhr" : "– (Einsatz läuft)"}</td></tr>
      <tr><td>Einsatzdauer</td><td>${dauerStr(e.beginn, pEnde) || "–"}</td></tr>
      <tr><td>Kräfte gesamt</td><td><strong>${persGesamt} Einsatzkräfte</strong> · ${data.einheiten.length} Einheiten, ${fkN} Führungskräfte · Stärke <span class="p-mono">${sAll.f+fkN}/${sAll.u}/${sAll.m}/${persGesamt}</span> · AGT ${sAll.agt}, CSA ${sAll.csa}${pEnde ? "" : ` · aktuell vor Ort: <span class="p-mono">${persVorOrt}</span>`}</td></tr>
      <tr><td>Einsatzleiter</td><td>${esc(e.leiter) || "–"}</td></tr>
      ${(!pEnde && e.lagebespr) ? `<tr><td>Nächste Lagebesprechung</td><td>${esc(e.lagebespr)} Uhr</td></tr>` : ""}
      ${gruppeStr(e.ilsGruppe) ? `<tr><td>Leitstelle</td><td>${esc(state.config.ilsName||"Leitstelle")} · ${esc(gruppeStr(e.ilsGruppe))}</td></tr>` : ""}
      ${abs.length ? `<tr><td>Einsatzabschnitte</td><td>${abs.length} gebildet – siehe eigener Abschnitt unten</td></tr>` : ""}
      ${e.bemerkung ? `<tr><td>Bemerkungen</td><td>${esc(e.bemerkung)}</td></tr>` : ""}
    </table>` : "";
  const secAbschnitte = (on("einsatz") && abs.length) ? `
    <h2>Einsatzabschnitte (${abs.length})</h2>
    <table><thead><tr><th>Abschnitt</th><th>Abschnittsleiter</th><th>Telefon</th><th>Führungsrufgruppe</th><th>Arbeitsrufgruppe</th><th style="text-align:right">Einheiten</th></tr></thead><tbody>
      ${abs.map(a => {
        const n = data.einheiten.filter(u => u.abschnitt === a.id).length;
        return `<tr>
          <td>${esc(a.name)}</td>
          <td>${esc(a.ansprechpartner||"–")}</td>
          <td class="p-mono">${esc(a.telefon||"–")}</td>
          <td class="p-mono">${esc(gruppeStr(a.fuehrung)||"–")}</td>
          <td class="p-mono">${esc(gruppeStr(a.arbeit)||"–")}</td>
          <td class="p-mono" style="text-align:right">${n}</td>
        </tr>`;
      }).join("")}
    </tbody></table>` : "";
  const secKraefte = on("kraefte") ? `
    <h2>Führungskräfte (${data.fuehrung.length})</h2>
    ${fkRows ? `<table><thead><tr><th>Name</th><th>Funktion</th><th>Funkrufname</th><th>Organisation</th><th>Einheit / Abschnitt</th></tr></thead><tbody>${fkRows}</tbody></table>` : "<p>Keine erfasst.</p>"}
    <h2>Einheiten (${data.einheiten.length})</h2>
    ${unitRows ? `<table><thead><tr><th>Ankunft</th><th>Organisation</th><th>Funkrufname</th>${showAb?"<th>Abschnitt</th>":""}<th>Stärke</th><th>AGT</th><th>CSA</th><th>Status</th></tr></thead><tbody>${unitRows}</tbody></table>` : "<p>Keine erfasst.</p>"}
    <h2>Nachforderungen (${(data.anforderungen||[]).length})</h2>
    ${(data.anforderungen||[]).length ? `<table><thead><tr><th>Was</th><th>Status</th><th>Angefordert</th><th>Alarmiert</th><th>Eingetroffen</th></tr></thead><tbody>
      ${[...data.anforderungen].sort((a,b) => (a.angefordert||"").localeCompare(b.angefordert||"")).map(a => `
      <tr>
        <td>${esc(a.was)}</td><td>${esc(a.status)}</td>
        <td class="p-mono">${fmtZeit(a.angefordert)}</td>
        <td class="p-mono">${a.alarmiert ? fmtZeit(a.alarmiert) : "–"}</td>
        <td class="p-mono">${a.eingetroffen ? fmtZeit(a.eingetroffen) : "–"}</td>
      </tr>`).join("")}
    </tbody></table>` : "<p>Keine.</p>"}` : "";
  const secFunk = on("funk") ? `
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
    </tbody></table>`;})() : "<p>Keine erfasst.</p>"}` : "";
  const secSkizze = on("skizze") ? `
    <section class="p-land">
      <h2>Komm-Skizze</h2>
      <div class="p-skizze">${renderFunkskizze(data)}</div>
    </section>` : "";
  const secBespr = on("bespr") ? `
    <h2>Lagebesprechungen (${(data.besprechungen||[]).length})</h2>
    ${(data.besprechungen||[]).length ? `<table><thead><tr><th style="width:110px">Zeit</th><th style="width:180px">Teilnehmer</th><th>Protokoll</th></tr></thead><tbody>
      ${[...data.besprechungen].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||"")).map(b => `
      <tr>
        <td class="p-mono">${fmtTagKurz(b.zeit)} ${fmtZeit(b.zeit)}</td>
        <td>${esc(b.teilnehmer||"–")}</td>
        <td style="white-space:pre-wrap">${esc(b.protokoll)}</td>
      </tr>`).join("")}
    </tbody></table>` : "<p>Keine protokolliert.</p>"}` : "";
  const secFotos = on("fotodoku") && (data.fotos||[]).length ? `
    <h2>Fotodokumentation (${data.fotos.length})</h2>
    <div class="p-fotos">
      ${[...data.fotos].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||"")).map(f => `
      <figure>
        <img src="${f.data}" alt="Einsatzfoto">
        <figcaption class="p-mono">${fmtZeit(f.zeit)} Uhr${f.notiz ? " – " + esc(f.notiz) : ""}</figcaption>
      </figure>`).join("")}
    </div>` : "";
  const secListen = on("listen") ? `
    <h2>Checklisten (${(data.checks||[]).length})</h2>
    ${(data.checks||[]).length ? (data.checks).map(c => {
      const pk = c.punkte.filter(p => !p.head);
      return `
      <p style="margin:8px 0 4px"><strong>${esc(c.name)}</strong> – ${pk.filter(p=>p.done).length}/${pk.length} erledigt</p>
      <table><tbody>
        ${c.punkte.map(p => p.head
          ? `<tr><td></td><td colspan="2" style="font-weight:700;padding-top:6px">${esc(p.text)}</td></tr>`
          : `<tr>
          <td style="width:24px">${p.done ? "☑" : "☐"}</td>
          <td>${esc(p.text)}</td>
          <td class="p-mono" style="width:70px;text-align:right">${p.zeit ? fmtZeit(p.zeit) : ""}</td>
        </tr>`).join("")}
      </tbody></table>`;}).join("") : "<p>Keine.</p>"}` : "";
  const secAtem = on("atemschutz") && (data.asTrupps||[]).length ? `
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
    </tbody></table>` : "";
  const secLage = on("lagekarte") ? `
    ${(data.lage && data.lage.items && data.lage.items.length) ? `
    <section class="p-land">
      <h2>Lagekarte${data.ende ? " (Stand Einsatzende)" : " (aktueller Stand)"}</h2>
      ${printMapHtml(data.lage)}
      ${printLegendHtml(data.lage.items, data.einheiten)}
    </section>` : ""}
    ${(data.lage && (data.lage.snapshots||[]).length) ? [...data.lage.snapshots]
      .sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""))
      .map(s => `
      <section class="p-land">
        <h2>Lagebild ${fmtZeit(s.zeit)} Uhr (${fmtDatum(s.zeit)})</h2>
        ${printMapHtml(s)}
        ${printLegendHtml(s.items, data.einheiten)}
      </section>`).join("") : ""}` : "";
  $("#printArea").innerHTML = `
    ${runSrc}
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Einsatzbericht · Kräfteübersicht${pEnde ? "" : " · Zwischenstand"}</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}${e.objekt ? " · " + esc(e.objekt) : ""}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    ${secEinsatz}${secAbschnitte}${secKraefte}${secFunk}${secSkizze}${secBespr}${secFotos}${secListen}${secAtem}${secLage}
    <p class="p-sum">
      Gesamtstärke über den Einsatz: <span class="p-mono">${sAll.f+(data.fuehrung||[]).length}/${sAll.u}/${sAll.m}/${sAll.f+sAll.u+sAll.m+(data.fuehrung||[]).length}</span> · AGT: ${sAll.agt} · CSA: ${sAll.csa}
      ${data.ende ? "" : ` &nbsp;|&nbsp; aktuell vor Ort: <span class="p-mono">${s.f+(data.fuehrung||[]).length}/${s.u}/${s.m}/${s.f+s.u+s.m+(data.fuehrung||[]).length}</span>`}
    </p>
    <div class="p-foot">
      <div class="p-sign">Ort, Datum</div>
      <div class="p-sign">Unterschrift Einsatzleiter</div>
    </div>
    <p class="p-print-ts">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Kräfteerfassung (Prototyp) · ${esc(state.config.ugName)}</p>`;
  window.print();
}
/* Druck-Auswahl: vor dem Drucken wählen, welche Bereiche (= Navigationspunkte ohne Monitor)
   in den Bericht kommen – standardmäßig alle markiert. */
function openPrintDialog(data){
  const bereiche = TABS.filter(t => t.id !== "monitor");
  const rows = bereiche.map(t => `
    <label class="print-pick">
      <input type="checkbox" data-psec="${t.id}" checked>
      <svg class="pp-ico" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>
      <span>${esc(t.label)}</span>
    </label>`).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Bericht drucken">
    <div class="sheet-head"><h2>Bericht drucken</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <p class="hint" style="margin-top:0">Welche Bereiche sollen in den Bericht? Alles ist vorausgewählt – abwählen, was nicht gedruckt werden soll.</p>
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <button type="button" class="btn btn-ghost" id="pick-all">Alle</button>
        <button type="button" class="btn btn-ghost" id="pick-none">Keine</button>
      </div>
      <div class="print-picks">${rows}</div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary" id="print-go" style="flex:1">Drucken</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const boxes = () => [...document.querySelectorAll("[data-psec]")];
  $("#pick-all").addEventListener("click", () => boxes().forEach(b => b.checked = true));
  $("#pick-none").addEventListener("click", () => boxes().forEach(b => b.checked = false));
  $("#print-go").addEventListener("click", () => {
    const sel = {};
    boxes().forEach(b => sel[b.dataset.psec] = b.checked);
    closeEditor();
    // kurzer Aufschub, damit das Fenster geschlossen ist, bevor der Druckdialog aufgeht
    setTimeout(() => doPrint(data, sel), 60);
  });
}

/* ---------------- Render-Hauptschleife ---------------- */
function render(){
  lgMapTeardown();  // Leaflet-Karte vor dem Neuaufbau des DOM sauber entfernen
  // Auf kleinen Geräten sind Monitor/Lagekarte/Komm-Skizze nicht verfügbar
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
  else if(state.view === "fotodoku"){ main.innerHTML = renderFotodoku(); wireFotodoku(); }
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
// Nach Vollbild-Wechsel die (Snapshot-/Vergleichs-)Karten neu vermessen
document.addEventListener("fullscreenchange", () => {
  setTimeout(() => { [lgSnapObj, lgCmpA, lgCmpB].forEach(m => { if(m){ try{ m.invalidateSize(); }catch(e){} } }); }, 150);
});
// Monitor bei Fenster-Größenänderung neu berechnen (Spalten/Einpassung dynamisch)
let monResizeT = null;
window.addEventListener("resize", () => {
  if(!state || state.view !== "monitor") return;
  clearTimeout(monResizeT);
  monResizeT = setTimeout(() => { if(state && state.view === "monitor") render(); }, 200);
});

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
// Nächster Push soll den Server-Einsatz ERZWUNGEN ersetzen (bewusstes Verwerfen /
// Neuer Einsatz / Beenden / Import) – unabhängig vom einsatzStart-Zeitstempel.
let syncErsetzen = false;
function einsatzErsetzenErzwingen(){ syncErsetzen = true; _syncSnap = null; }
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
  if(syncErsetzen) out.ersetzen = true;   // bewusstes Ersetzen erzwingen
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
let letzterTastendruck = 0;
document.addEventListener("input", () => { letzterTastendruck = Date.now(); }, true);
document.addEventListener("keydown", () => { letzterTastendruck = Date.now(); }, true);
function syncTipptGerade(){
  const a = document.activeElement;
  const fokus = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT");
  // Nur bremsen, solange WIRKLICH getippt wird; nach kurzer Pause fremde Änderungen zeigen.
  return fokus && (Date.now() - letzterTastendruck < 3000);
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
    syncErsetzen = false;   // Push kam an → Ersetzen-Wunsch ist erledigt
    SYNC.verbunden = true;
    SYNC.clients = d.clients || 1;
    SYNC.seq = d.seq;
    zeigeUpdateHinweis(d.update);
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

/* Hinweis-Banner: der ELW-Server hat eine neue App-Version geladen, die beim
   nächsten Neustart aktiv wird. Keine automatische Aktualisierung im Betrieb.
   "update" kommt aus den Server-Antworten (/api/info und /api/sync). */
function zeigeUpdateHinweis(update){
  let bar = document.getElementById("updateBar");
  const version = update && update.version;
  // Kein Update, oder für genau diese Version schon ausgeblendet → Banner weg.
  if(!version || localStorage.getItem("elwis-update-versteckt") === version){
    if(bar) bar.remove();
    return;
  }
  if(!bar){
    bar = document.createElement("div");
    bar.id = "updateBar";
    bar.className = "update-bar";
    const header = document.querySelector("#app header.topbar");
    if(header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
  }
  let stand = "";
  try{
    if(update.erstellt) stand = new Date(update.erstellt).toLocaleString("de-DE",
      { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }catch(e){ /* Datum egal, dann eben ohne */ }
  bar.textContent = "";
  const txt = document.createElement("span");
  txt.className = "update-bar-txt";
  txt.textContent = "Neue Version liegt am ELW bereit" + (stand ? " (Stand " + stand + ")" : "")
    + " – wird beim nächsten Neustart des ELW-Servers aktiv.";
  const zu = document.createElement("button");
  zu.type = "button";
  zu.className = "update-bar-zu";
  zu.textContent = "Ausblenden";
  zu.addEventListener("click", () => { localStorage.setItem("elwis-update-versteckt", version); bar.remove(); });
  bar.append(txt, zu);
}

/* Hat dieses Gerät selbst schon Einsatzdaten erfasst? (sonst: frisch verbunden) */
function einsatzHatDaten(){
  for(const name of SYNC_COLS){
    const arr = syncColOf(name);
    if(Array.isArray(arr) && arr.length) return true;
  }
  const e = state.einsatz || {};
  return !!(e.stichwort || e.ort || e.objekt || e.leiter || e.bereitstellungsraum || e.bemerkung);
}
/* Server-Stand holen (leerer Body → Server ändert nichts, liefert nur seinen
   aktuellen Stand). Wird NICHT automatisch übernommen – der Aufrufer entscheidet. */
async function holeServerStand(){
  const res = await fetch("./api/sync", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: syncClientId() }),
  });
  if(!res.ok) return null;
  const d = await res.json();
  return (d && !d.unchanged) ? d : null;
}

/* Konflikt-Dialog: dieses Gerät hat eigene Daten UND der Server führt einen
   anderen Einsatz. Zusammenführen geht nicht – der Nutzer wählt bewusst.
   Kein "Abbrechen"/Backdrop-Klick, damit nichts versehentlich passiert. */
function frageEinsatzKonflikt(){
  return new Promise(resolve => {
    const host = $("#modalHost");
    host.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal" role="alertdialog" aria-modal="true">
      <h2>Am ELW läuft bereits ein Einsatz</h2>
      <p>Dieses Gerät hat eigene Einsatzdaten, am ELW-Server läuft aber schon ein
         anderer Einsatz. Ein Zusammenführen ist nicht möglich – bitte wählen:</p>
      <div class="modal-btns" style="flex-direction:column;gap:10px;align-items:stretch">
        <button class="btn btn-primary" data-wahl="server">Diesen (ELW-)Einsatz übernehmen<br>
          <small style="font-weight:400;opacity:.85">Meine lokalen Daten werden verworfen</small></button>
        <button class="btn btn-ghost" data-wahl="meins">Meinen Einsatz verwenden<br>
          <small style="font-weight:400;opacity:.85">Ersetzt den Stand am ELW für alle Geräte</small></button>
      </div>
    </div>`;
    host.querySelectorAll("[data-wahl]").forEach(b =>
      b.addEventListener("click", () => { const w = b.dataset.wahl; host.innerHTML = ""; resolve(w); }));
    const def = host.querySelector('[data-wahl="server"]'); if(def) def.focus();
  });
}

async function syncInit(){
  try{
    const res = await fetch("./api/info", { cache: "no-store" });
    if(!res.ok) return;
    const d = await res.json();
    if(!d || !d.elwis) return;
    SYNC.aktiv = true;
    SYNC.urls = d.urls || [];
    zeigeUpdateHinweis(d.update);
    // Server führt bereits einen ANDEREN Einsatz als dieses Gerät?
    if(d.einsatzId && d.einsatzId !== state.einsatzId){
      let srv = null;
      try{ srv = await holeServerStand(); }catch(e){}
      const serverNeuer = !!srv && (srv.einsatzStart || "") > (state.einsatzStart || "");
      if(!einsatzHatDaten() || serverNeuer){
        // Gerät hat selbst nichts erfasst ODER der ELW hat einen NEUEREN Einsatz
        // gestartet → automatisch übernehmen. So landen (auch wieder geöffnete)
        // Tablets immer im aktuellen Einsatz, statt am alten zu kleben.
        if(srv) syncApply(srv);
      }else{
        // Gerät hat eigene, nicht-ältere Daten → bewusst entscheiden lassen.
        const wahl = await frageEinsatzKonflikt();
        if(wahl === "server"){ if(srv) syncApply(srv); }
        else{ einsatzErsetzenErzwingen(); state.einsatzStart = new Date().toISOString(); save(); }
      }
    }
    syncTick();
    setInterval(syncTick, 3000);
    render();
  }catch(e){ /* kein ELW-Server erreichbar → App läuft eigenständig weiter */ }
}

/* App-Version aus der manifest.json – im Splash und in den Einstellungen sichtbar.
   "erstellt" ist der Build-Zeitpunkt (die sprechende Info), "version" das Git-Kürzel. */
let appVersionInfo = null;
async function ladeAppVersion(){
  try{
    const r = await fetch("./manifest.json", { cache: "no-store" });
    if(!r.ok) return;
    appVersionInfo = await r.json();
    zeigeAppVersion();
  }catch(e){ /* offline / kein Manifest → dann eben ohne Versionsanzeige */ }
}
function versionText(){
  if(!appVersionInfo) return "";
  let datum = "";
  try{
    datum = new Date(appVersionInfo.erstellt).toLocaleString("de-DE",
      { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }catch(e){}
  return "Version " + (appVersionInfo.version || "?") + (datum ? " · " + datum : "");
}
function zeigeAppVersion(){
  const t = versionText();
  const s = document.getElementById("splashVer"); if(s) s.textContent = t;
  const c = document.getElementById("cfgVer"); if(c) c.textContent = t;
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
  ladeAppVersion();
}
boot();
