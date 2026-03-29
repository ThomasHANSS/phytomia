import { TYPES, FAMILIES } from '../utils/types';

var ICONS = {
  tree: { path: "M20 2Q15 2 13 8Q12 12 16 14L20 14Q20 8 20 2zM20 2Q25 2 27 8Q28 12 24 14L20 14Q20 8 20 2zM17 14L17 18L23 18L23 14zM20 18Q13 18 11 26Q10 38 14 46Q18 50 20 50L20 18zM20 18Q27 18 29 26Q30 38 26 46Q22 50 20 50L20 18z", viewBox: "10 0 20 50", color: "#2d7d46" },
  shrub: { path: "M16 30L20 42M20 30L20 42M24 30L20 42M20 22Q10 22 6 28Q4 34 10 36Q14 38 20 38Q26 38 30 36Q36 34 34 28Q30 22 20 22z", viewBox: "4 20 32 24", color: "#4a8c3f" },
  climber: { path: "M20 4L20 38M20 10Q14 8 12 12Q10 16 14 16M20 10Q26 8 28 12Q30 16 26 16M20 20Q14 18 12 22Q10 26 14 26M20 20Q26 18 28 22Q30 26 26 26M20 30Q14 28 12 32Q10 36 14 36M20 30Q26 28 28 32Q30 36 26 36", viewBox: "8 2 24 38", color: "#3a7d44" },
  herb: { path: "M20 16L20 38M20 28Q14 26 12 30Q14 32 20 28zM20 28Q26 26 28 30Q26 32 20 28zM20 22Q14 20 12 24Q14 26 20 22zM20 22Q26 20 28 24Q26 26 20 22zM20 12A4 4 0 100 8A4 4 0 100-8M20 6A2.5 4 0 010-8M14 10A4 2.5 0 01-5-5M26 10A4 2.5 0 015-5M15 16A4 2.5 0 01-6 3M25 16A4 2.5 0 016 3", viewBox: "6 0 28 40", color: "#6b8e23" },
  grass: { path: "M20 38Q20 20 20 5M16 38Q14 22 10 8M24 38Q26 22 30 8M12 38Q8 26 4 14M28 38Q32 26 36 14", viewBox: "2 3 36 37", color: "#8fae5e" },
  default_plant: { path: "M20 38L20 18M20 18Q10 18 8 12Q6 6 12 4Q16 2 20 6Q24 2 28 4Q34 6 32 12Q30 18 20 18z", viewBox: "5 1 30 39", color: "#2d7d46" },
  Hymenoptera: { path: "M20 2Q17 0 15 3M24 2Q27 0 29 3M22 8A5 5 0 100 0A5 5 0 100 0M22 17A6.5 5.5 0 100 0A6.5 5.5 0 100 0M16 15Q6 10 3 16Q1 22 8 22Q13 22 16 19M28 15Q38 10 41 16Q43 22 36 22Q31 22 28 19M22 23A4 2.5 0 100 0A4 2.5 0 100 0M22 34A7 10 0 100 0A7 10 0 100 0M15 28L10 24M15 34L10 36M15 40L11 44M29 28L34 24M29 34L34 36M29 40L33 44", viewBox: "0 -1 44 50", color: "#b8860b" },
  Lepidoptera: { path: "M22 16Q16 6 6 4Q1 4 1 10Q1 18 10 22Q16 24 20 22M26 16Q32 6 42 4Q47 4 47 10Q47 18 38 22Q32 24 28 22M21 24Q14 28 10 36Q8 42 14 40Q18 38 21 30M27 24Q34 28 38 36Q40 42 34 40Q30 38 27 30M22 12L24 12L24 42L22 42zM21 14Q18 6 16 2M27 14Q30 6 32 2", viewBox: "0 0 48 44", color: "#e67e22" },
  Coleoptera: { path: "M18 4Q14 0 10 2M26 4Q30 0 34 2M22 2Q15 2 13 8Q12 12 16 14L22 14M22 2Q29 2 31 8Q32 12 28 14L22 14M13 14L31 14L31 18L13 18zM22 18Q13 18 11 26Q10 38 14 46Q18 50 22 50M22 18Q31 18 33 26Q34 38 30 46Q26 50 22 50M22 18L22 50M13 22L7 18M31 22L37 18M11 30L5 30M33 30L39 30M13 38L7 42M31 38L37 42", viewBox: "3 -1 38 53", color: "#c0392b" },
  Diptera: { path: "M19 4Q15 0 11 2M25 4Q29 0 33 2M22 10A7 7 0 100 0A7 7 0 100 0M22 20A6 5 0 100 0A6 5 0 100 0M16 18Q4 10 1 18Q-1 26 8 24Q14 22 16 20M28 18Q40 10 43 18Q45 26 36 24Q30 22 28 20M22 34A5.5 12 0 100 0A5.5 12 0 100 0M17 26L11 22M17 32L11 34M17 40L13 46M27 26L33 22M27 32L33 34M27 40L31 46", viewBox: "-2 -1 48 50", color: "#7d3c98" },
  Hemiptera: { path: "M18 4Q14 0 10 2M26 4Q30 0 34 2M22 8A5 4.5 0 100 0A5 4.5 0 100 0M12 14L22 14L32 14L32 22L22 28L12 22zM12 14L12 34Q12 46 22 48Q32 46 32 34L32 14M22 28L22 48M12 20L6 16M32 20L38 16M12 28L6 30M32 28L38 30M14 38L8 42M30 38L36 42", viewBox: "4 -1 36 52", color: "#6b4c80" },
  default_insect: { path: "M20 4Q16 0 12 2M24 4Q28 0 32 2M22 8A5 5 0 100 0A5 5 0 100 0M22 17A6 5 0 100 0A6 5 0 100 0M22 30A6 10 0 100 0A6 10 0 100 0M16 22L10 18M28 22L34 18M16 30L10 32M28 30L34 32", viewBox: "8 -1 28 44", color: "#b8860b" },
};

