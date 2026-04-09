import { useState, useMemo } from 'react';
import Thumb from './Thumb';
import IUCNLegend from './IUCNLegend';
import ThreatBadge from './ThreatBadge';
import { TYPES, FAMILIES, STATUS_COLORS, THREATENED_CATS } from '../utils/types';

var L = {
  fr: { plants: 'Plantes', insects: 'Insectes', all: 'Toutes', allM: 'Tous', seeMore: 'Voir plus',
    note: 'Ce classement reflète les données publiées, pas la réalité écologique complète.',
    native: 'Indigène', archaeophyte: 'Archéophyte', neophyte: 'Néophyte', horticultural: 'Horticole', cultivated: 'Cultivée',
    threatened: 'Menacées', nearThreatened: 'Quasi menacées' },
  en: { plants: 'Plants', insects: 'Insects', all: 'All', allM: 'All', seeMore: 'See more',
    note: 'This ranking reflects published data, not complete ecological reality.',
    native: 'Native', archaeophyte: 'Archaeophyte', neophyte: 'Neophyte', horticultural: 'Horticultural', cultivated: 'Cultivated',
    threatened: 'Threatened', nearThreatened: 'Near Threatened' },
};

function dominantFam(id, ixByInsect) {
  var ixs = (ixByInsect && ixByInsect[id]) || [];
  var counts = {};
  ixs.forEach(function (x) { var tp = TYPES[x.tp]; if (tp) counts[tp.fam] = (counts[tp.fam] || 0) + 1; });
  var best = null, max = 0;
  Object.keys(counts).forEach(function (k) { if (counts[k] > max) { max = counts[k]; best = k; } });
  return best;
}

function isThreatened(cat) { return THREATENED_CATS.indexOf(cat) !== -1; }

