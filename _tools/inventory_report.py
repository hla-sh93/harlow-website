"""Turn _inventory/pages.json into _inventory/urls.csv and print the summary tables.

Usage:
    python -u _tools/inventory_report.py
"""

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
INV = ROOT / "_inventory"

sys.stdout.reconfigure(encoding="utf-8")


def lang_of(rec):
    if rec.get("lang"):
        return "ar" if rec["lang"].startswith("ar") else "en"
    return "ar" if rec["path"].startswith("/ar/") or rec["path"] == "/ar" else "en"


def main_doc(rec):
    """The Elementor document that holds the page's own content."""
    for d in rec.get("elementor_docs", []):
        if d["type"] in ("wp-page", "wp-post", "single-post", "single-page", "single",
                         "archive", "error-404", "search-results"):
            return d
    return None


def theme_docs(rec):
    return {d["type"]: d["id"] for d in rec.get("elementor_docs", [])
            if d["type"] in ("header", "footer", "single-post", "single", "archive",
                             "single-page", "error-404")}


def kind_of(rec):
    """Group pages by what WordPress renders them with, refined by hand in KINDS below."""
    if rec.get("status") == 404 and rec.get("raw_file"):
        return "404"
    if rec.get("status") != 200:
        return ""
    if rec.get("single_type"):
        return "single:" + rec["single_type"]
    if rec.get("archive_type"):
        return "archive:" + rec["archive_type"]
    if "blog" in rec.get("body_classes", []):
        return "archive:post"
    if "error404" in rec.get("body_classes", []):
        return "404"
    if "page" in rec.get("body_classes", []) or "home" in rec.get("body_classes", []):
        return "page:" + (rec.get("page_template") or "default").replace("page-template-", "")
    return "other"


# Kinds from inventory.md, keyed by the English path (Arabic pages are found through their
# hreflang partner) or by post type for singles.
KINDS = {
    "K1": ["/"],
    "K2": ["/al-khairat-thermal-power-plant-iraq/", "/smart-metering-iraq/",
           "/drc-cement-plant-iraq/", "/construction-iraq/", "/security-services-iraq/",
           "/consultancy-iraq/"],
    "K3": ["/about-us/"],
    "K4": ["/energy-and-smart-solutions/", "/industrial/", "/security-services/"],
    "K5": ["/blog/", "/latest-news/", "/photo-gallery/", "/work-with-us/", "/harlows-people/"],
    "K6": ["/contact-us/", "/faq/", "/policy/", "/corporate-policies/", "/sitemap/",
           "/application-process/"],
}
SINGLE_KINDS = {"post": "K7", "news": "K7", "albahoo_project": "K8", "gallery_item": "K9",
                "job": "K10"}


def k_of(rec):
    if rec.get("status") == 404 and rec.get("raw_file"):
        return "K11"
    if rec.get("status") != 200:
        return ""
    if rec.get("single_type"):
        return SINGLE_KINDS.get(rec["single_type"], "?")
    if re.search(r"/\d+/$", rec["path"]):  # loop pagination
        return "K5"
    en = unquote(urlsplit(rec.get("hreflang", {}).get("en", "")).path) or rec["path"]
    return next((k for k, paths in KINDS.items() if en in paths), "?")


def clone_of(rec):
    """Proposed decision per URL; the reasons are in inventory.md."""
    status = rec.get("status")
    if status == 404 and "probe" in rec.get("sources", []):
        return "yes (404 template)"
    if status == 200:
        return "yes"
    if status in (301, 302, 307, 308):
        return "no: redirect"
    return f"no: {status}"


def main():
    recs = json.loads((INV / "pages.json").read_text(encoding="utf-8"))
    rows = []
    for r in recs:
        md = main_doc(r)
        rows.append({
            "k": k_of(r),
            "lang": lang_of(r),
            "path": r["path"],
            "status": r.get("status", ""),
            "redirect_to": urlsplit(r.get("redirect_to", "")).path if r.get("redirect_to") else "",
            "kind": kind_of(r),
            "wp_id": (r.get("body_id") or "").split("-")[-1] or r.get("wp_id", ""),
            "rest_type": r.get("rest_type", ""),
            "template": (r.get("page_template") or "").replace("page-template-", ""),
            "title": r.get("title", ""),
            "main_doc": f'{md["type"]}#{md["id"]}' if md else "",
            "top_sections": md["top_level"] if md else "",
            "theme_parts": " ".join(f"{k}#{v}" for k, v in theme_docs(r).items()),
            "words": r.get("word_count", ""),
            "forms": len(r.get("forms", [])),
            "widgets": " ".join(f"{k}:{v}" for k, v in list(r.get("widgets", {}).items())[:12]),
            "hreflang_other": next((unquote(urlsplit(v).path) for k, v in r.get("hreflang", {}).items()
                                    if k not in ("x-default", r.get("lang", "")[:2])), ""),
            "sources": " ".join(r.get("sources", [])),
            "clone": clone_of(r),
        })
    rows.sort(key=lambda x: (x["k"] == "", int(x["k"][1:] or 0) if x["k"] not in ("", "?") else 99,
                             x["lang"], x["path"]))
    with (INV / "urls.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    print(f"{len(rows)} urls in urls.csv")
    kc = Counter((r["k"], r["lang"]) for r in rows if r["k"])
    print("K | en | ar")
    for k in sorted({k for k, _ in kc}, key=lambda k: int(k[1:]) if k != "?" else 99):
        print(f"{k} | {kc[(k, 'en')]} | {kc[(k, 'ar')]}")
    print(f"pages with a kind: {sum(kc.values())}, without: {kc[('?', 'en')] + kc[('?', 'ar')]}")
    print("status:", dict(Counter(str(r["status"]) for r in rows)))
    by_kind = defaultdict(lambda: Counter())
    for r in rows:
        if r["status"] == 200:
            by_kind[r["kind"]][r["lang"]] += 1
    print("\nkind | en | ar")
    for k, c in sorted(by_kind.items()):
        print(f"{k} | {c['en']} | {c['ar']}")
    # Section archetypes: blocks grouped by what they are made of. Singles of one post
    # type share a template, so only one page per (kind, language) is counted for them.
    shapes = Counter()
    examples = {}
    seen_singles = set()
    total = 0
    for r in recs:
        if r.get("status") != 200:
            continue
        k = kind_of(r)
        if k.startswith("single:"):
            if (k, lang_of(r)) in seen_singles:
                continue
            seen_singles.add((k, lang_of(r)))
        for s in r.get("sections", []):
            sig = " + ".join(s["widgets"]) or "(empty)"
            if s["bg"]:
                sig += "  [" + ",".join(s["bg"]) + "]"
            shapes[sig] += 1
            examples.setdefault(sig, r["path"])
            total += 1
    covered = 0
    print(f"\nsections counted: {total}, distinct shapes: {len(shapes)}")
    for n, (sig, c) in enumerate(shapes.most_common(25), 1):
        covered += c
        print(f"{n:2}. {c:3}  {covered * 100 // total:3}%  {sig[:110]}  e.g. {examples[sig][:50]}")

    print("\nnon-200:")
    for r in rows:
        if r["status"] != 200:
            print(f'  {r["status"]} {r["path"]} -> {r["redirect_to"]}  [{r["sources"]}]')


if __name__ == "__main__":
    main()
