"""Stage C stylesheets: the live CSS, pruned to the rules this markup uses, in layers.

Every stylesheet a captured page loads (links and inline <style>, in live load order) is
parsed. A rule is kept when one of its selectors matches an element of a page that loads
it, after state pseudo-classes and runtime classes are stripped (see RUNTIME_CLASSES).
Kept rules are written, readable and in source order, to:

    assets/css/tokens.css       the kit's design tokens on :root (source names kept)
    assets/css/base.css         resets, theme and kit typography, @font-face
    assets/css/layout.css       Elementor containers, sections, columns
    assets/css/components.css   widgets, loops, carousel, forms, cookie bar
    assets/css/navigation.css   nav menu and language links
    assets/css/docs/<doc>.css   one Elementor document each (header, footer, page, loop
                                item, single template): its per-element design
    assets/css/utilities.css    responsive visibility and the site's custom CSS
    assets/css/animations.css   entrance keyframes, motion effects

Pages load them in that order (common.CSS_LAYERS, then their docs in live order).
Media queries stay where the source put them inside each file, so the cascade inside a
file is the live one. Custom properties nobody reads, @keyframes nobody names and
@font-face for unused families are dropped.

Usage:
    python -u _tools/build_css.py

Writes _capture/css_map.json (per page: the docs it loads) and prints counts.
"""

import json
import re
import sys
from collections import OrderedDict, defaultdict
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

import tinycss2
from cssselect import GenericTranslator, SelectorError
from lxml import html as lxml_html

from common import CAPTURE, ROOT, SITE, pages

OUT = ROOT / "assets" / "css"
SOURCE = ROOT / "_source"

# Classes and attributes that scripts add or toggle after load: present for matching.
RUNTIME_CLASSES = {
    "elementor-active", "highlighted", "has-submenu", "sub-arrow", "animated",
    "elementor-invisible", "e-lazyloaded", "elementor-item-active", "elementor-sticky--active",
    "swiper-slide-active", "swiper-slide-next", "swiper-slide-prev", "swiper-slide-duplicate",
    "swiper-slide-visible", "swiper-pagination-bullet-active", "swiper-button-disabled",
    "swiper-initialized", "swiper-horizontal", "swiper-backface-hidden", "swiper-pointer-events",
    "swiper-container-initialized", "swiper-container-horizontal", "swiper-lock",
    "swiper-pagination-bullets", "swiper-pagination-horizontal", "swiper-pagination-clickable",
    "active", "active-thumb", "active-content", "show", "open", "visible", "e-active",
    "elementor-motion-effects-element", "elementor-motion-effects-element-type-background",
    "elementor-motion-effects-container", "elementor-motion-effects-layer",
    "elementor-motion-effects-parent", "moove-gdpr-info-bar-hidden", "mgbutton",
    "e-page-transition--entering", "e-page-transition--exiting", "e-page-transition--entered",
    "e-page-transition--preloader", "elementor-nav-menu--toggle", "elementor-menu-toggle",
    "menu-item-has-children", "current-menu-item", "current-menu-ancestor", "current-menu-parent",
    "current_page_item", "current_page_ancestor", "elementor-item-anchor",
}
STATE_PSEUDO = re.compile(
    r"::?(?:hover|focus-visible|focus-within|focus|active|visited|link|checked|disabled|enabled|"
    r"target|placeholder-shown|placeholder|before|after|selection|marker|first-letter|first-line|"
    r"-webkit-[a-z-]+|-moz-[a-z-]+|-ms-[a-z-]+|invalid|valid|required|optional|read-only|"
    r"autofill|backdrop|file-selector-button|indeterminate|default|focus-ring|"
    r"cue|scrollbar[a-z-]*)(?![\w-])(?:\([^)]*\))?"
)
UNSUPPORTED = re.compile(r":(?:is|where|has|dir|lang|host|matches|any)\(")

