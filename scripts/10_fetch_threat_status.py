#!/usr/bin/env python3
"""
Phytomia — Étape 10 : Statuts de menace UICN

Enrichit les espèces avec leur statut de conservation via deux sources :

1. European Red List (EEA) — CSV téléchargeable librement
   ~10 000 espèces EU : papillons, abeilles, libellules, coléoptères,
   plantes vasculaires, mollusques, etc.
   URL : https://www.eea.europa.eu/en/datahub/datahubitem-view/202f3c2e-54a9-4ff4-a1da-ed7ca524f634

2. IUCN Red List API v4 — requête par espèce
   172 600+ espèces mondiales. Nécessite une clé API gratuite.
   URL : https://api.iucnredlist.org
   Inscription : https://api.iucnredlist.org/users/sign_up

Sortie : data/taxonomy/threat_status.csv
         Colonnes : scientific_name, iucn_category, iucn_criteria,
                    scope (EU/global), source, year_assessed

Catégories UICN :
  EX  = Éteint
  EW  = Éteint à l'état sauvage
  RE  = Régionalement éteint
  CR  = En danger critique
  EN  = En danger
  VU  = Vulnérable
  NT  = Quasi menacé
  LC  = Préoccupation mineure
  DD  = Données insuffisantes
  NE  = Non évalué
  NA  = Non applicable
"""

import csv
import json
import os
import time
import zipfile
import requests
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "threat_status"
PARSED = ROOT / "data" / "parsed"
TAX = ROOT / "data" / "taxonomy"
CACHE_FILE = TAX / "iucn_cache.json"

# Catégories UICN ordonnées par gravité
IUCN_ORDER = ["EX", "EW", "RE", "CR", "EN", "VU", "NT", "LC", "DD", "NE", "NA"]
THREATENED = {"CR", "EN", "VU"}
NEAR_THREATENED = {"NT"}

# Normalisation des catégories (variantes rencontrées dans les CSV)
CATEGORY_MAP = {
    "Extinct": "EX", "EX": "EX",
    "Extinct in the Wild": "EW", "EW": "EW",
    "Regionally Extinct": "RE", "RE": "RE",
    "Critically Endangered": "CR", "CR": "CR",
    "Endangered": "EN", "EN": "EN",
    "Vulnerable": "VU", "VU": "VU",
    "Near Threatened": "NT", "NT": "NT",
    "Least Concern": "LC", "LC": "LC",
    "Data Deficient": "DD", "DD": "DD",
    "Not Evaluated": "NE", "NE": "NE",
    "Not Applicable": "NA", "NA": "NA",
    "Lower Risk/near threatened": "NT",
    "Lower Risk/least concern": "LC",
    "Lower Risk/conservation dependent": "NT",
}


def download_european_red_list():
    """Télécharge le CSV de la European Red List depuis l'EEA."""
    RAW.mkdir(parents=True, exist_ok=True)

    # Chercher si un fichier existe déjà
    for f in RAW.glob("*.csv"):
        if "red_list" in f.name.lower() or "european" in f.name.lower():
            print(f"  ✓ European Red List déjà présente : {f.name}")
            return f

    # L'EEA offre le CSV en téléchargement direct
    urls = [
        "https://www.eea.europa.eu/data-and-maps/data/european-red-lists-7/european-red-list-csv/european-red-list-csv/at_download/file",
        "https://www.eea.europa.eu/data-and-maps/data/european-red-lists-7/european-red-lists-csv/european-red-lists-csv/at_download/file",
    ]

    for url in urls:
        print(f"  → Tentative : {url[:80]}...")
        try:
            r = requests.get(url, timeout=60, allow_redirects=True)
            r.raise_for_status()
            dest = RAW / "european_red_list.csv"

            # Vérifier si c'est un ZIP
            if r.content[:4] == b"PK\x03\x04":
                zip_dest = RAW / "european_red_list.zip"
                with open(zip_dest, "wb") as f:
                    f.write(r.content)
                with zipfile.ZipFile(zip_dest, "r") as zf:
                    for name in zf.namelist():
                        if name.endswith(".csv"):
                            zf.extract(name, RAW)
                            extracted = RAW / name
                            if extracted != dest:
                                extracted.rename(dest)
                            break
                print(f"  ✓ Téléchargé et décompressé : {dest.name}")
            else:
                with open(dest, "wb") as f:
                    f.write(r.content)
                print(f"  ✓ Téléchargé : {dest.name} ({len(r.content) / 1024:.0f} KB)")
            return dest
        except Exception as e:
            print(f"    ✗ Erreur : {e}")

    print("  ✗ Impossible de télécharger la European Red List.")
    print("    Téléchargement manuel :")
    print("    https://www.eea.europa.eu/en/datahub/datahubitem-view/202f3c2e-54a9-4ff4-a1da-ed7ca524f634")
    print(f"    Placer le CSV dans {RAW}/")
    return None