var TREE_GENERA = ["Quercus","Fagus","Betula","Picea","Pinus","Abies","Larix","Acer","Fraxinus","Tilia","Ulmus","Alnus","Carpinus","Castanea","Populus","Salix","Platanus","Juglans","Cedrus","Taxus","Cupressus","Eucalyptus","Prunus","Malus","Pyrus","Sorbus","Olea","Robinia","Gleditsia","Magnolia","Morus","Ilex"];
var SHRUB_GENERA = ["Rosa","Rubus","Buddleja","Sambucus","Cornus","Viburnum","Ligustrum","Lonicera","Ribes","Berberis","Cotoneaster","Crataegus","Rhamnus","Euonymus","Buxus","Lavandula","Rosmarinus","Cistus","Erica","Calluna","Rhododendron","Syringa","Philadelphus","Hydrangea","Spiraea","Deutzia"];
var CLIMBER_GENERA = ["Hedera","Clematis","Wisteria","Vitis","Humulus","Parthenocissus","Passiflora","Jasminum"];
var GRASS_FAMILIES = ["Poaceae","Cyperaceae","Juncaceae"];
var TREE_FAMILIES = ["Fagaceae","Betulaceae","Pinaceae","Cupressaceae","Taxaceae","Juglandaceae","Ulmaceae","Platanaceae","Oleaceae"];
var SHRUB_FAMILIES = ["Ericaceae","Caprifoliaceae","Grossulariaceae","Berberidaceae","Buxaceae","Cistaceae"];

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

function getIcon(item, isPlant) {
  if (!isPlant) { var order = (item && item.order) || ""; return ICONS[order] || ICONS.default_insect; }
  return ICONS[getLifeForm(item)] || ICONS.default_plant;
}

function wikiUrl(name) { return "https://en.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/ /g, "_")); }

export default function Thumb(props) {
  var sz = props.sz || 40, item = props.item, name = props.name, isPlant = props.isPlant;
  var icon = getIcon(item, isPlant);
  var col = icon.color;
  var icoSz = Math.max(12, sz * 0.65);
  var vb = icon.viewBox || "0 0 40 40";
  return (
    <div style={{ width: sz, height: sz, borderRadius: sz > 48 ? 10 : 6,
      background: col + "12", border: "1px solid " + col + "25",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      title={name || (item ? item.sci : "")}>
      <svg width={icoSz} height={icoSz} viewBox={vb} fill="none" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
        <path d={icon.path} fill={col} fillOpacity="0.7" stroke={col} strokeWidth="0.8"/>
      </svg>
    </div>
  );
}

export function SpeciesLink(props) {
  var name = props.name, lang = props.lang;
  return (
    <a href={wikiUrl(name)} target="_blank" rel="noopener noreferrer"
      onClick={function (e) { e.stopPropagation(); }}
      title={lang === "fr" ? "Voir sur Wikipedia" : "View on Wikipedia"}
      style={{ display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 10, color: "var(--text3)", textDecoration: "none",
        padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)",
        background: "var(--bg2)", flexShrink: 0 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
      Wiki
    </a>
  );
}

export function LifeFormLabel(props) {
  var item = props.item, isPlant = props.isPlant, lang = props.lang;
  if (!isPlant) return null;
  var lf = getLifeForm(item);
  var labels = { tree: {fr:"Arbre",en:"Tree"}, shrub: {fr:"Arbuste",en:"Shrub"}, climber: {fr:"Grimpante",en:"Climber"}, herb: {fr:"Herbac\u00e9e",en:"Herb"}, grass: {fr:"Gramin\u00e9e",en:"Grass"} };
  var lb = labels[lf];
  if (!lb) return null;
  var icon = ICONS[lf];
  return (<span style={{ fontSize: 9, color: icon.color, fontWeight: 500 }}>{lb[lang] || lb.fr}</span>);
}
