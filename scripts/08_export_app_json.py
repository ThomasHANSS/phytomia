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
            name = row.get("scientific_name", "")
            cat = row.get("iucn_category", "")
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
            "threat": threat.get(name, {}).get("cat", ""),
            "n_interactions": 0,
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
                sources.append({
                    "db": db,
                    "geo": countries,
                    "yr": ix.get("year_range", ""),
                })
        
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
    
    # Écriture JSON
    with open(OUTPUT / "plants.json", "w", encoding="utf-8") as f:
        json.dump(plants_list, f, ensure_ascii=False, indent=1)
    
    with open(OUTPUT / "insects.json", "w", encoding="utf-8") as f:
        json.dump(insects_list, f, ensure_ascii=False, indent=1)
    
    with open(OUTPUT / "interactions.json", "w", encoding="utf-8") as f:
        json.dump(interactions, f, ensure_ascii=False, indent=1)
    
    # Stats
    total_obs = sum(ix["n"] or 0 for ix in interactions)
    multi_src = sum(1 for ix in interactions if len(ix["src"]) > 1)
    
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
