"""Stage D/E pages: one plain HTML file per page, built from the captured server HTML.

For each page in scope:
  - the header, footer, "major clients" block, cookie bar and page-transition element come
    from ONE source (the home page) and are spliced in; only each page's own active-menu
    classes are carried over, and any other difference from the source is reported;
  - every Elementor runtime script, inline loader, analytics tag and plugin stylesheet is
    removed; the page loads the stylesheet set from build_css.py and the modules in
    assets/js/;
  - links to pages in scope point at the local files, images and files at assets/,
    Cloudflare-obfuscated emails become plain mailto: links;
  - data-settings keep only the keys the modules read (see KEEP_SETTINGS).

Usage:
    python -u _tools/build_pages.py [name ...]
"""

import json
import re
import sys
from copy import deepcopy
from urllib.parse import quote, unquote, urljoin, urlsplit

import html5lib
from lxml import etree
from lxml import html as lxml_html

from common import CAPTURE, ROOT, SITE, is_live, pages

CSS_LAYERS = ["tokens", "base", "layout", "components", "navigation", "modules"]
DESIGN_FILES = ["type", "space", "layout", "size", "surface", "effects", "misc"]
CSS_LAST = ["utilities", "animations"]
ID_CLASS = re.compile(r"^elementor-element-[0-9a-f]{7}$")
DESIGN_CLASSES, DYNAMIC, CSS_MAP = {}, [], {}   # loaded from _vocab/ by main()
JS_MODULES = ["header", "nav-menu", "reveal", "background-video", "carousel", "gallery",
              "accordion", "history-slider", "people-popup", "lightbox", "cookie-bar",
              "page-transition"]

KEEP_SETTINGS = re.compile(
    r"^(_?animation(_delay|_duration)?(_tablet|_mobile)?|"
    r"background_video_\w+|background_play_\w+|"
    r"slides_to_show(_tablet|_mobile)?|slides_to_scroll(_tablet|_mobile)?|autoplay|"
    r"autoplay_speed|pause_on_hover|pause_on_interaction|infinite|speed|arrows|pagination|dots|"
    r"image_spacing_custom(_tablet|_mobile)?|offset_sides|offset_width(_tablet|_mobile)?|"
    r"columns(_tablet|_mobile)?|gap(_tablet|_mobile)?|aspect_ratio|gallery_layout|link_to|"
    r"submenu_icon|layout|toggle|full_width)$"
)
RUNTIME_BODY_CLASSES = re.compile(r"^(e--ua-.*|gdpr-infobar-visible|elementor-default)$")
NAV_STATE = re.compile(r"^(current[-_].*|elementor-item-active|page_item|page-item-\d+|"
                       r"elementor-location-(header|footer))$")
# Per-page attributes WordPress and plugins set on the shared chrome: the active link,
# image loading hints by position on the page, and external-link rel/target (new tab on
# the home page only, as on live).
STATE_ATTRS = ("aria-current", "loading", "decoding", "fetchpriority", "rel", "target")


def is_lang_link(e):
    """The language switcher links to this page's own translation: per-page state."""
    return e.tag == "a" and (e.get("title", "").startswith("Switch to")
                             or "wpml-ls-link" in (e.get("class") or ""))

dropped_settings = {}


def parse(text):
    return html5lib.parse(text, treebuilder="lxml", namespaceHTMLElements=False)


XLINK = "{http://www.w3.org/1999/xlink}"
XML = "{http://www.w3.org/XML/1998/namespace}"


def plain_names(root):
    """html5lib puts inline SVG/MathML in their namespaces; lxml would print `ns0:svg`,
    which the browser does not draw. HTML wants bare names (`svg`, `xlink:href`)."""
    for el in root.iter():
        if not isinstance(el.tag, str):
            continue
        if el.tag.startswith("{"):
            el.tag = etree.QName(el).localname
        for name in [a for a in el.attrib if a.startswith("{")]:
            value = el.attrib.pop(name)
            if name.startswith(XLINK):
                el.set("xlink:" + name[len(XLINK):], value)
            elif name.startswith(XML):
                el.set("xml:" + name[len(XML):], value)
            else:
                el.set(etree.QName(name).localname, value)
    etree.cleanup_namespaces(root)


def known_pages():
    return {p["path"]: p["name"] for p in pages()}


