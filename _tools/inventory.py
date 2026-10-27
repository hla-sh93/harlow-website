"""Stage A inventory: every public URL of the live site, its status and its structure.

Seeds come from the sitemaps and the REST API (both WPML languages); every internal link
found on a fetched page is crawled too. Nothing follows redirects on its own, so each
redirect and 404 is recorded where it happens.

Usage:
    python -u _tools/inventory.py <raw_html_dir>

Writes _inventory/pages.json and _inventory/urls.csv. Raw HTML is kept in <raw_html_dir>.
"""

import csv
import hashlib
import json
import re
import sys
import time
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit

import requests
from lxml import html as lxml_html

SITE = "https://www.harlowgroup.com/"
HOST = urlsplit(SITE).netloc
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
REST_TYPES = [
    "pages", "posts", "news", "albahoo_project", "business_model", "gallery_item",
    "harlows_person", "job", "team_member",
]
LANG_PREFIXES = ["", "ar/"]
ASSET_EXT = re.compile(
    r"\.(jpe?g|png|gif|webp|svg|avif|ico|pdf|docx?|xlsx?|zip|mp4|webm|mp3|css|js|"
    r"woff2?|ttf|eot|xml|json|txt)$",
    re.I,
)
SKIP_PATHS = ("/wp-admin", "/wp-json", "/wp-content", "/wp-includes", "/xmlrpc.php",
              "/feed", "/comments/feed", "/wp-login.php", "/cdn-cgi/")
MAX_URLS = 800
DELAY = 0.25

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_inventory"


def norm(url):
    """Absolute https://www form without fragment or tracking query, used as the key.

    Live content links to the bare host and carries `?utm_source=…` on some internal
    links; both would otherwise count one page twice.
    """
    parts = urlsplit(url)
    path = parts.path or "/"
    # one canonical spelling for percent-escapes: decode then let requests re-encode
    path = requests.utils.requote_uri(unquote(path))
    query = "&".join(q for q in parts.query.split("&") if q and not q.startswith("utm_"))
    return urlunsplit(("https", HOST, path, query, ""))


def is_internal(url):
    p = urlsplit(url)
    return p.scheme in ("http", "https") and p.netloc.lower() in (HOST, HOST.replace("www.", ""))


def crawlable(url):
    p = urlsplit(url)
    if not is_internal(url):
        return False
    if any(p.path.startswith(s) for s in SKIP_PATHS) or p.path.endswith("/feed/"):
        return False
    if ASSET_EXT.search(p.path):
        return False
    return True


def get(session, url, **kw):
    for attempt in range(3):
        try:
            return session.get(url, timeout=40, **kw)
        except requests.RequestException as err:
            print(f"  retry {attempt + 1} {url}: {err}")
            time.sleep(2 + attempt * 3)
    return None


def rest_seeds(session):
    seeds = {}
    for prefix in LANG_PREFIXES:
        for rtype in REST_TYPES:
            page = 1
            while True:
                r = get(session, f"{SITE}{prefix}wp-json/wp/v2/{rtype}", params={
                    "per_page": 100, "page": page,
                    "_fields": "id,slug,link,type,template,status,date,modified,title",
                })
                if r is None or not r.ok:
                    break
                for item in r.json():
                    seeds[norm(item["link"])] = {
                        "rest_type": item.get("type"),
                        "wp_id": item.get("id"),
                        "template": item.get("template") or "",
                        "rest_title": (item.get("title") or {}).get("rendered", ""),
                        "modified": item.get("modified", ""),
                    }
                if page >= int(r.headers.get("X-WP-TotalPages", "1")):
                    break
                page += 1
            time.sleep(DELAY)
    return seeds


def sitemap_seeds(session):
    urls = []
    r = get(session, SITE + "sitemap_index.xml")
    maps = re.findall(r"<loc>([^<]+)</loc>", r.text) if r is not None else []
    for m in maps:
        r = get(session, m)
        if r is None:
            continue
        for loc in re.findall(r"<url>\s*<loc>([^<]+)</loc>", r.text):
            urls.append((norm(loc), urlsplit(m).path.strip("/")))
    return urls


def text(nodes):
    return " ".join(" ".join(n.text_content().split()) for n in nodes).strip()


MAIN_DOC_TYPES = ("wp-page", "wp-post", "single-post", "single-page", "single", "archive")


