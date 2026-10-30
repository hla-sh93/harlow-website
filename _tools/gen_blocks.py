"""Stage 3: the reference pages read into blocks.

Every element of a page's own Elementor document becomes the block of its kind, with
named attributes: a container (harlow/container, the blocks inside it as inner blocks), a
heading, a text (its paragraphs and lists as WordPress's own paragraph and list blocks), an
image, a button, a divider, an icon, an icon list, social icons, an accordion, a list of
items (harlow/loop, from stage 2), a menu, an HTML widget, a shortcode's output, and a
template (the "major clients" section, which becomes one synced pattern used by every page;
on the home page also the site header and footer). Each block keeps the element's id,
design classes and settings, so it prints the element as live does.

Nothing is guessed: an element of a kind or shape the tool does not know stops the run,
with the page and the element's id.

Writes, for the installer:
  theme/pages/<name>.html          each page's blocks (the page's "original")
  theme/pages/_major-clients.html  the synced pattern's blocks
and the section library and page starters:
  theme/patterns/section-<n>.php   one section of every shape the pages have
  theme/patterns/starter-<kind>.php one page of every kind (K1-K6), every section in it

Usage:
    python -u _tools/gen_blocks.py [name ...]
"""

import json
import re
import sys
from collections import OrderedDict

import html5lib
from lxml import etree

from build_pages import plain_names
from common import ROOT, pages
from listdata import LOGOS, list_attributes

OUT_PAGES = ROOT / "theme" / "pages"
OUT_PATTERNS = ROOT / "theme" / "patterns"
CLIENTS = "5532"           # the "major clients" container document, reused by 21 pages
WRAPPER_ATTRS = {"class", "data-id", "data-element_type", "data-e-type", "data-widget_type", "data-settings", "id"}


class Unknown(Exception):
    pass


def parse_page(name):
    """A reference page as the browser reads it (html5lib), with SVG's namespace taken off
    its elements, so an icon is written back as plain <svg> (not ns0:svg)."""
    doc = html5lib.parse((ROOT / f"{name}.html").read_text(encoding="utf-8"), treebuilder="lxml",
                         namespaceHTMLElements=False)
    plain_names(doc.getroot())
    return doc


def els(node):
    return [c for c in node if isinstance(c.tag, str)]


def inner_html(node):
    """A node's content as written: text and children, without the node itself."""
    out = node.text or ""
    for c in node:
        out += etree.tostring(c, method="html", encoding="unicode", with_tail=True)
    return out


def outer_html(node):
    return etree.tostring(node, method="html", encoding="unicode", with_tail=False)


def collapse(s):
    return re.sub(r"[ \t\n\f\r]+", " ", s or "").strip()


def gap(s, label):
    """The text between two elements: none, or white space (written as one line break).
    Real words between elements would be lost, so they stop the run."""
    if not s:
        return ""
    if s.strip(" \t\n\f\r"):
        raise Unknown(f"{label}: words {s.strip()[:40]!r} between elements")
    return "\n"


def gaps(holder, kids, label):
    """Before the first element, between each two, after the last."""
    return [gap(holder.text, label)] + [gap(k.tail, label) for k in kids]


def where(el):
    return f"{el.get('data-widget_type') or el.get('data-element_type')} {el.get('data-id')}"


def wrapper(el):
    """What every element block keeps: id, design classes, settings, an id attribute."""
    extra = set(el.attrib) - WRAPPER_ATTRS
    if extra:
        raise Unknown(f"{where(el)}: attributes {sorted(extra)} on the element")
    attrs = OrderedDict(element=el.get("data-id"), classes=el.get("class"))
    if el.get("data-settings"):
        attrs["settings"] = el.get("data-settings")
    if el.get("id"):
        attrs["htmlId"] = el.get("id")
    return attrs


def widget_body(el):
    kids = els(el)
    if len(kids) != 1 or kids[0].get("class") != "elementor-widget-container":
        raise Unknown(f"{where(el)}: no single widget container")
    return kids[0]


