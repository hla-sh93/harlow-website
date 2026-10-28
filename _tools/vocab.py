"""Stage R, step 1: the site's design as Elementor stored it, counted.

Elementor keeps the design per element: each element id has its own rules in the
document's stylesheet. This reads every such rule from assets/css/docs/*.css, attaches
it to the element it designs (type from the captured DOM), and groups elements whose
rules are identical (same media queries, same selector tail, same declarations) into
"designs". Prints how many designs there are per kind of element and how often each is
used, and writes _vocab/designs.json for the next steps.

Usage:
    python -u _tools/vocab.py
"""

import glob
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import tinycss2
from lxml import html as lxml_html

from common import CAPTURE, ROOT, pages

OUT = ROOT / "_vocab"
# .elementor-<doc> .elementor-element.elementor-element-<id>  (loop items: .e-loop-item-<post> in front)
ELEM = re.compile(r"(?:\.e-loop-item-(?P<post>\d+) )?\.elementor-(?P<doc>\d+)? ?\.elementor-element\."
                  r"elementor-element-(?P<id>[0-9a-f]{7})(?P<tail>[^,{]*)")
ELEM_ALT = re.compile(r"\.elementor-element-(?P<id>[0-9a-f]{7})")


def ser(tokens):
    return tinycss2.serialize(tokens).strip()


def decls(content):
    out = []
    for d in tinycss2.parse_declaration_list(content, skip_comments=True, skip_whitespace=True):
        if d.type == "declaration":
            out.append(f"{d.name}: {ser(d.value)}{' !important' if d.important else ''}")
    return tuple(out)


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


def element_rules(path):
    """Yield (element id, doc, media wrap, tail, declarations, raw selector) per element rule."""
    text = path.read_text(encoding="utf-8")
    rules = tinycss2.parse_stylesheet(text, skip_comments=True, skip_whitespace=True)

    def walk(nodes, wrap):
        for r in nodes:
            if r.type == "qualified-rule":
                body = decls(r.content)
                for sel in split_selectors(ser(r.prelude)):
                    m = ELEM_ALT.search(sel)
                    if not m:
                        continue
                    eid = m.group("id")
                    # everything around the id, with the id masked: the "shape" of the rule
                    shape = ELEM_ALT.sub("@", sel)
                    shape = re.sub(r"\.elementor-\d+ ", ".DOC ", shape)
                    shape = re.sub(r"\.e-loop-item-\d+", ".LOOPITEM", shape)
                    yield eid, wrap, shape, body, sel
            elif r.type == "at-rule" and r.lower_at_keyword in ("media", "supports"):
                inner = tinycss2.parse_rule_list(r.content, skip_comments=True, skip_whitespace=True)
                yield from walk(inner, wrap + (f"@{r.lower_at_keyword} {ser(r.prelude)}",))

    yield from walk(rules, ())


def element_types():
    """id -> (kind, classes): kind is the widget type or 'container'."""
    types = {}
    for it in pages():
        dom = lxml_html.fromstring((CAPTURE / "dom" / f"{it['name']}.html").read_text(encoding="utf-8"))
        for el in dom.xpath("//*[@data-id]"):
            wt = el.get("data-widget_type")
            kind = wt.split(".")[0] if wt else ("container" if el.get("data-element_type") == "container"
                                                  else el.get("data-element_type", "?"))
            types.setdefault(el.get("data-id"), (kind, el.get("class", "")))
    return types


def main():
    OUT.mkdir(exist_ok=True)
    types = element_types()
    per_elem = defaultdict(list)      # id -> [(wrap, shape, decls)]
    for f in sorted(glob.glob(str(ROOT / "assets" / "css" / "docs" / "*.css"))):
        for eid, wrap, shape, body, raw in element_rules(Path(f)):
            item = (wrap, shape, body)
            if item not in per_elem[eid]:
                per_elem[eid].append(item)
    designs = defaultdict(list)       # (kind, signature) -> [ids]
    unknown = []
    for eid, rules in per_elem.items():
        kind = types.get(eid, ("?", ""))[0]
        if kind == "?":
            unknown.append(eid)
        sig = json.dumps(sorted(rules, key=lambda r: (r[0], r[1], r[2])), ensure_ascii=False)
        designs[(kind, sig)].append(eid)

    by_kind = defaultdict(list)
    for (kind, sig), ids in designs.items():
        by_kind[kind].append((len(ids), sig, ids))
    total_elems = sum(len(v) for v in per_elem.values() and [[0]] or [])
    print(f"elements with their own rules: {len(per_elem)} (of {len(types)} elements on the pages); "
          f"unknown type: {len(unknown)}")
    print(f"{'kind':26} {'elements':>8} {'designs':>8} {'used once':>10} {'top-5 share':>12}")
    summary = {}
    for kind, items in sorted(by_kind.items(), key=lambda x: -sum(i[0] for i in x[1])):
        n = sum(i[0] for i in items)
        once = sum(1 for i in items if i[0] == 1)
        top5 = sum(sorted((i[0] for i in items), reverse=True)[:5])
        print(f"{kind:26} {n:>8} {len(items):>8} {once:>10} {top5 * 100 // n:>11}%")
        summary[kind] = {"elements": n, "designs": len(items), "used_once": once}
    (OUT / "designs.json").write_text(json.dumps(
        {"summary": summary,
         "designs": [{"kind": k, "ids": ids, "rules": json.loads(sig)} for (k, sig), ids in
                     sorted(designs.items(), key=lambda x: (x[0][0], -len(x[1])))]},
        ensure_ascii=False, indent=1), encoding="utf-8")
    all_designs = sum(len(v) for v in by_kind.values())
    print(f"\n{all_designs} designs for {len(per_elem)} elements -> _vocab/designs.json")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
