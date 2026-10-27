"""Behaviour smoke test: each module in assets/js/ does its job on the built pages.

Every check drives the real page in installed Chrome through a local server and reads
the DOM state the module is responsible for. Checks on pages that are not built yet are
skipped and counted as skipped.

Usage:
    python -u _tools/behaviour.py

Passing looks like: `N behaviours checked, 0 failed, M skipped`.
"""

import asyncio
import subprocess
import sys
import time

from playwright.async_api import async_playwright

from common import ROOT

PORT = 8770
BASE = f"http://127.0.0.1:{PORT}"


async def header_scroll(page):
    await page.goto(f"{BASE}/index.html")
    await page.evaluate("document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, 400)")
    await page.wait_for_timeout(600)
    r = await page.evaluate("""() => ({ bg: document.getElementById('nav-header').style.backgroundColor,
        logo: document.querySelector('#nav-header .logo')?.style.width })""")
    return r["bg"] in ("rgb(1, 101, 161)", "#0165a1") and r["logo"] == "125px", r


async def submenu_hover(page):
    await page.goto(f"{BASE}/index.html")
    li = page.locator(".elementor-nav-menu--main li.menu-item-has-children").first
    await li.hover()
    await page.wait_for_timeout(450)
    r = await page.evaluate("""() => { const li = document.querySelector('.elementor-nav-menu--main li.menu-item-has-children');
        const ul = li.querySelector(':scope > ul'); return { display: getComputedStyle(ul).display,
        highlighted: li.querySelector(':scope > a').classList.contains('highlighted') }; }""")
    return r["display"] == "block" and r["highlighted"], r


async def burger(page):
    await page.set_viewport_size({"width": 479, "height": 900})
    await page.goto(f"{BASE}/index.html")
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
    await page.goto(f"{BASE}/index.html")
    t0 = await page.evaluate("document.querySelector('.elementor-widget-loop-carousel .swiper-wrapper').style.transform")
    await page.wait_for_timeout(5800)
    t1 = await page.evaluate("document.querySelector('.elementor-widget-loop-carousel .swiper-wrapper').style.transform")
    n = await page.evaluate("document.querySelectorAll('.elementor-widget-loop-carousel .swiper-slide-duplicate').length")
    return t0 != t1 and n > 0, {"before": t0, "after": t1, "duplicates": n}


async def history_slider(page):
    await page.goto(f"{BASE}/index.html")
    await page.wait_for_timeout(11500)   # 9s interval + 1s delay + .2s + .4s transition
    r = await page.evaluate("""() => [...document.querySelectorAll('.history_slide')].map(s => getComputedStyle(s).opacity)""")
    return len(r) > 1 and r[1] == "1" and r[0] == "0", r


async def reveal(page):
    await page.goto(f"{BASE}/about-us.html")
    before = await page.evaluate("document.querySelectorAll('.elementor-invisible').length")
    await page.evaluate("""async () => { document.documentElement.style.scrollBehavior='auto';
        for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }""")
    await page.wait_for_timeout(1500)
    after = await page.evaluate("document.querySelectorAll('.elementor-invisible').length")
    animated = await page.evaluate("document.querySelectorAll('.animated').length")
    return before > 0 and after == 0 and animated > 0, {"invisible_before": before, "after": after, "animated": animated}


async def gallery(page):
    await page.goto(f"{BASE}/gallery-item-al-rasheed-hotel.html")
    await page.wait_for_timeout(600)
    r = await page.evaluate("""() => { const c = document.querySelector('.elementor-gallery__container');
        return { columns: c.style.getPropertyValue('--columns'), loaded: document.querySelectorAll('.e-gallery-image-loaded').length,
                 items: document.querySelectorAll('.e-gallery-item').length }; }""")
    return r["columns"] == "3" and r["loaded"] > 0, r


async def lightbox(page):
    await page.goto(f"{BASE}/gallery-item-al-rasheed-hotel.html")
    await page.locator(".e-gallery-item").first.click()
    await page.wait_for_timeout(400)
    r = await page.evaluate("""() => { const b = document.querySelector('.site-lightbox');
        return { open: !!b && b.classList.contains('site-lightbox--open'), counter: b && b.querySelector('.site-lightbox__counter').textContent,
                 img: b && b.querySelector('img').getAttribute('src') }; }""")
    await page.keyboard.press("Escape")
    return r["open"] and bool(r["img"]), r


async def cookie_bar(page):
    await page.evaluate("localStorage.removeItem('harlow-cookie-consent')")
    await page.goto(f"{BASE}/index.html")
    shown = await page.evaluate("getComputedStyle(document.getElementById('moove_gdpr_cookie_info_bar')).display")
    await page.click(".moove-gdpr-infobar-allow-all")
    hidden = await page.evaluate("getComputedStyle(document.getElementById('moove_gdpr_cookie_info_bar')).display")
    stored = await page.evaluate("localStorage.getItem('harlow-cookie-consent')")
    return shown != "none" and hidden == "none" and stored == "all", {"before": shown, "after": hidden, "stored": stored}


async def page_transition(page):
    await page.goto(f"{BASE}/index.html")
    await page.wait_for_timeout(300)
    r = await page.evaluate("""() => { const t = document.querySelector('e-page-transition');
        return { cls: t.className, display: getComputedStyle(t).display, img: !!t.querySelector('.e-page-transition--preloader') }; }""")
    return "e-page-transition--entered" in r["cls"] and r["display"] == "none" and r["img"], r


async def internal_link(page):
    await page.goto(f"{BASE}/index.html")
    await page.locator("footer a[href='about-us.html']").first.click()
    await page.wait_for_url("**/about-us.html", timeout=8000)
    return page.url.endswith("/about-us.html"), {"url": page.url}


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
    ("internal link follows through the transition", "index", internal_link),
]


async def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                              cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    failed = skipped = 0
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
            await ctx.add_init_script("if(!sessionStorage.getItem('keep-consent')){try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}}")
            page = await ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)[:120]))
            await page.goto(f"{BASE}/index.html")
            for label, needs, fn in CHECKS:
                if not (ROOT / f"{needs}.html").exists():
                    skipped += 1
                    print(f"  skip  {label} ({needs}.html not built)")
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
        server.terminate()
    print(f"  page errors during the run: {len(errors)} {errors[:3]}")
    failed += bool(errors)
    print(f"\n{len(CHECKS) - skipped} behaviours checked, {failed} failed, {skipped} skipped")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main())
