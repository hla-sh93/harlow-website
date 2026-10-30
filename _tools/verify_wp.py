"""Stages 3 and 5: each page's own content on WordPress against the reference, element by
element.

For each of the 49 pages, the page's content is compared with the reference's: a page's
Elementor document (the element that holds its sections), an item page's single template
(stage 5), the 404 page's main element (at an address that does not exist, answered 404):
tag, every attribute, every piece of text and the white space between elements, with
WordPress's addresses written the reference's way (wpsite.as_reference). The lists inside
compare their cards too (stage 2). Also compared: the elements directly in <body>, in
order (header, document, footer, cookie bar, ...). Loading hints are counted apart.

The reference prints Contact Form 7's spinner after each submit button, because it has no
script; on WordPress, as on live, CF7's script adds it to the page. That stand-in is taken
out of the reference before comparing, and counted.

One difference is accepted, by name: on live's home page Rank Math gave five links of the
footer a new tab and nofollow, a side effect of the footer being part of that page's
content; the home page here prints its footer as every page does (README, "Deliberate
differences"). Those attributes are counted as accepted, not passed over.

With --space (pages saved through the editor, verify_editor.py --save), a difference only
in the white space between elements is counted apart; whether it is drawn is
verify_render.py's to say.

    python -u _tools/verify_wp.py [--space] [name ...]
"""

import re
import sys

from common import pages
from wpsite import compare_trees, elements, fetch, known_paths, parse, reference, wp_path

DOCUMENT = "//body/*[@data-elementor-type='wp-page' or @data-elementor-type='single-page'] | //body/main"


def body_outline(doc):
    """The elements directly in <body>: tag and the first class, scripts and styles left out."""
    out = []
    for el in doc.xpath("//body")[0]:
        if not isinstance(el.tag, str) or el.tag in ("script", "style", "link", "noscript"):
            continue
        out.append(f"{el.tag}.{(el.get('class') or '').split()[0] if el.get('class') else ''}")
    return out


def accepted(name, doc, lines):
    """(differences, accepted): the home page's footer links' rel and target are accepted."""
    if name != "index":
        return lines, []
    els = elements(doc)
    footer = doc.xpath(".//footer[@data-elementor-type='footer']")
    if not footer:
        return lines, []
    inside = {i for i, e in enumerate(els) if e is footer[0] or footer[0] in e.iterancestors()}
    keep, ok = [], []
    for line in lines:
        m = re.match(r"#(\d+) <a> (rel|target):", line)
        (ok if m and int(m.group(1)) in inside else keep).append(line)
    return keep, ok


def without_spinners(ref):
    """The reference's stand-ins for CF7's spinner (its script adds one after the submit
    button on WordPress and on live), taken out; how many."""
    found = ref.xpath(".//span[@class='wpcf7-spinner'][preceding-sibling::*[1][contains(@class, 'wpcf7-submit')]]")
    for span in found:
        parent, before = span.getparent(), span.getprevious()
        before.tail = (before.tail or "") + (span.tail or "")
        parent.remove(span)
    return len(found)


def main(only, space=False):
    known = known_paths()
    rows, accepts, spaces, spinners = [], {}, [], 0
    for page in pages():
        name = page["name"]
        if only and name not in only:
            continue
        status, text = fetch(wp_path(page))
        if status != (404 if name == "404" else 200):
            rows.append((name, 0, [f"WordPress answers {status}"], []))
            continue
        wp, ref = parse(text), reference(name)
        problems, hints = [], []
        got, want = wp.xpath(DOCUMENT), ref.xpath(DOCUMENT)
        if len(got) != 1 or len(want) != 1:
            rows.append((name, 0, [f"{len(got)} contents, the reference {len(want)}"], []))
            continue
        spinners += without_spinners(want[0])
        diff, hint = compare_trees(got[0], want[0], known, spaces if space else None)
        diff, ok = accepted(name, want[0], diff)
        problems += diff
        hints += hint
        accepts[name] = ok
        if body_outline(wp) != body_outline(ref):
            problems.append(f"body: {body_outline(wp)} / reference {body_outline(ref)}")
        rows.append((name, len(elements(want[0])), problems, hints))

    bad = 0
    for name, n, problems, hints in rows:
        bad += bool(problems)
        print(f"{'OK  ' if not problems else 'DIFF'} {name[:44]:44} {n:5} elements" +
              (f", {len(problems)} differences" if problems else "") + (f", {len(hints)} loading hints" if hints else "") +
              (f", {len(accepts.get(name, []))} accepted (the footer's links on live's home page)" if accepts.get(name) else ""))
        for p in problems[:8]:
            print("       ", p[:240])
    print(f"\npages: {len(rows)} pages, {sum(r[1] for r in rows)} elements - {bad} of {len(rows)} pages differ "
          f"(loading hints differ on {sum(1 for r in rows if r[3])} pages: {sum(len(r[3]) for r in rows)} attributes; "
          f"{sum(len(v) for v in accepts.values())} accepted; {spinners} form spinners left to CF7's script)"
          + (f"; white space between elements differs in {len(spaces)} places" if space else ""))
    return 1 if bad or not rows else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main({a for a in sys.argv[1:] if not a.startswith("--")}, "--space" in sys.argv))
