import { useSpeciesImage } from '../hooks/useData';

export default function Thumb(props) {
  var sz = props.sz || 40, name = props.name;
  var img = useSpeciesImage(name);
  var base = { width: sz, height: sz, borderRadius: sz > 48 ? 10 : 6, objectFit: 'cover', background: 'var(--bg3)', flexShrink: 0 };
  if (img && img.url) return (<img src={img.url} alt={name} style={base} loading="lazy" />);
  return (<div style={Object.assign({}, base, { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sz > 48 ? 20 : 12, opacity: 0.25 })}>{img === false ? '—' : '…'}</div>);
}

export function NodeImg(props) {
  var name = props.name, x = props.x, y = props.y, r = props.r, clipId = props.clipId;
  var img = useSpeciesImage(name);
  if (img && img.url) return (<image href={img.url} x={x - r} y={y - r} width={r * 2} height={r * 2} clipPath={'url(#' + clipId + ')'} preserveAspectRatio="xMidYMid slice" />);
  return (<circle cx={x} cy={y} r={r} fill="var(--bg3)" clipPath={'url(#' + clipId + ')'} />);
}
