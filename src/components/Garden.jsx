import { useState, useMemo } from 'react';
import Thumb from './Thumb';
import GardenGraph from './GardenGraph';

var L = {
  fr: { title: 'Assemblage de plantes', sub: 'Ajoutez des plantes pour visualiser le réseau d\'interactions',
    add: 'Ajouter une plante…', empty: 'Ajoutez au moins 2 plantes pour voir le graphe.',
    clear: 'Vider', stats: 'insectes attirés', shared: 'partagés', types: 'types', plants: 'plantes' },
  en: { title: 'Plant assemblage', sub: 'Add plants to visualize the interaction network',
    add: 'Add a plant…', empty: 'Add at least 2 plants to see the graph.',
    clear: 'Clear', stats: 'insects attracted', shared: 'shared', types: 'types', plants: 'plants' },
};

export default function Garden(props) {
  var plants = props.plants, insects = props.insects, interactions = props.interactions;
  var garden = props.garden, setGarden = props.setGarden, lang = props.lang, onSelect = props.onSelect;
  var t = L[lang] || L.fr;
  var _q = useState(''), gq = _q[0], sGq = _q[1];
  var _d = useState(false), gdrop = _d[0], sGdrop = _d[1];

  var name = function (item) { return item.common ? item.common[lang] || item.common.fr || '' : ''; };

  var gardenSg = useMemo(function () {
    if (gq.length < 1) return [];
    var ql = gq.toLowerCase();
    return plants.filter(function (p) {
      return garden.indexOf(p.id) === -1 && (
        p.sci.toLowerCase().includes(ql) ||
        (p.common && p.common.fr && p.common.fr.toLowerCase().includes(ql)) ||
        (p.common && p.common.en && p.common.en.toLowerCase().includes(ql)) ||
        (p.family && p.family.toLowerCase().includes(ql))
      );
    }).slice(0, 8);
  }, [gq, garden, plants]);

  var gardenData = useMemo(function () {
    if (garden.length === 0) return { ixs: [], insects: [], shared: [], types: [] };
    var gixs = interactions.filter(function (x) { return garden.indexOf(x.pI) !== -1; });
    var insIds = Array.from(new Set(gixs.map(function (x) { return x.iI; })));
    var ins = insIds.map(function (id) { return insects.find(function (i) { return i.id === id; }); }).filter(Boolean);
    var sh = ins.filter(function (insect) {
      var lp = gixs.filter(function (x) { return x.iI === insect.id; }).map(function (x) { return x.pI; });
      return Array.from(new Set(lp)).length > 1;
    });
    var tps = Array.from(new Set(gixs.map(function (x) { return x.tp; })));
    return { ixs: gixs, insects: ins, shared: sh, types: tps };
  }, [garden, interactions, insects]);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>{t.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{t.sub}</p>
      </div>

      {/* Add plant search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input value={gq}
          onChange={function (e) { sGq(e.target.value); sGdrop(true); }}
          onFocus={function () { if (gq.length >= 1) sGdrop(true); }}
          placeholder={t.add}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', fontSize: 14, border: '1px solid var(--border)', borderRadius: gdrop && gardenSg.length > 0 ? '8px 8px 0 0' : '8px', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }} />
        <svg style={{ position: 'absolute', left: 11, top: 12, opacity: 0.3 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {gdrop && gq.length >= 1 && gardenSg.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, border: '1px solid #bbb', borderTop: '1px solid var(--border)', borderRadius: '0 0 8px 8px', background: 'var(--bg)', maxHeight: 300, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            {gardenSg.map(function (p, idx) {
              return (
                <div key={p.id} onClick={function () { if (garden.indexOf(p.id) === -1) setGarden(garden.concat([p.id])); sGq(''); sGdrop(false); }}
                  className="search-item">
                  <Thumb name={p.sci} sz={28} item={p} isPlant={true} />
                  <span style={{ flex: 1, fontSize: 13, fontStyle: 'italic', color: 'var(--text)' }}>
                    {p.sci} <span style={{ fontStyle: 'normal', fontSize: 11, color: 'var(--text2)' }}>{name(p)}</span>
                  </span>
                  <span style={{ fontSize: 16, color: '#2d7d46', fontWeight: 700 }}>+</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected plants */}
      {garden.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{garden.length} {t.plants}</span>
            <button onClick={function () { setGarden([]); }} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>{t.clear} ×</button>
          </div>
          <div className="garden-plants">
            {garden.map(function (pid) {
              var p = plants.find(function (pl) { return pl.id === pid; });
              if (!p) return null;
              return (
                <div key={pid} className="garden-chip">
                  <Thumb name={p.sci} sz={24} item={p} isPlant={true} />
                  <span style={{ fontSize: 12, fontWeight: 500, fontStyle: 'italic', color: 'var(--text)' }}>{name(p)}</span>
                  <button onClick={function () { setGarden(garden.filter(function (g) { return g !== pid; })); }}
                    style={{ fontSize: 14, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats + graph */}
      {garden.length >= 2 && gardenData.insects.length > 0 && (
        <div>
          <div className="garden-stats">
            {[[gardenData.insects.length, t.stats, '#b8860b'], [gardenData.shared.length, t.shared, '#e67e22'], [gardenData.types.length, t.types, '#2874a6']].map(function (s, i) {
              return (
                <div key={i} className="garden-stat" style={{ background: s[2] + '0a', border: '1px solid ' + s[2] + '22' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s[2] }}>{s[0]}</div>
                  <div style={{ fontSize: 11, color: s[2], fontWeight: 500 }}>{s[1]}</div>
                </div>
              );
            })}
          </div>
          <GardenGraph
            plants={garden.map(function (pid) { return plants.find(function (p) { return p.id === pid; }); }).filter(Boolean)}
            insects={gardenData.insects}
            ixs={gardenData.ixs}
            shared={gardenData.shared}
            lang={lang}
            onSel={onSelect}
          />
        </div>
      )}

      {garden.length < 2 && (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text2)' }}>
          <p style={{ fontSize: 14, margin: 0 }}>{t.empty}</p>
        </div>
      )}
    </div>
  );
}