def only(node, tag, cls=None, label=""):
    kids = els(node)
    if len(kids) != 1 or kids[0].tag != tag or (cls is not None and kids[0].get("class") != cls):
        raise Unknown(f"{label}: expected one <{tag} class={cls!r}>, found {[(k.tag, k.get('class')) for k in kids]}")
    return kids[0]


def link_attrs(a):
    out = OrderedDict(link=a.get("href", ""))
    for k in ("target", "rel"):
        if a.get(k):
            out["link" + k.capitalize()] = a.get(k)
    extra = set(a.attrib) - {"href", "target", "rel"}
    if extra:
        raise Unknown(f"a link with attributes {sorted(extra)}")
    return out


WP_IMAGE = re.compile(r"\bwp-image-(\d+)\b")
SIZE = re.compile(r"\bsize-([\w-]+)\b")


def image_attrs(img, label):
    """An <img> as attributes: a Media Library picture by id and size, or a file."""
    cls = img.get("class", "")
    m = WP_IMAGE.search(cls)
    out = OrderedDict()
    if m and SIZE.search(cls):
        out["image"] = int(m.group(1))
        out["size"] = SIZE.search(cls).group(1)
        if cls != f"attachment-{out['size']} size-{out['size']} wp-image-{out['image']}":
            raise Unknown(f"{label}: picture classes {cls!r}")
        if img.get("alt"):
            out["alt"] = img.get("alt")
        if img.get("title"):
            out["title"] = img.get("title")
        known = {"src", "class", "alt", "title", "width", "height", "srcset", "sizes", "loading", "decoding", "fetchpriority"}
    else:
        out["src"] = img.get("src")
        for k in ("width", "height", "alt", "title", "class"):
            if img.get(k) is not None:
                out[k if k != "class" else "imgClass"] = img.get(k)
        known = {"src", "class", "alt", "title", "width", "height", "loading", "decoding", "fetchpriority"}
    extra = set(img.attrib) - known
    if extra:
        raise Unknown(f"{label}: picture attributes {sorted(extra)}")
    return out


# ---------------------------------------------------------------- the widgets

def heading(el):
    a = wrapper(el)
    t = only(widget_body(el), None) if False else None
    body = widget_body(el)
    kids = els(body)
    if len(kids) != 1 or "elementor-heading-title" not in (kids[0].get("class") or ""):
        raise Unknown(f"{where(el)}: heading shape")
    t = kids[0]
    m = re.fullmatch(r"elementor-heading-title elementor-size-([\w-]+)", t.get("class"))
    if not m or set(t.attrib) - {"class"}:
        raise Unknown(f"{where(el)}: heading title {t.attrib}")
    a["tag"] = t.tag
    if m.group(1) != "default":
        a["size"] = m.group(1)
    a["text"] = inner_html(t)
    return ("heading", a, [], None, None)


PROSE_INLINE = {"span", "strong", "b", "em", "i", "u", "a", "br", "sup", "sub"}


def plain_prose(node):
    """Can this element's content sit in a WordPress paragraph or list item as it is?"""
    for d in node.iter():
        if d is node or not isinstance(d.tag, str):
            continue
        if d.tag not in PROSE_INLINE:
            return False
    return True


