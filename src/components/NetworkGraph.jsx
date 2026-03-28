import { NodeImg } from './Thumb';
import { TYPES, FAMILIES } from '../utils/types';

export default function NetworkGraph(props) {
  var center = props.center, partners = props.partners, ixs = props.ixs, lang = props.lang, onSel = props.onSel, plants = props.plants;
  var isP = !!plants.find(function (p) { return p.id === center.id; });
  var cx = 340, cy = 210, R = 155, n = partners.length;
  if (n === 0) return null;
  var nodes = partners.map(function (p, i) { var a = (2 * Math.PI * i) / n - Math.PI / 2; return Object.assign({}, p, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }); });
  var H = Math.max(440, cy + R + 90);
  var name = function (item) { return item.common ? item.common[lang] || item.sci : item.sci; };
  var shortSci = function (s) { return s.length > 18 ? s.split(' ')[0][0] + '. ' + s.split(' ').slice(1).join(' ') : s; };

  return (
    <div style={{ margin: '8px 0' }}>
      <svg viewBox={'0 0 680 ' + H} width="100%" style={{ display: 'block' }}>
        {ixs.map(function (ix, idx) {
          var nd = nodes.find(function (n2) { return isP ? n2.id === ix.iI : n2.id === ix.pI; });
          if (!nd) return null;
          var tp = TYPES[ix.tp] || TYPES.folivorie; var fam = FAMILIES[tp.fam]; var col = fam.color;
          var nObs = ix.src.reduce(function (s, sr) { return s + (sr.n || 0); }, 0);
          var op = nObs > 50 ? 0.85 : nObs > 10 ? 0.6 : 0.4;
          var mx2 = (cx + nd.x) / 2, my2 = (cy + nd.y) / 2, dx = nd.x - cx, dy = nd.y - cy, len = Math.sqrt(dx * dx + dy * dy) || 1;
          var off = 20 * (idx % 2 === 0 ? 1 : -1);
          var cpx = mx2 + (-dy / len) * off, cpy = my2 + (dx / len) * off;
          var tmx = 0.25 * cx + 0.5 * cpx + 0.25 * nd.x, tmy = 0.25 * cy + 0.5 * cpy + 0.25 * nd.y;
          return (
            <g key={idx}>
              <path d={'M' + cx + ',' + cy + ' Q' + cpx + ',' + cpy + ' ' + nd.x + ',' + nd.y} fill="none" stroke={col} strokeWidth={tp.w} strokeDasharray={tp.dash} opacity={op} strokeLinecap="round" />
              <g transform={'translate(' + tmx + ',' + tmy + ')'}>
                <circle r={6} fill="var(--bg)" opacity={0.85} />
                <path d={tp.icon} fill="none" stroke={col} strokeWidth={1.2} strokeLinecap="round" opacity={Math.min(1, op + 0.2)} />
              </g>
            </g>
          );
        })}
        {nodes.map(function (nd) {
          var col2 = plants.find(function (p) { return p.id === nd.id; }) ? '#2d7d46' : '#b8860b';
          var cid = 'c-' + nd.id;
          return (
            <g key={nd.id} style={{ cursor: 'pointer' }} onClick={function () { onSel(nd.id); }}>
              <circle cx={nd.x} cy={nd.y} r={23} fill={col2} opacity={0.1} />
              <circle cx={nd.x} cy={nd.y} r={20} fill="var(--bg)" stroke={col2} strokeWidth={1.5} />
              <clipPath id={cid}><circle cx={nd.x} cy={nd.y} r={18} /></clipPath>
              <NodeImg name={nd.sci} x={nd.x} y={nd.y} r={18} clipId={cid} />
              <text x={nd.x} y={nd.y + 32} textAnchor="middle" style={{ fontSize: 9.5, fontWeight: 500, fontStyle: 'italic', fill: 'var(--text)' }}>{shortSci(nd.sci)}</text>
              <text x={nd.x} y={nd.y + 42} textAnchor="middle" style={{ fontSize: 8.5, fill: 'var(--text2)' }}>{name(nd)}</text>
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
      <div className="graph-legend">
        {Object.entries(TYPES).filter(function (e) { return ixs.some(function (ix) { return ix.tp === e[0]; }); }).map(function (e) {
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
        {lang === 'fr' ? 'Épaisseur = volume d\'observations · Cliquez un nœud pour naviguer' : 'Thickness = observation volume · Click a node to navigate'}
      </p>
    </div>
  );
}