LAYER_RULES = [  # (pattern on the source id, layer); first match wins
    (r"elementor/css/post-9\.css$", "kit"),
    (r"elementor/css/post-\d+\.css$", "doc"),
    (r"^inline:loop-\d+$", "doc"),
    (r"^inline:global-styles-inline-css$", "base"),
    (r"^inline:wp-img-auto-sizes", "base"),
    (r"^inline:wp-emoji-styles", "base"),
    (r"^inline:moove_gdpr_frontend", "components"),
    (r"^inline:wpml-", "navigation"),
    (r"^inline:lazyload$", "drop"),          # background lazy loading: images load at once
    (r"google-fonts/css/", "base"),
    (r"/hello-elementor", "base"),
    (r"/wp-includes/css/dist/block-library", "base"),
    (r"custom-css-js/1399\.css$", "utilities"),
    (r"custom-css-js/", "components"),
    (r"/(sitepress-multilingual-cms|wpml-cms-nav)/", "navigation"),
    (r"widget-nav-menu", "navigation"),
    (r"/animations/", "animations"),
    (r"motion-fx", "animations"),
    (r"elementor/assets/css/frontend", "layout"),
    (r"/wp-content/plugins/", "components"),
]
LAYERS = ["tokens", "base", "layout", "components", "navigation", "utilities", "animations"]


def source_id(href):
    return unquote(urlsplit(href).path)


def layer_of(sid):
    for pat, layer in LAYER_RULES:
        if re.search(pat, sid):
            return layer
    return "components"


def local_source(sid):
    """Readable copy of a stylesheet: the unminified file when the server had one."""
    p = SOURCE / sid.lstrip("/")
    plain = p.with_name(p.name.replace(".min.", "."))
    if plain != p and plain.exists():
        return plain
    return p


def page_sheets(raw_html):
    """Stylesheets of one page in document order: ('link', id) or ('inline', id, css)."""
    doc = lxml_html.fromstring(raw_html)
    out = []
    for el in doc.xpath("//link[@rel='stylesheet'] | //style"):
        if el.tag == "link":
            href = el.get("href", "")
            if "harlowgroup.com" in href or href.startswith("/"):
                out.append(("link", source_id(urljoin(SITE + "/", href))))
        else:
            css = el.text or ""
            sid = el.get("id") or ("lazyload" if "e-lazyloaded" in css else "")
            if not sid:
                sid = "anon-" + str(abs(hash(css)) % 10**8)
            out.append(("inline", sid, css))
    return out


def merge_order(sequences):
    """One load order that respects every page's order (first-seen insertion)."""
    order = []
    for seq in sequences:
        prev = None
        for item in seq:
            if item in order:
                prev = item
                continue
            pos = order.index(prev) + 1 if prev in order else len(order)
            order.insert(pos, item)
            prev = item
    return order


def split_selectors(prelude):
    out, depth, cur = [], 0, ""
    for ch in prelude:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


_xpath_cache = {}


def to_xpath(sel):
    if sel in _xpath_cache:
        return _xpath_cache[sel]
    s = STATE_PSEUDO.sub("", sel)
    for cls in RUNTIME_CLASSES:
        s = re.sub(r"\." + re.escape(cls) + r"(?![\w-])", "", s)
    s = re.sub(r"\[(open|aria-expanded[^\]]*|aria-hidden[^\]]*|data-e-active[^\]]*)\]", "", s)
    s = re.sub(r"(^|[\s>+~(,])(?=[\s>+~),]|$)", r"\1*", s).strip()  # orphaned combinators
    s = re.sub(r":not\(\s*\*?\s*\)", "", s)
    if not s or s in ("*",) or UNSUPPORTED.search(s):
        _xpath_cache[sel] = True if (not s or s == "*" or UNSUPPORTED.search(s)) else None
        return _xpath_cache[sel]
    try:
        xp = GenericTranslator().css_to_xpath(s)
    except (SelectorError, Exception):
        xp = True  # cannot judge: keep the rule
    _xpath_cache[sel] = xp
    return xp


