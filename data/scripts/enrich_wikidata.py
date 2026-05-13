#!/usr/bin/env python3
"""
data/scripts/enrich_wikidata.py  (v2)

Enrichit les plantes de Phytomia avec donnees Wikidata.
v2: retry intelligent sur 429 + adaptation au Retry-After + pas de perte de batch.
"""

import json
import time
import sys
from pathlib import Path
from urllib.parse import urlencode
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[2]
PLANTS_FILE = ROOT / "public" / "data" / "plants.json"
CACHE_FILE = ROOT / "data" / "wikidata_plants_cache.json"
LOG_FILE = ROOT / "data" / "wikidata_batch.log"

SPARQL_URL = "https://query.wikidata.org/sparql"
BATCH_SIZE = 80
TIMEOUT = 120

SLEEP_NORMAL = 1.0       # pause entre batches en mode normal
SLEEP_THROTTLED = 65.0   # pause par defaut quand throttle (1 req/min observed)
SLEEP_RECOVER_STEP = 5.0 # decremente la pause apres chaque succes en mode throttled
RECOVERY_AFTER_N_OK = 3  # nombre de succes consecutifs avant de retenter rapide

USER_AGENT = (
    "Phytomia/1.0 "
    "(https://github.com/ThomasHANSS/phytomia; thomas.hanss@vivantes.fr) "
    "python-urllib"
)

QUERY_TEMPLATE = """
SELECT ?name
       (SAMPLE(?taxon) AS ?qid)
       (SAMPLE(?commonName) AS ?nameFr)
       (SAMPLE(?familyName) AS ?family)
       (SAMPLE(?heightVal) AS ?height)
       (GROUP_CONCAT(DISTINCT ?useQid;    separator="|") AS ?useQids)
       (GROUP_CONCAT(DISTINCT ?useFr;     separator="|") AS ?usesFr)
       (GROUP_CONCAT(DISTINCT ?useEn;     separator="|") AS ?usesEn)
       (GROUP_CONCAT(DISTINCT ?habitatFr; separator="|") AS ?habitatsFr)
       (SAMPLE(?wpFr) AS ?wikipediaFr)
WHERE {
  VALUES ?name { __NAMES__ }
  ?taxon wdt:P225 ?name .
  OPTIONAL {
    ?taxon wdt:P1843 ?commonName .
    FILTER(LANG(?commonName) = "fr")
  }
  OPTIONAL {
    ?taxon wdt:P171+ ?family .
    ?family wdt:P105 wd:Q35409 .
    ?family wdt:P225 ?familyName .
  }
  OPTIONAL { ?taxon wdt:P2048 ?heightVal . }
  OPTIONAL {
    ?taxon wdt:P366 ?useQid .
    OPTIONAL { ?useQid rdfs:label ?useFr . FILTER(LANG(?useFr) = "fr") }
    OPTIONAL { ?useQid rdfs:label ?useEn . FILTER(LANG(?useEn) = "en") }
  }
  OPTIONAL {
    ?taxon wdt:P2974 ?habitat .
    OPTIONAL { ?habitat rdfs:label ?habitatFr . FILTER(LANG(?habitatFr) = "fr") }
  }
  OPTIONAL {
    ?wpFr schema:about ?taxon ;
          schema:isPartOf <https://fr.wikipedia.org/> .
  }
}
GROUP BY ?name
"""


def log(msg):
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def escape_sparql(name):
    return name.replace("\\", "\\\\").replace('"', '\\"')


def query_batch(names):
    values = " ".join(f'"{escape_sparql(n)}"' for n in names)
    sparql = QUERY_TEMPLATE.replace("__NAMES__", values)
    params = urlencode({"query": sparql, "format": "json"})
    url = f"{SPARQL_URL}?{params}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/sparql-results+json",
        },
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        payload = json.loads(resp.read())
    return payload["results"]["bindings"]


def split_concat(v, sep="|"):
    return [x for x in (v or "").split(sep) if x]


