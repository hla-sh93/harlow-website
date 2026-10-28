"""Link and file check: every local reference in the built pages and stylesheets exists.

Reads href, src, srcset, poster, data-thumbnail, preloader-image-url and inline url() in
every built page, and url() in every stylesheet. Local files must exist. Links to pages
in scope that are not built yet are counted apart (they exist once stage E has run);
links to live (pages outside v1 and external sites) are not followed.

Usage:
    python -u _tools/links.py

Passing looks like: `N references in M files checked - 0 broken` (and 0 pages pending
once every page is built).
"""

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

from lxml import html as lxml_html

from common import ROOT, pages

ATTRS = ("href", "src", "poster", "data-thumbnail", "preloader-image-url")


def local_refs(page_path):
    doc = lxml_html.fromstring(page_path.read_text(encoding="utf-8"))
    for el in doc.iter():
        if not isinstance(el.tag, str):
            continue
        for a in ATTRS:
            if el.get(a):
                yield el.get(a)
        for a in ("srcset",):
            if el.get(a):
                for cand in re.split(r",[ \t\n\r\f]+", el.get(a).strip()):
                    yield re.split(r"[ \t\n\r\f]+", cand.strip())[0]
        if el.get("style"):
            yield from re.findall(r"url\(\s*['\"]?([^'\")]+)", el.get("style"))
        if el.tag == "link" and el.get("rel") == "stylesheet":
            continue


def is_local(ref):
    return ref and not re.match(r"^(https?:|mailto:|tel:|javascript:|data:|#)", ref)


def check_page(page, names):
    """(references checked, broken refs, pending page links) for one built page."""
    checked, broken, pending = 0, [], set()
    for ref in local_refs(page):
        if not is_local(ref):
            continue
        checked += 1
        path = unquote(urlsplit(ref).path)
        if (ROOT / path).exists():
            continue
        if path.endswith(".html") and path[:-5] in names:
            pending.add(path)
            continue
        broken.append(ref)
    return checked, broken, pending


def main():
    names = {p["name"] for p in pages()}
    broken, pending, checked, files = [], set(), 0, 0
    for page in sorted(ROOT.glob("*.html")):
        files += 1
        n, bad, pend = check_page(page, names)
        checked += n
        broken += [f"{page.name}: {r}" for r in bad]
        pending |= pend
    for css in sorted((ROOT / "assets" / "css").rglob("*.css")):
        files += 1
        for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)", css.read_text(encoding="utf-8")):
            if not is_local(ref):
                continue
            checked += 1
            target = (css.parent / unquote(urlsplit(ref).path)).resolve()
            if not target.exists():
                broken.append(f"{css.relative_to(ROOT)}: {ref}")
    for b in broken[:40]:
        print("  BROKEN", b)
    print(f"{checked} references in {files} files checked - {len(broken)} broken, "
          f"{len(pending)} pages linked but not built yet")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
