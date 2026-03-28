#!/usr/bin/env python3
"""
Phytomia — Parse EuropeanHostData (Dryad)

Entrée  : data/raw/european_host_data/EuropeanHostData.csv
Sortie  : data/parsed/european_host_data.csv

Colonnes attendues du CSV source :
  TreeSpecies, InsectOrder, InsectFamily, InsectGenus, InsectSpecies,
  FeedingGuild, InsectOrigin, ...

Mapping des guildes alimentaires :
  "gall maker"               → gallicole
  "folivore"                 → folivorie
  "sap feeder"               → suceur_seve
  "phloem/wood-borer"        → xylophage
  "reproductive plant feeder"→ frugivore
"""

import csv
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "european_host_data"
OUT = ROOT / "data" / "parsed"
CONFIG = ROOT / "config" / "sources.json"

GUILD_MAP = {
    "gall maker": "gallicole",
    "gall-maker": "gallicole",
    "folivore": "folivorie",
    "sap feeder": "suceur_seve",
    "sap-feeder": "suceur_seve",
    "phloem/wood-borer": "xylophage",
    "wood-borer": "xylophage",
    "wood borer": "xylophage",
    "reproductive plant feeder": "frugivore",
    "seed feeder": "frugivore",
}


def find_csv():
    """Trouve le CSV source, quel que soit le nom exact."""
    for f in RAW.rglob("*.csv"):
        return f
    return None


def parse():
    print("═══ Parse EuropeanHostData ═══")
    
    src = find_csv()
    if not src:
        print(f"  ✗ Aucun CSV trouvé dans {RAW}/")
        print(f"    Exécuter d'abord : python scripts/01_download.py")
        return
    
    print(f"  → Lecture : {src.name}")
    OUT.mkdir(parents=True, exist_ok=True)
    
    rows = []
    guild_stats = Counter()
    skipped = 0
    
    with open(src, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        # Normaliser les noms de colonnes (strip, lower)
        if reader.fieldnames:
            col_map = {c: c.strip() for c in reader.fieldnames}
            print(f"  Colonnes trouvées : {list(col_map.values())}")
        
        for row in reader:
            # Nettoyer les clés
            row = {k.strip(): v.strip() if v else "" for k, v in row.items()}
            
            # Extraire le nom de la plante (arbre)
            plant = row.get("TreeSpecies", row.get("tree_species", row.get("Tree", "")))
            
            # Extraire l'insecte
            genus = row.get("InsectGenus", row.get("insect_genus", ""))
            species = row.get("InsectSpecies", row.get("insect_species", ""))
            insect = f"{genus} {species}".strip()
            
            if not plant or not insect or insect == " ":
                skipped += 1
                continue
            
            # Guild → type d'interaction
            guild_raw = row.get("FeedingGuild", row.get("feeding_guild", row.get("Guild", ""))).lower().strip()
            interaction_type = GUILD_MAP.get(guild_raw, "folivorie")
            guild_stats[guild_raw] += 1
            
            # Métadonnées
            insect_order = row.get("InsectOrder", row.get("insect_order", ""))
            insect_family = row.get("InsectFamily", row.get("insect_family", ""))
            insect_origin = row.get("InsectOrigin", row.get("insect_origin", ""))
            
            rows.append({
                "plant_name": plant,
                "insect_name": insect,
                "insect_order": insect_order,
                "insect_family": insect_family,
                "interaction_type": interaction_type,
                "interaction_detail": guild_raw,
                "insect_origin": insect_origin,
                "source_db": "EuropeanHostData",
                "n_obs": "",  # pas de comptage dans cette base
                "geo": "EU",
                "year_range": "lit. review",
            })
    
    # Écriture
    dest = OUT / "european_host_data.csv"
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "plant_name", "insect_name", "insect_order", "insect_family",
            "interaction_type", "interaction_detail", "insect_origin",
            "source_db", "n_obs", "geo", "year_range"
        ])
        w.writeheader()
        w.writerows(rows)
    
    print(f"\n  ✓ {len(rows)} paires extraites ({skipped} lignes ignorées)")
    print(f"  ✓ Sauvegardé : {dest}")
    print(f"\n  Répartition des guildes :")
    for guild, count in guild_stats.most_common():
        mapped = GUILD_MAP.get(guild, "?")
        print(f"    {guild:30s} → {mapped:15s} ({count:,})")
    
    # Stats rapides
    plants = set(r["plant_name"] for r in rows)
    insects = set(r["insect_name"] for r in rows)
    print(f"\n  {len(plants)} plantes uniques, {len(insects)} insectes uniques")


if __name__ == "__main__":
    parse()
