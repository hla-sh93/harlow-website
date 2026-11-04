"""Every control of the Styles tab of every kind of element, used in the sidebar as a person
uses it, judged by what it does on the canvas (stage 9, after the owner's round: "you must
find these problems yourself").

For each block of the theme, a new one is put on a draft page from the inserter (in a
container: the document takes containers only) and:

  new        it is drawn (a box of its own, not 0 high) in the brand's colours: none of
             Elementor's kit defaults (#6EC1E4, #61CE70, #54595F, #7A7A7A) in its colours;
  controls   its Styles tab, every group opened, every control in it used once (a number
             typed, a word chosen, a colour picked, a switch turned, a choice clicked: the
             controls a choice brings, as Background type: Gradient brings its colours,
             used too), each judged against the element before it:
               shown      something of the element changed on the canvas (a computed
                          property of the element or of anything in it);
               state      a rule was written for a state the canvas is not in (hover), a
                          motion, a condition or an attribute: its CSS or markup changed;
               rule only  CSS or markup changed, nothing shown changed: the control does
                          not reach what it names (the heading's Size preset under the
                          design's size) - a problem;
               nothing    nothing changed at all - a problem;
             and the element put back as it was after each;
  duplicate  two controls of different names that change the same property of the same
             part of the element - a problem (one place per property);
  one colour the element's box background set: no other colour left showing over a
             fifth of its box (the button's and the social icons' two layers).

The page is deleted; the 49 pages byte for byte as before. Writes _capture/controls.md.

Passing looks like: `controls: 80 kinds of element; new: 80 drawn, 80 in the brand's
colours; N controls used: N shown, N for a state, 0 rule only, 0 nothing; 0 duplicates;
one colour 80 of 80; 0 problems; 49 of 49 pages byte for byte as before`.
"""
import asyncio
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT  # noqa: E402
from verify_editable import snapshot  # noqa: E402
from verify_features import PUBLISH, Rest, open_editor  # noqa: E402
from wpsite import wp_cli  # noqa: E402

THEME = ROOT / "theme"
# A run split over several processes names its own files (CONTROLS_PART=b: controls.b.md).
PART = "." + os.environ["CONTROLS_PART"] if os.environ.get("CONTROLS_PART") else ""
# CONTROLS_DEBUG=1: a control judged "rule only" prints what the element held and its CSS.
DEBUG = bool(os.environ.get("CONTROLS_DEBUG"))
KIT = ("rgb(110, 193, 228)", "rgb(97, 206, 112)", "rgb(84, 89, 95)", "rgb(122, 122, 122)")
# A value for a setting a group needs to be there ("*": any), where words would not do.
SAMPLES = {"icon": '<svg aria-hidden="true" class="e-font-icon-svg" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h8v8H0z"></path></svg>'}
SAMPLES["buttonIcon"] = SAMPLES["icon"]

STATEFUL = ("hover", "motion", "animation", "condition", "attribute", "css id", "css classes", "custom css",
            "sticky", "scroll", "mouse", "tilt", "entrance", "transition", "duration", "delay", "devices",
            "hide on", "link", "html tag", "z-index", "on this device", "in its row", "order", "align self",
            "state", "show to", "transparency", "blur", "rotate", "scale", "viewport", "speed", "level",
            "direction", "effect", "while", "shown when", "full width", "inline (auto)")

# What the canvas holds of an element: every node's visual properties, its markup, its CSS.
STATE = r"""
(id) => {
  const doc = document.querySelector('iframe[name=editor-canvas]').contentDocument;
  const root = doc.querySelector(`[data-block="${id}"]`);
  if (!root) return null;
  // fades held still (as refcheck does): a value fading back after a control is put back is not a change
  if (!doc.getElementById('harlow-check-still')) { const s = doc.createElement('style'); s.id = 'harlow-check-still';
    s.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; doc.head.appendChild(s); }
  // the editor's focus ring (a box-shadow or outline on the block) is not the element's
  try { if (doc.activeElement) doc.activeElement.blur(); if (document.activeElement) document.activeElement.blur(); } catch (e) {}
  const props = ['color','background-color','background-image','font-size','font-weight','font-style','font-family','line-height',
    'letter-spacing','word-spacing','text-transform','text-decoration-line','text-align','text-shadow','padding-top','padding-right',
    'padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','width','height','min-height','max-width',
    'border-top-width','border-top-style','border-top-color','border-right-width','border-bottom-width','border-left-width',
    'border-top-left-radius','border-top-right-radius','box-shadow','opacity','filter','transform','mix-blend-mode','display',
    'flex-direction','justify-content','align-items','gap','column-gap','row-gap','grid-template-columns','position','top','left',
    'z-index','overflow','object-fit','column-count','fill','stroke','-webkit-text-stroke-width','visibility','order','flex-grow',
    'outline-style','outline-width','outline-color','flex-wrap'];
  const nodes = [root, ...root.querySelectorAll('*')].filter((n) => !n.closest('.block-list-appender, .block-editor-button-block-appender, .block-editor-inserter')).slice(0, 160);
  // what is drawn before and after an element (a quote mark, a separator, a cursor, a star) read too
  const pseudo = ['background-color', 'background-image', 'color', 'font-size', 'border-top-color', 'border-top-width', 'border-top-style',
    'margin-top', 'margin-bottom', 'width', 'height', 'font-family', 'font-weight', 'font-style', 'text-transform', 'letter-spacing',
    'line-height', 'word-spacing', 'text-decoration-line', '-webkit-text-stroke-width', '-webkit-text-stroke-color', 'text-shadow',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-right', 'border-top-left-radius'];
  const look = nodes.map((n) => { const cs = getComputedStyle(n); const b = getComputedStyle(n, '::before'); const a = getComputedStyle(n, '::after');
    return props.map((p) => cs.getPropertyValue(p)).join('|') + '|' + pseudo.map((p) => b.getPropertyValue(p)).join(',')
      + '|' + pseudo.map((p) => a.getPropertyValue(p)).join(',') + '|' + getComputedStyle(n, '::marker').getPropertyValue('color')
      + '|' + pseudo.map((p) => getComputedStyle(n, '::first-letter').getPropertyValue(p)).join(','); });
  const tag = doc.getElementById(`harlow-style-${id}`);
  const attrs = JSON.stringify(wp.data.select('core/block-editor').getBlockAttributes(id) || {});
  return { look, attrs, markup: root.outerHTML.length + ':' + [...root.attributes].map((a) => a.name + '=' + a.value).join(' '),
           css: tag ? tag.textContent : '', parents: nodes.map((n) => nodes.indexOf(n.parentElement)), paths: nodes.map((n) => n.tagName.toLowerCase() + '.' + [...n.classList].filter((c) => !c.startsWith('block-editor') && !c.startsWith('is-') && !c.startsWith('wp-block')).join('.')) };
}
"""

