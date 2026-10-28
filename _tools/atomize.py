"""Stage R, step 2: the per-element design as classes, one per value.

Elementor keeps each element's design in rules keyed on its id
(`.elementor-1179 .elementor-element.elementor-element-de6340e { ... }`). A section added
in WordPress has no such rule, so it would have no style. This turns every declaration of
those rules into an "atom" (media query, where it applies, property, value) and gives each
atom a class named after what it does (`fs-32--ht` = font-size 32px on the heading title,
`v-padding-top-50` = Elementor's padding-top variable set to 50px). An element then wears
the classes of its atoms; the rules are written once per atom, by axis, in
assets/css/design/:

    type.css      fonts, sizes, weights, colours of text, spacing of letters and lines
    space.css     padding, margin, gaps
    layout.css    display, flex, grid, alignment, position
    size.css      widths, heights, limits
    surface.css   backgrounds, borders, opacity, overlays
    effects.css   transforms, transitions, animations
    misc.css      what fits nowhere else
    globals-<document>.css   the rules of each document that name no element (widget defaults,
                  a few custom rules); a page loads those of the documents it uses, as before
    brand.css     the brand colours as custom properties (--hl-color-primary: #0165A1, ...);
                  wherever the rules above use one of those colours they ask for the
                  property, so the theme's Customizer changes a brand colour everywhere

Nothing is approximated: a rule's selector keeps its tail and its specificity
(`.elementor .elementor-element.<class><tail>` weighs what the id selector weighed), media
queries keep their conditions and run in the order Elementor wrote them (desktop, then
tablet, then mobile), and where one element sets the same property twice the value that
won in the source is kept. Anything that cannot be expressed this way stops the run.

Also writes _vocab/element_classes.json (element id -> classes), _vocab/dynamic.json
(per-post backgrounds, which are content, not design) and _vocab/vocabulary.md.

Usage:
    python -u _tools/atomize.py
"""

import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import tinycss2
from cssselect import GenericTranslator
from cssselect import parse as cssselect_parse
from lxml import html as lxml_html

from build_css import Sheet, selector_tokens, strip_compound
from common import ROOT
from vocab import ser, split_selectors

DOCS = ROOT / "_vocab" / "docs"
OUT = ROOT / "assets" / "css" / "design"
VOCAB = ROOT / "_vocab"

ELEM_ID = re.compile(r"\.elementor-element-([0-9a-f]{7})(?![0-9a-zA-Z_-])")
LEAD = re.compile(r"^(?P<ltr>body:not\(\.rtl\) )?\.elementor-\d+ \.elementor-element$")
LEAD_LOOP = re.compile(r"^\.e-loop-item-(?P<post>\d+) \.elementor-element$")

# media groups in the order Elementor writes them: desktop, tablet band, tablet, mobile
WRAP_ORDER = [(), ("media (min-width:768px)",), ("media (max-width:1024px) and (min-width:768px)",),
              ("media (min-width:1025px)",), ("media (max-width:1024px)",), ("media (max-width:767px)",)]

