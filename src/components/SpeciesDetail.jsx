import { useState, useMemo } from 'react';
import Thumb, { SpeciesLink } from './Thumb';
import ThreatBadge from './ThreatBadge';
import NetworkGraph from './NetworkGraph';
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
  var partners = useMemo(function () { return rels.map(getPartner).filter(Boolean); }, [rels]);
  var tObs = rels.reduce(function (s, x) { return s + x.src.reduce(function (a, sr) { return a + (sr.n || 0); }, 0); }, 0);
  var uS = Array.from(new Set(rels.flatMap(function (x) { return x.src.map(function (s) { return s.db; }); })));
  var name = function (item) { return item.common ? (item.common.fr || '') + ' · ' + (item.common.en || '') : ''; };
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
          </div>
          <h2 className="detail-sci">{species.sci} <SpeciesLink name={species.sci} lang={lang} /></h2>
          <p className="detail-common">{name(species)} — {species.family || species.order}</p>
          {rels.length > 0 && (<p style={{ fontSize: 13, color: 'var(--text2)', margin: '8px 0 0' }}>{rels.length} {t.int} · {uS.length} {t.src}{tObs > 0 ? ' · ' + tObs + ' obs.' : ''}</p>)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div className="chips">
          {FILTER_GROUPS.map(function (fg) {
            var col = fg.key === 'all' ? '#555' : (FAMILIES[fg.key] ? FAMILIES[fg.key].color : '#555');
            var active = fi === fg.key;
            return (<button key={fg.key} className={'chip' + (active ? ' active' : '')} style={active ? { borderColor: col, background: col + '14', color: col } : {}} onClick={function () { sFi(fg.key); }}>{fg[lang]}</button>);
          })}
        </div>
        <div className="view-toggle">
          <button className={dv === 'graph' ? 'active' : ''} onClick={function () { sDv('graph'); }}>{t.graph}</button>
          <button className={dv === 'list' ? 'active' : ''} onClick={function () { sDv('list'); }}>{t.list}</button>
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

      <button className="back-btn" onClick={onBack}>{t.back}</button>
    </div>
  );
}
