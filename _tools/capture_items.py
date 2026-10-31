"""Stage 2 capture: the items of live's content types, and the pictures, from live's REST API.

What a page shows of an item (a card, a slide) is in the reference; what the item is
(its id, address, date, full text, excerpt, featured picture) is in live's public REST
API. This reads the English items of every type that has a REST route, and the media
records of every picture the site uses: the featured pictures of those items, every
`wp-image-<id>` of the 49 reference pages, the pictures of their galleries (an
Elementor gallery names each picture's id in its lightbox link), and the pictures the
pages' SEO heads name (stage 7: a page's social picture, its schema's pictures, the
organization's logo), found by their address. A media record names the
file and each size WordPress made of it, which is what lets the Media Library hold the same
files under the same addresses (theme/functions/install.php).

Written to _capture/rest/<type>.json, _capture/rest/media.json and _capture/rest/pages.json
(the pages' excerpts, which live's search results show). The items are read
from live again only with --items (stage 2); otherwise the captured ones are kept, since
the reference was made from them.

Usage:
    python -u _tools/capture_items.py [--items]
"""

import base64
import json
import re
import sys
import time

from urllib.parse import quote, unquote, urlsplit

import requests

from common import CAPTURE, ROOT, SITE, UA, pages

OUT = CAPTURE / "rest"
UPLOADS = ROOT / "assets" / "uploads"
TYPES = ["posts", "news", "albahoo_project", "gallery_item", "job", "business_model", "harlows_person", "team_member"]
KEEP = ("id", "date", "date_gmt", "modified", "slug", "status", "type", "link", "title", "content", "excerpt",
        "featured_media", "author", "comment_status", "ping_status", "sticky", "format", "categories", "tags",
        "menu_order", "parent")
MEDIA_KEEP = ("id", "date", "slug", "title", "alt_text", "caption", "mime_type", "source_url", "media_details")


def get(session, path, params):
    for attempt in range(4):
        try:
            r = session.get(SITE + "/wp-json/wp/v2/" + path, params=params, timeout=60)
            if r.status_code == 200:
                return r
            print(f"  {path} answered {r.status_code}, again")
        except requests.RequestException as err:
            print(f"  {path}: {err}, again")
        time.sleep(5 * (attempt + 1))
    raise SystemExit(f"{path} did not answer")


def all_of(session, path, params):
    out, page = [], 1
    while True:
        r = get(session, path, dict(params, per_page=100, page=page))
        out += r.json()
        if page >= int(r.headers.get("X-WP-TotalPages", "1")):
            return out
        page += 1


def gallery_pictures(html):
    """The picture ids of a page's Elementor galleries: each picture's lightbox link carries
    its settings as base64 JSON ({"id": ..., "url": ..., "slideshow": ...})."""
    ids = set()
    for hashed in re.findall(r'data-e-action-hash="([^"]+)"', html):
        settings = unquote(hashed).split("settings=", 1)[-1]
        ids.add(int(json.loads(base64.b64decode(settings + "=" * (-len(settings) % 4)))["id"]))
    return ids


def upload_path(url):
    """The path under wp-content/uploads/ of a live picture's address."""
    return unquote(urlsplit(url).path).split("/wp-content/uploads/", 1)[-1]


def record_paths(m):
    """Every file of a media record: the original and each size, as paths under uploads/."""
    base = upload_path(m["source_url"]).rsplit("/", 1)[0] + "/"
    return {upload_path(m["source_url"])} | {base + s["file"] for s in m.get("media_details", {}).get("sizes", {}).values()}


