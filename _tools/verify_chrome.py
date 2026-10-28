"""Stage 1 check: everything around a page's own content, against the reference.

For every page of the reference that WordPress has, the parts that are the same on every
page: the page transition, the skip link, the header, the footer, the cookie bar, the
language switcher and the cookie settings window. Each part is compared element by
element (tag, every attribute, every piece of text), after WordPress's addresses are
written the way the reference writes them (wpsite.as_reference). Also compared: the order
of those parts in the page, the stylesheets (every one, in order) and the scripts.

Pages WordPress does not have yet are counted and named, not passed: the posts and items
arrive in stage 2; the home page in stage 3, because live builds its header and footer
into the home page's own sections.

    python -u _tools/verify_chrome.py [name ...]
"""

import re
import sys

from common import pages
from wpsite import (LIVE_ADMIN, LOCAL_ADMIN, as_reference, fetch, known_paths, parse,
                    reference, srcset_as_reference, wp_path)

PARTS = [
    ("transition", "./e-page-transition"),
    ("skip link", "./a[contains(concat(' ', @class, ' '), ' skip-link ')]"),
    ("header", ".//header[@data-elementor-type='header']"),
    ("footer", ".//footer[@data-elementor-type='footer']"),
    ("cookie bar", ".//aside[@id='moove_gdpr_cookie_info_bar']"),
    ("language", ".//div[contains(concat(' ', @class, ' '), ' wpml-ls-statics-footer ')]"),
    ("cookie window", ".//dialog[@id='moove_gdpr_cookie_modal']"),
]
URL_ATTRS = ("href", "src", "poster", "preloader-image-url")

# WordPress's own inline styles and scripts that may stay, with why.
ALLOWED_STYLES = {
    "wp-img-auto-sizes-contain-inline-css": "core's size hint for lazy pictures with sizes=auto; no element of the reference has one",
    "core-block-supports-inline-css": "core's layout rules for blocks; empty until pages have blocks",
}
ALLOWED_SCRIPTS = {"speculationrules": "core's prefetch rules, which live prints too"}

LATER = {"index": "stage 3: live builds the home page's header and footer into its own sections",
         "blog-2": "stage 5: the blog's second page comes with the pager"}


def norm_text(s):
    return re.sub(r"\s+", " ", s or "")


def norm_attrs(el, known):
    out = {}
    for k, v in el.attrib.items():
        if k in URL_ATTRS:
            v = as_reference(v, known)
        elif k == "srcset":
            v = srcset_as_reference(v, known)
        elif k == "exclude":
            v = v.replace(LOCAL_ADMIN, LIVE_ADMIN)
        elif k == "class":
            v = " ".join(sorted(v.split()))
        out[k] = v
    return out


def elements(root):
    return [e for e in root.iter() if isinstance(e.tag, str)]


def compare_part(wp, ref, known):
    """Differences between two copies of one part, described; [] when they are the same."""
    a, b = elements(wp), elements(ref)
    if len(a) != len(b):
        tags = lambda els: [e.tag for e in els]
        first = next((i for i, (x, y) in enumerate(zip(tags(a), tags(b))) if x != y), min(len(a), len(b)))
        return [f"{len(a)} elements, the reference {len(b)}; first different at #{first}: "
                f"{a[first].tag if first < len(a) else '-'} / {b[first].tag if first < len(b) else '-'}"]
    out = []
    for i, (x, y) in enumerate(zip(a, b)):
        if x.tag != y.tag:
            out.append(f"#{i}: <{x.tag}> where the reference has <{y.tag}>")
            continue
        ax, ay = norm_attrs(x, known), norm_attrs(y, known)
        for k in sorted(set(ax) | set(ay)):
            if ax.get(k) != ay.get(k):
                out.append(f"#{i} <{x.tag}> {k}: {str(ax.get(k))[:90]!r} / reference {str(ay.get(k))[:90]!r}")
        if norm_text(x.text) != norm_text(y.text):
            out.append(f"#{i} <{x.tag}> text: {norm_text(x.text)[:60]!r} / reference {norm_text(y.text)[:60]!r}")
        if i and norm_text(x.tail) != norm_text(y.tail):
            out.append(f"#{i} </{x.tag}> followed by {norm_text(x.tail)[:40]!r} / reference {norm_text(y.tail)[:40]!r}")
    return out


