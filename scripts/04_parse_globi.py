#!/usr/bin/env python3
"""
Phytomia — Parse GloBI (API ou dump)

Entrée  : data/raw/globi/globi_europe_interactions.csv (depuis 01_download.py)
       ou data/raw/globi/interactions.tsv (dump Zenodo décompressé)
Sortie  : data/parsed/globi.csv

Filtre les interactions insecte→plante, mappe les types d'interaction,
et ne garde que les taxons identifiés au niveau espèce.
"""

import csv
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "globi"
OUT = ROOT / "data" / "parsed"
CONFIG = ROOT / "config" / "sources.json"

# Charger le mapping des types d'interaction
with open(CONFIG) as f:
    TYPE_MAP = json.load(f)["interaction_type_mapping"]


def is_binomial(name):
    """Vérifie qu'un nom est binomial (Genre espece)."""
    parts = name.strip().split()
    return len(parts) >= 2 and parts[0][0].isupper() and parts[1][0].islower()


def clean_name(name):
    """Nettoie un nom d'espèce."""
    # Enlever les qualificatifs entre parenthèses, les auteurs, etc.
    name = name.strip()
    if "(" in name:
        name = name[:name.index("(")].strip()
    parts = name.split()
    if len(parts) >= 2:
        return parts[0] + " " + parts[1]
    return name


def map_interaction(raw_type):
    """Mappe un type d'interaction GloBI vers la typologie Phytomia."""
    raw = raw_type.lower().strip()
    if raw in TYPE_MAP:
        return TYPE_MAP[raw]
    # Recherche partielle
    for key, val in TYPE_MAP.items():
        if key in raw:
            return val
    return None


def parse_api_csv():
    """Parse le CSV produit par 01_download.py (format API)."""
    src = RAW / "globi_europe_interactions.csv"
    if not src.exists():
        return None
    
    rows = []
    with open(src, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            insect = row.get("source_taxon", "").strip()
            plant = row.get("target_taxon", "").strip()
            itype_raw = row.get("interaction_type", "").strip()
            
            if not is_binomial(insect) or not is_binomial(plant):
                continue
            
            itype = map_interaction(itype_raw)
            if not itype:
                continue
            
            rows.append({
                "plant_name": clean_name(plant),
                "insect_name": clean_name(insect),
                "interaction_type": itype,
                "source_db": "GloBI",
                "n_obs": "1",
                "geo": "EU",
                "year_range": "",
            })
    return rows


def parse_dump_tsv():
    """Parse le dump TSV complet de GloBI (interactions.tsv)."""
    src = RAW / "interactions.tsv"
    if not src.exists():
        src = RAW / "interactions.tsv.gz"
        if not src.exists():
            return None
        # Décompresser si nécessaire
        import gzip
        print("  → Décompression du dump GloBI...")
        with gzip.open(src, 'rt', encoding='utf-8') as gz:
            return _parse_tsv_file(gz)
    
    with open(src, encoding='utf-8', errors='replace') as f:
        return _parse_tsv_file(f)


def _parse_tsv_file(f):
    """Parse un fichier TSV GloBI ouvert."""
    reader = csv.DictReader(f, delimiter='\t')
    rows = []
    count = 0
    
    for row in reader:
        count += 1
        if count % 500000 == 0:
            print(f"    {count:,} lignes lues, {len(rows):,} gardées...")
        
        src_taxon = row.get("sourceTaxonName", "")
        tgt_taxon = row.get("targetTaxonName", "")
        itype_raw = row.get("interactionTypeName", "")
        
        # Filtrer : source = Insecta, target = Plantae
        src_class = row.get("sourceTaxonPathNames", "")
        tgt_class = row.get("targetTaxonPathNames", "")
        
        if "Insecta" not in src_class or "Plantae" not in tgt_class:
            continue
        
        if not is_binomial(src_taxon) or not is_binomial(tgt_taxon):
            continue
        
        itype = map_interaction(itype_raw)
        if not itype:
            continue
        
        # Filtrer géographiquement (Europe)
        lat = row.get("decimalLatitude", "")
        try:
            lat_f = float(lat)
            if lat_f < 34 or lat_f > 72:
                continue
        except (ValueError, TypeError):
            pass  # Garder si pas de coordonnées
        
        rows.append({
            "plant_name": clean_name(tgt_taxon),
            "insect_name": clean_name(src_taxon),
            "interaction_type": itype,
            "source_db": "GloBI",
            "n_obs": "1",
            "geo": "EU",
            "year_range": row.get("eventDate", "")[:4] if row.get("eventDate") else "",
        })
    
    return rows


def parse():
    print("═══ Parse GloBI ═══")
    OUT.mkdir(parents=True, exist_ok=True)
    
    # Essayer d'abord le CSV de l'API, puis le dump
    rows = parse_api_csv()
    if rows is None:
        rows = parse_dump_tsv()
    if rows is None:
        print(f"  ✗ Aucun fichier GloBI trouvé dans {RAW}/")
        print(f"    Exécuter d'abord : python scripts/01_download.py")
        return
    
    print(f"  → {len(rows)} interactions brutes")
    
    # Agréger par paire
    agg = {}
    for r in rows:
        key = (r["plant_name"], r["insect_name"], r["interaction_type"])
        if key not in agg:
            agg[key] = {**r, "n_obs": 0, "years": set()}
        agg[key]["n_obs"] += 1
        if r["year_range"]:
            agg[key]["years"].add(r["year_range"])
    
    # Écriture
    dest = OUT / "globi.csv"
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "plant_name", "insect_name", "interaction_type",
            "source_db", "n_obs", "geo", "year_range"
        ])
        w.writeheader()
        for v in agg.values():
            years = sorted(v["years"])
            yr = f"{years[0]}-{years[-1]}" if len(years) > 1 else (years[0] if years else "")
            w.writerow({
                "plant_name": v["plant_name"],
                "insect_name": v["insect_name"],
                "interaction_type": v["interaction_type"],
                "source_db": v["source_db"],
                "n_obs": v["n_obs"],
                "geo": v["geo"],
                "year_range": yr,
            })
    
    type_stats = Counter(v["interaction_type"] for v in agg.values())
    print(f"\n  ✓ {len(agg)} paires uniques")
    print(f"  ✓ Sauvegardé : {dest}")
    print(f"\n  Par type :")
    for t, n in type_stats.most_common():
        print(f"    {t}: {n:,}")


if __name__ == "__main__":
    parse()
