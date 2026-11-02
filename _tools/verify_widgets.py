"""Stage 9: every widget the theme adds to the site's own (Elementor's Free and Pro widgets),
put on a page in the editor as the owner puts one, and seen on the page.

    python _tools/verify_widgets.py [name…]

On a draft page made for the check: each widget's block made from its block type with its
example content and put in the page's document, as the inserter puts it; each block valid,
given an element id of its own, and its style groups (parts.json) shown as panels of its
Styles tab. The page published, then read in Chrome at 1440 and 479: each widget there with
Elementor's widget class, drawn (anchors and closed panels aside), its own stylesheet and
script loaded; no error on the page. Then the widgets that behave are driven: tabs switch,
a toggle opens, a counter reaches its number, an alert is dismissed, an off-canvas panel
opens from its link. The page is deleted at the end.
"""
import asyncio
import json
import sys

from playwright.async_api import async_playwright

from common import ROOT
from verify_features import PUBLISH, Rest, open_editor
from wpsite import WP

sys.stdout.reconfigure(encoding="utf-8")

# The blocks of the site's own pages (stages 3 to 5); every other folder is a widget added.
OWN = {"accordion", "accordion-item", "box", "button", "container", "divider", "document", "gallery",
       "heading", "html", "icon", "icon-list", "image", "loop", "markup", "nav-menu", "post-content",
       "shortcode", "site-part", "social-icons", "template", "text"}
# Widgets that draw nothing until something opens them, or are marks only; and those that
# show the page's excerpt or featured picture, which the check's page has none of.
UNDRAWN = {"menu-anchor", "off-canvas", "sidebar", "progress-tracker", "read-more", "post-excerpt"}
ABSENT_HERE = {"post-featured-image"}

PUT = r"""
async ([names, pictures]) => {
  const be = wp.data.select('core/block-editor');
  const d = wp.data.dispatch('core/block-editor');
  const doc = be.getBlocks()[0];
  // A block takes others once the canvas has drawn it (its list settings are set then).
  const drawn = async (id) => {
    for (let i = 0; i < 60 && !be.getBlockListSettings(id); i++) await new Promise((r) => setTimeout(r, 500));
  };
  await drawn(doc.clientId);
  const made = (spec) => wp.blocks.createBlock(spec.name, spec.attributes || {},
    (spec.innerBlocks || []).map(made));
  // Widgets go in a container, as in Elementor (the document takes sections only).
  const box = wp.blocks.createBlock('harlow/container', {});
  d.insertBlocks(box, be.getBlockOrder(doc.clientId).length, doc.clientId, false);
  await drawn(box.clientId);
  const out = {};
  for (const name of names) {
    const type = wp.blocks.getBlockType(name);
    if (!type) { out[name] = { error: 'not registered' }; continue; }
    const example = type.example || {};
    // A gallery's pictures, chosen from the Media Library as the owner chooses them.
    const attributes = { ...( example.attributes || {} ) };
    if ( type.attributes.pictures && ! ( attributes.pictures || [] ).length ) {
      attributes.pictures = pictures;
    }
    const block = made({ name, attributes, innerBlocks: example.innerBlocks });
    d.insertBlocks(block, be.getBlockOrder(box.clientId).length, box.clientId, false);
    out[name] = { clientId: block.clientId };
  }
  await new Promise((r) => setTimeout(r, 4000));
  for (const name of names) {
    const id = out[name].clientId;
    if (!id) continue;
    const b = be.getBlock(id);
    out[name].valid = !!b && b.isValid !== false;
    out[name].element = (b && b.attributes.element) || '';
    out[name].classes = (b && b.attributes.classes) || '';
  }
  return out;
}
"""

PANELS = r"""
async ([id, labels]) => {
  wp.data.dispatch('core/block-editor').selectBlock(id);
  // the block's sidebar, whatever an earlier visit left open (the page's settings)
  wp.data.dispatch('core/interface').enableComplementaryArea('core', 'edit-post/block');
  await new Promise((r) => setTimeout(r, 900));
  for (let i = 0; i < 40 && !document.querySelector('.block-editor-block-inspector__tabs [role=tab]'); i++) {
    await new Promise((r) => setTimeout(r, 500));
  }
  const tab = [...document.querySelectorAll('.block-editor-block-inspector__tabs [role=tab]')]
    .find((t) => /styles/i.test(t.getAttribute('aria-label') || t.textContent));
  if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
  // the groups as the sidebar draws them, given up to ten seconds to arrive
  let missing = labels;
  for (let i = 0; i < 20 && missing.length; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const titles = [...document.querySelectorAll('.interface-complementary-area .components-panel__body-title')]
      .map((b) => b.textContent.trim());
    missing = labels.filter((l) => !titles.includes(l));
  }
  return missing;
}
"""

