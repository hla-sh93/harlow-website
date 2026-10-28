"""Stage B capture: raw HTML, settled DOM, geometry baseline and screenshots per page.

For every page in scope (see site.pages()), at 1440x900 and 479x900, in installed Chrome
(the bundled Chromium cannot play the H.264 hero video):

    _capture/raw/<name>.html          server HTML, browser user agent, cache-busting query
    _capture/dom/<name>.html          DOM after load, full scroll sweep, images and fonts
    _capture/geometry/<name>.json     page height and the box of every [data-id] element
    _capture/resources/<name>.json    every asset URL the page used (for fetch_assets.py)
    _capture/shots/<name>-<w>.png     full-page screenshot (not committed)

The cookie bar is accepted once per browser context, so it is absent from every
measurement (inventory decision 5). Analytics hosts are blocked; they draw nothing.

Usage:
    python -u _tools/capture.py [name ...]
"""

import asyncio
import json
import sys
import time

import requests
from playwright.async_api import async_playwright

from common import CAPTURE, HEIGHT, UA, WIDTHS, pages

BLOCK = ("googletagmanager.com", "google-analytics.com", "clarity.ms", "doubleclick.net")

SETTLE = """
async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let prev = -1, pass = 0;
  while (prev !== document.body.scrollHeight && pass < 8) {   // collapsed sections grow
    prev = document.body.scrollHeight;
    for (let y = 0; y < prev + 2000; y += 350) { window.scrollTo(0, y); await wait(35); }
    await wait(700); pass++;
  }
  await Promise.all([...document.images].map(i => i.complete ? 0 :
    new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  await document.fonts.ready;
  await wait(1500);                                           // entrance animations end
  document.documentElement.style.scrollBehavior = 'auto';     // html is scroll-behavior: smooth
  window.scrollTo(0, 0);
  document.documentElement.style.scrollBehavior = '';
  window.dispatchEvent(new Event('scroll'));
  await wait(1200);                                           // header returns to its top state
  return {
    passes: pass,
    dataImages: [...document.images].filter(i => i.src.startsWith('data:')).length,
    stillInvisible: document.querySelectorAll('.elementor-invisible').length,
  };
}
"""

GEOMETRY = """
() => {
  const box = el => { const b = el.getBoundingClientRect();
    return [+b.left.toFixed(1), +(b.top + window.scrollY).toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)]; };
  const els = [...document.querySelectorAll('[data-id]')].map((e, i) => ({
    i, id: e.dataset.id, type: e.dataset.element_type || '', widget: e.dataset.widget_type || '',
    box: box(e), shown: getComputedStyle(e).display !== 'none' }));
  const docs = [...document.querySelectorAll('[data-elementor-type]')]
    .filter(d => d.dataset.elementorType !== 'loop-item')
    .map(d => ({ type: d.dataset.elementorType, id: d.dataset.elementorId, box: box(d) }));
  // the history slider sizes its section by the active slide: record which one showed
  const slides = [...document.querySelectorAll('.history_slide')];
  const shown = slides.findIndex(s => getComputedStyle(s).opacity === '1');
  return { height: document.documentElement.scrollHeight,
           scrollWidth: document.documentElement.scrollWidth, docs, els,
           slide: slides.length ? (shown < 0 ? null : shown) : null };
}
"""