def cf_decode(hexstr):
    key = int(hexstr[:2], 16)
    return "".join(chr(int(hexstr[i:i + 2], 16) ^ key) for i in range(2, len(hexstr), 2))


def local_url(url, known, base=SITE + "/"):
    """Rewrite one URL as this static site serves it."""
    if not url or url.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return url
    absu = urljoin(base, url.replace("://harlowgroup.com", "://www.harlowgroup.com"))
    if not is_live(absu):
        return url
    parts = urlsplit(absu)
    path = unquote(parts.path)
    if path.startswith("/cdn-cgi/l/email-protection"):
        return "mailto:" + cf_decode(parts.fragment) if parts.fragment else url
    if path.startswith("/wp-content/uploads/"):
        return "assets/uploads/" + quote(path[len("/wp-content/uploads/"):])
    if path.startswith("/wp-content/"):
        rel = path[len("/wp-content/"):]
        src, dest = ROOT / "_source" / path.lstrip("/"), ROOT / "assets" / "vendor" / rel
        if src.exists() and not dest.exists():   # plugin images in the markup (flags, logos)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(src.read_bytes())
        return "assets/vendor/" + quote(rel)
    p = path if path.endswith("/") else path + "/"
    if p in known:
        frag = ("#" + parts.fragment) if parts.fragment else ""
        return f"{known[p]}.html{frag}"
    return absu  # a live page outside v1 (the Arabic site): stays on live


def rewrite_srcset(value, known):
    out = []
    for cand in re.split(r",[ \t\n\r\f]+", value.strip()):
        bits = re.split(r"[ \t\n\r\f]+", cand.strip(), maxsplit=1)
        out.append(" ".join([local_url(bits[0], known)] + bits[1:]))
    return ", ".join(out)


def rewrite_style(value, known):
    return re.sub(r"url\(\s*(['\"]?)([^'\")]+)\1\s*\)",
                  lambda m: f"url('{local_url(m.group(2), known)}')", value)


def clean_settings(el):
    raw = el.get("data-settings")
    if raw is None:
        return
    try:
        data = json.loads(raw)
    except ValueError:
        return
    kept = {}
    for k, v in data.items():
        if v in ("", None, [], {}):
            continue
        if KEEP_SETTINGS.match(k):
            if k == "background_video_link":
                v = local_url(v, {})
            kept[k] = v
        else:
            dropped_settings[k] = dropped_settings.get(k, 0) + 1
    if kept:
        el.set("data-settings", json.dumps(kept, ensure_ascii=False, separators=(",", ":")))
    else:
        del el.attrib["data-settings"]


def chrome_parts(doc):
    """The shared pieces of one page, by role."""
    def one(xp):
        r = doc.xpath(xp)
        return r[0] if r else None
    return {
        "header": one("//header[@data-elementor-type='header']"),
        "footer": one("//footer[@data-elementor-type='footer']"),
        "clients": one("//*[@data-elementor-type='container']"),
        "cookie_bar": one("//*[@id='moove_gdpr_cookie_info_bar']"),
        "cookie_modal": one("//*[@id='moove_gdpr_cookie_modal']"),
        "transition": one("//e-page-transition"),
    }


def signature(el):
    """Tree text with nav-state classes removed: equal signatures mean equal chrome."""
    c = deepcopy(el)
    for e in c.iter():
        if not isinstance(e.tag, str):
            continue
        cls = e.get("class")
        if cls is not None:
            e.set("class", " ".join(x for x in cls.split() if not NAV_STATE.match(x)))
        for a in STATE_ATTRS:
            e.attrib.pop(a, None)
        if is_lang_link(e):
            e.attrib.pop("href", None)
    return re.sub(r"\s+", " ", etree.tostring(c, method="html", encoding="unicode"))


def transfer_state(source, own):
    """Copy the page's own class attributes onto the source chrome, element by element."""
    out = deepcopy(source)
    a, b = list(out.iter()), list(own.iter())
    if len(a) != len(b):
        return out, False
    for x, y in zip(a, b):
        if not isinstance(x.tag, str):
            continue
        for attr in ("class",) + STATE_ATTRS + (("href",) if is_lang_link(y) else ()):
            if y.get(attr) is None:
                x.attrib.pop(attr, None)
            else:
                x.set(attr, y.get(attr))
    return out, True


