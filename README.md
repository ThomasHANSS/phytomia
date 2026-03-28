# 🌿 Phytomia

**Explorateur d'interactions plantes × insectes en Europe**
*Plant × insect interaction explorer for Europe*

Phytomia est une application web open-source qui permet d'explorer les interactions documentées entre plantes et insectes en Europe. Elle agrège des données issues de plusieurs bases scientifiques en accès libre.

**Auteur** : Thomas Hanss — [thomas.hanss@vivantes.fr](mailto:thomas.hanss@vivantes.fr)
**Licence** : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

## Fonctionnalités

- **Recherche universelle** : par nom latin, français ou anglais, plantes et insectes confondus
- **12 types d'interactions** : pollinisation, folivorie, mineuse, gallicole, xylophage, rhizophage, frugivore, florivore, suceur de sève, prédateur, parasitoïde, plante hôte larvaire
- **Graphe d'interactions** : visualisation radiale avec codes visuels (couleur, trait, icône) par type
- **Mode "Mon jardin"** : assembler plusieurs plantes pour visualiser le réseau d'insectes partagés
- **Classement filtrable** : par origine (indigène, cultivée, horticole) ou par rôle écologique
- **Images d'espèces** : chargement automatique depuis Wikipedia / Wikimedia Commons
- **Bilingue** : français / anglais
- **100% responsive** : mobile, tablette, desktop
- **Traçabilité complète** : chaque interaction affiche ses sources, volumes d'observations et couverture géographique

## Sources de données

