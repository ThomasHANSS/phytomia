import { TYPES, FAMILIES } from '../utils/types';

var ICONS = {
  tree: { path: "M12 2L7 9h3v3H7l5 7 5-7h-3V9h3L12 2zm-1 14v4h2v-4h-2z", color: "#2d7d46", fr: "Arbre", en: "Tree" },
  shrub: { path: "M12 6c-2 0-4 1.5-4 4 0 1.5.7 2.8 2 3.5v1c-2 .5-4 2-4 3.5h12c0-1.5-2-3-4-3.5v-1c1.3-.7 2-2 2-3.5 0-2.5-2-4-4-4zm-1 12v2h2v-2h-2z", color: "#4a8c3f", fr: "Arbuste", en: "Shrub" },
  herb: { path: "M12 22v-8c-2-1-4-3.5-4-6.5C8 4 9.8 2 12 2s4 2 4 5.5c0 3-2 5.5-4 6.5z", color: "#6b8e23", fr: "Herbac\u00e9e", en: "Herb" },
  grass: { path: "M11 22v-10C9 10 7 8 7 5c0-1 .3-2 1-3-.2 2 .5 4 2 5.5V4c1-1.5 1.5-3 1.5-3s.5 1.5 1.5 3v3.5C14.5 6 15.2 4 15 2c.7 1 1 2 1 3 0 3-2 5-4 7v10h-1z", color: "#8fae5e", fr: "Gramin\u00e9e", en: "Grass" },
  climber: { path: "M12 22v-6c1-1 2-2.5 2-4 0-2-1-3.5-2.5-4.5C10 6.5 9 5 9 3c0-.5.1-1 .3-1.5C10 3 11 5 12 6c1-1 2-3 2.7-4.5.2.5.3 1 .3 1.5 0 2-1 3.5-2.5 4.5C11 8.5 10 10 10 12c0 1.5 1 3 2 4z", color: "#3a7d44", fr: "Grimpante", en: "Climber" },
  default_plant: { path: "M12 22v-8c-2-1-4-3.5-4-6.5C8 4 9.8 2 12 2s4 2 4 5.5c0 3-2 5.5-4 6.5z", color: "#2d7d46", fr: "Plante", en: "Plant" },
  Hymenoptera: { path: "M12 3c-1.5 0-2.5 1-3 2.5-.3.8-.8 1.5-1.5 2C6.5 8 5 9 5 11c0 1.5.8 2.8 2 3.5v1c0 1.4 1 2.5 2.2 2.5h.3c.3 1.2 1.3 2 2.5 2s2.2-.8 2.5-2h.3c1.2 0 2.2-1.1 2.2-2.5v-1c1.2-.7 2-2 2-3.5 0-2-1.5-3-2.5-3.5-.7-.5-1.2-1.2-1.5-2C14.5 4 13.5 3 12 3z", color: "#b8860b", fr: "Hym\u00e9nopt\u00e8re", en: "Hymenoptera" },
  Lepidoptera: { path: "M12 4c-.5 0-1 .2-1 .5v2C9 7 6 8.5 4 11c-1 1.2-1.5 2.5-1 3.5s2 1.5 3.5 1c1-.3 2.2-1 3-2 .3-.3.5-.3.5-.3s.2 0 .5.3c.8 1 2 1.7 3 2 1.5.5 3 0 3.5-1s0-2.3-1-3.5C14 8.5 11 7 9 6.5v-2c0-.3-.5-.5-1-.5z", color: "#e67e22", fr: "L\u00e9pidopt\u00e8re", en: "Lepidoptera" },
  Coleoptera: { path: "M12 3c-1 0-2 .5-2.5 1.5-.2.5-.5.8-1 1C7 6 6 7.5 6 9v6c0 2 1.5 4 3.5 5h.5c.5 0 1-.2 1.5-.5V9.5h1v10c.5.3 1 .5 1.5.5h.5c2-1 3.5-3 3.5-5V9c0-1.5-1-3-2.5-3.5-.5-.2-.8-.5-1-1C14 3.5 13 3 12 3z", color: "#c0392b", fr: "Col\u00e9opt\u00e8re", en: "Coleoptera" },
  Diptera: { path: "M12 6c-1.2 0-2 1-2 2v1c-1 .5-2 1.5-2 3v3c0 2 1.8 4 4 4s4-2 4-4v-3c0-1.5-1-2.5-2-3V8c0-1-.8-2-2-2zM7 8.5C5.5 7 3.5 6.5 3 7.5s.5 3 2 4l2-1.5V9zM17 8.5c1.5-1.5 3.5-2 4-1s-.5 3-2 4l-2-1.5V9z", color: "#7d3c98", fr: "Dipt\u00e8re", en: "Diptera" },
  Hemiptera: { path: "M12 4c-2.5 0-4.5 1.5-5 3.5V9c-1 .5-1.5 1.5-1.5 2.5 0 1.2.8 2.2 2 2.5v2c0 2 2 4 4.5 4s4.5-2 4.5-4v-2c1.2-.3 2-1.3 2-2.5 0-1-.5-2-1.5-2.5v-1.5C16.5 5.5 14.5 4 12 4z", color: "#7d3c98", fr: "H\u00e9mipt\u00e8re", en: "Hemiptera" },
  default_insect: { path: "M12 4c-1.5 0-3 1-3 3v1H7v2h2v1.5H7v2h2V15c0 2.5 1.5 5 3 5s3-2.5 3-5v-1.5h2v-2h-2V10h2V8h-2V7c0-2-1.5-3-3-3z", color: "#b8860b", fr: "Insecte", en: "Insect" },
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
  var icoSz = Math.max(12, sz * 0.6);
  return (
    <div style={{ width: sz, height: sz, borderRadius: sz > 48 ? 10 : 6,
      background: col + "12", border: "1px solid " + col + "25",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      title={name || (item ? item.sci : "")}>
      <svg width={icoSz} height={icoSz} viewBox="0 0 24 24" fill={col} opacity={0.7}>
        <path d={icon.path} />
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
        background: "var(--bg2)", flexShrink: 0 }}
      onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg3)"; }}
      onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg2)"; }}>
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
  var icon = ICONS[lf];
  if (!icon) return null;
  return (<span style={{ fontSize: 9, color: icon.color, fontWeight: 500 }}>{icon[lang] || icon.fr}</span>);
}
