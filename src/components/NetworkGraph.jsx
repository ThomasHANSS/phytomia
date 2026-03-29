import { useState, useMemo } from 'react';
import { NodeImg } from './Thumb';
import Thumb from './Thumb';
import { TYPES, FAMILIES } from '../utils/types';

function shortSci(s) { return s.length > 18 ? s.split(' ')[0][0] + '. ' + s.split(' ').slice(1).join(' ') : s; }
function getName(item, lang) { return item.common ? item.common[lang] || item.sci : item.sci; }
function obsCount(ix) { return ix.src.reduce(function (s, sr) { return s + (sr.n || 1); }, 0); }

/* ══════════════════════════════════════════
   LEVEL 1 — Summary arcs by interaction family
   ══════════════════════════════════════════ */
function SummaryView(props) {
  var center = props.center, ixs = props.ixs, partners = props.partners, plants = props.plants;
  var isP = props.isP, lang = props.lang, onSelectFamily = props.onSelectFamily, onSel = props.onSel;

  var groups = useMemo(function () {
    var map = {};
    ixs.forEach(function (ix) {
      var tp = TYPES[ix.tp]; if (!tp) return;
      var fam = tp.fam;
      if (!map[fam]) map[fam] = { key: fam, ixs: [], pids: new Set(), totalObs: 0 };
      map[fam].ixs.push(ix);
      map[fam].pids.add(isP ? ix.iI : ix.pI);
      map[fam].totalObs += obsCount(ix);
    });
    return Object.values(map).sort(function (a, b) { return b.pids.size - a.pids.size; });
  }, [ixs, isP]);

  var totalPartners = partners.length;
  var cx = 250, cy = 250, outerR = 185, innerR = 95;

  var arcs = useMemo(function () {
    var startAngle = -Math.PI / 2;
    var gap = 0.05;
    var totalGap = gap * groups.length;
    var available = 2 * Math.PI - totalGap;
    return groups.map(function (g) {
      var proportion = g.pids.size / Math.max(1, totalPartners);
      var sweep = Math.max(0.08, proportion * available);
      var arc = { group: g, start: startAngle, end: startAngle + sweep };
      startAngle += sweep + gap;
      return arc;
    });
  }, [groups, totalPartners]);

  function arcPath(start, end, r1, r2) {
    var cs = Math.cos(start), ss = Math.sin(start), ce = Math.cos(end), se = Math.sin(end);
    var large = end - start > Math.PI ? 1 : 0;
    return 'M' + (cx+r1*cs) + ',' + (cy+r1*ss) +
      ' L' + (cx+r2*cs) + ',' + (cy+r2*ss) +
      ' A' + r2 + ',' + r2 + ' 0 ' + large + ' 1 ' + (cx+r2*ce) + ',' + (cy+r2*se) +
      ' L' + (cx+r1*ce) + ',' + (cy+r1*se) +
      ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 0 ' + (cx+r1*cs) + ',' + (cy+r1*ss) + 'Z';
  }

  function topPartners(arc) {
    var g = arc.group;
    var sorted = g.ixs.slice().sort(function (a, b) { return obsCount(b) - obsCount(a); });
    var seen = new Set(); var top = [];
    for (var i = 0; i < sorted.length && top.length < 3; i++) {
      var pid = isP ? sorted[i].iI : sorted[i].pI;
      if (!seen.has(pid)) { seen.add(pid); var p = partners.find(function (pp) { return pp.id === pid; }); if (p) top.push(p); }
    }
    var midA = (arc.start + arc.end) / 2;
    var pR = outerR + 30;
    return top.map(function (p, idx) {
      var a = midA + (idx - 1) * 0.14;
      return { species: p, x: cx + pR * Math.cos(a), y: cy + pR * Math.sin(a) };
    });
  }

  return (
    <svg viewBox="0 0 500 500" width="100%" style={{ display: 'block' }}>
      {arcs.map(function (arc) {
        var fam = FAMILIES[arc.group.key]; var col = fam ? fam.color : '#888';
        var midA = (arc.start + arc.end) / 2;
        var lR = (innerR + outerR) / 2;
        var lx = cx + lR * Math.cos(midA), ly = cy + lR * Math.sin(midA);
        var sweep = arc.end - arc.start;
        return (
          <g key={arc.group.key} style={{ cursor: 'pointer' }} onClick={function () { onSelectFamily(arc.group.key); }}>
            <path d={arcPath(arc.start, arc.end, innerR, outerR)} fill={col} opacity={0.12} stroke={col} strokeWidth={2} />
            <path d={arcPath(arc.start, arc.end, innerR + 2, outerR - 2)} fill={col} opacity={0} stroke="none">
              <animate attributeName="opacity" from="0" to="0.08" dur="0.2s" begin="mouseover" fill="freeze" />
              <animate attributeName="opacity" from="0.08" to="0" dur="0.2s" begin="mouseout" fill="freeze" />
            </path>
            {sweep > 0.3 && (<g><text x={lx} y={ly - 6} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: col }}>{arc.group.pids.size}</text><text x={lx} y={ly + 8} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 500, fill: col }}>{fam ? fam[lang] : ''}</text></g>)}
            {sweep <= 0.3 && sweep > 0.12 && (<text x={lx} y={ly + 4} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: col }}>{arc.group.pids.size}</text>)}
            {sweep > 0.25 && topPartners(arc).map(function (tp) {
              var cid = 'tp-' + tp.species.id;
              return (<g key={tp.species.id} style={{ cursor: 'pointer' }} onClick={function (e) { e.stopPropagation(); onSel(tp.species.id); }}>
                <circle cx={tp.x} cy={tp.y} r={13} fill="var(--bg)" stroke={col} strokeWidth={1} />
                <clipPath id={cid}><circle cx={tp.x} cy={tp.y} r={11} /></clipPath>
                <NodeImg name={tp.species.sci} x={tp.x} y={tp.y} r={11} clipId={cid} />
              </g>);
            })}
          </g>
        );
      })}
      <g>
        <circle cx={cx} cy={cy} r={innerR - 6} fill="var(--bg)" />
        <circle cx={cx} cy={cy} r={48} fill={isP ? '#2d7d46' : '#b8860b'} opacity={0.08} />
        <circle cx={cx} cy={cy} r={40} fill="var(--bg)" stroke={isP ? '#2d7d46' : '#b8860b'} strokeWidth={2.5} />
        <clipPath id="cc-s"><circle cx={cx} cy={cy} r={36} /></clipPath>
        <NodeImg name={center.sci} x={cx} y={cy} r={36} clipId="cc-s" />
        <text x={cx} y={cy + 54} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fontStyle: 'italic', fill: 'var(--text)' }}>{shortSci(center.sci)}</text>
        <text x={cx} y={cy + 66} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text2)' }}>{getName(center, lang)}</text>
        <text x={cx} y={cy + 80} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: 'var(--text3)' }}>{totalPartners} {lang === 'fr' ? 'espèces liées' : 'linked species'}</text>
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════
   LEVEL 2 — Top 20 graph + full scrollable list
   ══════════════════════════════════════════ */
