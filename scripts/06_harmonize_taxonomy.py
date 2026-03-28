#!/usr/bin/env python3
"""
Phytomia — Harmonisation taxonomique via GBIF

Lit tous les CSV parsés dans data/parsed/, extrait les noms d'espèces uniques,
les soumet à l'API GBIF Species Match pour obtenir le nom accepté et la
classification complète, et produit une table de correspondance.

Sortie : data/taxonomy/species_map.csv

L'API est gratuite et ne nécessite pas d'inscription.
Endpoint : https://api.gbif.org/v1/species/match?name=...
Rate limit : ~3 requêtes/seconde recommandé.
"""

import csv
import json
import time
import requests
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
PARSED = ROOT / "data" / "parsed"
TAX = ROOT / "data" / "taxonomy"
CACHE_FILE = TAX / "gbif_cache.json"

GBIF_API = "https://api.gbif.org/v1/species/match"


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    TAX.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)


def gbif_match(name, cache):
    """Interroge l'API GBIF pour un nom d'espèce."""
    if name in cache:
        return cache[name]
    
    try:
        r = requests.get(GBIF_API, params={
            "name": name,
            "strict": "false",
            "verbose": "false",
        }, timeout=15)
        r.raise_for_status()
        data = r.json()
        
        result = {
            "input_name": name,
            "match_type": data.get("matchType", "NONE"),
            "confidence": data.get("confidence", 0),
            "accepted_name": data.get("species", data.get("canonicalName", name)),
            "accepted_key": data.get("speciesKey", data.get("usageKey", "")),
            "kingdom": data.get("kingdom", ""),
            "phylum": data.get("phylum", ""),
            "class": data.get("class", ""),
            "order": data.get("order", ""),
            "family": data.get("family", ""),
            "genus": data.get("genus", ""),
            "status": data.get("status", ""),
            "rank": data.get("rank", ""),
        }
        cache[name] = result
        return result
        
    except Exception as e:
        result = {"input_name": name, "match_type": "ERROR", "error": str(e)}
        cache[name] = result
        return result


def collect_species_names():
    """Collecte tous les noms d'espèces uniques depuis les CSV parsés."""
    plants = set()
    insects = set()
    
    if not PARSED.exists():
        print("  ✗ Aucun fichier dans data/parsed/")
        return plants, insects
    
    for csv_file in PARSED.glob("*.csv"):
        with open(csv_file, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                p = row.get("plant_name", "").strip()
                i = row.get("insect_name", "").strip()
                if p:
                    plants.add(p)
                if i:
                    insects.add(i)
    
    return plants, insects


def harmonize():
    print("═══ Harmonisation taxonomique (GBIF) ═══")
    TAX.mkdir(parents=True, exist_ok=True)
    
    plants, insects = collect_species_names()
    all_names = plants | insects
    
    if not all_names:
        print("  ✗ Aucun nom d'espèce trouvé. Exécuter d'abord les scripts de parsing.")
        return
    
    print(f"  {len(plants)} plantes + {len(insects)} insectes = {len(all_names)} noms uniques")
    
    cache = load_cache()
    already = sum(1 for n in all_names if n in cache)
    to_query = [n for n in sorted(all_names) if n not in cache]
    
    print(f"  {already} déjà en cache, {len(to_query)} à interroger")
    
    if to_query:
        print(f"  → Interrogation GBIF API (~{len(to_query) * 0.4:.0f} secondes)...")
        for i, name in enumerate(to_query):
            gbif_match(name, cache)
            
            if (i + 1) % 50 == 0:
                print(f"    {i + 1}/{len(to_query)} traités...")
                save_cache(cache)  # Sauvegarder régulièrement
            
            time.sleep(0.35)  # Rate limiting
        
        save_cache(cache)
        print(f"  ✓ Cache mis à jour ({len(cache)} entrées)")
    
    # Écrire la table de correspondance
    dest = TAX / "species_map.csv"
    results = []
    for name in sorted(all_names):
        entry = cache.get(name, {})
        is_plant = name in plants
        results.append({
            "input_name": name,
            "type": "plant" if is_plant else "insect",
            "accepted_name": entry.get("accepted_name", name),
            "match_type": entry.get("match_type", "NONE"),
            "confidence": entry.get("confidence", ""),
            "kingdom": entry.get("kingdom", ""),
            "order": entry.get("order", ""),
            "family": entry.get("family", ""),
            "genus": entry.get("genus", ""),
        })
    
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "input_name", "type", "accepted_name", "match_type",
            "confidence", "kingdom", "order", "family", "genus"
        ])
        w.writeheader()
        w.writerows(results)
    
    # Stats
    match_types = defaultdict(int)
    for r in results:
        match_types[r["match_type"]] += 1
    
    print(f"\n  ✓ {len(results)} espèces harmonisées → {dest}")
    print(f"\n  Qualité du matching :")
    for mt, n in sorted(match_types.items(), key=lambda x: -x[1]):
        print(f"    {mt}: {n}")
    
    # Alertes
    fuzzy = [r for r in results if r["match_type"] == "FUZZY"]
    none_ = [r for r in results if r["match_type"] == "NONE"]
    if fuzzy:
        print(f"\n  ⚠ {len(fuzzy)} matchs approximatifs (à vérifier) :")
        for r in fuzzy[:10]:
            print(f"    {r['input_name']} → {r['accepted_name']}")
    if none_:
        print(f"\n  ⚠ {len(none_)} noms non reconnus :")
        for r in none_[:10]:
            print(f"    {r['input_name']}")


if __name__ == "__main__":
    harmonize()