def text(el):
    """A text: each paragraph a WordPress paragraph, each plain list a WordPress list, and
    anything else (a paragraph with data attributes, a section, a form field) an HTML block
    holding it as it is."""
    a = wrapper(el)
    body = widget_body(el)
    kids = els(body)
    inner = []
    for c in kids:
        if c.tag == "p" and set(c.attrib) <= {"class"} and plain_prose(c):
            attrs = OrderedDict()
            if c.get("class"):
                attrs["className"] = c.get("class")
            inner.append(("core/paragraph", attrs, [], outer_html(c), None))
        elif c.tag in ("ul", "ol") and set(c.attrib) <= {"class"} and all(
                li.tag == "li" and not li.attrib and plain_prose(li) for li in els(c)):
            attrs = OrderedDict()
            if c.tag == "ol":
                attrs["ordered"] = True
            if c.get("class"):
                attrs["className"] = c.get("class")
            items = [("core/list-item", OrderedDict(), [], outer_html(li), None) for li in els(c)]
            start = f"<{c.tag}" + (f' class="{c.get("class")}"' if c.get("class") else "") + ">"
            inner.append(("core/list", attrs, items, (start, f"</{c.tag}>"), gaps(c, els(c), where(el))))
        else:
            inner.append(("core/html", OrderedDict(), [], outer_html(c), None))
    return ("text", a, inner, None, gaps(body, kids, where(el)))


def image(el):
    a = wrapper(el)
    body = widget_body(el)
    kids = els(body)
    if len(kids) != 1:
        raise Unknown(f"{where(el)}: image shape {[k.tag for k in kids]}")
    node = kids[0]
    if node.tag == "a":
        a.update(link_attrs(node))
        node = only(node, "img", label=where(el))
    if node.tag != "img":
        raise Unknown(f"{where(el)}: image shape <{node.tag}>")
    a.update(image_attrs(node, where(el)))
    return ("image", a, [], None, None)


def button(el):
    a = wrapper(el)
    wrap = only(widget_body(el), "div", "elementor-button-wrapper", where(el))
    link = only(wrap, "a", label=where(el))
    cls = link.get("class", "")
    if not cls.startswith("elementor-button"):
        raise Unknown(f"{where(el)}: button class {cls!r}")
    a["buttonClass"] = cls
    rest = OrderedDict((k, v) for k, v in link.attrib.items() if k != "class")
    if "href" in rest:
        a["link"] = rest.pop("href")
    for k in ("target", "rel", "id"):
        if k in rest:
            a["link" + k.capitalize()] = rest.pop(k)
    if rest:
        raise Unknown(f"{where(el)}: button attributes {sorted(rest)}")
    content = only(link, "span", "elementor-button-content-wrapper", where(el))
    parts = els(content)
    icon_first = None
    for p in parts:
        if p.get("class") == "elementor-button-icon":
            a["hasIcon"] = True
            if inner_html(p).strip():
                a["icon"] = inner_html(p).strip()
            icon_first = icon_first if icon_first is not None else True
        elif p.get("class") == "elementor-button-text":
            a["text"] = inner_html(p)
            icon_first = icon_first if icon_first is not None else False
        else:
            raise Unknown(f"{where(el)}: button part {p.get('class')!r}")
    if "hasIcon" in a and not icon_first:
        a["iconAfter"] = True
    return ("button", a, [], None, None)


def divider(el):
    a = wrapper(el)
    d = only(widget_body(el), "div", "elementor-divider", where(el))
    s = only(d, "span", "elementor-divider-separator", where(el))
    if els(s) or collapse(s.text):
        raise Unknown(f"{where(el)}: divider with content")
    return ("divider", a, [], None, None)


def icon(el):
    a = wrapper(el)
    w = only(widget_body(el), "div", "elementor-icon-wrapper", where(el))
    i = els(w)
    if len(i) != 1:
        raise Unknown(f"{where(el)}: icon shape")
    node = i[0]
    if node.tag == "a":
        a.update(link_attrs(OrderedDict((k, v) for k, v in node.attrib.items() if k != "class")) if False else {})
        raise Unknown(f"{where(el)}: linked icon")
    if node.tag != "div" or node.get("class") != "elementor-icon" or set(node.attrib) != {"class"}:
        raise Unknown(f"{where(el)}: icon {node.tag} {node.attrib}")
    a["icon"] = inner_html(node).strip()
    return ("icon", a, [], None, None)