function FamilyDetail(props) {
  var center = props.center, familyKey = props.familyKey, ixs = props.ixs, partners = props.partners;
  var plants = props.plants, isP = props.isP, lang = props.lang, onSel = props.onSel, onBack = props.onBack;
  var _showAll = useState(false), showAll = _showAll[0], setShowAll = _showAll[1];

  var fam = FAMILIES[familyKey]; var famColor = fam ? fam.color : '#888';

  var famData = useMemo(function () {
    var famIxs = ixs.filter(function (ix) { var tp = TYPES[ix.tp]; return tp && tp.fam === familyKey; });
    var obsMap = {};
    famIxs.forEach(function (ix) { var pid = isP ? ix.iI : ix.pI; obsMap[pid] = (obsMap[pid] || 0) + obsCount(ix); });
    var sorted = Object.keys(obsMap).map(function (pid) {
      var p = partners.find(function (pp) { return pp.id === pid; });
      return p ? Object.assign({}, p, { obs: obsMap[pid] }) : null;
    }).filter(Boolean).sort(function (a, b) { return b.obs - a.obs; });
    return { ixs: famIxs, partners: sorted };
  }, [ixs, partners, familyKey, isP]);

  var top20 = famData.partners.slice(0, 20);
  var rest = famData.partners.slice(20);
  var maxObs = top20[0] ? top20[0].obs : 1;
  var cx = 250, cy = 250;
  var n = top20.length;

  var nodes = top20.map(function (p, i) {
    var ratio = Math.log(p.obs + 1) / Math.log(maxObs + 1);
    var minR = 65, maxR = 180;
    var dist = maxR - ratio * (maxR - minR);
    var a = (2 * Math.PI * i) / n - Math.PI / 2;
    return Object.assign({}, p, { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) });
  });

  var nodeR = n <= 10 ? 18 : n <= 15 ? 15 : 12;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', cursor: 'pointer', color: 'var(--text2)' }}>
          ← {lang === 'fr' ? 'Vue globale' : 'Overview'}
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: famColor }}>{fam ? fam[lang] : familyKey}</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{famData.partners.length} {lang === 'fr' ? 'espèces' : 'species'}</span>
      </div>

      {/* Top 20 radial graph */}
      <svg viewBox="0 0 500 500" width="100%" style={{ display: 'block' }}>
        {famData.ixs.filter(function (ix) {
          var pid = isP ? ix.iI : ix.pI;
          return top20.some(function (t) { return t.id === pid; });
        }).map(function (ix, idx) {
          var pid = isP ? ix.iI : ix.pI;
          var nd = nodes.find(function (nn) { return nn.id === pid; }); if (!nd) return null;
          var tp = TYPES[ix.tp] || TYPES.folivorie; var col = FAMILIES[tp.fam] ? FAMILIES[tp.fam].color : '#888';
          var nObs = obsCount(ix);
          var op = nObs > 50 ? 0.7 : nObs > 10 ? 0.4 : 0.15;
          var sw = nObs > 100 ? 2.5 : nObs > 20 ? 1.8 : 1;
          var mx = (cx + nd.x) / 2, my = (cy + nd.y) / 2;
          var dx = nd.x - cx, dy = nd.y - cy, len = Math.sqrt(dx*dx+dy*dy) || 1;
          var off = 14 * (idx % 2 === 0 ? 1 : -1);
          var cpx = mx + (-dy/len)*off, cpy = my + (dx/len)*off;
          return (<path key={idx} d={'M'+cx+','+cy+' Q'+cpx+','+cpy+' '+nd.x+','+nd.y} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={tp.dash} opacity={op} strokeLinecap="round" />);
        })}
        {nodes.map(function (nd, i) {
          var col2 = plants.find(function (p) { return p.id === nd.id; }) ? '#2d7d46' : '#b8860b';
          var cid = 'fd-' + nd.id; var r = i < 3 ? nodeR + 3 : nodeR;
          return (
            <g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}>
              <circle cx={nd.x} cy={nd.y} r={r + 2} fill={col2} opacity={0.06} />
              <circle cx={nd.x} cy={nd.y} r={r} fill="var(--bg)" stroke={col2} strokeWidth={1.2} />
              <clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={r - 2} /></clipPath>
              <NodeImg name={nd.sci} x={nd.x} y={nd.y} r={r - 2} clipId={cid} />
              <text x={nd.x} y={nd.y + r + 10} textAnchor="middle" style={{ fontSize: 8, fontWeight: i < 3 ? 600 : 400, fontStyle: 'italic', fill: 'var(--text)' }}>{shortSci(nd.sci)}</text>
              {n <= 15 && (<text x={nd.x} y={nd.y + r + 19} textAnchor="middle" style={{ fontSize: 7, fill: 'var(--text2)' }}>{getName(nd, lang)}</text>)}
              <text x={nd.x} y={nd.y - r - 4} textAnchor="middle" style={{ fontSize: 7, fontWeight: 600, fill: famColor }}>{nd.obs > 1 ? nd.obs + ' obs' : ''}</text>
            </g>
          );
        })}
        <g>
          <circle cx={cx} cy={cy} r={36} fill={isP ? '#2d7d46' : '#b8860b'} opacity={0.1} />
          <circle cx={cx} cy={cy} r={32} fill="var(--bg)" stroke={isP ? '#2d7d46' : '#b8860b'} strokeWidth={2.5} />
          <clipPath id="cc-d"><circle cx={cx} cy={cy} r={29} /></clipPath>
          <NodeImg name={center.sci} x={cx} y={cy} r={29} clipId="cc-d" />
        </g>
      </svg>

      {/* Legend */}
      <div className="graph-legend" style={{ marginTop: 4 }}>
        {Object.entries(TYPES).filter(function (e) { return e[1].fam === familyKey && famData.ixs.some(function(ix){return ix.tp===e[0];}); }).map(function (e) {
          var tp = e[1]; var fc = FAMILIES[tp.fam];
          return (<div key={e[0]} style={{ display: 'flex', alignItems: 'center', gap: 3 }}><svg width="22" height="10"><line x1="0" y1="5" x2="15" y2="5" stroke={fc.color} strokeWidth={tp.w} strokeDasharray={tp.dash} strokeLinecap="round" /></svg><span style={{ fontSize: 9, color: fc.color, fontWeight: 500 }}>{tp[lang]}</span></div>);
        })}
      </div>
      <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', margin: 2 }}>
        {lang === 'fr' ? 'Top 20 · Proximité = force du lien · Cliquez un nœud pour naviguer' : 'Top 20 · Proximity = link strength · Click a node to navigate'}
      </p>

      {/* Remaining species as scrollable list */}
      {rest.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={function () { setShowAll(!showAll); }}
            style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg2)', cursor: 'pointer', color: famColor, textAlign: 'center' }}>
            {showAll
              ? (lang === 'fr' ? 'Masquer' : 'Hide') + ' (' + rest.length + ')'
              : '+ ' + rest.length + ' ' + (lang === 'fr' ? 'autres espèces' : 'more species')}
          </button>
          {showAll && (
            <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 6, border: '1px solid var(--border)', borderRadius: 8, padding: '4px 0' }}>
              {rest.map(function (sp, i) {
                return (
                  <div key={sp.id} onClick={function () { onSel(sp.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', cursor: 'pointer', borderRadius: 6 }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = 'var(--bg2)'; }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 20, textAlign: 'right' }}>{i + 21}</span>
                    <Thumb name={sp.sci} sz={24} />
                    <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text)', flex: 1 }}>{sp.sci}</span>
                    <span style={{ fontSize: 10, color: 'var(--text2)' }}>{getName(sp, lang)}</span>
                    <span style={{ fontSize: 9, color: famColor, fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{sp.obs} obs</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN — Routes between levels
   ══════════════════════════════════════════ */
export default function NetworkGraph(props) {
  var center = props.center, partners = props.partners, ixs = props.ixs;
  var lang = props.lang, onSel = props.onSel, plants = props.plants;
  var isP = !!plants.find(function (p) { return p.id === center.id; });
  var _f = useState(null), selectedFamily = _f[0], setSelectedFamily = _f[1];

  useMemo(function () { setSelectedFamily(null); }, [center.id]);

  if (partners.length === 0) return null;

  if (selectedFamily) {
    return (<FamilyDetail center={center} familyKey={selectedFamily} ixs={ixs} partners={partners} plants={plants} isP={isP} lang={lang} onSel={onSel} onBack={function () { setSelectedFamily(null); }} />);
  }

  // Small species: skip summary, go direct to detail with "all" families
  if (partners.length <= 15) {
    // Group all as one pseudo-family for the detail view
    var allFams = {};
    ixs.forEach(function(ix) { var tp = TYPES[ix.tp]; if(tp) allFams[tp.fam] = true; });
    var mainFam = Object.keys(allFams)[0] || 'mutualisme';
    return (<FamilyDetail center={center} familyKey={mainFam} ixs={ixs} partners={partners} plants={plants} isP={isP} lang={lang} onSel={onSel} onBack={function(){}} />);
  }

  return (
    <div>
      <SummaryView center={center} ixs={ixs} partners={partners} plants={plants} isP={isP} lang={lang} onSelectFamily={setSelectedFamily} onSel={onSel} />
      <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', margin: '4px 0' }}>
        {lang === 'fr' ? 'Cliquez un arc pour explorer · Cliquez une vignette pour voir la fiche' : 'Click an arc to explore · Click a thumbnail for details'}
      </p>
    </div>
  );
}
