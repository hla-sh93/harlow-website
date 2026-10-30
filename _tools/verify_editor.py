"""Stage 4 check: the pages' blocks in the block editor.

Every page WordPress has from the reference is opened in the block editor, in Chrome,
logged in by a cookie WordPress makes through WP-CLI (wpsite.login_cookies()):

* blocks: every block is valid (its saved markup is what its save function makes) and
  none is missing;
* canvas: the canvas paints what the page paints. At 1440, 900 and 479 wide (the canvas's
  own width, sidebars closed), every element of the page's document in the canvas against
  the same element of the page on the site opened at that width: its box (from the
  document's top-left; inside a fixed element, from the top of the screen) and every
  computed property. Custom properties are compared where the page has them (the editor
  sets hundreds of its own on every element). Held apart, the element compared but not
  what is inside it: what a script redraws on the page (a carousel's slides and their
  copies, the menus, the history slider). Animations and transitions are held still;
* clicks: every word and picture takes a click. At a point of each line of words and of
  each picture in the canvas, the element there belongs to its block, and a click there
  selects that block. Words and pictures the design lays another element of the page over
  (as on the page itself) are listed apart: List View selects them;
* patterns: every section of the library and every page starter is read by the editor
  with every block valid, and prints what the section or page it was taken from prints
  on the reference, element by element.

With --save (a run of its own), each page is saved through the editor as an edit saves
it (its blocks written again by their save functions), the pages are compared with the
reference by verify_wp.py and verify_render.py, and put back (`wp harlow install
--restore`).

    python -u _tools/verify_editor.py [--save] [name ...]

Finding what differs: --width=1440 (one width), --no-clicks, --why (which properties and
sizes differ, over every element).

Passing looks like: `patterns: 78 read by the editor, N blocks, 0 invalid; 78 printed, N
elements - 0 differ from their source` and `editor: 22 pages, N blocks valid, 0 invalid or
missing; canvas: 22 pages x 3 widths, N elements - 0 of 22 pages differ (…); clicks: N words
and pictures, 0 missed, N under the page's own elements as on the page`; with --save,
`saved through the editor: 22 pages, 0 failed to save; markup identical, browser identical`.
"""

import asyncio
import collections
import difflib
import json
import re
import sys

from playwright.async_api import async_playwright

from capture import SETTLE
from common import HEIGHT, ROOT
from compare import FREEZE_TIMERS
from refcheck import STILL
from verify_wp import accepted
from wpsite import WP, compare_trees, elements, known_paths, login_cookies, parse, reference, wp_cli

WIDTHS = (1440, 900, 479)
JOBS = 3   # pages checked at the same time
CANVAS_DOC = ".is-root-container > [data-elementor-type='wp-page']"
PAGE_DOC = "body > [data-elementor-type='wp-page']"
# What the editor adds inside the page's elements, which the page does not have.
EDITOR_ONLY = ".block-list-appender, .block-editor-block-list__insertion-point"
# Elements of the editor's own around a block's elements: left out, what is inside them
# compared. A synced pattern's box; the holder of a server markup of several elements
# (display: contents); the typing surface WordPress's list item puts its words in, inside
# the <li> (the page has the words in the <li>).
TRANSPARENT = ("[data-type='core/block'], .harlow-server-markup, "
               "li[data-type='core/list-item'] > div.block-editor-rich-text__editable")
# What the editor sets for its own behaviour, which paints nothing: dragging blocks,
# selecting, typing (caret and cursor), the content of a synced pattern not taking clicks.
EDITOR_PROPS = ["cursor", "user-select", "-webkit-user-drag", "-webkit-user-modify", "pointer-events",
                "interactivity", "caret-color"]
# What the browser sets on what can be typed into (contenteditable), and the editor's
# white-space: pre-wrap there: compared on every other element, counted by name here.
TYPING = ["white-space-collapse", "text-wrap-mode", "line-break", "-webkit-line-break", "overflow-wrap",
          "word-wrap", "-webkit-nbsp-mode"]
