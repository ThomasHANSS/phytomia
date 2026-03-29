import { TYPES, FAMILIES } from '../utils/types';

export default function GardenGraph(props) {
  var plants = props.plants, insects = props.insects, ixs = props.ixs, lang = props.lang, onSel = props.onSel, shared = props.shared;
  var W = 700, pad = 60, nP = plants.length, nI = insects.length;
  var H = Math.max(340, Math.max(nP, nI) * 52 + 80);
  var pX = pad + 30, iX = W - pad - 30;
  var pNodes = plants.map(function (p, i) { var yy = nP === 1 ? H / 2 : 50 + i * ((H - 100) / (nP - 1)); return Object.assign({}, p, { x: pX, y: yy }); });
  var iNodes = insects.map(function (ins, i) { var yy = nI === 1 ? H / 2 : 50 + i * ((H - 100) / (nI - 1)); return Object.assign({}, ins, { x: iX, y: yy }); });
  var sharedIds = shared.map(function (s) { return s.id; });
  var name = function (item) { return item.common ? item.common[lang] || item.sci : item.sci; };
  var shortSci = function (s) { return s.length > 20 ? s.split(' ')[0][0] + '. ' + s.split(' ').slice(1).join(' ') : s; };

  return (
    <div style={{ margin: '8px 0' }}>
      <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
        {ixs.map(function (ix, idx) {
          var pn = pNodes.find(function (n) { return n.id === ix.pI; }); var inode = iNodes.find(function (n) { return n.id === ix.iI; });
          if (!pn || !inode) return null; var tp = TYPES[ix.tp] || TYPES.folivorie; var col = FAMILIES[tp.fam].color;
          var nObs = ix.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0); var op = nObs > 50 ? 0.7 : nObs > 10 ? 0.45 : 0.25;
          var cpx = (pn.x + inode.x) / 2;
          return (<path key={idx} d={'M' + (pn.x + 22) + ',' + pn.y + ' C' + cpx + ',' + pn.y + ' ' + cpx + ',' + inode.y + ' ' + (inode.x - 22) + ',' + inode.y} fill="none" stroke={col} strokeWidth={tp.w * 0.8} strokeDasharray={tp.dash} opacity={op} strokeLinecap="round" />);
        })}
        {pNodes.map(function (nd) { var cid = 'gp-' + nd.id;
          return (<g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}><circle cx={nd.x} cy={nd.y} r={22} fill="var(--bg)" stroke="#2d7d46" strokeWidth={2} /><clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={19} /></clipPath><circle cx={nd.x} cy={nd.y} r={19} fill="var(--bg3)" clipPath={"url(#" + cid + ")"} /><text x={nd.x + 28} y={nd.y - 3} style={{ fontSize: 10, fontWeight: 600, fontStyle: 'italic', fill: 'var(--text)' }}>{nd.sci}</text><text x={nd.x + 28} y={nd.y + 9} style={{ fontSize: 9, fill: 'var(--text2)' }}>{name(nd)}</text></g>);
        })}
        {iNodes.map(function (nd) { var cid = 'gi-' + nd.id; var sh = sharedIds.indexOf(nd.id) !== -1; var r = sh ? 19 : 16;
          return (<g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}>{sh && (<circle cx={nd.x} cy={nd.y} r={r + 4} fill="#b8860b" opacity={0.12} />)}<circle cx={nd.x} cy={nd.y} r={r} fill="var(--bg)" stroke={sh ? '#b8860b' : '#b8860b88'} strokeWidth={sh ? 2 : 1.2} /><clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={r - 3} /></clipPath><circle cx={nd.x} cy={nd.y} r={r - 3} fill="var(--bg3)" clipPath={"url(#" + cid + ")"} /><text x={nd.x - 28} y={nd.y - 3} textAnchor="end" style={{ fontSize: 10, fontWeight: sh ? 600 : 400, fontStyle: 'italic', fill: 'var(--text)' }}>{shortSci(nd.sci)}</text><text x={nd.x - 28} y={nd.y + 9} textAnchor="end" style={{ fontSize: 9, fill: sh ? '#b8860b' : 'var(--text2)' }}>{name(nd)}{sh ? ' ★' : ''}</text></g>);
        })}
      </svg>
      <div className="graph-legend">
        {Object.entries(TYPES).filter(function (e) { return ixs.some(function (ix) { return ix.tp === e[0]; }); }).map(function (e) { var tp = e[1]; var fam = FAMILIES[tp.fam];
          return (<div key={e[0]} style={{ display: 'flex', alignItems: 'center', gap: 3 }}><svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke={fam.color} strokeWidth={tp.w * 0.7} strokeDasharray={tp.dash} strokeLinecap="round" /></svg><span style={{ fontSize: 9, color: fam.color, fontWeight: 500 }}>{tp[lang]}</span></div>);
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 10, color: '#b8860b', fontWeight: 600 }}>★</span><span style={{ fontSize: 9, color: '#b8860b' }}>{lang === 'fr' ? 'Partagé' : 'Shared'}</span></div>
      </div>
      <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', margin: 2 }}>
        {lang === 'fr' ? 'Les insectes reliés à plusieurs plantes sont marqués ★' : 'Insects linked to multiple plants are marked ★'}
      </p>
    </div>
  );
}
