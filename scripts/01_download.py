#!/usr/bin/env python3
"""
Phytomia — Étape 1 : Téléchargement des données brutes

Télécharge automatiquement les bases en accès libre.
Affiche les instructions pour les bases à accès restreint.
"""

import os
import json
import zipfile
import requests
from pathlib import Path
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
CONFIG = ROOT / "config" / "sources.json"


def download_file(url, dest, desc=""):
    """Télécharge un fichier avec barre de progression."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        print(f"  ✓ Déjà téléchargé : {dest.name}")
        return True

    print(f"  ↓ Téléchargement : {desc or url}")
    try:
        r = requests.get(url, stream=True, timeout=60, allow_redirects=True)
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        with open(dest, "wb") as f:
            with tqdm(total=total, unit="B", unit_scale=True, desc=dest.name) as pbar:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
                    pbar.update(len(chunk))
        print(f"  ✓ Téléchargé : {dest.name} ({dest.stat().st_size / 1024:.0f} KB)")
        return True
    except Exception as e:
        print(f"  ✗ Erreur : {e}")
        if dest.exists():
            dest.unlink()
        return False


def download_european_host_data():
    """Télécharge EuropeanHostData depuis Dryad."""
    print("\n═══ EuropeanHostData (Dryad) ═══")
    dest_dir = RAW / "european_host_data"
    dest_zip = dest_dir / "download.zip"
    dest_csv = dest_dir / "EuropeanHostData.csv"

    if dest_csv.exists():
        print(f"  ✓ Déjà présent : {dest_csv}")
        return

    # Dryad API: obtenir l'URL de téléchargement
    api_url = "https://datadryad.org/api/v2/datasets/doi%3A10.5061%2Fdryad.3n5tb2rrx"
    print(f"  → Requête API Dryad...")
    try:
        r = requests.get(api_url, timeout=30)
        r.raise_for_status()
        data = r.json()
        # Chercher le lien de téléchargement dans les versions
        version_url = None
        if "_links" in data:
            links = data["_links"]
            if "stash:version" in links:
                version_url = links["stash:version"]["href"]
        
        # Essayer le téléchargement direct du dataset
        dl_url = f"https://datadryad.org/api/v2/datasets/doi%3A10.5061%2Fdryad.3n5tb2rrx/download"
        if download_file(dl_url, dest_zip, "EuropeanHostData.zip"):
            # Décompresser
            try:
                with zipfile.ZipFile(dest_zip, 'r') as zf:
                    zf.extractall(dest_dir)
                print(f"  ✓ Décompressé dans {dest_dir}")
                # Chercher le CSV
                for f in dest_dir.rglob("*.csv"):
                    if "european" in f.name.lower() or "hostdata" in f.name.lower():
                        if f.name != "EuropeanHostData.csv":
                            f.rename(dest_csv)
                        print(f"  ✓ CSV trouvé : {f.name}")
            except zipfile.BadZipFile:
                # Le fichier téléchargé est peut-être directement le CSV
                dest_zip.rename(dest_csv)
                print(f"  ✓ Fichier renommé en CSV")
    except Exception as e:
        print(f"  ✗ Erreur API : {e}")
        print(f"  → Téléchargement manuel : https://datadryad.org/dataset/doi:10.5061/dryad.3n5tb2rrx")
        print(f"    Placer EuropeanHostData.csv dans {dest_dir}/")


def download_globi_europe():
    """Interroge l'API GloBI pour les interactions plante-insecte en Europe."""
    print("\n═══ GloBI (API) ═══")
    dest = RAW / "globi" / "globi_europe_interactions.csv"
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    if dest.exists():
        print(f"  ✓ Déjà présent : {dest}")
        print(f"  (Supprimer le fichier pour re-télécharger)")
        return

    # GloBI propose un export TSV via son API
    # On utilise l'endpoint CSV/TSV qui permet de filtrer par type d'interaction
    # L'API est lente pour les gros exports — on fait par type d'interaction
    
    interaction_types = [
        "pollinates",
        "visits flowers of",
        "eats",
        "has host",
        "parasite of",
        "parasitoid of",
        "preys on",
    ]
    
    all_rows = []
    base = "https://api.globalbioticinteractions.org/interaction"
    
    for itype in interaction_types:
        print(f"  → Requête GloBI : {itype}...")
        params = {
            "interactionType": itype,
            "targetTaxon": "Plantae",
            "sourceTaxon": "Insecta",
            "type": "json",
            "limit": 5000,  # GloBI pagine
        }
        try:
            r = requests.get(base, params=params, timeout=120)
            r.raise_for_status()
            data = r.json()
            interactions = data.get("data", [])
            print(f"    {len(interactions)} interactions trouvées")
            
            for row in interactions:
                # row format: [source_taxon, interaction_type, target_taxon, ...]
                if len(row) >= 3:
                    all_rows.append({
                        "source_taxon": row[0] if len(row) > 0 else "",
                        "interaction_type": row[1] if len(row) > 1 else "",
                        "target_taxon": row[2] if len(row) > 2 else "",
                        "source_id": row[3] if len(row) > 3 else "",
                        "target_id": row[4] if len(row) > 4 else "",
                        "study": row[5] if len(row) > 5 else "",
                    })
        except Exception as e:
            print(f"    ✗ Erreur : {e}")

    if all_rows:
        import csv
        with open(dest, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["source_taxon", "interaction_type", "target_taxon", "source_id", "target_id", "study"])
            w.writeheader()
            w.writerows(all_rows)
        print(f"  ✓ {len(all_rows)} interactions sauvegardées dans {dest.name}")
    else:
        print("  ✗ Aucune donnée récupérée. Vérifier la connexion.")
        
    # Alternative : télécharger le dump complet GloBI
    print(f"\n  💡 Alternative : télécharger le dump complet GloBI (~3 GB)")
    print(f"     https://zenodo.org/records/7348355")
    print(f"     Fichier : interactions.tsv.gz → décompresser dans data/raw/globi/")


