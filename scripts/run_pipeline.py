#!/usr/bin/env python3
"""
Phytomia — Pipeline complet avec snapshots

Ce script orchestre tout le pipeline de données avec gestion automatique
des snapshots. Pour chaque source :

1. Tente le téléchargement + parsing
2. Si ça marche → sauvegarde un snapshot
3. Si ça échoue → restaure le dernier snapshot connu

Résultat : le pipeline ne casse JAMAIS, même si une source disparaît.

Usage :
  python scripts/run_pipeline.py          # Tout le pipeline
  python scripts/run_pipeline.py --force  # Force le re-téléchargement
  python scripts/run_pipeline.py --status # Affiche le statut des snapshots
"""

import sys
import subprocess
import importlib
import traceback
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from snapshot_manager import (
    snapshot_parsed, restore_from_snapshot,
    mark_download_failed, snapshot_all, status as snap_status, load_manifest
)


def run_step(name, module_name, parse_func_name="parse"):
    """
    Exécute une étape du pipeline avec fallback sur snapshot.
    
    Retourne True si des données sont disponibles (fraîches ou snapshot).
    """
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    
    source_id = module_name.split("_", 1)[1] if "_" in module_name else module_name
    # Map module names to source IDs
    source_map = {
        "02_parse_european_host_data": "european_host_data",
        "03_parse_euppollnet": "euppollnet",
        "04_parse_globi": "globi",
        "05_parse_hosts_nhm": "hosts_nhm",
    }
    source_id = source_map.get(module_name, source_id)
    
    try:
        mod = importlib.import_module(module_name)
        func = getattr(mod, parse_func_name)
        func()
        
        # Vérifier que le fichier parsé existe
        parsed_file = ROOT / "data" / "parsed" / (source_id + ".csv")
        if parsed_file.exists() and parsed_file.stat().st_size > 100:
            snapshot_parsed(source_id)
            return True
        else:
            print(f"\n  ⚠ Parsing terminé mais pas de fichier produit.")
            raise FileNotFoundError(f"Fichier parsé manquant: {parsed_file}")
            
    except Exception as e:
        print(f"\n  ✗ ÉCHEC : {e}")
        traceback.print_exc()
        mark_download_failed(source_id, str(e))
        
        # Tenter la restauration depuis le snapshot
        print(f"\n  → Tentative de restauration depuis le snapshot...")
        if restore_from_snapshot(source_id):
            return True
        else:
            print(f"  ✗ Aucun snapshot disponible pour {source_id}.")
            print(f"    Cette source sera absente des données finales.")
            return False


def main():
    if "--status" in sys.argv:
        snap_status()
        return
    
    force = "--force" in sys.argv
    
    print("╔══════════════════════════════════════════╗")
    print("║   Phytomia — Pipeline de données v1.0    ║")
    print("║   avec snapshots de résilience            ║")
    print("╚══════════════════════════════════════════╝")
    print(f"\n  Date : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    
    # Afficher l'état des snapshots existants
    manifest = load_manifest()
    if manifest:
        print(f"\n  Snapshots existants : {len(manifest)} sources")
        for sid, entry in manifest.items():
            d = entry.get("date", "?")[:10]
            n = entry.get("lines", "?")
            print(f"    {sid}: {d} ({n} lignes)")
    
    # Étape 1 : Téléchargement
    print(f"\n{'='*60}")
    print("  ÉTAPE 1 : Téléchargement")
    print(f"{'='*60}")
    try:
        import importlib
        dl = importlib.import_module("01_download")
        dl.main()
    except Exception as e:
        print(f"  ⚠ Erreur téléchargement : {e}")
        print(f"    Certaines sources utiliseront les données existantes ou les snapshots.")
    
    # Étape 2 : Parsing par source (avec fallback snapshot)
    results = {}
    results["european_host_data"] = run_step(
        "EuropeanHostData (Dryad — herbivorie arbres)",
        "02_parse_european_host_data"
    )
    results["euppollnet"] = run_step(
        "EuPPollNet (Zenodo — pollinisation EU)",
        "03_parse_euppollnet"
    )
    results["globi"] = run_step(
        "GloBI (API — toutes interactions)",
        "04_parse_globi"
    )
    results["hosts_nhm"] = run_step(
        "HOSTS NHM (plantes hôtes lépidoptères)",
        "05_parse_hosts_nhm"
    )
    
    # Bilan parsing
    ok = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\n{'='*60}")
    print(f"  BILAN PARSING : {ok}/{total} sources disponibles")
    for sid, success in results.items():
        print(f"    {'✓' if success else '✗'} {sid}")
    print(f"{'='*60}")
    
    if ok == 0:
        print("\n  ✗ Aucune donnée disponible. Arrêt du pipeline.")
        return
    
    # Étape 3 : Harmonisation taxonomique
    print(f"\n{'='*60}")
    print("  ÉTAPE 3 : Harmonisation taxonomique (GBIF)")
    print(f"{'='*60}")
    try:
        tax = importlib.import_module("06_harmonize_taxonomy")
        tax.harmonize()
    except Exception as e:
        print(f"  ⚠ Erreur harmonisation : {e}")
        print(f"    Les noms seront utilisés tels quels.")
    
    # Étape 3b : Statuts de menace UICN
    print(f"\n{'='*60}")
    print("  ÉTAPE 3b : Statuts de menace (UICN / European Red List)")
    print(f"{'='*60}")
    try:
        threat = importlib.import_module("10_fetch_threat_status")
        threat.fetch_threat_status()
    except Exception as e:
        print(f"  ⚠ Erreur statuts de menace : {e}")
        print(f"    Les statuts UICN seront absents — le reste continue.")
    
    # Étape 4 : Fusion
    print(f"\n{'='*60}")
    print("  ÉTAPE 4 : Fusion et dédoublonnage")
    print(f"{'='*60}")
    try:
        merge = importlib.import_module("07_merge")
        merge.merge()
    except Exception as e:
        print(f"  ✗ Erreur fusion : {e}")
        traceback.print_exc()
        return
    
    # Étape 5 : Export JSON
    print(f"\n{'='*60}")
    print("  ÉTAPE 5 : Export JSON pour l'app")
    print(f"{'='*60}")
    try:
        export = importlib.import_module("08_export_app_json")
        export.export()
    except Exception as e:
        print(f"  ✗ Erreur export : {e}")
        traceback.print_exc()
        return
    
    # Snapshot final
    print(f"\n{'='*60}")
    print("  SNAPSHOT : Archivage de toutes les sources")
    print(f"{'='*60}")
    snapshot_all()
    
    print(f"\n{'='*60}")
    print("  ✓ PIPELINE TERMINÉ AVEC SUCCÈS")
    print(f"  Les JSON sont dans output/")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