# The controls of the Styles tab now shown, each as a handle to use it once: with `all`, the
# controls of both its own tabs (Style, Advanced; each opened and its groups opened), else those
# of the tab shown (a choice's own fields: switching tabs would draw its group again, its state
# chosen, Normal or Hover, gone).
CONTROLS = r"""
async (all) => {
  const side = document.querySelector('.interface-complementary-area');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const tabs = [...side.querySelectorAll('.harlow-props__tab')];
  const shown = () => { const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true'); return t ? t.textContent.trim() : ''; };
  const gather = () => {
  const tab = shown();
  const out = [];
  const label = (c) => { const l = c.querySelector('label, legend, .components-base-control__label'); return l ? l.textContent.trim() : ''; };
  const panelOf = (el) => { const b = el.closest('.components-panel__body'); const t = b && b.querySelector('.components-panel__body-title'); return t ? t.textContent.trim() : ''; };
  side.querySelectorAll('.harlow-style__colour').forEach((c) => out.push({ kind: 'colour', label: label(c), panel: panelOf(c) }));
  side.querySelectorAll('[role=radiogroup]').forEach((g) => out.push({ kind: 'choice', label: g.getAttribute('aria-label') || '', panel: panelOf(g),
    options: [...g.querySelectorAll('button')].map((b) => b.textContent.trim()), on: [...g.querySelectorAll('button')].findIndex((b) => b.getAttribute('aria-checked') === 'true' || b.getAttribute('aria-pressed') === 'true') }));
  side.querySelectorAll('.components-select-control').forEach((c) => { const s = c.querySelector('select'); if (s) out.push({ kind: 'select', label: label(c), panel: panelOf(c), options: [...s.options].map((o) => o.textContent.trim()), value: s.value }); });
  side.querySelectorAll('.components-toggle-control').forEach((c) => out.push({ kind: 'toggle', label: label(c), panel: panelOf(c) }));
  side.querySelectorAll('.harlow-style__box').forEach((c) => out.push({ kind: 'box', label: (c.querySelector('legend, .components-base-control__label, label, .components-text') || c).textContent.trim().split(String.fromCharCode(10))[0], panel: panelOf(c) }));
  side.querySelectorAll('button').forEach((b) => { const w = b.textContent.trim(); if (/^Choose (a picture|pictures)$/.test(w)) out.push({ kind: 'library', label: w, panel: panelOf(b) }); });
  side.querySelectorAll('.components-base-control').forEach((c) => { const i = c.querySelector('input[type=number], input[type=text]:not([role=combobox]), textarea');
    if (i && !c.closest('.harlow-style__colour') && !c.closest('.harlow-style__box') && !c.querySelector('select')) out.push({ kind: i.tagName === 'TEXTAREA' ? 'text' : 'number', label: label(c), panel: panelOf(c) }); });
  return out.filter((c) => c.label && c.panel && !/^device$/i.test(c.label)).map((c) => ({ ...c, tab }));
  };
  if (!all || !tabs.length) return gather();
  const out = [];
  for (const t of tabs) {
    if (t.getAttribute('aria-selected') !== 'true') { t.click(); await wait(500); }
    for (const b of side.querySelectorAll('.components-panel__body-title button')) { if (b.getAttribute('aria-expanded') !== 'true') { b.click(); await wait(120); } }
    await wait(300);
    out.push(...gather());
  }
  tabs[0].click(); await wait(500);
  for (const b of side.querySelectorAll('.components-panel__body-title button')) { if (b.getAttribute('aria-expanded') !== 'true') { b.click(); await wait(120); } }
  return out;
}
"""