SEEN = r"""
(widgets) => widgets.map(([name, element, css, js]) => {
  const el = document.querySelector(`[data-id="${element}"]`);
  const box = el ? el.getBoundingClientRect() : null;
  return {
    name,
    there: !!el,
    widgetClass: !!el && [...el.classList].some((c) => c.startsWith('elementor-widget-') && c !== 'elementor-widget-container'),
    drawn: !!box && box.width > 0 && box.height > 0,
    css: !css || !!document.querySelector(`link#harlow-widget-${name}-css`),
    js: !js || !!document.querySelector(`script#harlow-widget-${name}-js`),
  };
})
"""


async def behaviours(page, elements):
    """The widgets that behave, driven as a visitor does; (name, passed) pairs."""
    out = []

    async def run(name, js):
        if name not in elements:
            return
        try:
            out.append((name, bool(await page.evaluate(js, elements[name]))))
        except Exception as e:  # noqa: BLE001
            out.append((name, f"error {str(e)[:80]}"))

    await run("tabs", """async (id) => {
      const w = document.querySelector(`[data-id="${id}"]`);
      const titles = w.querySelectorAll('.elementor-tabs-wrapper .elementor-tab-title');
      if (titles.length < 2) return false;
      titles[1].click(); await new Promise((r) => setTimeout(r, 600));
      const panes = w.querySelectorAll('.elementor-tab-content');
      return titles[1].classList.contains('elementor-active') && getComputedStyle(panes[1]).display !== 'none';
    }""")
    await run("toggle", """async (id) => {
      const w = document.querySelector(`[data-id="${id}"]`);
      const title = w.querySelector('.elementor-tab-title');
      const content = w.querySelector('.elementor-tab-content');
      const before = getComputedStyle(content).display;
      title.click(); await new Promise((r) => setTimeout(r, 700));
      return getComputedStyle(content).display !== before;
    }""")
    await run("counter", """async (id) => {
      const w = document.querySelector(`[data-id="${id}"]`);
      w.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 3500));
      const n = w.querySelector('.elementor-counter-number');
      return n && n.textContent.trim() === (n.dataset.toValue || '').trim() || /\\d/.test(n.textContent) && n.textContent.trim() !== '0';
    }""")
    await run("alert", """async (id) => {
      const w = document.querySelector(`[data-id="${id}"]`);
      const b = w.querySelector('.elementor-alert-dismiss');
      if (!b) return false;
      b.click(); await new Promise((r) => setTimeout(r, 900));
      const a = w.querySelector('.elementor-alert');
      return !a || getComputedStyle(a).display === 'none' || a.hidden;
    }""")
    await run("off-canvas", """async (id) => {
      const a = document.createElement('a'); a.href = `#off-canvas-${id}`; a.textContent = 'open';
      document.body.append(a); a.click(); await new Promise((r) => setTimeout(r, 900));
      const panel = document.getElementById(`off-canvas-${id}`);
      return !!panel && getComputedStyle(panel).visibility !== 'hidden' && getComputedStyle(panel).display !== 'none';
    }""")
    # A carousel: its next arrow moves the slides along.
    slide = """async (id) => {
      const w = document.querySelector(`[data-id="${id}"]`);
      const next = w.querySelector('.elementor-swiper-button-next, .swiper-button-next');
      const track = w.querySelector('.swiper-wrapper');
      if (!next || !track) return false;
      const where = () => getComputedStyle(track).transform + '|' + (w.querySelector('.swiper-slide-active') || {}).outerHTML;
      const before = where();
      next.click(); await new Promise((r) => setTimeout(r, 1500));
      return where() !== before;
    }"""
    for name in ("image-carousel", "testimonial-carousel", "reviews", "media-carousel", "slides"):
        await run(name, slide)
    return out