RESOURCES = """
() => {
  const urls = new Set(performance.getEntriesByType('resource').map(e => e.name));
  document.querySelectorAll('img').forEach(i => {
    if (i.currentSrc) urls.add(i.currentSrc);
    if (i.src) urls.add(i.src);
    // srcset splits on ASCII whitespace only: file names here contain U+202F
    (i.getAttribute('srcset') || '').split(/,[ \\t\\n]+/).forEach(s => { const u = s.trim().split(/[ \\t\\n]+/)[0]; if (u) urls.add(new URL(u, location.href).href); });
  });
  document.querySelectorAll('*').forEach(e => {
    const bg = getComputedStyle(e).backgroundImage;
    (bg.match(/url\\(["']?([^"')]+)["']?\\)/g) || []).forEach(m => urls.add(m.replace(/^url\\(["']?|["']?\\)$/g, '')));
  });
  document.querySelectorAll('video, video source').forEach(v => { if (v.src) urls.add(v.src); });
  document.querySelectorAll('a[href]').forEach(a => { if (/\\.(pdf|docx?|xlsx?|zip)$/i.test(a.href)) urls.add(a.href); });
  document.querySelectorAll('link[rel=stylesheet], script[src]').forEach(l => urls.add(l.href || l.src));
  return [...urls].filter(u => u.startsWith('http')).sort();
}
"""


async def accept_cookies(page):
    try:
        await page.click(".moove-gdpr-infobar-allow-all", timeout=8000)
        await page.wait_for_timeout(800)
        return True
    except Exception:
        return False


async def capture_width(browser, items, width, log):
    ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT},
                                    device_scale_factor=1, user_agent=UA, locale="en-US")
    await ctx.route("**/*", lambda route: route.abort()
                    if any(h in route.request.url for h in BLOCK) else route.continue_())
    first = await ctx.new_page()
    await first.goto(items[0]["url"], wait_until="load", timeout=90000)
    log(f"  cookie bar accepted at {width}: {await accept_cookies(first)}")
    await first.close()
    for it in items:
        name = it["name"]
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)[:160]))
        url = it["url"] + ("&" if "?" in it["url"] else "?") + f"capture={int(time.time())}"
        resp = await page.goto(url, wait_until="load", timeout=90000)
        settle = await page.evaluate(SETTLE)
        geo = await page.evaluate(GEOMETRY)
        geo.update({"url": it["url"], "width": width, "status": resp.status if resp else None,
                    "settle": settle, "pageerrors": errors})
        gpath = CAPTURE / "geometry" / f"{name}.json"
        allgeo = json.loads(gpath.read_text(encoding="utf-8")) if gpath.exists() else {}
        allgeo[str(width)] = geo
        gpath.write_text(json.dumps(allgeo, ensure_ascii=False), encoding="utf-8")
        await page.screenshot(path=str(CAPTURE / "shots" / f"{name}-{width}.png"), full_page=True)
        res = set(await page.evaluate(RESOURCES))
        rpath = CAPTURE / "resources" / f"{name}.json"
        if rpath.exists():
            res |= set(json.loads(rpath.read_text(encoding="utf-8")))
        rpath.write_text(json.dumps(sorted(res), indent=0), encoding="utf-8")
        if width == WIDTHS[0]:
            dom = await page.evaluate("document.documentElement.outerHTML")
            (CAPTURE / "dom" / f"{name}.html").write_text("<!DOCTYPE html>\n" + dom, encoding="utf-8")
        log(f"  {width} {name:60} h={geo['height']:6} els={len(geo['els']):4} "
            f"invisible={settle['stillInvisible']} data-img={settle['dataImages']} "
            f"errors={len(errors)}")
        await page.close()
    await ctx.close()


async def main(only):
    items = [p for p in pages() if not only or p["name"] in only]
    for sub in ("raw", "dom", "geometry", "resources", "shots"):
        (CAPTURE / sub).mkdir(parents=True, exist_ok=True)
    sess = requests.Session()
    sess.headers["User-Agent"] = UA
    for it in items:
        r = sess.get(it["url"], params={"nocache": int(time.time())}, timeout=60)
        (CAPTURE / "raw" / f"{it['name']}.html").write_text(r.text, encoding="utf-8")
        print(f"raw {r.status_code} {it['name']}")
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        for w in WIDTHS:
            await capture_width(browser, items, w, print)
        await browser.close()
    print(f"\ncaptured {len(items)} pages at {len(WIDTHS)} widths")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main(set(sys.argv[1:])))
