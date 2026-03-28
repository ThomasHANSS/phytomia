#!/usr/bin/env python3
"""
Phytomia — Parse HOSTS (NHM London)

Entrée  : data/raw/hosts_nhm/ (CSV téléchargé depuis data.nhm.ac.uk)
Sortie  : data/parsed/hosts_nhm.csv

La base HOSTS contient ~180K paires lépidoptère×plante hôte mondiales.
On filtre pour ne garder que les espèces européennes.
"""

import csv
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "hosts_nhm"
OUT = ROOT / "data" / "parsed"

# Familles de lépidoptères communes en Europe (pour filtrage approximatif)
EU_LEPIDOPTERA_FAMILIES = {
    "Nymphalidae", "Pieridae", "Lycaenidae", "Papilionidae", "Hesperiidae",
    "Noctuidae", "Geometridae", "Erebidae", "Tortricidae", "Pyralidae",
    "Crambidae", "Sphingidae", "Saturniidae", "Zygaenidae", "Gracillariidae",
    "Yponomeutidae", "Gelechiidae", "Oecophoridae", "Coleophoridae",
    "Psychidae", "Lasiocampidae", "Notodontidae", "Arctiidae", "Lymantriidae",
}


def find_csv():
    if not RAW.exists():
        return None
    for f in RAW.rglob("*.csv"):
        return f
    return None


def is_binomial(name):
    parts = name.strip().split()
    return len(parts) >= 2 and parts[0][0].isupper() and parts[1][0].islower()


def clean_name(name):
    name = name.strip()
    if "(" in name:
        name = name[:name.index("(")].strip()
    parts = name.split()
    if len(parts) >= 2:
        return parts[0] + " " + parts[1]
    return name


def parse():
    print("═══ Parse HOSTS (NHM) ═══")
    
    src = find_csv()
    if not src:
        print(f"  ✗ Aucun CSV trouvé dans {RAW}/")
        print(f"    Télécharger depuis : https://data.nhm.ac.uk/dataset/hosts")
        print(f"    Placer le CSV dans {RAW}/")
        return
    
    print(f"  → Lecture : {src.name}")
    OUT.mkdir(parents=True, exist_ok=True)
    
    rows = []
    skipped = 0
    
    with open(src, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        print(f"  Colonnes : {cols[:10]}")
        
        for row in reader:
            row = {k.strip(): (v.strip() if v else "") for k, v in row.items()}
            
            # Le CKAN DataStore du NHM utilise des colonnes comme :
            # "Hostplant family", "Hostplant genus", "Hostplant species",
            # "Moth/butterfly family", "Moth/butterfly genus", "Moth/butterfly species",
            # "Locality", "Country", etc.
            # Mais le format peut varier — on cherche largement
            
            # Plante hôte
            hp_genus = ""
            hp_species = ""
            host = ""
            for k, v in row.items():
                kl = k.lower()
                if ("hostplant" in kl or "host" in kl or "plant" in kl):
                    if "genus" in kl:
                        hp_genus = v
                    elif "species" in kl and "subspecies" not in kl:
                        hp_species = v
                    elif "family" not in kl and "order" not in kl and v and " " in v:
                        host = v  # Nom complet
            
            if hp_genus and hp_species:
                host = hp_genus + " " + hp_species
            if not host:
                # Fallback : chercher une colonne qui contient un nom binomial
                for k, v in row.items():
                    kl = k.lower()
                    if ("plant" in kl or "host" in kl) and is_binomial(v):
                        host = v
                        break
            
            # Insecte (lépidoptère)
            lep_genus = ""
            lep_species = ""
            insect = ""
            for k, v in row.items():
                kl = k.lower()
                if ("moth" in kl or "butterfly" in kl or "lepidopt" in kl or "insect" in kl):
                    if "genus" in kl:
                        lep_genus = v
                    elif "species" in kl and "subspecies" not in kl:
                        lep_species = v
                    elif "family" not in kl and "order" not in kl and v and " " in v:
                        insect = v
            
            if lep_genus and lep_species:
                insect = lep_genus + " " + lep_species
            if not insect:
                for k, v in row.items():
                    kl = k.lower()
                    if ("species" in kl or "moth" in kl or "lepid" in kl) and is_binomial(v):
                        insect = v
                        break
            
            if not host or not insect:
                skipped += 1
                continue
            
            if not is_binomial(insect):
                skipped += 1
                continue
            
            # Filtrage géographique — chercher la localité dans toutes les colonnes pertinentes
            locality = ""
            family = ""
            for k, v in row.items():
                kl = k.lower()
                if ("localit" in kl or "country" in kl or "region" in kl or "distribution" in kl) and v:
                    locality = (locality + " " + v).lower()
                if ("moth" in kl or "butterfly" in kl or "lepidopt" in kl) and "family" in kl and v:
                    family = v
                elif kl == "family" and v:
                    family = v
            
            # Garder si mention d'un pays européen ou famille EU commune
            eu_keywords = ["europe", "france", "germany", "britain", "uk",
                          "spain", "italy", "sweden", "austria", "switzerland",
                          "netherlands", "belgium", "poland", "czech", "denmark",
                          "norway", "finland", "portugal", "greece", "ireland",
                          "hungary", "romania", "croatia", "palearctic"]
            
            is_eu = any(kw in locality for kw in eu_keywords)
            is_eu_family = family in EU_LEPIDOPTERA_FAMILIES
            
            if not is_eu and not is_eu_family:
                skipped += 1
                continue
            
            host_clean = clean_name(host)
            if not is_binomial(host_clean):
                skipped += 1
                continue
            
            rows.append({
                "plant_name": host_clean,
                "insect_name": clean_name(insect),
                "interaction_type": "hote_larvaire",
                "source_db": "HOSTS",
                "n_obs": "",
                "geo": "EU",
                "year_range": "lit. review",
            })
    
    # Dédoublonner
    seen = set()
    unique = []
    for r in rows:
        key = (r["plant_name"], r["insect_name"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    
    dest = OUT / "hosts_nhm.csv"
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "plant_name", "insect_name", "interaction_type",
            "source_db", "n_obs", "geo", "year_range"
        ])
        w.writeheader()
        w.writerows(unique)
    
    print(f"\n  ✓ {len(unique)} paires uniques (de {len(rows)}, {skipped} ignorées)")
    print(f"  ✓ Sauvegardé : {dest}")


if __name__ == "__main__":
    parse()
