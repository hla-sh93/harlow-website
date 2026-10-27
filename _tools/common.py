"""Facts shared by every tool: the live site, the pages in scope and their local names."""

import csv
import re
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.harlowgroup.com"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
WIDTHS = (1440, 479)
HEIGHT = 900
CAPTURE = ROOT / "_capture"


def local_name(path):
    """Live path -> flat page name: segments joined by '-' ("/news/x/" -> "news-x")."""
    segs = [s for s in unquote(path).split("/") if s]
    return "-".join(segs) or "index"


def pages():
    """Every page in scope, from _inventory/urls.csv, in kind order."""
    out = []
    with (ROOT / "_inventory" / "urls.csv").open(encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            if not row["clone"].startswith("yes"):
                continue
            path = row["path"]
            name = "404" if row["k"] == "K11" else local_name(path)
            out.append({"path": path, "name": name, "kind": row["k"], "title": row["title"],
                        "url": SITE + quote(path), "status": row["status"]})
    return out


def is_live(url):
    host = urlsplit(url).netloc.lower()
    return host in ("www.harlowgroup.com", "harlowgroup.com")


def page_for(url, known):
    """Local file for a live page URL (known: {path: name}), else None."""
    path = unquote(urlsplit(url).path)
    if not path.endswith("/") and not re.search(r"\.[a-z0-9]{2,4}$", path):
        path += "/"
    return known.get(path)
