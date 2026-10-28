"""Stage 1: the site's data file, theme/install/site.json, read from the reference.

What the theme's installer (`wp harlow install`) lays down in WordPress:
  - the pages that are WordPress pages on live, as empty pages for now (their sections
    arrive in stage 3): title, address, live's id, the address of their Arabic version,
    and the Elementor documents whose page-wide rules the page loads (design/globals-*.css,
    in the reference's order, from _vocab/css_map.json);
  - which page is the front page and which the privacy page;
  - the menus: the header menu and the four footer menus, item by item, with live's ids,
    labels, and what each item points at (a page by its name, or a typed address).

Read from html-v1's own pages, so the data and the reference cannot disagree: the menus
from a page where nothing in them is current (sitemap.html), each page's Arabic address
from its own language link. Page titles and ids come from live's REST answers recorded by
the inventory (`_inventory/pages.json`).

Usage:
    python -u _tools/seed_site.py
"""

import html as htmllib
import json
import re
import sys

from lxml import html

from common import ROOT, SITE, pages

OUT = ROOT / "theme" / "install" / "site.json"
MENU_SOURCE = "sitemap"   # a page on which no item of any menu is current

# Where each menu goes, found by the Elementor widget that prints it on live. The footer
# columns take their heading from the menu's name, so the name is the heading on live.
HEADER_MENU = "f08025a"
FOOTER_MENUS = [("footer-1", "826082a", "bf1c55b"), ("footer-2", "89c99db", "dea2ac7"),
                ("footer-3", "793f866", "6134bc2")]
LEGAL_LIST = "1992681"    # the icon list of links under the footer
LIVE_ID = re.compile(r"^menu-item-(\d+)$")


def page_names():
    """Reference file name -> its live path, for the pages in scope."""
    return {p["name"]: p["path"] for p in pages()}


def target(href, names):
    """A link of the reference as menu data: a page by its name, or a typed address."""
    if href == "#":
        return {"url": "#"}
    if href.startswith(("http://", "https://")):
        return {"url": href}
    file, _, fragment = href.partition("#")
    name = file[:-len(".html")]
    if name not in names:
        raise SystemExit(f"menu link to a page outside the reference: {href}")
    return {"path": names[name] + (f"#{fragment}" if fragment else "")}


def menu_items(ul, names):
    out = []
    for li in ul.findall("li"):
        a = li.find("a")
        cls = li.get("class", "").split()
        if "wpml-ls-menu-item" in cls:
            continue   # the language link is the theme's own, not a menu item (see site.json "language")
        ids = [int(m.group(1)) for c in cls for m in [LIVE_ID.match(c)] if m]
        item = {"live_id": ids[0], "title": " ".join(a.text_content().split())}
        if "menu-item-type-post_type" in cls:
            item["page"] = target(a.get("href"), names)["path"]
        elif "menu-item-type-custom" in cls:
            item.update(target(a.get("href"), names))
        else:
            raise SystemExit(f"menu item of an unknown kind: {cls}")
        sub = li.find("ul")
        if sub is not None:
            item["children"] = menu_items(sub, names)
        out.append(item)
    return out


def main():
    names = page_names()
    doc = html.parse(str(ROOT / f"{MENU_SOURCE}.html"))
    by_path = {p["path"]: p for p in json.loads((ROOT / "_inventory" / "pages.json").read_text(encoding="utf-8"))}

    css_map = json.loads((ROOT / "_vocab" / "css_map.json").read_text(encoding="utf-8"))
    site_pages = []
    for p in pages():
        rec = by_path.get(p["path"], {})
        if rec.get("rest_type") != "page":
            continue   # posts and items are stage 2; the 404 and the pager are not pages
        ref = html.parse(str(ROOT / f"{p['name']}.html"))
        lang = ref.xpath("//header//a[starts-with(@title, 'Switch to')]/@href")
        site_pages.append({
            "name": p["name"],
            "path": p["path"],
            "title": htmllib.unescape(rec["rest_title"]),
            "live_id": rec["wp_id"],
            "translations": {"ar": lang[0]},
            "documents": [d for d in css_map[p["name"]] if (ROOT / "assets" / "css" / "design" / f"globals-{d}.css").exists()],
        })

    menus = []
    ul = doc.xpath(f"//ul[@id='menu-1-{HEADER_MENU}']")[0]
    menus.append({"location": "primary", "name": "Main menu", "items": menu_items(ul, names)})
    for location, widget, heading in FOOTER_MENUS:
        ul = doc.xpath(f"//ul[@id='menu-1-{widget}']")[0]
        title = doc.xpath(f"//*[@data-id='{heading}']//h3")[0].text_content().strip()
        menus.append({"location": location, "name": title, "items": menu_items(ul, names)})
    legal = []
    for a in doc.xpath(f"//*[@data-id='{LEGAL_LIST}']//li/a"):
        legal.append({"title": " ".join(a.text_content().split()), "page": target(a.get("href"), names)["path"]})
    menus.append({"location": "footer-legal", "name": "Footer links", "items": legal})

    lang_li = doc.xpath("//ul[@id='menu-1-f08025a']/li[contains(@class, 'wpml-ls-menu-item')]")[0]
    data = {
        "source": "html-v1.1 reference pages; live ids and titles from the inventory of " + SITE,
        "front_page": "/",
        "privacy_page": "/policy/",
        "pages": site_pages,
        "menus": menus,
        "language": {
            "label": lang_li.find("a").text_content().strip(),
            "code": "ar",
            "home": SITE + "/ar/",
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    n_items = sum(1 for m in menus for _ in walk(m["items"]))
    print(f"{len(site_pages)} pages and {len(menus)} menus ({n_items} items) -> {OUT.relative_to(ROOT)}")


def walk(items):
    for it in items:
        yield it
        yield from walk(it.get("children", []))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