def icon_list(el):
    a = wrapper(el)
    ul = only(widget_body(el), "ul", None, where(el))
    inline = ul.get("class") == "elementor-icon-list-items elementor-inline-items"
    if not inline and ul.get("class") != "elementor-icon-list-items":
        raise Unknown(f"{where(el)}: icon list class {ul.get('class')!r}")
    if inline:
        a["inline"] = True
    items = []
    for li in els(ul):
        want = "elementor-icon-list-item elementor-inline-item" if inline else "elementor-icon-list-item"
        if li.tag != "li" or li.get("class") != want or set(li.attrib) != {"class"}:
            raise Unknown(f"{where(el)}: icon list item {li.attrib}")
        item = OrderedDict()
        node = li
        kids = els(li)
        if len(kids) == 1 and kids[0].tag == "a":
            item.update(link_attrs(kids[0]))
            node = kids[0]
        for part in els(node):
            if part.get("class") == "elementor-icon-list-icon":
                item["icon"] = inner_html(part).strip()
            elif part.get("class") == "elementor-icon-list-text":
                item["text"] = inner_html(part)
            else:
                raise Unknown(f"{where(el)}: icon list part {part.get('class')!r}")
        items.append(item)
    a["items"] = items
    return ("icon-list", a, [], None, None)


def social_icons(el):
    a = wrapper(el)
    w = only(widget_body(el), "div", "elementor-social-icons-wrapper elementor-grid", where(el))
    items = []
    for span in els(w):
        if span.get("class") != "elementor-grid-item":
            raise Unknown(f"{where(el)}: social item {span.attrib}")
        link = only(span, "a", label=where(el))
        item = OrderedDict(linkClass=link.get("class"))
        item.update(link_attrs(OrderedDict((k, v) for k, v in link.attrib.items() if k != "class")) if False else {})
        item["link"] = link.get("href", "")
        for k in ("target", "rel"):
            if link.get(k):
                item["link" + k.capitalize()] = link.get(k)
        label = only(link, None) if False else None
        parts = els(link)
        if len(parts) != 2 or parts[0].get("class") != "elementor-screen-only" or parts[1].tag != "svg":
            raise Unknown(f"{where(el)}: social item content")
        item["label"] = parts[0].text or ""
        item["icon"] = outer_html(parts[1])
        items.append(item)
    a["items"] = items
    return ("social-icons", a, [], None, None)


def accordion(el):
    a = wrapper(el)
    acc = only(widget_body(el), "div", "elementor-accordion", where(el))
    items = []
    for it in els(acc):
        title, content = els(it)
        tab = title.get("data-tab")
        tid = re.fullmatch(r"elementor-tab-title-(\d+)", title.get("id")).group(1)
        icons = els(title)[0]
        closed, opened = els(icons)
        link = els(title)[1]
        items.append(OrderedDict(tab=int(tab), id=int(tid), title=inner_html(link), content=inner_html(content),
                                 expanded=title.get("aria-expanded"), titleClass=title.get("class"),
                                 contentClass=content.get("class"),
                                 contentStyle=content.get("style", "")))
    a["iconClosed"] = inner_html(closed).strip()
    a["iconOpened"] = inner_html(opened).strip()
    a["items"] = items
    return ("accordion", a, [], None, None)


def raw_widget(name):
    def convert(el):
        a = wrapper(el)
        body = widget_body(el)
        a["html"] = inner_html(body)
        return (name, a, [], None, None)
    return convert


def shortcode(el):
    a = wrapper(el)
    sc = only(widget_body(el), "div", "elementor-shortcode", where(el))
    a["html"] = inner_html(sc)
    return ("shortcode", a, [], None, None)


MENU_OF = {"HARLOW’S PEOPLE": "careers"}   # a menu is known by its first item's words


