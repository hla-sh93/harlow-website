"""Stage 10: the handoff makes the reference site on a WordPress that has never seen the
repository (`env.sh clean --yes`: WordPress and the three plugins only).

    python -u _tools/package_theme.py
    ./_tools/env.sh clean --yes
    COMPOSE_PATH_SEPARATOR=';' COMPOSE_FILE='docker-compose.yml;_tools/clean/compose.clean.yml' \
        python -u _tools/verify_handoff.py

As the owner does it, in Chrome: harlow.zip uploaded at Appearance > Themes > Add New Theme
> Upload Theme and activated; Appearance > Site pages read, which must say the pictures have
no file yet; harlow-pictures.zip unpacked into the theme's assets/ (as the host's File Manager
does: PHP's ZipArchive in the site), the screen read again, no pictures left without a file;
then verify_install.py --empty: "Install the pages" pressed, the 49 pages as the reference,
the 48 heads as live's, a second run changing nothing. Last, every file the 49 pages ask the
site for (pictures and their sizes, stylesheets and what they name, scripts, fonts, video)
answers 200.

Passing: `handoff: harlow.zip (N MB) uploaded and activated in the dashboard; pictures without
a file: N before harlow-pictures.zip (those the theme zip does not carry), 0 after; install (empty): … 0 problems; files the 49
pages ask for: N, 0 not answered; 0 problems`.
"""
import asyncio
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import requests
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import verify_install  # noqa: E402
from common import ROOT, pages  # noqa: E402
from wpsite import WP, fetch, login_cookies, parse, wp_cli, wp_path  # noqa: E402

HANDOFF = ROOT.parent / "harlow-handoff"
# The pictures zip reaches the WP-CLI container through _env/ (/env in it).
INBOX = ROOT / "_env" / "handoff"


async def upload_theme(problems):
    """harlow.zip through the dashboard's Upload Theme, then Activate; the screen's words."""
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        await ctx.add_cookies([{**c, "url": WP} if "domain" not in c else c for c in login_cookies()])
        page = await ctx.new_page()
        # Rank Math sends the first visit to the dashboard after it is activated to its own
        # welcome screen, once: the upload screen is opened again then, as a person would.
        for _ in range(3):
            await page.goto(WP + "/wp-admin/theme-install.php?upload", wait_until="load", timeout=120000)
            if await page.locator("input#themezip").count():
                break
        await page.wait_for_selector("input#themezip", state="attached", timeout=120000)
        # the upload box opens from the screen's "Upload Theme" button, as a person opens it
        if not await page.locator("#install-theme-submit").is_visible():
            await page.locator(".upload-view-toggle").first.click()
            await page.wait_for_selector("#install-theme-submit", state="visible", timeout=30000)
        await page.set_input_files("input#themezip", str(HANDOFF / "harlow.zip"))
        await page.click("#install-theme-submit")
        await page.wait_for_load_state("load", timeout=300000)
        words = await page.inner_text("#wpbody-content")
        if "installed successfully" not in words:
            problems.append(f"upload: {words[:300]!r}")
        activate = page.locator("#wpbody-content a", has_text="Activate").first
        if await activate.count():
            await activate.click()
            await page.wait_for_load_state("load", timeout=120000)
        else:
            problems.append("upload: no Activate link")
        screen = await site_pages_words(page)
        await browser.close()
        return words, screen


async def site_pages_words(page):
    await page.goto(WP + verify_install.SCREEN, wait_until="load", timeout=120000)
    return await page.inner_text("#wpbody-content")


async def read_screen():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        await ctx.add_cookies(login_cookies())
        page = await ctx.new_page()
        words = await site_pages_words(page)
        await browser.close()
        return words


def without_file(words):
    """The pictures the screen says have no file yet (0 when it says nothing of them)."""
    m = re.search(r"(\d+) pictures? ha(?:s|ve) no file on this site yet", words)
    return int(m.group(1)) if m else 0


