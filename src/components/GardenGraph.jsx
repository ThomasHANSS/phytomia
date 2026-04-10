import { useState, useRef, useCallback } from 'react';
import { TYPES, FAMILIES } from '../utils/types';

export default function GardenGraph(props) {
  var plants = props.plants, insects = props.insects, ixs = props.ixs, lang = props.lang, onSel = props.onSel, shared = props.shared;
  var W = 700, pad = 60;
  var sharedIds = shared.map(function (s) { return s.id; });

  // Limit insects shown: shared first, then top by connection count, max 40
  var MAX_INSECTS = 40;
  var _showAll = useState(false), showAll = _showAll[0], setShowAll = _showAll[1];
  var ixCountMap = {};
  ixs.forEach(function (ix) { ixCountMap[ix.iI] = (ixCountMap[ix.iI] || 0) + 1; });
  var sortedInsects = insects.slice().sort(function (a, b) {
    var aShared = sharedIds.indexOf(a.id) !== -1 ? 1 : 0;
    var bShared = sharedIds.indexOf(b.id) !== -1 ? 1 : 0;
    if (aShared !== bShared) return bShared - aShared;
    return (ixCountMap[b.id] || 0) - (ixCountMap[a.id] || 0);
  });
  var visibleInsects = showAll ? sortedInsects : sortedInsects.slice(0, MAX_INSECTS);
  var visibleIds = new Set(visibleInsects.map(function (i) { return i.id; }));
  var hiddenCount = insects.length - visibleInsects.length;

  var nP = plants.length, nI = visibleInsects.length;
  var spacing = Math.max(24, Math.min(36, 800 / nI));
  var H = Math.max(300, Math.max(nP, nI) * spacing + 80);
  var pX = pad + 30, iX = W - pad - 30;
  var pNodes = plants.map(function (p, i) { var yy = nP === 1 ? H / 2 : 40 + i * ((H - 80) / Math.max(nP - 1, 1)); return Object.assign({}, p, { x: pX, y: yy }); });
  var iNodes = visibleInsects.map(function (ins, i) { var yy = nI === 1 ? H / 2 : 40 + i * ((H - 80) / Math.max(nI - 1, 1)); return Object.assign({}, ins, { x: iX, y: yy }); });
  var name = function (item) { return item.common ? item.common[lang] || item.sci : item.sci; };
  var shortSci = function (s) { return s.length > 20 ? s.split(' ')[0][0] + '. ' + s.split(' ').slice(1).join(' ') : s; };

  var svgRef = useRef(null);

  var exportGraph = useCallback(function (format) {
    var svgEl = svgRef.current;
    if (!svgEl) return;

    // Clone SVG and resolve CSS variables
    var clone = svgEl.cloneNode(true);
    var cs = getComputedStyle(document.documentElement);
    var cssVars = { '--bg': '#ffffff', '--bg3': '#f5f5f5', '--text': '#1a1a1a', '--text2': '#666666', '--text3': '#999999' };
    Object.keys(cssVars).forEach(function (v) {
      var val = cs.getPropertyValue(v).trim() || cssVars[v];
      cssVars[v] = val;
    });

    // Replace CSS variables in all elements
    var allEls = clone.querySelectorAll('*');
    allEls.forEach(function (el) {
      ['fill', 'stroke'].forEach(function (attr) {
        var val = el.getAttribute(attr);
        if (val && val.indexOf('var(') !== -1) {
          var resolved = val.replace(/var\(([^)]+)\)/g, function (m, v) { return cssVars[v.trim()] || '#000'; });
          el.setAttribute(attr, resolved);
        }
      });
      if (el.style) {
        var style = el.getAttribute('style') || '';
        if (style.indexOf('var(') !== -1) {
          var newStyle = style.replace(/var\(([^)]+)\)/g, function (m, v) { return cssVars[v.trim()] || '#000'; });
          el.setAttribute('style', newStyle);
        }
        if (el.style.fill && el.style.fill.indexOf('var(') !== -1) {
          el.style.fill = el.style.fill.replace(/var\(([^)]+)\)/g, function (m, v) { return cssVars[v.trim()] || '#000'; });
        }
      }
    });

    // Add white background
    var vb = clone.getAttribute('viewBox').split(' ');
    var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', vb[2]);
    bgRect.setAttribute('height', vb[3]);
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);

    var svgData = new XMLSerializer().serializeToString(clone);

    if (format === 'svg') {
      var blob = new Blob([svgData], { type: 'image/svg+xml' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'phytomia-jardin.svg';
      a.click(); URL.revokeObjectURL(url);
      return;
    }

    // PNG export at 2x
    var scale = 2;
    var w = parseInt(vb[2]) * scale;
    var h = parseInt(vb[3]) * scale;
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, w, h);
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'phytomia-jardin.png';
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  return (
    <div style={{ margin: '8px 0' }}>
      <svg ref={svgRef} viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
        {ixs.filter(function (ix) { return visibleIds.has(ix.iI); }).map(function (ix, idx) {
          var pn = pNodes.find(function (n) { return n.id === ix.pI; }); var inode = iNodes.find(function (n) { return n.id === ix.iI; });
          if (!pn || !inode) return null; var tp = TYPES[ix.tp] || TYPES.folivorie; var col = FAMILIES[tp.fam].color;
          var nObs = ix.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0); var op = nObs > 50 ? 0.7 : nObs > 10 ? 0.45 : 0.25;
          var cpx = (pn.x + inode.x) / 2;
          return (<path key={idx} d={'M' + (pn.x + 22) + ',' + pn.y + ' C' + cpx + ',' + pn.y + ' ' + cpx + ',' + inode.y + ' ' + (inode.x - 22) + ',' + inode.y} fill="none" stroke={col} strokeWidth={tp.w * 0.8} strokeDasharray={tp.dash} opacity={op} strokeLinecap="round" />);
        })}
        {pNodes.map(function (nd) { var cid = 'gp-' + nd.id;
          return (<g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}><circle cx={nd.x} cy={nd.y} r={22} fill="var(--bg)" stroke="#10b981" strokeWidth={2} /><clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={19} /></clipPath><circle cx={nd.x} cy={nd.y} r={19} fill="var(--bg3)" clipPath={"url(#" + cid + ")"} /><text x={nd.x + 28} y={nd.y - 3} style={{ fontSize: 9, fontWeight: 600, fontStyle: 'italic', fill: 'var(--text)' }}>{nd.sci}</text><text x={nd.x + 28} y={nd.y + 9} style={{ fontSize: 9, fill: 'var(--text2)' }}>{name(nd)}</text>{nd.threat && ['CR','EN','VU'].indexOf(nd.threat) !== -1 && (<circle cx={nd.x - 28} cy={nd.y} r={4} fill={nd.threat === 'CR' ? '#ef4444' : nd.threat === 'EN' ? '#fb923c' : '#f39c12'} opacity={0.8}><title>{nd.threat}</title></circle>)}</g>);
        })}
        {iNodes.map(function (nd) { var cid = 'gi-' + nd.id; var sh = sharedIds.indexOf(nd.id) !== -1; var r = sh ? 19 : 16;
          return (<g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}>{sh && (<circle cx={nd.x} cy={nd.y} r={r + 4} fill="#f59e0b" opacity={0.12} />)}<circle cx={nd.x} cy={nd.y} r={r} fill="var(--bg)" stroke={sh ? '#f59e0b' : '#f59e0b88'} strokeWidth={sh ? 2 : 1.2} /><clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={r - 3} /></clipPath><circle cx={nd.x} cy={nd.y} r={r - 3} fill="var(--bg3)" clipPath={"url(#" + cid + ")"} /><text x={nd.x - 28} y={nd.y - 3} textAnchor="end" style={{ fontSize: 9, fontWeight: sh ? 600 : 400, fontStyle: 'italic', fill: 'var(--text)' }}>{shortSci(nd.sci)}</text><text x={nd.x - 28} y={nd.y + 9} textAnchor="end" style={{ fontSize: 9, fill: sh ? '#f59e0b' : 'var(--text2)' }}>{name(nd)}{sh ? ' ★' : ''}</text>{nd.threat && ['CR','EN','VU'].indexOf(nd.threat) !== -1 && (<circle cx={nd.x + 28} cy={nd.y} r={4} fill={nd.threat === 'CR' ? '#ef4444' : nd.threat === 'EN' ? '#fb923c' : '#f39c12'} opacity={0.8}><title>{nd.threat}</title></circle>)}</g>);
        })}
      </svg>
      {(hiddenCount > 0 || showAll) && insects.length > MAX_INSECTS && (
        <div style={{ textAlign: 'center', margin: '6px 0' }}>
          <button onClick={function () { setShowAll(!showAll); }}
            style={{ fontSize: 11, padding: '4px 12px', color: '#f59e0b', background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 6, cursor: 'pointer' }}>
            {showAll
              ? (lang === 'fr' ? '▲ Afficher les ' + MAX_INSECTS + ' principaux' : '▲ Show top ' + MAX_INSECTS)
              : (lang === 'fr' ? '▼ + ' + hiddenCount + ' insectes masqués' : '▼ + ' + hiddenCount + ' hidden insects')}
          </button>
        </div>
      )}
      <div className="graph-legend">
        {Object.entries(TYPES).filter(function (e) { return ixs.some(function (ix) { return ix.tp === e[0]; }); }).map(function (e) { var tp = e[1]; var fam = FAMILIES[tp.fam];
          return (<div key={e[0]} style={{ display: 'flex', alignItems: 'center', gap: 3 }}><svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke={fam.color} strokeWidth={tp.w * 0.7} strokeDasharray={tp.dash} strokeLinecap="round" /></svg><span style={{ fontSize: 9, color: fam.color, fontWeight: 500 }}>{tp[lang]}</span></div>);
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>★</span><span style={{ fontSize: 9, color: '#f59e0b' }}>{lang === 'fr' ? 'Partagé' : 'Shared'}</span></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '8px 0' }}>
        <button onClick={function () { exportGraph('png'); }}
          style={{ fontSize: 11, padding: '5px 12px', color: '#10b981', background: '#10b98110', border: '1px solid #10b98130', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PNG (x2)
        </button>
        <button onClick={function () { exportGraph('svg'); }}
          style={{ fontSize: 11, padding: '5px 12px', color: '#555', background: '#55555510', border: '1px solid #55555530', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          SVG
        </button>
      </div>
      <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', margin: 2 }}>
        {lang === 'fr' ? 'Les insectes reliés à plusieurs plantes sont marqués ★' : 'Insects linked to multiple plants are marked ★'}
      </p>
    </div>
  );
}