def head_pictures():
    """The pictures the SEO heads of the 49 pages name (their captured server HTML)."""
    paths = set()
    for p in pages():
        raw = CAPTURE / "raw" / f"{p['name']}.html"
        if not raw.exists():
            continue
        head = raw.read_text(encoding="utf-8").split("</head>", 1)[0]
        urls = re.findall(r'<meta property="og:image" content="([^"]+)"', head)
        for block in re.findall(r'class="rank-math-schema">(.*?)</script>', head, re.S):
            urls += re.findall(r'"(?:url|contentUrl)": "([^"]+)"', json.dumps(json.loads(block), ensure_ascii=False))
        paths |= {upload_path(u) for u in urls if "/wp-content/uploads/" in u}
    return paths


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = UA
    featured = set()
    for t in TYPES:
        if "--items" in sys.argv or not (OUT / f"{t}.json").exists():
            items = all_of(session, t, {"lang": "en", "orderby": "id", "order": "asc"})
            items = [{k: it[k] for k in KEEP if k in it} for it in items]
            (OUT / f"{t}.json").write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        else:
            items = json.loads((OUT / f"{t}.json").read_text(encoding="utf-8"))
        featured |= {it["featured_media"] for it in items if it.get("featured_media")}
        print(f"{t}: {len(items)} items")

    # the pages' excerpts: what live's search results show of a page (stage 5)
    if "--items" in sys.argv or not (OUT / "pages.json").exists():
        live_pages = all_of(session, "pages", {"lang": "en", "_fields": "id,slug,link,excerpt"})
        (OUT / "pages.json").write_text(json.dumps(live_pages, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # and their publication dates, which their heads print (stage 7; a page's date does not move)
    live_pages = json.loads((OUT / "pages.json").read_text(encoding="utf-8"))
    if any("date" not in p for p in live_pages):
        dates = {p["id"]: p for p in all_of(session, "pages", {"lang": "en", "_fields": "id,date,date_gmt"})}
        for p in live_pages:
            p.update({k: dates[int(p["id"])][k] for k in ("date", "date_gmt") if int(p["id"]) in dates})
        (OUT / "pages.json").write_text(json.dumps(live_pages, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"pages: {len(live_pages)} excerpts, {sum(1 for p in live_pages if 'date' in p)} dates")

    if "--items" in sys.argv or not (OUT / "categories.json").exists():
        cats = all_of(session, "categories", {"lang": "en"})
        cats = [{k: c[k] for k in ("id", "name", "slug", "description", "parent")} for c in cats]
        (OUT / "categories.json").write_text(json.dumps(cats, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"categories: {len(json.loads((OUT / 'categories.json').read_text(encoding='utf-8')))}")

    used, galleries = set(), set()
    for p in pages():
        html = (ROOT / f"{p['name']}.html").read_text(encoding="utf-8")
        used |= {int(n) for n in re.findall(r"\bwp-image-(\d+)\b", html)}
        galleries |= gallery_pictures(html)
    ids = sorted(featured | used | galleries)
    media = []
    for i in range(0, len(ids), 100):
        chunk = ids[i:i + 100]
        media += all_of(session, "media", {"include": ",".join(map(str, chunk)), "lang": "en"})
    found = {m["id"] for m in media}
    if len(found) < len(ids):
        # WPML answers per language; a picture uploaded on the Arabic side is found with lang=ar
        for i in range(0, len(ids), 100):
            chunk = [n for n in ids[i:i + 100] if n not in found]
            if chunk:
                media += all_of(session, "media", {"include": ",".join(map(str, chunk)), "lang": "ar"})
        found = {m["id"] for m in media}
    heads = head_pictures()
    known = set().union(*(record_paths(m) for m in media))
    for path in sorted(heads - known):
        stem = re.sub(r"-\d+x\d+$", "", path.rsplit("/", 1)[-1].rsplit(".", 1)[0])
        media += [m for m in get(session, "media", {"search": stem, "per_page": 20}).json() if path in record_paths(m)]
    found = {m["id"] for m in media}
    media = sorted(({k: m[k] for k in MEDIA_KEEP if k in m} for m in {m["id"]: m for m in media}.values()),
                   key=lambda m: m["id"])
    (OUT / "media.json").write_text(json.dumps(media, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    missing = sorted(set(ids) - found)
    unnamed = sorted(heads - set().union(*(record_paths(m) for m in media)))
    print(f"media: {len(media)} pictures: {len(ids) - len(missing)} of {len(ids)} by id ({len(featured)} featured, "
          f"{len(used)} in the pages, {len(galleries)} in their galleries), {len(heads)} named by the heads"
          + (f" ({len(unnamed)} not found: {unnamed})" if unnamed else "")
          + (f"; not answered: {missing}" if missing else ""))

    # The pages use some sizes of a picture; the Media Library shows all of them (the
    # thumbnail in the grid, the original when "full size" is chosen). The sizes the
    # reference lacks are fetched, except for the team members' pictures: no page shows a
    # team member.
    team = {it["featured_media"] for it in json.loads((OUT / "team_member.json").read_text(encoding="utf-8"))}
    fetched = size = 0
    for m in media:
        if m["id"] in team:
            continue
        base = m["source_url"].rsplit("/", 1)[0] + "/"
        rel_dir = unquote(urlsplit(base).path).split("/wp-content/uploads/", 1)[1]
        names = [m["media_details"].get("file", "").rsplit("/", 1)[-1]] + \
                [s["file"] for s in m["media_details"].get("sizes", {}).values()]
        for name in names:
            target = UPLOADS / rel_dir / name
            if not name or target.exists():
                continue
            r = session.get(base + quote(name), timeout=120)
            if r.status_code != 200:
                print(f"  {rel_dir}{name}: {r.status_code}")
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(r.content)
            fetched += 1
            size += len(r.content)
    print(f"sizes the reference lacked: {fetched} files fetched ({size / 1e6:.1f} MB) into assets/uploads/")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
