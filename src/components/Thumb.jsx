import { useState, useEffect } from 'react';
import { TYPES, FAMILIES } from '../utils/types';

var TREE_GENERA = ["Quercus","Fagus","Betula","Picea","Pinus","Abies","Larix","Acer","Fraxinus","Tilia","Ulmus","Alnus","Carpinus","Castanea","Populus","Salix","Platanus","Juglans","Cedrus","Taxus","Cupressus","Eucalyptus","Prunus","Malus","Pyrus","Sorbus","Olea","Robinia","Gleditsia","Magnolia","Morus","Ilex","Aesculus","Ailanthus","Catalpa","Liriodendron","Paulownia","Corylus","Celtis","Cercis","Citrus","Liquidambar","Ginkgo","Thuja","Juniperus","Arbutus","Zelkova","Carya","Diospyros","Koelreuteria","Sapindus","Koelreuteria","Sapindus","Ficus","Ceratonia","Amelanchier","Eriobotrya","Mespilus","Amelanchier","Eriobotrya","Mespilus"];
var SHRUB_GENERA = ["Rosa","Rubus","Buddleja","Sambucus","Cornus","Viburnum","Ligustrum","Lonicera","Ribes","Berberis","Cotoneaster","Crataegus","Rhamnus","Euonymus","Buxus","Lavandula","Rosmarinus","Cistus","Erica","Calluna","Rhododendron","Syringa","Philadelphus","Hydrangea","Spiraea","Deutzia","Crataegus","Cotoneaster","Potentilla","Rhamnus","Euonymus","Hippophae","Myrica","Ceanothus","Daphne","Genista","Cytisus","Ulex","Ilex","Elaeagnus","Tamarix","Myrtus","Laurus","Nerium","Colutea","Paliurus","Pistacia","Ligustrum","Crataegus","Cotoneaster","Potentilla","Rhamnus","Euonymus","Hippophae","Myrica","Ceanothus","Daphne","Genista","Cytisus","Ulex","Ilex","Elaeagnus","Tamarix","Myrtus","Laurus","Nerium","Colutea","Paliurus","Pistacia","Ligustrum"];
var CLIMBER_GENERA = ["Hedera","Clematis","Wisteria","Vitis","Humulus","Parthenocissus","Passiflora","Jasminum"];
var GRASS_FAMILIES = ["Poaceae","Cyperaceae","Juncaceae"];
var TREE_FAMILIES = ["Fagaceae","Betulaceae","Pinaceae","Cupressaceae","Taxaceae","Juglandaceae","Ulmaceae","Platanaceae","Oleaceae","Sapindaceae","Hippocastanaceae","Altingiaceae","Ginkgoaceae","Moraceae","Aquifoliaceae","Araucariaceae","Lauraceae","Myrtaceae","Rutaceae","Meliaceae","Anacardiaceae","Combretaceae","Arecaceae","Lauraceae","Myrtaceae","Rutaceae","Meliaceae","Anacardiaceae","Combretaceae","Arecaceae"];
var SHRUB_FAMILIES = ["Ericaceae","Caprifoliaceae","Grossulariaceae","Berberidaceae","Buxaceae","Cistaceae","Thymelaeaceae","Elaeagnaceae","Myricaceae","Rhamnaceae","Thymelaeaceae","Elaeagnaceae","Myricaceae","Rhamnaceae"];

function getLifeForm(item) {
  if (!item) return "default_plant";
  var genus = item.genus || (item.sci ? item.sci.split(" ")[0] : "");
  var family = item.family || "";
  if (CLIMBER_GENERA.indexOf(genus) !== -1) return "climber";
  if (TREE_GENERA.indexOf(genus) !== -1) return "tree";
  if (SHRUB_GENERA.indexOf(genus) !== -1) return "shrub";
  if (GRASS_FAMILIES.indexOf(family) !== -1) return "grass";
  if (TREE_FAMILIES.indexOf(family) !== -1) return "tree";
  if (SHRUB_FAMILIES.indexOf(family) !== -1) return "shrub";
  return "herb";
}

