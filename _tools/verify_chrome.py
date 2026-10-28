"""Stage 1 check: everything around a page's own content, against the reference.

For every page of the reference that WordPress has, the parts that are the same on every
page: the page transition, the skip link, the header, the footer, the cookie bar, the
language switcher and the cookie settings window. Each part is compared element by
element (tag, every attribute, every piece of text), after WordPress's addresses are
written the way the reference writes them (wpsite.as_reference). Also compared: the order
of those parts in the page, the stylesheets (every one, in order) and the scripts.

The loading hints of pictures (loading, decoding, fetchpriority) are counted apart: they
decide when a picture downloads, not how it looks, and WordPress decides them by its own
rules where live followed Elementor's (README, "Deliberate differences").

Pages WordPress does not have yet are counted and named, not passed: the home page comes
in stage 3, because live builds its header and footer into the home page's own sections;
the blog's second page with the pager, in stage 5.

    python -u _tools/verify_chrome.py [name ...]
"""

import re
import sys

from common import pages
from wpsite import (HINTS, as_reference, compare_trees, elements, fetch, known_paths, parse,
                    reference, wp_path)

PARTS = [
    ("transition", "./e-page-transition"),
    ("skip link", "./a[contains(concat(' ', @class, ' '), ' skip-link ')]"),
    ("header", ".//header[@data-elementor-type='header']"),
    ("footer", ".//footer[@data-elementor-type='footer']"),
    ("cookie bar", ".//aside[@id='moove_gdpr_cookie_info_bar']"),
    ("language", ".//div[contains(concat(' ', @class, ' '), ' wpml-ls-statics-footer ')]"),
    ("cookie window", ".//dialog[@id='moove_gdpr_cookie_modal']"),
]

# WordPress's own inline styles and scripts that may stay, with why.
ALLOWED_STYLES = {
    "wp-img-auto-sizes-contain-inline-css": "core's size hint for lazy pictures with sizes=auto; no element of the reference has one",
    "core-block-supports-inline-css": "core's layout rules for blocks; empty until pages have blocks",
}
ALLOWED_SCRIPTS = {"speculationrules": "core's prefetch rules, which live prints too"}

LATER = {"index": "stage 3: live builds the home page's header and footer into its own sections",
         "blog-2": "stage 5: the blog's second page comes with the pager"}


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
        return None, f"WordPress answers {status}", []
    wp, ref = parse(text), reference(page["name"])
    wp_body, ref_body = wp.xpath("//body")[0], ref.xpath("//body")[0]
    problems, hints, counted = [], [], 0

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
        diff, hint = compare_trees(w, r, known)
        problems += [f"{role} {d}" for d in diff]
        hints += [f"{role} {d}" for d in hint]

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
    return counted, problems, hints


def main(only):
    known = known_paths()
    rows, later = [], []
    for page in pages():
        if only and page["name"] not in only:
            continue
        if page["name"] in LATER:
            later.append((page["name"], LATER[page["name"]]))
            continue
        counted, problems, hints = check(page, known)
        if counted is None:
            later.append((page["name"], problems + ", not in WordPress yet"))
            continue
        rows.append((page["name"], counted, problems, hints))

    for name, counted, problems, hints in rows:
        print(f"{'OK  ' if not problems else 'DIFF'} {name[:60]:60} {counted} elements" +
              (f", {len(problems)} differences" if problems else "") +
              (f", {len(hints)} loading hints" if hints else ""))
        for p in problems[:8]:
            print("       ", p)
        for p in hints[:3]:
            print("        hint:", p)
    if later:
        print(f"\nnot checked yet ({len(later)}):")
        for name, why in later:
            print(f"     {name[:60]:60} {why}")
    bad = sum(1 for _, _, p, _ in rows if p)
    hinted = sum(1 for _, _, _, h in rows if h)
    print(f"\nchrome: {len(rows)} pages checked, {sum(c for _, c, _, _ in rows)} elements - {bad} of {len(rows)} pages differ"
          f" ({len(later)} pages not in WordPress yet; loading hints differ on {hinted} pages: "
          f"{sum(len(h) for _, _, _, h in rows)} attributes)")
    return 1 if bad or not rows else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(set(sys.argv[1:])))