# A held element's grid tracks are sized by what is inside it (a carousel's slides).
HELD_SKIP = ["grid-template-columns", "grid-template-rows"]
# What a script redraws on the page: compared as an element, not what is inside it.
HELD = {
    ".elementor-widget-loop-carousel .swiper": "a carousel's slides (carousel.js copies them for its loop)",
    ".elementor-widget-nav-menu": "a menu (nav-menu.js marks its items and adds its buttons)",
    "#history-slider": "the history slider (history-slider.js)",
}

OPEN_EDITOR = """
() => {
  const p = wp.data.dispatch('core/preferences');
  p.set('core/edit-post', 'welcomeGuide', false);
  p.set('core', 'fullscreenMode', true);
  p.set('core', 'fixedToolbar', true);
  const i = wp.data.dispatch('core/interface');
  i.disableComplementaryArea('core');
  i.disableComplementaryArea('core/edit-post');
  const e = wp.data.dispatch('core/editor');
  if (e.setIsListViewOpened) e.setIsListViewOpened(false);
  if (e.setIsInserterOpened) e.setIsInserterOpened(false);
  wp.data.dispatch('core/block-editor').clearSelectedBlock();
}
"""

BLOCKS = """
() => {
  const out = { total: 0, invalid: [], missing: [] };
  const walk = (list) => list.forEach((b) => {
    out.total += 1;
    if (!b.isValid) out.invalid.push(b.name + ' ' + (b.attributes.element || b.attributes.className || ''));
    if (b.name === 'core/missing') out.missing.push(b.attributes.originalName);
    walk(b.innerBlocks);
  });
  walk(wp.data.select('core/block-editor').getBlocks());
  return out;
}
"""

# Every element under the document: tag, classes, box, a hash of its computed style.
ROWS = """
([sel, skip, held, customNames, transparent, editorProps, typingProps, heldSkip]) => {
  const own = new Set(editorProps); const typing = new Set(typingProps);
  const uploads = /http:\\/\\/localhost:8090\\/wp-content\\/uploads\\//g;
  const local = /http:\\/\\/localhost:8090\\/(static\\/|wp-content\\/themes\\/harlow\\/)?/g;
  // Chrome reports an auto side margin as its length or as 0px depending on the layout
  // pass; the box (left edge and width) is compared instead.
  const SIDE = new Set(['margin-left', 'margin-right', 'margin-inline-start', 'margin-inline-end']);
  const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const keep = customNames ? new Set(customNames) : null;
  const root = document.querySelector(sel);
  if (!root) return null;
  const r0 = root.getBoundingClientRect();
  const fixed = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (getComputedStyle(e).position === 'fixed') return true; } return false; };
  const rows = []; const custom = new Set();
  const walk = (el) => {
    if (skip && el.matches(skip)) return;
    if (transparent && el.matches(transparent)) { for (const c of el.children) walk(c); return; }
    const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
    const o = fixed(el) ? { left: 0, top: 0 } : r0;
    const names = [];
    const isHeld = held.find((h) => el.matches(h)) || '';
    for (let i = 0; i < cs.length; i++) {
      const n = cs[i];
      if (n.startsWith('--hl-color-') || SIDE.has(n) || own.has(n) || typing.has(n)) continue;
      if (isHeld && heldSkip.includes(n)) continue;
      if (n.startsWith('--')) { custom.add(n); if (keep && !keep.has(n)) continue; }
      names.push(n);
    }
    names.sort();
    let s = ''; for (const n of names) s += n + ':' + cs.getPropertyValue(n).replace(uploads, '/assets/uploads/').replace(local, '/') + ';';
    let t = ''; for (const n of typingProps) t += n + ':' + cs.getPropertyValue(n) + ';';
    rows.push([el.tagName.toLowerCase() + '#' + (el.getAttribute('data-id') || ''), (el.getAttribute('class') || '').slice(0, 80), fnv(s),
               [b.left - o.left, b.top - o.top, b.width, b.height].map(v => +v.toFixed(1)), isHeld,
               fnv(t), !!el.closest('.rich-text, [contenteditable="true"]')]);
    if (!isHeld) for (const c of el.children) walk(c);
  };
  walk(root);
  return { rows, custom: [...custom] };
}
"""

