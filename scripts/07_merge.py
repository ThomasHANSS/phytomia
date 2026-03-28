#!/usr/bin/env python3
"""
Phytomia — Fusion et dédoublonnage

Lit tous les CSV de data/parsed/, applique la table taxonomique de
data/taxonomy/species_map.csv pour harmoniser les noms, fusionne
toutes les sources, et dédoublonne les paires en agrégeant les métadonnées.

Sortie : data/merged/interactions_merged.csv
"""

import csv
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
PARSED = ROOT / "data" / "parsed"
TAX = ROOT / "data" / "taxonomy"
MERGED = ROOT / "data" / "merged"


def load_species_map():
    """Charge la table de correspondance taxonomique."""
    smap = {}
    tax_file = TAX / "species_map.csv"
    if not tax_file.exists():
        print("  ⚠ Pas de table taxonomique — noms utilisés tels quels")
        print("    Exécuter d'abord : python scripts/06_harmonize_taxonomy.py")
        return smap
    
    with open(tax_file, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inp = row["input_name"]
            acc = row.get("accepted_name", inp)
            mt = row.get("match_type", "")
            # Ne remplacer que si le match est bon
            if mt in ("EXACT", "FUZZY") and acc:
                smap[inp] = {
                    "accepted": acc,
                    "kingdom": row.get("kingdom", ""),
                    "order": row.get("order", ""),
                    "family": row.get("family", ""),
                    "genus": row.get("genus", ""),
                }
    
    print(f"  ✓ {len(smap)} espèces dans la table taxonomique")
    return smap


def harmonize_name(name, smap):
    """Retourne le nom accepté si disponible."""
    entry = smap.get(name)
    if entry:
        return entry["accepted"]
    return name


def merge():
    print("═══ Fusion des sources ═══")
    MERGED.mkdir(parents=True, exist_ok=True)
    
    smap = load_species_map()
    
    # Lire toutes les sources
    all_rows = []
    source_stats = defaultdict(int)
    
    if not PARSED.exists() or not list(PARSED.glob("*.csv")):
        print("  ✗ Aucun CSV dans data/parsed/")
        print("    Exécuter d'abord les scripts 02-05.")
        return
    
    for csv_file in sorted(PARSED.glob("*.csv")):
        print(f"  → {csv_file.name}")
        with open(csv_file, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            n = 0
            for row in reader:
                plant = harmonize_name(row.get("plant_name", "").strip(), smap)
                insect = harmonize_name(row.get("insect_name", "").strip(), smap)
                
                if not plant or not insect:
                    continue
                
                all_rows.append({
                    "plant_name": plant,
                    "insect_name": insect,
                    "interaction_type": row.get("interaction_type", ""),
                    "source_db": row.get("source_db", csv_file.stem),
                    "n_obs": row.get("n_obs", ""),
                    "geo": row.get("geo", ""),
                    "year_range": row.get("year_range", ""),
                })
                n += 1
                source_stats[row.get("source_db", csv_file.stem)] += 1
            
            print(f"    {n} paires chargées")
    
    print(f"\n  Total brut : {len(all_rows)} paires")
    
    # Dédoublonnage par (plante, insecte, type) — agréger les sources
    agg = {}
    for r in all_rows:
        key = (r["plant_name"], r["insect_name"], r["interaction_type"])
        if key not in agg:
            agg[key] = {
                "plant_name": r["plant_name"],
                "insect_name": r["insect_name"],
                "interaction_type": r["interaction_type"],
                "sources": [],
                "total_obs": 0,
                "countries": set(),
                "years": set(),
            }
        
        entry = agg[key]
        db = r["source_db"]
        if db not in [s["db"] for s in entry["sources"]]:
            entry["sources"].append({
                "db": db,
                "n_obs": int(r["n_obs"]) if r["n_obs"] and r["n_obs"].isdigit() else None,
                "geo": r["geo"],
                "year_range": r["year_range"],
            })
        else:
            # Même source, additionner les obs
            for s in entry["sources"]:
                if s["db"] == db:
                    if r["n_obs"] and r["n_obs"].isdigit():
                        s["n_obs"] = (s["n_obs"] or 0) + int(r["n_obs"])
        
        if r["n_obs"] and r["n_obs"].isdigit():
            entry["total_obs"] += int(r["n_obs"])
        
        if r["geo"]:
            for g in r["geo"].split(","):
                entry["countries"].add(g.strip())
        
        if r["year_range"]:
            entry["years"].add(r["year_range"])
    
    # Écriture
    dest = MERGED / "interactions_merged.csv"
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "plant_name", "insect_name", "interaction_type",
            "n_sources", "source_dbs", "total_obs", "countries", "year_range"
        ])
        w.writeheader()
        for v in sorted(agg.values(), key=lambda x: -x["total_obs"]):
            years_flat = set()
            for yr in v["years"]:
                for part in yr.replace("–", "-").split("-"):
                    part = part.strip()
                    if part.isdigit():
                        years_flat.add(part)
            
            yr_sorted = sorted(years_flat)
            yr_str = f"{yr_sorted[0]}-{yr_sorted[-1]}" if len(yr_sorted) > 1 else (yr_sorted[0] if yr_sorted else "")
            
            w.writerow({
                "plant_name": v["plant_name"],
                "insect_name": v["insect_name"],
                "interaction_type": v["interaction_type"],
                "n_sources": len(v["sources"]),
                "source_dbs": "|".join(s["db"] for s in v["sources"]),
                "total_obs": v["total_obs"] or "",
                "countries": ",".join(sorted(v["countries"])),
                "year_range": yr_str,
            })
    
    plants = set(v["plant_name"] for v in agg.values())
    insects = set(v["insect_name"] for v in agg.values())
    
    print(f"\n  ✓ {len(agg)} paires uniques (dédoublonnées)")
    print(f"  ✓ {len(plants)} plantes, {len(insects)} insectes")
    print(f"  ✓ Sauvegardé : {dest}")
    
    print(f"\n  Par source :")
    for db, n in sorted(source_stats.items(), key=lambda x: -x[1]):
        print(f"    {db}: {n:,}")
    
    # Multi-sources
    multi = sum(1 for v in agg.values() if len(v["sources"]) > 1)
    print(f"\n  {multi} paires documentées par plusieurs sources (plus robustes)")


if __name__ == "__main__":
    merge()
