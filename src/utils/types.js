/**
 * Phytomia — Interaction type system
 * 
 * 12 interaction types grouped in 6 families.
 * Each type has a color (from its family), a dash pattern, a stroke width,
 * and an SVG path icon for use on graph links.
 */

export var FAMILIES = {
  mutualisme:   { color: '#2d7d46', fr: 'Mutualisme',              en: 'Mutualism' },
  phyto_fol:    { color: '#b8860b', fr: 'Phytophagie foliaire',    en: 'Leaf phytophagy' },
  phyto_struct: { color: '#6d4c2a', fr: 'Phytophagie structurelle',en: 'Structural phytophagy' },
  phyto_repro:  { color: '#c0392b', fr: 'Phytophagie reproductive',en: 'Reproductive phytophagy' },
  suceur:       { color: '#7d3c98', fr: 'Suceurs de sève',         en: 'Sap feeders' },
  auxiliaire:   { color: '#2874a6', fr: 'Auxiliaires',              en: 'Auxiliaries' },
};

export var TYPES = {
  pollination:   { fam: 'mutualisme',  fr: 'Pollinisation',        en: 'Pollination',        dash: 'none',    w: 2.5, icon: 'M0-3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM0-1.5l-2-2M0-1.5l2-2M0-1.5l0-2.5' },
  hote_larvaire: { fam: 'mutualisme',  fr: 'Plante hôte larvaire', en: 'Larval host plant',  dash: '8 3 2 3', w: 2,   icon: 'M-3 0C-3-3 3-3 3 0C3 3-3 3-3 0z' },
  folivorie:     { fam: 'phyto_fol',   fr: 'Folivorie',            en: 'Leaf feeding',       dash: 'none',    w: 2.2, icon: 'M0-4C-3-2-3 2 0 4C3 2 3-2 0-4zM0-4l0 8' },
  mineuse:       { fam: 'phyto_fol',   fr: 'Mineuse',              en: 'Leaf mining',        dash: '6 3',     w: 1.8, icon: 'M0-4C-3-2-3 2 0 4C3 2 3-2 0-4zM-2 0l4 0' },
  gallicole:     { fam: 'phyto_fol',   fr: 'Gallicole',            en: 'Gall making',        dash: '3 3',     w: 1.8, icon: 'M0-3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z' },
  xylophage:     { fam: 'phyto_struct',fr: 'Xylophage',            en: 'Wood boring',        dash: 'none',    w: 2.2, icon: 'M-3-2h6v4h-6z' },
  rhizophage:    { fam: 'phyto_struct',fr: 'Rhizophage',           en: 'Root feeding',       dash: '6 3',     w: 1.8, icon: 'M0-1l-3 4M0-1l3 4M0-1l0 4' },
  frugivore:     { fam: 'phyto_repro', fr: 'Frugivore/granivore',  en: 'Fruit/seed feeding', dash: 'none',    w: 2.2, icon: 'M0-3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM0-3l1-2' },
  florivore:     { fam: 'phyto_repro', fr: 'Florivore',            en: 'Flower feeding',     dash: '6 3',     w: 1.8, icon: 'M0-3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z' },
  suceur_seve:   { fam: 'suceur',      fr: 'Suceur de sève',       en: 'Sap sucking',        dash: 'none',    w: 2.2, icon: 'M0-4C-2-1-2 1 0 4C2 1 2-1 0-4z' },
  predateur:     { fam: 'auxiliaire',  fr: 'Prédateur',            en: 'Predator',           dash: 'none',    w: 2,   icon: 'M-3 2l3-5 3 5z' },
  parasitoide:   { fam: 'auxiliaire',  fr: 'Parasitoïde',          en: 'Parasitoid',         dash: '6 3',     w: 1.8, icon: 'M-3 0h6M0-3v6' },
};

export var FILTER_GROUPS = [
  { key: 'all',          fr: 'Toutes',       en: 'All' },
  { key: 'mutualisme',   fr: 'Pollinisation', en: 'Pollination' },
  { key: 'phyto_fol',    fr: 'Foliaire',     en: 'Leaf' },
  { key: 'phyto_struct', fr: 'Bois/racines', en: 'Wood/roots' },
  { key: 'phyto_repro',  fr: 'Fruits/fleurs',en: 'Fruits/flowers' },
  { key: 'suceur',       fr: 'Suceurs',      en: 'Sap' },
  { key: 'auxiliaire',   fr: 'Auxiliaires',   en: 'Auxiliaries' },
];

export var STATUS_COLORS = {
  native: '#2d7d46',
  archaeophyte: '#7d6608',
  neophyte: '#c0392b',
  horticultural: '#8e44ad',
  cultivated: '#2874a6',
};

/**
 * IUCN Red List threat categories
 */
export var THREAT_CATS = {
  EX:  { color: '#000000', fr: 'Éteint',              en: 'Extinct',              icon: '✝' },
  EW:  { color: '#3d1466', fr: 'Éteint à l\'état sauvage', en: 'Extinct in the Wild', icon: '✝' },
  RE:  { color: '#5a189a', fr: 'Rég. éteint',         en: 'Regionally Extinct',   icon: '✝' },
  CR:  { color: '#cc3333', fr: 'En danger critique',   en: 'Critically Endangered',icon: '!!' },
  EN:  { color: '#e06000', fr: 'En danger',            en: 'Endangered',           icon: '!' },
  VU:  { color: '#cc9900', fr: 'Vulnérable',           en: 'Vulnerable',           icon: '▲' },
  NT:  { color: '#6b8e23', fr: 'Quasi menacé',         en: 'Near Threatened',      icon: '~' },
  LC:  { color: '#2d7d46', fr: 'Préoccupation mineure',en: 'Least Concern',        icon: '✓' },
  DD:  { color: '#888888', fr: 'Données insuffisantes',en: 'Data Deficient',       icon: '?' },
};

export var THREATENED_CATS = ['CR', 'EN', 'VU'];

export var THREAT_FILTER_OPTIONS = [
  { key: 'threatened', fr: 'Menacées (CR/EN/VU)', en: 'Threatened (CR/EN/VU)', color: '#cc3333' },
  { key: 'NT',         fr: 'Quasi menacées',      en: 'Near Threatened',       color: '#6b8e23' },
  { key: 'LC',         fr: 'Non menacées',         en: 'Least Concern',         color: '#2d7d46' },
];
