"""Stage 2: the items and pictures of the site, as data for the theme's installer.

Writes theme/install/items.json (every item WordPress needs: posts, news, projects, gallery
items, the job, business models, Harlow's people, testimonials, client logos) and
theme/install/media.json (every picture they and the pages use).

An item is what live's REST API says it is (_capture/rest/, from capture_items.py): id,
address, date, title, text, featured picture, category. What the API does not give is
read from the reference pages, where live shows it:
  - a business model's small icon and the page its card links to (the home carousel);
  - testimonials, which have no REST route: name, words, picture, position (About carousel);
  - client logos, which on live are ten pictures in one section: picture and order;
  - each item page's Arabic address and the documents whose page-wide rules it loads.

A picture is its REST media record (file, size, every size WordPress made), kept to the
files assets/uploads/ holds; the five testimonial pictures, which the API does not
answer, are described from their <img> in the reference.

Usage:
    python -u _tools/seed_items.py
"""

import html as htmllib
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

from lxml import html

from common import CAPTURE, ROOT, SITE, pages

REST = CAPTURE / "rest"
UPLOADS = ROOT / "assets" / "uploads"
OUT = ROOT / "theme" / "install"

# REST route -> WordPress post type
TYPES = {"posts": "post", "news": "news", "albahoo_project": "albahoo_project", "gallery_item": "gallery_item",
         "job": "job", "business_model": "business_model", "harlows_person": "harlows_person"}
CLIENTS_BLOCK = "//*[@data-elementor-type='container']"
WP_IMAGE = re.compile(r"\bwp-image-(\d+)\b")


def text(el):
    return " ".join("".join(el.itertext()).split())


def page_paths():
    return {p["name"]: p["path"] for p in pages()}


def path_of(href, names):
    """A reference link (`about-us.html`) as a live path (`/about-us/`)."""
    name = href.split("#", 1)[0][:-len(".html")]
    return names[name]


def single_facts(names):
    """Per item page of the reference: its Arabic address and its stylesheet documents."""
    css_map = json.loads((ROOT / "_vocab" / "css_map.json").read_text(encoding="utf-8"))
    out = {}
    for name, path in names.items():
        if name == "404":
            continue
        doc = html.parse(str(ROOT / f"{name}.html"))
        lang = doc.xpath("//header//a[starts-with(@title, 'Switch to')]/@href")
        out[path] = {"translations": {"ar": lang[0]} if lang else {},
                     "documents": [d for d in css_map.get(name, [])
                                   if (ROOT / "assets" / "css" / "design" / f"globals-{d}.css").exists()]}
    return out


def media_record(m):
    """A REST media record, kept to what the installer needs and to files that are here."""
    rel = unquote(urlsplit(m["source_url"]).path).split("/wp-content/uploads/", 1)[1]
    folder = rel.rsplit("/", 1)[0]
    details = m.get("media_details", {})
    sizes = {}
    for name, s in details.get("sizes", {}).items():
        if (UPLOADS / folder / s["file"]).exists():
            sizes[name] = {"file": s["file"], "width": s["width"], "height": s["height"], "mime-type": s["mime_type"]}
    return {
        "id": m["id"],
        "file": rel,
        "present": (UPLOADS / rel).exists(),
        "mime": m["mime_type"],
        "width": details.get("width"),
        "height": details.get("height"),
        "title": htmllib.unescape(m["title"]["rendered"]),
        "alt": m.get("alt_text", ""),
        "date": m["date"],
        "sizes": sizes,
    }


def img_record(img):
    """A picture the REST API does not answer, described from its <img> in the reference."""
    src = img.get("src")
    rel = unquote(src).split("assets/uploads/", 1)[1]
    name = rel.rsplit("/", 1)[1].rsplit(".", 1)[0]
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "svg": "image/svg+xml",
            "webp": "image/webp"}[rel.rsplit(".", 1)[1].lower()]
    return {"id": int(WP_IMAGE.search(img.get("class")).group(1)), "file": rel, "present": (UPLOADS / rel).exists(),
            "mime": mime, "width": int(img.get("width")), "height": int(img.get("height")), "title": name,
            "alt": img.get("alt", ""), "date": rel[:7].replace("/", "-") + "-01T00:00:00", "sizes": {}}


