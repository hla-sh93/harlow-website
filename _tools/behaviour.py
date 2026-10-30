"""Behaviour smoke test: each module in assets/js/ does its job on the built pages.

Every check drives the real page in installed Chrome through a local server and reads
the DOM state the module is responsible for. Checks on pages that are not built yet are
skipped and counted as skipped.

With --wp the same checks run on the local WordPress (http://localhost:8090), page by page
at its WordPress address.

Usage:
    python -u _tools/behaviour.py [--wp]

Passing looks like: `N behaviours checked, 0 failed, M skipped`.
"""

import asyncio
import subprocess
import sys
import time

from playwright.async_api import async_playwright

from common import ROOT, pages

PORT = 8770
BASE = f"http://127.0.0.1:{PORT}"
WP = "http://localhost:8090"
ON_WP = "--wp" in sys.argv
WP_LATER = {}   # pages WordPress does not have yet (none since stage 5)
PATHS = {p["name"]: p["path"] for p in pages()}


def url(name):
    """A page of the reference, or the same page on WordPress (--wp)."""
    return WP + PATHS[name] if ON_WP else f"{BASE}/{name}.html"


async def header_scroll(page):
    await page.goto(url("index"))
    await page.evaluate("document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, 400)")
    await page.wait_for_timeout(600)
    r = await page.evaluate("""() => ({ bg: document.getElementById('nav-header').style.backgroundColor,
        logo: document.querySelector('#nav-header .logo')?.style.width })""")
    return r["bg"] in ("rgb(1, 101, 161)", "#0165a1") and r["logo"] == "125px", r


async def submenu_hover(page):
    await page.goto(url("index"))
    li = page.locator(".elementor-nav-menu--main li.menu-item-has-children").first
    await li.hover()
    await page.wait_for_timeout(450)
    r = await page.evaluate("""() => { const li = document.querySelector('.elementor-nav-menu--main li.menu-item-has-children');
        const ul = li.querySelector(':scope > ul'); return { display: getComputedStyle(ul).display,
        highlighted: li.querySelector(':scope > a').classList.contains('highlighted') }; }""")
    return r["display"] == "block" and r["highlighted"], r


async def burger(page):
    await page.set_viewport_size({"width": 479, "height": 900})
    await page.goto(url("index"))
    toggle = page.locator(".elementor-menu-toggle:visible").first
    await toggle.click()
    await page.wait_for_timeout(500)
    r = await page.evaluate("""() => { const t = [...document.querySelectorAll('.elementor-menu-toggle')].find(e => e.offsetParent);
        const d = t.parentElement.querySelector('.elementor-nav-menu__container.elementor-nav-menu--dropdown');
        return { active: t.classList.contains('elementor-active'), expanded: t.getAttribute('aria-expanded'),
                 menuHeight: d.style.getPropertyValue('--menu-height'), width: d.style.width,
                 visibleHeight: Math.round(d.getBoundingClientRect().height) }; }""")
    await page.set_viewport_size({"width": 1440, "height": 900})
    ok = r["active"] and r["expanded"] == "true" and r["menuHeight"] not in ("", "0") and r["visibleHeight"] > 0
    return ok, r


async def carousel(page):
    await page.goto(url("index"))
    t0 = await page.evaluate("document.querySelector('.elementor-widget-loop-carousel .swiper-wrapper').style.transform")
    await page.wait_for_timeout(5800)
    t1 = await page.evaluate("document.querySelector('.elementor-widget-loop-carousel .swiper-wrapper').style.transform")
    n = await page.evaluate("document.querySelectorAll('.elementor-widget-loop-carousel .swiper-slide-duplicate').length")
    return t0 != t1 and n > 0, {"before": t0, "after": t1, "duplicates": n}


async def history_slider(page):
    await page.goto(url("index"))
    await page.wait_for_timeout(11500)   # 9s interval + 1s delay + .2s + .4s transition
    r = await page.evaluate("""() => [...document.querySelectorAll('.history_slide')].map(s => getComputedStyle(s).opacity)""")
    return len(r) > 1 and r[1] == "1" and r[0] == "0", r


async def reveal(page):
    await page.goto(url("about-us"))
    before = await page.evaluate("document.querySelectorAll('.elementor-invisible').length")
    await page.evaluate("""async () => { document.documentElement.style.scrollBehavior='auto';
        for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }""")
    await page.wait_for_timeout(1500)
    after = await page.evaluate("document.querySelectorAll('.elementor-invisible').length")
    animated = await page.evaluate("document.querySelectorAll('.animated').length")
    return before > 0 and after == 0 and animated > 0, {"invisible_before": before, "after": after, "animated": animated}


async def gallery(page):
    await page.goto(url("gallery-item-al-rasheed-hotel"))
    await page.wait_for_timeout(600)
    r = await page.evaluate("""() => { const c = document.querySelector('.elementor-gallery__container');
        return { columns: c.style.getPropertyValue('--columns'), loaded: document.querySelectorAll('.e-gallery-image-loaded').length,
                 items: document.querySelectorAll('.e-gallery-item').length }; }""")
    return r["columns"] == "3" and r["loaded"] > 0, r