# One element's computed style, to name what differs.
DETAIL = """
([sel, skip, held, customNames, transparent, editorProps, index]) => {
  const own = new Set(editorProps);
  const uploads = /http:\\/\\/localhost:8090\\/wp-content\\/uploads\\//g;
  const local = /http:\\/\\/localhost:8090\\/(static\\/|wp-content\\/themes\\/harlow\\/)?/g;
  const keep = customNames ? new Set(customNames) : null;
  const list = [];
  const walk = (el) => {
    if (skip && el.matches(skip)) return;
    if (transparent && el.matches(transparent)) { for (const c of el.children) walk(c); return; }
    list.push(el);
    if (!held.find((h) => el.matches(h))) for (const c of el.children) walk(c);
  };
  walk(document.querySelector(sel));
  const el = list[index]; const cs = getComputedStyle(el); const props = {};
  for (let i = 0; i < cs.length; i++) { const n = cs[i];
    if (n.startsWith('--hl-color-') || own.has(n) || (n.startsWith('--') && keep && !keep.has(n))) continue;
    props[n] = cs.getPropertyValue(n).replace(uploads, '/assets/uploads/').replace(local, '/'); }
  return { tag: el.tagName.toLowerCase(), id: el.getAttribute('data-id'), cls: (el.getAttribute('class') || '').slice(0, 60), props };
}
"""

# Is this element, at this rectangle, on screen: shown, not clipped away by a box around
# it (a closed menu, a screen-reader-only label), inside the document?
SHOWN = """
const shown = (el, r, root) => {
  if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
  const rr = root.getBoundingClientRect();
  if (r.right <= rr.left || r.left >= rr.right) return false;
  for (let a = el; a && a !== document.body; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.clip !== 'auto' && (cs.position === 'absolute' || cs.position === 'fixed')) return false;
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const ar = a.getBoundingClientRect();
      if (r.right <= ar.left + 1 || r.left >= ar.right - 1 || r.bottom <= ar.top + 1 || r.top >= ar.bottom - 1) return false;
    }
  }
  return true;
};
const rectOf = (node) => {
  if (node.nodeType === 1) { const r = node.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; }
  const range = document.createRange(); range.selectNodeContents(node);
  return [...range.getClientRects()].find((x) => x.width > 2 && x.height > 2) || null;
};
// The block a click there should select: the nearest one that takes clicks (a synced
// pattern's blocks do not: the pattern does).
const blockOf = (el) => {
  let b = el && el.closest('[data-block]');
  while (b && (b.closest('[inert]') || getComputedStyle(b).pointerEvents === 'none')) b = b.parentElement && b.parentElement.closest('[data-block]');
  return b ? b.dataset.block : null;
};
"""

# The words and pictures of the canvas's document that are on screen.
TARGETS = """
(sel) => {
""" + SHOWN + """
  const root = document.querySelector(sel);
  const found = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.data.trim()) continue;
    const r = rectOf(n);
    if (r && shown(n.parentElement, r, root)) found.push({ node: n, kind: 'words', text: n.data.trim().slice(0, 40) });
  }
  root.querySelectorAll('img').forEach((img) => {
    const r = rectOf(img);
    if (r && shown(img, r, root)) found.push({ node: img, kind: 'picture', text: (img.getAttribute('src') || '').split('/').pop().slice(0, 40) });
  });
  window.harlowTargets = found;
  return found.map(({ kind, text }) => ({ kind, text }));
}
"""

