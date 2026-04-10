import { THREAT_CATS, THREATENED_CATS } from '../utils/types';

/**
 * Affiche un badge UICN coloré pour une espèce.
 * Props: cat (string), lang (string), size ("sm"|"md"|"lg")
 * 
 * Ne rend rien si cat est vide, "NE", ou "NA".
 */
export default function ThreatBadge(props) {
  var cat = props.cat, lang = props.lang || 'fr', size = props.size || 'sm';
  if (!cat || cat === 'NE' || cat === 'NA' || cat === 'DD') return null;

  var info = THREAT_CATS[cat];
  if (!info) return null;

  var isThreatened = THREATENED_CATS.indexOf(cat) !== -1;
  var col = info.color;
  var label = cat;
  var title = info[lang] || info.fr;

  if (size === 'lg') {
    return (
      <span title={title} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 600, padding: '2px 8px',
        borderRadius: 4, background: col + '18', color: col,
        border: isThreatened ? '1px solid ' + col + '44' : '1px solid transparent',
      }}>
        <span style={{ fontSize: 9 }}>{info.icon}</span>
        {title}
      </span>
    );
  }

  if (size === 'md') {
    return (
      <span title={title} style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 10, fontWeight: 600, padding: '1px 6px',
        borderRadius: 3, background: col + '18', color: col,
      }}>
        {label}
      </span>
    );
  }

  // sm (default) — compact badge
  return (
    <span title={title} style={{
      fontSize: 9, fontWeight: 600, padding: '2px 6px',
      borderRadius: 4, background: col + '18', color: col,
      whiteSpace: 'nowrap',
    }}>
      {title}
    </span>
  );
}
