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
and live's four single templates (_tools/singles.py), the item's parts showing the item:
  theme/singles/<name>.html        single-post, single-project, single-gallery-item, single-job

Usage:
    python -u _tools/gen_blocks.py [name ...]
"""

import base64
import json
import re
import sys
from collections import OrderedDict
from urllib.parse import unquote

import html5lib
from lxml import etree

from build_pages import plain_names
from common import ROOT, pages
from listdata import LOGOS, list_attributes
from singles import TEMPLATES

OUT_PAGES = ROOT / "theme" / "pages"
OUT_PATTERNS = ROOT / "theme" / "patterns"
OUT_EDITOR = ROOT / "theme" / "editor"
OUT_SINGLES = ROOT / "theme" / "singles"
DESIGN_CSS = ROOT / "assets" / "css" / "design"
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

def words(node):
    """The words of an element the editor types into (a heading, a button, a question, a line
    of a list): its markup with the white space HTML does not draw taken out (runs as one
    space, none at the ends). The editor's rich text shows white space as it is written and
    turns a line break into <br> when the words are edited; the page draws them the same."""
    return re.sub(r"[ \t\n\f\r]+", " ", inner_html(node)).strip(" ")


def heading(el):
    a = wrapper(el)
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
    a["text"] = words(t)
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


BOX_TAGS = {"div", "section"}
BOX_ATTR = re.compile(r"^(class|id|data-[a-z0-9_-]+)$")
DATA_ATTR = re.compile(r"^data-[a-z0-9_-]+$")


def prose(holder, label):
    """The prose inside an element: its blocks and the white space between them."""
    kids = els(holder)
    return [prose_block(c, label) for c in kids], gaps(holder, kids, label)


def prose_block(c, label):
    """One piece of prose: a paragraph (with the data attributes the reference gives it), a
    plain list, a box of other pieces (a div or section that holds only elements), or,
    for anything else (loose words beside elements, a form field), one element written as
    HTML (harlow/markup: core's HTML block shows a preview in a frame of its own in the
    editor, which the page's stylesheets do not reach)."""
    data = [k for k in c.attrib if k != "class"]
    if c.tag == "p" and all(DATA_ATTR.match(k) for k in data) and plain_prose(c):
        attrs = OrderedDict()
        if c.get("class"):
            attrs["className"] = c.get("class")
        if data:
            attrs["dataAttributes"] = OrderedDict((k, c.get(k)) for k in data)
        return ("core/paragraph", attrs, [], outer_html(c), None)
    if c.tag in ("ul", "ol") and not data and all(
            li.tag == "li" and not li.attrib and plain_prose(li) for li in els(c)):
        attrs = OrderedDict()
        if c.tag == "ol":
            attrs["ordered"] = True
        if c.get("class"):
            attrs["className"] = c.get("class")
        items = [("core/list-item", OrderedDict(), [], outer_html(li), None) for li in els(c)]
        start = f"<{c.tag}" + (f' class="{c.get("class")}"' if c.get("class") else "") + ">"
        return ("core/list", attrs, items, (start, f"</{c.tag}>"), gaps(c, els(c), label))
    if (c.tag in BOX_TAGS and els(c) and all(BOX_ATTR.match(k) for k in c.attrib)
            and not (c.text or "").strip(" \t\n\f\r") and not any((k.tail or "").strip(" \t\n\f\r") for k in els(c))):
        attrs = OrderedDict(tag=c.tag)
        if c.attrib:
            attrs["htmlAttributes"] = OrderedDict(c.attrib)
        inner, between = prose(c, label)
        return ("box", attrs, inner, None, between)
    return ("markup", OrderedDict(html=outer_html(c)), [], None, None)


def text(el):
    """A text: its prose as WordPress paragraphs and lists, boxes, and HTML elements."""
    a = wrapper(el)
    inner, between = prose(widget_body(el), where(el))
    return ("text", a, inner, None, between)


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


def featured_image(el):
    """Elementor's featured image widget: an image widget of its own type."""
    block = image(el)
    block[1]["widgetType"] = "theme-post-featured-image.default"
    return block


def post_content(el):
    """Elementor's post content widget: the item's text, printed by the page (stage 5)."""
    widget_body(el)
    return ("post-content", wrapper(el), [], None, None)


def gallery(el):
    """Elementor's gallery widget: its pictures by id (each picture's lightbox link carries
    its id as base64 JSON), with or without their titles over them."""
    a = wrapper(el)
    box = only(widget_body(el), "div", "elementor-gallery__container", where(el))
    pictures, captions = [], set()
    for item in els(box):
        settings = unquote(item.get("data-e-action-hash", "")).split("settings=", 1)[-1]
        pictures.append(int(json.loads(base64.b64decode(settings + "=" * (-len(settings) % 4)))["id"]))
        kinds = [k.get("class") for k in els(item)]
        if kinds == ["e-gallery-image elementor-gallery-item__image", "elementor-gallery-item__content"]:
            captions.add(True)
        elif kinds == ["e-gallery-image elementor-gallery-item__image", "elementor-gallery-item__overlay"]:
            captions.add(False)
        else:
            raise Unknown(f"{where(el)}: gallery item {kinds}")
    if len(captions) > 1:
        raise Unknown(f"{where(el)}: some pictures with titles, some without")
    a["pictures"] = pictures
    if captions == {True}:
        a["captions"] = True
    return ("gallery", a, [], None, None)


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
            a["text"] = words(p)
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
                item["text"] = words(part)
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
    kids = els(acc)
    for it in kids:
        label = f"{where(el)} item {len(items) + 1}"
        if it.get("class") != "elementor-accordion-item" or len(it.attrib) != 1:
            raise Unknown(f"{label}: <{it.tag} {dict(it.attrib)}>")
        title, content = els(it)
        tab = title.get("data-tab")
        tid = re.fullmatch(r"elementor-tab-title-(\d+)", title.get("id")).group(1)
        icons = els(title)[0]
        closed, opened = els(icons)
        link = els(title)[1]
        if gaps(it, [title, content], label) != ["\n", "\n", "\n"] or content.get("data-tab") != tab:
            raise Unknown(f"{label}: not shaped as the accordion item block prints it")
        attrs = OrderedDict(tab=int(tab), itemId=int(tid), title=words(link))
        if title.get("aria-expanded") != "false":
            attrs["expanded"] = title.get("aria-expanded")
        if title.get("class") != "elementor-tab-title":
            attrs["titleClass"] = title.get("class")
        if content.get("class") != "elementor-tab-content elementor-clearfix":
            attrs["contentClass"] = content.get("class")
        if content.get("style"):
            attrs["contentStyle"] = content.get("style")
        inner, between = prose(content, label)
        items.append(("accordion-item", attrs, inner, None, between))
    a["iconClosed"] = inner_html(closed).strip()
    a["iconOpened"] = inner_html(opened).strip()
    return ("accordion", a, items, None, gaps(acc, kids, where(el)))


def raw_widget(name):
    def convert(el):
        a = wrapper(el)
        body = widget_body(el)
        a["html"] = inner_html(body)
        return (name, a, [], None, None)
    return convert


def shortcode(el):
    """A shortcode widget: a Contact Form 7 form as its shortcode (printed by the plugin,
    stage 5); anything else as the markup live's plugin printed."""
    a = wrapper(el)
    sc = only(widget_body(el), "div", "elementor-shortcode", where(el))
    forms = sc.xpath(".//div[contains(concat(' ', @class, ' '), ' wpcf7 ')]/@data-wpcf7-id")
    if forms:
        a["shortcode"] = f'[contact-form-7 id="{forms[0]}"]'
    else:
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
    "theme-post-content.default": post_content,
    "theme-post-featured-image.default": featured_image,
    "gallery.default": gallery,
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
    holder = found[0]
    doc_id = holder.get("data-elementor-id")
    if dict(holder.attrib) != {"data-elementor-type": "wp-page", "data-elementor-id": doc_id,
                               "class": f"elementor elementor-{doc_id}", "data-elementor-post-type": "page"}:
        raise Unknown(f"page document {dict(holder.attrib)}")
    return holder


def shape(block):
    """A section's shape: its blocks and their design, without words, pictures or links."""
    name, attrs, inner, *rest = block
    keep = {k: v for k, v in attrs.items() if k in ("classes", "boxed", "tag", "layout", "template", "inline")}
    return (name, tuple(sorted(keep.items())), tuple(shape(i) for i in inner))


LOGO_CLASSES = "elementor-element e-transform elementor-widget elementor-widget-image hl-v-e-transform-scale-1_2--wc-hover"


def with_logo_list(block):
    """The major clients' ten logos are Client logos now: the container that held them is
    the list of client logos, printed as that container around the cards (stage 2), so the
    cards are its children in the editor too, where the design's child rules need them."""
    name, attrs, inner, html_part, between = block
    images = [i for i in inner if i[0] == "image"]
    if name == "container" and len(images) >= 5 and len(images) == len(inner) and all(
            set(i[1]["classes"].split()) == set(LOGO_CLASSES.split()) for i in images):
        card, post_type, count, by, order = LOGOS
        if between[0] != "\n" or between[-1] != "\n" or attrs.get("htmlId") or attrs.get("video"):
            raise Unknown(f"logos container {attrs['element']}: not shaped as the list's box prints it")
        return ("loop", OrderedDict(widget=attrs["element"], classes=attrs["classes"], settings=attrs.get("settings", ""),
                                    layout="box", boxed=attrs.get("boxed", False), postType=post_type, template=card,
                                    perPage=count, orderby=by, order=order), [], None, None)
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


def with_sources(block, dynamic, applied):
    """A single template's blocks with the item's parts set to show the item: a heading's
    words as its title, date or a field; an image as its featured picture; a gallery as its
    gallery field. What the reference page showed of its own item is dropped."""
    name, attrs, inner, html_part, between = block
    source = dynamic.get(attrs.get("element"))
    if source:
        attrs = OrderedDict(attrs)
        if name == "heading":
            attrs.pop("text", None)
            attrs["source"] = source
        elif name == "image" and source == "featured":
            for key in ("image", "alt", "title", "src", "width", "height", "imgClass"):
                attrs.pop(key, None)
            attrs["source"] = source
        elif name == "gallery" and source.startswith("meta:"):
            attrs.pop("pictures", None)
            attrs["source"] = source
        elif name == "post-content" and source == "content":
            pass
        else:
            raise Unknown(f"{attrs.get('element')}: a {name} cannot show {source}")
        applied.add(attrs["element"])
    return (name, attrs, [with_sources(b, dynamic, applied) for b in inner], html_part, between)


def single_template(tid, info):
    """A single template, read from the first item page of the reference that uses it."""
    for page in pages():
        if page["name"] == "404" or not (ROOT / f"{page['name']}.html").exists():
            continue
        doc = parse_page(page["name"])
        found = doc.xpath(f"//body/*[@data-elementor-id='{tid}']")
        if found:
            break
    else:
        raise Unknown(f"template {tid}: no page of the reference uses it")
    holder = found[0]
    if holder.get("data-elementor-type") != "single-page" or holder.get("data-elementor-post-type") != "elementor_library":
        raise Unknown(f"template {tid}: {dict(holder.attrib)}")
    kids = els(holder)
    applied = set()
    blocks = [with_sources(convert(c), info["dynamic"], applied) for c in kids]
    if applied != set(info["dynamic"]):
        raise Unknown(f"template {tid}: no element {sorted(set(info['dynamic']) - applied)}")
    return page["name"], ("document", OrderedDict(docType="single-page", docId=int(tid), postType="elementor_library",
                                                  location="single"), blocks, None, gaps(holder, kids, tid))


def icons_of(block, found):
    """Every icon a block and the blocks inside it use, in the order they come."""
    name, attrs, inner, *rest = block
    for key in ("icon", "iconClosed", "iconOpened"):
        if attrs.get(key):
            found.setdefault(attrs[key], None)
    for item in attrs.get("items", []):
        if isinstance(item, dict) and item.get("icon"):
            found.setdefault(item["icon"], None)
    for b in inner:
        icons_of(b, found)


def design_classes():
    """The class names of the design vocabulary (assets/css/design/), sorted."""
    names = set()
    for css in sorted(DESIGN_CSS.glob("*.css")):
        if css.name.startswith("globals-"):
            continue
        for m in re.finditer(r"\.(hl-(?:[A-Za-z0-9_-]|\\.)+)", css.read_text(encoding="utf-8")):
            names.add(re.sub(r"\\(.)", r"\1", m.group(1)))
    return sorted(names)


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
        page_block = ("document", OrderedDict(docType="wp-page", docId=int(holder.get("data-elementor-id")),
                                              postType="page"), blocks, None, between)
        (OUT_PAGES / f"{name}.html").write_text(serialize(page_block), encoding="utf-8", newline="\n")
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
            kind_name = KIND_NAMES.get(kind, kind)
            page_name = kind_name if kind_name.lower().endswith("page") else kind_name + " page"
            (OUT_PATTERNS / f"starter-{kind.lower()}.php").write_text(
                pattern_file(f"starter-{kind.lower()}", page_name, "harlow-starters",
                             f"Every section of a {page_name.lower()}, as on {name}.", content),
                encoding="utf-8", newline="\n")

    singles = 0
    if not only_names:
        OUT_SINGLES.mkdir(parents=True, exist_ok=True)
        for tid, info in TEMPLATES.items():
            try:
                source, block = single_template(tid, info)
            except Unknown as err:
                problems.append(f"single {tid}: {err}")
                continue
            (OUT_SINGLES / f"{info['name']}.html").write_text(serialize(block), encoding="utf-8", newline="\n")
            singles += 1
            print(f"single template {tid} ({', '.join(info['types'])}) from {source} -> theme/singles/{info['name']}.html")

    if not only_names:
        icons = OrderedDict()
        for _, (name, block) in sections.items():
            icons_of(block, icons)
        if clients:
            icons_of(clients, icons)
        classes = design_classes()
        (OUT_EDITOR / "icons.json").write_text(json.dumps(list(icons), ensure_ascii=False, indent="\t") + "\n",
                                              encoding="utf-8", newline="\n")
        (OUT_EDITOR / "design-classes.json").write_text(json.dumps(classes, indent="\t") + "\n",
                                                       encoding="utf-8", newline="\n")
        print(f"editor: {len(icons)} icons -> theme/editor/icons.json; "
              f"{len(classes)} design classes -> theme/editor/design-classes.json")

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