USE = r"""
async ([c, n]) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const side = document.querySelector('.interface-complementary-area');
  // the control's own tab of the Styles tab (Style or Advanced) shown first
  const tabEl = c.tab && [...side.querySelectorAll('.harlow-props__tab')].find((t) => t.textContent.trim() === c.tab);
  if (tabEl && tabEl.getAttribute('aria-selected') !== 'true') { tabEl.click(); await wait(500); }
  const inPanel = (el) => { const b = el.closest('.components-panel__body'); const t = b && b.querySelector('.components-panel__body-title'); return t && t.textContent.trim() === c.panel; };
  const head = [...side.querySelectorAll('.components-panel__body-title button')].find((b) => b.textContent.trim() === c.panel);
  if (head && head.getAttribute('aria-expanded') !== 'true') { head.click(); await wait(250); }
  const labelOf = (x) => { const l = x.querySelector('label, legend, .components-base-control__label'); return l ? l.textContent.trim() : ''; };
  const type = (el, text) => { el.focus(); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); };
  if (c.kind === 'library') {
    const b = [...side.querySelectorAll('button')].find((x) => inPanel(x) && x.textContent.trim() === c.label);
    if (!b) return 'gone';
    b.click();
    let modal = null;
    for (let i = 0; i < 30 && !modal; i++) { await wait(400); modal = [...document.querySelectorAll('.media-modal')].find((m) => m.getClientRects().length > 0); }
    if (!modal) return 'no Media Library';
    const browse = [...modal.querySelectorAll('.media-menu-item, .media-router button, [role=tab]')].find((x) => /media library/i.test(x.textContent));
    if (browse) browse.click();
    let first = null;
    // the Media Library's list can take a while on a busy server
    for (let i = 0; i < 100 && !first; i++) { await wait(400); first = modal.querySelector('.attachments .attachment'); }
    if (!first) return 'no picture';
    first.click();
    const sel = modal.querySelector('.media-button-select');
    for (let i = 0; i < 20 && (!sel || sel.disabled); i++) await wait(200);
    if (!sel || sel.disabled) return 'not chosen';
    sel.click(); await wait(2500);
  } else if (c.kind === 'colour') {
    const row = [...side.querySelectorAll('.harlow-style__colour')].find((x) => inPanel(x) && labelOf(x) === c.label);
    if (!row) return 'gone';
    row.querySelector('.harlow-style__swatch').click(); await wait(400);
    const opts = [...document.querySelectorAll('.components-popover .components-circular-option-picker__option')];
    const pick = opts.find((o) => /Accent/.test(o.getAttribute('aria-label') || '')) || opts[3];
    if (!pick) return 'no swatch';
    pick.click(); await wait(250); row.querySelector('.harlow-style__swatch').click(); await wait(200);
  } else if (c.kind === 'choice') {
    const g = [...side.querySelectorAll('[role=radiogroup]')].find((x) => inPanel(x) && x.getAttribute('aria-label') === c.label);
    if (!g) return 'gone';
    const b = [...g.querySelectorAll('button')][n];
    if (!b) return 'no option';
    b.click();
  } else if (c.kind === 'select') {
    const x = [...side.querySelectorAll('.components-select-control')].find((y) => inPanel(y) && labelOf(y) === c.label);
    const s = x && x.querySelector('select');
    if (!s) return 'gone';
    const plain = /^(|default|normal|none|auto|inherit|initial)$/i;
    const opts = [...s.options].filter((o) => o.value !== s.value && !plain.test(o.value) && !plain.test(o.textContent.trim()));
    const opt = opts[opts.length - 1];
    if (!opt) return 'no option';
    s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (c.kind === 'box') {
    // padding or margin: every side at once (linked), typed and the field left
    const x = [...side.querySelectorAll('.harlow-style__box')].find((y) => inPanel(y) && (y.querySelector('legend, .components-base-control__label, label, .components-text') || y).textContent.trim().split(String.fromCharCode(10))[0] === c.label);
    const i = x && x.querySelector('input[type=number], input[type=text]');
    if (!i) return 'gone';
    type(i, '23');
  } else if (c.kind === 'toggle') {
    const x = [...side.querySelectorAll('.components-toggle-control')].find((y) => inPanel(y) && labelOf(y) === c.label);
    if (!x) return 'gone';
    x.querySelector('input').click();
  } else {
    const x = [...side.querySelectorAll('.components-base-control')].find((y) => inPanel(y) && labelOf(y) === c.label);
    const i = x && x.querySelector(c.kind === 'text' ? 'textarea' : 'input[type=number], input[type=text]');
    if (!i) return 'gone';
    const v = c.kind === 'text' ? (/css/i.test(c.label) ? 'selector { outline: 5px solid rgb(9, 8, 7); }' : /attribute/i.test(c.label) ? 'data-probe|yes' : 'probe-class')
      : /opacity|scale/i.test(c.label) ? '0.5' : /deg|rotate|skew/i.test(c.label) ? '15' : /column/i.test(c.label) ? '5' : /line height/i.test(c.label) ? '1.7' : /blur/i.test(c.label) ? '3' : '37';
    type(i, v);
  }
  await wait(200);
  return 'used';
}
"""


def judge(before, after, label, field=""):
    if after is None:
        return "nothing", []
    # a border's Side and Corner pick which side the fields after them edit: nothing to see by themselves
    picks = field.split(": ")[-1].lower() in ("side", "corner")
    changed = [i for i, (a, b) in enumerate(zip(before["look"], after["look"])) if a != b]
    if len(before["look"]) != len(after["look"]):
        changed = changed or [0]
    if changed:
        return "shown", changed
    if picks:
        return "state", []  # a pick of the side to edit, kept in the sidebar only
    stateful = any(w in label.lower() for w in STATEFUL)
    if before["css"] != after["css"] or before["markup"] != after["markup"]:
        return ("state" if stateful else "rule only"), []
    if stateful and before["attrs"] != after["attrs"]:
        return "state", []  # kept in the element's settings, shown on the page (a condition, a motion)
    return "nothing", []


# The properties a control sets directly (not a box's size or place, which follow everything),
# by their place in STATE's list.
PROPS = ['color','background-color','background-image','font-size','font-weight','font-style','font-family','line-height',
    'letter-spacing','word-spacing','text-transform','text-decoration-line','text-align','text-shadow','padding-top','padding-right',
    'padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','width','height','min-height','max-width',
    'border-top-width','border-top-style','border-top-color','border-right-width','border-bottom-width','border-left-width',
    'border-top-left-radius','border-top-right-radius','box-shadow','opacity','filter','transform','mix-blend-mode','display',
    'flex-direction','justify-content','align-items','gap','column-gap','row-gap','grid-template-columns','position','top','left',
    'z-index','overflow','object-fit','column-count','fill','stroke','-webkit-text-stroke-width','visibility','order','flex-grow',
    'outline-style','outline-width','outline-color','flex-wrap']