def parse_european_red_list(csv_path):
    """Parse le CSV de la European Red List (EEA)."""
    results = {}
    if not csv_path or not csv_path.exists():
        return results

    print(f"  → Lecture : {csv_path.name}")
    with open(csv_path, encoding="utf-8", errors="replace") as f:
        # Détecter le séparateur
        sample = f.read(2000)
        f.seek(0)
        sep = "," if sample.count(",") > sample.count(";") else ";"

        reader = csv.DictReader(f, delimiter=sep)
        cols = [c.strip() for c in (reader.fieldnames or [])]
        print(f"    Colonnes : {cols[:10]}...")

        for row in reader:
            row = {k.strip(): (v.strip() if v else "") for k, v in row.items()}

            # Chercher le nom scientifique
            name = ""
            for k in ["Scientific name", "scientificName", "scientific_name",
                       "Species", "Binomial", "ScientificName", "taxon_name"]:
                if k in row and row[k]:
                    name = row[k].strip()
                    break
            if not name:
                # Chercher la première colonne qui ressemble à un nom binomial
                for k, v in row.items():
                    if v and " " in v and v[0].isupper() and v.split()[1][0].islower():
                        parts = v.split()
                        if len(parts) >= 2 and len(parts[0]) > 2:
                            name = parts[0] + " " + parts[1]
                            break

            if not name:
                continue

            # Nettoyer le nom (enlever auteurs)
            parts = name.split()
            if len(parts) >= 2:
                name = parts[0] + " " + parts[1]

            # Chercher la catégorie
            cat_raw = ""
            for k in ["Red List Category EU 28", "Red_List_Category_EU_28",
                       "EU 28 Category", "EU28_Category",
                       "Red List EU", "redListCategory",
                       "Red List Category Europe", "Red_List_Category_Europe",
                       "European Red List Category", "European_Red_List_Category",
                       "category", "Category", "IUCN Category",
                       "Red List Category", "red_list_category"]:
                if k in row and row[k]:
                    cat_raw = row[k].strip()
                    break

            category = CATEGORY_MAP.get(cat_raw, CATEGORY_MAP.get(cat_raw.upper(), ""))
            if not category:
                continue

            # Critères et groupe
            criteria = ""
            group = ""
            for k in ["Criteria", "criteria", "Red List Criteria", "IUCN Criteria"]:
                if k in row and row[k]:
                    criteria = row[k].strip()
                    break
            for k in ["Group", "group", "Taxonomic group", "taxonomicGroup",
                       "Species group", "speciesGroup"]:
                if k in row and row[k]:
                    group = row[k].strip()
                    break

            # Garder la pire catégorie si déjà présent
            if name in results:
                existing = results[name]["iucn_category"]
                if IUCN_ORDER.index(category) < IUCN_ORDER.index(existing):
                    results[name]["iucn_category"] = category
                    results[name]["iucn_criteria"] = criteria
            else:
                results[name] = {
                    "scientific_name": name,
                    "iucn_category": category,
                    "iucn_criteria": criteria,
                    "scope": "EU",
                    "source": "European Red List (EEA)",
                    "group": group,
                }

    print(f"  ✓ {len(results)} espèces avec statut EU")
    return results


def load_iucn_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_iucn_cache(cache):
    TAX.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)


def query_iucn_api(species_names, existing_results):
    """
    Interroge l'API IUCN v4 pour les espèces non couvertes par la Red List EU.
    Nécessite la variable d'environnement IUCN_API_KEY.
    """
    api_key = os.environ.get("IUCN_API_KEY", "")
    if not api_key:
        print("  ℹ Variable IUCN_API_KEY non définie — API IUCN ignorée.")
        print("    Pour l'activer : export IUCN_API_KEY='votre_clé'")
        print("    Inscription gratuite : https://api.iucnredlist.org/users/sign_up")
        return {}

    cache = load_iucn_cache()
    to_query = [n for n in species_names if n not in existing_results and n not in cache]

    if not to_query:
        print(f"  ✓ Toutes les espèces sont dans le cache ou la Red List EU")
        # Retourner les résultats du cache
        results = {}
        for name in species_names:
            if name in cache and name not in existing_results:
                results[name] = cache[name]
        return results

    print(f"  → Interrogation API IUCN v4 pour {len(to_query)} espèces...")

    results = {}
    api_base = "https://api.iucnredlist.org/api/v4"
    headers = {"Authorization": api_key}

    for i, name in enumerate(to_query):
        try:
            # API v4 : /taxa/scientific_name/{name}
            genus, species = name.split(" ", 1)
            url = f"{api_base}/taxa/scientific_name/{genus}%20{species}"
            r = requests.get(url, headers=headers, timeout=15)

            if r.status_code == 200:
                data = r.json()
                assessments = data.get("assessments", [])
                if assessments:
                    # Prendre l'assessment le plus récent
                    latest = assessments[0]
                    cat = latest.get("red_list_category", {}).get("code", "")
                    category = CATEGORY_MAP.get(cat, cat)
                    if category:
                        entry = {
                            "scientific_name": name,
                            "iucn_category": category,
                            "iucn_criteria": latest.get("red_list_criteria", ""),
                            "scope": "global",
                            "source": "IUCN Red List API v4",
                            "year_assessed": str(latest.get("year_published", "")),
                        }
                        results[name] = entry
                        cache[name] = entry
                else:
                    cache[name] = {"iucn_category": "NE", "source": "IUCN API - not found"}
            elif r.status_code == 404:
                cache[name] = {"iucn_category": "NE", "source": "IUCN API - not found"}
            else:
                print(f"    ⚠ {name}: HTTP {r.status_code}")

        except Exception as e:
            print(f"    ✗ {name}: {e}")

        if (i + 1) % 50 == 0:
            print(f"    {i + 1}/{len(to_query)} interrogées...")
            save_iucn_cache(cache)

        time.sleep(0.5)  # Rate limiting

    save_iucn_cache(cache)
    print(f"  ✓ {len(results)} espèces avec statut IUCN global")
    return results


