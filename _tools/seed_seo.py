"""Stage 7: each page's SEO and the site's, read from live's heads, for Rank Math.

Live's pages carry Rank Math's head (title, description, robots, canonical, the social
tags, the schema graph) in their captured server HTML (_capture/raw/). What a page's
head says that Rank Math would not say by itself is that page's own Rank Math field; what
every page's head says alike is a site setting. Written to theme/install/seo.json:

* site: the organization (name, logo, address, map position, e-mail, telephone, social
  profiles), the website's name, the facebook page, which page is the about page and which
  the contact page, the robots every page says, and that pages carry no article schema.
* pages: per page and item (by its reference name): its title where it is not
  "<title> - <site name>", its description, its social picture where it is not the one
  Rank Math finds by itself (an item's featured picture, a page's first picture: the
  schema's primary image, or the first picture of the page's document in the reference;
  theme/functions/seo.php hands Rank Math the same), its schema nodes of its own (the
  business pages' and the blog's Service), its focus keywords where the head shows them
  (a post's article schema lists them; Rank Math writes the first as a social picture's
  alt when the picture has none), and its dates as live gives them (published: the
  schema's or live's API's; modified: the head's), which its head prints.

What the heads do not show is not here: a page's focus keywords when it has no article
schema and a picture with an alt of its own.

Usage:
    python -u _tools/seed_seo.py
"""

import html as htmllib
import json
import sys
from collections import OrderedDict
from datetime import datetime, timezone
from urllib.parse import unquote, urlsplit

import html5lib

from common import CAPTURE, ROOT, pages

OUT = ROOT / "theme" / "install" / "seo.json"
SITE_NAME = "Harlow Group"
# Nodes Rank Math builds from the site's settings and the page itself; any other is the page's own.
BUILT = {"Place", "Organization", "WebSite", "ImageObject", "WebPage", "AboutPage", "ContactPage", "Person",
         "BlogPosting", "Article", "NewsArticle"}


def upload_path(url):
    return unquote(urlsplit(url).path).split("/wp-content/uploads/", 1)[-1] if "/wp-content/uploads/" in url else ""


def head_of(name):
    raw = CAPTURE / "raw" / f"{name}.html"
    return raw.read_text(encoding="utf-8").split("</head>", 1)[0] if raw.exists() else ""


def tags(head):
    """The Rank Math block of a head: {key: [values]} and its schema graph."""
    a = head.find("<!-- Search Engine Optimization by Rank Math")
    b = head.find("<!-- /Rank Math")
    doc = html5lib.parse("<html><head>" + head[a:b] + "</head></html>", treebuilder="lxml",
                         namespaceHTMLElements=False)
    out, graph = OrderedDict(), []
    for el in doc.xpath("//head/*"):
        if el.tag == "title":
            out.setdefault("title", []).append(el.text or "")
        elif el.tag == "meta":
            out.setdefault(el.get("name") or el.get("property"), []).append(el.get("content"))
        elif el.tag == "link":
            out.setdefault("link:" + el.get("rel"), []).append(el.get("href"))
        elif el.tag == "script":
            graph = json.loads(el.text)["@graph"]
    return out, graph


def local_time(stamp):
    """Live's ISO time ('2025-01-29T07:44:30+03:00') as WordPress stores it: local and GMT."""
    when = datetime.fromisoformat(stamp)
    return when.strftime("%Y-%m-%d %H:%M:%S"), when.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def first_picture(name):
    """The first picture of a page's own document in the reference (a list's cards left
    out), as a path under uploads/: what Rank Math finds first in Elementor's copy of it."""
    doc = html5lib.parse((ROOT / f"{name}.html").read_text(encoding="utf-8"), treebuilder="lxml",
                         namespaceHTMLElements=False)
    holder = doc.xpath("//body/*[@data-elementor-type='wp-page']")
    for img in holder[0].iter("img") if holder else []:
        if not img.xpath("ancestor::*[contains(concat(' ', @class, ' '), ' elementor-loop-container ')]"):
            src = img.get("src", "")
            return src.split("assets/uploads/", 1)[-1] if "assets/uploads/" in src else ""
    return ""


def own_nodes(graph):
    nodes = []
    for node in graph:
        types = node["@type"] if isinstance(node["@type"], list) else [node["@type"]]
        if set(types) & BUILT:
            continue
        node = {k: v for k, v in node.items() if k not in ("@id", "mainEntityOfPage")}
        nodes.append(json.loads(htmllib.unescape(json.dumps(node, ensure_ascii=False))))
    return nodes