function wikiUrl(name) { return "https://en.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/ /g, "_")); }

function TreeIcon(p) {
  return (<g><rect x="17" y="26" width="6" height="22" rx="2" fill={p.c} opacity="0.55"/><ellipse cx="20" cy="16" rx="17" ry="14" fill={p.c} opacity="0.7"/></g>);
}
function ShrubIcon(p) {
  return (<g><line x1="14" y1="42" x2="20" y2="34" stroke={p.c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/><line x1="20" y1="42" x2="20" y2="32" stroke={p.c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/><line x1="26" y1="42" x2="20" y2="34" stroke={p.c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/><ellipse cx="20" cy="24" rx="16" ry="12" fill={p.c} opacity="0.65"/></g>);
}
function ClimberIcon(p) {
  return (<g><line x1="20" y1="4" x2="20" y2="40" stroke={p.c} strokeWidth="1.8" opacity="0.45" strokeLinecap="round"/><path d="M20 12Q14 10 12 14Q10 18 14 18" fill={p.c} opacity="0.5"/><path d="M20 12Q26 10 28 14Q30 18 26 18" fill={p.c} opacity="0.5"/><path d="M20 22Q14 20 12 24Q10 28 14 28" fill={p.c} opacity="0.5"/><path d="M20 22Q26 20 28 24Q30 28 26 28" fill={p.c} opacity="0.5"/><path d="M20 32Q14 30 12 34Q10 38 14 38" fill={p.c} opacity="0.5"/><path d="M20 32Q26 30 28 34Q30 38 26 38" fill={p.c} opacity="0.5"/></g>);
}
function HerbIcon(p) {
  return (<g><line x1="20" y1="18" x2="20" y2="40" stroke={p.c} strokeWidth="1.8" opacity="0.5" strokeLinecap="round"/><path d="M20 30Q14 28 12 32Q14 34 20 30z" fill={p.c} opacity="0.45"/><path d="M20 30Q26 28 28 32Q26 34 20 30z" fill={p.c} opacity="0.45"/><path d="M20 24Q14 22 12 26Q14 28 20 24z" fill={p.c} opacity="0.45"/><path d="M20 24Q26 22 28 26Q26 28 20 24z" fill={p.c} opacity="0.45"/><circle cx="20" cy="13" r="4" fill="#d4a843" opacity="0.55"/><ellipse cx="20" cy="7" rx="2.5" ry="4" fill="#d4a843" opacity="0.35"/><ellipse cx="14.5" cy="11" rx="3.5" ry="2.2" fill="#d4a843" opacity="0.35" transform="rotate(-30 14.5 11)"/><ellipse cx="25.5" cy="11" rx="3.5" ry="2.2" fill="#d4a843" opacity="0.35" transform="rotate(30 25.5 11)"/><ellipse cx="15.5" cy="17" rx="3.5" ry="2.2" fill="#d4a843" opacity="0.35" transform="rotate(-70 15.5 17)"/><ellipse cx="24.5" cy="17" rx="3.5" ry="2.2" fill="#d4a843" opacity="0.35" transform="rotate(70 24.5 17)"/></g>);
}
function GrassIcon(p) {
  return (<g><path d="M20 40Q20 22 20 6" fill="none" stroke={p.c} strokeWidth="2.5" opacity="0.75" strokeLinecap="round"/><path d="M16 40Q14 24 10 10" fill="none" stroke={p.c} strokeWidth="2" opacity="0.6" strokeLinecap="round"/><path d="M24 40Q26 24 30 10" fill="none" stroke={p.c} strokeWidth="2" opacity="0.6" strokeLinecap="round"/><path d="M12 40Q8 28 4 16" fill="none" stroke={p.c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/><path d="M28 40Q32 28 36 16" fill="none" stroke={p.c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/></g>);
}
function HymenopteraIcon(p) {
  return (<g><path d="M18 4Q15 1 13 3" fill="none" stroke={p.c} strokeWidth="1" opacity="0.5" strokeLinecap="round"/><path d="M22 4Q25 1 27 3" fill="none" stroke={p.c} strokeWidth="1" opacity="0.5" strokeLinecap="round"/><ellipse cx="20" cy="9" rx="5" ry="4.5" fill={p.c} opacity="0.8"/><ellipse cx="20" cy="17" rx="6" ry="5" fill={p.c} opacity="0.75"/><path d="M14 15Q5 10 3 16Q1 22 8 21Q13 20 14 18" fill={p.c} opacity="0.18"/><path d="M26 15Q35 10 37 16Q39 22 32 21Q27 20 26 18" fill={p.c} opacity="0.18"/><ellipse cx="20" cy="23" rx="4" ry="2.5" fill={p.c} opacity="0.6"/><ellipse cx="20" cy="34" rx="7" ry="10" fill={p.c} opacity="0.7"/><path d="M13 28L9 25M13 34L9 36M14 40L10 44" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/><path d="M27 28L31 25M27 34L31 36M26 40L30 44" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/></g>);
}
function LepidopteraIcon(p) {
  return (<g><path d="M20 16Q14 6 5 5Q1 5 1 11Q1 19 10 22Q15 24 19 22" fill={p.c} opacity="0.5"/><path d="M20 16Q26 6 35 5Q39 5 39 11Q39 19 30 22Q25 24 21 22" fill={p.c} opacity="0.5"/><path d="M19 24Q13 28 10 35Q8 40 13 39Q17 37 19 30" fill={p.c} opacity="0.35"/><path d="M21 24Q27 28 30 35Q32 40 27 39Q23 37 21 30" fill={p.c} opacity="0.35"/><rect x="18.5" y="14" width="3" height="28" rx="1.5" fill={p.c} opacity="0.75"/><path d="M19 15Q16 7 14 3" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.4" strokeLinecap="round"/><path d="M21 15Q24 7 26 3" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.4" strokeLinecap="round"/></g>);
}
function ColeopteraIcon(p) {
  return (<g><path d="M17 5Q13 1 9 3" fill="none" stroke={p.c} strokeWidth="0.9" opacity="0.4" strokeLinecap="round"/><path d="M23 5Q27 1 31 3" fill="none" stroke={p.c} strokeWidth="0.9" opacity="0.4" strokeLinecap="round"/><path d="M20 3Q14 3 12 9Q11 13 15 15L20 15Q20 9 20 3" fill={p.c} opacity="0.8"/><path d="M20 3Q26 3 28 9Q29 13 25 15L20 15Q20 9 20 3" fill={p.c} opacity="0.75"/><rect x="12" y="15" width="16" height="4" rx="1" fill={p.c} opacity="0.6"/><path d="M20 19Q12 19 10 27Q9 39 13 47Q17 51 20 51" fill={p.c} opacity="0.7"/><path d="M20 19Q28 19 30 27Q31 39 27 47Q23 51 20 51" fill={p.c} opacity="0.65"/><line x1="20" y1="19" x2="20" y2="51" stroke="#000" strokeWidth="0.5" opacity="0.15"/><path d="M12 23L7 19M10 31L4 31M12 39L7 43" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/><path d="M28 23L33 19M30 31L36 31M28 39L33 43" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/></g>);
}
function DipteraIcon(p) {
  return (<g><path d="M18 5Q14 1 10 3" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.35" strokeLinecap="round"/><path d="M22 5Q26 1 30 3" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.35" strokeLinecap="round"/><ellipse cx="20" cy="11" rx="7" ry="7" fill={p.c} opacity="0.75"/><ellipse cx="20" cy="21" rx="5.5" ry="4.5" fill={p.c} opacity="0.7"/><path d="M15 19Q3 11 1 19Q-1 27 8 25Q14 23 15 21" fill={p.c} opacity="0.15"/><path d="M25 19Q37 11 39 19Q41 27 32 25Q26 23 25 21" fill={p.c} opacity="0.15"/><ellipse cx="20" cy="35" rx="5.5" ry="12" fill={p.c} opacity="0.6"/><path d="M15 28L10 24M15 34L10 36M16 42L12 48" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/><path d="M25 28L30 24M25 34L30 36M24 42L28 48" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/></g>);
}
function HemipteraIcon(p) {
  return (<g><path d="M17 5Q13 1 9 3" fill="none" stroke={p.c} strokeWidth="0.9" opacity="0.4" strokeLinecap="round"/><path d="M23 5Q27 1 31 3" fill="none" stroke={p.c} strokeWidth="0.9" opacity="0.4" strokeLinecap="round"/><ellipse cx="20" cy="9" rx="5" ry="4.5" fill={p.c} opacity="0.7"/><path d="M10 15L20 15L30 15L30 23L20 29L10 23z" fill={p.c} opacity="0.55"/><path d="M10 15L10 35Q10 47 20 49Q30 47 30 35L30 15" fill={p.c} opacity="0.5"/><line x1="20" y1="29" x2="20" y2="49" stroke="#000" strokeWidth="0.5" opacity="0.12"/><path d="M10 21L5 17M10 29L5 31M12 39L7 43" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/><path d="M30 21L35 17M30 29L35 31M28 39L33 43" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/></g>);
}
function DefaultInsectIcon(p) {
  return (<g><ellipse cx="20" cy="10" rx="5" ry="5" fill={p.c} opacity="0.75"/><ellipse cx="20" cy="20" rx="6" ry="5" fill={p.c} opacity="0.7"/><ellipse cx="20" cy="32" rx="6" ry="10" fill={p.c} opacity="0.65"/><path d="M14 22L8 18M14 30L8 32" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/><path d="M26 22L32 18M26 30L32 32" fill="none" stroke={p.c} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/></g>);
}
function DefaultPlantIcon(p) {
  return (<g><line x1="20" y1="18" x2="20" y2="40" stroke={p.c} strokeWidth="1.8" opacity="0.5" strokeLinecap="round"/><path d="M20 18Q10 18 8 12Q6 6 12 4Q16 2 20 6Q24 2 28 4Q34 6 32 12Q30 18 20 18z" fill={p.c} opacity="0.6"/></g>);
}

var COLORS = { tree: "#10b981", shrub: "#4a8c3f", climber: "#3a7d44", herb: "#84cc16", grass: "#8fae5e", default_plant: "#10b981", Hymenoptera: "#f59e0b", Lepidoptera: "#fb923c", Coleoptera: "#f43f5e", Diptera: "#a855f7", Hemiptera: "#6b4c80", default_insect: "#f59e0b" };

var ICON_COMPONENTS = { tree: TreeIcon, shrub: ShrubIcon, climber: ClimberIcon, herb: HerbIcon, grass: GrassIcon, default_plant: DefaultPlantIcon, Hymenoptera: HymenopteraIcon, Lepidoptera: LepidopteraIcon, Coleoptera: ColeopteraIcon, Diptera: DipteraIcon, Hemiptera: HemipteraIcon, default_insect: DefaultInsectIcon };

function getKey(item, isPlant) {
  if (!isPlant) { var order = (item && item.order) || ""; return ICON_COMPONENTS[order] ? order : "default_insect"; }
  return getLifeForm(item);
}



var _lbListeners = [];
var _lbState = { open: false, src: '', title: '', attr: '' };
function openLightbox(src, title, attr) {
  _lbState = { open: true, src: src, title: title || '', attr: attr || '' };
  _lbListeners.forEach(function(cb) { cb(_lbState); });
}
function closeLightbox() {
  _lbState = { open: false, src: '', title: '', attr: '' };
  _lbListeners.forEach(function(cb) { cb(_lbState); });
}
function useLightbox() {
  var _s = useState(_lbState), st = _s[0], setSt = _s[1];
  useEffect(function() {
    _lbListeners.push(setSt);
    return function() { _lbListeners = _lbListeners.filter(function(c) { return c !== setSt; }); };
  }, []);
  return st;
}

var _photoCache = {};
var _pendingFetches = {};
export function fetchPhoto(sci, cb) {
  if (_photoCache[sci] !== undefined) { cb(_photoCache[sci]); return; }
  if (_pendingFetches[sci]) { _pendingFetches[sci].push(cb); return; }
  _pendingFetches[sci] = [cb];
  fetch('https://api.inaturalist.org/v1/taxa?q=' + encodeURIComponent(sci) + '&per_page=5')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var results = data.results || [];
      var info = { photo: null, inatId: null };
      // Find exact name match first
      var res = null;
      for (var ri = 0; ri < results.length; ri++) {
        if (results[ri].name === sci) { res = results[ri]; break; }
      }
      // Fallback: first result with matching genus
      if (!res && results.length > 0) {
        var genus = sci.split(' ')[0];
        for (var rj = 0; rj < results.length; rj++) {
          if (results[rj].name && results[rj].name.indexOf(genus) === 0) { res = results[rj]; break; }
        }
      }
      if (res) {
        info.inatId = res.id;
        var p = res.default_photo;
        if (p && p.square_url) info.photo = { sq: p.square_url, md: p.medium_url || p.square_url, attr: p.attribution || '' };
      }
      _photoCache[sci] = info;
      (_pendingFetches[sci] || []).forEach(function(c) { c(info); });
      delete _pendingFetches[sci];
    })
    .catch(function() {
      _photoCache[sci] = { photo: null, inatId: null };
      (_pendingFetches[sci] || []).forEach(function(c) { c(_photoCache[sci]); });
      delete _pendingFetches[sci];
    });
}

export default function Thumb(props) {
  var sz = props.sz || 40, item = props.item, name = props.name, isPlant = props.isPlant;
  var key = getKey(item, isPlant);
  var col = COLORS[key] || '#888';
  var IconComp = ICON_COMPONENTS[key] || DefaultPlantIcon;
  var icoSz = Math.max(14, sz * 0.7);
  var sci = (item && item.sci) || name || '';
  var _s = useState(null), pd = _s[0], setPd = _s[1];
  var _e = useState(false), err = _e[0], setErr = _e[1];
  useEffect(function() { if (sci && sz >= 32) fetchPhoto(sci, setPd); }, [sci]);
  var hasPhoto = pd && pd.photo && !err;
  if (hasPhoto) {
    return (
      <div style={{ width: sz, height: sz, borderRadius: sz > 48 ? 10 : 6, overflow: 'hidden', flexShrink: 0, background: col + '12', border: '1px solid ' + col + '25' }} title={pd.photo.attr || sci}>
        <img src={sz > 60 ? pd.photo.md : pd.photo.sq} alt={sci} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }} onError={function() { setErr(true); }} onClick={function(e) { e.stopPropagation(); openLightbox(pd.photo.md.replace('/medium.', '/large.'), sci, pd.photo.attr); }} />
      </div>
    );
  }
  return (
    <div style={{ width: sz, height: sz, borderRadius: sz > 48 ? 10 : 6, background: col + '12', border: '1px solid ' + col + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={sci}>
      <svg width={icoSz} height={icoSz} viewBox="0 0 40 48"><IconComp c={col} /></svg>
    </div>
  );
}

export function SpeciesLink(props) {
  var name = props.name, lang = props.lang;
  var _s = useState(null), inatId = _s[0], setId = _s[1];
  useEffect(function() { setId(null); fetchPhoto(name, function(d) { if (d && d.inatId) setId(d.inatId); }); }, [name]);
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      <a href={'https://en.wikipedia.org/wiki/' + encodeURIComponent(name.replace(/ /g, '_'))} target="_blank" rel="noopener noreferrer" onClick={function(e) { e.stopPropagation(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text3)', textDecoration: 'none', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        Wiki
      </a>
      {inatId && (
        <a href={'https://www.inaturalist.org/taxa/' + inatId} target="_blank" rel="noopener noreferrer" onClick={function(e) { e.stopPropagation(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#74ac00', textDecoration: 'none', padding: '1px 6px', borderRadius: 4, border: '1px solid #74ac0030', background: '#74ac0008', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#74ac00" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
          iNat
        </a>
      )}
    </div>
  );
}


export function Lightbox() {
  var st = useLightbox();
  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') closeLightbox(); }
    if (st.open) document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [st.open]);
  if (!st.open) return null;
  return (
    <div onClick={closeLightbox} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 20 }}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ position: 'relative', cursor: 'default' }}>
        <img src={st.src} alt={st.title} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, display: 'block', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 15, fontStyle: 'italic', color: '#fff', fontWeight: 600 }}>{st.title}</span>
          {st.attr && <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{st.attr}</div>}
        </div>
        <button onClick={closeLightbox} style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: 16, border: 'none', background: '#fff', color: '#333', fontSize: 18, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{'✕'}</button>
      </div>
    </div>
  );
}

export function LifeFormLabel(props) {
  var item = props.item, isPlant = props.isPlant, lang = props.lang;
  if (!isPlant) return null;
  var lf = getLifeForm(item);
  var labels = { tree: {fr:"Arbre",en:"Tree"}, shrub: {fr:"Arbuste",en:"Shrub"}, climber: {fr:"Grimpante",en:"Climber"}, herb: {fr:"Herbac\u00e9e",en:"Herb"}, grass: {fr:"Gramin\u00e9e",en:"Grass"} };
  var lb = labels[lf];
  if (!lb) return null;
  return (<span style={{ fontSize: 9, color: COLORS[lf], fontWeight: 500 }}>{lb[lang] || lb.fr}</span>);
}
