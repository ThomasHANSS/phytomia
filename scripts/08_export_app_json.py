#!/usr/bin/env python3
"""
Phytomia — Export JSON pour l'app React

Lit le fichier fusionné et la table taxonomique, et produit 3 fichiers JSON
optimisés pour l'app frontend :

  output/plants.json      — liste des plantes avec métadonnées
  output/insects.json     — liste des insectes avec métadonnées
  output/interactions.json — toutes les interactions avec sources

Les IDs sont des hashes courts pour la stabilité entre versions.
"""

import csv
import json
import hashlib
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
MERGED = ROOT / "data" / "merged" / "interactions_merged.csv"
TAX = ROOT / "data" / "taxonomy" / "species_map.csv"
OUTPUT = ROOT / "output"


def short_id(name, prefix=""):
    """Génère un ID court et stable à partir du nom."""
    h = hashlib.md5(name.encode()).hexdigest()[:6]
    return f"{prefix}{h}"


def load_taxonomy():
    """Charge la table taxonomique pour enrichir les métadonnées."""
    tax = {}
    if not Path(TAX).exists():
        return tax
    with open(TAX, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tax[row["accepted_name"]] = row
            tax[row["input_name"]] = row
    return tax



def load_vernacular_names():
    vern_file = ROOT / "data" / "taxonomy" / "vernacular_cache.json"
    if vern_file.exists():
        import json
        with open(vern_file) as f:
            return json.load(f)
    return {}


TREE_GENERA = {"Quercus","Fagus","Betula","Picea","Pinus","Abies","Larix","Acer","Fraxinus","Tilia","Ulmus","Alnus","Carpinus","Castanea","Populus","Salix","Platanus","Juglans","Cedrus","Taxus","Cupressus","Eucalyptus","Prunus","Malus","Pyrus","Sorbus","Olea","Robinia","Gleditsia","Magnolia","Morus","Ilex","Aesculus","Ailanthus","Catalpa","Liriodendron","Paulownia","Corylus","Celtis","Cercis","Citrus","Liquidambar","Ginkgo","Thuja","Juniperus","Arbutus","Zelkova","Carya","Diospyros","Koelreuteria","Sapindus","Ficus","Ceratonia","Amelanchier","Eriobotrya","Mespilus"}
SHRUB_GENERA = {"Rosa","Rubus","Buddleja","Sambucus","Cornus","Viburnum","Ligustrum","Lonicera","Ribes","Berberis","Cotoneaster","Crataegus","Rhamnus","Euonymus","Buxus","Lavandula","Rosmarinus","Cistus","Erica","Calluna","Rhododendron","Syringa","Philadelphus","Hydrangea","Spiraea","Deutzia","Potentilla","Hippophae","Myrica","Ceanothus","Daphne","Genista","Cytisus","Ulex","Elaeagnus","Tamarix","Myrtus","Laurus","Nerium","Colutea","Paliurus","Pistacia"}
CLIMBER_GENERA = {"Hedera","Clematis","Wisteria","Vitis","Parthenocissus","Passiflora","Jasminum","Lonicera","Campsis","Fallopia","Calystegia","Convolvulus","Ipomoea","Bryonia"}
GRASS_FAMILIES = {"Poaceae","Cyperaceae","Juncaceae"}
TREE_FAMILIES = {"Fagaceae","Betulaceae","Pinaceae","Cupressaceae","Taxaceae","Juglandaceae","Ulmaceae","Platanaceae","Oleaceae","Sapindaceae","Hippocastanaceae","Altingiaceae","Ginkgoaceae","Moraceae","Aquifoliaceae","Araucariaceae","Lauraceae","Myrtaceae","Rutaceae","Meliaceae","Anacardiaceae","Combretaceae","Arecaceae"}
SHRUB_FAMILIES = {"Ericaceae","Caprifoliaceae","Grossulariaceae","Berberidaceae","Buxaceae","Cistaceae","Thymelaeaceae","Elaeagnaceae","Myricaceae","Rhamnaceae"}


# Species commonly cultivated in European gardens/parks even if non-native
CULTIVATED_EU_GENERA = {
    "Ginkgo","Aesculus","Catalpa","Liriodendron","Paulownia","Ailanthus",
    "Cedrus","Sequoia","Sequoiadendron","Metasequoia","Cryptomeria",
    "Eucalyptus","Magnolia","Cercis","Robinia","Gleditsia",
    "Citrus","Persea","Actinidia","Diospyros","Ficus","Morus",
    "Camellia","Rhododendron","Hydrangea","Wisteria","Buddleja",
    "Forsythia","Mahonia","Aucuba","Fatsia","Nandina","Skimmia",
    "Hibiscus","Lagerstroemia","Coffea","Nicotiana","Cannabis",
    "Dahlia","Zinnia","Cosmos","Tagetes","Pelargonium","Begonia",
    "Fuchsia","Petunia","Passiflora","Agave","Yucca","Opuntia",
    "Musa","Canna","Mangifera","Litchi","Psidium",
}
TRULY_EXOTIC_FAMILIES = {
    "Dipterocarpaceae","Rhizophoraceae","Lecythidaceae","Pandanaceae",
    "Heliconiaceae","Strelitziaceae","Marantaceae",
}
TRULY_EXOTIC_GENERA = {
    "Durio","Artocarpus","Averrhoa","Erythroxylum","Cinchona",
    "Shorea","Parashorea","Anthoshorea",
    "Bruguiera","Kandelia","Nypa",
    "Phoenicophorium","Nephrosperma","Deckenia","Sabal","Serenoa",
}
MOSTLY_EXOTIC_FAMILIES = {
    "Arecaceae","Bromeliaceae","Sapotaceae","Annonaceae",
    "Melastomataceae","Proteaceae","Zingiberaceae","Combretaceae","Loranthaceae",
}

NATIVE_EU_SPECIES = {
    "Cercis siliquastrum","Ficus carica",
    "Rhododendron ferrugineum","Rhododendron hirsutum",
    "Rhododendron ponticum","Rhododendron palustre",
}

def detect_region(name, family):
    if name in NATIVE_EU_SPECIES:
        return ""
    genus = name.split()[0] if name else ""
    if genus in CULTIVATED_EU_GENERA:
        return "non-native"
    if family in TRULY_EXOTIC_FAMILIES or genus in TRULY_EXOTIC_GENERA:
        return "extra-EU"
    if family in MOSTLY_EXOTIC_FAMILIES:
        return "extra-EU"
    return ""

def detect_growth_form(name, family):
    genus = name.split()[0] if name else ""
    if genus in CLIMBER_GENERA:
        return "climber"
    if genus in TREE_GENERA:
        return "tree"
    if genus in SHRUB_GENERA:
        return "shrub"
    if family in GRASS_FAMILIES:
        return "grass"
    if family in TREE_FAMILIES:
        return "tree"
    if family in SHRUB_FAMILIES:
        return "shrub"
    return "herb"

def detect_plant_status(name, family):
    """Heuristique pour le statut des plantes. Retourne vide si incertain."""
    # Sans base de reference fiable (Euro+Med PlantBase, EPPO),
    # on ne marque que les cas evidents. Le reste reste vide.
    neophytes = {"Buddleja", "Robinia", "Ailanthus", "Reynoutria", "Impatiens",
                 "Acer negundo", "Prunus serotina", "Solidago canadensis",
                 "Heracleum mantegazzianum", "Fallopia japonica",
                 "Rhododendron ponticum", "Senecio inaequidens",
                 "Ambrosia artemisiifolia", "Oxalis pes-caprae"}
    cultivated = {"Malus domestica", "Prunus domestica", "Pyrus communis",
                  "Brassica napus", "Brassica oleracea", "Vitis vinifera",
                  "Olea europaea", "Citrus sinensis", "Citrus limon",
                  "Triticum aestivum", "Zea mays", "Solanum tuberosum",
                  "Solanum lycopersicum", "Helianthus annuus", "Beta vulgaris",
                  "Pisum sativum", "Phaseolus vulgaris", "Hordeum vulgare",
                  "Avena sativa", "Secale cereale", "Cannabis sativa",
                  "Linum usitatissimum", "Nicotiana tabacum"}
    cultivated_genera = {"Triticum", "Zea", "Hordeum", "Avena", "Secale",
                         "Citrus", "Nicotiana"}
    horticultural = {"Dahlia", "Zinnia", "Cosmos", "Petunia", "Tagetes",
                     "Pelargonium", "Begonia", "Impatiens walleriana",
                     "Fuchsia", "Surfinia", "Calibrachoa"}

    genus = name.split()[0] if name else ""

    if name in horticultural or genus in {"Dahlia", "Zinnia", "Cosmos",
            "Petunia", "Tagetes", "Pelargonium", "Begonia", "Fuchsia"}:
        return "horticultural"
    if name in cultivated or genus in cultivated_genera:
        return "cultivated"
    if name in neophytes or genus in {"Buddleja", "Ailanthus", "Reynoutria",
            "Fallopia", "Ambrosia"}:
        return "neophyte"
    return ""  # Inconnu — pas de statut affiche


def load_threat_status():
    """Charge les statuts de menace UICN."""
    threat = {}
    threat_file = ROOT / "data" / "taxonomy" / "threat_status.csv"
    if not threat_file.exists():
        print("  ℹ Pas de fichier threat_status.csv — statuts de menace ignorés")
        print("    Exécuter : python scripts/10_fetch_threat_status.py")
        return threat
    with open(threat_file, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = row.get("species", "") or row.get("scientific_name", "")
            cat = row.get("category", "") or row.get("iucn_category", "")
            if name and cat:
                threat[name] = {
                    "cat": cat,
                    "criteria": row.get("iucn_criteria", ""),
                    "scope": row.get("scope", ""),
                }
    print(f"  ✓ {len(threat)} espèces avec statut de menace")
    return threat


def export():
    print("═══ Export JSON pour l'app ═══")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    
    if not MERGED.exists():
        print(f"  ✗ Fichier fusionné non trouvé : {MERGED}")
        print(f"    Exécuter d'abord : python scripts/07_merge.py")
        return
    
    tax = load_taxonomy()
    threat = load_threat_status()
    vern = load_vernacular_names()
    print(f"  {len(vern):,} noms vernaculaires chargés")
    
    # Lire les interactions fusionnées
    interactions_raw = []
    with open(MERGED, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            interactions_raw.append(row)
    
    print(f"  → {len(interactions_raw)} interactions à exporter")
    
    # Collecter plantes et insectes
    plant_names = set()
    insect_names = set()
    for ix in interactions_raw:
        plant_names.add(ix["plant_name"])
        insect_names.add(ix["insect_name"])
    
    # Construire les entités plantes
    plants = {}
    for name in sorted(plant_names):
        pid = short_id(name, "p")
        t = tax.get(name, {})
        plants[name] = {
            "id": pid,
            "sci": name,
            "family": t.get("family", ""),
            "order": t.get("order", ""),
            "genus": t.get("genus", name.split()[0] if name else ""),
            "status": detect_plant_status(name, t.get("family", "")),
            "growthForm": detect_growth_form(name, t.get("family", "")),
            "region": detect_region(name, t.get("family", "")),
            "threat": threat.get(name, {}).get("cat", ""),
            "n_interactions": 0,
            "common": {"fr": vern.get(name, {}).get("fr", ""), "en": vern.get(name, {}).get("en", "")},
        }
    
    # Construire les entités insectes
    insects = {}
    for name in sorted(insect_names):
        iid = short_id(name, "i")
        t = tax.get(name, {})
        insects[name] = {
            "id": iid,
            "sci": name,
            "order": t.get("order", ""),
            "family": t.get("family", ""),
            "genus": t.get("genus", name.split()[0] if name else ""),
            "threat": threat.get(name, {}).get("cat", ""),
            "n_interactions": 0,
            "common": {"fr": vern.get(name, {}).get("fr", ""), "en": vern.get(name, {}).get("en", "")},
        }
    
    # Construire les interactions
    interactions = []
    for ix in interactions_raw:
        pname = ix["plant_name"]
        iname = ix["insect_name"]
        
        if pname not in plants or iname not in insects:
            continue
        
        plants[pname]["n_interactions"] += 1
        insects[iname]["n_interactions"] += 1
        
        # Parser les sources
        dbs = ix.get("source_dbs", "").split("|")
        countries = [c.strip() for c in ix.get("countries", "").split(",") if c.strip()]
        
        sources = []
        for db in dbs:
            if db:
                sources.append({"db": db})
        
        n_obs = int(ix["total_obs"]) if ix.get("total_obs") and ix["total_obs"].isdigit() else None
        
        interactions.append({
            "pI": plants[pname]["id"],
            "iI": insects[iname]["id"],
            "tp": ix["interaction_type"],
            "st": "eco" if any(db in ["EuPPollNet", "EuropeanHostData", "DBIF", "HOSTS", "DoPI", "GloBI"]
                              for db in dbs) else "phy",
            "src": sources,
            "n": n_obs,
        })
    
    # Trier par nombre d'interactions
    plants_list = sorted(plants.values(), key=lambda x: -x["n_interactions"])
    insects_list = sorted(insects.values(), key=lambda x: -x["n_interactions"])
    
    # Slim export - short keys, no empty fields
    def slim_plant(p):
        s = {"id": p["id"], "sci": p["sci"], "n": p["n_interactions"]}
        if p.get("family"): s["f"] = p["family"]
        if p.get("order"): s["o"] = p["order"]
        if p.get("genus"): s["g"] = p["genus"]
        if p.get("threat"): s["t"] = p["threat"]
        if p.get("growthForm") and p["growthForm"] != "herb": s["gf"] = p["growthForm"]
        if p.get("region"): s["r"] = p["region"]
        if p.get("status"): s["st"] = p["status"]
        if p.get("common", {}).get("fr"): s["cfr"] = p["common"]["fr"]
        if p.get("common", {}).get("en"): s["cen"] = p["common"]["en"]
        return s

    def slim_insect(i):
        s = {"id": i["id"], "sci": i["sci"], "n": i["n_interactions"]}
        if i.get("family"): s["f"] = i["family"]
        if i.get("order"): s["o"] = i["order"]
        if i.get("genus"): s["g"] = i["genus"]
        if i.get("threat"): s["t"] = i["threat"]
        if i.get("common", {}).get("fr"): s["cfr"] = i["common"]["fr"]
        if i.get("common", {}).get("en"): s["cen"] = i["common"]["en"]
        return s

    def slim_ix(x):
        s = {"p": x["pI"], "i": x["iI"], "t": x["tp"]}
        n = x.get("n") or 0
        if n > 1: s["n"] = n
        if len(x.get("src") or []) > 1: s["m"] = 1
        return s

    slim_p = [slim_plant(p) for p in plants_list]
    slim_i = [slim_insect(i) for i in insects_list]
    slim_x = [slim_ix(x) for x in interactions]

    # Écriture JSON compact
    with open(OUTPUT / "plants.json", "w", encoding="utf-8") as f:
        json.dump(slim_p, f, ensure_ascii=False, separators=(",", ":"))

    with open(OUTPUT / "insects.json", "w", encoding="utf-8") as f:
        json.dump(slim_i, f, ensure_ascii=False, separators=(",", ":"))

    with open(OUTPUT / "interactions.json", "w", encoding="utf-8") as f:
        json.dump(slim_x, f, ensure_ascii=False, separators=(",", ":"))

    # Stats
    total_obs = sum(ix.get("n") or 0 for ix in interactions)
    multi_src = sum(1 for ix in interactions if len(ix.get("src") or []) > 1)
    
    print(f"\n  ✓ {len(plants_list)} plantes → output/plants.json")
    print(f"  ✓ {len(insects_list)} insectes → output/insects.json")
    print(f"  ✓ {len(interactions)} interactions → output/interactions.json")
    print(f"  ✓ {total_obs:,} observations totales")
    print(f"  ✓ {multi_src} interactions multi-sources")
    
    # Taille des fichiers
    for fname in ["plants.json", "insects.json", "interactions.json"]:
        fpath = OUTPUT / fname
        size = fpath.stat().st_size
        print(f"    {fname}: {size / 1024:.0f} KB")
    
    print(f"\n  Ces fichiers sont prêts à être chargés par l'app React Phytomia.")
    print(f"  Copier output/*.json dans le dossier public/ de l'app.")


if __name__ == "__main__":
    export()
