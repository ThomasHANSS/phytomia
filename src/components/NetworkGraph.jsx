import { useState, useMemo } from 'react';
import { NodeImg } from './Thumb';
import { TYPES, FAMILIES } from '../utils/types';

export default function NetworkGraph(props) {
  var center = props.center, partners = props.partners, ixs = props.ixs, lang = props.lang, onSel = props.onSel, plants = props.plants;
  var isP = !!plants.find(function (p) { return p.id === center.id; });

  // Sort interactions by observation count (most documented first)
  var sortedIxs = useMemo(function () {
    return ixs.slice().sort(function (a, b) {
      var na = a.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0);
      var nb = b.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0);
      return nb - na;
    });
  }, [ixs]);

  // Determine max visible (slider)
  var total = partners.length;
  var defaultShow = Math.min(total, 30);
  var _v = useState(defaultShow), maxShow = _v[0], setMaxShow = _v[1];

  // Reset when species changes
  useMemo(function () { setMaxShow(Math.min(total, 30)); }, [center.id, total]);

  // Get visible partners based on sorted interactions
  var visibleData = useMemo(function () {
    var shown = sortedIxs.slice(0, maxShow);
    var partnerIds = new Set();
    shown.forEach(function (ix) {
      partnerIds.add(isP ? ix.iI : ix.pI);
    });
    var vPartners = partners.filter(function (p) { return partnerIds.has(p.id); });
    return { partners: vPartners, ixs: shown };
  }, [sortedIxs, maxShow, partners, isP]);

  var vPartners = visibleData.partners;
  var vIxs = visibleData.ixs;
  var n = vPartners.length;

  if (n === 0) return null;

  // Dynamic sizing based on number of nodes
  var R = n <= 10 ? 140 : n <= 20 ? 160 : n <= 30 ? 180 : 200;
  var cx = 340, cy = R + 60;
  var W = 680, H = cy + R + 80;
  var nodeR = n <= 10 ? 22 : n <= 20 ? 18 : n <= 30 ? 15 : 12;
  var fontSize = n <= 15 ? 9.5 : n <= 25 ? 8 : 7;

  var nodes = vPartners.map(function (p, i) {
    var a = (2 * Math.PI * i) / n - Math.PI / 2;
    return Object.assign({}, p, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  });

  var name = function (item) { return item.common ? item.common[lang] || item.sci : item.sci; };
  var shortSci = function (s) {
    if (s.length > 16) return s.split(' ')[0][0] + '. ' + s.split(' ').slice(1).join(' ');
    return s;
  };

  return (
    <div style={{ margin: '8px 0' }}>
      {/* Controls */}
      {total > 10 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>
            {lang === 'fr' ? 'Affichées' : 'Showing'}: <strong>{n}</strong> / {total}
          </span>
          <input type="range" min={Math.min(5, total)} max={total} value={maxShow}
            onChange={function (e) { setMaxShow(parseInt(e.target.value)); }}
            style={{ width: 140, accentColor: isP ? '#2d7d46' : '#b8860b' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={function () { setMaxShow(Math.max(5, maxShow - 5)); }}
              style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>−</button>
            <button onClick={function () { setMaxShow(Math.min(total, maxShow + 5)); }}
              style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>+</button>
            {maxShow < total && (
              <button onClick={function () { setMaxShow(total); }}
                style={{ height: 28, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', fontSize: 10, color: 'var(--text2)' }}>
                {lang === 'fr' ? 'Tout' : 'All'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG Graph */}
      <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
        {vIxs.map(function (ix, idx) {
          var nd = nodes.find(function (n2) { return isP ? n2.id === ix.iI : n2.id === ix.pI; });
          if (!nd) return null;
          var tp = TYPES[ix.tp] || TYPES.folivorie;
          var fam = FAMILIES[tp.fam];
          var col = fam.color;
          var nObs = ix.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0);
          var op = nObs > 50 ? 0.85 : nObs > 10 ? 0.6 : 0.35;
          var mx2 = (cx + nd.x) / 2, my2 = (cy + nd.y) / 2;
          var dx = nd.x - cx, dy = nd.y - cy, len = Math.sqrt(dx * dx + dy * dy) || 1;
          var off = 16 * (idx % 2 === 0 ? 1 : -1);
          var cpx = mx2 + (-dy / len) * off, cpy = my2 + (dx / len) * off;
          var tmx = 0.25 * cx + 0.5 * cpx + 0.25 * nd.x, tmy = 0.25 * cy + 0.5 * cpy + 0.25 * nd.y;
          return (
            <g key={idx}>
              <path d={'M' + cx + ',' + cy + ' Q' + cpx + ',' + cpy + ' ' + nd.x + ',' + nd.y}
                fill="none" stroke={col} strokeWidth={tp.w} strokeDasharray={tp.dash}
                opacity={op} strokeLinecap="round" />
              {n <= 40 && (
                <g transform={'translate(' + tmx + ',' + tmy + ')'}>
                  <circle r={5} fill="var(--bg)" opacity={0.85} />
                  <path d={tp.icon} fill="none" stroke={col} strokeWidth={1.1} strokeLinecap="round" opacity={Math.min(1, op + 0.2)} />
                </g>
              )}
            </g>
          );
        })}
        {nodes.map(function (nd) {
          var col2 = plants.find(function (p) { return p.id === nd.id; }) ? '#2d7d46' : '#b8860b';
          var cid = 'c-' + nd.id;
          return (
            <g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}>
              <circle cx={nd.x} cy={nd.y} r={nodeR + 3} fill={col2} opacity={0.08} />
              <circle cx={nd.x} cy={nd.y} r={nodeR} fill="var(--bg)" stroke={col2} strokeWidth={1.3} />
              <clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={nodeR - 2} /></clipPath>
              <NodeImg name={nd.sci} x={nd.x} y={nd.y} r={nodeR - 2} clipId={cid} />
              {n <= 50 && (
                <text x={nd.x} y={nd.y + nodeR + 11} textAnchor="middle"
                  style={{ fontSize: fontSize, fontWeight: 500, fontStyle: 'italic', fill: 'var(--text)' }}>
                  {shortSci(nd.sci)}
                </text>
              )}
              {n <= 30 && (
                <text x={nd.x} y={nd.y + nodeR + 11 + fontSize + 1} textAnchor="middle"
                  style={{ fontSize: fontSize - 1, fill: 'var(--text2)' }}>
                  {name(nd)}
                </text>
              )}
            </g>
          );
        })}
        <g>
          <circle cx={cx} cy={cy} r={36} fill={isP ? '#2d7d46' : '#b8860b'} opacity={0.1} />
          <circle cx={cx} cy={cy} r={32} fill="var(--bg)" stroke={isP ? '#2d7d46' : '#b8860b'} strokeWidth={2.5} />
          <clipPath id="cc"><circle cx={cx} cy={cy} r={29} /></clipPath>
          <NodeImg name={center.sci} x={cx} y={cy} r={29} clipId="cc" />
        </g>
      </svg>

      {/* Legend */}
      <div className="graph-legend">
        {Object.entries(TYPES).filter(function (e) { return vIxs.some(function (ix) { return ix.tp === e[0]; }); }).map(function (e) {
          var tp = e[1]; var fam = FAMILIES[tp.fam];
          return (
            <div key={e[0]} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="22" height="10"><line x1="0" y1="5" x2="15" y2="5" stroke={fam.color} strokeWidth={tp.w} strokeDasharray={tp.dash} strokeLinecap="round" /><g transform="translate(19,5) scale(0.45)"><path d={tp.icon} fill="none" stroke={fam.color} strokeWidth={1.5} strokeLinecap="round" /></g></svg>
              <span style={{ fontSize: 9, color: fam.color, fontWeight: 500 }}>{tp[lang]}</span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', margin: 2 }}>
        {lang === 'fr' ? 'Épaisseur = volume d\'observations · Curseur = nombre d\'interactions affichées · Cliquez un nœud pour naviguer' : 'Thickness = observation volume · Slider = interactions shown · Click a node to navigate'}
      </p>
    </div>
  );
}