AXES = [  # first match wins
    ("type", r"^(font|line-height|letter-spacing|word-spacing|text-|-webkit-text|color$|white-space|word-break|"
             r"hyphens|direction|unicode-bidi|--e-global-typography)"),
    ("space", r"^(--)?(margin|padding|gap|row-gap|column-gap)"),
    ("layout", r"^(--)?(display|flex|justify|align|container-widget|position|top$|right$|bottom$|left$|inset|"
              r"z-index|grid|order|content-width|float|overflow|e-con-|place-|writing)"),
    ("size", r"^(--)?(width|height|min-|max-|aspect-ratio|object-|size)"),
    ("surface", r"^(--)?(background|overlay|border|opacity|box-shadow|fill|stroke|outline|--background|"
                r"e-con-overlay|mask|clip)"),
    ("effects", r"^(--)?(transform|e-transform|transition|e-transition|animation|filter|backdrop|mix-blend|"
                r"cursor|will-change|pointer-events|visibility|scroll)"),
]
ABBR = {"font-size": "fs", "font-weight": "fw", "font-family": "ff", "font-style": "fst", "line-height": "lh",
        "letter-spacing": "ls", "text-align": "ta", "text-transform": "tt", "text-decoration": "td", "color": "c",
        "background-color": "bgc", "background-image": "bgi", "background-position": "bgp",
        "background-size": "bgs", "background-repeat": "bgr", "padding": "p", "margin": "m", "width": "w",
        "height": "h", "max-width": "mw", "min-width": "miw", "max-height": "mh", "min-height": "mih",
        "border-style": "bs", "border-width": "bw", "border-color": "bc", "border-radius": "br",
        "object-fit": "of", "object-position": "op", "opacity": "o", "display": "d", "position": "pos",
        "z-index": "z", "top": "top", "left": "left", "right": "right", "bottom": "bottom", "fill": "fill"}
TAILS = {" > .elementor-widget-container": "wc", " .elementor-heading-title": "ht", " img": "img",
         ":not(.elementor-motion-effects-element-type-background)": "bg", ".e-con": "con",
         ".elementor-element": "el", "::before": "before", "::after": "after",
         " > .elementor-widget-container:hover": "wc-hover", " .elementor-divider-separator": "sep",
         " .elementor-divider": "div", " .elementor-icon-list-text": "ilt",
         " .elementor-icon-list-icon svg": "ili-svg"}
MEDIA = {(): "", ("media (max-width:767px)",): "m", ("media (max-width:1024px)",): "t",
         ("media (min-width:768px)",): "d", ("media (min-width:1025px)",): "xl",
         ("media (max-width:1024px) and (min-width:768px)",): "tb"}
SHORTHANDS = {"margin", "padding", "border", "border-width", "border-style", "border-color", "background", "font",
              "flex", "gap", "overflow", "transition", "animation", "inset", "border-radius", "grid-template"}


def axis_of(prop):
    for name, rx in AXES:
        if re.match(rx, prop):
            return name
    return "misc"


