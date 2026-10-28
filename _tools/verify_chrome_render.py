"""Stage 1 check, in the browser: the header, footer and the rest of the chrome look and
behave on WordPress as on the reference.

verify_chrome.py proves the markup and the stylesheets are the same. This proves what the
browser makes of them: for every page WordPress has, at 1440, 900 and 479 wide, every
computed property and the box of every element of every chrome part, against the same
page of the reference served from the same site (/static/), so both share one origin.
Boxes are measured from the top of their part, because the content between header and
footer is not there yet; a box inside a fixed element (the header bar) from the top of the
screen, because a page can be left a few pixels down after settling (seen: 8 to 79px). Then the chrome's behaviours are driven on a WordPress page:
header on scroll, submenu on hover, burger, cookie bar, page transition, a link followed.

    python -u _tools/verify_chrome_render.py [name ...]
"""

import asyncio
import sys

from playwright.async_api import async_playwright

from capture import SETTLE
from common import HEIGHT, pages
from compare import FREEZE_TIMERS
from refcheck import STILL
from verify_chrome import LATER, PARTS
from wpsite import WP, fetch, wp_path

WIDTHS = (1440, 900, 479)
CONCURRENCY = 3

# Per part: [hash of every computed property, box from the part's top-left] per element.
MEASURE = """
(parts) => {
  const local = /http:\\/\\/localhost:8090\\/(static\\/|wp-content\\/themes\\/harlow\\/)?/g;
  const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const out = {};
  for (const [role, xp] of parts) {
    const root = document.evaluate(xp.replace(/^\\.\\//, '/html/body/').replace(/^\\.\\/\\//, '//'), document.body, null,
                                   XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!root) { out[role] = null; continue; }
    const r0 = root.getBoundingClientRect();
    const rows = [];
    // inside a fixed element (the header bar) a box is where it is on the screen; anywhere
    // else, where it is in its part: a page left a few pixels down measures the same
    const fixed = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (getComputedStyle(e).position === 'fixed') return true; } return false; };
    for (const el of [root, ...root.querySelectorAll('*')]) {
      const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
      const o = fixed(el) ? { left: 0, top: 0 } : r0;
      const names = []; for (let i = 0; i < cs.length; i++) if (!cs[i].startsWith('--hl-color-')) names.push(cs[i]); names.sort();
      let s = ''; for (const n of names) s += n + ':' + cs.getPropertyValue(n).replace(local, '/') + ';';
      rows.push([fnv(s), [b.left - o.left, b.top - o.top, b.width, b.height].map(v => +v.toFixed(1))]);
    }
    out[role] = rows;
  }
  return out;
}
"""

DETAIL = """
([xp, index]) => {
  const local = /http:\\/\\/localhost:8090\\/(static\\/|wp-content\\/themes\\/harlow\\/)?/g;
  const root = document.evaluate(xp.replace(/^\\.\\//, '/html/body/').replace(/^\\.\\/\\//, '//'), document.body, null,
                                 XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  const el = [root, ...root.querySelectorAll('*')][index]; const cs = getComputedStyle(el); const props = {};
  for (let i = 0; i < cs.length; i++) if (!cs[i].startsWith('--hl-color-')) props[cs[i]] = cs.getPropertyValue(cs[i]).replace(local, '/');
  return { tag: el.tagName.toLowerCase(), cls: (el.getAttribute('class') || '').slice(0, 60), props };
}
"""

XPATHS = [(role, xp if xp.startswith(".//") else xp) for role, xp in PARTS]


async def measure(browser, url, width):
    ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT}, device_scale_factor=1)
    await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
    await ctx.add_init_script(FREEZE_TIMERS)
    page = await ctx.new_page()
    await page.goto(url, wait_until="load", timeout=90000)
    await page.evaluate(SETTLE)
    await page.add_style_tag(content=STILL)
    await page.wait_for_timeout(150)
    return ctx, page, await page.evaluate(MEASURE, XPATHS)


async def check_one(browser, page_info, width, sem):
    async with sem:
        ref_url = f"{WP}/static/{page_info['name']}.html"
        wp_url = WP + wp_path(page_info)
        ctx_a, a, ma = await measure(browser, ref_url, width)
        ctx_b, b, mb = await measure(browser, wp_url, width)
        problems, counted = [], 0
        try:
            for role, xp in XPATHS:
                ra, rb = ma.get(role), mb.get(role)
                if ra is None and rb is None:
                    continue
                if (ra is None) != (rb is None) or len(ra) != len(rb):
                    problems.append(f"{role}: {len(rb or [])} elements, the reference {len(ra or [])}")
                    continue
                counted += len(ra)
                for i, (x, y) in enumerate(zip(ra, rb)):
                    if x == y or (x[0] == y[0] and x[1][2:] == [0, 0] and y[1][2:] == [0, 0]):
                        continue
                    # An element drawn nowhere (0x0) reports a position that means nothing.
                    hidden = x[1][2:] == [0, 0] and y[1][2:] == [0, 0]
                    if x[1] != y[1] and not hidden:
                        problems.append(f"{role} #{i}: box {y[1]} / reference {x[1]}")
                    if x[0] != y[0]:
                        da, db = await a.evaluate(DETAIL, [xp, i]), await b.evaluate(DETAIL, [xp, i])
                        diff = [(p, da["props"].get(p), db["props"].get(p)) for p in sorted(set(da["props"]) | set(db["props"]))
                                if da["props"].get(p) != db["props"].get(p)]
                        problems.append(f"{role} #{i} <{db['tag']} {db['cls']}>: " +
                                        "; ".join(f"{p} {v2!r} / reference {v1!r}" for p, v1, v2 in diff[:3]))
                    if len(problems) > 12:
                        break
        finally:
            await ctx_a.close()
            await ctx_b.close()
        return counted, problems


