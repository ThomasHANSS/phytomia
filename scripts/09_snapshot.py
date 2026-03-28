#!/usr/bin/env python3
"""
Phytomia — Gestionnaire de snapshots

Sauvegarde la dernière version fonctionnelle de chaque source de données.
Si une source devient inaccessible (suppression, changement d'URL, serveur en panne),
le pipeline utilise automatiquement le dernier snapshot connu.

Les snapshots sont committés dans le repo Git pour être préservés.
Dossier : data/snapshots/<source_id>/

Manifest : data/snapshots/manifest.json
  Contient pour chaque source : date du dernier snapshot, hash du fichier,
  nombre de lignes, et statut de la dernière tentative de téléchargement.
"""

import os
import csv
import json
import hashlib
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS = ROOT / "data" / "snapshots"
PARSED = ROOT / "data" / "parsed"
RAW = ROOT / "data" / "raw"
MANIFEST = SNAPSHOTS / "manifest.json"


def file_hash(path):
    """Calcule le hash SHA-256 d'un fichier."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def count_lines(path):
    """Compte les lignes d'un CSV (hors header)."""
    try:
        with open(path, encoding="utf-8") as f:
            return sum(1 for _ in f) - 1  # minus header
    except Exception:
        return 0


def load_manifest():
    """Charge le manifest des snapshots."""
    if MANIFEST.exists():
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(manifest):
    """Sauvegarde le manifest."""
    SNAPSHOTS.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


def snapshot_parsed(source_id):
    """
    Archive le CSV parsé d'une source dans data/snapshots/.
    Appelé après un parsing réussi.
    Retourne True si le snapshot a été mis à jour.
    """
    parsed_file = PARSED / (source_id + ".csv")
    if not parsed_file.exists():
        print(f"  [snapshot] Pas de fichier parsé pour {source_id}")
        return False

    snap_dir = SNAPSHOTS / source_id
    snap_dir.mkdir(parents=True, exist_ok=True)
    snap_file = snap_dir / (source_id + ".csv")

    new_hash = file_hash(parsed_file)
    manifest = load_manifest()
    old_entry = manifest.get(source_id, {})
    old_hash = old_entry.get("hash", "")

    if new_hash == old_hash:
        print(f"  [snapshot] {source_id}: inchangé (hash {new_hash})")
        return False

    # Copier le nouveau snapshot
    shutil.copy2(parsed_file, snap_file)

    # Aussi archiver les fichiers bruts si présents
    raw_dir = RAW / source_id
    if raw_dir.exists():
        snap_raw = snap_dir / "raw"
        snap_raw.mkdir(exist_ok=True)
        for f in raw_dir.iterdir():
            if f.is_file() and f.suffix in (".csv", ".tsv", ".json"):
                shutil.copy2(f, snap_raw / f.name)

    n_lines = count_lines(snap_file)
    now = datetime.now(timezone.utc).isoformat()

    manifest[source_id] = {
        "hash": new_hash,
        "date": now,
        "lines": n_lines,
        "file": str(snap_file.relative_to(ROOT)),
        "status": "ok",
        "last_download_ok": now,
    }
    save_manifest(manifest)

    print(f"  [snapshot] {source_id}: archivé ({n_lines} lignes, hash {new_hash})")
    return True


def restore_from_snapshot(source_id):
    """
    Restaure le dernier snapshot d'une source dans data/parsed/.
    Appelé quand le téléchargement ou le parsing échoue.
    Retourne True si un snapshot a été restauré.
    """
    manifest = load_manifest()
    entry = manifest.get(source_id, {})
    snap_file = SNAPSHOTS / source_id / (source_id + ".csv")

    if not snap_file.exists():
        print(f"  [snapshot] {source_id}: aucun snapshot disponible")
        return False

    PARSED.mkdir(parents=True, exist_ok=True)
    dest = PARSED / (source_id + ".csv")
    shutil.copy2(snap_file, dest)

    snap_date = entry.get("date", "inconnue")
    n_lines = entry.get("lines", "?")

    # Mettre à jour le statut
    entry["status"] = "restored_from_snapshot"
    entry["last_restore"] = datetime.now(timezone.utc).isoformat()
    manifest[source_id] = entry
    save_manifest(manifest)

    print(f"  [snapshot] {source_id}: RESTAURÉ depuis le snapshot du {snap_date[:10]} ({n_lines} lignes)")
    print(f"             La source originale est peut-être indisponible.")
    return True


def mark_download_failed(source_id, error=""):
    """Marque une tentative de téléchargement échouée dans le manifest."""
    manifest = load_manifest()
    entry = manifest.get(source_id, {})
    entry["status"] = "download_failed"
    entry["last_failure"] = datetime.now(timezone.utc).isoformat()
    entry["last_error"] = str(error)[:200]
    manifest[source_id] = entry
    save_manifest(manifest)


def snapshot_all():
    """Archive tous les CSV parsés existants."""
    print("═══ Snapshot de toutes les sources ═══")
    SNAPSHOTS.mkdir(parents=True, exist_ok=True)

    if not PARSED.exists():
        print("  Pas de fichiers parsés à archiver.")
        return

    updated = 0
    for csv_file in sorted(PARSED.glob("*.csv")):
        source_id = csv_file.stem
        if snapshot_parsed(source_id):
            updated += 1

    manifest = load_manifest()
    print(f"\n  ✓ {len(manifest)} sources archivées, {updated} mises à jour")


def status():
    """Affiche le statut de tous les snapshots."""
    print("═══ Statut des snapshots ═══")
    manifest = load_manifest()

    if not manifest:
        print("  Aucun snapshot. Exécuter d'abord le pipeline puis: python scripts/09_snapshot.py")
        return

    for sid, entry in sorted(manifest.items()):
        date = entry.get("date", "?")[:10]
        lines = entry.get("lines", "?")
        status = entry.get("status", "?")
        snap_file = ROOT / entry.get("file", "")
        exists = snap_file.exists() if entry.get("file") else False

        icon = "✓" if status == "ok" else ("⟳" if status == "restored_from_snapshot" else "✗")
        print(f"  {icon} {sid:30s}  {date}  {lines:>6} lignes  [{status}]  {'exists' if exists else 'MISSING'}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        status()
    elif len(sys.argv) > 1 and sys.argv[1] == "restore":
        if len(sys.argv) > 2:
            restore_from_snapshot(sys.argv[2])
        else:
            print("Usage: python scripts/09_snapshot.py restore <source_id>")
    else:
        snapshot_all()
