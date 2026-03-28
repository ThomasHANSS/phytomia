import { useState, useMemo, useRef, useEffect } from 'react';
import Thumb from './Thumb';

var L = {
  fr: { ph: "Nom latin, français ou anglais…", noR: "Aucun résultat.", plant: "Plante", insect: "Insecte", matchEN: "anglais", matchFR: "français", matchFamily: "famille" },
  en: { ph: "Latin, French or English name…", noR: "No results.", plant: "Plant", insect: "Insect", matchEN: "English", matchFR: "French", matchFamily: "family" },
};

function searchAll(plants, insects, q) {
  if (q.length < 1) return [];
  var ql = q.toLowerCase(), results = [];
  function score(item, isPlant) {
    var m = [];
    if (item.sci.toLowerCase().includes(ql)) m.push({ f: 'matchLatin', t: item.sci, p: item.sci.toLowerCase().startsWith(ql) ? 0 : 1 });
    var fr = item.common ? item.common.fr : ''; var en = item.common ? item.common.en : '';
    if (fr && fr.toLowerCase().includes(ql)) m.push({ f: 'matchFR', t: fr, p: fr.toLowerCase().startsWith(ql) ? 0 : 1 });
    if (en && en.toLowerCase().includes(ql)) m.push({ f: 'matchEN', t: en, p: en.toLowerCase().startsWith(ql) ? 0 : 1 });
    if (item.family && item.family.toLowerCase().includes(ql)) m.push({ f: 'matchFamily', t: item.family, p: 2 });
    if (item.order && item.order.toLowerCase().includes(ql)) m.push({ f: 'matchFamily', t: item.order, p: 2 });
    if (m.length > 0) { m.sort(function (a, b) { return a.p - b.p; }); results.push({ item: item, isPlant: isPlant, mf: m[0].f, mt: m[0].t, pr: m[0].p }); }
  }
  plants.forEach(function (p) { score(p, true); });
  insects.forEach(function (i) { score(i, false); });
  results.sort(function (a, b) { return a.pr - b.pr; });
  return results.slice(0, 12);
}

function hl(text, q) {
  if (!q || q.length < 1) return text;
  var idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (<span>{text.slice(0, idx)}<strong className="highlight">{text.slice(idx, idx + q.length)}</strong>{text.slice(idx + q.length)}</span>);
}

export default function SearchBar(props) {
  var plants = props.plants, insects = props.insects, lang = props.lang, onSelect = props.onSelect;
  var t = L[lang] || L.fr;
  var _q = useState(''), q = _q[0], sQ = _q[1];
  var _d = useState(false), drop = _d[0], sDrop = _d[1];
  var _h = useState(-1), hi = _h[0], sHi = _h[1];
  var iRef = useRef(null), dRef = useRef(null);

  var sg = useMemo(function () { return searchAll(plants, insects, q.trim()); }, [q, plants, insects]);
  useEffect(function () { sHi(-1); }, [q]);
  useEffect(function () {
    var handler = function (e) { if (dRef.current && !dRef.current.contains(e.target) && e.target !== iRef.current) sDrop(false); };
    document.addEventListener('mousedown', handler);
    return function () { document.removeEventListener('mousedown', handler); };
  }, []);

  function go(id) { onSelect(id); sQ(''); sDrop(false); }
  function onK(e) {
    if (!drop || sg.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sHi(function (i) { return Math.min(i + 1, sg.length - 1); }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sHi(function (i) { return Math.max(i - 1, 0); }); }
    else if (e.key === 'Enter' && hi >= 0) { e.preventDefault(); go(sg[hi].item.id); }
    else if (e.key === 'Escape') { sDrop(false); }
  }

  var name = function (item) { return item.common ? item.common[lang] || item.common.fr : ''; };

  return (
    <div className="search-wrap">
      <input ref={iRef} value={q}
        onChange={function (e) { sQ(e.target.value); sDrop(true); }}
        onFocus={function () { if (q.length >= 1) sDrop(true); }}
        onKeyDown={onK} placeholder={t.ph}
        className={'search-input' + (drop && sg.length > 0 ? ' open' : '')} />
      <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
      {q.length > 0 && (<button className="search-clear" onClick={function () { sQ(''); sDrop(false); }}>×</button>)}

      {drop && q.length >= 1 && (
        <div ref={dRef} className="search-drop">
          {sg.length === 0 && q.length >= 2 && (<div style={{ padding: 16, fontSize: 14, color: 'var(--text2)' }}>{t.noR}</div>)}
          {sg.map(function (s, idx) {
            var isH = idx === hi;
            var tyC = s.isPlant ? '#2d7d46' : '#b8860b';
            return (
              <div key={s.item.id} onClick={function () { go(s.item.id); }}
                onMouseEnter={function () { sHi(idx); }}
                className={'search-item' + (isH ? ' active' : '')}>
                <Thumb name={s.item.sci} sz={36} />
                <span className="badge-type" style={{ background: tyC + '14', color: tyC }}>{s.isPlant ? t.plant : t.insect}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, fontStyle: 'italic', color: 'var(--text)' }}>
                    {s.mf === 'matchLatin' ? hl(s.item.sci, q) : s.item.sci}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 6 }}>
                    {s.mf === 'matchFR' ? hl(name(s.item), q) : name(s.item)}
                  </span>
                  {s.mf === 'matchEN' && lang === 'fr' && s.item.common && (
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.matchEN}: {hl(s.item.common.en, q)}</div>
                  )}
                  {s.mf === 'matchFamily' && (
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.matchFamily}: {hl(s.mt, q)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