def build_head(old_head, title, name):
    head = etree.Element("head")
    etree.SubElement(head, "meta", charset="utf-8")
    etree.SubElement(head, "meta", name="viewport",
                     content="width=device-width, initial-scale=1")
    t = etree.SubElement(head, "title")
    t.text = title
    for el in old_head:
        if not isinstance(el.tag, str):
            continue
        if el.tag == "meta" and (el.get("name") in ("description", "robots") or
                                 (el.get("property") or "").startswith(("og:", "article:")) or
                                 (el.get("name") or "").startswith("twitter:")):
            head.append(deepcopy(el))
        elif el.tag == "link" and el.get("rel") in ("canonical", "icon", "apple-touch-icon",
                                                    "alternate") and el.get("type") not in (
                "application/rss+xml", "application/json+oembed", "text/xml+oembed",
                "application/json"):
            head.append(deepcopy(el))
        elif el.tag == "script" and el.get("type") == "application/ld+json":
            head.append(deepcopy(el))
    for layer in CSS_LAYERS:
        etree.SubElement(head, "link", rel="stylesheet", href=f"assets/css/{layer}.css")
    # the rules of each document that name no element, for the documents this page uses
    for doc in CSS_MAP.get(name, []):
        if (ROOT / "assets" / "css" / "design" / f"globals-{doc}.css").exists():
            etree.SubElement(head, "link", rel="stylesheet", href=f"assets/css/design/globals-{doc}.css")
    for d in DESIGN_FILES:
        etree.SubElement(head, "link", rel="stylesheet", href=f"assets/css/design/{d}.css")
    for layer in CSS_LAST:
        etree.SubElement(head, "link", rel="stylesheet", href=f"assets/css/{layer}.css")
    return head


def apply_design(body):
    """Elements wear the classes of their design (atomize.py) instead of an id class, and the
    backgrounds that belong to one post of a list are set on the element itself."""
    for el in body.iter():
        if not isinstance(el.tag, str) or not el.get("data-id"):
            continue
        keep = [c for c in (el.get("class") or "").split() if not ID_CLASS.match(c)]
        el.set("class", " ".join(keep + DESIGN_CLASSES.get(el.get("data-id"), [])))
    for rule in DYNAMIC:
        xp = (f".//*[contains(concat(' ', @class, ' '), ' e-loop-item-{rule['post']} ')]"
              f"//*[@data-id='{rule['id']}']")
        for el in body.xpath(xp):
            style = "".join(f"{p}: {v.replace('../../', 'assets/')}; " for p, v in rule["decls"])
            el.set("style", ((el.get("style") or "").rstrip("; ") + "; " if el.get("style") else "") + style.strip())