def main():
    names = page_paths()
    singles = single_facts(names)
    cats = {c["id"]: c for c in json.loads((REST / "categories.json").read_text(encoding="utf-8"))}
    media = {m["id"]: m for m in json.loads((REST / "media.json").read_text(encoding="utf-8"))}
    home = html.parse(str(ROOT / "index.html"))
    about = html.parse(str(ROOT / "about-us.html"))

    # business models: the icon and the page each card links to, from the home carousel
    model_extra = {}
    for it in home.xpath("//*[@data-id='bb14510']//*[contains(concat(' ', @class, ' '), ' e-loop-item ')]"):
        pid = int(re.search(r"e-loop-item-(\d+)", it.get("class")).group(1))
        imgs = it.xpath(".//img")
        model_extra[pid] = {"icon": int(WP_IMAGE.search(imgs[1].get("class")).group(1)),
                            "link": path_of(it.xpath(".//a/@href")[0], names)}

    items, used_media = [], set()
    for route, post_type in TYPES.items():
        for r in json.loads((REST / f"{route}.json").read_text(encoding="utf-8")):
            path = unquote(urlsplit(r["link"]).path)
            item = {
                "type": post_type,
                "live_id": r["id"],
                "slug": unquote(r["slug"]),
                "title": htmllib.unescape(r["title"]["rendered"]),
                "date": r["date"],
                "date_gmt": r["date_gmt"],
                "content": r.get("content", {}).get("rendered", ""),
                "featured": r.get("featured_media") or 0,
                "categories": [{"slug": cats[c]["slug"], "name": cats[c]["name"]} for c in r.get("categories", [])],
                "path": path,
            }
            item.update(singles.get(path, {"translations": {}, "documents": []}))
            if post_type == "business_model":
                item["meta"] = {"harlow_icon": model_extra[r["id"]]["icon"], "harlow_link": model_extra[r["id"]]["link"]}
                used_media.add(item["meta"]["harlow_icon"])
            used_media.add(item["featured"])
            items.append(item)

    # testimonials: no REST route; read from the About carousel, newest first there
    extra_media = {}
    slides = about.xpath("//*[@data-id='b193185']//*[contains(concat(' ', @class, ' '), ' e-loop-item ')]")
    for n, it in enumerate(slides):
        pid = int(re.search(r"e-loop-item-(\d+)", it.get("class")).group(1))
        heads = it.xpath(".//h2")
        quote = it.xpath(".//*[@data-id='326b2d6']//p")
        img = it.xpath(".//img")[0]
        rec = img_record(img)
        extra_media[rec["id"]] = rec
        items.append({
            "type": "testimonial", "live_id": pid, "slug": re.sub(r"[^a-z0-9]+", "-", text(heads[0]).lower()).strip("-"),
            "title": text(heads[0]),
            # no dates on live: one minute apart, so that newest first is the carousel's order
            "date": f"2024-06-03T10:{len(slides) - n:02d}:00", "date_gmt": f"2024-06-03T10:{len(slides) - n:02d}:00",
            "content": "".join(f"<p>{htmllib.escape(text(q), quote=False)}</p>" for q in quote),
            "featured": rec["id"], "categories": [], "path": "", "translations": {}, "documents": [],
            "meta": {"harlow_position": text(heads[-1])},
        })

    # client logos: ten pictures in one section on live, in that order
    block = home.xpath(CLIENTS_BLOCK)[0]
    for n, w in enumerate(block.xpath(".//*[@data-widget_type='image.default']")):
        img = w.xpath(".//img")[0]
        mid = int(WP_IMAGE.search(img.get("class")).group(1))
        used_media.add(mid)
        items.append({
            "type": "client_logo", "live_id": 0, "slug": "", "title": media[mid]["title"]["rendered"] if mid in media else f"logo-{n + 1}",
            "date": f"2024-05-20T10:{n:02d}:00", "date_gmt": f"2024-05-20T10:{n:02d}:00", "content": "",
            "featured": mid, "categories": [], "path": "", "translations": {}, "documents": [],
            "menu_order": n + 1, "meta": {"harlow_element": w.get("data-id")},
        })

    # every picture of the pages, too: the installer puts them all in the Media Library
    for p in pages():
        used_media |= {int(n) for n in WP_IMAGE.findall((ROOT / f"{p['name']}.html").read_text(encoding="utf-8"))}
    used_media.discard(0)
    records = []
    for mid in sorted(used_media):
        if mid in media:
            records.append(media_record(media[mid]))
        elif mid in extra_media:
            records.append(extra_media[mid])
    for rec in extra_media.values():
        if rec["id"] not in used_media:
            records.append(rec)
    records.sort(key=lambda r: r["id"])
    unknown = sorted(used_media - {r["id"] for r in records})

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "items.json").write_text(json.dumps({"source": f"live REST API of {SITE} and the reference pages",
                                                "items": items}, ensure_ascii=False, indent=1) + "\n",
                                    encoding="utf-8", newline="\n")
    (OUT / "media.json").write_text(json.dumps({"source": f"live REST API of {SITE}, files in assets/uploads/",
                                                "media": records}, ensure_ascii=False, indent=1) + "\n",
                                    encoding="utf-8", newline="\n")
    counts = {}
    for it in items:
        counts[it["type"]] = counts.get(it["type"], 0) + 1
    absent = [r["file"] for r in records if not r["present"]]
    print(f"{len(items)} items ({', '.join(f'{k} {v}' for k, v in counts.items())}) -> theme/install/items.json")
    print(f"{len(records)} pictures ({sum(len(r['sizes']) for r in records)} sizes) -> theme/install/media.json; "
          f"{len(absent)} originals not here: {absent[:4]}; {len(unknown)} unknown: {unknown}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