DIRECT = {PROPS.index(n) for n in (
    "color", "background-color", "background-image", "font-size", "font-weight", "font-style", "font-family",
    "letter-spacing", "word-spacing", "text-transform", "text-decoration-line", "text-align", "text-shadow",
    "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom",
    "margin-left", "border-top-width", "border-top-style", "border-top-color", "border-right-width",
    "border-bottom-width", "border-left-width", "border-top-left-radius", "border-top-right-radius", "box-shadow",
    "opacity", "filter", "transform", "mix-blend-mode", "object-fit", "column-count", "fill", "stroke",
    "-webkit-text-stroke-width", "outline-style", "outline-width", "outline-color", "flex-wrap")}


# Properties a node takes from its parent unless it is given its own, and those that follow
# its own text colour (currentColor) unless given their own.
INHERITED = {PROPS.index(n) for n in (
    "color", "font-size", "font-weight", "font-style", "font-family", "line-height", "letter-spacing",
    "word-spacing", "text-transform", "text-align", "text-shadow", "fill", "stroke",
    "-webkit-text-stroke-width", "visibility")}
FOLLOW_COLOUR = {PROPS.index(n) for n in ("border-top-color", "outline-color", "fill", "stroke")}


def props_changed(before, after, nodes):
    """(node path, property index) pairs a control set on the node itself: for duplicates.
    A change the node only inherits from its parent (the same new value there), or a border or
    outline colour that only follows the node's own new text colour, is not counted."""
    out = set()
    looks_a = [s.split("|") for s in before["look"]]
    looks_b = [s.split("|") for s in after["look"]]
    parents = after.get("parents") or []
    colour = PROPS.index("color")
    for i in nodes:
        if i >= len(looks_a) or i >= len(looks_b):
            continue
        a, b = looks_a[i], looks_b[i]
        p = parents[i] if i < len(parents) else -1
        for k, (x, y) in enumerate(zip(a, b)):
            if x == y or k not in DIRECT:
                continue
            if i == 0 and PROPS[k] in ("box-shadow", "outline-style", "outline-width", "outline-color"):
                continue
            if k in INHERITED and 0 <= p < len(looks_b) and looks_a[p][k] != looks_b[p][k] and looks_b[p][k] == y:
                continue
            # a size in em follows its parent's: a price's currency symbol at half the price
            if PROPS[k] in ("font-size", "letter-spacing", "word-spacing") and 0 <= p < len(looks_b) and looks_a[p][PROPS.index("font-size")] != looks_b[p][PROPS.index("font-size")]:
                continue
            if k in FOLLOW_COLOUR and a[colour] != b[colour] and y == b[colour]:
                continue
            if PROPS[k] == "transform" and (a[PROPS.index("width")] != b[PROPS.index("width")] or a[PROPS.index("height")] != b[PROPS.index("height")]):
                continue
            # a padding or margin in em follows the element's own font size (a code box's 1em)
            if PROPS[k].startswith(("padding-", "margin-")) and a[PROPS.index("font-size")] != b[PROPS.index("font-size")]:
                continue
            # a padding or margin in percentages follows the width around it
            width = PROPS.index("width")
            if PROPS[k].startswith(("padding-", "margin-")) and (a[width] != b[width] or (0 <= p < len(looks_b) and looks_a[p][width] != looks_b[p][width])):
                continue
            # the element itself (its place in the element), not its tag and classes: a menu's own
            # links and its phones' dropdown links wear the same class
            out.add((i, before["paths"][i], k))
    return out


# The element's pictures loaded (a picture chosen for a part arrives with its record, then its
# file): until then a control on the picture changes a box not drawn yet.
PICTURES_LOADED = r"""
async (id) => { const w = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 60; i++) { const d = document.querySelector('iframe[name=editor-canvas]').contentDocument;
    const el = d.querySelector(`[data-block="${id}"]`); const imgs = el ? [...el.querySelectorAll('img')] : [];
    if (imgs.every((im) => im.complete && im.naturalWidth > 0)) break; await w(250); }
  await w(200); }
"""


async def styles_tab(page, client):
    await page.evaluate("(id) => { wp.data.dispatch('core/block-editor').selectBlock(id);"
                        " wp.data.dispatch('core/interface').enableComplementaryArea('core', 'edit-post/block'); }", client)
    await page.wait_for_function("() => !!document.querySelector('.block-editor-block-inspector__tabs [role=tab]')"
                                 " || !!document.querySelector('.block-editor-block-inspector .harlow-style')", timeout=20000)
    await page.evaluate("""async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms));
      const t = [...document.querySelectorAll('.block-editor-block-inspector__tabs [role=tab]')].find((x) => /styles/i.test(x.getAttribute('aria-label') || x.textContent));
      if (t && t.getAttribute('aria-selected') !== 'true') { t.click(); await w(600); }
      const st = document.querySelector('.interface-complementary-area .harlow-props__tab');
      if (st && st.getAttribute('aria-selected') !== 'true') { st.click(); await w(500); }
      for (const b of document.querySelectorAll('.interface-complementary-area .components-panel__body-title button')) { if (b.getAttribute('aria-expanded') !== 'true') { b.click(); await w(120); } } }""")
    await page.wait_for_timeout(500)


