"""Stage B assets: download every file the captured pages used.

Reads _capture/resources/*.json (written by capture.py) and the url() references inside
every fetched stylesheet, then stores:

    assets/uploads/<y>/<m>/<file>   images, video and PDFs (mirrors wp-content/uploads)
    assets/fonts/<file>             self-hosted web fonts
    _source/<wp path>               the platform's own CSS and JS, unminified where the
                                    server has it: read by the stylesheet builder and
                                    audit, never shipped

Writes _capture/assets.json (url -> local path, status, bytes).

Usage:
    python -u _tools/fetch_assets.py
"""

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

import requests

from common import CAPTURE, ROOT, UA, is_live

FONT_EXT = (".woff2", ".woff", ".ttf", ".eot", ".otf")
session = requests.Session()
session.headers["User-Agent"] = UA


def local_for(url):
    """Where a live URL is stored, or None when it is not ours to keep."""
    if not is_live(url):
        return None
    path = unquote(urlsplit(url).path)
    if path.startswith("/wp-content/uploads/elementor/google-fonts/fonts/"):
        return ROOT / "assets" / "fonts" / Path(path).name
    if path.startswith("/wp-content/uploads/elementor/") or path.startswith(
            "/wp-content/uploads/custom-css-js/"):
        return ROOT / "_source" / path.lstrip("/")
    if path.startswith("/wp-content/uploads/"):
        return ROOT / "assets" / "uploads" / path[len("/wp-content/uploads/"):]
    if path.startswith(("/wp-content/plugins/", "/wp-content/themes/", "/wp-includes/")):
        if path.endswith(FONT_EXT) or path.endswith((".png", ".svg", ".gif", ".jpg")):
            return ROOT / "_source" / path.lstrip("/")
        if path.endswith((".css", ".js")):
            return ROOT / "_source" / path.lstrip("/")
    return None


def fetch(url):
    dest = local_for(url)
    if dest is None:
        return url, None, "skipped", 0
    if dest.exists() and dest.stat().st_size:
        return url, dest, "cached", dest.stat().st_size
    clean = url.split("#")[0]
    try:
        r = session.get(clean, timeout=120)
    except requests.RequestException as err:
        return url, dest, f"error {err}", 0
    if r.status_code != 200:
        return url, dest, r.status_code, 0
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(r.content)
    # keep the readable source beside the minified file the page loaded
    if dest.suffix in (".css", ".js") and ".min." in dest.name:
        plain = clean.split("?")[0].replace(".min.", ".")
        rp = session.get(plain, timeout=60)
        if rp.status_code == 200 and rp.headers.get("Content-Type", "").startswith(
                ("text/css", "application/javascript", "text/javascript", "application/x-javascript")):
            dest.with_name(dest.name.replace(".min.", ".")).write_bytes(rp.content)
    return url, dest, 200, len(r.content)


def css_refs(css_url, text):
    out = set()
    for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", text):
        ref = m.group(1).strip()
        if ref.startswith("data:"):
            continue
        out.add(urljoin(css_url, ref))
    return out


ASCII_WS = "[ \t\n\r\f]+"  # srcset and URLs: file names here contain U+202F, which is not a separator


def raw_refs(text):
    """Asset URLs written in the server HTML: src, srcset, poster, href to files, url()."""
    out = set()
    for m in re.finditer(r'\s(?:src|data-src|poster|href|data-thumbnail|preloader-image-url)="([^"]+)"', text):
        out.add(m.group(1))
    for m in re.finditer(r'\s(?:srcset|data-srcset)="([^"]+)"', text):
        for cand in re.split("," + ASCII_WS, m.group(1)):
            url = re.split(ASCII_WS, cand.strip())[0]
            if url:
                out.add(url)
    for m in re.finditer(r"url\(\s*(?:&quot;|['\"])?([^'\")&]+)", text):
        out.add(m.group(1))
    for m in re.finditer(r'background_video_link&quot;:&quot;([^&]+)&quot;', text):
        out.add(m.group(1).replace("\\/", "/"))
    return {urljoin("https://www.harlowgroup.com/", u) for u in out if "wp-content" in u}


def main():
    urls = set()
    for f in sorted((CAPTURE / "resources").glob("*.json")):
        urls |= set(json.loads(f.read_text(encoding="utf-8")))
    for f in sorted((CAPTURE / "raw").glob("*.html")):
        urls |= raw_refs(f.read_text(encoding="utf-8"))
    urls = {u.replace("://harlowgroup.com/", "://www.harlowgroup.com/") for u in urls}
    # drop URLs cut short at a U+202F by an older resource list
    urls = {u for u in urls if not any(o != u and o.startswith(u) for o in urls)}
    manifest = {}
    todo = sorted(u for u in urls if local_for(u))
    seen = set()
    rounds = 0
    while todo:
        rounds += 1
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(fetch, todo))
        seen |= set(todo)
        nxt = set()
        for url, dest, status, size in results:
            manifest[url] = {"path": str(dest.relative_to(ROOT)).replace("\\", "/") if dest else None,
                             "status": status, "bytes": size}
            if status in (200, "cached") and dest and dest.suffix == ".css":
                nxt |= css_refs(url.split("?")[0], dest.read_text(encoding="utf-8", errors="replace"))
        todo = sorted(u for u in nxt - seen if local_for(u))
        print(f"round {rounds}: {len(results)} fetched, {len(todo)} more from CSS")
    (CAPTURE / "assets.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    ok = [m for m in manifest.values() if m["status"] in (200, "cached")]
    bad = {u: m["status"] for u, m in manifest.items() if m["status"] not in (200, "cached")}
    total = sum(m["bytes"] for m in ok)
    kinds = {}
    for m in ok:
        top = m["path"].split("/")[0] + "/" + m["path"].split("/")[1]
        kinds[top] = kinds.get(top, 0) + 1
    print(f"\n{len(ok)} files stored ({total / 1e6:.1f} MB), {len(bad)} failed")
    print("by folder:", kinds)
    for u, s in sorted(bad.items()):
        print(f"  {s} {u}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
