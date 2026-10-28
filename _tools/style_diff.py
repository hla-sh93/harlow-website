"""Computed-style differences between live and the clone for one page and width.

For every [data-id] element (and the element inside it that carries its text or image),
reads a fixed list of computed properties on both sides and prints the ones that differ,
grouped by property. The fastest way to find which rule a geometry difference comes from.

Usage:
    python -u _tools/style_diff.py <name> [width] [data-id ...]
"""

import asyncio
import subprocess
import sys
import time
from collections import defaultdict

from playwright.async_api import async_playwright

from capture import BLOCK, SETTLE
from common import HEIGHT, ROOT, UA, pages

PORT = 8766
PROPS = ["display", "position", "box-sizing", "width", "height", "margin-top", "margin-bottom",
         "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width",
         "border-bottom-width", "font-family", "font-size", "font-weight", "font-style",
         "line-height", "letter-spacing", "text-transform", "white-space", "flex-direction",
         "flex-wrap", "justify-content", "align-items", "gap", "grid-template-columns",
         "vertical-align", "object-fit", "max-width", "min-height", "opacity", "transform",
         "color", "background-color", "background-image", "border-top-color", "text-decoration-line",
         "text-align", "visibility", "z-index", "overflow", "fill"]

COLLECT = """
(props) => [...document.querySelectorAll('[data-id]')].map((el, i) => {
  const inner = el.querySelector('h1,h2,h3,h4,h5,h6,p,a,span,img,li,svg,button,input,textarea') || el;
  // url(...) compared by file name: the host is live's on one side and localhost on the other
  const norm = (v) => v.replace(/url\\("?[^")]*\\/([^/")]+)"?\\)/g, 'url($1)');
  const read = (e) => { const cs = getComputedStyle(e); return props.map(p => norm(cs.getPropertyValue(p))); };
  return { id: el.dataset.id, tag: inner.tagName.toLowerCase(), cls: (inner.className && inner.className.baseVal === undefined ? inner.className : '').slice(0, 60),
           own: read(el), inner: read(inner),
           // time-dependent: the slider and carousel tracks move on a timer
           timed: !!el.closest('#history-slider, .swiper-wrapper'),
           innerTimed: !!inner.closest('#history-slider, .swiper-wrapper'),
           // the header's colour and logo size follow the scroll script through a transition
           header: !!el.closest('#nav-header'),
           // nothing drawn (closed popup, hidden on this device)
           empty: (() => { const b = el.getBoundingClientRect(); return b.width === 0 && b.height === 0; })(),
           innerHeader: !!inner.closest('#nav-header') };
})
"""


TREE = """
([id, props]) => {
  const root = document.querySelector(`[data-id="${id}"]`);
  if (!root) return [];
  return [root, ...root.querySelectorAll('*')].map(e => {
    const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    const cls = typeof e.className === 'string' ? e.className : (e.className.baseVal || '');
    return { tag: e.tagName.toLowerCase(), cls: cls.replace(/elementor-element-[0-9a-f]+/g, '').trim().slice(0, 50),
             box: [Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10],
             css: props.map(p => cs.getPropertyValue(p)) };
  });
}
"""


async def tree(ctx, url, block, data_id):
    page = await ctx.new_page()
    if block:
        await page.route("**/*", lambda r: r.abort() if any(h in r.request.url for h in BLOCK)
                         else r.continue_())
    await page.goto(url, wait_until="load", timeout=90000)
    await page.evaluate(SETTLE)
    data = await page.evaluate(TREE, [data_id, PROPS])
    await page.close()
    return data


async def collect(ctx, url, block):
    page = await ctx.new_page()
    if block:
        await page.route("**/*", lambda r: r.abort() if any(h in r.request.url for h in BLOCK)
                         else r.continue_())
    for attempt in range(4):   # live is slow through Cloudflare at times, or the network drops
        try:
            await page.goto(url, wait_until="load", timeout=90000)
            break
        except Exception:
            if attempt == 3:
                raise
            await page.wait_for_timeout(20000)
    await page.evaluate(SETTLE)
    data = await page.evaluate(COLLECT, PROPS)
    await page.close()
    return data


async def main(name, width, ids):
    item = next(p for p in pages() if p["name"] == name)
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                              cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT}, user_agent=UA)
            first = await ctx.new_page()
            await first.goto(item["url"], wait_until="load")
            try:
                await first.click(".moove-gdpr-infobar-allow-all", timeout=8000)
            except Exception:
                pass
            await first.close()
            await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
            if ids and len(ids) == 1 and next(iter(ids)).startswith("tree:"):
                did = next(iter(ids))[5:]
                a = await tree(ctx, item["url"], True, did)
                b = await tree(ctx, f"http://127.0.0.1:{PORT}/{name}.html", False, did)
                await browser.close()
                print(f"subtree of {did}: live {len(a)} nodes, clone {len(b)} nodes")
                for i in range(max(len(a), len(b))):
                    x = a[i] if i < len(a) else None
                    y = b[i] if i < len(b) else None
                    label = (x or y)["tag"] + " ." + (x or y)["cls"]
                    if not x or not y or x["tag"] != y["tag"]:
                        print(f"  [{i}] structure differs: live={x and x['tag']+' .'+x['cls']} clone={y and y['tag']+' .'+y['cls']}")
                        continue
                    d = [f"{p}: {u!r} -> {v!r}" for p, u, v in zip(PROPS, x["css"], y["css"]) if u != v]
                    if x["box"] != y["box"] or d:
                        print(f"  [{i}] {label}  box {x['box']} -> {y['box']}  " + "; ".join(d[:6]))
                return
            live = await collect(ctx, item["url"], True)
            clone = await collect(ctx, f"http://127.0.0.1:{PORT}/{name}.html", False)
            await browser.close()
    finally:
        server.terminate()
    seen = defaultdict(int)
    keyed = {}
    for e in clone:
        keyed[(e["id"], seen[e["id"]])] = e
        seen[e["id"]] += 1
    seen = defaultdict(int)
    by_prop = defaultdict(list)
    for e in live:
        k = (e["id"], seen[e["id"]])
        seen[e["id"]] += 1
        if ids and e["id"] not in ids:
            continue
        o = keyed.get(k)
        if not o:
            continue
        for part in ("own", "inner"):
            for p, a, b in zip(PROPS, e[part], o[part]):
                if a != b:
                    by_prop[(part, p)].append((e["id"], e["tag"], e["cls"], a, b))
    for (part, p), rows in sorted(by_prop.items(), key=lambda x: -len(x[1])):
        print(f"\n{part}.{p}: {len(rows)} elements")
        for r in rows[:6]:
            print(f"   {r[0]} <{r[1]} {r[2]}>  live={r[3]!r}  clone={r[4]!r}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    asyncio.run(main(args[0], int(args[1]) if len(args) > 1 else 1440, set(args[2:])))