export default function Ranking(props) {
  var plants = props.plants, insects = props.insects, interactions = props.interactions, lang = props.lang, onSelect = props.onSelect;
  var t = L[lang] || L.fr;
  var _fp = useState('all'), filtPl = _fp[0], sFiltPl = _fp[1];
  var _fi = useState('all'), filtIn = _fi[0], sFiltIn = _fi[1];
  var _sp = useState(20), showPl = _sp[0], sShowPl = _sp[1];
  var _si = useState(20), showIn = _si[0], sShowIn = _si[1];

  var allP = useMemo(function () {
    var ixBP = props.ixByPlant || {};
    return plants.filter(function (p) { return (ixBP[p.id] || []).length > 0; }).map(function (p) { return Object.assign({}, p, { count: (ixBP[p.id] || []).length }); }).sort(function (a, b) { return b.count - a.count; });
  }, [plants, interactions]);

  var allI = useMemo(function () {
    var ixBI = props.ixByInsect || {};
    return insects.filter(function (ins) { return (ixBI[ins.id] || []).length > 0; }).map(function (ins) { return Object.assign({}, ins, { count: (ixBI[ins.id] || []).length, domFam: dominantFam(ins.id, ixBI) }); }).sort(function (a, b) { return b.count - a.count; });
  }, [insects, interactions]);

  var pRanks = useMemo(function () {
    if (filtPl === 'all') return allP;
    if (filtPl === 'threatened') return allP.filter(function (p) { return isThreatened(p.threat); });
    if (filtPl === 'NT') return allP.filter(function (p) { return p.threat === 'NT'; });
    if (filtPl.indexOf('gf_') === 0) { var gfKey = filtPl.slice(3); return allP.filter(function (p) { return (p.growthForm || 'herb') === gfKey; }); }
    return allP.filter(function (p) { return p.status === filtPl; });
  }, [filtPl, allP]);

  var iRanks = useMemo(function () {
    if (filtIn === 'all') return allI;
    if (filtIn === 'threatened') return allI.filter(function (ins) { return isThreatened(ins.threat); });
    if (filtIn === 'NT') return allI.filter(function (ins) { return ins.threat === 'NT'; });
    if (filtIn.indexOf('ord_') === 0) { var ordKey = filtIn.slice(4); return allI.filter(function (ins) { return ins.order === ordKey; }); }
    return allI.filter(function (ins) { return ins.domFam === filtIn; });
  }, [filtIn, allI]);

  var maxPC = (allP[0] && allP[0].count) || 1;
  var maxIC = (allI[0] && allI[0].count) || 1;

  // Build filter options dynamically
  var plantFilters = useMemo(function () {
    var opts = [];
    // Growth form filters
    var GF_LABELS = { tree: { fr: "Arbres", en: "Trees" }, shrub: { fr: "Arbustes", en: "Shrubs" }, climber: { fr: "Grimpantes", en: "Climbers" }, herb: { fr: "Herbac\u00e9es", en: "Herbs" }, grass: { fr: "Gramin\u00e9es", en: "Grasses" } };
    var GF_COLORS = { tree: "#2d7d46", shrub: "#4a8c3f", climber: "#3a7d44", herb: "#6b8e23", grass: "#8fae5e" };
    var gf = {}; allP.forEach(function (p) { var g = p.growthForm || "herb"; gf[g] = (gf[g] || 0) + 1; });
    ["tree","shrub","climber","herb","grass"].forEach(function (k) {
      if (gf[k]) opts.push({ key: "gf_" + k, label: (GF_LABELS[k] || {})[lang] || k, count: gf[k], color: GF_COLORS[k] || "#888" });
    });
    // Threat filters
    var nThreat = allP.filter(function (p) { return isThreatened(p.threat); }).length;
    var nNT = allP.filter(function (p) { return p.threat === "NT"; }).length;
    if (nThreat > 0) opts.push({ key: "threatened", label: t.threatened, count: nThreat, color: "#cc3333" });
    if (nNT > 0) opts.push({ key: "NT", label: t.nearThreatened, count: nNT, color: "#6b8e23" });
    return opts;
  }, [allP, t, lang]);

  var insectFilters = useMemo(function () {
    var opts = [];
    // Ecological role filters (domFam)
    var s = {}; allI.forEach(function (ins) { if (ins.domFam) s[ins.domFam] = (s[ins.domFam] || 0) + 1; });
    Object.keys(s).forEach(function (k) { var fam = FAMILIES[k]; if (fam) opts.push({ key: k, label: fam[lang] || k, count: s[k], color: fam.color || '#888' }); });
    // Order filters
    var ORDER_INFO = { Lepidoptera: { fr: 'L\u00e9pidopt\u00e8res', en: 'Lepidoptera', color: '#8b5cf6' }, Hymenoptera: { fr: 'Hym\u00e9nopt\u00e8res', en: 'Hymenoptera', color: '#b8860b' }, Diptera: { fr: 'Dipt\u00e8res', en: 'Diptera', color: '#6b8e23' }, Coleoptera: { fr: 'Col\u00e9opt\u00e8res', en: 'Coleoptera', color: '#a0522d' }, Hemiptera: { fr: 'H\u00e9mipt\u00e8res', en: 'Hemiptera', color: '#2874a6' }, Thysanoptera: { fr: 'Thysanopt\u00e8res', en: 'Thysanoptera', color: '#888' }, Trichoptera: { fr: 'Trichopt\u00e8res', en: 'Trichoptera', color: '#5f9ea0' }, Orthoptera: { fr: 'Orthopt\u00e8res', en: 'Orthoptera', color: '#c0392b' }, Neuroptera: { fr: 'N\u00e9vropt\u00e8res', en: 'Neuroptera', color: '#27ae60' }, Psocoptera: { fr: 'Psocopt\u00e8res', en: 'Psocoptera', color: '#888' }, Siphonaptera: { fr: 'Siphonopt\u00e8res', en: 'Siphonaptera', color: '#888' }, Dermaptera: { fr: 'Dermopt\u00e8res', en: 'Dermaptera', color: '#888' }, Ephemeroptera: { fr: 'Eph\u00e9m\u00e9ropt\u00e8res', en: 'Ephemeroptera', color: '#888' }, Odonata: { fr: 'Odonates', en: 'Odonata', color: '#1abc9c' }, Mecoptera: { fr: 'M\u00e9copt\u00e8res', en: 'Mecoptera', color: '#888' }, Raphidioptera: { fr: 'Raphidiopt\u00e8res', en: 'Raphidioptera', color: '#888' }, Plecoptera: { fr: 'Pl\u00e9copt\u00e8res', en: 'Plecoptera', color: '#888' } };
    var ords = {}; allI.forEach(function (ins) { var o = ins.order || ''; if (o) ords[o] = (ords[o] || 0) + 1; });
    Object.keys(ords).sort(function (a, b) { return ords[b] - ords[a]; }).forEach(function (o) { if (ords[o] >= 10 && ORDER_INFO[o]) { var info = ORDER_INFO[o]; opts.push({ key: 'ord_' + o, label: info[lang] || o, count: ords[o], color: info.color || '#888' }); } });
    // Threat filters
    var nThreat = allI.filter(function (ins) { return isThreatened(ins.threat); }).length;
    var nNT = allI.filter(function (ins) { return ins.threat === 'NT'; }).length;
    if (nThreat > 0) opts.push({ key: 'threatened', label: t.threatened, count: nThreat, color: '#cc3333' });
    if (nNT > 0) opts.push({ key: 'NT', label: t.nearThreatened, count: nNT, color: '#6b8e23' });
    return opts;
  }, [allI, lang, t]);

  var name = function (item) { return item.common ? item.common[lang] || item.common.fr || '' : ''; };

  function FilterChips(p2) {
    var current = p2.current, set = p2.set, options = p2.options, allLabel = p2.allLabel;
    return (
      <div className="chips">
        <button className={'chip' + (current === 'all' ? ' active' : '')} style={current === 'all' ? { borderColor: 'var(--text3)', background: 'var(--bg)', color: 'var(--text)' } : {}} onClick={function (e) { e.stopPropagation(); set('all'); }}>{allLabel}</button>
        {options.map(function (o) {
          var active = current === o.key; var col = o.color || '#666';
          return (<button key={o.key} className={'chip' + (active ? ' active' : '')} style={active ? { borderColor: col, background: col + '14', color: col } : {}} onClick={function (e) { e.stopPropagation(); set(active ? 'all' : o.key); }}>{o.label} <span style={{ fontSize: 8, opacity: 0.7 }}>{o.count}</span></button>);
        })}
      </div>
    );
  }

  function RankItem(p2) {
    var item = p2.item, i = p2.i, col = p2.col, mx = p2.mx, isP = p2.isP, showRole = p2.showRole;
    var dfam = item.domFam ? FAMILIES[item.domFam] : null;
    return (
      <div className="rank-item" onClick={function () { onSelect(item.id); }}>
        <span className="rank-num">{i + 1}</span>
        <Thumb name={item.sci} sz={30} item={item} isPlant={isP} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 500, fontStyle: 'italic', color: 'var(--text)' }}>{item.sci}</span>
            <span style={{ fontSize: 10, color: 'var(--text2)' }}>{name(item)}</span>
          </div>
          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="rank-bar" style={{ background: col + '22' }}><div className="rank-bar-fill" style={{ background: col, width: Math.max(8, item.count / mx * 100) + '%' }} /></div>
            <span className="rank-count">{item.count}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          {item.threat && <ThreatBadge cat={item.threat} lang={lang} size="sm" />}
          {isP && item.status && (<span className="badge" style={{ background: STATUS_COLORS[item.status] + '18', color: STATUS_COLORS[item.status] }}>{t[item.status]}</span>)}
          {isP && (<span style={{ fontSize: 8, color: 'var(--text3)' }}>{item.family}</span>)}
          {!isP && showRole && dfam && (<span className="badge" style={{ background: dfam.color + '18', color: dfam.color }}>{dfam[lang]}</span>)}
          {!isP && (<span style={{ fontSize: 8, color: 'var(--text3)' }}>{item.order}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="ranking-grid">
        <div className="ranking-col">
          <div className="ranking-header" style={{ background: '#2d7d4610' }}>
            <h3 style={{ color: '#2d7d46' }}>{t.plants}</h3>
          </div>
          <FilterChips current={filtPl} set={sFiltPl} allLabel={t.all} options={plantFilters} />
          <div style={{ padding: '4px 0' }}>
            {pRanks.slice(0, showPl).map(function (item, i) { return (<RankItem key={item.id} item={item} i={i} col="#2d7d46" mx={maxPC} isP={true} />); })}
            {pRanks.length === 0 && (<div style={{ padding: 16, fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>{lang === 'fr' ? 'Aucune espèce dans cette catégorie' : 'No species in this category'}</div>)}
          </div>
          {pRanks.length > showPl && (<div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}><button onClick={function () { sShowPl(showPl + 20); }} style={{ fontSize: 12, fontWeight: 500, color: '#2d7d46', background: 'none', border: 'none', cursor: 'pointer' }}>{t.seeMore} ({showPl}/{pRanks.length}) ↓</button></div>)}
        </div>
        <div className="ranking-col">
          <div className="ranking-header" style={{ background: '#b8860b10' }}>
            <h3 style={{ color: '#b8860b' }}>{t.insects}</h3>
          </div>
          <FilterChips current={filtIn} set={sFiltIn} allLabel={t.allM} options={insectFilters} />
          <div style={{ padding: '4px 0' }}>
            {iRanks.slice(0, showIn).map(function (item, i) { return (<RankItem key={item.id} item={item} i={i} col="#b8860b" mx={maxIC} isP={false} showRole={filtIn !== 'all' && filtIn !== 'threatened' && filtIn !== 'NT'} />); })}
            {iRanks.length === 0 && (<div style={{ padding: 16, fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>{lang === 'fr' ? 'Aucune espèce dans cette catégorie' : 'No species in this category'}</div>)}
          </div>
          {iRanks.length > showIn && (<div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}><button onClick={function () { sShowIn(showIn + 20); }} style={{ fontSize: 12, fontWeight: 500, color: '#b8860b', background: 'none', border: 'none', cursor: 'pointer' }}>{t.seeMore} ({showIn}/{iRanks.length}) ↓</button></div>)}
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>{t.note}</p>
      <IUCNLegend lang={lang} />
    </div>
  );
}
