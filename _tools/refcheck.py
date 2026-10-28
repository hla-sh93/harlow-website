"""A refactor against its reference: every computed property of every element.

Serves a reference copy of the site (default: a checkout of tag html-v1 at
../_ref-v1) and the project side by side, loads each page from both in installed Chrome,
settles them the same way, and compares for every element in <body> the full list of
computed properties plus its box. Nothing is read from the live site, so a run is
deterministic: any difference was made by the change being checked.

Timed parts are held still on both sides (timers of 5s or more are stopped), the cookie
bar is accepted, and pages are measured at 1440 (desktop), 900 (the tablet band, where
the two kinds of media query overlap) and 479 (mobile).

Usage:
    python -u _tools/refcheck.py [--widths 1440,900,479] [--ref <folder>] [name ...]

Passing looks like: `N pages x M widths, K elements compared - 0 of N pages differ`.
"""

import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path

from playwright.async_api import async_playwright

from capture import SETTLE
from common import CAPTURE, HEIGHT, ROOT, pages
from compare import FREEZE_TIMERS

REF_PORT, NEW_PORT = 8780, 8781
DEFAULT_REF = ROOT.parent / "_ref-v1"
CONCURRENCY = 2

HASHES = """
() => {
  const origin = /http:\\/\\/127\\.0\\.0\\.1:\\d+\\//g;
  const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
    let s = el.tagName + '|' + [b.left, b.top + scrollY, b.width, b.height].map(v => v.toFixed(1)).join(',') + '|';
    // custom properties are listed in a different order on every page: sort by name.
    // The brand colours (--hl-color-*, design/brand.css) are left out: they are new since
    // html-v1, and what they do is compared in every property that uses them.
    const names = []; for (let i = 0; i < cs.length; i++) if (!cs[i].startsWith('--hl-color-')) names.push(cs[i]); names.sort();
    for (const n of names) s += n + ':' + cs.getPropertyValue(n).replace(origin, '/') + ';';
    out.push(fnv(s));
  }
  return out;
}
"""

DETAIL = """
(idx) => {
  const origin = /http:\\/\\/127\\.0\\.0\\.1:\\d+\\//g;
  const all = [...document.body.querySelectorAll('*')];
  return idx.map(i => { const el = all[i]; if (!el) return null; const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
    const props = {}; for (let k = 0; k < cs.length; k++) if (!cs[k].startsWith('--hl-color-')) props[cs[k]] = cs.getPropertyValue(cs[k]).replace(origin, '/');
    props['(box)'] = [b.left, b.top + scrollY, b.width, b.height].map(v => v.toFixed(1)).join(',');
    return { tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : '').slice(0, 90), props }; });
}
"""


# Held still at measurement time, on both sides: infinite animations (a background that
# slides) and transitions would otherwise be caught mid-way.
STILL = "*, *::before, *::after { animation: none !important; transition: none !important; }"


async def open_page(ctx, url):
    page = await ctx.new_page()
    await page.goto(url, wait_until="load", timeout=90000)
    await page.evaluate(SETTLE)
    await page.add_style_tag(content=STILL)
    await page.wait_for_timeout(150)
    return page


async def check_one(browser, name, width, ref_url, new_url, results, sem):
    async with sem:
        ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT}, device_scale_factor=1)
        await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
        await ctx.add_init_script(FREEZE_TIMERS)
        try:
            a = await open_page(ctx, ref_url)
            b = await open_page(ctx, new_url)
            ha, hb = await a.evaluate(HASHES), await b.evaluate(HASHES)
            bad = [i for i in range(min(len(ha), len(hb))) if ha[i] != hb[i]]
            detail = []
            if bad:
                sample = bad[:40]
                da, db = await a.evaluate(DETAIL, sample), await b.evaluate(DETAIL, sample)
                for i, x, y in zip(sample, da, db):
                    if not x or not y:
                        continue
                    props = [(p, x["props"].get(p), y["props"].get(p)) for p in
                             sorted(set(x["props"]) | set(y["props"])) if x["props"].get(p) != y["props"].get(p)]
                    detail.append({"index": i, "tag": x["tag"], "ref_class": x["cls"], "new_class": y["cls"],
                                   "props": props[:12], "n_props": len(props)})
            results[(name, width)] = {"elements": len(ha), "new_elements": len(hb), "differ": len(bad),
                                      "detail": detail}
        except Exception as err:   # a page that failed to load is a difference, not a pass
            results[(name, width)] = {"elements": 0, "new_elements": 0, "differ": -1,
                                      "detail": [{"error": str(err)[:200]}]}
        finally:
            await ctx.close()


