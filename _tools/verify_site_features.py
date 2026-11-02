"""Stage 9: the theme's site-wide features, as the owner uses them, on the local WordPress.

    python _tools/verify_site_features.py

Site settings: every setting given a test value (Customize → Site settings, as theme mods),
its CSS checked setting by setting, and a few of them seen in Chrome on the about page (a
global colour, the owner's own colour, a heading's colour, the buttons' corners, the content
width, a laptop breakpoint, the Google font loaded). Theme Builder: a header for the whole
site but the front page, a footer for the about page, a single template for news, an
archive, a search and a 404 template: each page asked as a visitor gets it, each template
where its conditions say and nowhere else; a list's card made in the Theme Builder with a
dynamic tag in it. A popup on the about page opened by its trigger, closed by its button,
opened by a link, closed by Escape. The role manager (a person with the editor role edits the
words and pictures only). Maintenance mode: a visitor gets the chosen page with 503, the
administrator the site. Then everything put back, and the 49 pages byte for byte as before.
"""
import asyncio
import json
import re
import shutil
import sys

import requests
from playwright.async_api import async_playwright

from common import ROOT
from verify_editable import get, snapshot
from wpsite import WP, login_cookies, wp_cli

sys.stdout.reconfigure(encoding="utf-8")


def step(name):
    """One step of _tools/site_features.php in WP-CLI, as the site's administrator."""
    shutil.copyfile(ROOT / "_tools" / "site_features.php", ROOT / "_env" / "verify-site-features.php")
    admin = wp_cli("user", "list", "--role=administrator", "--field=ID", "--number=1")
    said = wp_cli("eval-file", "/env/verify-site-features.php", name, f"--user={admin}")
    start = said.find("HARLOW-JSON")
    if start < 0:
        raise RuntimeError(f"site_features.php {name} said nothing: {said[-400:]}")
    return json.loads(said[start + len("HARLOW-JSON"):]) or {}


SEEN = r"""
() => {
  const root = getComputedStyle(document.documentElement);
  const h2 = document.querySelector('.elementor-widget-heading h2.elementor-heading-title');
  const button = document.querySelector('.elementor-button');
  return {
    primary: root.getPropertyValue('--e-global-color-primary').trim(),
    sand: root.getPropertyValue('--e-global-color-sand').trim(),
    width: getComputedStyle(document.querySelector('.e-con')).getPropertyValue('--container-max-width').trim(),
    h2: h2 ? getComputedStyle(h2).color : null,
    radius: button ? getComputedStyle(button).borderTopLeftRadius : null,
    google: !!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Lora"]'),
    settings: !!document.getElementById('harlow-site-settings'),
  };
}
"""


def hex_rgb(value):
    v = value.lstrip("#")
    return f"rgb({int(v[0:2], 16)}, {int(v[2:4], 16)}, {int(v[4:6], 16)})"


async def browser_part(problems, popup, mods):
    """The settings and the popup in Chrome on the about page."""
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
        await page.goto(WP + "/about-us/", wait_until="load", timeout=120000)
        seen = await page.evaluate(SEEN)
        want = {
            "primary": mods["color_primary"],
            "sand": "#e0c9a6",
            "width": f"{mods['content_width']}px",
            "h2": hex_rgb(mods["h2_color"]),
            "radius": f"{mods['button_radius']}px",
            "google": True,
            "settings": True,
        }
        for key, value in want.items():
            if seen.get(key) != value:
                problems.append(f"site settings in the browser: {key} {seen.get(key)!r}, not {value!r}")
        shown = sum(1 for key, value in want.items() if seen.get(key) == value)

        box = page.locator(f"#harlow-popup-{popup}")
        checks = []
        checks.append(("hidden at first", await box.get_attribute("hidden") is not None))
        await page.wait_for_timeout(1800)
        checks.append(("opened by its trigger", await box.is_visible()))
        b = await box.locator(".harlow-popup__box").bounding_box()
        checks.append(("at its position (bottom right)", bool(b) and b["x"] + b["width"] > 1400 and b["y"] + b["height"] > 880))
        await box.locator(".harlow-popup__close").click()
        checks.append(("closed by its button", not await box.is_visible()))
        await page.evaluate(f"() => {{ const a = document.createElement('a'); a.href = '#harlow-popup-{popup}';"
                            " a.textContent = 'open'; document.body.append(a); a.click(); }")
        await page.wait_for_timeout(300)
        checks.append(("opened by a link", await box.is_visible()))
        await page.keyboard.press("Escape")
        checks.append(("closed by Escape", not await box.is_visible()))
        for name, ok in checks:
            if not ok:
                problems.append(f"popup: not {name}")
        if errors:
            problems.append(f"errors on the about page: {errors[:2]}")
        await browser.close()
        return shown, len(want), sum(ok for _, ok in checks), len(checks)


