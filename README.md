# 🌿 Phytomia

**Explorateur d'interactions plantes × insectes en Europe**
*Plant × insect interaction explorer for Europe*

Phytomia est une application web open-source qui permet d'explorer les interactions documentées entre plantes et insectes en Europe. Elle agrège, harmonise et met en relation les données issues de six bases scientifiques en accès libre, couvrant 108 245 interactions entre 11 569 espèces végétales et 9 800 espèces d'insectes.

**Site** : [https://ThomasHANSS.github.io/phytomia/](https://ThomasHANSS.github.io/phytomia/)
**Auteur** : Thomas Hanss — [thomas.hanss@vivantes.fr](mailto:thomas.hanss@vivantes.fr)
**Licence** : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

## L'application en chiffres

| Indicateur | Volume |
|---|---|
| Interactions documentées | **108 245** paires plante × insecte |
| Espèces végétales | **11 569** (arbres, arbustes, herbacées, graminées, grimpantes) |
| Espèces d'insectes | **9 800** (hyménoptères, lépidoptères, coléoptères, diptères, hémiptères) |
| Bases de données intégrées | **6** sources scientifiques open-access |
| Interactions multi-sources | **7 161** paires confirmées par au moins 2 bases indépendantes |
| Types d'interactions | **12** catégories écologiques |
| Pays couverts | **23+** pays européens |
| Harmonisation taxonomique | **99,5 %** des espèces alignées via GBIF |

## Fonctionnalités

**Recherche universelle** — Trouvez n'importe quelle plante ou insecte par nom latin, français ou anglais. L'autocomplétion fonctionne sur les 21 000+ espèces de la base.

**Fiche espèce détaillée** — Pour chaque espèce : famille, ordre, forme de croissance (arbre >4m, arbuste, herbacée, graminée, grimpante), nombre d'interactions, lien vers Wikipedia, et badge de statut de menace UICN quand disponible.

**Graphe d'interactions hiérarchique** — Vue synthétique par catégorie d'interaction (pollinisation, folivorie, xylophage, etc.) avec le nombre d'espèces liées, puis vue détaillée avec top 10 en barres horizontales et liste complète groupée par ordre taxonomique. Lisible même avec 1 000+ interactions.

**Mode « Mon jardin »** — Assemblez plusieurs plantes pour visualiser le réseau croisé : quels insectes sont partagés, quelles synergies émergent.

**Classements filtrables** — Par origine (indigène, cultivée, horticole), par rôle écologique (pollinisateur, folivore, xylophage…), ou par statut de menace (CR, EN, VU).

**12 types d'interactions** — Pollinisation, folivorie, mineuse, gallicole, xylophage, rhizophage, frugivore, florivore, suceur de sève, prédateur, parasitoïde, plante hôte larvaire. Chaque type est associé à une couleur et un style visuel (trait plein, pointillé, etc.).

**Icônes par forme de croissance** — Silhouettes botaniques (arbre, arbuste, grimpante, herbacée, graminée) et entomologiques (hyménoptère, lépidoptère, coléoptère, diptère, hémiptère) pour une identification visuelle immédiate.

**Bilingue** — Interface français / anglais, commutable en un clic.

**Responsive** — Mobile, tablette, desktop.

**Traçabilité complète** — Chaque interaction affiche ses sources, volumes d'observations et couverture géographique.

---

## Sources de données

Phytomia agrège six bases de données scientifiques complémentaires, couvrant des types d'interactions différents (pollinisation, herbivorie, parasitisme) et des zones géographiques variées (pan-européen, Grande-Bretagne, mondial).

### EuPPollNet — European Plant-Pollinator Networks

| Attribut | Valeur |
|---|---|
| **Interactions chargées** | 21 533 paires uniques (623 477 observations brutes) |
| **Couverture** | 23 pays européens |
| **Type** | Pollinisation (observations focales et captures) |
| **Licence** | CC-BY |
| **DOI** | [10.5281/zenodo.15183272](https://zenodo.org/records/15183272) |
| **Citation** | Lanuza et al. (2025). EuPPollNet: a European database of plant-pollinator networks. *Global Ecology and Biogeography*, 34, e70000. |

La plus grande base européenne de réseaux plantes-pollinisateurs. 54 réseaux issus de 54 études, avec taxonomie harmonisée, coordonnées géographiques, habitat, et bioregion pour chaque observation. Accès restreint sur Zenodo — demande d'accès nécessaire.

### EuropeanHostData — Insectes herbivores des arbres européens

| Attribut | Valeur |
|---|---|
| **Interactions chargées** | 8 077 paires uniques |
| **Couverture** | Pan-européen (littérature scientifique) |
| **Type** | Folivorie (3 827), suceurs de sève (2 345), xylophages (1 442), gallicoles (463) |
| **Licence** | CC0 |
| **DOI** | [10.5061/dryad.3n5tb2rrx](https://datadryad.org/dataset/doi:10.5061/dryad.3n5tb2rrx) |
| **Citation** | Trombik et al. (2024). EuropeanHostData. *Dryad*. |

Base compilée à partir de la littérature couvrant les interactions entre arbres européens (82 espèces) et leurs insectes herbivores (2 933 espèces). Chaque interaction est classée par guilde alimentaire (folivore, suceur de sève, xylophage, gallicole).

### GloBI — Global Biotic Interactions

| Attribut | Valeur |
|---|---|
| **Interactions chargées** | 100 200 paires (pollinisation + folivorie) |
| **Couverture** | Mondial, filtré pour les taxons européens |
| **Type** | Pollinisation (majoritaire), folivorie |
| **Licence** | CC0 |
| **URL** | [globalbioticinteractions.org](https://www.globalbioticinteractions.org) |
| **Citation** | Poelen, Simons & Mungall (2014). Global Biotic Interactions. |

Méta-agrégateur mondial indexant les interactions biotiques depuis des centaines de bases et publications. Interrogé via API REST pour les types `pollinates`, `eats`, et `flowersVisitedBy`, avec requêtes ciblées par genre pour les pollinisateurs clés (Apis, Bombus, Andrena, Osmia, Pieris, Vanessa, Coccinella, etc.).

### DBIF v2 — Database of Insects and their Food Plants

| Attribut | Valeur |
|---|---|
| **Interactions chargées** | 10 021 paires uniques |
| **Couverture** | Grande-Bretagne |
| **Type** | Herbivorie (folivorie) |
| **Licence** | OGL (Open Government Licence) |
| **DOI** | [10.5285/33a825f3-05b0-4416-8c04-a2e5b3e31b9c](https://catalogue.ceh.ac.uk/documents/33a825f3-05b0-4416-8c04-a2e5b3e31b9c) |
| **Citation** | Ward (2021). Database of Insects and their Food Plants v2. NERC Environmental Information Data Centre. |

Base historique britannique documentant les insectes phytophages et leurs plantes hôtes, avec fréquence d'interaction. Inscription gratuite requise sur le portail EIDC.

### HOSTS — Host Plants of World Lepidoptera

| Attribut | Valeur |
|---|---|
| **Interactions chargées** | 3 891 paires uniques (9 000 records sur 140 485 disponibles) |
| **Couverture** | Mondial (filtré familles européennes) |
| **Type** | Plante hôte larvaire (lépidoptères) |
| **Licence** | Open |
| **URL** | [data.nhm.ac.uk/dataset/hosts](https://data.nhm.ac.uk/dataset/hosts) |
| **Citation** | Robinson et al. HOSTS database. Natural History Museum, London. |

Base du Natural History Museum de Londres couvrant les plantes hôtes de tous les lépidoptères du monde. Accès via API CKAN (limité à ~9 000 enregistrements par session). Filtré pour les familles de lépidoptères présentes en Europe (Nymphalidae, Pieridae, Geometridae, Noctuidae, etc.).

### Bases non encore intégrées

| Base | Contenu | Statut |
|---|---|---|
| **DoPI** (Univ. Sussex) | 101K interactions pollinisation, GB | En attente de téléchargement |
| **European Red List** (EEA) | Statuts de menace UICN, ~10 000 espèces | Script prêt, téléchargement manuel requis |
| **IUCN Red List API v4** | 172 600+ espèces mondiales | Script prêt, clé API gratuite requise |

---

## Méthode d'harmonisation des données

### Problème

Chaque base de données utilise ses propres conventions taxonomiques : noms d'auteurs différents, synonymes, orthographes variables, niveaux taxonomiques hétérogènes. Sans harmonisation, *Bombus terrestris* dans EuPPollNet et *Bombus terrestris* (Linnaeus, 1758) dans GloBI seraient comptés comme deux espèces distinctes.

### Pipeline en 8 étapes

Le pipeline Python (`scripts/`) transforme les données brutes en JSON exploitables par l'application :

**Étape 1 — Téléchargement** (`01_download.py`)
Téléchargement automatique depuis les APIs (GloBI REST, NHM CKAN, Dryad). Les bases nécessitant un accès manuel (EuPPollNet, DBIF, DoPI) affichent des instructions de téléchargement.

**Étape 2-5 — Parsing** (`02_parse_*.py` à `05_parse_*.py`)
Chaque source est parsée selon son format propre (CSV virgule, CSV point-virgule, API JSON) et normalisée vers un format commun : `plant_name, insect_name, interaction_type, source_db, n_obs, geo, year_range`. Les noms scientifiques sont nettoyés (extraction du binôme genre + espèce, suppression des auteurs et sous-espèces).

**Étape 6 — Harmonisation taxonomique** (`06_harmonize_taxonomy.py`)
Chaque nom d'espèce est soumis à l'API [GBIF Species Match](https://www.gbif.org/developer/species) qui retourne le nom accepté, la famille, l'ordre, le phylum et un score de confiance. Résultats :
- **95,4 %** de matchs exacts (nom reconnu directement)
- **2,3 %** de matchs de rang supérieur (genre reconnu, espèce non)
- **1,8 %** de matchs approximatifs (correction orthographique automatique)
- **0,5 %** de noms non reconnus (noms incomplets, morpho-espèces)

Un cache local (`data/taxonomy/gbif_cache.json`) évite de re-interroger GBIF pour les espèces déjà connues.

**Étape 7 — Fusion et dédoublonnage** (`07_merge.py`)
Toutes les sources parsées sont fusionnées. Les paires plante×insecte identiques sont dédoublonnées, les observations sommées, et les sources sont tracées. Une paire présente dans 2+ bases est marquée « multi-source » (indicateur de robustesse).

**Étape 8 — Export JSON** (`08_export_app_json.py`)
Génération de trois fichiers JSON optimisés pour le chargement par l'application React : `plants.json`, `insects.json`, `interactions.json`. Chaque espèce porte son identifiant unique, sa taxonomie complète (famille, ordre), et son statut de menace UICN quand disponible.

### Mapping des types d'interactions

Les différentes bases utilisent des vocabulaires hétérogènes pour décrire les interactions. Le pipeline normalise vers 12 types :

| Type Phytomia | Sources | Termes d'origine |
|---|---|---|
| `pollination` | EuPPollNet, GloBI | pollinates, visits flowers of |
| `folivorie` | EuropeanHostData, DBIF, GloBI | Folivore, leaf miner, eats |
| `suceur_seve` | EuropeanHostData | Sap |
| `xylophage` | EuropeanHostData | Wood |
| `gallicole` | EuropeanHostData | Gall |
| `hote_larvaire` | HOSTS NHM | (toute la base) |
| `mineuse` | EuropeanHostData | leaf miner |
| `frugivore` | GloBI | fruit feeder |
| `florivore` | GloBI | flower feeder |
| `rhizophage` | GloBI | root feeder |
| `predateur` | GloBI | preys on |
| `parasitoide` | GloBI | parasitoid of |

### Classification des formes de croissance végétales

Les plantes sont classées par forme de croissance selon leur port et leur hauteur à maturité, avec un seuil arbre/arbuste fixé à 4 m :

| Forme de vie | Critère | Exemples |
|---|---|---|
| **Arbre** (>4m) | Genre dans TREE_GENERA ou famille dans TREE_FAMILIES | Quercus, Fagus, Tilia, Picea |
| **Arbuste** (<4m) | Genre dans SHRUB_GENERA ou famille dans SHRUB_FAMILIES | Rosa, Buddleja, Sambucus, Lavandula |
| **Grimpante** | Genre dans CLIMBER_GENERA | Hedera, Clematis, Vitis, Wisteria |
| **Graminée** | Famille dans GRASS_FAMILIES (Poaceae, Cyperaceae, Juncaceae) | Poa, Festuca, Lolium |
| **Herbacée** | Défaut (toute plante ne correspondant pas aux catégories ci-dessus) | Trifolium, Taraxacum, Centaurea |

Le mapping se fait par genre d'abord (plus précis), puis par famille en fallback.

---

## Résilience des données (snapshots)

Les bases de données scientifiques peuvent disparaître : serveur en panne, DOI cassé, changement de politique d'accès, fin de financement. Phytomia se protège avec un système de snapshots automatiques.

Après chaque parsing réussi, le pipeline archive une copie du fichier parsé dans `data/snapshots/<source>/`. Ce dossier est commité dans le repo Git — il survit à tout. Si lors d'un refresh automatique une source est inaccessible, le pipeline restaure automatiquement le dernier snapshot connu. Les données ne disparaissent jamais — elles peuvent juste devenir anciennes.

Le `manifest.json` contient pour chaque source : date du dernier snapshot, hash SHA-256, nombre de lignes, et statut (`ok`, `restored_from_snapshot`, ou `download_failed`).

---

## Architecture technique

```
phytomia/
├── .github/workflows/
│   └── refresh-deploy.yml        ← GitHub Actions : build + deploy
├── public/
│   └── data/                     ← JSON générés par le pipeline
│       ├── plants.json           (11 569 espèces, ~1,1 MB)
│       ├── insects.json          (9 800 espèces, ~700 KB)
│       ├── interactions.json     (108 245 paires, ~7,5 MB)
│       └── last_updated.txt
├── src/
│   ├── components/               ← 11 composants React
│   │   ├── Header.jsx            ← Logo + titre bicolore + switch FR/EN
│   │   ├── SearchBar.jsx         ← Autocomplétion sur 21 000+ espèces
│   │   ├── Tabs.jsx              ← Navigation Recherche / Classements / Jardin
│   │   ├── Ranking.jsx           ← Classements filtrables (origine, rôle, menace)
│   │   ├── SpeciesDetail.jsx     ← Fiche espèce + graphe + lien Wikipedia
│   │   ├── NetworkGraph.jsx      ← Vue hiérarchique (cartes + top10 + liste)
│   │   ├── Garden.jsx            ← Sélection de plantes pour le jardin
│   │   ├── GardenGraph.jsx       ← Graphe croisé du jardin
│   │   ├── Thumb.jsx             ← Icônes SVG par forme de croissance + lien Wiki
│   │   ├── ThreatBadge.jsx       ← Badge UICN coloré
│   │   └── Footer.jsx            ← Attribution + licence
│   ├── hooks/useData.js          ← Chargement et indexation des données
│   ├── utils/types.js            ← 12 types d'interactions + familles + UICN
│   ├── styles.css                ← CSS responsive (4 breakpoints)
│   ├── App.jsx                   ← Routeur principal
│   └── main.jsx                  ← Point d'entrée
├── scripts/                      ← Pipeline Python (12 scripts)
│   ├── 01_download.py            ← Téléchargement auto (Dryad, GloBI, CKAN)
│   ├── 02_parse_european_host_data.py
│   ├── 03_parse_euppollnet.py
│   ├── 04_parse_globi.py
│   ├── 05_parse_hosts_nhm.py
│   ├── 06_harmonize_taxonomy.py  ← GBIF Species Match API
│   ├── 07_merge.py               ← Fusion + dédoublonnage
│   ├── 08_export_app_json.py     ← Génération JSON pour React
│   ├── 09_snapshot.py            ← Archivage de résilience
│   ├── 10_fetch_threat_status.py ← European Red List + IUCN API
│   ├── run_pipeline.py           ← Orchestrateur avec fallback
│   └── snapshot_manager.py       ← Module importable
├── config/sources.json           ← Métadonnées des sources + mapping types
├── data/
│   ├── raw/                      ← Fichiers bruts téléchargés (non commités)
│   ├── parsed/                   ← CSV normalisés (non commités)
│   ├── merged/                   ← Données fusionnées (non commité)
│   ├── taxonomy/                 ← Cache GBIF + statuts UICN
│   └── snapshots/                ← Archives de résilience (commitées)
├── package.json                  ← Vite + React
├── vite.config.js
├── requirements.txt              ← pandas, requests, tqdm
├── LICENSE                       ← CC BY-SA 4.0
└── README.md
```

---

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone https://github.com/ThomasHANSS/phytomia.git
cd phytomia
npm install
```

### 2. Générer les données (première fois)

```bash
pip install pandas requests tqdm

# Téléchargement automatique (GloBI, EuropeanHostData, HOSTS NHM)
python scripts/01_download.py

# Pour EuPPollNet : demander accès sur Zenodo, dézipper dans data/raw/euppollnet/
# Pour DBIF : s'inscrire sur EIDC, placer les CSV dans data/raw/dbif/

# Parser chaque source
python scripts/02_parse_european_host_data.py
python scripts/03_parse_euppollnet.py
python scripts/04_parse_globi.py
python scripts/05_parse_hosts_nhm.py

# Harmoniser la taxonomie (~20 min pour ~20 000 espèces)
python scripts/06_harmonize_taxonomy.py

# Fusionner et exporter
python scripts/07_merge.py
python scripts/08_export_app_json.py

# Copier les JSON vers l'app
cp output/*.json public/data/
```

### 3. Lancer en local

```bash
npm run dev
```

L'app est accessible sur `http://localhost:5173/phytomia/`.

### 4. Déployer

Le workflow GitHub Actions se déclenche automatiquement à chaque push sur `main`. Il build le site et le déploie sur GitHub Pages.

---

## Statuts de menace UICN

Phytomia affiche le statut de conservation de chaque espèce quand il est connu. Les données proviennent de deux sources complémentaires :

| Source | Couverture | Accès |
|---|---|---|
| **European Red List (EEA)** | ~10 000 espèces EU (papillons, abeilles, libellules, coléoptères, plantes) | CSV libre |
| **IUCN Red List API v4** | 172 600+ espèces mondiales | Clé API gratuite (inscription sur api.iucnredlist.org) |

Les catégories affichées suivent la nomenclature UICN : CR (en danger critique), EN (en danger), VU (vulnérable), NT (quasi menacé), LC (préoccupation mineure), DD (données insuffisantes).

Pour activer les statuts IUCN mondiaux, ajouter le secret `IUCN_API_KEY` dans les paramètres du repo GitHub.

---

## Ajouter une nouvelle source de données

1. Ajouter l'entrée dans `config/sources.json`
2. Créer un script `scripts/XX_parse_<source>.py` produisant un CSV normalisé
3. Format attendu : `plant_name, insect_name, interaction_type, source_db, n_obs, geo, year_range`
4. Les `interaction_type` doivent utiliser la typologie Phytomia (voir `src/utils/types.js`)
5. Le script `07_merge.py` intègre automatiquement tout CSV présent dans `data/parsed/`

---

## Crédits et citations

Si vous utilisez Phytomia dans un contexte scientifique, merci de citer les bases sources :

- Lanuza, J.B. et al. (2025). EuPPollNet: a European database of plant-pollinator networks. *Global Ecology and Biogeography*, 34, e70000. DOI: [10.1111/geb.70000](https://doi.org/10.1111/geb.70000)
- Trombik, J. et al. (2024). EuropeanHostData: a dataset of European tree-insect herbivore interactions. *Dryad*. DOI: [10.5061/dryad.3n5tb2rrx](https://doi.org/10.5061/dryad.3n5tb2rrx)
- Poelen, J.H., Simons, J.D. & Mungall, C.J. (2014). Global Biotic Interactions: an open infrastructure to share and analyze species-interaction datasets. *Ecological Informatics*, 24, 148-159.
- Ward, L.K. (2021). Database of Insects and their Food Plants v2. NERC Environmental Information Data Centre. DOI: [10.5285/33a825f3-05b0-4416-8c04-a2e5b3e31b9c](https://doi.org/10.5285/33a825f3-05b0-4416-8c04-a2e5b3e31b9c)
- Robinson, G.S. et al. HOSTS — a database of the World's Lepidopteran Hostplants. Natural History Museum, London. [data.nhm.ac.uk/dataset/hosts](https://data.nhm.ac.uk/dataset/hosts)

Harmonisation taxonomique : [GBIF Species Match API](https://www.gbif.org/developer/species).

Icônes : silhouettes SVG originales basées sur la morphologie des ordres d'insectes et une classification simplifiée des formes de croissance végétales (arbre >4m, arbuste <4m, grimpante, herbacée, graminée).

---

## Contact

Thomas Hanss — [thomas.hanss@vivantes.fr](mailto:thomas.hanss@vivantes.fr)

Contributions bienvenues : ouvrir une *issue* ou une *pull request* sur le repo GitHub.