def collect_species():
    """Collecte tous les noms d'espèces depuis les CSV parsés."""
    plants = set()
    insects = set()

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

    # Aussi lire depuis la table taxonomique si elle existe
    tax_file = TAX / "species_map.csv"
    if tax_file.exists():
        with open(tax_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                acc = row.get("accepted_name", "")
                if acc:
                    if row.get("type") == "plant":
                        plants.add(acc)
                    else:
                        insects.add(acc)

    return plants, insects


def fetch_threat_status():
    print("═══ Statuts de menace UICN ═══")
    TAX.mkdir(parents=True, exist_ok=True)

    # 1. Collecter les espèces
    plants, insects = collect_species()
    all_species = plants | insects
    print(f"  {len(plants)} plantes + {len(insects)} insectes = {len(all_species)} espèces")

    if not all_species:
        print("  ✗ Aucune espèce. Exécuter d'abord les scripts 02-05.")
        return

    # 2. European Red List (source principale pour l'Europe)
    print("\n── European Red List (EEA) ──")
    erl_csv = download_european_red_list()
    eu_results = parse_european_red_list(erl_csv)

    # Compter les matchs
    matched_eu = sum(1 for name in all_species if name in eu_results)
    print(f"  {matched_eu} espèces Phytomia trouvées dans la Red List EU")

    # 3. IUCN API (complément pour les espèces non couvertes)
    print("\n── IUCN Red List API v4 ──")
    api_results = query_iucn_api(sorted(all_species), eu_results)

    # 4. Fusionner : priorité EU > global
    merged = {}
    for name in sorted(all_species):
        if name in eu_results:
            merged[name] = eu_results[name]
        elif name in api_results:
            merged[name] = api_results[name]
        # Pas de statut = non évalué (on ne l'ajoute pas)

    # Aussi récupérer du cache IUCN
    cache = load_iucn_cache()
    for name in sorted(all_species):
        if name not in merged and name in cache:
            entry = cache[name]
            cat = entry.get("iucn_category", "")
            if cat and cat not in ("NE", ""):
                merged[name] = entry

    # 5. Écriture
    dest = TAX / "threat_status.csv"
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "scientific_name", "iucn_category", "iucn_criteria",
            "scope", "source", "group", "year_assessed"
        ])
        w.writeheader()
        for name, entry in sorted(merged.items()):
            w.writerow({
                "scientific_name": entry.get("scientific_name", name),
                "iucn_category": entry.get("iucn_category", ""),
                "iucn_criteria": entry.get("iucn_criteria", ""),
                "scope": entry.get("scope", ""),
                "source": entry.get("source", ""),
                "group": entry.get("group", ""),
                "year_assessed": entry.get("year_assessed", ""),
            })

    # Stats
    cats = Counter(entry["iucn_category"] for entry in merged.values())
    threatened_count = sum(cats.get(c, 0) for c in THREATENED)
    nt_count = cats.get("NT", 0)

    print(f"\n  ✓ {len(merged)} espèces avec statut → {dest}")
    print(f"\n  Répartition :")
    for cat in IUCN_ORDER:
        if cat in cats:
            label = {
                "EX": "Éteint", "EW": "Éteint sauvage", "RE": "Rég. éteint",
                "CR": "En danger critique", "EN": "En danger", "VU": "Vulnérable",
                "NT": "Quasi menacé", "LC": "Préoccupation mineure",
                "DD": "Données insuffisantes", "NE": "Non évalué"
            }.get(cat, cat)
            marker = " ⚠" if cat in THREATENED else (" ℹ" if cat in NEAR_THREATENED else "")
            print(f"    {cat:3s}  {label:25s}  {cats[cat]:>5}{marker}")

    print(f"\n  🔴 {threatened_count} espèces menacées (CR+EN+VU)")
    print(f"  🟡 {nt_count} quasi menacées (NT)")
    print(f"  🟢 {cats.get('LC', 0)} préoccupation mineure (LC)")


if __name__ == "__main__":
    fetch_threat_status()