async def behaviours(browser):
    """The chrome's modules at work on a WordPress page."""
    out = []
    ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:120]))
    about = f"{WP}/about-us/"

    await page.goto(about)
    shown = await page.evaluate("getComputedStyle(document.getElementById('moove_gdpr_cookie_info_bar')).display")
    await page.click(".moove-gdpr-infobar-allow-all")
    hidden = await page.evaluate("getComputedStyle(document.getElementById('moove_gdpr_cookie_info_bar')).display")
    out.append(("cookie bar shows, then accepts", shown != "none" and hidden == "none", f"{shown} -> {hidden}"))

    await page.goto(about)
    await page.wait_for_timeout(300)
    r = await page.evaluate("""() => { const t = document.querySelector('e-page-transition');
        return { cls: t.className, display: getComputedStyle(t).display, img: !!t.querySelector('.e-page-transition--preloader') }; }""")
    out.append(("page transition settles", "e-page-transition--entered" in r["cls"] and r["display"] == "none" and r["img"], r))

    await page.evaluate("document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, 400)")
    await page.wait_for_timeout(600)
    r = await page.evaluate("""() => ({ bg: document.getElementById('nav-header').style.backgroundColor,
        logo: document.querySelector('#nav-header .logo')?.style.width })""")
    out.append(("header turns blue and its logo shrinks on scroll", r["bg"] in ("rgb(1, 101, 161)", "#0165a1") and r["logo"] == "125px", r))

    await page.goto(about)
    li = page.locator(".elementor-nav-menu--main li.menu-item-has-children").first
    await li.hover()
    await page.wait_for_timeout(450)
    r = await page.evaluate("""() => { const li = document.querySelector('.elementor-nav-menu--main li.menu-item-has-children');
        const ul = li.querySelector(':scope > ul'); return { display: getComputedStyle(ul).display,
        highlighted: li.querySelector(':scope > a').classList.contains('highlighted') }; }""")
    out.append(("submenu opens on hover", r["display"] == "block" and r["highlighted"], r))

    await page.set_viewport_size({"width": 479, "height": 900})
    await page.goto(about)
    await page.locator(".elementor-menu-toggle:visible").first.click()
    await page.wait_for_timeout(500)
    r = await page.evaluate("""() => { const t = [...document.querySelectorAll('.elementor-menu-toggle')].find(e => e.offsetParent);
        const d = t.parentElement.querySelector('.elementor-nav-menu__container.elementor-nav-menu--dropdown');
        return { active: t.classList.contains('elementor-active'), expanded: t.getAttribute('aria-expanded'),
                 visibleHeight: Math.round(d.getBoundingClientRect().height) }; }""")
    out.append(("burger opens the menu on a phone", r["active"] and r["expanded"] == "true" and r["visibleHeight"] > 0, r))
    await page.set_viewport_size({"width": 1440, "height": 900})

    await page.goto(f"{WP}/sitemap/")
    await page.locator("footer a[href$='/about-us/']").first.click()
    await page.wait_for_url("**/about-us/", timeout=10000)
    out.append(("a footer link is followed through the transition", page.url == about, page.url))

    out.append(("no script errors", not errors, errors[:3]))
    await ctx.close()
    return out


async def run(items):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        sem = asyncio.Semaphore(CONCURRENCY)
        keys = [(it, w) for w in WIDTHS for it in items]
        results = dict(zip([(it["name"], w) for it, w in keys],
                           await asyncio.gather(*[check_one(browser, it, w, sem) for it, w in keys])))
        # A page whose images arrive late can lay out differently (the footer logo, on live
        # too): a difference is believed only if it stays when the page is measured alone.
        solo = asyncio.Semaphore(1)
        retried = 0
        for (name, w), (counted, problems) in list(results.items()):
            if problems:
                retried += 1
                it = next(i for i in items if i["name"] == name)
                again = await check_one(browser, it, w, solo)
                if len(again[1]) < len(problems):
                    results[(name, w)] = again
        acts = await behaviours(browser)
        await browser.close()
    return results, acts, retried


def main(only):
    items = []
    for p in pages():
        if (only and p["name"] not in only) or p["name"] in LATER:
            continue
        status, _ = fetch(wp_path(p))
        if status == (404 if p["name"] == "404" else 200):
            items.append(p)
    results, acts, retried = asyncio.run(run(items))
    differ = set()
    for it in items:
        cells = []
        for w in WIDTHS:
            counted, problems = results[(it["name"], w)]
            cells.append(f"{w}: {'ok' if not problems else str(len(problems)) + ' diff'} ({counted})")
            if problems:
                differ.add(it["name"])
        print(f"{'OK  ' if it['name'] not in differ else 'DIFF'} {it['name'][:44]:44} " + "   ".join(cells))
        for w in WIDTHS:
            for p in results[(it["name"], w)][1][:5]:
                print(f"        {w}: {p[:230]}")
    print()
    for label, ok, detail in acts:
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}: {detail}")
    failed = sum(1 for _, ok, _ in acts if not ok)
    total = sum(c for c, _ in results.values())
    print(f"\nchrome in the browser: {len(items)} pages x {len(WIDTHS)} widths, {total} elements - "
          f"{len(differ)} of {len(items)} pages differ ({retried} page-widths measured again); "
          f"{len(acts)} behaviours, {failed} failed")
    return 1 if differ or failed or not items else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(set(sys.argv[1:])))