# Where one target is now (a selection can move things), brought into view.
LOCATE = """
([sel, index]) => {
""" + SHOWN + """
  const root = document.querySelector(sel);
  const { node } = window.harlowTargets[index];
  if (!node.isConnected) return { gone: true };
  const el = node.nodeType === 1 ? node : node.parentElement;
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  const r = rectOf(node);
  if (!r || !shown(el, r, root)) return { hidden: true };
  // any part of it that shows: points across a line of words, a grid over a picture
  const fx = [0.5, 0.1, 0.3, 0.7, 0.9], fy = node.nodeType === 1 ? [0.5, 0.15, 0.85] : [0.5];
  const want = blockOf(el);
  let x = r.left + r.width / 2, y = r.top + r.height / 2, hit = document.elementFromPoint(x, y);
  for (const b of fy) for (const a of fx) {
    if (blockOf(hit) === want) break;
    const h = document.elementFromPoint(r.left + r.width * a, r.top + r.height * b);
    if (blockOf(h) === want) { x = r.left + r.width * a; y = r.top + r.height * b; hit = h; }
  }
  const name = (e) => { const b = e && e.closest('[data-block]'); return b ? b.dataset.type + (b.dataset.id ? ' ' + b.dataset.id : '') : 'nothing'; };
  return { x, y, block: blockOf(el), hitBlock: blockOf(hit), own: !!(hit && hit.closest(sel)),
           hit: hit ? hit.tagName.toLowerCase() + '.' + (hit.getAttribute('class') || '').split(' ').slice(0, 2).join('.') + ' of ' + name(hit) + ' over ' + name(el) : null };
}
"""


PATTERNS_IN_EDITOR = """
async () => {
  const all = await wp.data.resolveSelect('core').getBlockPatterns();
  const out = [];
  for (const p of all.filter((x) => (x.categories || []).some((c) => c.startsWith('harlow-')))) {
    const bad = [];
    let total = 0;
    const walk = (list) => list.forEach((b) => {
      total += 1;
      if (!b.isValid) bad.push(b.name + ' ' + (b.attributes.element || ''));
      if (b.name === 'core/missing') bad.push('missing ' + b.attributes.originalName);
      walk(b.innerBlocks);
    });
    walk(wp.blocks.parse(p.content));
    out.push({ name: p.name, total, bad });
  }
  return out;
}
"""

# Each pattern printed as on the page it was taken from (a menu marks that page current,
# a pager links to that page's next one).
RENDER_PATTERNS = (
    "$out = array(); $ids = harlow_named_posts();"
    " foreach ( WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $p ) {"
    "  if ( ! array_intersect( (array) $p['categories'], array( 'harlow-sections', 'harlow-starters' ) ) ) { continue; }"
    r"  preg_match( '/(?:of the|as on) ([\w-]+)(?: page)?\.$/', $p['description'], $m );"
    "  query_posts( array( 'page_id' => $ids[ $m[1] ] ) ); the_post();"
    "  $out[ $p['name'] ] = array( 'description' => $p['description'], 'content' => $p['content'], 'html' => do_blocks( $p['content'] ) );"
    "  wp_reset_query();"
    " }"
    " echo wp_json_encode( $out );"
)


async def check_patterns_in_editor(browser, post):
    """Every pattern of the theme read by the editor: [(name, blocks, invalid)]."""
    ctx, editor, frame, errors = await open_editor(browser, post, WIDTHS[0])
    try:
        return await editor.evaluate(PATTERNS_IN_EDITOR)
    finally:
        await ctx.close()


def check_patterns_markup():
    """Each pattern as WordPress prints it, against the section or page of the reference it
    was taken from: {name: (elements, differences)}."""
    known = known_paths()
    out = {}
    for name, p in json.loads(wp_cli("eval", RENDER_PATTERNS)).items():
        source = re.search(r"(?:of the|as on) ([\w-]+)(?: page)?\.$", p["description"]).group(1)
        ref_doc = reference(source)
        if "/starter-" in name:
            ref = ref_doc.xpath("//body//*[@data-elementor-type='wp-page']")[0]
            attrs = " ".join(f'{k}="{v}"' for k, v in ref.attrib.items())
            got = parse(f"<div {attrs}>{p['html']}</div>").xpath("//body/div")[0]
        else:
            first = re.search(r'"element":"(\w+)"', p["content"]).group(1)
            ref = ref_doc.xpath(f"//*[@data-id='{first}']")[0]
            got = parse(p["html"]).xpath(f"//*[@data-id='{first}']")[0]
        diff, hints = compare_trees(got, ref, known)
        diff, ok = accepted(source, ref, diff)   # the home page footer's rel and target (README)
        out[name] = (len(elements(ref)), diff)
    return out