def main():
    site = json.loads((ROOT / "theme" / "install" / "site.json").read_text(encoding="utf-8"))
    items = json.loads((ROOT / "theme" / "install" / "items.json").read_text(encoding="utf-8"))["items"]
    media = json.loads((ROOT / "theme" / "install" / "media.json").read_text(encoding="utf-8"))["media"]
    files = {}
    for m in media:
        base = m["file"].rsplit("/", 1)[0] + "/"
        files[m["file"]] = m["id"]
        for size in m["sizes"].values() if isinstance(m["sizes"], dict) else m["sizes"]:
            files[base + (size["file"] if isinstance(size, dict) else size)] = m["id"]
    titles = {p["name"]: p["title"] for p in site["pages"]}
    titles.update({i["name"]: htmllib.unescape(i["title"]) for i in items if i.get("name")})
    featured = {i["name"]: i["featured"] for i in items if i.get("name")}
    alts = {m["id"]: m["alt"] for m in media}
    rest_pages = {int(p["id"]): p for p in json.loads((CAPTURE / "rest" / "pages.json").read_text(encoding="utf-8"))}
    live_ids = {p["name"]: int(p["live_id"]) for p in site["pages"]}

    out_pages, robots, publishers, roles, counts = OrderedDict(), set(), set(), {}, OrderedDict()
    organization = place = website = None
    for page in pages():
        name = page["name"]
        head = head_of(name)
        if name == "404" or not head:
            continue
        t, graph = tags(head)
        entry = OrderedDict()
        title = t["title"][0]
        if title != f"{titles.get(name, '')} - {SITE_NAME}":
            entry["title"] = title
        if t.get("description"):
            entry["description"] = t["description"][0]
        webpage = next((n for n in graph if n["@type"] in ("WebPage", "AboutPage", "ContactPage")), None)
        primary = upload_path((webpage or {}).get("primaryImageOfPage", {}).get("@id", ""))
        found = featured.get(name) or files.get(primary or first_picture(name))
        image = upload_path(t.get("og:image", [""])[0])
        if image and files.get(image) != found:
            entry["image"] = {"id": files.get(image), "file": image}
        nodes = own_nodes(graph)
        if nodes:
            entry["schema"] = nodes
        shown = files.get(image) if image else found
        alt = t.get("og:image:alt", [""])[0]
        article = next((n for n in graph if n["@type"] in ("BlogPosting", "Article", "NewsArticle")), {})
        if article.get("keywords"):
            entry["focus"] = htmllib.unescape(article["keywords"])
        elif shown and not alts.get(shown) and alt and alt != titles.get(name):
            entry["focus"] = alt
        if webpage and webpage.get("datePublished"):
            entry["published"] = local_time(webpage["datePublished"])
        elif name in live_ids and "date" in rest_pages.get(live_ids[name], {}):
            rest = rest_pages[live_ids[name]]
            entry["published"] = [rest["date"].replace("T", " "), rest["date_gmt"].replace("T", " ")]
        if t.get("og:updated_time"):
            entry["modified"] = local_time(t["og:updated_time"][0])
        out_pages[name] = entry
        for key in entry:
            counts[key] = counts.get(key, 0) + 1
        robots.add(t["robots"][0])
        publishers |= set(t.get("article:publisher", []))
        if webpage and webpage["@type"] in ("AboutPage", "ContactPage"):
            roles[webpage["@type"]] = name
        for node in graph:
            organization = organization or (node if node["@type"] == "Organization" else None)
            place = place or (node if node["@type"] == "Place" else None)
            website = website or (node if node["@type"] == "WebSite" else None)

    if len(robots) != 1 or len(publishers) != 1:
        raise SystemExit(f"pages differ in robots {robots} or facebook page {publishers}")
    said = robots.pop().split(", ")
    unescape = lambda v: json.loads(htmllib.unescape(json.dumps(v, ensure_ascii=False)))  # noqa: E731
    org = unescape(organization)
    geo = place["geo"]
    phones = [{"type": p["contactType"], "number": p["telephone"]} for p in org.get("contactPoint", [])]
    data = OrderedDict(
        source="Rank Math's heads in live's server HTML (_capture/raw/), read by _tools/seed_seo.py",
        site=OrderedDict(
            name=org["name"],
            website_name=website["name"],
            logo=OrderedDict(id=files.get(upload_path(org["logo"]["url"])), file=upload_path(org["logo"]["url"])),
            email=org.get("email", ""),
            phones=phones,
            address={k: v for k, v in org["address"].items() if k != "@type"},
            geo=f"{geo['latitude']},{geo['longitude']}",
            facebook=publishers.pop(),
            profiles=[u for u in org.get("sameAs", []) if "facebook.com" not in u],
            about_page=roles.get("AboutPage", ""),
            contact_page=roles.get("ContactPage", ""),
            # Rank Math puts "follow" first when the setting holds only "index"
            robots=[r for r in said if r in ("index", "noindex", "nofollow")] if said[:2] == ["follow", "index"] else said[:2],
            page_schema="off",
        ),
        pages=out_pages,
    )
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    unknown = [n for n, e in out_pages.items() if "image" in e and e["image"]["id"] is None]
    print(f"seo: {len(out_pages)} pages and items ({', '.join(f'{k} {v}' for k, v in counts.items())}); "
          f"site: {data['site']['name']}, robots {data['site']['robots']}, about {data['site']['about_page']}, "
          f"contact {data['site']['contact_page']}, {len(data['site']['profiles']) + 1} social profiles "
          f"-> theme/install/seo.json; {len(unknown)} pictures not in media.json: {unknown}")
    return 1 if unknown else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