def download_hosts_nhm():
    """Télécharge la base HOSTS du NHM London via l'API CKAN.
    
    L'ancienne URL (www.nhm.ac.uk/our-science/data/hostplants/) est morte (403).
    La base a migré vers data.nhm.ac.uk/dataset/hosts.
    Resource ID: 877f387a-36a3-486c-a0c1-b8d5fb69f85a
    """
    print("\n═══ HOSTS (NHM London) ═══")
    dest_dir = RAW / "hosts_nhm"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_csv = dest_dir / "hosts_nhm.csv"
    
    if dest_csv.exists():
        print(f"  ✓ Déjà présent : {dest_csv}")
        return True
    
    RESOURCE_ID = "877f387a-36a3-486c-a0c1-b8d5fb69f85a"
    API_BASE = "https://data.nhm.ac.uk/api/3/action/datastore_search"
    PAGE_SIZE = 10000
    
    print(f"  → Téléchargement via API CKAN (par pages de {PAGE_SIZE})...")
    print(f"    Resource ID : {RESOURCE_ID}")
    
    all_records = []
    offset = 0
    fieldnames = None
    
    try:
        while True:
            url = f"{API_BASE}?resource_id={RESOURCE_ID}&limit={PAGE_SIZE}&offset={offset}"
            r = requests.get(url, timeout=60)
            r.raise_for_status()
            data = r.json()
            
            if not data.get("success"):
                print(f"  ✗ API error: {data.get('error', 'unknown')}")
                break
            
            result = data.get("result", {})
            records = result.get("records", [])
            total = result.get("total", 0)
            
            if not records:
                break
            
            if fieldnames is None:
                fieldnames = [f["id"] for f in result.get("fields", []) if f["id"] != "_id"]
                print(f"  Colonnes : {fieldnames[:8]}{'...' if len(fieldnames) > 8 else ''}")
                print(f"  Total annoncé : {total:,} enregistrements")
            
            all_records.extend(records)
            offset += PAGE_SIZE
            
            print(f"    {len(all_records):,} / {total:,} téléchargés...")
            
            if len(all_records) >= total:
                break
        
        if all_records and fieldnames:
            import csv
            with open(dest_csv, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                w.writeheader()
                w.writerows(all_records)
            print(f"  ✓ {len(all_records):,} enregistrements sauvegardés dans {dest_csv.name}")
            return True
        else:
            print(f"  ✗ Aucun enregistrement récupéré")
            return False
            
    except Exception as e:
        print(f"  ✗ Erreur API CKAN : {e}")
        print(f"  → L'ancienne URL (nhm.ac.uk/our-science/data/hostplants/) est obsolète.")
        print(f"    Nouvelle URL : https://data.nhm.ac.uk/dataset/hosts")
        print(f"    Resource : {RESOURCE_ID}")
        print(f"    Placer le CSV manuellement dans {dest_dir}/")
        return False


def show_manual_instructions(sources):
    """Affiche les instructions pour les bases à téléchargement manuel."""
    manual = [s for s in sources if not s.get("auto_download", False)]
    if not manual:
        return
    
    print("\n" + "=" * 60)
    print("BASES À TÉLÉCHARGER MANUELLEMENT")
    print("=" * 60)
    
    for src in manual:
        print(f"\n── {src['name']} ──")
        print(f"   URL : {src['url']}")
        if "doi" in src:
            print(f"   DOI : {src['doi']}")
        if "access_note" in src:
            print(f"   Note : {src['access_note']}")
        dest = RAW / src["id"]
        print(f"   Placer les fichiers dans : {dest}/")


def main():
    print("╔══════════════════════════════════════════╗")
    print("║   Phytomia — Téléchargement des données  ║")
    print("╚══════════════════════════════════════════╝")
    
    # Créer les dossiers
    RAW.mkdir(parents=True, exist_ok=True)
    
    # Charger la config
    with open(CONFIG) as f:
        config = json.load(f)
    
    # Téléchargements automatiques
    download_european_host_data()
    download_globi_europe()
    download_hosts_nhm()
    
    # Instructions manuelles
    show_manual_instructions(config["sources"])
    
    print("\n" + "=" * 60)
    print("Téléchargement terminé.")
    print("Prochaine étape : python scripts/02_parse_european_host_data.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