async def save_pages(items):
    """Save every page through the editor; [(name, problem or '')]."""
    out = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        for name, path, post in items:
            ctx, editor, frame, errors = await open_editor(browser, post, WIDTHS[0], settle=False)
            try:
                r = await editor.evaluate(SAVE)
                out.append((name, "the save failed" if r["failed"] or r["dirty"] else ""))
            finally:
                await ctx.close()
            print(f"  saved {name}{': ' + out[-1][1] if out[-1][1] else ''}", flush=True)
        await browser.close()
    return out


def check_saved(items):
    """Save every page through the editor, compare the pages with the reference, put them back."""
    import verify_render
    import verify_wp
    names = {name for name, _, _ in items}
    try:
        saved = asyncio.run(save_pages(items))
        failed = [f"{n}: {p}" for n, p in saved if p]
        print("\nthe saved pages against the reference, markup:")
        markup = verify_wp.main(names, space=True)
        print("\nthe saved pages against the reference, in the browser:")
        render = verify_render.main(names)
    finally:
        print("\n" + wp_cli("harlow", "install", "--restore"))
    print(f"\nsaved through the editor: {len(saved)} pages, {len(failed)} failed to save; "
          f"markup {'identical' if not markup else 'differs'}, browser {'identical' if not render else 'differs'}")
    return 1 if failed or markup or render else 0


def named_pages(only):
    site = json.loads((ROOT / "theme" / "install" / "site.json").read_text(encoding="utf-8"))
    ids = json.loads(wp_cli("eval", "echo wp_json_encode( harlow_named_posts() );"))
    return [(p["name"], p["path"], ids[p["name"]]) for p in site["pages"]
            if (not only or p["name"] in only) and p["name"] in ids]


# Save the page as an edit saves it: its blocks written again by their save functions.
SAVE = """
async () => {
  const blocks = wp.data.select('core/block-editor').getBlocks();
  wp.data.dispatch('core/editor').resetEditorBlocks([...blocks]);
  await wp.data.dispatch('core/editor').savePost();
  const e = wp.data.select('core/editor');
  return { failed: e.didPostSaveRequestFail(), dirty: e.isEditedPostDirty(), content: e.getEditedPostContent().length };
}
"""


async def open_editor(browser, post, width, settle=True):
    ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT}, device_scale_factor=1)
    await ctx.add_cookies(login_cookies())
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))
    await page.goto(f"{WP}/wp-admin/post.php?post={post}&action=edit", wait_until="load", timeout=120000)
    await page.wait_for_function("() => window.wp && wp.data && wp.data.select('core/block-editor').getBlockCount() > 0",
                                 timeout=90000)
    await page.evaluate(OPEN_EDITOR)
    frame = None
    for _ in range(100):
        frame = page.frame(name="editor-canvas")
        if frame:
            break
        await page.wait_for_timeout(100)
    await frame.wait_for_function(f"() => document.querySelector(\"{CANVAS_DOC}\") && !document.querySelector('.harlow-loading')",
                                  timeout=90000)
    # the canvas as wide and as tall as asked (vh units): the editor around it is added
    inner = await frame.evaluate("() => [innerWidth, innerHeight]")
    if inner != [width, HEIGHT]:
        await page.set_viewport_size({"width": 2 * width - inner[0], "height": 2 * HEIGHT - inner[1]})
        await page.wait_for_timeout(800)
        frame = page.frame(name="editor-canvas")   # the editor may draw the canvas anew
    # every stylesheet of the canvas in, and the blocks' server markup
    await frame.wait_for_function("() => document.readyState === 'complete'"
                                  " && [...document.querySelectorAll('link[rel=stylesheet]')].every((l) => l.sheet)"
                                  f" && document.querySelector(\"{CANVAS_DOC}\") && !document.querySelector('.harlow-loading')",
                                  timeout=90000)
    if settle:
        await frame.evaluate(SETTLE)
        await frame.add_style_tag(content=STILL)
        await page.wait_for_timeout(300)
    return ctx, page, frame, errors


async def open_page(browser, path, width):
    ctx = await browser.new_context(viewport={"width": width, "height": HEIGHT}, device_scale_factor=1)
    await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
    await ctx.add_init_script(FREEZE_TIMERS)
    page = await ctx.new_page()
    await page.goto(WP + path, wait_until="load", timeout=120000)
    await page.evaluate(SETTLE)
    await page.add_style_tag(content=STILL)
    await page.wait_for_timeout(300)
    return ctx, page