def parse_row(row):
    def g(k):
        return row[k]["value"] if k in row and row[k]["value"] else None

    qid = g("qid")
    if qid and "/" in qid:
        qid = qid.rsplit("/", 1)[-1]

    use_qids = [u.rsplit("/", 1)[-1] for u in split_concat(g("useQids")) if "/" in u]

    h = g("height")
    height_m = None
    if h:
        try:
            height_m = float(h)
        except ValueError:
            pass

    return {
        "qid": qid,
        "name_fr": g("nameFr"),
        "family": g("family"),
        "height_m": height_m,
        "use_qids": use_qids,
        "uses_fr": split_concat(g("usesFr")),
        "uses_en": split_concat(g("usesEn")),
        "habitats_fr": split_concat(g("habitatsFr")),
        "wp_fr": g("wikipediaFr"),
    }


def save_cache(cache):
    tmp = CACHE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2))
    tmp.replace(CACHE_FILE)


def parse_retry_after(headers, fallback):
    val = headers.get("Retry-After") if headers else None
    if not val:
        return fallback
    try:
        return max(1, int(val))
    except (TypeError, ValueError):
        return fallback


def main():
    if not PLANTS_FILE.exists():
        log(f"ERROR: {PLANTS_FILE} introuvable")
        sys.exit(1)

    plants = json.loads(PLANTS_FILE.read_text())
    log(f"Charge {len(plants)} plantes depuis {PLANTS_FILE.name}")

    cache = {}
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text())
        matched = sum(1 for v in cache.values() if v.get("qid"))
        log(f"Cache existant: {len(cache)} entrees ({matched} avec QID)")

    todo = [p["sci"] for p in plants if p["sci"] not in cache]
    n_batches = (len(todo) + BATCH_SIZE - 1) // BATCH_SIZE
    log(f"A interroger: {len(todo)} plantes en {n_batches} batches de {BATCH_SIZE}")

    if not todo:
        log("Rien a faire, cache complet.")
        return

    current_sleep = SLEEP_NORMAL
    consecutive_ok = 0
    total_found = 0
    i = 0
    started = time.time()

    while i < len(todo):
        batch = todo[i : i + BATCH_SIZE]
        try:
            results = query_batch(batch)
            found = {}
            for row in results:
                name = row["name"]["value"]
                found[name] = parse_row(row)
            for name in batch:
                cache[name] = found.get(name, {"qid": None})
            total_found += len(found)
            save_cache(cache)

            done = i + len(batch)
            elapsed = time.time() - started
            rate = done / max(elapsed, 1)
            eta_min = (len(todo) - done) / max(rate, 0.0001) / 60
            log(
                f"  [{done:>5}/{len(todo)}] matched {len(found)}/{len(batch)} "
                f"(cum. {total_found}) -- sleep={current_sleep:.0f}s ETA={eta_min:.0f}min"
            )

            # Mode recuperation : reduire progressivement le sleep apres succes
            consecutive_ok += 1
            if current_sleep > SLEEP_NORMAL and consecutive_ok >= RECOVERY_AFTER_N_OK:
                current_sleep = max(SLEEP_NORMAL, current_sleep - SLEEP_RECOVER_STEP)
                log(f"    Recuperation: nouveau sleep = {current_sleep:.0f}s")
                consecutive_ok = 0

            i += BATCH_SIZE
            time.sleep(current_sleep)

        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = parse_retry_after(e.headers, int(SLEEP_THROTTLED))
                # passer en mode throttled
                current_sleep = max(current_sleep, float(wait))
                consecutive_ok = 0
                log(f"  [{i:>5}] HTTP 429 throttled -- attente {wait}s avant retry meme batch")
                time.sleep(wait)
                # NE PAS incrementer i : on retente la meme batch
            else:
                log(f"  [{i:>5}] HTTP {e.code}: {e.reason} -- skip batch")
                for name in batch:
                    cache[name] = {"qid": None, "_error": e.code}
                save_cache(cache)
                i += BATCH_SIZE
                time.sleep(current_sleep)

        except Exception as e:
            log(f"  [{i:>5}] ERROR {type(e).__name__}: {e} -- retry batch dans 30s")
            time.sleep(30)
            # NE PAS incrementer i : on retente la meme batch

    final_matched = sum(1 for v in cache.values() if v.get("qid"))
    elapsed = time.time() - started
    log(
        f"Termine. {final_matched}/{len(plants)} matchees "
        f"({final_matched * 100 // len(plants)}%) en {elapsed/60:.1f} min"
    )


if __name__ == "__main__":
    main()
