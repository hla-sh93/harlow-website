"""Geometry against live: page height and every [data-id] element's box, both widths.

Serves the project root on 127.0.0.1, loads each built page in installed Chrome at
1440x900 and 479x900, settles it exactly as capture.py settled the live page (same
script, cookie bar accepted), and compares with _capture/geometry/<name>.json.

Elements are matched by data-id and their order among equal ids. Slides inside a
carousel move with autoplay and are left out; the carousel itself is compared.
A box differs when left, top, width or height is more than TOLERANCE px off.

Usage:
    python -u _tools/compare.py [name ...]

Passing looks like: `done at 1440x900 and 479x900 - 0 of N pages differ`.
"""

import asyncio
import json
import re
import subprocess
import sys
import time
from collections import defaultdict

from playwright.async_api import async_playwright

from capture import GEOMETRY, SETTLE
from common import CAPTURE, HEIGHT, ROOT, WIDTHS, pages

PORT = 8765
TOLERANCE = 1.0
IN_SLIDE = """
() => [...document.querySelectorAll('[data-id]')].map(e => !!e.closest('.swiper-slide, .swiper-wrapper'))
"""
# The data-id of the position:fixed container each element sits in (or null). Fixed boxes
# move with scrollY, so they are compared relative to that container's own top.
FIXED_ROOT = """
() => [...document.querySelectorAll('[data-id]')].map(e => {
  for (let a = e; a && a !== document.body; a = a.parentElement) {
    if (getComputedStyle(a).position === 'fixed') {
      const root = a.closest('[data-id]') || a;
      return root.dataset ? root.dataset.id : null;
    }
  }
  return null;
})
"""


def index_boxes(geo, skip):
    seen = defaultdict(int)
    out = {}
    for el, s in zip(geo["els"], skip):
        key = (el["id"], seen[el["id"]])
        seen[el["id"]] += 1
        if not s:
            out[key] = el
    return out


def live_skip(geo):
    """Live geometry has no in-slide flag: recompute it from the live DOM order."""
    return [False] * len(geo["els"])


# Timed parts change the layout: the home page's history slider sizes its section by the
# active slide's text. Long timers (autoplay, >= 5s) are stopped on the clone, and the
# slider is put on the slide the live baseline was captured on, by clicking its thumbnail.
FREEZE_TIMERS = """
(() => { const real = window.setInterval;
  window.setInterval = (fn, ms, ...a) => (ms >= 5000 ? 0 : real(fn, ms, ...a)); })();
"""


def baseline_slide(name):
    """Index of the history slide that was showing when live was captured (or None)."""
    dom = (CAPTURE / "dom" / f"{name}.html").read_text(encoding="utf-8")
    shown = re.findall(r'class="history_slide history_slide_(\d+)"[^>]*style="opacity: 1;', dom)
    return int(shown[0]) if shown else None


async def measure(ctx, url, slide=None):
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:160]))
    await page.goto(url, wait_until="load", timeout=90000)
    await page.evaluate(SETTLE)
    if slide:
        await page.evaluate(f"document.querySelectorAll('.thumb-wrapper')[{slide}].click()")
        await page.wait_for_timeout(2500)   # 1s delay, .7s + .3s text swap, .6s fade
    geo = await page.evaluate(GEOMETRY)
    skip = await page.evaluate(IN_SLIDE)
    fixed = await page.evaluate(FIXED_ROOT)
    await page.close()
    return geo, skip, fixed, errors


def relative_to_fixed(boxes, roots):
    """Top of each box in a fixed container, measured from that container's top."""
    tops = {}
    for key, el in boxes.items():
        if key[1] == 0:
            tops.setdefault(el["id"], el["box"][1])
    out = {}
    for key, el in boxes.items():
        root = roots.get(key)
        if root and root in tops:
            box = list(el["box"])
            box[1] = round(box[1] - tops[root], 1)
            el = {**el, "box": box}
        out[key] = el
    return out