async def compare_canvas(browser, name, path, post, width):
    """(elements, differences, blocks report, canvas width) for one page at one width."""
    ectx, editor, frame, errors = await open_editor(browser, post, width)
    try:
        blocks = await editor.evaluate(BLOCKS) if width == WIDTHS[0] else None
        canvas_width = await frame.evaluate("() => innerWidth")
        pctx, site = await open_page(browser, path, canvas_width)
        try:
            held = list(HELD)
            ref = await site.evaluate(ROWS, [PAGE_DOC, "", held, None, "", EDITOR_PROPS, TYPING, HELD_SKIP])
            got = await frame.evaluate(ROWS, [CANVAS_DOC, EDITOR_ONLY, held, ref["custom"], TRANSPARENT, EDITOR_PROPS, TYPING, HELD_SKIP])
            a, b = got["rows"], ref["rows"]
            problems, sizes, props, details, typed, wider = [], [], collections.Counter(), 0, 0, 0
            sm = difflib.SequenceMatcher(None, [r[0] for r in a], [r[0] for r in b], autojunk=False)
            for op, i1, i2, j1, j2 in sm.get_opcodes():
                if op != "equal":
                    problems.append(f"{op}: canvas {[r[0] + '.' + r[1][:30] for r in a[i1:i2][:2]]} ({i2 - i1}) / "
                                    f"page {[r[0] + '.' + r[1][:30] for r in b[j1:j2][:2]]} ({j2 - j1})")
                    continue
                for i, j in zip(range(i1, i2), range(j1, j2)):
                    x, y = a[i], b[j]
                    if x[5] != y[5]:
                        if x[6]:
                            typed += 1
                        else:
                            problems.append(f"#{j} <{y[0]} {y[1][:40]}>: white space or word breaking differs")
                    hidden = x[3][2:] == [0, 0] and y[3][2:] == [0, 0]
                    if x[2:4] == y[2:4] or (x[2] == y[2] and hidden):
                        continue
                    # pre-wrap keeps the space at the end of a wrapped line: a few px wider
                    if (x[6] and x[2] == y[2] and x[3][:2] == y[3][:2] and x[3][3] == y[3][3]
                            and 0 < x[3][2] - y[3][2] <= 8):
                        wider += 1
                        continue
                    if x[3] != y[3] and not hidden:
                        problems.append(f"#{j} <{y[0]} {y[1][:40]}>: box {x[3]} / page {y[3]}")
                        if x[3][2:] != y[3][2:]:
                            sizes.append(f"#{j} <{y[0]} {y[1][:50]}>: size {x[3][2:]} / page {y[3][2:]}")
                    if x[2] != y[2] and details < 400:
                        details += 1
                        da = await frame.evaluate(DETAIL, [CANVAS_DOC, EDITOR_ONLY, held, ref["custom"], TRANSPARENT, EDITOR_PROPS, i])
                        db = await site.evaluate(DETAIL, [PAGE_DOC, "", held, None, "", EDITOR_PROPS, j])
                        diff = [(p, db["props"].get(p), da["props"].get(p))
                                for p in sorted(set(da["props"]) | set(db["props"]))
                                if da["props"].get(p) != db["props"].get(p)]
                        for p, v1, v2 in diff:
                            props[(p, str(v2)[:40], str(v1)[:40])] += 1
                        problems.append(f"#{j} <{y[0]} {db['id'] or db['cls'][:40]}>: " +
                                        "; ".join(f"{p} {v2!r} / page {v1!r}" for p, v1, v2 in diff[:4]))
            if errors:
                problems.append(f"script errors in the editor: {errors[:2]}")
            if "--why" in sys.argv:
                print(f"    {name} {width}: sizes that differ ({len(sizes)}):")
                for s in sizes[:25]:
                    print("      " + s)
                shown = 0
                for i, j in [(i, j) for op, i1, i2, j1, j2 in sm.get_opcodes() if op == "equal"
                             for i, j in zip(range(i1, i2), range(j1, j2))]:
                    if a[i][3][2:] != b[j][3][2:] and shown < 5 and j > 17:
                        shown += 1
                        da = await frame.evaluate(DETAIL, [CANVAS_DOC, EDITOR_ONLY, held, ref["custom"], TRANSPARENT, EDITOR_PROPS, i])
                        db = await site.evaluate(DETAIL, [PAGE_DOC, "", held, None, "", EDITOR_PROPS, j])
                        print(f"      detail #{j} <{db['tag']} {db['cls']}>: " + "; ".join(
                            f"{k} {da['props'].get(k)!r}/{db['props'].get(k)!r}" for k in sorted(set(da["props"]) | set(db["props"]))
                            if da["props"].get(k) != db["props"].get(k) and not k.startswith("--wp")
                            and k not in ("-webkit-locale", "user-select", "cursor", "overflow-wrap", "-webkit-user-drag")))
                for line in problems[:15]:
                    print(f"      problem: {line[:220]}")
                print(f"    {name} {width}: properties that differ (canvas / page), by elements:")
                for (p, v2, v1), n in props.most_common(30):
                    print(f"      {n:5} {p}: {v2!r} / {v1!r}")
            return len(b), problems, blocks, canvas_width, (typed, wider)
        finally:
            await pctx.close()
    finally:
        await ectx.close()