async def lightbox(page):
    await page.goto(url("gallery-item-al-rasheed-hotel"))
    await page.locator(".e-gallery-item").first.click()
    await page.wait_for_timeout(400)
    r = await page.evaluate("""() => { const b = document.querySelector('.site-lightbox');
        return { open: !!b && b.classList.contains('site-lightbox--open'), counter: b && b.querySelector('.site-lightbox__counter').textContent,
                 img: b && b.querySelector('img').getAttribute('src') }; }""")
    await page.keyboard.press("Escape")
    return r["open"] and bool(r["img"]), r


async def cookie_bar(page):
    await page.evaluate("localStorage.removeItem('harlow-cookie-consent')")
    await page.goto(url("index"))
    shown = await page.evaluate("getComputedStyle(document.getElementById('moove_gdpr_cookie_info_bar')).display")
    await page.click(".moove-gdpr-infobar-allow-all")
    hidden = await page.evaluate("getComputedStyle(document.getElementById('moove_gdpr_cookie_info_bar')).display")
    stored = await page.evaluate("localStorage.getItem('harlow-cookie-consent')")
    return shown != "none" and hidden == "none" and stored == "all", {"before": shown, "after": hidden, "stored": stored}


async def page_transition(page):
    await page.goto(url("index"))
    await page.wait_for_timeout(300)
    r = await page.evaluate("""() => { const t = document.querySelector('e-page-transition');
        return { cls: t.className, display: getComputedStyle(t).display, img: !!t.querySelector('.e-page-transition--preloader') }; }""")
    return "e-page-transition--entered" in r["cls"] and r["display"] == "none" and r["img"], r


async def accordion(page):
    await page.goto(url("faq"))
    state = """() => [...document.querySelectorAll('.elementor-accordion-item')].slice(0, 2).map(i => ({
        title: i.querySelector('.elementor-tab-title').classList.contains('elementor-active'),
        shown: getComputedStyle(i.querySelector('.elementor-tab-content')).display }))"""
    first = await page.evaluate(state)
    await page.locator(".elementor-accordion-item .elementor-tab-title").nth(1).click()
    await page.wait_for_timeout(600)
    after = await page.evaluate(state)
    ok = (first[0] == {"title": True, "shown": "block"} and first[1]["shown"] == "none"
          and after[1] == {"title": True, "shown": "block"} and after[0]["shown"] == "none")
    return ok, {"at load": first, "after click": after}


async def people_popup(page):
    await page.goto(url("harlows-people"))
    await page.locator(".harlow-emp").first.click()
    await page.wait_for_timeout(500)
    opened = await page.evaluate("""() => ({ popup: getComputedStyle(document.querySelector('.harlow-emp .hp-popup-holder')).display,
        lock: document.body.style.overflowY })""")
    await page.locator(".harlow-emp .hp-close").first.click()
    await page.wait_for_timeout(500)
    closed = await page.evaluate("getComputedStyle(document.querySelector('.harlow-emp .hp-popup-holder')).display")
    return opened["popup"] == "flex" and opened["lock"] == "hidden" and closed == "none", {"opened": opened, "closed": closed}


async def internal_link(page):
    await page.goto(url("index"))
    target = url("about-us")
    await page.locator("footer a[href='about-us.html'], footer a[href$='/about-us/']").first.click()
    await page.wait_for_url(target, timeout=8000)
    return page.url == target, {"url": page.url}


CHECKS = [
    ("header colour and logo on scroll", "index", header_scroll),
    ("desktop submenu on hover", "index", submenu_hover),
    ("burger menu opens full width", "index", burger),
    ("loop carousel autoplays", "index", carousel),
    ("history slider moves on", "index", history_slider),
    ("entrance animations run", "about-us", reveal),
    ("gallery grid laid out", "gallery-item-al-rasheed-hotel", gallery),
    ("lightbox opens", "gallery-item-al-rasheed-hotel", lightbox),
    ("cookie bar shows and accepts", "index", cookie_bar),
    ("page transition settles", "index", page_transition),
    ("accordion opens one item at a time", "faq", accordion),
    ("person popup opens and closes", "harlows-people", people_popup),
    ("internal link follows through the transition", "index", internal_link),
]


async def main():
    server = None if ON_WP else subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                                                 cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0 if ON_WP else 1.5)
    failed = skipped = 0
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
            await ctx.add_init_script("if(!sessionStorage.getItem('keep-consent')){try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}}")
            page = await ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)[:120]))
            await page.goto(url("index"))
            for label, needs, fn in CHECKS:
                if not (ROOT / f"{needs}.html").exists() or (ON_WP and needs in WP_LATER):
                    skipped += 1
                    print(f"  skip  {label} ({WP_LATER.get(needs, needs + '.html not built') if ON_WP else needs + '.html not built'})")
                    continue
                if fn is cookie_bar:
                    await page.evaluate("sessionStorage.setItem('keep-consent','1')")
                try:
                    ok, detail = await fn(page)
                except Exception as err:
                    ok, detail = False, f"error: {str(err)[:140]}"
                if fn is cookie_bar:
                    await page.evaluate("sessionStorage.removeItem('keep-consent')")
                failed += not ok
                print(f"  {'ok  ' if ok else 'FAIL'}  {label}: {detail}")
            await browser.close()
    finally:
        if server:
            server.terminate()
    print(f"  page errors during the run: {len(errors)} {errors[:3]}")
    failed += bool(errors)
    print(f"\n{len(CHECKS) - skipped} behaviours checked, {failed} failed, {skipped} skipped")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main())
