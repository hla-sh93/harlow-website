"""The per-page table: one row per page, one column per check, from the latest runs.

Reads _capture/compare.json (compare.py), _capture/style_check.json (style_check.py) and
runs the link check per page. Writes _capture/report.md and prints it.

Usage:
    python -u _tools/report.py
"""

import json
import sys

from common import CAPTURE, ROOT, WIDTHS, pages
from links import check_page

BEHAVIOUR = {  # pages behaviour.py drives, and what it drives there
    "index": "header, menus, carousel, slider, cookie bar, transition",
    "about-us": "entrance animations",
    "faq": "accordion",
    "harlows-people": "person popup",
    "gallery-item-al-rasheed-hotel": "gallery, lightbox",
}


def main():
    geo = json.loads((CAPTURE / "compare.json").read_text(encoding="utf-8"))
    sty = json.loads((CAPTURE / "style_check.json").read_text(encoding="utf-8"))
    names = {p["name"] for p in pages()}
    rows = ["| # | page | kind | height 1440 live/clone | height 479 live/clone | elements | boxes off | styles off | links broken | behaviour checked |",
            "|---|---|---|---|---|---|---|---|---|---|"]
    bad_pages = 0
    for n, p in enumerate(pages(), 1):
        name = p["name"]
        g = [geo.get(f"{name}@{w}") for w in WIDTHS]
        s = [sty.get(f"{name}@{w}") for w in WIDTHS]
        if not all(g) or not all(s):
            rows.append(f"| {n} | {name} | {p['kind']} | not measured | | | | | | |")
            bad_pages += 1
            continue
        heights = [f"{x['live_h']}/{x['clone_h']}" for x in g]
        boxes = sum(len(x["diffs"]) for x in g)
        styles = sum(sum(x["bad"].values()) for x in s)
        _, broken, pending = check_page(ROOT / f"{name}.html", names)
        ok = boxes == 0 and styles == 0 and not broken and not pending and all(
            x["live_h"] == x["clone_h"] for x in g)
        bad_pages += not ok
        rows.append(f"| {n} | {name} | {p['kind']} | {heights[0]} | {heights[1]} | {g[0]['compared']} | "
                    f"{boxes} | {styles} | {len(broken) + len(pending)} | {BEHAVIOUR.get(name, '-')} |")
    rows.append("")
    rows.append(f"{len(pages())} pages, {bad_pages} with any difference")
    text = "\n".join(rows) + "\n"
    (CAPTURE / "report.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
