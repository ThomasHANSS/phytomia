import { useState, useMemo, useRef, useCallback } from 'react';
import { NodeImg } from './Thumb';
import { TYPES, FAMILIES } from '../utils/types';

export default function NetworkGraph(props) {
  var center = props.center, partners = props.partners, ixs = props.ixs, lang = props.lang, onSel = props.onSel, plants = props.plants;
  var isP = !!plants.find(function (p) { return p.id === center.id; });
  var svgRef = useRef(null);
  var _pan = useState({ x: 0, y: 0 }), pan = _pan[0], setPan = _pan[1];
  var _zoom = useState(1), zoom = _zoom[0], setZoom = _zoom[1];
  var _drag = useState(null), drag = _drag[0], setDrag = _drag[1];
  var n = partners.length;
  if (n === 0) return null;

  // Layout: distance from center = inverse of observation strength
  var nodes = useMemo(function () {
    var maxObs = 0;
    var ixMap = {};
    ixs.forEach(function (ix) {
      var pid = isP ? ix.iI : ix.pI;
      var nObs = ix.src.reduce(function (s, sr) { return s + (sr.n || 1); }, 0);
      ixMap[pid] = (ixMap[pid] || 0) + nObs;
      if (ixMap[pid] > maxObs) maxObs = ixMap[pid];
    });

    // Sort by strength for angular distribution (strongest near top)
    var sorted = partners.slice().sort(function (a, b) {
      return (ixMap[b.id] || 0) - (ixMap[a.id] || 0);
    });

    return sorted.map(function (p, i) {
      var strength = ixMap[p.id] || 1;
      var ratio = Math.log(strength + 1) / Math.log(maxObs + 1);
      // Strong links = close (minR), weak = far (maxR)
      var minR = 80, maxR = n <= 20 ? 200 : n <= 50 ? 260 : 320;
      var dist = maxR - ratio * (maxR - minR);
      var a = (2 * Math.PI * i) / n - Math.PI / 2;
      // Add slight jitter to avoid overlap
      var jitter = (i % 3 - 1) * 8;
      return Object.assign({}, p, {
        x: 350 + (dist + jitter) * Math.cos(a),
        y: 350 + (dist + jitter) * Math.sin(a),
        strength: strength,
        rank: i,
      });
    });
  }, [partners, ixs, isP, n]);

  var cx = 350, cy = 350;
  var W = 700, H = 700;
  var name = function (item) { return item.common ? item.common[lang] || item.sci : item.sci; };
  var shortSci = function (s) { return s.length > 16 ? s.split(' ')[0][0] + '. ' + s.split(' ').slice(1).join(' ') : s; };

  // Dynamic node size based on count
  var nodeR = n <= 15 ? 20 : n <= 30 ? 16 : n <= 60 ? 13 : 10;
  var showLabels = zoom > 0.6;
  var showIcons = n <= 50 || zoom > 1.2;

  // Mouse/touch handlers for pan
  var onMouseDown = useCallback(function (e) {
    if (e.target.closest('[data-node]')) return;
    e.preventDefault();
    var pt = e.touches ? e.touches[0] : e;
    setDrag({ startX: pt.clientX - pan.x, startY: pt.clientY - pan.y });
  }, [pan]);

  var onMouseMove = useCallback(function (e) {
    if (!drag) return;
    var pt = e.touches ? e.touches[0] : e;
    setPan({ x: pt.clientX - drag.startX, y: pt.clientY - drag.startY });
  }, [drag]);

  var onMouseUp = useCallback(function () { setDrag(null); }, []);

  var onWheel = useCallback(function (e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(function (z) { return Math.max(0.3, Math.min(4, z * delta)); });
  }, []);

  // Reset view
  var resetView = function () { setPan({ x: 0, y: 0 }); setZoom(1); };

  var transform = 'translate(' + pan.x + ',' + pan.y + ') scale(' + zoom + ')';

  return (
    <div style={{ margin: '8px 0' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>
          {n} {lang === 'fr' ? 'interactions' : 'interactions'}
        </span>
        <button onClick={function () { setZoom(function (z) { return Math.min(4, z * 1.3); }); }}
          style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        <button onClick={function () { setZoom(function (z) { return Math.max(0.3, z * 0.7); }); }}
          style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        <button onClick={resetView}
          style={{ height: 28, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', fontSize: 10, color: 'var(--text2)' }}>
          {lang === 'fr' ? 'Recentrer' : 'Reset'}
        </button>
      </div>

      {/* SVG */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: drag ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp}
        onWheel={onWheel}>
        <svg ref={svgRef} viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
          <g transform={transform}>
            {/* Links */}
            {ixs.map(function (ix, idx) {
              var nd = nodes.find(function (n2) { return isP ? n2.id === ix.iI : n2.id === ix.pI; });
              if (!nd) return null;
              var tp = TYPES[ix.tp] || TYPES.folivorie;
              var fam = FAMILIES[tp.fam]; var col = fam.color;
              var nObs = ix.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0);
              var op = nObs > 50 ? 0.8 : nObs > 10 ? 0.5 : 0.2;
              var sw = nObs > 100 ? 3 : nObs > 20 ? 2 : 1.2;
              return (
                <line key={idx} x1={cx} y1={cy} x2={nd.x} y2={nd.y}
                  stroke={col} strokeWidth={sw} strokeDasharray={tp.dash}
                  opacity={op} strokeLinecap="round" />
              );
            })}

            {/* Partner nodes */}
            {nodes.map(function (nd) {
              var col2 = plants.find(function (p) { return p.id === nd.id; }) ? '#2d7d46' : '#b8860b';
              var cid = 'c-' + nd.id;
              var r = nodeR + (nd.rank < 5 ? 3 : 0);
              return (
                <g key={nd.id} data-node="1" style={{ cursor: 'pointer' }} onClick={function (e) { e.stopPropagation(); onSel(nd.id); }}>
                  <circle cx={nd.x} cy={nd.y} r={r + 2} fill={col2} opacity={0.08} />
                  <circle cx={nd.x} cy={nd.y} r={r} fill="var(--bg)" stroke={col2} strokeWidth={1.2} />
                  <clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={r - 2} /></clipPath>
                  <NodeImg name={nd.sci} x={nd.x} y={nd.y} r={r - 2} clipId={cid} />
                  {showLabels && (
                    <text x={nd.x} y={nd.y + r + 10} textAnchor="middle"
                      style={{ fontSize: 8, fontWeight: 500, fontStyle: 'italic', fill: 'var(--text)', pointerEvents: 'none' }}>
                      {shortSci(nd.sci)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center node */}
            <g>
              <circle cx={cx} cy={cy} r={36} fill={isP ? '#2d7d46' : '#b8860b'} opacity={0.1} />
              <circle cx={cx} cy={cy} r={32} fill="var(--bg)" stroke={isP ? '#2d7d46' : '#b8860b'} strokeWidth={2.5} />
              <clipPath id="cc"><circle cx={cx} cy={cy} r={29} /></clipPath>
              <NodeImg name={center.sci} x={cx} y={cy} r={29} clipId="cc" />
            </g>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="graph-legend" style={{ marginTop: 6 }}>
        {Object.entries(TYPES).filter(function (e) { return ixs.some(function (ix) { return ix.tp === e[0]; }); }).map(function (e) {
          var tp = e[1]; var fam = FAMILIES[tp.fam];
          return (
            <div key={e[0]} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="22" height="10"><line x1="0" y1="5" x2="15" y2="5" stroke={fam.color} strokeWidth={tp.w} strokeDasharray={tp.dash} strokeLinecap="round" /></svg>
              <span style={{ fontSize: 9, color: fam.color, fontWeight: 500 }}>{tp[lang]}</span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', margin: 2 }}>
        {lang === 'fr' ? 'Proximité = force du lien · Molette = zoom · Glisser = déplacer · Cliquez un nœud pour naviguer' : 'Proximity = link strength · Scroll = zoom · Drag = pan · Click a node to navigate'}
      </p>
    </div>
  );
}