async def run(items, widths, ref_dir):
    servers = [subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
                                cwd=str(root), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
               for port, root in ((REF_PORT, ref_dir), (NEW_PORT, ROOT))]
    time.sleep(1.5)
    results = {}
    sem = asyncio.Semaphore(CONCURRENCY)
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            tasks = [check_one(browser, it["name"], w,
                               f"http://127.0.0.1:{REF_PORT}/{it['name']}.html",
                               f"http://127.0.0.1:{NEW_PORT}/{it['name']}.html", results, sem)
                     for w in widths for it in items]
            await asyncio.gather(*tasks)
            # Chrome sometimes lays a page out differently depending on when its images
            # arrive (the footer logo: 286.9 or 350px, on the live site too). A difference
            # is believed only if it stays when the page is measured again on its own.
            attempts = {k: 1 for k in results}
            solo = asyncio.Semaphore(1)
            for _ in range(2):
                again = [k for k, r in results.items() if r["differ"] != 0 or r["elements"] != r["new_elements"]]
                for name, w in again:
                    retry = {}
                    await check_one(browser, name, w, f"http://127.0.0.1:{REF_PORT}/{name}.html",
                                    f"http://127.0.0.1:{NEW_PORT}/{name}.html", retry, solo)
                    r = retry[(name, w)]
                    attempts[(name, w)] += 1
                    clean = r["differ"] == 0 and r["elements"] == r["new_elements"]
                    if clean or r["differ"] < results[(name, w)]["differ"]:
                        results[(name, w)] = r
            for k, r in results.items():
                r["attempts"] = attempts[k]
            await browser.close()
    finally:
        for s in servers:
            s.terminate()
    return results


def main(argv):
    widths, ref, only = [1440, 900, 479], DEFAULT_REF, []
    i = 0
    while i < len(argv):
        if argv[i] == "--widths":
            widths = [int(x) for x in argv[i + 1].split(",")]
            i += 2
        elif argv[i] == "--ref":
            ref = Path(argv[i + 1])
            i += 2
        else:
            only.append(argv[i])
            i += 1
    items = [p for p in pages() if (not only or p["name"] in only) and (ROOT / f"{p['name']}.html").exists()
             and (ref / f"{p['name']}.html").exists()]
    res = asyncio.run(run(items, widths, ref))
    differ, total = set(), 0
    for (name, w), r in sorted(res.items(), key=lambda x: (x[0][1], x[0][0])):
        total += r["elements"]
        bad = r["differ"] != 0 or r["elements"] != r["new_elements"]
        if bad:
            differ.add(name)
            print(f"{name[:70]:70} {w:>5} elements {r['elements']}/{r['new_elements']}  differ {r['differ']}")
            for d in r["detail"][:3]:
                if "error" in d:
                    print("      error:", d["error"])
                else:
                    print(f"      [{d['index']}] <{d['tag']} {d['new_class'][:50]}> {d['n_props']} props: " +
                          "; ".join(f"{p}: {a!r} -> {b!r}" for p, a, b in d["props"][:3])[:260])
    out = ROOT / "_vocab" / "refcheck.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({f"{k[0]}@{k[1]}": v for k, v in res.items()}, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    retried = sum(1 for r in res.values() if r.get("attempts", 1) > 1)
    print(f"\n{len(items)} pages x {len(widths)} widths, {total} elements compared - "
          f"{len(differ)} of {len(items)} pages differ ({retried} page-widths needed a second look)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