def nav_menu(el):
    """A menu in a page (the careers pages' side menu): WordPress's menu, printed twice
    as Elementor's widget prints it, the second time for its dropdown."""
    a = wrapper(el)
    navs = els(widget_body(el))
    main = navs[0]
    if main.tag != "nav" or main.get("aria-label") != "Menu" or "elementor-nav-menu--main" not in main.get("class"):
        raise Unknown(f"{where(el)}: menu shape")
    a["navClass"] = main.get("class")
    ul = only(main, "ul", None, where(el))
    if ul.get("id") != f"menu-1-{el.get('data-id')}":
        raise Unknown(f"{where(el)}: menu list id {ul.get('id')}")
    if "sm-vertical" in ul.get("class"):
        a["vertical"] = True
    first = collapse("".join(els(ul)[0].itertext()))
    if first not in MENU_OF:
        raise Unknown(f"{where(el)}: a menu that starts with {first!r}")
    a["menu"] = MENU_OF[first]
    if len(navs) == 2:
        drop = navs[1]
        if drop.get("class") != "elementor-nav-menu--dropdown elementor-nav-menu__container" or \
                only(drop, "ul", None, where(el)).get("id") != f"menu-2-{el.get('data-id')}":
            raise Unknown(f"{where(el)}: menu dropdown shape")
    else:
        raise Unknown(f"{where(el)}: {len(navs)} parts in a menu")
    return ("nav-menu", a, [], None, None)


def loop(el):
    """A list of items (stage 2's block): the widget's design, and what listdata.py says it
    shows. Its cards are the items', so what the reference prints inside is not read."""
    a = OrderedDict(widget=el.get("data-id"), classes=el.get("class"), settings=el.get("data-settings", "{}"))
    try:
        a.update(list_attributes(el.get("data-id")))
    except KeyError:
        raise Unknown(f"{where(el)}: a list listdata.py does not know")
    return ("loop", a, [], None, None)


def template(el):
    a = wrapper(el)
    t = only(widget_body(el), "div", "elementor-template", where(el))
    doc = only(t, None) if False else els(t)[0]
    kind, did = doc.get("data-elementor-type"), doc.get("data-elementor-id")
    if kind == "container" and did == CLIENTS:
        return ("template", a, [("core/block", OrderedDict(ref=int(CLIENTS)), [], None, None)], None, ["", ""])
    if kind in ("header", "footer"):
        return ("template", a, [("site-part", OrderedDict(part=kind, embedded=True), [], None, None)], None, ["", ""])
    raise Unknown(f"{where(el)}: template of document {kind} {did}")


WIDGETS = {
    "heading.default": heading,
    "text-editor.default": text,
    "image.default": image,
    "button.default": button,
    "divider.default": divider,
    "icon.default": icon,
    "icon-list.default": icon_list,
    "social-icons.default": social_icons,
    "accordion.default": accordion,
    "html.default": raw_widget("html"),
    "shortcode.default": shortcode,
    "nav-menu.default": nav_menu,
    "template.default": template,
    "loop-grid.post": loop,
    "loop-carousel.post": loop,
}


VIDEO_ATTRS = {"class": "elementor-background-video-hosted", "role": "presentation", "autoplay": "", "muted": "",
               "playsinline": "", "loop": ""}


def container(el):
    a = wrapper(el)
    kids = els(el)
    holder = el
    if kids and kids[0].get("class") == "elementor-background-video-container":
        # a background video (the home page's banner): its file is also in the settings
        video = only(kids[0], "video", None, where(el))
        if {k: v for k, v in video.attrib.items() if k != "src"} != VIDEO_ATTRS:
            raise Unknown(f"{where(el)}: background video attributes {video.attrib}")
        if not gap(el.text, where(el)):
            raise Unknown(f"{where(el)}: no white space before the background video")
        a["video"] = video.get("src")
        lead = gap(kids[0].tail, where(el))
        kids = kids[1:]
        if len(kids) == 1 and kids[0].get("class") == "e-con-inner":
            raise Unknown(f"{where(el)}: a boxed container with a background video")
        return ("container", a, [convert(k) for k in kids], None, [lead] + [gap(k.tail, where(el)) for k in kids])
    if len(kids) == 1 and kids[0].get("class") == "e-con-inner" and len(kids[0].attrib) == 1:
        if not gap(el.text, where(el)) or not gap(kids[0].tail, where(el)):
            raise Unknown(f"{where(el)}: no white space around the inner box")
        a["boxed"] = True
        holder = kids[0]
        kids = els(holder)
    return ("container", a, [convert(k) for k in kids], None, gaps(holder, kids, where(el)))


