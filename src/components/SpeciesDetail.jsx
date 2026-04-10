import { useState, useMemo } from 'react';
import Thumb, { SpeciesLink } from './Thumb';
import ThreatBadge from './ThreatBadge';
import NetworkGraph from './NetworkGraph';
import IUCNLegend from './IUCNLegend';
import { TYPES, FAMILIES, FILTER_GROUPS, STATUS_COLORS } from '../utils/types';

var GEO = { FR: 'France', DE: 'Germany', IT: 'Italy', ES: 'Spain', UK: 'UK', SE: 'Sweden', CH: 'Switzerland', AT: 'Austria', NL: 'Netherlands', BE: 'Belgium', PL: 'Poland', CZ: 'Czechia', PT: 'Portugal', GR: 'Greece', DK: 'Denmark' };
var L = {
  fr: { plant: 'Plante', insect: 'Insecte', int: 'interactions', src: 'sources', eco: 'Écologique', phy: 'Phytosanitaire', back: '← Retour', graph: 'Graphe', list: 'Liste', assocI: 'Insectes associés', assocP: 'Plantes associées', noR: 'Aucun résultat.',
    native: 'Indigène', archaeophyte: 'Archéophyte', neophyte: 'Néophyte', horticultural: 'Horticole', cultivated: 'Cultivée' },
  en: { plant: 'Plant', insect: 'Insect', int: 'interactions', src: 'sources', eco: 'Ecological', phy: 'Phytosanitary', back: '← Back', graph: 'Graph', list: 'List', assocI: 'Associated insects', assocP: 'Associated plants', noR: 'No results.',
    native: 'Native', archaeophyte: 'Archaeophyte', neophyte: 'Neophyte', horticultural: 'Horticultural', cultivated: 'Cultivated' },
};

