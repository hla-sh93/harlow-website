"""Stages 3 and 5, in the browser: every page's content looks on WordPress as on the reference.

verify_wp.py proves the markup is the same. This proves what Chrome makes of it: for each
of the 49 pages, at 1440, 900 and 479 wide, every computed property and the box of every
element of the page's own content (its Elementor document; an item page's single template;
the 404 page's main element), against the same page of the
reference served from the same site (/static/<name>.html), so both share one origin. Boxes
are measured from the top of the document (a page can be left a few pixels down after
settling); inside a fixed element, from the top of the screen; a 0x0 box by being 0x0.
Animations, transitions and timers of 5 seconds or more (carousels, the history slider)
are held still on both sides. Side margins are compared through the boxes: Chrome reports
an auto margin as its length or as 0px depending on the layout pass. A page that differs
is measured again on its own before
the difference counts.

    python -u _tools/verify_render.py [name ...]
"""

import asyncio
import sys

from playwright.async_api import async_playwright

from capture import SETTLE
from common import HEIGHT, pages
from compare import FREEZE_TIMERS
from refcheck import STILL
from wpsite import WP, wp_path

WIDTHS = (1440, 900, 479)
CONCURRENCY = 3
DOCUMENT = "body > [data-elementor-type='wp-page'], body > [data-elementor-type='single-page'], body > main"

MEASURE = """
(sel) => {
  const uploads = /http:\\/\\/localhost:8090\\/wp-content\\/uploads\\//g;
  const local = /http:\\/\\/localhost:8090\\/(static\\/|wp-content\\/themes\\/harlow\\/)?/g;
  // Chrome reports an auto side margin as its length or as 0px depending on the layout
  // pass; the box (left edge and width) is compared instead, which is what it decides.
  const SIDE = new Set(['margin-left', 'margin-right', 'margin-inline-start', 'margin-inline-end']);
  const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const root = document.querySelector(sel);
  if (!root) return null;
  const r0 = root.getBoundingClientRect();
  const fixed = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (getComputedStyle(e).position === 'fixed') return true; } return false; };
  const rows = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
    const o = fixed(el) ? { left: 0, top: 0 } : r0;
    const names = []; for (let i = 0; i < cs.length; i++) if (!cs[i].startsWith('--hl-color-') && !SIDE.has(cs[i])) names.push(cs[i]); names.sort();
    let s = ''; for (const n of names) s += n + ':' + cs.getPropertyValue(n).replace(uploads, '/assets/uploads/').replace(local, '/') + ';';
    rows.push([fnv(s), [b.left - o.left, b.top - o.top, b.width, b.height].map(v => +v.toFixed(1))]);
  }
  return rows;
}
"""

DETAIL = """
([sel, index]) => {
  const uploads = /http:\\/\\/localhost:8090\\/wp-content\\/uploads\\//g;
  const local = /http:\\/\\/localhost:8090\\/(static\\/|wp-content\\/themes\\/harlow\\/)?/g;
  const root = document.querySelector(sel);
  const el = [root, ...root.querySelectorAll('*')][index]; const cs = getComputedStyle(el); const props = {};
  for (let i = 0; i < cs.length; i++) if (!cs[i].startsWith('--hl-color-')) props[cs[i]] = cs.getPropertyValue(cs[i]).replace(uploads, '/assets/uploads/').replace(local, '/');
  return { tag: el.tagName.toLowerCase(), cls: (el.getAttribute('class') || '').slice(0, 60), id: el.getAttribute('data-id'), props };
}
"""


async def measure(browser, url, width):
    ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT}, device_scale_factor=1)
    await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
    await ctx.add_init_script(FREEZE_TIMERS)
    page = await ctx.new_page()
    await page.goto(url, wait_until="load", timeout=120000)
    await page.evaluate(SETTLE)
    await page.add_style_tag(content=STILL)
    await page.wait_for_timeout(150)
    return ctx, page, await page.evaluate(MEASURE, DOCUMENT)


async def check_one(browser, name, path, width, sem):
    async with sem:
        try:
            ctx_a, a, ra = await measure(browser, f"{WP}/static/{name}.html", width)
            ctx_b, b, rb = await measure(browser, WP + path, width)
        except Exception as err:   # a page that did not load is a difference, not a pass
            return 0, [f"did not load: {str(err)[:120]}"]
        problems = []
        try:
            if ra is None or rb is None or len(ra) != len(rb):
                return len(ra or []), [f"{len(rb or [])} elements, the reference {len(ra or [])}"]
            for i, (x, y) in enumerate(zip(ra, rb)):
                hidden = x[1][2:] == [0, 0] and y[1][2:] == [0, 0]
                if x == y or (x[0] == y[0] and hidden):
                    continue
                if x[1] != y[1] and not hidden:
                    problems.append(f"#{i}: box {y[1]} / reference {x[1]}")
                if x[0] != y[0]:
                    da, db = await a.evaluate(DETAIL, [DOCUMENT, i]), await b.evaluate(DETAIL, [DOCUMENT, i])
                    diff = [(p, da["props"].get(p), db["props"].get(p)) for p in sorted(set(da["props"]) | set(db["props"]))
                            if da["props"].get(p) != db["props"].get(p)]
                    problems.append(f"#{i} <{db['tag']} {db['id'] or db['cls']}>: " +
                                    "; ".join(f"{p} {v2!r} / reference {v1!r}" for p, v1, v2 in diff[:3]))
                if len(problems) > 12:
                    break
        finally:
            await ctx_a.close()
            await ctx_b.close()
        return len(ra), problems


async def run(items):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        sem = asyncio.Semaphore(CONCURRENCY)
        keys = [(name, path, w) for w in WIDTHS for name, path in items]
        results = dict(zip([(n, w) for n, _, w in keys],
                           await asyncio.gather(*[check_one(browser, n, p, w, sem) for n, p, w in keys])))
        solo, again = asyncio.Semaphore(1), 0
        paths = dict(items)
        for (name, w), (count, problems) in list(results.items()):
            if problems:
                again += 1
                second = await check_one(browser, name, paths[name], w, solo)
                if len(second[1]) < len(problems):
                    results[(name, w)] = second
        await browser.close()
    return results, again


def main(only):
    items = [(p["name"], wp_path(p)) for p in pages() if not only or p["name"] in only]
    results, again = asyncio.run(run(items))
    differ = set()
    for name, _ in items:
        cells = []
        for w in WIDTHS:
            count, problems = results[(name, w)]
            cells.append(f"{w}: {'ok' if not problems else str(len(problems)) + ' diff'} ({count})")
            if problems:
                differ.add(name)
        print(f"{'OK  ' if name not in differ else 'DIFF'} {name[:40]:40} " + "   ".join(cells))
        for w in WIDTHS:
            for p in results[(name, w)][1][:4]:
                print(f"        {w}: {p[:230]}")
    total = sum(c for c, _ in results.values())
    print(f"\npages in the browser: {len(items)} pages x {len(WIDTHS)} widths, {total} elements - "
          f"{len(differ)} of {len(items)} pages differ ({again} page-widths measured again)")
    return 1 if differ or not items else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(set(sys.argv[1:])))