def section_shape(el):
    """What one top-level block is made of: enough to group blocks into archetypes."""
    widgets = sorted({w.get("data-widget_type").rsplit(".", 1)[0]
                      for w in el.xpath(".//*[@data-widget_type]")})
    settings = el.get("data-settings", "")
    bg = [k for k, pat in (("video", "background_video_link"),
                           ("slideshow", "background_slideshow_gallery"),
                           ("motion", "motion_fx"), ("sticky", "sticky"))
          if pat in settings]
    if "background-image" in (el.get("style") or "") or el.xpath(
            "./*[contains(@class,'elementor-background-overlay')]"):
        bg.append("bg")
    return {
        "anchor": el.get("id", ""),
        "classes": " ".join(c for c in el.get("class", "").split()
                            if not c.startswith(("elementor-", "e-", "e-con")) and c not in (
                                "elementor-element", "e-flex", "e-con", "e-parent",
                                "e-lazyloaded", "e-con-full", "e-con-boxed", "e-child")),
        "widgets": widgets,
        "headings": len(el.xpath(".//*[@data-widget_type='heading.default']")),
        "images": len(el.xpath(".//img")),
        "children": len(el.xpath("./*[@data-element_type]|./*/*[@data-element_type]")),
        "bg": bg,
    }


def sections(doc):
    """Top-level blocks of the page's own content (one level down if it is one wrapper)."""
    for d in doc.xpath("//*[@data-elementor-type][@data-elementor-id]"):
        if d.get("data-elementor-type") not in MAIN_DOC_TYPES:
            continue
        top = d.xpath("./*[@data-element_type]")
        if len(top) == 1:
            inner = top[0].xpath("./*[@data-element_type]|./div[contains(@class,'e-con-inner')]"
                                 "/*[@data-element_type]")
            if len(inner) > 1:
                top = inner
        return [section_shape(e) for e in top]
    return []


def analyse(url, body):
    doc = lxml_html.fromstring(body)
    out = {}
    html_el = doc.getroottree().getroot()
    out["lang"] = html_el.get("lang", "")
    out["dir"] = html_el.get("dir", "")
    out["title"] = text(doc.xpath("//head/title"))
    out["meta_description"] = (doc.xpath("//meta[@name='description']/@content") or [""])[0]
    out["canonical"] = (doc.xpath("//link[@rel='canonical']/@href") or [""])[0]
    out["robots"] = (doc.xpath("//meta[@name='robots']/@content") or [""])[0]
    out["hreflang"] = {
        a.get("hreflang"): unquote(a.get("href", ""))
        for a in doc.xpath("//link[@rel='alternate'][@hreflang]")
    }
    body_el = (doc.xpath("//body") or [None])[0]
    classes = (body_el.get("class", "") if body_el is not None else "").split()
    out["body_classes"] = classes
    out["page_template"] = next((c for c in classes if c.startswith("page-template-")), "")
    out["wp_kind"] = next((c for c in classes if c in (
        "home", "page", "single", "archive", "blog", "search", "error404",
        "post-type-archive", "tax", "category", "tag")), "")
    out["single_type"] = next((c[len("single-"):] for c in classes
                               if c.startswith("single-") and c != "single-format-standard"), "")
    out["archive_type"] = next((c[len("post-type-archive-"):] for c in classes
                                if c.startswith("post-type-archive-")), "")
    ids = [c for c in classes if re.match(r"^(page-id|postid)-\d+$", c)]
    out["body_id"] = ids[0] if ids else ""

    # Elementor documents on the page: main content plus theme-builder parts
    docs = []
    for d in doc.xpath("//*[@data-elementor-type][@data-elementor-id]"):
        top = d.xpath("./*[@data-element_type]")
        docs.append({
            "type": d.get("data-elementor-type"),
            "id": d.get("data-elementor-id"),
            "post_type": d.get("data-elementor-post-type", ""),
            "top_level": len(top),
            "top_types": dict(Counter(e.get("data-element_type") for e in top)),
        })
    out["elementor_docs"] = docs
    out["sections"] = sections(doc)
    out["tracking_links"] = sorted({a.get("href") for a in doc.xpath("//a[@href]")
                                    if "utm_" in a.get("href")})
    out["bare_host_links"] = len([a for a in doc.xpath("//a[@href]")
                                  if urlsplit(a.get("href")).netloc == HOST.replace("www.", "")])
    widgets = Counter()
    for w in doc.xpath("//*[@data-widget_type]"):
        widgets[w.get("data-widget_type").rsplit(".", 1)[0]] += 1
    out["widgets"] = dict(widgets.most_common())
    out["element_types"] = dict(Counter(
        e.get("data-element_type") for e in doc.xpath("//*[@data-element_type]")))

    forms = []
    for f in doc.xpath("//form"):
        forms.append({
            "id": f.get("id", ""),
            "class": f.get("class", ""),
            "name": f.get("name", "") or f.get("aria-label", ""),
            "action": f.get("action", ""),
            "method": f.get("method", ""),
            "fields": [
                {"tag": i.tag, "type": i.get("type", ""), "name": i.get("name", ""),
                 "required": i.get("required") is not None}
                for i in f.xpath(".//input|.//select|.//textarea")
                if i.get("type") not in ("hidden",)
            ],
            "hidden": [i.get("name", "") for i in f.xpath(".//input[@type='hidden']")],
            "turnstile": bool(f.xpath(".//*[contains(@class,'cf-turnstile')]")),
        })
    out["forms"] = forms
    out["iframes"] = sorted({i.get("src") or i.get("data-src") or "" for i in doc.xpath("//iframe")})
    out["videos"] = len(doc.xpath("//video")) + len(
        doc.xpath("//*[contains(@data-settings,'video')]"))
    out["images"] = len(doc.xpath("//img"))
    out["bg_images"] = len(re.findall(r"background-image\s*:\s*url\(", body))
    out["lazy_markers"] = sorted({m for m in re.findall(
        r"data-(lazy-src|lazy-srcset|wpr-lazyrender|src|bg|ll-status)\b", body)})
    out["scripts"] = sorted({urlsplit(urljoin(url, s)).netloc + urlsplit(urljoin(url, s)).path
                             for s in doc.xpath("//script/@src")})
    out["styles"] = sorted({urlsplit(urljoin(url, s)).netloc + urlsplit(urljoin(url, s)).path
                            for s in doc.xpath("//link[@rel='stylesheet']/@href")})
    out["inline_styles"] = len(doc.xpath("//style"))
    out["google_fonts"] = sorted(set(re.findall(r"family=([A-Za-z0-9+]+)", body)))
    out["word_count"] = len(text(doc.xpath("//body")).split())

    links, assets = set(), set()
    for a in doc.xpath("//a[@href]"):
        href = a.get("href").strip()
        if href.startswith(("mailto:", "tel:", "javascript:", "#", "whatsapp:")):
            continue
        absu = urljoin(url, href)
        if not is_internal(absu):
            continue
        if crawlable(absu):
            links.add(norm(absu))
        else:
            assets.add(unquote(absu))
    out["internal_links"] = sorted(links)
    out["linked_files"] = sorted(assets)
    out["external_links"] = sorted({urlsplit(urljoin(url, a.get("href"))).netloc
                                    for a in doc.xpath("//a[@href]")
                                    if urljoin(url, a.get("href")).startswith("http")
                                    and not is_internal(urljoin(url, a.get("href")))})
    out["has_lorem"] = bool(re.search(r"lorem ipsum", body, re.I))
    return out