def main(only, keep=False):
    blocks = ROOT / "theme" / "blocks"
    names = sorted(p.name for p in blocks.iterdir() if (p / "block.json").exists() and p.name not in OWN)
    if only:
        names = [n for n in names if n in only]
    parts = {n: [p["label"] for p in json.loads((blocks / n / "parts.json").read_text(encoding="utf-8"))["parts"]]
             for n in names if (blocks / n / "parts.json").exists()}
    rest = Rest()
    made = rest("POST", "/pages", {"title": "Widgets check", "status": "draft",
                                   "content": '<!-- wp:harlow/document {"docType":"wp-page","postType":"page"} --><!-- /wp:harlow/document -->'})
    problems, rows = [], {}

    async def run():
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            ctx, page, errors = await open_editor(browser, f"/wp-admin/post.php?post={made['id']}&action=edit")
            pictures = [m["id"] for m in rest("GET", "/media?media_type=image&per_page=3&context=edit")]
            put = await page.evaluate(PUT, [[f"harlow/{n}" for n in names], pictures])
            for n in names:
                got = put[f"harlow/{n}"]
                rows[n] = {"valid": got.get("valid"), "element": got.get("element", ""), "panels": "-"}
                if got.get("error") or not got.get("valid"):
                    problems.append(f"{n}: in the editor {got.get('error') or 'invalid'}")
                elif not got.get("element"):
                    problems.append(f"{n}: no element id given in the editor")
                if n in parts and got.get("clientId"):
                    missing = await page.evaluate(PANELS, [got["clientId"], parts[n]])
                    rows[n]["panels"] = f"{len(parts[n]) - len(missing)} of {len(parts[n])}"
                    if missing:
                        problems.append(f"{n}: Styles tab without its groups {missing}")
            saved = await page.evaluate(PUBLISH, "Widgets check")
            if saved["failed"]:
                problems.append("the page did not save")
            if errors:
                problems.append(f"errors in the editor: {errors[:3]}")
            await ctx.close()
            link = rest("GET", f"/pages/{made['id']}")["link"]
            elements = {n: rows[n]["element"] for n in names if rows[n]["element"]}
            spec = [[n, elements[n], (ROOT / "assets/css/widgets" / f"{n}.css").exists(),
                     (ROOT / "assets/js/widgets" / f"{n}.js").exists()] for n in elements]
            for width in (1440, 479):
                vctx = await browser.new_context(viewport={"width": width, "height": 900})
                await vctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
                vpage = await vctx.new_page()
                page_errors = []
                vpage.on("pageerror", lambda e: page_errors.append(str(e)))
                await vpage.goto(link, wait_until="load", timeout=120000)
                await vpage.wait_for_timeout(1500)
                for s in await vpage.evaluate(SEEN, spec):
                    row = rows[s["name"]]
                    row[width] = (all((s["there"], s["widgetClass"], s["css"], s["js"])) and (s["drawn"] or s["name"] in UNDRAWN))                         or (s["name"] in ABSENT_HERE and s["css"])
                    if not row[width]:
                        problems.append(f"{s['name']} at {width}: {s}")
                if width == 1440:
                    for name, ok in await behaviours(vpage, elements):
                        rows[name]["behaviour"] = ok
                        if ok is not True:
                            problems.append(f"{name}: behaviour {ok}")
                if page_errors:
                    problems.append(f"errors on the page at {width}: {page_errors[:3]}")
                await vctx.close()
            await browser.close()

    try:
        asyncio.run(run())
    finally:
        if keep:
            print("kept:", rest("GET", f"/pages/{made['id']}")["link"], made["id"])
        else:
            rest("DELETE", f"/pages/{made['id']}?force=true")
    print(f"{'widget':22} {'editor':7} {'parts':9} {'1440':5} {'479':5} behaviour")
    for n in names:
        r = rows.get(n, {})
        print(f"{n:22} {'yes' if r.get('valid') and r.get('element') else 'NO':7} {r.get('panels', '-'):9} "
              f"{'yes' if r.get(1440) else 'NO':5} {'yes' if r.get(479) else 'NO':5} {r.get('behaviour', '')}")
    good = sum(1 for n in names if rows.get(n, {}).get("valid") and rows[n].get(1440) and rows[n].get(479))
    driven = [r["behaviour"] for r in rows.values() if "behaviour" in r]
    print(f"widgets: {len(names)} put on a page in the editor and seen at 1440 and 479, {good} without a problem; "
          f"{sum(1 for p in parts.values() for _ in p)} style groups; {sum(1 for b in driven if b is True)} of "
          f"{len(driven)} behaviours; {len(problems)} problems")
    for p in problems:
        print("  PROBLEM", p)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main({a for a in sys.argv[1:] if not a.startswith('--')}, '--keep' in sys.argv)