async def run(items):
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                              cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    results = {}
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            for w in WIDTHS:
                ctx = await browser.new_context(viewport={"width": w, "height": HEIGHT},
                                                device_scale_factor=1)
                await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
                await ctx.add_init_script(FREEZE_TIMERS)
                for it in items:
                    live = json.loads((CAPTURE / "geometry" / f"{it['name']}.json").read_text(encoding="utf-8"))[str(w)]
                    url = f"http://127.0.0.1:{PORT}/{it['name']}.html"
                    slide = live.get("slide", baseline_slide(it["name"]) if w == WIDTHS[0] else None)
                    geo, skip, fixed, errors = await measure(ctx, url, slide)
                    # the live list has the same order; mark its in-slide elements from the clone's ids
                    slide_ids = {el["id"] for el, s in zip(geo["els"], skip) if s}
                    lskip = [el["id"] in slide_ids for el in live["els"]]
                    a = index_boxes(live, lskip)
                    b = index_boxes(geo, skip)
                    seen = defaultdict(int)
                    roots = {}
                    for el, r in zip(geo["els"], fixed):
                        roots[(el["id"], seen[el["id"]])] = r
                        seen[el["id"]] += 1
                    a, b = relative_to_fixed(a, roots), relative_to_fixed(b, roots)
                    diffs = []
                    for key, el in a.items():
                        other = b.get(key)
                        if other is None:
                            diffs.append((key, "missing", 999))
                            continue
                        if el["shown"] != other["shown"]:
                            diffs.append((key, "shown", 999))
                            continue
                        # a 0x0 box draws nothing; its reported position is only the scroll offset
                        if el["box"][2:] == [0, 0] and other["box"][2:] == [0, 0]:
                            continue
                        d = max(abs(x - y) for x, y in zip(el["box"], other["box"]))
                        if d > TOLERANCE:
                            diffs.append((key, f"{el['box']} -> {other['box']}", d))
                    extra = [k for k in b if k not in a]
                    results[(it["name"], w)] = {
                        "live_h": live["height"], "clone_h": geo["height"],
                        "compared": len(a), "diffs": sorted(diffs, key=lambda x: -x[2]),
                        "extra": extra, "errors": errors,
                    }
                await ctx.close()
            await browser.close()
    finally:
        server.terminate()
    return results


def main(only):
    items = [p for p in pages() if (not only or p["name"] in only) and (ROOT / f"{p['name']}.html").exists()]
    res = asyncio.run(run(items))
    differ = set()
    print(f"{'page':58} {'w':>4} {'live h':>7} {'clone h':>7} {'els':>5} {'diff':>5} {'max px':>7}")
    for (name, w), r in sorted(res.items(), key=lambda x: (x[0][1] != 1440, x[0][0])):
        maxd = r["diffs"][0][2] if r["diffs"] else 0
        bad = r["diffs"] or r["live_h"] != r["clone_h"] or r["extra"] or r["errors"]
        if bad:
            differ.add(name)
        print(f"{name[:58]:58} {w:>4} {r['live_h']:>7} {r['clone_h']:>7} {r['compared']:>5} "
              f"{len(r['diffs']):>5} {maxd:>7.1f}{'  errors: ' + '; '.join(r['errors']) if r['errors'] else ''}")
    out_file = CAPTURE / "compare.json"
    merged = json.loads(out_file.read_text(encoding="utf-8")) if only and out_file.exists() else {}
    merged.update({f"{k[0]}@{k[1]}": {**v, "diffs": [[list(d[0]), d[1], d[2]] for d in v["diffs"][:60]],
                                      "extra": [list(e) for e in v["extra"][:30]]}
                   for k, v in res.items()})   # a run on some pages updates only their rows
    out_file.write_text(json.dumps(merged, indent=1), encoding="utf-8")
    print(f"\ndone at {' and '.join(f'{w}x{HEIGHT}' for w in WIDTHS)} - "
          f"{len(differ)} of {len(items)} pages differ")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(set(sys.argv[1:]))
