"""Computed styles against live, every page: one row per page and width.

For every [data-id] element and the element inside it that carries its text or image,
compares the properties in style_diff.PROPS (box, typography, colour, background) between
live and the clone. Elements inside carousels and the header logo (whose size changes
with the scroll script) are compared like the rest; differences are listed by property.

Usage:
    python -u _tools/style_check.py [name ...]

Passing looks like: `N elements x 2 widths checked - 0 of M pages differ`.
"""

import asyncio
import json
import subprocess
import sys
import time
from collections import Counter, defaultdict

from playwright.async_api import async_playwright

from common import CAPTURE, HEIGHT, ROOT, UA, WIDTHS, pages
from compare import FREEZE_TIMERS
from style_diff import PROPS, collect

PORT = 8769
PARTIAL = CAPTURE / "style_check.partial.json"
PX_TOLERANCE = 0.5          # sub-pixel text metrics differ between runs on both sides
HEADER_ANIMATED = {"background-color", "width", "height"}   # set by header.js with a transition


def same(prop, a, b, header):
    if a == b:
        return True
    if header and prop in HEADER_ANIMATED:
        return True
    if a.endswith("px") and b.endswith("px"):
        try:
            return abs(float(a[:-2]) - float(b[:-2])) <= PX_TOLERANCE
        except ValueError:
            return False
    return False


def keyed(rows):
    seen = defaultdict(int)
    out = {}
    for e in rows:
        out[(e["id"], seen[e["id"]])] = e
        seen[e["id"]] += 1
    return out


async def run(items):
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                              cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    # results are kept after every page, so a dropped connection resumes where it stopped
    out = {}
    if PARTIAL.exists():
        for key, v in json.loads(PARTIAL.read_text(encoding="utf-8")).items():
            name, w = key.rsplit("@", 1)
            out[(name, int(w))] = (v[0], Counter(v[1]), v[2])
        print(f"resuming: {len(out)} page-widths already measured")
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            for w in WIDTHS:
                ctx = await browser.new_context(viewport={"width": w, "height": HEIGHT}, user_agent=UA)
                first = await ctx.new_page()
                await first.goto(items[0]["url"], wait_until="load", timeout=90000)
                try:
                    await first.click(".moove-gdpr-infobar-allow-all", timeout=8000)
                except Exception:
                    pass
                await first.close()
                await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
                # both sides: the history slider stays on its first slide (live's own script
                # and the clone's module both use setInterval 9s)
                await ctx.add_init_script(FREEZE_TIMERS)
                for it in items:
                    if (it["name"], w) in out:
                        continue
                    live = keyed(await collect(ctx, it["url"], True))
                    clone = keyed(await collect(ctx, f"http://127.0.0.1:{PORT}/{it['name']}.html", False))
                    bad = Counter()
                    examples = {}
                    checked = 0
                    for k, e in live.items():
                        if e["timed"]:
                            continue
                        o = clone.get(k)
                        if not o:
                            bad["(missing)"] += 1
                            continue
                        checked += 1
                        for part in ("own",) if e.get("innerTimed") else ("own", "inner"):
                            in_header = e["header"] if part == "own" else e.get("innerHeader", False)
                            for p, a, b in zip(PROPS, e[part], o[part]):
                                # an element that draws nothing: its visibility only says whether
                                # the entrance-animation observer has run yet (varies on live)
                                if p == "visibility" and e.get("empty") and o.get("empty"):
                                    continue
                                if not same(p, a, b, in_header):
                                    bad[f"{part}.{p}"] += 1
                                    examples.setdefault(f"{part}.{p}", (k[0], a, b))
                    out[(it["name"], w)] = (checked, bad, examples)
                    PARTIAL.write_text(json.dumps(
                        {f"{k[0]}@{k[1]}": [v[0], dict(v[1]), v[2]] for k, v in out.items()},
                        ensure_ascii=False), encoding="utf-8")
                await ctx.close()
            await browser.close()
    finally:
        server.terminate()
    return out


def main(only):
    items = [p for p in pages() if (not only or p["name"] in only) and (ROOT / f"{p['name']}.html").exists()]
    res = asyncio.run(run(items))
    differ = set()
    total = 0
    print(f"{'page':58} {'w':>4} {'els':>5} {'props off':>9}  first differences")
    for (name, w), (n, bad, ex) in sorted(res.items(), key=lambda x: (x[0][1] != 1440, x[0][0])):
        total += n
        if bad:
            differ.add(name)
        first = "; ".join(f"{p} x{c} ({ex[p][0]}: {ex[p][1]!r} -> {ex[p][2]!r})" for p, c in bad.most_common(2))
        print(f"{name[:58]:58} {w:>4} {n:>5} {sum(bad.values()):>9}  {first[:160]}")
    out_file = CAPTURE / "style_check.json"
    merged = json.loads(out_file.read_text(encoding="utf-8")) if only and out_file.exists() else {}
    merged.update({f"{k[0]}@{k[1]}": {"elements": v[0], "bad": dict(v[1]), "examples": v[2]}
                   for k, v in res.items()})   # a run on some pages updates only their rows
    out_file.write_text(json.dumps(merged, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"\n{total} elements x {len(PROPS) * 2} properties checked over {len(WIDTHS)} widths - "
          f"{len(differ)} of {len(items)} pages differ")
    if PARTIAL.exists():
        PARTIAL.unlink()   # the run completed: the next one starts fresh


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(set(sys.argv[1:]))