def convert(el):
    kind = el.get("data-element_type")
    if kind == "container":
        return container(el)
    if kind == "widget":
        fn = WIDGETS.get(el.get("data-widget_type"))
        if not fn:
            raise Unknown(f"{where(el)}: no block for this widget")
        return fn(el)
    raise Unknown(f"<{el.tag} class={el.get('class')!r}>: not an Elementor element")


# ---------------------------------------------------------------- writing blocks

def attr_json(attrs):
    s = json.dumps(attrs, ensure_ascii=False, separators=(",", ":"))
    for a, b in (("--", "\\u002d\\u002d"), ("<", "\\u003c"), (">", "\\u003e"), ("&", "\\u0026"), ('\\"', "\\u0022")):
        s = s.replace(a, b)
    return s


def block_name(name):
    return name[len("core/"):] if name.startswith("core/") else (name if "/" in name else f"harlow/{name}")


def serialize(block):
    """A block as WordPress writes it, with only the reference's white space in it: a
    paragraph's own markup has none around it, and between two blocks there is what there
    was between the two elements."""
    name, attrs, inner, html_part, between = block
    full = block_name(name)
    opener = f"<!-- wp:{full}" + (f" {attr_json(attrs)}" if attrs else "")
    if name in ("core/paragraph", "core/list-item", "core/html"):
        return f"{opener} -->{html_part}<!-- /wp:{full} -->"
    if name == "core/list":
        start, end = html_part
        return f"{opener} -->{start}{joined(inner, between)}{end}<!-- /wp:{full} -->"
    if between is None:
        return f"{opener} /-->"
    # an empty container keeps the white space it had inside
    return f"{opener} -->{joined(inner, between)}<!-- /wp:{full} -->"


def joined(inner, between):
    out = between[0]
    for b, after in zip(inner, between[1:]):
        out += serialize(b) + after
    return out


def page_document(doc):
    """The page's own Elementor document: the element that holds its sections."""
    found = doc.xpath("//body//*[@data-elementor-type='wp-page']")
    if len(found) != 1:
        raise Unknown(f"{len(found)} page documents")
    return found[0]


def shape(block):
    """A section's shape: its blocks and their design, without words, pictures or links."""
    name, attrs, inner, *rest = block
    keep = {k: v for k, v in attrs.items() if k in ("classes", "boxed", "tag", "layout", "template", "inline")}
    return (name, tuple(sorted(keep.items())), tuple(shape(i) for i in inner))


LOGO_CLASSES = "elementor-element e-transform elementor-widget elementor-widget-image hl-v-e-transform-scale-1_2--wc-hover"


def with_logo_list(block):
    """The major clients' ten logos are Client logos now: the container that held them
    holds the list of client logos instead (stage 2)."""
    name, attrs, inner, html_part, between = block
    images = [i for i in inner if i[0] == "image"]
    if name == "container" and len(images) >= 5 and len(images) == len(inner) and all(
            set(i[1]["classes"].split()) == set(LOGO_CLASSES.split()) for i in images):
        card, post_type, count, by, order = LOGOS
        loop_block = ("loop", OrderedDict(layout="plain", postType=post_type, template=card, perPage=count,
                                          orderby=by, order=order), [], None, None)
        return (name, attrs, [loop_block], None, [between[0], between[-1]])
    return (name, attrs, [with_logo_list(i) for i in inner], html_part, between)


KIND_NAMES = {"K1": "Front page", "K2": "Business", "K3": "About", "K4": "Business (older layout)",
              "K5": "Listing", "K6": "Content"}