def build(item, source_chrome, known, report):
    raw = (CAPTURE / "raw" / f"{item['name']}.html").read_text(encoding="utf-8")
    doc = parse(raw)
    root = doc.getroot()
    head, body = root.find("head"), root.find("body")
    title = (head.findtext("title") or "").strip()

    # shared chrome from one source, the page's own nav state carried over
    own = chrome_parts(doc)
    issues = []
    for role, src in source_chrome.items():
        mine = own.get(role)
        if mine is None:
            continue  # this page has no such part on live either (404, gallery items)
        if src is None:
            issues.append(f"{role} not in source")
            continue
        if signature(src) != signature(mine):
            issues.append(f"{role} differs from source")
            continue
        new, ok = transfer_state(src, mine)
        if not ok:
            issues.append(f"{role} state not carried")
        mine.getparent().replace(mine, new)
    report[item["name"]] = issues

    # remove what this static site does not run
    for el in body.xpath(".//script | .//noscript | .//style | .//link | //comment()"
                         " | .//*[@id='wpadminbar']"):
        parent = el.getparent()
        if parent is None:
            continue
        if el.tail and el.tail.strip():
            prev = el.getprevious()
            if prev is not None:
                prev.tail = (prev.tail or "") + el.tail
            else:
                parent.text = (parent.text or "") + el.tail
        parent.remove(el)

    for el in body.iter():
        if not isinstance(el.tag, str):
            continue
        for attr in ("href", "src", "poster", "data-src", "action", "preloader-image-url", "data-thumbnail"):
            if el.get(attr):
                el.set(attr, local_url(el.get(attr), known))
        for attr in ("srcset", "data-srcset"):
            if el.get(attr):
                el.set(attr, rewrite_srcset(el.get(attr), known))
        if el.get("style"):
            el.set("style", rewrite_style(el.get("style"), known))
        if "__cf_email__" in (el.get("class") or "") and el.get("data-cfemail"):
            text = cf_decode(el.get("data-cfemail"))
            tail = el.tail
            parent = el.getparent()
            prev = el.getprevious()
            if prev is not None:
                prev.tail = (prev.tail or "") + text + (tail or "")
            else:
                parent.text = (parent.text or "") + text + (tail or "")
            parent.remove(el)
            continue
        cls = el.get("class")
        if cls and "e-lazyloaded" in cls:
            el.set("class", " ".join(c for c in cls.split() if c != "e-lazyloaded"))
        clean_settings(el)
    body.set("class", " ".join(c for c in body.get("class", "").split()
                               if not RUNTIME_BODY_CLASSES.match(c)))
    apply_design(body)

    # Contact Form 7: its script adds a spinner after the submit button on load. Turnstile
    # is not loaded in v1 (inventory decision 4); its widget's slot stays, empty, so the
    # form keeps the live layout (size in modules.css).
    for btn in body.xpath(".//input[contains(@class,'wpcf7-submit')]"):
        btn.set("class", btn.get("class") + " has-spinner")
        spinner = etree.Element("span", {"class": "wpcf7-spinner"})
        spinner.tail, btn.tail = btn.tail, None
        btn.addnext(spinner)
    for box in body.xpath(".//div[contains(concat(' ', @class, ' '), ' cf-turnstile ')]"):
        if not len(box):
            etree.SubElement(box, "div", {"class": "cf-turnstile-slot", "aria-hidden": "true"})

    # background videos: the source sets src from settings at run time; here it is markup
    for el in body.xpath(".//*[contains(@data-settings,'background_video_link')]"):
        link = json.loads(el.get("data-settings"))["background_video_link"]
        for v in el.xpath(".//video[contains(@class,'elementor-background-video-hosted')]"):
            v.set("src", link)

    new_head = build_head(head, title, item["name"])
    for el in new_head.iter():
        if isinstance(el.tag, str) and el.tag == "link" and el.get("rel") in ("icon", "apple-touch-icon"):
            el.set("href", local_url(el.get("href"), known))
    root.replace(head, new_head)
    for m in JS_MODULES:
        s = etree.SubElement(body, "script", src=f"assets/js/{m}.js")
        s.set("defer", "")
    plain_names(root)
    html = lxml_html.tostring(root, method="html", encoding="unicode", doctype="<!DOCTYPE html>")
    if "ns0:" in html or "xmlns:ns" in html:
        raise SystemExit(f"{item['name']}: namespaced markup left in the output")
    (ROOT / f"{item['name']}.html").write_text(html + "\n", encoding="utf-8")


def main(only):
    global DESIGN_CLASSES, DYNAMIC, CSS_MAP
    known = known_pages()
    CSS_MAP = json.loads((ROOT / "_vocab" / "css_map.json").read_text(encoding="utf-8"))
    DESIGN_CLASSES = json.loads((ROOT / "_vocab" / "element_classes.json").read_text(encoding="utf-8"))
    DYNAMIC = json.loads((ROOT / "_vocab" / "dynamic.json").read_text(encoding="utf-8"))
    home = parse((CAPTURE / "raw" / "index.html").read_text(encoding="utf-8"))
    source = chrome_parts(home)
    # the source chrome without the home page's own active state
    for part in source.values():
        if part is None:
            continue
        for e in part.iter():
            if isinstance(e.tag, str) and e.get("class"):
                e.set("class", " ".join(x for x in e.get("class").split() if not NAV_STATE.match(x)))
            if isinstance(e.tag, str):
                for a in STATE_ATTRS:
                    e.attrib.pop(a, None)
    report = {}
    items = [p for p in pages() if not only or p["name"] in only]
    for it in items:
        build(it, source, known, report)
    bad = {k: v for k, v in report.items() if v}
    for k, v in bad.items():
        print(f"  {k}: {'; '.join(v)}")
    print(f"settings keys dropped: {dict(sorted(dropped_settings.items(), key=lambda x: -x[1])[:25])}")
    print(f"{len(items)} pages built, {len(bad)} with chrome that differs from the source")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(set(sys.argv[1:]))