def asked_for(text, base):
    """The files a page asks the site for: src, srcset, href of stylesheets, icons and preloads,
    the pictures of a gallery and of style attributes and <style> blocks."""
    doc = parse(text)
    urls = set()
    for el in doc.iter():
        if not isinstance(el.tag, str):
            continue
        for attr in ("src", "data-thumbnail", "poster"):
            if el.get(attr):
                urls.add(el.get(attr))
        if el.get("srcset"):
            urls |= {part.strip().split(" ")[0] for part in el.get("srcset").split(",") if part.strip()}
        if el.tag == "link" and el.get("href") and (el.get("rel") or "").split()[:1] != ["canonical"] \
                and any(r in (el.get("rel") or "") for r in ("stylesheet", "icon", "preload")):
            urls.add(el.get("href"))
        if el.get("style"):
            urls |= set(re.findall(r"url\(\s*['\"]?([^'\")]+)", el.get("style")))
        if el.tag == "style" and el.text:
            urls |= set(re.findall(r"url\(\s*['\"]?([^'\")]+)", el.text))
    out = set()
    for u in urls:
        if u.startswith("data:"):
            continue
        full = urljoin(base, u)
        if urlsplit(full).netloc == urlsplit(WP).netloc:
            out.add(full)
    return out


def check_files(problems):
    """Every file the 49 pages ask for, and what their stylesheets name: each must answer 200."""
    session = requests.Session()
    wanted = set()
    for p in pages():
        status, text = fetch(wp_path(p))
        if status not in (200, 404):
            problems.append(f"{p['name']}: answers {status}")
            continue
        wanted |= asked_for(text, WP + wp_path(p))
    css = [u for u in wanted if urlsplit(u).path.endswith(".css")]
    for u in css:
        r = session.get(u, timeout=60)
        if r.status_code == 200:
            for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)", r.text):
                if not ref.startswith("data:") and not ref.startswith("#"):
                    full = urljoin(u, ref)
                    if urlsplit(full).netloc == urlsplit(WP).netloc:
                        wanted.add(full)
    failed = []
    for u in sorted(wanted):
        r = session.get(u, timeout=60, stream=True)
        if r.status_code != 200:
            failed.append((r.status_code, u))
        r.close()
    for code, u in failed[:20]:
        problems.append(f"file not answered: {code} {u}")
    return len(wanted), len(failed)


def main():
    problems = []
    for name in ("harlow.zip", "harlow-pictures.zip"):
        if not (HANDOFF / name).is_file():
            raise SystemExit(f"no {HANDOFF / name}: run _tools/package_theme.py first")
    if "harlow" in wp_cli("theme", "list", "--field=name").split():
        raise SystemExit("this WordPress has the harlow theme already: start from ./_tools/env.sh clean --yes")
    INBOX.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(HANDOFF / "harlow-pictures.zip", INBOX / "harlow-pictures.zip")

    uploaded, screen = asyncio.run(upload_theme(problems))
    active = wp_cli("theme", "list", "--status=active", "--field=name").strip()
    if active != "harlow":
        problems.append(f"the active theme is {active!r}")
    before = without_file(screen)
    print(f"  uploaded: {' '.join(uploaded.split())[:160]}")
    print(f"  Site pages before the pictures: {before} pictures without a file")
    # the pictures of the Media Library that the theme zip does not carry (the design's own
    # pictures are in it): the screen must name exactly these
    with zipfile.ZipFile(HANDOFF / "harlow.zip") as z:
        carried = set(z.namelist())
    media = json.loads((ROOT / "theme" / "install" / "media.json").read_text(encoding="utf-8"))["media"]
    expected = sum(1 for m in media if f"harlow/assets/uploads/{m['file']}" not in carried)
    if before != expected:
        problems.append(f"the screen said {before} pictures without a file, not {expected}")

    # As the host's File Manager unpacks a zip where it was uploaded.
    unpacked = wp_cli("eval", "$z = new ZipArchive(); $ok = true === $z->open( '/env/handoff/harlow-pictures.zip' );"
                              " $n = $ok ? $z->numFiles : 0; $ok = $ok && $z->extractTo( get_theme_file_path( 'assets' ) );"
                              " echo $ok ? $n : 'failed';")
    after = without_file(asyncio.run(read_screen()))
    print(f"  harlow-pictures.zip unpacked into the theme's assets/: {unpacked} files; pictures without a file now: {after}")
    if after:
        problems.append(f"{after} pictures still without a file")

    print("  verify_install --empty:")
    if verify_install.main("empty"):
        problems.append("the install from Site pages has problems (above)")

    asked, failed = check_files(problems)
    print(f"  files the 49 pages ask for: {asked}, {failed} not answered")
    for p in problems:
        print("  PROBLEM", p)
    size = (HANDOFF / "harlow.zip").stat().st_size / 1e6
    print(f"\nhandoff: harlow.zip ({size:.1f} MB) uploaded and activated in the dashboard; pictures without a file: "
          f"{before} before harlow-pictures.zip, {after} after; files the 49 pages ask for: {asked}, {failed} not answered; "
          f"{len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