def main():
    problems = []
    before = snapshot()
    mods = {}
    try:
        made = step("set")
        mods = json.loads(wp_cli("eval", "echo wp_json_encode( array( 'color_primary' => get_theme_mod( 'harlow_style_color_primary' ),"
                                 " 'h2_color' => get_theme_mod( 'harlow_style_h2_color' ), 'button_radius' => get_theme_mod( 'harlow_style_button_radius' ),"
                                 " 'content_width' => get_theme_mod( 'harlow_style_content_width' ) ) );"))
        expect = step("expect")
        for missing in expect["missing"]:
            problems.append(f"site settings: {missing} not in the CSS")
        if not expect["custom"]:
            problems.append("site settings: the owner's own colour not printed")
        if expect["devices"] != ["desktop", "widescreen", "laptop", "tablet", "mobile"]:
            problems.append(f"breakpoints: {expect['devices']}")
        if expect["fonts"] != ["Lora"]:
            problems.append(f"fonts of the owner's own: {expect['fonts']}")
        if expect["cards"] != 2 or not expect["card words"]:
            problems.append(f"a list's Theme Builder card: {expect['cards']} cards, dynamic tag shown {expect['card words']}")
        if not expect["content only"] or not expect["admin free"]:
            problems.append(f"role manager: editor content only {expect['content only']}, administrator free {expect['admin free']}")

        # Each template where its conditions say, and nowhere else.
        pages = {
            "front": WP + "/",
            "about": WP + "/about-us/",
            "contact": WP + "/contact-us/",
            "news": made["news"],
            "archive": WP + "/category/latest-news/",
            "search": WP + "/?s=harlow",
            "404": WP + "/no-such-page-here/",
        }
        expected = {
            "front": set(),
            "about": {"header", "footer", "popup"},
            "contact": {"header"},
            "news": {"header", "single"},
            "archive": {"header", "archive"},
            "search": {"header", "search"},
            "404": {"header", "404"},
        }
        words = {"header": "Check header words", "footer": "Check footer words", "single": "Check single words",
                 "archive": "Check archive words", "search": "Check search words", "404": "Check 404 words",
                 "popup": "Check popup words"}
        right = 0
        for name, url in pages.items():
            status, text, _ = get(url)
            found = {k for k, w in words.items() if w in text}
            if found != expected[name]:
                problems.append(f"theme builder: {name} shows {sorted(found)}, not {sorted(expected[name])}")
            else:
                right += 1
            if name == "404" and status != 404:
                problems.append(f"theme builder: the 404 template's page answers {status}")
            if name == "news" and "Check single words" in text and not re.search(r"elementor-widget-theme-post-content", text):
                problems.append("theme builder: the single template's post content missing")
        shown, wanted, popup_ok, popup_checks = asyncio.run(browser_part(problems, made["templates"]["popup"], mods))

        # Maintenance mode: a visitor gets the about page with 503, the administrator the site.
        step("on")
        status, text, _ = get(WP + "/contact-us/")
        maintenance_ok = status == 503 and "about" in text.lower() and "harlow-site-settings" in text
        if not maintenance_ok:
            problems.append(f"maintenance: a visitor got {status}")
        cookies = "; ".join(f"{c['name']}={c['value']}" for c in login_cookies())
        r = requests.get(WP + "/contact-us/", headers={"Cookie": cookies}, timeout=120)
        if r.status_code != 200 or "Maintenance mode on" not in r.text:
            problems.append(f"maintenance: the administrator got {r.status_code}")
            maintenance_ok = False
    finally:
        restored = step("restore")
    if restored.get("templates left"):
        problems.append(f"{restored['templates left']} templates left after putting everything back")
    after = snapshot()
    same = sum(1 for n in before if before[n] == after.get(n))
    if same != len(before):
        problems.append(f"{len(before) - same} pages not byte for byte as before: {[n for n in before if before[n] != after.get(n)][:4]}")
    print(f"site features: settings: {expect['checked']} rules of {len(expect['missing']) == 0 and 'every' or 'some'} setting in the CSS, "
          f"{shown} of {wanted} seen in the browser; breakpoints {len(expect['devices'])}; theme builder: {right} of {len(pages)} "
          f"pages with the templates their conditions give; a list's card made in the Theme Builder: {expect['cards']} cards; "
          f"popup: {popup_ok} of {popup_checks}; role manager: content only {'yes' if expect['content only'] else 'no'}; "
          f"maintenance: {'yes' if maintenance_ok else 'no'}; {same} of {len(before)} pages byte for byte as before after "
          f"putting everything back; {len(problems)} problems")
    for p in problems:
        print("  PROBLEM", p)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