def expand_alternatives(sel):
    """`a :where(b, c) d` -> ['a b d', 'a c d'] (innermost :is/:where first)."""
    m = re.search(r":(?:where|is)\(([^()]*)\)", sel)
    if not m:
        return [sel]
    out = []
    for alt in split_selectors(m.group(1)):
        out.extend(expand_alternatives(sel[:m.start()] + alt + sel[m.end():]))
    return out


def matches(sel, docs):
    alts = expand_alternatives(sel)
    if len(alts) > 1 or alts[0] != sel:
        return any(matches(a, docs) for a in alts)
    xp = to_xpath(sel)
    if xp is True:
        return True
    if xp is None:
        return False
    for d in docs:
        try:
            if d.xpath(xp):
                return True
        except Exception:
            return True
    return False


def ser(tokens):
    return tinycss2.serialize(tokens).strip()


def rewrite_urls(css, src_sid, out_dir):
    """url() relative to the output file, pointing at assets/ copies."""
    def fix(m):
        ref = m.group(2).strip()
        if ref.startswith(("data:", "#")):
            return m.group(0)
        absu = urljoin(SITE + src_sid, ref)
        path = unquote(urlsplit(absu).path)
        if path.startswith("/wp-content/uploads/elementor/google-fonts/fonts/"):
            target = ROOT / "assets" / "fonts" / Path(path).name
        elif path.startswith("/wp-content/uploads/"):
            target = ROOT / "assets" / "uploads" / path[len("/wp-content/uploads/"):]
        else:
            target = ROOT / "assets" / "vendor" / path.lstrip("/").replace("wp-content/", "")
        rel = Path(_relpath(target, out_dir)).as_posix()
        return f'url("{rel}")'
    return re.sub(r"url\(\s*(['\"]?)([^'\")]+)\1\s*\)", fix, css)


def _relpath(target, start):
    import os
    return os.path.relpath(target, start)


class Sheet:
    """One output file: kept rules in order, media blocks where the source had them."""

    def __init__(self, name, out_dir):
        self.name, self.out_dir, self.parts = name, out_dir, []
        self.sources = []

    def add_source(self, sid):
        self.sources.append(sid)
        self.parts.append(("comment", sid))

    def add(self, media, text):
        self.parts.append(("rule", media, text))

    def render(self):
        lines = [f"/* {self.name}: generated by _tools/build_css.py from the live stylesheets."
                 " Do not edit; change the generator. */", ""]
        cur_media = None
        pending_comment = None
        for part in self.parts:
            if part[0] == "comment":
                pending_comment = part[1]
                continue
            _, media, text = part
            if media != cur_media:
                if cur_media:
                    lines.append("}")
                    lines.append("")
            if pending_comment:
                if media == cur_media and cur_media:
                    lines.append("}")
                    lines.append("")
                    cur_media = None
                lines.append(f"/* from {pending_comment} */")
                pending_comment = None
            if media != cur_media:
                if media:
                    lines.append(f"@media {media} {{")
                cur_media = media
            ind = "  " if media else ""
            lines.extend(ind + ln for ln in text.splitlines())
            lines.append("")
        if cur_media:
            lines.append("}")
        return "\n".join(lines).rstrip() + "\n"


def pretty_rule(prelude, content):
    sels = split_selectors(prelude)
    decls = []
    for d in tinycss2.parse_declaration_list(content, skip_comments=True, skip_whitespace=True):
        if d.type != "declaration":
            continue
        val = ser(d.value)
        decls.append(f"  {d.name}: {val}{' !important' if d.important else ''};")
    if not decls:
        return None
    return ",\n".join(sels) + " {\n" + "\n".join(decls) + "\n}"


def walk(rules, docs, media, emit, stats, keep_all=False):
    for rule in rules:
        if rule.type == "qualified-rule":
            prelude = ser(rule.prelude)
            stats["rules"] += 1
            sels = split_selectors(prelude)
            kept = sels if keep_all else [s for s in sels if matches(s, docs)]
            if not kept:
                stats["dropped"] += 1
                continue
            text = pretty_rule(", ".join(kept), rule.content)
            if text:
                emit(media, text)
                stats["kept"] += 1
        elif rule.type == "at-rule":
            kw = rule.lower_at_keyword
            if kw == "media":
                inner = tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True)
                m = ser(rule.prelude)
                walk(inner, docs, f"{media} and {m}" if media else m, emit, stats, keep_all)
            elif kw in ("keyframes", "-webkit-keyframes", "font-face", "supports", "font-feature-values"):
                body = ser(rule.content) if rule.content else ""
                emit(media, f"@{rule.at_keyword} {ser(rule.prelude)} {{\n{_indent_block(body)}\n}}")
            elif kw in ("charset", "import"):
                continue
            else:
                emit(media, ser([rule]))


