"""Which font faces the live pages really load, for pruning @font-face in build_css.py.

Loads every page in scope at both widths, settles it like capture.py, and records each
FontFace whose status is "loaded". Writes _capture/fonts_used.json.

Usage:
    python -u _tools/font_usage.py
"""

import asyncio
import json
import sys

from playwright.async_api import async_playwright

from capture import BLOCK, SETTLE
from common import CAPTURE, HEIGHT, UA, WIDTHS, pages

FONTS = """
() => [...document.fonts].filter(f => f.status === 'loaded')
  .map(f => [f.family.replace(/["']/g, ''), String(f.weight), f.style, f.unicodeRange])
"""


async def main():
    used = set()
    per_page = {}
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        for w in WIDTHS:
            ctx = await browser.new_context(viewport={"width": w, "height": HEIGHT}, user_agent=UA)
            await ctx.route("**/*", lambda r: r.abort() if any(h in r.request.url for h in BLOCK)
                            else r.continue_())
            for it in pages():
                page = await ctx.new_page()
                await page.goto(it["url"], wait_until="load", timeout=90000)
                await page.evaluate(SETTLE)
                faces = await page.evaluate(FONTS)
                per_page.setdefault(it["name"], set()).update(tuple(f) for f in faces)
                used.update(tuple(f) for f in faces)
                await page.close()
            await ctx.close()
        await browser.close()
    out = {"used": sorted(used), "pages": {k: sorted(v) for k, v in per_page.items()}}
    (CAPTURE / "fonts_used.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    fams = sorted({(f[0], f[1], f[2]) for f in used})
    print(f"{len(used)} loaded faces across {len(per_page)} pages")
    for f in fams:
        print("  ", *f)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main())