| Base | Contenu | Licence |
|------|---------|---------|
| [EuPPollNet](https://zenodo.org/records/15183272) | 623K interactions pollinisation, 23 pays EU | CC-BY |
| [EuropeanHostData](https://datadryad.org/dataset/doi:10.5061/dryad.3n5tb2rrx) | 7 598 paires arbre×insecte herbivore, guildes alimentaires | CC0 |
| [GloBI](https://www.globalbioticinteractions.org) | Méta-agrégateur mondial, toutes interactions | CC0 |
| [DBIF](https://catalogue.ceh.ac.uk/documents/33a825f3-05b0-4416-8c04-a2e5b3e31b9c) | 13 277 interactions insecte-plante, GB | OGL |
| [HOSTS](https://data.nhm.ac.uk/dataset/hosts) | ~180K paires lépidoptère×plante hôte | Open |
| [DoPI](https://www.sussex.ac.uk/lifesci/ebe/dopi/) | 101K interactions pollinisation, GB | CC-BY |

## Architecture

```
phytomia/
├── .github/workflows/
│   └── refresh-deploy.yml    ← GitHub Actions : refresh data + deploy
├── public/
│   └── data/                 ← JSON générés par le pipeline
│       ├── plants.json
│       ├── insects.json
│       ├── interactions.json
│       └── last_updated.txt
├── src/
│   ├── components/           ← Composants React
│   │   ├── Header.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Tabs.jsx
│   │   ├── Ranking.jsx
│   │   ├── Garden.jsx
│   │   ├── SpeciesDetail.jsx
│   │   ├── NetworkGraph.jsx
│   │   ├── GardenGraph.jsx
│   │   ├── Thumb.jsx
│   │   └── Footer.jsx
│   ├── hooks/
│   │   └── useData.js        ← Chargement données + images Wikipedia
│   ├── utils/
│   │   └── types.js          ← Système de types d'interactions
│   ├── styles.css            ← CSS responsive mobile-first
│   ├── App.jsx
│   └── main.jsx
├── scripts/                  ← Pipeline Python de données
│   ├── 01_download.py
│   ├── 02_parse_european_host_data.py
│   ├── 03_parse_euppollnet.py
│   ├── 04_parse_globi.py
│   ├── 05_parse_hosts_nhm.py
│   ├── 06_harmonize_taxonomy.py
│   ├── 07_merge.py
│   └── 08_export_app_json.py
├── config/
│   └── sources.json          ← Métadonnées des sources + mapping types
├── package.json
├── vite.config.js
├── requirements.txt          ← Dépendances Python du pipeline
└── LICENSE                   ← CC BY-SA 4.0
```

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone https://github.com/<votre-user>/phytomia.git
cd phytomia
npm install
```

### 2. Générer les données (première fois)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Téléchargement automatique (GloBI, EuropeanHostData)
python scripts/01_download.py

# Pour les bases manuelles, suivre les instructions affichées
# puis exécuter les parsers correspondants

python scripts/run_pipeline.py
```

Le script orchestre tout : téléchargement, parsing, harmonisation, fusion, export, et snapshots. Si une source échoue, il restaure automatiquement le dernier snapshot connu.

### 3. Lancer en local

```bash
npm run dev
```

L'app est accessible sur `http://localhost:5173/phytomia/`.

### 4. Déployer

Le workflow GitHub Actions se déclenche automatiquement à chaque push sur `main`.
Il exécute le pipeline de données et déploie sur GitHub Pages.

Pour un déploiement sur Netlify ou un domaine custom (phytomia.org) :
modifier `base` dans `vite.config.js` → `'/'`.

## Résilience des données (snapshots)

Les bases de données scientifiques peuvent disparaître : serveur en panne, DOI cassé,
changement de politique d'accès, fin de financement. Phytomia se protège avec un
système de **snapshots automatiques**.

### Comment ça marche

Après chaque parsing réussi, le pipeline archive une copie du fichier parsé dans
`data/snapshots/<source>/`. Ce dossier est **commité dans le repo Git** — il survit
à tout.

Si lors d'un refresh automatique une source est inaccessible :

1. Le téléchargement échoue → le pipeline log l'erreur
2. Il cherche un snapshot pour cette source → le trouve dans `data/snapshots/`
3. Il restaure le snapshot dans `data/parsed/` → le pipeline continue normalement
4. Le `manifest.json` note le statut `restored_from_snapshot`

Les données ne disparaissent **jamais** — elles peuvent juste devenir anciennes.

### Commandes utiles

```bash
# Voir le statut de tous les snapshots
python scripts/09_snapshot.py status

# Restaurer manuellement un snapshot
python scripts/09_snapshot.py restore european_host_data

# Lancer le pipeline complet (snapshots automatiques)
python scripts/run_pipeline.py

# Lancer avec re-téléchargement forcé
python scripts/run_pipeline.py --force
```

### Ce qui est archivé

Le `manifest.json` contient pour chaque source :
- Date du dernier snapshot réussi
- Hash SHA-256 du fichier (détection des changements)
- Nombre de lignes (détection d'anomalies)
- Statut : `ok`, `restored_from_snapshot`, ou `download_failed`
- Date de la dernière erreur et message d'erreur

## Mise à jour automatique des données

Le workflow `.github/workflows/refresh-deploy.yml` :

1. **S'exécute chaque lundi à 4h UTC** (modifiable dans le cron)
2. Re-télécharge les bases avec API (GloBI, GBIF taxonomy)
3. Re-parse les données brutes si elles ont été mises à jour manuellement
4. Harmonise la taxonomie via l'API GBIF
5. Fusionne, dédoublonne, exporte les JSON
6. Commit les nouveaux JSON dans le repo
7. Rebuild et déploie le site

Pour déclencher manuellement : Actions → "Refresh Data & Deploy" → "Run workflow".

Pour ajouter des données manuelles (EuPPollNet, DBIF, DoPI) :
- Ouvrir un **GitHub Codespace** sur le repo
- Placer les fichiers bruts dans `data/raw/<source>/`
- Exécuter les scripts de parsing correspondants
- Commit & push → le workflow redéploie automatiquement

## Ajouter une nouvelle source de données

1. Ajouter l'entrée dans `config/sources.json`
2. Créer un script `scripts/XX_parse_<source>.py` qui produit un CSV normalisé
3. Le format attendu : `plant_name, insect_name, interaction_type, source_db, n_obs, geo, year_range`
4. Les `interaction_type` doivent utiliser la typologie Phytomia (voir `src/utils/types.js`)
5. Le script `07_merge.py` intègre automatiquement tout CSV présent dans `data/parsed/`

## Statuts de menace UICN

Phytomia affiche le statut de conservation de chaque espèce quand il est connu.
Les données proviennent de deux sources complémentaires :

| Source | Couverture | Accès |
|--------|-----------|-------|
| **European Red List (EEA)** | ~10 000 espèces EU (papillons, abeilles, libellules, coléoptères, plantes) | CSV libre, auto-download |
| **IUCN Red List API v4** | 172 600+ espèces mondiales | Clé API gratuite (inscription) |

### Catégories affichées

- 🔴 **CR** — En danger critique · **EN** — En danger · **VU** — Vulnérable
- 🟡 **NT** — Quasi menacé
- 🟢 **LC** — Préoccupation mineure
- ⚫ **EX** — Éteint · **DD** — Données insuffisantes

### Activer l'API IUCN (optionnel)

La European Red List suffit pour la plupart des espèces européennes. Pour compléter
avec les statuts mondiaux, ajouter une clé API :

1. S'inscrire sur https://api.iucnredlist.org/users/sign_up
2. Ajouter le secret dans GitHub : Settings → Secrets → `IUCN_API_KEY`
3. Le pipeline l'utilisera automatiquement à chaque refresh

Sans clé, le pipeline fonctionne normalement — il utilise juste la Red List EU.

### Filtres dans l'interface

L'interface permet de filtrer les classements par statut de menace :
- **Menacées (CR/EN/VU)** — montre uniquement les espèces menacées
- **Quasi menacées (NT)** — les espèces proches du seuil de menace

Un badge coloré UICN s'affiche sur chaque fiche espèce et dans les classements.

## Crédits et citations

Si vous utilisez Phytomia dans un contexte scientifique, merci de citer les bases sources :

- Lanuza et al. (2025). EuPPollNet. *Global Ecology and Biogeography*. DOI: 10.1111/geb.70000
- Trombik et al. (2024). EuropeanHostData. *Dryad*. DOI: 10.5061/dryad.3n5tb2rrx
- Poelen, Simons & Mungall (2014). Global Biotic Interactions.
- Ward (2021). DBIF v2. NERC EIDC. DOI: 10.5285/33a825f3-05b0-4416-8c04-a2e5b3e31b9c
- Robinson et al. HOSTS database. Natural History Museum, London.

Photos d'espèces : [Wikimedia Commons](https://commons.wikimedia.org/) (CC BY-SA / domaine public).

## Contact

Thomas Hanss — [thomas.hanss@vivantes.fr](mailto:thomas.hanss@vivantes.fr)