def first_heading(block):
    name, attrs, inner = block[0], block[1], block[2]
    if name == "heading":
        return re.sub(r"<[^>]+>", "", attrs.get("text", "")).strip()
    for i in inner:
        h = first_heading(i)
        if h:
            return h
    return ""


def pattern_file(slug, title, category, description, content):
    """A pattern of the theme: WordPress registers every file in patterns/ by its header."""
    return (f"<?php\n/**\n * Title: {title}\n * Slug: harlow/{slug}\n * Categories: {category}\n"
            f" * Description: {description}\n * Inserter: true\n *\n"
            f" * Generated by _tools/gen_blocks.py from the reference pages. Do not edit; change the generator.\n"
            f" *\n * @package Harlow\n */\n\n?>\n{content}\n")


def main(only_names):
    site = json.loads((ROOT / "theme" / "install" / "site.json").read_text(encoding="utf-8"))
    kinds = {p["name"]: p["kind"] for p in pages()}
    OUT_PAGES.mkdir(parents=True, exist_ok=True)
    OUT_PATTERNS.mkdir(parents=True, exist_ok=True)
    counts, problems, written, sections, starters = {}, [], 0, OrderedDict(), OrderedDict()
    clients = None
    for page in site["pages"]:
        name = page["name"]
        if only_names and name not in only_names:
            continue
        doc = parse_page(name)
        try:
            holder = page_document(doc)
            kids = els(holder)
            blocks = [convert(c) for c in kids]
            between = gaps(holder, kids, name)
            if clients is None and doc.xpath(f"//*[@data-elementor-id='{CLIENTS}']"):
                cdoc = doc.xpath(f"//*[@data-elementor-id='{CLIENTS}']")[0]
                ckids = els(cdoc)
                clients = with_logo_list(("document", OrderedDict(docType="container", docId=int(CLIENTS)),
                                          [convert(c) for c in ckids], None, gaps(cdoc, ckids, CLIENTS)))
        except Unknown as err:
            problems.append(f"{name}: {err}")
            continue

        def count(b):
            counts[b[0]] = counts.get(b[0], 0) + 1
            for i in b[2]:
                count(i)
        for b in blocks:
            count(b)
            sections.setdefault(shape(b), (name, b))
        content = joined(blocks, between)
        (OUT_PAGES / f"{name}.html").write_text(content, encoding="utf-8", newline="\n")
        starters.setdefault(kinds[name], (name, content))
        written += 1
    if clients:
        (OUT_PAGES / "_major-clients.html").write_text(serialize(clients), encoding="utf-8", newline="\n")

    if not only_names:
        for old in OUT_PATTERNS.glob("*.php"):
            old.unlink()
        for n, (shape_key, (name, block)) in enumerate(sections.items(), 1):
            heading_text = first_heading(block) or "section"
            title = f"{heading_text[:48].title()} ({name})"
            (OUT_PATTERNS / f"section-{n:02d}.php").write_text(
                pattern_file(f"section-{n:02d}", title, "harlow-sections",
                             f"A section shaped like this one of the {name} page.", serialize(block)),
                encoding="utf-8", newline="\n")
        for kind, (name, content) in starters.items():
            (OUT_PATTERNS / f"starter-{kind.lower()}.php").write_text(
                pattern_file(f"starter-{kind.lower()}", f"{KIND_NAMES.get(kind, kind)} page", "harlow-starters",
                             f"Every section of a {KIND_NAMES.get(kind, kind).lower()} page, as on {name}.", content),
                encoding="utf-8", newline="\n")

    for p in problems:
        print("  STOP", p)
    print(f"{written} pages written to theme/pages/, {len(problems)} stopped; blocks: "
          + ", ".join(f"{k} {v}" for k, v in sorted(counts.items(), key=lambda x: -x[1])))
    print(f"section library: {len(sections)} shapes -> theme/patterns/section-*.php; "
          f"starters: {len(starters)} kinds -> theme/patterns/starter-*.php")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(set(sys.argv[1:])))