def main():
    raw_dir = Path(sys.argv[1])
    raw_dir.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(exist_ok=True)
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language": "en,ar;q=0.8"})

    print("sitemaps…")
    sm = sitemap_seeds(s)
    print(f"  {len(sm)} sitemap urls")
    print("rest api…")
    rest = rest_seeds(s)
    print(f"  {len(rest)} rest urls")

    records = {}
    queue = []

    def enqueue(u, source):
        if u not in records:
            records[u] = {"url": u, "path": unquote(urlsplit(u).path), "sources": [source]}
            queue.append(u)
        elif source not in records[u]["sources"]:
            records[u]["sources"].append(source)

    enqueue(norm(SITE), "seed")
    # the 404 template is a page of its own; ask for it in both languages
    enqueue(norm(SITE + "page-that-does-not-exist-404-probe/"), "probe")
    enqueue(norm(SITE + "ar/page-that-does-not-exist-404-probe/"), "probe")
    for u, m in sm:
        enqueue(u, m)
    for u, meta in rest.items():
        enqueue(u, "rest:" + (meta["rest_type"] or ""))
        records[u].update(meta)

    i = 0
    while i < len(queue) and i < MAX_URLS:
        u = queue[i]
        i += 1
        rec = records[u]
        r = get(s, u, allow_redirects=False)
        time.sleep(DELAY)
        if r is None:
            rec["status"] = "error"
            continue
        rec["status"] = r.status_code
        print(f"{i:4} {r.status_code} {rec['path'][:90]}")
        if 300 <= r.status_code < 400:
            target = norm(urljoin(u, r.headers.get("Location", "")))
            rec["redirect_to"] = unquote(target)
            if crawlable(target):
                enqueue(target, "redirect")
            continue
        if r.status_code not in (200, 404) or "text/html" not in r.headers.get("Content-Type", ""):
            continue
        body = r.text
        name = hashlib.sha1(u.encode()).hexdigest()[:12] + ".html"
        (raw_dir / name).write_text(body, encoding="utf-8")
        rec["raw_file"] = name
        rec["bytes"] = len(r.content)
        rec.update(analyse(u, body))
        for link in rec["internal_links"]:
            enqueue(link, "link")

    (OUT / "pages.json").write_text(
        json.dumps(list(records.values()), ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(records)} urls known, {i} fetched, "
          f"{sum(1 for r in records.values() if r.get('status') == 200)} answered 200")


if __name__ == "__main__":
    main()