export default function SpeciesDetail(props) {
  var species = props.species, isPlant = props.isPlant, plants = props.plants, insects = props.insects, interactions = props.interactions, lang = props.lang, onSelect = props.onSelect, onBack = props.onBack;
  var t = L[lang] || L.fr;
  var _f = useState('all'), fi = _f[0], sFi = _f[1];
  var _v = useState('graph'), dv = _v[0], sDv = _v[1];
  var dm = isPlant ? 'plant' : 'insect';

  var rels = useMemo(function () {
    var ixByPlant = props.ixByPlant || {}; var ixByInsect = props.ixByInsect || {};
    var r = isPlant ? (ixByPlant[species.id] || []) : (ixByInsect[species.id] || []);
    if (fi !== 'all') { r = r.filter(function (x) { var tp = TYPES[x.tp]; return tp && tp.fam === fi; }); }
    return r;
  }, [species.id, isPlant, fi, interactions]);

  var plantMap = props.plantMap || {}; var insectMap = props.insectMap || {};
  var getPartner = function (ix) { return isPlant ? insectMap[ix.iI] : plantMap[ix.pI]; };
  var partners = useMemo(function () { var seen = {}; return rels.map(getPartner).filter(function (p) { if (!p || seen[p.id]) return false; seen[p.id] = true; return true; }); }, [rels]);
  var tObs = rels.reduce(function (s, x) { return s + x.src.reduce(function (a, sr) { return a + (sr.n || 0); }, 0); }, 0);
  var uS = Array.from(new Set(rels.flatMap(function (x) { return x.src; }))).filter(function (s) { return s && s !== "legacy"; });
  var name = function (item) { return item.common ? (item.common.fr || '') + ' · ' + (item.common.en || '') : ''; };

  function exportPDF() {
    var grouped = {};
    rels.forEach(function (ix) {
      var tp = TYPES[ix.tp];
      var fam = tp ? tp.fam : "other";
      var famLabel = FAMILIES[fam] ? FAMILIES[fam][lang] : fam;
      var tpLabel = tp ? tp[lang] : ix.tp;
      var key = famLabel + " \u2014 " + tpLabel;
      if (!grouped[key]) grouped[key] = { color: FAMILIES[fam] ? FAMILIES[fam].color : "#888", items: [] };
      var partner = getPartner(ix);
      if (partner) {
        var pName = partner.common ? partner.common[lang] || "" : "";
        grouped[key].items.push({ sci: partner.sci, common: pName, family: partner.family || "", order: partner.order || "", threat: partner.threat || "", obs: ix.n || 1 });
      }
    });
    Object.values(grouped).forEach(function (g) { g.items.sort(function (a, b) { return b.obs - a.obs; }); });

    var tc = { CR: "#cc3333", EN: "#e67e22", VU: "#f39c12", NT: "#6b8e23", LC: "#27ae60", DD: "#999" };
    var tl = lang === "fr" ? { CR: "En danger critique", EN: "En danger", VU: "Vuln\u00e9rable", NT: "Quasi menac\u00e9", LC: "Pr\u00e9occupation mineure", DD: "Donn\u00e9es insuffisantes" } : { CR: "Critically Endangered", EN: "Endangered", VU: "Vulnerable", NT: "Near Threatened", LC: "Least Concern", DD: "Data Deficient" };
    var gfL = { tree: lang === "fr" ? "Arbre" : "Tree", shrub: lang === "fr" ? "Arbuste" : "Shrub", climber: lang === "fr" ? "Grimpante" : "Climber", herb: lang === "fr" ? "Herbac\u00e9e" : "Herb", grass: lang === "fr" ? "Gramin\u00e9e" : "Grass" };

    var cn = species.common ? species.common[lang] || "" : "";
    var h = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + species.sci + " \u2014 Phytomia</title>";
    h += "<style>body{font-family:Georgia,serif;margin:40px;color:#1a1a1a;max-width:800px}h1{font-size:22px;color:#2d7d46;margin:0 0 4px}h1 em{font-weight:normal}.sub{font-size:14px;color:#666;margin:0 0 16px}.meta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding:12px 16px;background:#f8f8f8;border-radius:8px;font-size:13px}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}.sec{margin:24px 0 8px;padding:8px 0 4px;border-bottom:2px solid;font-size:16px;font-weight:600}table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:12px}th{text-align:left;padding:6px 8px;background:#f5f5f5;border-bottom:1px solid #ddd;font-size:11px;color:#666}td{padding:5px 8px;border-bottom:1px solid #eee}td em{font-weight:500}.foot{margin-top:30px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#999}@media print{body{margin:20px}}</style></head><body>";
    h += "<h1><em>" + species.sci + "</em></h1>";
    h += "<p class='sub'>" + cn + (species.family ? " \u2014 " + species.family : "") + (species.order ? " (" + species.order + ")" : "") + "</p>";
    h += "<div class='meta'>";
    h += "<span>" + (isPlant ? t.plant : t.insect) + "</span>";
    if (species.threat) { var c1 = tc[species.threat] || "#999"; h += " <span class='badge' style='background:" + c1 + "20;color:" + c1 + "'>" + species.threat + " \u2014 " + (tl[species.threat] || "") + "</span>"; }
    if (species.growthForm && isPlant) h += " <span class='badge' style='background:#2d7d4615;color:#2d7d46'>" + (gfL[species.growthForm] || species.growthForm) + "</span>";
    if (species.region) h += " <span class='badge' style='background:#88888815;color:#888'>" + (species.region === "non-native" ? (lang === "fr" ? "Non-indig\u00e8ne" : "Non-native") : "Extra-EU") + "</span>";
    h += "<span>" + rels.length + " " + t.int + "</span>";
    h += "</div>";
    var thSp = lang === "fr" ? "Esp\u00e8ce" : "Species";
    var thCn = lang === "fr" ? "Nom commun" : "Common name";
    var thFam = lang === "fr" ? "Famille" : "Family";
    Object.keys(grouped).forEach(function (key) {
      var g = grouped[key];
      h += "<div class='sec' style='border-color:" + g.color + ";color:" + g.color + "'>" + key + " (" + g.items.length + ")</div>";
      h += "<table><tr><th>#</th><th>" + thSp + "</th><th>" + thCn + "</th><th>" + thFam + "</th><th>IUCN</th><th>"+(lang==="fr"?"Interactions":"Interactions")+"</th></tr>";
      g.items.forEach(function (item, idx) {
        h += "<tr><td>" + (idx + 1) + "</td><td><em>" + item.sci + "</em></td><td>" + item.common + "</td><td>" + item.family + "</td><td>";
        if (item.threat) { var c2 = tc[item.threat] || "#999"; h += "<span class='badge' style='background:" + c2 + "20;color:" + c2 + "'>" + item.threat + "</span>"; }
        h += "</td><td>" + item.obs + "</td></tr>";
      });
      h += "</table>";
    });
    h += "<div class='foot'><p><strong>Phytomia</strong> \u2014 " + (lang === "fr" ? "Explorateur d\u2019interactions plantes \u00d7 insectes en Europe" : "Plant \u00d7 insect interaction explorer for Europe") + "</p>";
    h += "<p>" + (lang === "fr" ? "Donn\u00e9es : " : "Data: ") + "EuPPollNet, GloBI, DoPI, DBIF, EuropeanHostData, HOSTS NHM, Mangal, Web of Life, GBIF</p>";
    h += "<p>" + (lang === "fr" ? "Licence : CC BY-SA 4.0 \u2014 Auteur : Thomas Hanss" : "License: CC BY-SA 4.0 \u2014 Author: Thomas Hanss") + "</p>";
    h += "<p>" + (lang === "fr" ? "G\u00e9n\u00e9r\u00e9 le " : "Generated on ") + new Date().toLocaleDateString() + "</p>";
    h += "</div></body></html>";
    var w = window.open("", "_blank");
    w.document.write(h);
    w.document.close();
    w.setTimeout(function () { w.print(); }, 500);
  }

  var shortName = function (item) { return item.common ? item.common[lang] || '' : ''; };

  return (
    <div>
      <div className="detail-header">
        <Thumb name={species.sci} sz={80} item={species} isPlant={isPlant} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="badge-type" style={{ background: (isPlant ? '#2d7d46' : '#b8860b') + '14', color: isPlant ? '#2d7d46' : '#b8860b' }}>{isPlant ? t.plant : t.insect}</span>
            {species.status && (<span className="badge" style={{ background: STATUS_COLORS[species.status] + '20', color: STATUS_COLORS[species.status] }}>{t[species.status]}</span>)}
            {species.threat && <ThreatBadge cat={species.threat} lang={lang} size="lg" />}
            {species.region && (<span className="badge" style={{ background: '#88888815', color: '#888' }}>{species.region === "non-native" ? (lang === "fr" ? "Non-indigène" : "Non-native") : (lang === "fr" ? "Extra-européen" : "Extra-European")}</span>)}
          </div>
          <h2 className="detail-sci">{species.sci} <SpeciesLink name={species.sci} lang={lang} /></h2>
          <p className="detail-common">{name(species)} — {species.family || species.order}</p>
          {rels.length > 0 && (<p style={{ fontSize: 13, color: 'var(--text2)', margin: '8px 0 0' }}>{rels.length} {t.int} · {partners.length} {lang === "fr" ? "espèces" : "species"}{uS.length > 0 ? " · " + uS.join(", ") : ""}</p>)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div className="chips">
          {FILTER_GROUPS.filter(function (fg) { return fg.key === 'all' || rels.some(function (x) { var tp = TYPES[x.tp]; return tp && tp.fam === fg.key; }); }).map(function (fg) {
            var col = fg.key === 'all' ? '#555' : (FAMILIES[fg.key] ? FAMILIES[fg.key].color : '#555');
            var active = fi === fg.key;
            return (<button key={fg.key} className={'chip' + (active ? ' active' : '')} style={active ? { borderColor: col, background: col + '14', color: col } : {}} onClick={function () { sFi(fg.key); }}>{fg[lang]}</button>);
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={exportPDF} style={{ fontSize: 11, padding: "5px 10px", color: "#555", background: "#55555508", border: "1px solid #55555525", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>PDF</button>
        <div className="view-toggle">
          <button className={dv === 'graph' ? 'active' : ''} onClick={function () { sDv('graph'); }}>{t.graph}</button>
          <button className={dv === 'list' ? 'active' : ''} onClick={function () { sDv('list'); }}>{t.list}</button>
        </div>
        </div>
      </div>

      {dv === 'graph' && rels.length > 0 && (
        <NetworkGraph center={species} partners={partners} ixs={rels} lang={lang} onSel={onSelect} plants={plants} />
      )}

      {dv === 'list' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{isPlant ? t.assocI : t.assocP}</h3>
          {rels.length === 0 && (<p style={{ fontSize: 14, color: 'var(--text2)' }}>{t.noR}</p>)}
          {rels.map(function (ix, idx) {
            var p2 = getPartner(ix); if (!p2) return null;
            var tp = TYPES[ix.tp] || TYPES.folivorie; var fam = FAMILIES[tp.fam]; var col = fam.color;
            return (
              <div key={idx} className="ix-card" style={{ borderLeftColor: col }}>
                <Thumb name={p2.sci} sz={44} item={p2} isPlant={!isPlant} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ cursor: 'pointer' }} onClick={function () { onSelect(p2.id); }}>
                      <span style={{ fontSize: 15, fontWeight: 500, fontStyle: 'italic', color: 'var(--text)', borderBottom: '1px dashed #ccc' }}>{p2.sci}</span>
                      <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 8 }}>{shortName(p2)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <svg width="22" height="10"><line x1="0" y1="5" x2="14" y2="5" stroke={col} strokeWidth={tp.w} strokeDasharray={tp.dash} strokeLinecap="round" /><g transform="translate(18,5) scale(0.5)"><path d={tp.icon} fill="none" stroke={col} strokeWidth={1.5} strokeLinecap="round" /></g></svg>
                      <span className="badge" style={{ fontWeight: 600, background: col + '18', color: col }}>{tp[lang]}</span>
                      <span className="badge" style={{ background: ix.st === 'eco' ? '#2d7d4612' : '#c0392b12', color: ix.st === 'eco' ? '#2d7d46' : '#c0392b' }}>{ix.st === 'eco' ? t.eco : t.phy}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                    {ix.src.map(function (s, si) {
                      return (
                        <div key={si} style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, minWidth: 100 }}>{s.db}</span>
                          <span>{s.n != null ? s.n + ' obs.' : '—'}</span>
                          <span>{(s.geo || []).map(function (g) { return GEO[g] || g; }).join(', ')}</span>
                          <span>{s.yr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <IUCNLegend lang={lang} />
      <button className="back-btn" onClick={onBack}>{t.back}</button>
    </div>
  );
}