def value_slug(value):
    important = value.endswith("!important")
    v = value.replace("!important", "").strip().lower()
    out = None
    m = re.fullmatch(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", v)
    if m:
        out = "url-" + re.sub(r"[^a-z0-9]+", "-", Path(m.group(1)).stem)[:22].strip("-")
    elif re.fullmatch(r"#[0-9a-f]{3,8}", v):
        out = v[1:]
    else:
        parts, ok = v.split(), True
        slugs = []
        for tok in parts:
            n = re.fullmatch(r"(-?)(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms|deg)?", tok)
            if not n:
                ok = False
                break
            sign, num, unit = n.groups()
            slugs.append(("n" if sign else "") + num.replace(".", "_") + {"px": "", "%": "pct"}.get(unit, unit or ""))
        if ok and parts:
            out = "-".join(slugs)
    if out is None:
        out = re.sub(r"[^a-z0-9]+", "-", v).strip("-")
        if len(out) > 24:
            out = out[:16].strip("-") + "-" + hashlib.sha1(v.encode()).hexdigest()[:6]
    return out + ("-i" if important else "")


def tail_slug(post):
    if not post:
        return ""
    if post in TAILS:
        return TAILS[post]
    s = re.sub(r"[^a-z0-9]+", "-", post.replace("elementor-", "").lower()).strip("-")
    return s[:24] if len(s) <= 24 else s[:16] + "-" + hashlib.sha1(post.encode()).hexdigest()[:5]


PREFIX = "hl-"   # every class of the vocabulary: the site's own CSS has classes like .m-0 and .d-none


def class_name(wrap, ltr, post, prop, value):
    p = ("v-" + prop[2:]) if prop.startswith("--") else ABBR.get(prop, prop)
    name = f"{PREFIX}{'ltr-' if ltr else ''}{p}-{value_slug(value)}"
    t = tail_slug(post)
    if t:
        name += "--" + t
    m = MEDIA.get(wrap)
    if m is None:
        m = re.sub(r"[^a-z0-9]+", "-", "-".join(wrap).lower()).strip("-")[:20]
    if m:
        name += "--" + m
    return name


def at_rules(wrap):
    """('media (max-width:767px)',) -> ('@media (max-width:767px)',): the headers Sheet writes."""
    return tuple("@" + w for w in wrap)


def in_media(wrap, w):
    """Is a width inside every media condition of this group? (only min/max-width are used)"""
    for cond in wrap:
        for kind, n in re.findall(r"\((min|max)-width:\s*(\d+)px\)", cond):
            if (kind == "min" and w < int(n)) or (kind == "max" and w > int(n)):
                return False
    return True


NOT_CSS = {"margin-center"}   # written by Elementor, not a property: browsers ignore it

# The brand colours: role -> today's value. Keep in step with harlow_brand_colours() in
# theme/functions/brand.php. A colour written exactly so (not a shade of it with its own
# alpha, like the transparent #0165A100 the header fades from) becomes var(--hl-color-<role>).
# Black is "text" only where it colours text or icons; elsewhere it stays black.
BRAND = {"primary": "#0165A1", "dark": "#001420", "accent": "#00CCCC", "light": "#F2F2F2", "text": "#000000"}
BRAND_ONLY = {"text": {"color", "fill"}}


def brand_value(prop, value):
    """A declaration's value with each brand colour in it replaced by its custom property."""
    for role, hex_ in BRAND.items():
        if role in BRAND_ONLY and prop not in BRAND_ONLY[role]:
            continue
        value = re.sub(re.escape(hex_) + r"(?![0-9a-fA-F])", f"var(--hl-color-{role})", value, flags=re.I)
    return value


def brand_sheet():
    s = Sheet("design/brand", OUT, "atomize.py")
    s.add_source("the brand colours, changed in the theme's Customizer (Brand colours)")
    s.add((), ":root {\n" + "\n".join(f"  --hl-color-{r}: {v};" for r, v in BRAND.items()) + "\n}")
    return s


def declarations(rule):
    out = []
    for d in tinycss2.parse_declaration_list(rule.content, skip_comments=True, skip_whitespace=True):
        if d.type == "declaration" and d.name not in NOT_CSS:
            out.append((d.name, ser(d.value) + (" !important" if d.important else "")))
    return out


def read_docs():
    """Walk every intermediate document in order; returns element atoms, globals, dynamic rules."""
    elem = defaultdict(dict)        # id -> {(wrap, ltr, post, prop): (value, seq)}
    globals_, dynamic = {}, []
    seq = 0
    for f in sorted(DOCS.glob("*.css")):
        def walk(nodes, wrap):
            nonlocal seq
            for r in nodes:
                if r.type == "qualified-rule":
                    decls = declarations(r)
                    non_elem = []
                    for sel in split_selectors(ser(r.prelude)):
                        m = ELEM_ID.search(sel)
                        if not m:
                            non_elem.append(sel)
                            continue
                        if len(ELEM_ID.findall(sel)) != 1:
                            raise SystemExit(f"{f.name}: a selector names two elements: {sel}")
                        lead, post = sel[:m.start()], sel[m.end():]
                        if "elementor-motion-effects-container" in post:
                            continue   # the layer Elementor's runtime adds: not in this markup
                        lm, dm = LEAD.match(lead), LEAD_LOOP.match(lead)
                        if dm:
                            dynamic.append({"post": dm.group("post"), "id": m.group(1), "post_tail": post,
                                            "wrap": list(wrap), "decls": decls})
                            continue
                        if not lm:
                            raise SystemExit(f"{f.name}: a selector shape that is not handled: {sel}")
                        for prop, value in decls:
                            seq += 1
                            elem[m.group(1)][(wrap, bool(lm.group("ltr")), post, prop)] = (value, seq)
                    if non_elem:
                        # kept per document: they apply to the whole page whenever that
                        # document's stylesheet is loaded, and only then
                        rules = globals_.setdefault(f.stem, {})
                        key = (wrap, tuple(non_elem))
                        rules.setdefault(key, [])
                        for decl in decls:
                            if decl not in rules[key]:
                                rules[key].append(decl)
                elif r.type == "at-rule" and r.lower_at_keyword in ("media", "supports"):
                    inner = tinycss2.parse_rule_list(r.content, skip_comments=True, skip_whitespace=True)
                    walk(inner, wrap + (f"{r.lower_at_keyword} {ser(r.prelude)}",))
                elif r.type == "at-rule":
                    raise SystemExit(f"{f.name}: at-rule not handled: @{r.at_keyword}")
        walk(tinycss2.parse_stylesheet(f.read_text(encoding="utf-8"), skip_comments=True, skip_whitespace=True), ())
    return elem, globals_, dynamic


def wrap_rank(wrap, extra):
    if wrap in WRAP_ORDER:
        return WRAP_ORDER.index(wrap)
    extra.setdefault(wrap, len(WRAP_ORDER) + len(extra))
    return extra[wrap]


def order_conflicts(elem, extra):
    """Same property set under overlapping media queries: does the winner change with the new order?"""
    bad = []
    for eid, atoms in elem.items():
        groups = defaultdict(list)
        for (wrap, ltr, post, prop), (value, seq) in atoms.items():
            groups[(ltr, post, prop)].append((wrap, value, seq))
        for key, items in groups.items():
            if len(items) < 2:
                continue
            for w in (320, 479, 700, 767, 768, 900, 1024, 1025, 1100, 1440, 1920):
                live = [(seq, value) for wrap, value, seq in items if in_media(wrap, w)]
                new = [(wrap_rank(wrap, extra), value) for wrap, value, seq in items if in_media(wrap, w)]
                if len(live) > 1 and max(live)[1] != max(new)[1]:
                    bad.append((eid, key, w, max(live)[1], max(new)[1]))
                    break
    return bad


def shorthand_conflicts(elem):
    """An element setting a shorthand and one of its longhands in the same place: order would matter."""
    bad = []
    for eid, atoms in elem.items():
        places = defaultdict(set)
        for (wrap, ltr, post, prop), _ in atoms.items():
            places[(wrap, ltr, post)].add(prop.lstrip("-"))
        for place, props in places.items():
            for s in SHORTHANDS:
                if s in props and any(p.startswith(s + "-") for p in props):
                    bad.append((eid, place, s))
    return bad


COLOUR = re.compile(r"^(#[0-9a-fA-F]{3,8}|rgba?\(.*\)|transparent|white|black)$")
PX = re.compile(r"(-?\d+(?:\.\d+)?)px")


def vocabulary_report(elem, names, usage, by_axis):
    """The vocabulary as a person reads it: the values each property takes and the scales they form."""
    users = defaultdict(set)                       # (property, value) -> elements wearing it
    scale = defaultdict(lambda: defaultdict(set))  # a named scale -> value -> elements
    for eid, atoms in elem.items():
        for (wrap, ltr, post, prop), (value, _) in atoms.items():
            v = value.replace(" !important", "").strip()
            users[(prop, v)].add(eid)
            if prop == "color" or prop.endswith("-color") or prop in ("fill", "stroke"):
                if COLOUR.match(v):
                    scale["palette"][v.upper()].add(eid)
            if prop == "font-size":
                scale["font size, mobile" if wrap and "max-width:767px" in wrap[-1] else
                      "font size, tablet" if wrap else "font size, desktop"][v].add(eid)
            if prop == "font-weight":
                scale["font weight"][v].add(eid)
            if re.match(r"^(--)?(padding|margin|row-gap|column-gap|gap)", prop):
                for n in PX.findall(v):
                    scale["spacing (px, any side)"][f"{float(n):g}px"].add(eid)
    one_off = sum(1 for n in names.values() if usage[n] == 1)
    lines = ["# The design vocabulary", "",
             "Generated by `_tools/atomize.py`. One class per value; an element wears the classes of its values.", "",
             f"{len(elem)} elements have their own design. Their {sum(len(a) for a in elem.values())} declarations "
             f"are {len(names)} classes, {one_off} of which are worn by one element only.", "",
             "## The scales", "",
             "How many different values each scale holds, and how many elements use each. This is the table "
             "the editor's choices come from.", ""]
    for name in ("palette", "font size, desktop", "font size, tablet", "font size, mobile", "font weight",
                 "spacing (px, any side)"):
        vals = scale[name]
        if name.startswith(("font size", "spacing")):
            def size_key(v):   # 13px, 1.25rem, calc(...): by its first number, the rest last
                m = re.search(r"-?\d+(?:\.\d+)?", v)
                return (float(m.group()) * (16 if "rem" in v or "em" in v else 1) if m else 1e9, v)
            order = sorted(vals, key=size_key)
        else:
            order = sorted(vals, key=lambda v: (-len(vals[v]), v))
        lines += [f"### {name}: {len(vals)} values", "",
                  " ".join(f"`{v}`x{len(vals[v])}" for v in order), ""]
    for a in ("type", "space", "layout", "size", "surface", "effects", "misc"):
        props = defaultdict(list)
        for u, name, key in by_axis[a]:
            props[key[3]].append(key[4].replace(" !important", ""))
        total = sum(len(v) for v in props.values())
        lines += [f"## {a}: {total} classes in {len(props)} properties", "",
                  "| property | classes | different values | values worn by 1 element | most used values |",
                  "|---|---|---|---|---|"]
        rows = []
        for p, vals in props.items():
            distinct = set(vals)
            rows.append((p, len(vals), len(distinct), sum(1 for v in distinct if len(users[(p, v)]) == 1),
                         sorted(distinct, key=lambda v: (-len(users[(p, v)]), v))[:3], p))   # ties by value: the same report every run
        for p, n, d, once, top, _ in sorted(rows, key=lambda r: -r[1]):
            lines.append(f"| `{p}` | {n} | {d} | {once} | " +
                         ", ".join(f"`{v}` x{len(users[(p, v)])}" for v in top) + " |")
        lines.append("")
    return "\n".join(lines)


PSEUDO_ELEMENT = re.compile(r"::?(before|after|placeholder|marker|selection|first-letter|first-line)\b")


def element_doms():
    """id -> a captured page (lxml) that has that element, to see which nodes a rule hits."""
    found = {}
    for f in sorted((ROOT / "_capture" / "raw").glob("*.html")):
        doc = lxml_html.fromstring(f.read_text(encoding="utf-8"))
        for el in doc.xpath("//*[@data-id]"):
            found.setdefault(el.get("data-id"), doc)
    return found


def ordered_atoms(names, elem, first_seq, extra):
    """Emission order: by axis, media group and property; inside a property, every pair that
    competes on one node with equal specificity keeps the source order (topological sort,
    ties broken by first appearance). Stops if two elements need opposite orders."""
    doms = element_doms()
    translator = GenericTranslator()
    hits_cache = {}

    def hits(eid, ltr, post):
        key = (eid, post)
        if key not in hits_cache:
            sel = f'[data-id="{eid}"]' + PSEUDO_ELEMENT.sub("", post)
            sel = "".join(t if t in (">", "+", "~", " ") else strip_compound(t) for t in selector_tokens(sel))
            try:
                hits_cache[key] = {id(n) for n in doms[eid].xpath(translator.css_to_xpath(sel))} if eid in doms else None
            except Exception:
                hits_cache[key] = None   # cannot judge: assume it may compete
        return hits_cache[key]

    def weight(ltr, post):
        sel = f"{'body:not(.rtl) ' if ltr else ''}.elementor .elementor-element.x{post}"
        try:
            return cssselect_parse(sel)[0].specificity()
        except Exception:
            return None

    before = defaultdict(set)    # key -> keys that must come before it
    competing = 0
    for eid, atoms in elem.items():
        same = defaultdict(list)
        for (wrap, ltr, post, prop), (value, seq) in atoms.items():
            same[(wrap, prop)].append((seq, (wrap, ltr, post, prop, value)))
        for group in same.values():
            group.sort()
            for i, (s1, k1) in enumerate(group):
                for s2, k2 in group[i + 1:]:
                    if (k1[1], k1[2]) == (k2[1], k2[2]):
                        continue
                    if PSEUDO_ELEMENT.findall(k1[2]) != PSEUDO_ELEMENT.findall(k2[2]):
                        continue
                    w1, w2 = weight(k1[1], k1[2]), weight(k2[1], k2[2])
                    if w1 is not None and w2 is not None and w1 != w2:
                        continue
                    h1, h2 = hits(eid, k1[1], k1[2]), hits(eid, k2[1], k2[2])
                    if h1 is not None and h2 is not None and not (h1 & h2):
                        continue
                    before[k2].add(k1)
                    competing += 1
    out = []
    groups = defaultdict(list)
    for k in names:
        groups[(axis_of(k[3]), wrap_rank(k[0], extra), k[3])].append(k)
    for gk in sorted(groups):
        todo = sorted(groups[gk], key=lambda k: first_seq[k])
        placed = set()
        while todo:
            ready = next((k for k in todo if before[k] <= placed or not (before[k] & set(todo))), None)
            if ready is None:
                raise SystemExit(f"two elements need opposite orders for {gk}: {todo[:3]}")
            out.append(ready)
            placed.add(ready)
            todo.remove(ready)
    print(f"rules competing on one node with equal weight, kept in source order: {competing} pairs")
    return out


def existing_classes():
    """Every class name already in the markup or in the stylesheets that are not generated here."""
    found = set()
    for f in (ROOT / "_capture" / "raw").glob("*.html"):
        for attr in re.findall(r'class="([^"]*)"', f.read_text(encoding="utf-8")):
            found.update(attr.split())
    for name in ("base", "layout", "components", "navigation", "modules", "utilities", "animations", "tokens"):
        text = (ROOT / "assets" / "css" / f"{name}.css").read_text(encoding="utf-8")
        found.update(re.findall(r"\.(-?[_a-zA-Z][\w-]*)", re.sub(r"url\([^)]*\)|\"[^\"]*\"", "", text)))
    for f in DOCS.glob("*.css"):
        text = re.sub(r"url\([^)]*\)|\"[^\"]*\"", "", f.read_text(encoding="utf-8"))
        found.update(c for c in re.findall(r"\.(-?[_a-zA-Z][\w-]*)", text) if not ELEM_ID.search("." + c))
    return found


def main():
    if not DOCS.exists():
        raise SystemExit("run build_css.py first: _vocab/docs is missing")
    elem, globals_, dynamic = read_docs()
    extra = {}
    oc, sc = order_conflicts(elem, extra), shorthand_conflicts(elem)

    names, used, first_seq = {}, {}, {}
    for eid, atoms in elem.items():
        for (wrap, ltr, post, prop), (value, seq) in atoms.items():
            key = (wrap, ltr, post, prop, value)
            first_seq[key] = min(seq, first_seq.get(key, seq))
            if key in names:
                continue
            name = class_name(*key)
            if name in used and used[name] != key:
                name += "-" + hashlib.sha1(repr(key).encode()).hexdigest()[:5]
            names[key], used[name] = name, key
    clash = sorted(set(used) & existing_classes())
    if clash:
        raise SystemExit(f"{len(clash)} generated classes already exist in the site: {clash[:8]}")

    sheets ={a: Sheet(f"design/{a}", OUT, "atomize.py") for a in ("type", "space", "layout", "size", "surface", "effects", "misc")}
    for s in sheets.values():
        s.add_source("per-element rules of the Elementor documents, one rule per class")
    usage = Counter()
    for eid, atoms in elem.items():
        for (wrap, ltr, post, prop), (value, _) in atoms.items():
            usage[names[(wrap, ltr, post, prop, value)]] += 1
    # Two rules of one element that set the same property on the same node with equal weight
    # are decided by order (`.page-numbers:not(.dots)` grey, then `.page-numbers.current`
    # blue): those pairs keep the order of the source; everything else is grouped by property.
    emitted = ordered_atoms(names, elem, first_seq, extra)
    for key in emitted:
        name = names[key]
        wrap, ltr, post, prop, value = key
        sel = f"{'body:not(.rtl) ' if ltr else ''}.elementor .elementor-element.{name}{post}"
        sheets[axis_of(prop)].add(at_rules(wrap), f"{sel} {{\n  {prop}: {brand_value(prop, value)};\n}}")

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.css"):
        old.unlink()
    written = {"brand.css": brand_sheet().render()}
    for a, s in sheets.items():
        written[f"{a}.css"] = s.render()

    for stem, rules in globals_.items():
        g = Sheet(f"design/globals-{stem}", OUT, "atomize.py")
        g.add_source(f"the rules of document {stem} that name no element")
        for (wrap, sels), decls in rules.items():
            body = "\n".join(f"  {p}: {brand_value(p, v)};" for p, v in decls)
            g.add(at_rules(wrap), ",\n".join(sels) + " {\n" + body + "\n}")
        written[f"globals-{stem}.css"] = g.render()
    bad = []
    for fname, text in written.items():
        (OUT / fname).write_text(text, encoding="utf-8")
        # every file must parse cleanly, or the browser drops what follows (and a media
        # block written without its @ is dropped whole)
        errors = [n for n in tinycss2.parse_stylesheet(text, skip_comments=True, skip_whitespace=True)
                  if n.type == "error"]
        stripped = re.sub(r"/\*.*?\*/|\"[^\"]*\"|'[^']*'", "", text, flags=re.S)
        if errors or stripped.count("{") != stripped.count("}") or re.search(r"(?m)^\s*(media|supports) ", text):
            bad.append(f"{fname}: {len(errors)} parse errors")
    if bad:
        raise SystemExit("design files that do not parse: " + "; ".join(bad))

    classes = {}   # id -> its classes, grouped by axis and property so the markup reads in order
    for eid, atoms in elem.items():
        ordered = sorted(atoms.items(), key=lambda kv: (axis_of(kv[0][3]), kv[0][3], wrap_rank(kv[0][0], extra),
                                                       kv[0][2]))
        classes[eid] = [names[(w, l, p, pr, v)] for (w, l, p, pr), (v, _) in ordered]
    VOCAB.mkdir(exist_ok=True)
    (VOCAB / "element_classes.json").write_text(json.dumps(classes, indent=0), encoding="utf-8")
    (VOCAB / "dynamic.json").write_text(json.dumps(dynamic, indent=1, ensure_ascii=False), encoding="utf-8")

    by_axis = defaultdict(list)
    for key, name in names.items():
        by_axis[axis_of(key[3])].append((usage[name], name, key))
    (VOCAB / "vocabulary.md").write_text(vocabulary_report(elem, names, usage, by_axis), encoding="utf-8")

    print(f"{len(elem)} elements, {sum(len(a) for a in elem.values())} declarations -> {len(names)} classes "
          f"({sum(1 for n in names.values() if usage[n] == 1)} used once)")
    for a in sheets:
        print(f"  design/{a}.css: {len(by_axis[a])} classes")
    print(f"  design/globals-<document>.css: {len(globals_)} files, {sum(len(r) for r in globals_.values())} rules; "
          f"dynamic per-post rules: {len(dynamic)}")
    print(f"order conflicts (a media query overrides differently in the new order): {len(oc)}")
    for c in oc[:6]:
        print("   ", c)
    print(f"shorthand and longhand set together: {len(sc)}")
    for c in sc[:6]:
        print("   ", c)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