def _indent_block(body):
    out, depth = [], 1
    for raw in re.split(r"(?<=[{};])", body):
        piece = raw.strip()
        if not piece:
            continue
        if piece == "}":
            depth -= 1
            out.append("  " * depth + "}")
            continue
        out.append("  " * depth + piece)
        if piece.endswith("{"):
            depth += 1
    return "\n".join(out)


def prune_unused(text_by_file, inline_css):
    """Drop custom properties, keyframes and font faces nothing refers to."""
    changed = True
    while changed:
        changed = False
        everything = "\n".join(text_by_file.values()) + inline_css
        used_vars = set(re.findall(r"var\(\s*(--[\w-]+)", everything))
        used_anims = set()
        for m in re.finditer(r"animation(?:-name)?\s*:\s*([^;]+);", everything):
            used_anims |= set(re.findall(r"[A-Za-z][\w-]*", m.group(1)))
        used_fonts = set()
        for m in re.finditer(r"font-family\s*:\s*([^;]+);", everything):
            used_fonts |= {f.strip(" '\"").lower() for f in m.group(1).split(",")}
        for name, text in list(text_by_file.items()):
            new = re.sub(r"^\s*(--[\w-]+)\s*:[^;]*;\n",
                         lambda m: m.group(0) if m.group(1) in used_vars else "",
                         text, flags=re.M)
            new = re.sub(r"(?ms)^(\s*)@(-webkit-)?keyframes\s+([\w-]+)\s*\{.*?^\1\}\n",
                         lambda m: m.group(0) if m.group(3) in used_anims or m.group(3) in JS_ANIMS else "",
                         new)
            new = re.sub(r"(?ms)^(\s*)@font-face\s*\{(.*?)^\1\}\n",
                         lambda m: m.group(0) if _ff_family(m.group(2)) in used_fonts else "",
                         new)
            new = re.sub(r"(?m)^([^\n{}@][^{}\n]*\{)\n\}\n", "", new)  # rules left empty
            if new != text:
                text_by_file[name] = new
                changed = True
    return text_by_file


def _ff_family(body):
    m = re.search(r"font-family\s*:\s*([^;]+);", body)
    return m.group(1).strip(" '\"").lower() if m else ""


JS_ANIMS = set()  # entrance animation names set from data-settings in the markup