async def check_clicks(browser, post):
    """(targets, misses, covered) for one page at 1440: covered, under another element of
    the page's own (the design lays one over the other, as on the page)."""
    ctx, editor, frame, errors = await open_editor(browser, post, WIDTHS[0])
    try:
        targets = await frame.evaluate(TARGETS, CANVAS_DOC)
        box = await (await editor.query_selector("iframe[name='editor-canvas']")).bounding_box()
        misses, covered = [], []
        for index, target in enumerate(targets):
            # each click as a first click: nothing selected, nothing focused
            await editor.evaluate("() => wp.data.dispatch('core/block-editor').clearSelectedBlock()")
            await frame.evaluate("() => document.activeElement && document.activeElement.blur()")
            spot = await frame.evaluate(LOCATE, [CANVAS_DOC, index])
            if spot.get("gone") or spot.get("hidden"):
                misses.append(f"{target['kind']} {target['text']!r}: {'no longer there' if spot.get('gone') else 'no longer on screen'}"
                              " after the previous click was taken back")
                continue
            if spot["hitBlock"] != spot["block"]:
                (covered if spot["own"] else misses).append(f"{target['kind']} {target['text']!r}: under {spot['hit']}")
                continue
            await editor.mouse.click(box["x"] + spot["x"], box["y"] + spot["y"])
            selected = await editor.evaluate("() => wp.data.select('core/block-editor').getSelectedBlockClientId()")
            if selected != spot["block"]:
                misses.append(f"{target['kind']} {target['text']!r}: a click selected "
                              f"{'nothing' if not selected else 'another block'}")
        return len(targets), misses, covered
    finally:
        await ctx.close()


async def check_page(browser, name, path, post, results, clicks, again):
    """The canvas at every width (a differing one measured again), then the clicks."""
    for width in WIDTHS:
        for attempt in (1, 2):
            try:
                result = await compare_canvas(browser, name, path, post, width)
            except Exception as err:   # a page that did not open is a difference, not a pass
                result = (0, [f"did not open: {str(err)[:160]}"], None, width, (0, 0))
            if attempt == 1 or len(result[1]) < len(results[(name, width)][1]):
                results[(name, width)] = result
            if not results[(name, width)][1]:
                break
            if attempt == 1:
                again.add((name, width))
        count, problems = results[(name, width)][:2]
        print(f"  {name[:40]:40} {width}: {'ok' if not problems else str(len(problems)) + ' diff'} ({count})",
              flush=True)
    if "--no-clicks" in sys.argv:
        clicks[name] = (0, [], [])
        return
    try:
        clicks[name] = await check_clicks(browser, post)
    except Exception as err:
        clicks[name] = (0, [f"did not open: {str(err)[:160]}"], [])
    print(f"  {name[:40]:40} clicks: {clicks[name][0]} targets, {len(clicks[name][1])} missed", flush=True)


