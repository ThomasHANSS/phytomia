#!/usr/bin/env python3
"""
Phytomia — Parse EuPPollNet (Zenodo)

Entrée  : data/raw/euppollnet/ (CSV depuis Zenodo ou généré via le script R du repo GitHub)
Sortie  : data/parsed/euppollnet.csv

Le dataset EuPPollNet contient ~623K interactions plante-pollinisateur avec :
- Noms d'espèces harmonisés (plante et pollinisateur)
- Coordonnées géographiques (WGS84)
- Date d'observation
- Métadonnées de réseau (study_id, network_id)

Le CSV principal s'appelle typiquement "EuPPollNet_interactions.csv" ou similaire.
"""

import csv
import os
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "euppollnet"
OUT = ROOT / "data" / "parsed"

# Mapping des pays à partir des coordonnées (approximatif)
# EuPPollNet inclut des coordonnées — on les groupera par pays plus tard
COUNTRY_BOUNDS = {
    "FR": (41.3, 51.1, -5.1, 9.6),
    "DE": (47.3, 55.1, 5.9, 15.0),
    "IT": (36.6, 47.1, 6.6, 18.5),
    "ES": (36.0, 43.8, -9.3, 3.3),
    "UK": (49.9, 60.9, -8.2, 1.8),
    "SE": (55.3, 69.1, 11.1, 24.2),
    "CH": (45.8, 47.8, 5.9, 10.5),
    "AT": (46.4, 49.0, 9.5, 17.2),
    "NL": (50.8, 53.5, 3.4, 7.2),
    "BE": (49.5, 51.5, 2.5, 6.4),
    "PL": (49.0, 54.8, 14.1, 24.1),
    "CZ": (48.6, 51.1, 12.1, 18.9),
    "DK": (54.6, 57.8, 8.1, 15.2),
    "NO": (58.0, 71.2, 4.6, 31.1),
    "FI": (59.8, 70.1, 20.6, 31.6),
}


def coord_to_country(lat, lon):
    """Détermine le pays à partir de coordonnées (approximatif)."""
    try:
        lat, lon = float(lat), float(lon)
    except (ValueError, TypeError):
        return "EU"
    for code, (lat_min, lat_max, lon_min, lon_max) in COUNTRY_BOUNDS.items():
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return code
    return "EU"


def find_interactions_csv():
    """Trouve le CSV d'interactions dans le dossier raw."""
    if not RAW.exists():
        return None
    for f in RAW.rglob("*.csv"):
        name_lower = f.name.lower()
        if "interaction" in name_lower or "euppollnet" in name_lower:
            return f
    # Fallback : premier CSV trouvé
    csvs = list(RAW.rglob("*.csv"))
    return csvs[0] if csvs else None


def parse():
    print("═══ Parse EuPPollNet ═══")
    
    src = find_interactions_csv()
    if not src:
        print(f"  ✗ Aucun CSV trouvé dans {RAW}/")
        print(f"    Options :")
        print(f"    1. Demander accès sur Zenodo : https://zenodo.org/records/15183272")
        print(f"    2. Cloner le repo GitHub et exécuter le script R :")
        print(f"       git clone https://github.com/JoseBSL/EuPPollNet.git")
        print(f"       cd EuPPollNet && Rscript R/build_database.R")
        print(f"    3. Placer le CSV résultant dans {RAW}/")
        return
    
    print(f"  → Lecture : {src.name}")
    OUT.mkdir(parents=True, exist_ok=True)
    
    rows = []
    country_stats = Counter()
    
    with open(src, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        cols = [c.strip() for c in (reader.fieldnames or [])]
        print(f"  Colonnes : {cols[:15]}{'...' if len(cols) > 15 else ''}")
        
        for row in reader:
            row = {k.strip(): (v.strip() if v else "") for k, v in row.items()}
            
            # Chercher les colonnes plante et pollinisateur
            # Les noms de colonnes varient selon la version du CSV
            plant = (row.get("plant_species", "") or
                     row.get("Plant_species", "") or
                     row.get("plant", "") or
                     row.get("Plant", ""))
            
            insect = (row.get("pollinator_species", "") or
                      row.get("Pollinator_species", "") or
                      row.get("pollinator", "") or
                      row.get("Pollinator", "") or
                      row.get("insect_species", ""))
            
            if not plant or not insect:
                continue
            
            # Coordonnées
            lat = row.get("latitude", row.get("Latitude", row.get("lat", "")))
            lon = row.get("longitude", row.get("Longitude", row.get("lon", "")))
            country = coord_to_country(lat, lon)
            country_stats[country] += 1
            
            # Année
            year = row.get("year", row.get("Year", ""))
            
            # Study ID pour traçabilité
            study = row.get("study_id", row.get("Study_ID", row.get("study", "")))
            
            rows.append({
                "plant_name": plant,
                "insect_name": insect,
                "interaction_type": "pollination",
                "source_db": "EuPPollNet",
                "n_obs": "1",  # chaque ligne = 1 observation
                "geo": country,
                "year_range": year,
                "study_id": study,
                "lat": lat,
                "lon": lon,
            })
    
    # Agréger : compter les observations par paire plante×insecte×pays
    print(f"  → Agrégation de {len(rows)} observations brutes...")
    agg = {}
    for r in rows:
        key = (r["plant_name"], r["insect_name"], r["geo"])
        if key not in agg:
            agg[key] = {
                "plant_name": r["plant_name"],
                "insect_name": r["insect_name"],
                "interaction_type": "pollination",
                "source_db": "EuPPollNet",
                "n_obs": 0,
                "geo": r["geo"],
                "years": set(),
            }
        agg[key]["n_obs"] += 1
        if r["year_range"]:
            agg[key]["years"].add(r["year_range"])
    
    # Écriture
    dest = OUT / "euppollnet.csv"
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
    
    plants = set(v["plant_name"] for v in agg.values())
    insects = set(v["insect_name"] for v in agg.values())
    
    print(f"\n  ✓ {len(agg)} paires uniques (de {len(rows)} observations)")
    print(f"  ✓ {len(plants)} plantes, {len(insects)} pollinisateurs")
    print(f"  ✓ Sauvegardé : {dest}")
    print(f"\n  Répartition géographique :")
    for c, n in country_stats.most_common(15):
        print(f"    {c}: {n:,} observations")


if __name__ == "__main__":
    parse()