def main():
    items = [p for p in pages() if (CAPTURE / "dom" / f"{p['name']}.html").exists()]
    missing = len(pages()) - len(items)
    if missing:
        print(f"WARNING: {missing} pages have no captured DOM yet; pruning uses {len(items)}")
    seqs, sheets_by_page, inline_text = [], {}, {}
    for it in items:
        raw = (CAPTURE / "raw" / f"{it['name']}.html").read_text(encoding="utf-8")
        for m in re.finditer(r"&quot;_?animation&quot;:&quot;([A-Za-z]+)&quot;", raw):
            JS_ANIMS.add(m.group(1))
        sh = page_sheets(raw)
        ids = []
        for s in sh:
            sid = s[1] if s[0] == "link" else "inline:" + s[1]
            ids.append(sid)
            if s[0] == "inline":
                inline_text[sid] = s[2]
        seqs.append(ids)
        sheets_by_page[it["name"]] = ids
    order = merge_order(seqs)

    docs_by_page = {}
    for it in items:
        dom = CAPTURE / "dom" / f"{it['name']}.html"
        raw = CAPTURE / "raw" / f"{it['name']}.html"
        docs_by_page[it["name"]] = [lxml_html.fromstring(dom.read_text(encoding="utf-8")),
                                    lxml_html.fromstring(raw.read_text(encoding="utf-8"))]
    pages_using = defaultdict(list)
    for name, ids in sheets_by_page.items():
        for sid in ids:
            pages_using[sid].append(name)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "docs").mkdir(exist_ok=True)
    out = {l: Sheet(l, OUT) for l in LAYERS}
    docs_out = OrderedDict()
    stats = defaultdict(lambda: defaultdict(int))
    report = []
    for sid in order:
        layer = layer_of(sid)
        if layer == "drop":
            report.append((sid, "dropped (lazy loading)", 0, 0))
            continue
        if sid.startswith("inline:"):
            css = inline_text[sid]
        else:
            p = local_source(sid)
            if not p.exists():
                report.append((sid, "MISSING SOURCE", 0, 0))
                continue
            css = p.read_text(encoding="utf-8", errors="replace")
        doc_dom = [d for n in pages_using[sid] for d in docs_by_page[n]]
        rules = tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True)
        st = stats[sid]
        if layer == "doc":
            key = ("loop-" + sid.split("-")[-1]) if sid.startswith("inline:") else \
                Path(sid).stem
            sheet = docs_out.setdefault(key, Sheet(f"docs/{key}", OUT / "docs"))
            sheet.add_source(sid)
            walk(rules, doc_dom, None, lambda m, t: sheet.add(m, rewrite_urls(t, sid, OUT / "docs")), st)
        elif layer == "kit":
            out["tokens"].add_source(sid)
            out["base"].add_source(sid)
            def emit_kit(m, t, sid=sid):
                body = t
                # the kit's custom properties become :root tokens, the rest is typography
                if body.startswith(".elementor-kit-9 {") and not m:
                    props = [ln for ln in body.splitlines() if ln.strip().startswith("--")]
                    other = [ln for ln in body.splitlines()[1:-1] if not ln.strip().startswith("--")]
                    if props:
                        out["tokens"].add(None, ":root {\n" + "\n".join(props) + "\n}")
                    if other:
                        out["base"].add(None, ".elementor-kit-9 {\n" + "\n".join(other) + "\n}")
                    return
                out["base"].add(m, rewrite_urls(body, sid, OUT))
            walk(rules, doc_dom, None, emit_kit, st)
        else:
            sheet = out[layer]
            sheet.add_source(sid)
            walk(rules, doc_dom, None, lambda m, t: sheet.add(m, rewrite_urls(t, sid, OUT)), st)
        report.append((sid, layer, st["kept"], st["rules"]))

    texts = {f"{l}.css": out[l].render() for l in LAYERS}
    for key, sh in docs_out.items():
        texts[f"docs/{key}.css"] = sh.render()
    inline_styles = ""
    for it in items:
        inline_styles += (CAPTURE / "raw" / f"{it['name']}.html").read_text(encoding="utf-8")
    texts = prune_unused(texts, " ".join(re.findall(r'style="([^"]*)"', inline_styles)))
    for name, text in texts.items():
        (OUT / name).write_text(text, encoding="utf-8")

    css_map = {}
    for it in items:
        docs = []
        for sid in sheets_by_page[it["name"]]:
            if layer_of(sid) == "doc":
                key = ("loop-" + sid.split("-")[-1]) if sid.startswith("inline:") else Path(sid).stem
                if key not in docs:
                    docs.append(key)
        css_map[it["name"]] = docs
    (CAPTURE / "css_map.json").write_text(json.dumps(css_map, indent=1), encoding="utf-8")

    total_kept = sum(r[2] for r in report)
    total = sum(r[3] for r in report)
    for sid, layer, kept, n in report:
        print(f"{layer:12} {kept:5}/{n:<5} {sid}")
    print(f"\n{len(order)} source stylesheets, {total} rules read, {total_kept} kept "
          f"in {len(LAYERS)} layers + {len(docs_out)} docs")
    for name in texts:
        print(f"  {name:28} {len(texts[name].splitlines()):6} lines")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