async def run(items):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        results, clicks, again = {}, {}, set()
        jobs = asyncio.Semaphore(JOBS)

        async def one(item):
            async with jobs:
                await check_page(browser, *item, results, clicks, again)
        await asyncio.gather(*[one(item) for item in items])
        await browser.close()
    return results, clicks, len(again)


def main(args):
    global WIDTHS
    WIDTHS = tuple(int(a.split("=")[1]) for a in args if a.startswith("--width=")) or WIDTHS
    only = {a for a in args if not a.startswith("--")}
    items = named_pages(only)
    if "--save" in args:
        return check_saved(items)
    results, clicks, again = asyncio.run(run(items))
    patterns_ok = True
    if not only:
        async def read_patterns():
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(channel="chrome")
                try:
                    return await check_patterns_in_editor(browser, items[0][2])
                finally:
                    await browser.close()
        in_editor = asyncio.run(read_patterns())
        markup = check_patterns_markup()
        n_blocks = sum(x["total"] for x in in_editor)
        bad = [(x["name"], x["bad"]) for x in in_editor if x["bad"]]
        changed = [(n, d) for n, (c, d) in markup.items() if d]
        for n, b in bad:
            print(f"DIFF pattern {n}: {len(b)} invalid blocks: {b[:3]}")
        for n, d in changed:
            print(f"DIFF pattern {n}: {d[:3]}")
        print(f"patterns: {len(in_editor)} read by the editor, {n_blocks} blocks, {sum(len(b) for _, b in bad)} invalid; "
              f"{len(markup)} printed, {sum(c for c, _ in markup.values())} elements - {len(changed)} differ from their source")
        patterns_ok = not bad and not changed and len(in_editor) == len(markup) > 0
    differ, total, valid, invalid, targets, missed, typed, wider, covered = set(), 0, 0, 0, 0, 0, 0, 0, 0
    print()
    for name, _, _ in items:
        blocks = results[(name, WIDTHS[0])][2] or {"total": 0, "invalid": ["(not read)"], "missing": []}
        valid += blocks["total"] - len(blocks["invalid"])
        invalid += len(blocks["invalid"]) + len(blocks["missing"])
        bad = blocks["invalid"] + [f"missing {m}" for m in blocks["missing"]]
        cells = []
        for w in WIDTHS:
            count, problems, _, cw, (n_typed, n_wider) = results[(name, w)]
            total += count
            typed += n_typed
            wider += n_wider
            cells.append(f"{w}: {'ok' if not problems else str(len(problems)) + ' diff'} ({count})")
            if problems:
                differ.add(name)
        n_targets, misses, under = clicks[name]
        targets += n_targets
        missed += len(misses)
        covered += len(under)
        state = "OK  " if name not in differ and not bad and not misses else "DIFF"
        print(f"{state} {name[:36]:36} blocks {blocks['total']}, {len(bad)} invalid   " + "   ".join(cells)
              + f"   clicks {n_targets - len(misses) - len(under)}/{n_targets}"
              + (f" ({len(under)} under the page's own elements)" if under else ""))
        for b in bad[:4]:
            print(f"        block: {b}")
        for w in WIDTHS:
            for p in results[(name, w)][1][:6]:
                print(f"        {w}: {p[:240]}")
        for m in misses[:6 if "--why" not in sys.argv else 60]:
            print(f"        click: {m}")
        for m in under:
            print(f"        under the page's own element (as on the page; List View selects it): {m}")
    print(f"\neditor: {len(items)} pages, {valid} blocks valid, {invalid} invalid or missing; "
          f"canvas: {len(items)} pages x {len(WIDTHS)} widths, {total} elements - {len(differ)} of {len(items)} pages differ "
          f"({again} page-widths measured again) "
          f"({typed} elements that take typing keep the browser's white space for typing, "
          f"{wider} of them a few px wider where a line ends in a space); "
          f"clicks: {targets} words and pictures, {missed} missed, {covered} under the page's own elements as on the page")
    return 1 if differ or invalid or missed or not patterns_ok or not items else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv[1:]))