def part_order(body, found):
    order = []
    for child in body:
        for role, el in found.items():
            if el is child:
                order.append(role)
    return order


def stylesheets(doc, known):
    return [as_reference(l.get("href"), known) for l in doc.xpath("//head/link[@rel='stylesheet']")]


def check(page, known):
    status, text = fetch(wp_path(page))
    expected = 404 if page["name"] == "404" else 200
    if status != expected:
        return None, f"WordPress answers {status}"
    wp, ref = parse(text), reference(page["name"])
    wp_body, ref_body = wp.xpath("//body")[0], ref.xpath("//body")[0]
    problems, counted = [], 0

    found_wp = {role: (wp_body.xpath(xp) or [None])[0] for role, xp in PARTS}
    found_ref = {role: (ref_body.xpath(xp) or [None])[0] for role, xp in PARTS}
    for role, _ in PARTS:
        w, r = found_wp[role], found_ref[role]
        if w is None and r is None:
            continue
        if (w is None) != (r is None):
            problems.append(f"{role}: {'missing' if w is None else 'printed, the reference has none'}")
            continue
        counted += len(elements(r))
        problems += [f"{role} {d}" for d in compare_part(w, r, known)]

    if part_order(wp_body, found_wp) != part_order(ref_body, found_ref):
        problems.append(f"order {part_order(wp_body, found_wp)} / reference {part_order(ref_body, found_ref)}")

    css_wp, css_ref = stylesheets(wp, known), stylesheets(ref, known)
    if css_wp != css_ref:
        problems.append(f"stylesheets: {[h for h in css_wp if h not in css_ref]} extra, "
                        f"{[h for h in css_ref if h not in css_wp]} missing" + (" (order)" if set(css_wp) == set(css_ref) else ""))
    for style in wp.xpath("//style"):
        if style.get("id") not in ALLOWED_STYLES:
            problems.append(f"inline style {style.get('id')!r}")

    js_wp = [as_reference(s.get("src"), known) for s in wp_body.xpath(".//script[@src]")]
    js_ref = [s.get("src") for s in ref_body.xpath(".//script[@src]")]
    if js_wp != js_ref:
        problems.append(f"scripts {js_wp} / reference {js_ref}")
    for s in wp.xpath("//script[not(@src)]"):
        if s.get("type") not in ALLOWED_SCRIPTS and s.get("type") != "application/ld+json":
            problems.append(f"inline script {s.get('type') or s.get('id')!r}")
    return counted, problems


def main(only):
    known = known_paths()
    rows, later = [], []
    for page in pages():
        if only and page["name"] not in only:
            continue
        if page["name"] in LATER:
            later.append((page["name"], LATER[page["name"]]))
            continue
        counted, problems = check(page, known)
        if counted is None:
            later.append((page["name"], problems + ", not in WordPress yet (stage 2)"))
            continue
        rows.append((page["name"], counted, problems))

    for name, counted, problems in rows:
        print(f"{'OK  ' if not problems else 'DIFF'} {name[:60]:60} {counted} elements" +
              (f", {len(problems)} differences" if problems else ""))
        for p in problems[:8]:
            print("       ", p)
    if later:
        print(f"\nnot checked yet ({len(later)}):")
        for name, why in later:
            print(f"     {name[:60]:60} {why}")
    bad = sum(1 for _, _, p in rows if p)
    print(f"\nchrome: {len(rows)} pages checked, {sum(c for _, c, _ in rows)} elements - {bad} of {len(rows)} pages differ"
          f" ({len(later)} pages not in WordPress yet)")
    return 1 if bad or not rows else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(set(sys.argv[1:])))