async def check_block(page, name, report):
    """One kind of element: put in new, its controls used, its box coloured."""
    # an archive's list takes the site's posts per page (Settings > Reading): two, for its
    # pager to show while it is checked, then put back
    # a gallery prints the pictures' own captions: the samples get one while it is checked
    if name in ("harlow/image-gallery", "harlow/image-carousel") and SAMPLES.get("pictures"):
        for pid in SAMPLES["pictures"]:
            wp_cli("post", "update", str(pid), "--post_excerpt=A sample caption")
        try:
            return await check_one(page, name, report)
        finally:
            for pid in SAMPLES["pictures"]:
                wp_cli("post", "update", str(pid), "--post_excerpt=")
    if name == "harlow/archive-posts":
        was = wp_cli("option", "get", "posts_per_page").strip()
        wp_cli("option", "update", "posts_per_page", "2")
        try:
            return await check_one(page, name, report)
        finally:
            wp_cli("option", "update", "posts_per_page", was)
    return await check_one(page, name, report)


async def check_one(page, name, report):
    made = await page.evaluate("""async (name) => { const w = (ms) => new Promise((r) => setTimeout(r, ms));
      const be = wp.data.select('core/block-editor'); const doc = be.getBlocks()[0];
      for (let i = 0; i < 120 && !(be.getBlockListSettings(doc.clientId) && be.canInsertBlockType('harlow/container', doc.clientId)); i++) await w(250);
      const box = wp.blocks.createBlock('harlow/container', {}, name === 'harlow/container' ? [] : [wp.blocks.createBlock(name, {})]);
      wp.data.dispatch('core/block-editor').insertBlocks([box], be.getBlockOrder(doc.clientId).length, doc.clientId, false);
      let id = null;
      for (let i = 0; i < 40 && !id; i++) { await w(250); id = name === 'harlow/container' ? box.clientId : be.getBlockOrder(box.clientId)[0]; }
      await w(1200);
      const d = document.querySelector('iframe[name=editor-canvas]').contentDocument;
      // the server's markup (a menu, a list, a title) arrives after the block is put in: waited for
      for (let i = 0; i < 160; i++) { const e = d.querySelector(`[data-block="${id}"]`);
        if (e && !e.classList.contains('harlow-loading') && !e.querySelector('.components-spinner, .harlow-loading') && e.getBoundingClientRect().height > 2) break; await w(250); }
      await w(300);
      const el = d.querySelector(`[data-block="${id}"]`); if (el) el.scrollIntoView({ block: 'center' }); await w(300);
      const r = el ? el.getBoundingClientRect() : null;
      const colours = el ? [el, ...el.querySelectorAll('*')].slice(0, 200).flatMap((n) => { const cs = getComputedStyle(n); return [cs.color, cs.backgroundColor, cs.borderTopColor]; }) : [];
      return { id, box: box.clientId, drawn: !!r && r.height > 2 && r.width > 2, h: r ? Math.round(r.height) : 0, colours: [...new Set(colours)],
               classes: be.getBlockAttributes(id) && be.getBlockAttributes(id).classes, style: be.getBlockAttributes(id) && be.getBlockAttributes(id).style }; }""", name)
    row = {"block": name, "drawn": made["drawn"], "height": made["h"], "kit": [c for c in made["colours"] if c in KIT]}
    client = made["id"]
    await page.evaluate(PICTURES_LOADED, client)
    original = made["style"]
    await styles_tab(page, client)
    controls = await page.evaluate(CONTROLS, True)
    seen, used = set(), []
    present = {(c["panel"], c["label"], c["kind"]) for c in controls}
    effects = defaultdict(set)
    context = {"now": ""}  # the settings a group shown only for them was used under (JSON)

    async def use_one(c, n=None):
        before = await page.evaluate(STATE, client)
        said = await page.evaluate(USE, [c, n if n is not None else (1 if c["kind"] in ("choice", "select") else 0)])
        if c["kind"] == "select" and said == "used":
            # fields a list's choice brings (a border's thickness and colour once there is a line)
            for extra in await page.evaluate(CONTROLS, False):
                ek = (extra["panel"], extra["label"], extra["kind"])
                if ek in seen or extra["panel"] != c["panel"] or extra["kind"] in ("choice", "library") or extra["label"].lower() == "unit":
                    continue
                if not any((x["panel"], x["label"], x["kind"]) == ek for x in controls):
                    seen.add(ek)
                    await page.evaluate(USE, [extra, 1 if extra["kind"] == "select" else 0])
        after = await page.evaluate(STATE, client)
        verdict, nodes = judge(before, after, c["label"] + " " + c["panel"], c["label"]) if said == "used" else ("skipped: " + said, [])
        name_ = f"{c['panel']} / {c['label']}" + (f" = {c['options'][n]}" if n is not None and c.get("options") else "")
        used.append({"control": name_, "verdict": verdict})
        if DEBUG and verdict == "rule only":
            imgs = [x for x in before["paths"] if x.startswith("img")]
            print(f"      debug {name_}: {len(before['look'])} nodes, pictures {imgs[:2]}; css now {after['css'][-260:]!r}", flush=True)
        if verdict == "shown" and not any(w in c["label"].lower() for w in ("hide", "flip", "device")):
            for key in props_changed(before, after, nodes):
                effects[key].add((c["panel"], context["now"]))
        return verdict

    async def put_back():
        # the style, and the CSS ID (Advanced), which is an attribute of its own
        await page.evaluate("([id, style]) => { const be = wp.data.select('core/block-editor'); const patch = { style: style || undefined };"
                            " const type = wp.blocks.getBlockType(be.getBlockName(id)); if (type && type.attributes.htmlId) patch.htmlId = '';"
                            " wp.data.dispatch('core/block-editor').updateBlockAttributes(id, patch); }",
                            [client, original])
        await page.wait_for_timeout(150)

    async def use_choice(c, n):
        before = await page.evaluate(STATE, client)
        said = await page.evaluate(USE, [c, n])
        brought = []
        for extra in await page.evaluate(CONTROLS, False):
            ek = (extra["panel"], extra["label"], extra["kind"])
            # brought: there now and not before the choice (a gradient's colours), not the
            # group's other fields, which are used once on their own
            picture = extra["kind"] == "library" and any(w in c["options"][n].lower() for w in ("picture", "slideshow"))
            if ek in seen or (ek in present and not picture) or extra["kind"] == "choice" or extra["panel"] != c["panel"]:
                continue
            said_extra = await page.evaluate(USE, [extra, 1 if extra["kind"] == "select" else 0])
            # a field the choice brings that could not be used is named with what happened
            brought.append(extra if said_extra == "used" else {**extra, "label": f"{extra['label']} ({said_extra})"})
        after = await page.evaluate(STATE, client)
        # a part's state (Normal, Hover, Active) switched back, so its other fields are found
        if c.get("on", -1) >= 0:
            await page.evaluate(USE, [c, c["on"]])
        verdict, nodes = judge(before, after, c["label"] + " " + c["options"][n] + " " + c["panel"], c["label"]) if said == "used" else ("skipped: " + said, [])
        name_ = f"{c['panel']} / {c['label']} = {c['options'][n]}" + (f" (with {', '.join(b['label'] for b in brought)})" if brought else "")
        used.append({"control": name_, "verdict": verdict})
        if verdict == "shown":
            for key in props_changed(before, after, nodes):
                effects[key].add((c["panel"], context["now"]))
        return brought

    def as_it_was(start):
        # a choice works when one of its options changes the look; an option that changes
        # nothing is the one the element already has (left-aligned, upright…)
        mine = used[start:]
        if any(u["verdict"] == "shown" for u in mine):
            for u in mine:
                if u["verdict"] == "rule only":
                    u["verdict"] = "as it was"

    # the fields each choice brings are judged with it, not on their own
    brought_by_choices = set()
    for c in controls:
        if c["kind"] != "choice":
            continue
        seen.add((c["panel"], c["label"], c["kind"]))
        start = len(used)
        for n, opt in enumerate(c.get("options", [])):
            if n == c.get("on", -1) or opt.split(": ")[-1].lower() in ("default", "", "none"):
                continue
            for b in await use_choice(c, n):
                brought_by_choices.add((b["panel"], b["label"], b["kind"]))
            await put_back()
        as_it_was(start)
    for c in controls:
        key = (c["panel"], c["label"], c["kind"])
        if key in seen or key in brought_by_choices or c["kind"] == "library" or c["label"].lower() == "unit":
            continue
        seen.add(key)
        await use_one(c)
        await put_back()
    parts_file = THEME / "blocks" / name.split("/")[1] / "parts.json"
    for part in (json.loads(parts_file.read_text(encoding="utf-8")).get("parts", []) if parts_file.exists() else []):
        when = part.get("when")
        if not when:
            continue
        if isinstance(when, list):  # alternatives: the first one is set
            when = when[0]
        settings = {}
        for k, wanted in when.items():
            if isinstance(wanted, dict) and "any" in wanted:
                # a list with a line that fits: the first line given those values
                settings[k] = await page.evaluate("""([id, name, cond, samples]) => { const a = wp.data.select('core/block-editor').getBlockAttributes(id)[name] || [];
                  const lines = JSON.parse(JSON.stringify(a)); if (!lines.length) lines.push({});
                  for (const [key, w] of Object.entries(cond)) lines[0][key] = w === '*' ? (samples[key] !== undefined ? samples[key] : 'Sample') : w[0];
                  // a form's steps: two of them, as a form with steps has (one step has no other step to show)
                  if (cond.type && cond.type[0] === 'step') lines.splice(Math.max(1, lines.length - 1), 0, { ...lines[0], id: 'step2', label: 'Step 2' });
                  return lines; }""", [client, k, wanted["any"], SAMPLES])
            elif isinstance(wanted, dict) and "has" in wanted:
                settings[k] = [wanted["has"][0]]
            else:
                settings[k] = SAMPLES.get(k, "Sample") if wanted == "*" else wanted[0]
        # a pager or a load more button shows only on a list with a second page
        if name == "harlow/posts" and "pagination" in settings:
            settings["perPage"] = 2
        # a list prints its cards on the server: two (enough for a carousel, its dots and a
        # pager), so it answers in time while the other half's editor loads the server too
        if name == "harlow/loop":
            settings["perPage"] = 2
        was = await page.evaluate("([id, keys]) => { const a = wp.data.select('core/block-editor').getBlockAttributes(id);"
                                  " return Object.fromEntries(keys.map((k) => [k, a[k]])); }", [client, list(settings)])
        await page.evaluate("([id, a]) => wp.data.dispatch('core/block-editor').updateBlockAttributes(id, a)", [client, settings])
        context["now"] = json.dumps(settings, sort_keys=True)
        # the server draws the element again with those settings: waited for until the part is there
        # any of the part's selectors (a step's icon or its number: the one its type draws)
        sels = [x.strip().split("::")[0].split(":after")[0].split(":before")[0].strip() for x in part["selector"].split("|")]
        # a part drawn only while something runs (typing selecting words, a lightbox opened)
        # is a state: not waited for
        runtime = any(w in part["label"].lower() for w in ("while", "shown when"))
        try:
            if runtime:
                raise TimeoutError("drawn at run time")
            await page.wait_for_function("""([id, sels]) => { const d = document.querySelector('iframe[name=editor-canvas]').contentDocument;
              const el = d.querySelector(`[data-block="${id}"]`); if (!el) return false;
              return sels.some((sel) => { try { return !!el.querySelector(sel.startsWith('>') ? `:scope ${sel}` : sel); } catch (e) { return true; } }); }""", arg=[client, sels], timeout=60000)
        except Exception:  # noqa: BLE001 - the part never drawn is the finding
            if not runtime:
                used.append({"control": f"{part['label']} (with {settings})", "verdict": "nothing: not drawn with these settings"})
        # and settled: the same markup twice, a second apart (the server's answer arrives after)
        await page.evaluate("""async (id) => { const w = (ms) => new Promise((r) => setTimeout(r, ms));
          const read = () => { const d = document.querySelector('iframe[name=editor-canvas]').contentDocument;
            const el = d.querySelector(`[data-block="${id}"]`); return el ? el.innerHTML : ''; };
          let last = read(); for (let i = 0; i < 20; i++) { await w(1000); const now = read(); if (now === last) break; last = now; } }""", client)
        await page.evaluate(PICTURES_LOADED, client)
        await styles_tab(page, client)
        found = [c for c in await page.evaluate(CONTROLS, False) if c["panel"] == part["label"]]
        present.update((c["panel"], c["label"], c["kind"]) for c in found)
        if not found:
            used.append({"control": f"{part['label']} (with {settings})", "verdict": "nothing: the group is not shown"})
        brought_here = set()
        for c in found:
            key = (c["panel"], c["label"], c["kind"])
            if c["kind"] != "choice" or key in seen:
                continue
            seen.add(key)
            start = len(used)
            for n, opt in enumerate(c.get("options", [])):
                if n == c.get("on", -1) or opt.split(": ")[-1].lower() in ("default", "", "none"):
                    continue
                for b in await use_choice(c, n):
                    brought_here.add((b["panel"], b["label"], b["kind"]))
                await put_back()
            as_it_was(start)
        for c in found:
            key = (c["panel"], c["label"], c["kind"])
            if key in seen or key in brought_here or c["kind"] == "library" or c["label"].lower() == "unit":
                continue
            seen.add(key)
            await use_one(c)
            await put_back()
        await page.evaluate("([id, a]) => wp.data.dispatch('core/block-editor').updateBlockAttributes(id, a)", [client, was])
        context["now"] = ""
        await page.wait_for_timeout(500)
    # one colour: the box background set, no element of another colour over nearly all the box (a
    # layer over it, as the design paints a button or an alert's box; a part of the widget with a
    # colour of its own, a progress bar's track, a countdown's boxes, keeps it, the box seen around)
    offers_background = any(c["panel"] == "Background" for c in controls)
    await page.evaluate("([id]) => wp.data.dispatch('core/block-editor').updateBlockAttributes(id, { style: { desktop: { background: { type: 'color', color: '#123456' } } } })", [client])
    await page.wait_for_timeout(700)
    other = await page.evaluate("""(id) => { const d = document.querySelector('iframe[name=editor-canvas]').contentDocument;
      const el = d.querySelector(`[data-block="${id}"]`); if (!el) return [];
      const r = el.getBoundingClientRect(); const area = r.width * r.height || 1; const out = [];
      for (const n of el.querySelectorAll('*')) { if (n.closest('.components-placeholder, .block-list-appender')) continue; const cs = getComputedStyle(n); const c = cs.backgroundColor;
        if (c === 'rgba(0, 0, 0, 0)' || c === 'transparent' || c === 'rgb(18, 52, 86)') continue;
        const b = n.getBoundingClientRect(); if (b.width * b.height >= 0.85 * area && cs.visibility !== 'hidden' && cs.display !== 'none') out.push(n.tagName.toLowerCase() + '.' + [...n.classList].slice(0, 2).join('.') + ' ' + c); }
      return out.slice(0, 5); }""", client)
    await put_back()
    # a widget whose own layers cover it (a flip box) offers no box background: nothing to judge
    if not offers_background:
        other = []
    row["one colour"] = not other
    row["other colours"] = other
    row["controls"] = used
    # two groups (panels) that change the same property of the same part
    def together(a, b):
        # two groups shown at once: either under the element's own settings, or under
        # settings that do not contradict (a text overlay's words and an icon overlay's icon never are)
        if not a or not b:
            return True
        x, y = json.loads(a), json.loads(b)
        return all(x[k] == y[k] for k in x if k in y)

    row["duplicates"] = sorted({
        f"{path} {PROPS[k]}: " + " & ".join(sorted({p for p, _ in v}))
        for (i, path, k), v in effects.items()
        if any(p1 != p2 and together(c1, c2) for p1, c1 in v for p2, c2 in v)})
    await page.evaluate("(id) => wp.data.dispatch('core/block-editor').removeBlocks([id], false)", made["box"])
    report.append(row)
    with open(ROOT / "_capture" / f"controls{PART}.partial.jsonl", "a", encoding="utf-8") as out:
        out.write(json.dumps(row) + "\n")
    for u in used:
        if u["verdict"].split(":")[0] in ("rule only", "nothing"):
            print(f"    {u['verdict']}: {u['control']}", flush=True)
    for d in row["duplicates"]:
        print(f"    duplicate: {d}", flush=True)
    if not row["one colour"]:
        print(f"    other colours: {row['other colours']}", flush=True)
    counts = defaultdict(int)
    for u in used:
        counts[u["verdict"].split(":")[0]] += 1
    print(f"  {name[7:]:22} drawn {row['drawn']!s:5} kit {len(row['kit'])} controls {len(used):3}: "
          + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())) + f"; duplicates {len(row['duplicates'])}; one colour {row['one colour']}", flush=True)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    only = set(sys.argv[1:])
    names = []
    for f in sorted((THEME / "blocks").glob("*/block.json")):
        meta = json.loads(f.read_text(encoding="utf-8"))
        if meta["name"] in ("harlow/document", "harlow/site-part", "harlow/accordion-item", "harlow/markup", "harlow/box"):
            continue
        if only and f.parent.name not in only:
            continue
        names.append(meta["name"])
    rest = Rest()
    pictures = rest("GET", "/media?per_page=3&media_type=image")
    if pictures:
        SAMPLES["image"] = SAMPLES["imageOverlay"] = pictures[0]["id"]
        SAMPLES["pictures"] = [p["id"] for p in pictures]
    before = snapshot()
    report, drafts = [], []
    workers = 1
    (ROOT / "_capture" / f"controls{PART}.partial.jsonl").write_text("", encoding="utf-8")

    async def open_page(browser):
        draft = rest("POST", "/pages", {"title": "Controls check", "status": "draft",
                                        "content": "<!-- wp:harlow/document --><!-- /wp:harlow/document -->"})
        drafts.append(draft["id"])
        ctx, page, errors = await open_editor(browser, f"/wp-admin/post.php?post={draft['id']}&action=edit")
        if DEBUG:  # the server's answers for blocks it draws, when not 200
            async def answered(r):
                if "block-renderer" in r.url and r.status != 200:
                    try:
                        body = (await r.text())[:300]
                    except Exception:  # noqa: BLE001
                        body = ""
                    print(f"      debug block-renderer {r.status}: {body}", flush=True)
            page.on("response", answered)
        await page.set_viewport_size({"width": 1600, "height": 1000})
        # an empty page asks "What kind of page is this?": closed, the page stays as it is
        await page.wait_for_timeout(2500)
        await page.evaluate("() => { const x = document.querySelector('.components-modal__frame button[aria-label=Close]'); if (x) x.click(); }")
        await page.wait_for_timeout(800)
        return ctx, page

    async def worker(browser, mine):
        ctx, page = await open_page(browser)
        for name in mine:
            for attempt in (1, 2):
                try:
                    await check_block(page, name, report)
                    break
                except Exception as err:  # a crashed page is opened again, the kind tried once more
                    crashed = "crash" in str(err).lower() or "closed" in str(err).lower()
                    if attempt == 2 or not crashed:
                        report.append({"block": name, "error": str(err)[:200]})
                        print(f"  {name[7:]:22} ERROR {str(err)[:160]}", flush=True)
                    try:
                        await ctx.close()
                    except Exception:  # noqa: S110 - the page is gone already
                        pass
                    ctx, page = await open_page(browser)
                    if not crashed:
                        break
        await ctx.close()

    async def run():
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            await asyncio.gather(*(worker(browser, names[i::workers]) for i in range(workers)))
            await browser.close()

    try:
        asyncio.run(run())
    finally:
        for page_id in drafts:
            rest("DELETE", f"/pages/{page_id}?force=true")
    report.sort(key=lambda r: r["block"])
    after = snapshot()
    same = sum(before[n] == after[n] for n in before)
    problems = []
    totals = defaultdict(int)
    for row in report:
        if "error" in row:
            problems.append(f"{row['block']}: {row['error']}")
            continue
        if not row["drawn"]:
            problems.append(f"{row['block']}: a new one is not drawn ({row['height']}px high)")
        if row["kit"]:
            problems.append(f"{row['block']}: a new one shows Elementor's kit colours {row['kit']}")
        if not row["one colour"]:
            problems.append(f"{row['block']}: its box's background leaves another colour showing: {row['other colours']}")
        for d in row["duplicates"]:
            problems.append(f"{row['block']}: two controls change the same thing: {d}")
        for u in row["controls"]:
            v = u["verdict"].split(":")[0]
            totals[v] += 1
            if v in ("rule only", "nothing"):
                problems.append(f"{row['block']}: {u['control']}: {v}")
    lines = ["# Controls", "", "| element | drawn | kit colours | controls | shown | state | rule only | nothing | duplicates | one colour |",
             "|---|---|---|---|---|---|---|---|---|---|"]
    for row in report:
        if "error" in row:
            lines.append(f"| {row['block']} | error: {row['error'][:80]} | | | | | | | | |")
            continue
        c = defaultdict(int)
        for u in row["controls"]:
            c[u["verdict"].split(":")[0]] += 1
        lines.append(f"| {row['block']} | {row['drawn']} | {len(row['kit'])} | {len(row['controls'])} | {c['shown']} | {c['state']} | {c['rule only']}"
                     f" | {c['nothing']} | {len(row['duplicates'])} | {row['one colour']} |")
    lines += ["", "Problems:" if problems else "No problem.", ""] + [f"- {p}" for p in problems]
    (ROOT / "_capture" / f"controls{PART}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (ROOT / "_capture" / "controls.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
    for p in problems[:200]:
        print("  PROBLEM", p[:300])
    drawn = sum(1 for r in report if r.get("drawn"))
    brand = sum(1 for r in report if "error" not in r and not r["kit"])
    one = sum(1 for r in report if r.get("one colour"))
    dups = sum(len(r.get("duplicates", [])) for r in report)
    print(f"\ncontrols: {len(report)} kinds of element; new: {drawn} drawn, {brand} in the brand's colours;"
          f" {sum(totals.values())} controls used: {totals['shown']} shown, {totals['state']} for a state,"
          f" {totals['rule only']} rule only, {totals['nothing']} nothing; {dups} duplicates; one colour {one} of {len(report)};"
          f" {len(problems)} problems; {same} of {len(before)} pages byte for byte as before")
    return 1 if problems or same != len(before) else 0


if __name__ == "__main__":
    sys.exit(main())
