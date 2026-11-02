"""Stage 9: the owner's test. Is everything a visitor sees on a page something WordPress
changes?

    python -u _tools/verify_editable.py                    every part
    python -u _tools/verify_editable.py --part=blocks      one part: blocks, seo, kinds, addresses
    python -u _tools/verify_editable.py --back             put back what a run that died left

Each part changes the site through WordPress, reads every page as a visitor gets it, and
puts back what it changed, also when it fails (what it changes is written down first, under
_env/editable/; a run that dies leaves it for --back).

  blocks     Every field of every block of the 22 pages and of the major clients' synced
             pattern, the empty ones too, and every field of every item (title, text,
             excerpt, featured picture, date, the fields of its box) becomes a marker
             (_tools/editable.php: a word `Zx00001x`, a link https://probe.example/<marker>,
             a picture of the Media Library named after one, an icon an SVG wearing one, a
             date a year of its own), saved through the REST API as the editor saves. Then
             each of the 49 pages is read in Chrome:
               - every marker is on a page: a field that is saved and not printed changes
                 nothing
               - nothing is left on a page that is not a marker: a word, picture, link,
                 icon or background picture that stays when every field has changed is one
                 no field changes. Counted apart, with the place that changes them: the
                 header and footer (Customize and Menus, verify_settings.py), a menu printed
                 in a page (Menus), a form's words (Contact -> Contact Forms, found there),
                 an item's or page's address (its own, the addresses part), the 404 page's
                 words (live's base theme's, as on live)
  seo        every page's and item's Rank Math fields become markers; each is in its head
  kinds      every page moved to another kind of page through the REST API: accepted, its
             body names the template, its sections unchanged; an unknown template refused
  addresses  every page and item given another address at once: each answers there with
             the same sections, its old address arrives there in one permanent redirect, no
             link on any page points to an old address
  build      a page of every kind made by hand in the editor (Chrome): chosen in "What kind
             of page is this?" with its ready sections, a heading typed, a picture uploaded
             in place of one (the toolbar), a background picture uploaded for a box (the
             sidebar), published; seen at 1440 and 479; moved to another kind and address;
             deleted with its pictures. Then each item page template's pattern opened in
             the editor: every block valid, the item's fields shown by their names

The 49 pages are read byte for byte before and after: every part puts back what it changed.

Writes the per-page table to _capture/editable.md.

Passing looks like: `owner's test: 49 pages; blocks: N fields changed, N markers on the pages,
0 not shown (…), 0 left that no field changes, 0 kinds of field the editor does not offer;
seo: N pages and items, N fields, 0 not in their heads; kinds: 22 pages moved, 0 with
problems, an unknown template refused yes; addresses: N pages and items moved, 0 with
problems; build: 6 kinds, 6 made by hand into a page (…); item page templates: 4 opened in
the editor, N blocks, 0 invalid, N of N item fields shown by their names; 49 of 49 pages
byte for byte as before after putting everything back; 0 problems`
"""

import asyncio
import json
import re
import shutil
import struct
import sys
import zlib

import html5lib
import requests
from lxml import etree
from playwright.async_api import async_playwright

from common import ROOT, pages
from verify_features import KINDS, PUBLISH, Rest, open_editor
from wpsite import WP, wp_cli, wp_path, login_cookies

STORE = ROOT / "_env" / "editable"
MARKER = re.compile(r"Zx\d{5}x")
YEAR = re.compile(r"\b(19\d\d)\b")
PARTS = ("blocks", "seo", "kinds", "addresses", "build")
WITH_PAGES = {"post", "news", "albahoo_project", "gallery_item", "job"}  # the item types with pages (singles.php)
DOCUMENT = ("//body/*[@data-elementor-type='wp-page' or @data-elementor-type='single-page'] | //body/main")

# What a page shows, read in the page: every run of text, link, picture, background picture
# and icon of its sections, each with the place that holds it.
READ = r"""
(xpath) => {
  const root = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (!root) return null;
  const owner = (el) => {
    if (el.closest('header[data-elementor-type="header"], footer[data-elementor-type="footer"]')) return 'chrome';
    if (el.closest('.elementor-widget-nav-menu')) return 'menu';
    if (el.closest('.wpcf7')) return 'form';
    if (el.closest('.elementor-pagination')) return 'pager';
    if (el.closest('.e-loop-item')) return 'card';
    if (el.closest('.elementor-widget-loop-grid, .elementor-widget-loop-carousel')) return 'list';
    return 'page';
  };
  const where = (el) => { const e = el.closest('[data-id]'); return e ? e.dataset.id : ''; };
  const out = [];
  const add = (kind, value, el) => out.push({kind, value, owner: owner(el), where: where(el)});
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const p = n.parentElement;
    if (!p || p.closest('script, style, noscript, template')) continue;
    const text = n.nodeValue.trim();
    if (/[\p{L}\p{N}]/u.test(text)) add('word', text, p);
  }
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.closest('script, style, noscript, template')) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') {
      add('picture', el.getAttribute('src') || '', el);
      if (el.getAttribute('srcset')) add('picture', el.getAttribute('srcset'), el);
      if (el.hasAttribute('alt')) add('alt', el.getAttribute('alt'), el);
      if (el.getAttribute('title')) add('alt', el.getAttribute('title'), el);
    }
    if ((tag === 'video' || tag === 'source') && el.getAttribute('src')) add('picture', el.getAttribute('src'), el);
    if (tag === 'a' && el.hasAttribute('href')) add('link', el.getAttribute('href'), el);
    if (tag === 'svg') add('icon', el.getAttribute('class') || '', el);
    const bg = getComputedStyle(el).backgroundImage;
    for (const m of bg.matchAll(/url\("?([^")]*)"?\)/g)) add('background', m[1], el);
  }
  return out;
}
"""


def editable_php(step, data=None):
    """One step of _tools/editable.php in WP-CLI, as the site's administrator."""
    shutil.copyfile(ROOT / "_tools" / "editable.php", ROOT / "_env" / "verify-editable.php")
    (ROOT / "_env" / "verify-editable.json").write_text(json.dumps(data or {}), encoding="utf-8")
    admin = wp_cli("user", "list", "--role=administrator", "--field=ID", "--number=1")
    said = wp_cli("eval-file", "/env/verify-editable.php", step, f"--user={admin}")
    start = said.find("HARLOW-JSON")
    if start < 0:
        raise RuntimeError(f"editable.php {step} said nothing: {said[-400:]}")
    out = json.loads(said[start + len("HARLOW-JSON"):]) or {}
    if isinstance(out, dict) and out.pop("__dropped", None):
        print(f"  a record of a run on another install of the site was dropped, not put back ({step})")
    return out


def styled_classes():
    """Classes a stylesheet gives a background picture, outside the design's own classes
    (those are the blocks' picture field's): an HTML element wearing one gets its picture
    in its own style."""
    found = set()
    for css in (ROOT / "assets" / "css").glob("*.css"):
        for rule in re.finditer(r"([^{}]+)\{[^{}]*background-image:\s*url\(", css.read_text(encoding="utf-8")):
            for name in re.findall(r"\.([A-Za-z_][\w-]*)", rule.group(1)):
                if not name.startswith(("elementor", "e-", "hl-")):
                    found.add(name)
    return sorted(found)


async def read_pages(names):
    """{page name: [what it shows]} for the reference pages named, as a visitor gets them."""
    seen = {}
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
        page = await ctx.new_page()
        for p in pages():
            if p["name"] not in names:
                continue
            await page.goto(WP + wp_path(p), wait_until="load", timeout=120000)
            await page.wait_for_timeout(300)
            seen[p["name"]] = await page.evaluate(READ, DOCUMENT)
        await browser.close()
    return seen


def save_boxes(rest, post_id, meta):
    """The fields of an item's boxes, saved as its edit screen saves them: the boxes' form,
    as the screen printed it, posted back with the fields changed (the block editor posts it
    to its meta-box address after its REST save; the classic screen posts its whole form)."""
    screen = rest.s.get(f"{WP}/wp-admin/post.php?post={post_id}&action=edit", timeout=120).text
    doc = html5lib.parse(screen, treebuilder="lxml", namespaceHTMLElements=False)
    loader = re.search(r'_wpMetaBoxUrl\s*=\s*"([^"]+)"', screen)
    if loader:
        url = json.loads(f'"{loader.group(1)}"')
        forms = doc.xpath("//form[contains(@class, 'metabox-base-form') or contains(@class, 'metabox-location-')]")
    else:
        url, forms = f"{WP}/wp-admin/post.php", doc.xpath("//form[@id='post']")
    data = {}
    for form in forms:
        for el in form.xpath(".//input[@name] | .//textarea[@name] | .//select[@name]"):
            if el.tag == "input" and el.get("type") in ("checkbox", "radio") and el.get("checked") is None:
                continue
            if el.tag == "select":
                chosen = el.xpath(".//option[@selected]/@value") or el.xpath(".//option[1]/@value")
                data[el.get("name")] = chosen[0] if chosen else ""
            elif el.tag == "textarea":
                data[el.get("name")] = el.text or ""
            elif el.get("type") not in ("submit", "button"):
                data[el.get("name")] = el.get("value", "")
    if "harlow_fields_nonce" not in data:
        raise RuntimeError(f"item {post_id}: no box of fields on its screen")
    for key, value in meta.items():
        data[key.lstrip("_")] = ",".join(str(v) for v in value) if isinstance(value, list) else str(value)
    r = rest.s.post(url, data=data, allow_redirects=False, timeout=120)
    if r.status_code not in (200, 302):
        raise RuntimeError(f"item {post_id}: the boxes' form answered {r.status_code}")


def addresses():
    """Every page's and item's address on the site, absolute and as a path (every public
    type: 'any' leaves out the types search skips, the projects)."""
    out = json.loads(wp_cli("eval", "$a = array(); foreach ( get_posts( array( 'post_type' => array_values( get_post_types("
                                    " array( 'public' => true ) ) ), 'post_status' => 'publish', 'numberposts' => -1 ) ) as $p )"
                                    " { $a[] = get_permalink( $p ); } echo wp_json_encode( $a );"))
    return set(out) | {u[len(WP):] for u in out if u.startswith(WP)} | {WP + "/", "/"}


def editor_fields():
    """{block: the fields its edit view sets}: read from blocks/<name>/edit.js (the
    setAttributes calls; the link fields where it shows LinkFields or LinkPanel; a list of
    lines where it sets its items)."""
    fields = {}
    for edit in (ROOT / "theme" / "blocks").glob("*/edit.js"):
        js = edit.read_text(encoding="utf-8")
        keys = set()
        for call in re.finditer(r"setAttributes\(\s*\{(.*?)\}\s*\)", js, re.S):
            keys |= set(re.findall(r"(\w+)\s*:", call.group(1)))
            keys |= {k for k in re.split(r"\s*,\s*", call.group(1).strip()) if re.fullmatch(r"\w+", k)}
        if "LinkFields" in js or "LinkPanel" in js:
            keys |= {"link", "linkTarget", "linkRel"}
        fields[edit.parent.name] = keys
    return fields


def offered(marker, fields):
    """Is the field a marker went into one the editor offers? A block of the theme: its
    edit view sets it; an item's field or a core block's words: their own screens do. A
    block's marker is labelled "<block> <element id>", an item's with its type alone, which
    can be a block's name too (testimonial)."""
    block = marker["block"].split(" ")[0]
    if " " not in marker["block"] or block not in fields:
        return True
    attr = marker["attr"].split(".")[0]
    if block in ("html", "markup", "shortcode") and attr in ("markup", "href", "src", "srcset", "poster", "alt", "title", "style"):
        attr = "html"
    return attr in fields[block]


def part_blocks(rows, problems):
    rest = Rest()
    marked = editable_php("mark", {"styled": styled_classes()})
    if "__error" in marked:
        raise SystemExit(marked["__error"])
    markers = marked["markers"]
    by_name = {}
    try:
        for pid, page in marked["pages"].items():
            base = "blocks" if page["type"] == "wp_block" else "pages"
            rest("POST", f"/{base}/{pid}", {"content": page["content"]})
            by_name[page["name"] or f"#{pid}"] = int(pid)
        for pid, item in marked["items"].items():
            meta = item["data"].pop("meta")
            rest("POST", f"/{item['base']}/{pid}", item["data"])
            if meta:
                save_boxes(rest, pid, meta)
            by_name[item["name"]] = int(pid)
        names = [p["name"] for p in pages()]
        seen = asyncio.run(read_pages(set(names)))
        known = addresses()
        form_words = " ".join(marked["forms"].values())
    finally:
        back = editable_php("back")
        if back.get("__nothing") or not all(back.values()):
            problems.append(f"blocks: not put back: {[k for k, v in back.items() if not v]}")

    shown = set()
    left_all = []
    for name in names:
        things = seen.get(name)
        if things is None:
            rows[name]["blocks"] = "no sections found"
            problems.append(f"{name}: no sections found")
            continue
        own = {m for m, v in markers.items() if v["post"] == by_name.get(name)}
        here, left, elsewhere = set(), [], {}
        for t in things:
            if t["owner"] == "chrome":
                continue
            value = t["value"]
            found = set(MARKER.findall(value))
            if t["kind"] == "word":
                found |= {"Y" + y for y in YEAR.findall(value) if "Y" + y in markers}
            if t["kind"] == "link":
                found |= {k for k, v in markers.items() if v["kind"] == "page-link" and v["href"] == value}
            if found:
                here |= found
                continue
            # What no field of the page or its items changes, unless another place does.
            if t["owner"] == "menu":
                elsewhere["a menu (Appearance → Menus)"] = elsewhere.get("a menu (Appearance → Menus)", 0) + 1
            elif t["owner"] == "form" and t["kind"] in ("word", "alt") and value.split()[0] in form_words:
                elsewhere["a form (Contact → Contact Forms)"] = elsewhere.get("a form (Contact → Contact Forms)", 0) + 1
            elif t["kind"] == "link" and (value in known or value.split("#")[0] in known or value.startswith(("#", "javascript:"))):
                key = "an address (its page's or item's own)" if value.split("#")[0] in known else "an action of the design (#)"
                elsewhere[key] = elsewhere.get(key, 0) + 1
            elif t["owner"] == "pager":
                key = "the pager (page numbers, as on live)"
                elsewhere[key] = elsewhere.get(key, 0) + 1
            elif name == "404" and t["kind"] == "word":
                elsewhere["the 404 page's words (live's base theme's)"] = elsewhere.get("the 404 page's words (live's base theme's)", 0) + 1
            elif t["kind"] in ("alt",) and value == "":
                continue
            else:
                left.append(f"{t['kind']} {value[:60]!r} ({t['owner']} {t['where']})")
        shown |= here
        rows[name]["blocks"] = (f"{len(own & here)} of {len(own)} own fields shown, {len(here)} markers, "
                                f"{len(left)} left" + (", elsewhere: " + ", ".join(f"{k} {v}" for k, v in elsewhere.items())
                                                       if elsewhere else ""))
        missing_here = own - here
        if left:
            problems.append(f"{name}: {len(left)} things no field changes: " + "; ".join(left[:6]))
            left_all += [(name, x) for x in left]
        rows[name]["left"] = left
        rows[name]["missing"] = sorted(missing_here)
    # What no page shows, here or on live: the pictures and links in the text of an item of
    # a type without pages (its card shows the text's first words), a client logo's title
    # (its card is its picture).
    nowhere = {m for m, v in markers.items()
               if (v["block"] not in WITH_PAGES and v["kind"] in ("alt", "link", "picture") and v["attr"] in ("alt", "title", "href", "src", "srcset"))
               or (v["block"] == "client_logo" and v["attr"] == "title")}
    missing = [m for m in markers if m not in shown and m not in nowhere]
    for m in missing[:20]:
        v = markers[m]
        problems.append(f"marker {m} not on any page: {v['kind']} {v['block']} {v['attr']} (post {v['post']}, was {v['was'][:40]!r})")
    rows["__missing"] = {m: markers[m] for m in missing}
    fields = editor_fields()
    hidden = sorted({f"{v['block'].split(' ')[0]}.{v['attr'].split('.')[0]}" for v in markers.values() if not offered(v, fields)})
    for h in hidden:
        problems.append(f"a field the editor does not offer: {h}")
    return (f"blocks: {len(markers)} fields changed, {len(shown)} markers on the pages, {len(missing)} not shown "
            f"({len(nowhere - shown)} that no page shows, as on live), "
            f"{len(left_all)} left that no field changes, {len(hidden)} kinds of field the editor does not offer")


def get(url, follow=True):
    """(status, text, Location) of an address, as a visitor gets it."""
    r = requests.get(url, headers={"Cache-Control": "no-cache"}, allow_redirects=follow, timeout=120)
    return r.status_code, r.text, r.headers.get("Location", "")


def document(text):
    """A page's sections (its document element) as markup."""
    found = html5lib.parse(text, treebuilder="lxml", namespaceHTMLElements=False).xpath(DOCUMENT)
    return etree.tostring(found[0], method="html", encoding="unicode") if found else ""


def row_name(url, names):
    """The reference page an address is."""
    path = url[len(WP):] if url.startswith(WP) else url
    for p in pages():
        if p["path"] == path:
            return p["name"]
    return None


def part_seo(rows, problems):
    """Every page's and item's Rank Math fields as markers; each in its head where Rank Math
    prints it; then the robots."""
    names = [p["name"] for p in pages()]
    checked, fields, wrong = 0, 0, []
    # The share pictures: Rank Math leaves out a picture too small to share (the 4 x 4 markers).
    STORE.mkdir(parents=True, exist_ok=True)
    png(STORE / "share-1.png", (200, 60, 60), (1200, 630))
    png(STORE / "share-2.png", (60, 60, 200), (1200, 630))
    try:
        for round_ in ("fields", "robots"):
            marked = editable_php("seo", {"robots": round_ == "robots"})
            for pid, v in marked.items():
                if v["type"] != "page" and v["type"] not in WITH_PAGES:
                    continue  # testimonials, logos, …: no page and no head of their own
                status, text, _ = get(v["url"], follow=False)
                if status != 200:
                    continue
                name = row_name(v["url"], names) or v["url"]
                head = html5lib.parse(text, treebuilder="lxml", namespaceHTMLElements=False).xpath("//head")[0]
                mark = f"Zs{int(pid):05d}"
                def meta(attr, key):
                    found = head.xpath(f"./meta[@{attr}='{key}']/@content")
                    return found[0] if found else None
                if round_ == "fields":
                    want = {
                        "title": ("".join(head.xpath("./title/text()")), mark + "tx"),
                        "description": (meta("name", "description"), mark + "dx"),
                        "og:title": (meta("property", "og:title"), mark + "ftx"),
                        "og:description": (meta("property", "og:description"), mark + "fdx"),
                        "og:image": (meta("property", "og:image"), v["facebook"]),
                        "twitter:title": (meta("name", "twitter:title"), mark + "ttx"),
                        "twitter:description": (meta("name", "twitter:description"), mark + "tdx"),
                        "twitter:image": (meta("name", "twitter:image"), v["twitter"]),
                        "twitter:card": (meta("name", "twitter:card"), "summary"),
                        "canonical": ((head.xpath("./link[@rel='canonical']/@href") or [None])[0], "https://probe.example/" + mark + "cx"),
                    }
                else:
                    want = {"robots": (meta("name", "robots"), "noindex, nofollow")}
                # Rank Math writes the robots in its own order (follow before index).
                bad = [f"{k} {got!r}" for k, (got, expect) in want.items()
                       if not got or (k == "robots" and set(expect.split(", ")) - set(got.split(", ")))
                       or (k != "robots" and expect not in got)]
                fields += len(want)
                checked += round_ == "fields"
                if bad:
                    wrong.append(name)
                    problems.append(f"{name} seo ({round_}): not in its head: " + "; ".join(bad[:4]))
                if name in rows:
                    rows[name]["seo"] = rows[name].get("seo", "") + (f"{len(want) - len(bad)} of {len(want)} {round_}; ")
    finally:
        editable_php("seo-back")
    return f"seo: {checked} pages and items, {fields} fields, {len(wrong)} not in their heads"


def part_kinds(rows, problems):
    """Every page moved to another kind of page (its template) through the REST API, as the
    editor's Template panel saves it; an unknown template refused."""
    names = [p["name"] for p in pages()]
    rest = Rest()
    snap = editable_php("keep")
    if "__error" in snap:
        raise SystemExit(snap["__error"])
    kinds = snap["kinds"]
    own = {int(k): v for k, v in snap["posts"].items() if v["type"] == "page"}
    moved, bad = 0, 0
    try:
        for pid, v in own.items():
            name = row_name(v["url"], names) or v["url"]
            before = document(get(v["url"])[1])
            other = kinds[(kinds.index(v["template"]) + 1) % len(kinds)] if v["template"] in kinds else kinds[0]
            saved = rest("POST", f"/pages/{pid}", {"template": other})
            status, text, _ = get(v["url"])
            body = re.search(r"<body[^>]*class=\"([^\"]*)\"", text)
            issues = []
            if saved.get("template") != other:
                issues.append(f"saved {saved.get('template')!r}, asked {other!r}")
            if f"page-template-{other}" not in (body.group(1) if body else ""):
                issues.append("its body does not name the template")
            if status != 200 or document(text) != before:
                issues.append("its sections changed")
            moved += 1
            bad += bool(issues)
            for i in issues:
                problems.append(f"{name} kind {other}: {i}")
            if name in rows:
                rows[name]["kinds"] = f"{v['template'] or 'default'} → {other}: " + ("; ".join(issues) or "accepted, the same sections")
        first = next(iter(own))
        try:
            rest("POST", f"/pages/{first}", {"template": "kind-k99"})
            problems.append("an unknown template was accepted")
            refused = False
        except RuntimeError as e:
            refused = " 400 " in str(e)
            if not refused:
                problems.append(f"an unknown template: {e}")
    finally:
        for pid, v in own.items():
            rest("POST", f"/pages/{pid}", {"template": v["template"]})
        back = editable_php("restore")
        if back.get("__nothing") or not all(back.values()):
            problems.append("kinds: not put back")
    return f"kinds: {moved} pages moved, {bad} with problems, an unknown template refused {'yes' if refused else 'NO'}"


def part_addresses(rows, problems):
    """Every page and item given another address at once, as the editor's sidebar saves it."""
    names = [p["name"] for p in pages()]
    rest = Rest()
    snap = editable_php("keep")
    if "__error" in snap:
        raise SystemExit(snap["__error"])
    posts = {int(k): v for k, v in snap["posts"].items()}
    before, new = {}, {}
    for pid, v in posts.items():
        if v["type"] != "page" and v["type"] not in WITH_PAGES:
            continue  # testimonials, logos, …: their addresses show the home page, as on live
        status, text, _ = get(v["url"], follow=False)
        if status == 200:
            before[pid] = document(text)
    try:
        for pid in before:
            v = posts[pid]
            rest("POST", f"/{v['base']}/{pid}", {"slug": v["name"] + "-moved"})
        for pid in before:
            new[pid] = rest("GET", f"/{posts[pid]['base']}/{pid}?context=edit")["link"]
        moves = sorted(((posts[pid]["url"], new[pid]) for pid in before if posts[pid]["url"] != new[pid]),
                       key=lambda m: -len(m[0]))
        old_paths = {o[len(WP):] for o, n in moves} - {n[len(WP):] for o, n in moves}
        bad = 0
        for pid in before:
            v = posts[pid]
            name = row_name(v["url"], names) or v["url"]
            issues = []
            status, text, _ = get(new[pid])
            expect = before[pid]
            for o, n in moves:
                # a form's action is the address it is printed at, as a path (Contact Form 7)
                expect = expect.replace(o, n).replace(f'action="{o[len(WP):]}', f'action="{n[len(WP):]}')
            if status != 200:
                issues.append(f"its new address answers {status}")
            elif document(text) != expect:
                issues.append("its sections changed")
            if v["url"] != new[pid]:
                status, _, location = get(v["url"], follow=False)
                if status != 301 or location != new[pid]:
                    issues.append(f"its old address answers {status} {location[len(WP):]!r}")
            for href in re.findall(r"href=\"([^\"#]*)", text):
                path = href[len(WP):] if href.startswith(WP) else href
                if path in old_paths:
                    issues.append(f"a link to an old address: {path}")
                    break
            bad += bool(issues)
            for i in issues:
                problems.append(f"{name} address: {i}")
            if name in rows:
                rows[name]["addresses"] = ("moved: " + "; ".join(issues)) if issues else "moved: answers there, the old address redirects (301), no link to an old one"
    finally:
        for pid in before:
            v = posts[pid]
            rest("POST", f"/{v['base']}/{pid}", {"slug": v["name"]})
        back = editable_php("restore")
        if back.get("__nothing") or not all(back.values()):
            problems.append("addresses: not put back")
    return f"addresses: {len(before)} pages and items moved, {bad} with problems"


def png(path, rgb, size=(160, 100)):
    """A picture of one colour, for uploading as the owner would."""
    w, h = size
    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    chunk = lambda kind, data: (struct.pack(">I", len(data)) + kind + data
                                + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


async def build_kind(browser, kind, files, said):
    """A page of a kind made by hand: chosen in "What kind of page is this?" with its ready
    sections, a heading typed, a picture uploaded in place of one, a background picture
    uploaded for a box, its title and address set, published; then seen at 1440 and 479;
    then moved to another kind and address."""
    ctx, page, errors = await open_editor(browser, "/wp-admin/post-new.php?post_type=page")
    words = f"Typed by hand for {kind}"
    try:
        dialog = page.get_by_role("dialog", name="What kind of page is this?")
        await dialog.wait_for(timeout=60000)
        await dialog.get_by_label(KINDS[kind]["title"], exact=True).check()
        await dialog.get_by_role("button", name="Start", exact=True).click()
        await page.wait_for_function("() => wp.data.select('core/block-editor').getBlocks()[0]?.innerBlocks.length > 0",
                                     timeout=60000)
        canvas = page.frame(name="editor-canvas")
        # A heading typed.
        heading = canvas.locator("[data-type='harlow/heading'] [contenteditable='true']").first
        await heading.scroll_into_view_if_needed()
        await heading.click()
        await page.keyboard.press("Control+A")
        await page.keyboard.type(words)
        # A picture replaced by one uploaded through the toolbar.
        image = await page.evaluate(
            "() => { const s = wp.data.select('core/block-editor');"
            " const id = s.getBlocksByName('harlow/image').find((c) => !s.getBlockAttributes(c).source);"
            " if (id) wp.data.dispatch('core/block-editor').selectBlock(id); return id || null; }")
        if image:
            await page.get_by_role("button", name="Replace picture").click()
            async with page.expect_file_chooser() as chooser:
                await page.get_by_role("menuitem", name="Upload").click()
            await (await chooser.value).set_files(str(files[0]))
            await page.wait_for_function(
                "(id) => wp.data.select('core/block-editor').getBlockAttributes(id).image > 0"
                " && !wp.data.select('core/block-editor').getBlockAttributes(id).src", arg=image, timeout=60000)
        # A background picture uploaded for the first box.
        box = await page.evaluate(
            "() => { const id = wp.data.select('core/block-editor').getBlocksByName('harlow/container')[0];"
            " wp.data.dispatch('core/block-editor').selectBlock(id);"
            " wp.data.dispatch('core/interface').enableComplementaryArea('core', 'edit-post/block'); return id; }")
        panel = page.get_by_role("button", name="Background", exact=True)
        if await panel.get_attribute("aria-expanded") != "true":
            await panel.click()
        await page.get_by_role("button", name="Choose a picture").click()
        modal = page.locator(".media-modal:visible")
        await modal.get_by_role("tab", name="Upload files").click()
        async with page.expect_file_chooser() as chooser:
            await modal.locator("button.browser").click()
        await (await chooser.value).set_files(str(files[1]))
        await modal.locator("button.media-button-select:not([disabled])").click(timeout=60000)
        await page.wait_for_function("(id) => wp.data.select('core/block-editor').getBlockAttributes(id).picture > 0",
                                     arg=box, timeout=60000)
        await page.evaluate(f"() => wp.data.dispatch('core/editor').editPost({{ slug: 'built-by-hand-{kind}' }})")
        result = await page.evaluate(PUBLISH, f"Built by hand ({kind})")
        if result["failed"] or result["dirty"] or result["template"] != f"kind-{kind}":
            said.append(f"{kind}: not published as its kind: {result}")
        return result["id"], errors
    finally:
        await ctx.close()


async def look(browser, url, files):
    """What a visitor sees of a built page at 1440 and 479: the picture and the background
    picture uploaded, each drawn."""
    seen = []
    for width in (1440, 479):
        ctx = await browser.new_context(viewport={"width": width, "height": 900})
        await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
        page = await ctx.new_page()
        await page.goto(url, wait_until="load", timeout=120000)
        seen.append(await page.evaluate(
            """async ([a, b]) => {
              // the picture where the visitor reaches it (a picture down the page loads lazily)
              const img = [...document.images].find((i) => (i.getAttribute('src') || '').includes(a) || (i.getAttribute('srcset') || '').includes(a));
              if (img) {
                img.scrollIntoView({ block: 'center', behavior: 'instant' });
                for (let n = 0; n < 20 && !(img.complete && img.naturalWidth > 0); n++) await new Promise((r) => setTimeout(r, 250));
              }
              return {
                picture: !!img && img.currentSrc.includes(a) && img.naturalWidth > 0,
                background: [...document.querySelectorAll('.e-con')].some((e) => getComputedStyle(e).backgroundImage.includes(b)),
              };
            }""", [files[0].stem, files[1].stem]))
        await ctx.close()
    return seen


async def open_template(browser, post_id):
    """An item page template's pattern opened in the editor: (blocks, invalid ones, the
    item's fields shown by their names, errors)."""
    ctx, page, errors = await open_editor(browser, f"/wp-admin/post.php?post={post_id}&action=edit")
    try:
        await page.wait_for_timeout(3000)
        found = await page.evaluate(
            "() => { const all = []; const walk = (bs) => bs.forEach((b) => { all.push(b); walk(b.innerBlocks); });"
            " walk(wp.data.select('core/block-editor').getBlocks());"
            " return { blocks: all.length, invalid: all.filter((b) => !b.isValid).map((b) => b.name),"
            " sources: all.filter((b) => b.attributes.source).length }; }")
        canvas = page.frame(name="editor-canvas")
        found["named"] = await canvas.locator(".harlow-source-note, .elementor-heading-title").evaluate_all(
            "(els) => els.filter((e) => /^\\[.+\\]$/.test(e.textContent.trim())).length")
        return found, errors
    finally:
        await ctx.close()


# The Styles tab tried on the About page as a person uses it, in the sidebar: (block, how it
# is found, the device, the actions in the panels, the CSS property read, the part of the
# element it is read on, and what the value must hold).
STYLE_TRIES = [
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Typography"), ("colour", "Text colour", "Accent")],
     "color", ".elementor-heading-title", "rgb(0, 204, 204)"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Typography"), ("number", "Size", "48")],
     "font-size", ".elementor-heading-title", "48px"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Typography"), ("select", "Weight", "700 Bold")],
     "font-weight", ".elementor-heading-title", "700"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Typography"), ("choice", "Appearance", "Both")],
     "font-style", ".elementor-heading-title", "italic"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Alignment"), ("choice", "Align", "Centre")],
     "text-align", "", "center"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Custom CSS"),
                                                 ("text", "CSS for this element", "selector { outline: 3px solid rgb(255, 0, 0); }")],
     "outline-style", "", "solid"),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Background"), ("choice", "Background type", "Gradient"),
                                                         ("colour", "From", "Brand blue"), ("colour", "To", "Accent")],
     "background-image", "", "linear-gradient"),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Background"), ("choice", "Background type", "Picture"),
                                                         ("library", "Choose a picture")],
     "background-image", "", "/wp-content/uploads/"),
    ("container", "class:hl-bgc-014167--bg", "Mobile", [("panel", "Spacing"), ("box", "Padding (inside)", "20")],
     "padding-top", "", "20px"),
    ("image", "photo", "Desktop", [("panel", "Size"), ("number", "Picture width", "50")],
     "max-width", "img", "50%"),
    # Layout: a container's direction, then a grid of three columns.
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Layout"), ("choice", "Direction", "Column ↓")],
     "flex-direction", "", "column"),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Layout"), ("choice", "Container layout", "Grid"),
                                                         ("number", "Columns", "3")],
     "grid-template-columns", "", "tracks:3",
     [("panel", "Layout"), ("choice", "Container layout", "Flexbox")]),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Layout"), ("number", "Gap between columns", "24")],
     "column-gap", "", "24px"),
    # Position, a border on one side, a hover colour, an entrance animation, Advanced.
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Position"), ("select", "Position", "Relative"),
                                                 ("number", "Z-index", "5")],
     "z-index", "", "5"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Border"), ("choice", "Side", "Top"), ("select", "Line", "Solid"),
                                                 ("number", "Thickness", "4"), ("colour", "Border colour", "Accent")],
     "border-top-width", "", "4px"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Border"), ("choice", "Corner", "↗"),
                                                 ("number", "Rounded corners", "12")],
     "border-top-right-radius", "", "12px"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Transform and hover"),
                                                 ("colour", "Text colour on hover", "Brand blue")],
     "hover:color", ".elementor-heading-title", "rgb(1, 101, 161)"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Motion"), ("select", "Entrance animation", "zoomIn")],
     "@data-settings", "", "zoomIn",
     [("panel", "Motion"), ("select", "Entrance animation", "Default")]),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Advanced"), ("number", "CSS classes", "owner-class"),
                                                 ("text", "Custom attributes", "data-owner|yes")],
     "@data-owner", "", "yes"),
    # A radial gradient, a container's overlay layer, its shape divider, a slideshow.
    # (Other colours than the first gradient's: a click on the colour already chosen clears it.)
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Background"), ("choice", "Background type", "Gradient"),
                                                         ("colour", "From", "Dark"), ("colour", "To", "Light"),
                                                         ("choice", "Gradient type", "Radial")],
     "background-image", "", "radial-gradient"),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Background overlay"), ("choice", "Overlay type", "Colour"),
                                                         ("colour", "Overlay: Colour", "Dark")],
     "before:background-color", "", "rgb(0, 20, 32)"),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Shape dividers"), ("select", "Shape", "Waves"),
                                                         ("number", "Shape height", "80")],
     "height", ".elementor-shape-top svg", "80px"),
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Background"), ("choice", "Background type", "Slideshow"),
                                                         ("library", "Choose pictures")],
     "background-image", ".elementor-background-slideshow__slide.is-active .elementor-background-slideshow__slide__image",
     "/wp-content/uploads/"),
    # The whole container a link (Elementor Pro's): on the page only, the editor keeps a box.
    ("container", "class:hl-bgc-014167--bg", "Desktop", [("panel", "Layout"), ("select", "HTML tag", "a (a link)"),
                                                         ("number", "Link", "https://probe.example/container")],
     "page:@href", "", "probe.example/container",
     [("panel", "Layout"), ("number", "Link", ""), ("select", "HTML tag", "div")]),
    # Words: their spacing, outline, blend mode.
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Typography"), ("number", "Word spacing", "6")],
     "word-spacing", ".elementor-heading-title", "6px"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Typography"), ("number", "Text stroke (px)", "1"),
                                                 ("colour", "Text stroke colour", "Brand blue")],
     "-webkit-text-stroke-width", ".elementor-heading-title", "1px"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Effects"), ("select", "Blend mode", "Multiply")],
     "mix-blend-mode", "", "multiply"),
    # Transform in 3D and skew; the border on hover; a hover animation.
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Transform and hover"), ("number", "Skew X (deg)", "10")],
     "transform", "", "0.176"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Transform and hover"), ("number", "Border thickness on hover", "3"),
                                                 ("select", "Border line on hover", "solid")],
     "hover:border-top-width", "", "3px"),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Motion"), ("select", "Hover animation", "Grow")],
     "transition-property", "", "transform"),
    # A picture's filters on hover.
    ("image", "photo", "Desktop", [("panel", "Effects"), ("number", "Blur (px) on hover", "2")],
     "hover:filter", "img", "blur(2px)"),
    # Motion effects (scrolling, mouse) and sticky, handed to the page's script.
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Motion"), ("toggle", "Vertical scroll"),
                                                 ("toggle", "3D tilt")],
     "@data-harlow-motion", "", '"tilt"'),
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Motion"), ("select", "Sticky", "Top")],
     "@data-harlow-motion", "", '"sticky"'),
    # A widget's own parts (blocks/<name>/parts.json): a picture's opacity, a text's columns.
    ("image", "photo", "Desktop", [("panel", "Picture"), ("number", "Picture: Opacity", "0.5")],
     "opacity", "img", "0.5"),
    ("text", "class:elementor-widget-text-editor", "Desktop", [("panel", "Text columns"),
                                                              ("number", "Text columns: Columns", "2")],
     "column-count", ".elementor-widget-container", "2"),
    # Display conditions: shown to logged-in visitors only, so a visitor does not get it.
    ("heading", "text:HARLOW GROUP", "Desktop", [("panel", "Display conditions"), ("select", "Show to", "Logged-in visitors")],
     "page:absent", "", ""),
]


async def read_value(locator, prop):
    """What an element shows of a property: a computed style; `hover:<property>` with the
    pointer on it; `before:<property>` its ::before layer's; `@<attribute>` an attribute."""
    if prop.startswith("@"):
        return (await locator.get_attribute(prop[1:])) or ""
    if prop.startswith("hover:"):
        # The pointer where the element itself is on top: nothing selected (a block's
        # toolbar floats over it), a point of it no other element of the page covers.
        page = locator.page
        await page.evaluate("() => window.wp && wp.data && wp.data.dispatch('core/block-editor').clearSelectedBlock()")
        # (on the page, the page transition covers everything for a moment after loading)
        point = await locator.evaluate("""async (el) => {
          for (let n = 0; n < 20; n++) {
            el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
            const r = el.getBoundingClientRect();
            for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) {
              const x = r.left + r.width * fx, y = r.top + r.height * fy, h = document.elementFromPoint(x, y);
              if (h && (h === el || el.contains(h))) return { x: x - r.left, y: y - r.top };
            }
            await new Promise((res) => setTimeout(res, 250));
          }
          return null;
        }""")
        # away first, so the pointer enters it; Playwright maps the point through the
        # editor's frame (and any scale the editor gives it)
        await page.mouse.move(0, 0)
        await locator.hover(position=point, force=True) if point else await locator.hover(force=True)
        await page.wait_for_timeout(700)
        prop = prop[len("hover:"):]
    if prop.startswith("before:"):
        prop = prop[len("before:"):]
        return await locator.evaluate(f"(el) => getComputedStyle(el, '::before').getPropertyValue('{prop}')")
    return await locator.evaluate(f"(el) => getComputedStyle(el).getPropertyValue('{prop}')")


def element_styles(text):
    """The owner's styles a page prints (its harlow-element-styles element)."""
    found = re.search(r'<style id="harlow-element-styles[^"]*"[^>]*>(.*?)</style>', text, re.S)
    return found.group(1) if found else ""


def holds(value, want):
    """Does a value hold what a try wants (`tracks:N`: N tracks of a grid template)?"""
    if want.startswith("tracks:"):
        return len(value.split()) == int(want.split(":")[1])
    return want in value

FIND = r"""
([block, find]) => {
  const s = wp.data.select('core/block-editor');
  const [how, v] = find.split(/:(.*)/);
  const id = s.getBlocksByName('harlow/' + block).find((c) => {
    const a = s.getBlockAttributes(c);
    if (how === 'text') return a.text === v;
    if (how === 'class') return (a.classes || '').split(' ').includes(v);
    return a.image && ! a.source && /large|full/.test(a.size || '');
  });
  if (id) {
    wp.data.dispatch('core/block-editor').selectBlock(id);
    wp.data.dispatch('core/interface').enableComplementaryArea('core', 'edit-post/block');
  }
  return id || null;
}
"""

# The block sidebar is there (its Settings and Styles tabs drawn).
SIDEBAR = "() => !!document.querySelector('.block-editor-block-inspector__tabs [role=tab]')"

# One action in the Styles tab, done as a click or typing does it (React's own events).
ACT = r"""
async ([kind, label, value]) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const side = document.querySelector('.interface-complementary-area');
  const tab = [...document.querySelectorAll('.block-editor-block-inspector__tabs [role=tab]')]
    .find((t) => /styles/i.test(t.getAttribute('aria-label') || t.textContent));
  if (tab && tab.getAttribute('aria-selected') !== 'true') { tab.click(); await wait(500); }
  // Typed as a person types: into the field, then out of it (some fields keep what was
  // typed until they are left).
  const type = (el, text) => {
    el.focus();
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  };
  const byLabel = (selector) => [...side.querySelectorAll(selector)].find((c) => {
    const l = c.querySelector('label, legend, .components-base-control__label');
    return l && l.textContent.trim().toLowerCase() === label.toLowerCase();
  });
  if (kind === 'panel') {
    const b = [...side.querySelectorAll('.components-panel__body-title button')].find((x) => x.textContent.trim() === label);
    if (!b) return { error: 'no panel ' + label };
    if (b.getAttribute('aria-expanded') !== 'true') { b.click(); await wait(500); }
  } else if (kind === 'choice') {
    const row = side.querySelector(`[role=radiogroup][aria-label="${label}"]`);
    const b = row && [...row.querySelectorAll('button')].find((x) => x.textContent.trim() === value);
    if (!b) return { error: 'no choice ' + label + ' ' + value };
    b.click();
  } else if (kind === 'colour') {
    const row = [...side.querySelectorAll('.harlow-style__colour')].find((c) => c.querySelector('label') && c.querySelector('label').textContent.trim() === label);
    if (!row) return { error: 'no colour row ' + label };
    row.querySelector('.harlow-style__swatch').click(); await wait(600);
    const opt = [...document.querySelectorAll('.components-popover .components-circular-option-picker__option')]
      .find((o) => (o.getAttribute('aria-label') || '').includes(value));
    if (!opt) return { error: 'no colour ' + value };
    opt.click(); await wait(400);
    row.querySelector('.harlow-style__swatch').click(); await wait(300);
  } else if (kind === 'select') {
    const c = byLabel('.components-select-control');
    const sel = c && c.querySelector('select');
    const o = sel && [...sel.options].find((x) => x.textContent.trim() === value);
    if (!o) return { error: 'no option ' + label + ' ' + value };
    sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (kind === 'number' || kind === 'text') {
    const c = byLabel('.components-base-control');
    const input = c && c.querySelector(kind === 'text' ? 'textarea' : 'input');
    if (!input) return { error: 'no field ' + label };
    type(input, value);
  } else if (kind === 'toggle') {
    const c = byLabel('.components-toggle-control');
    const input = c && c.querySelector('input');
    if (!input) return { error: 'no switch ' + label };
    input.click();
  } else if (kind === 'box') {
    // The box control's label, then the first field after it (every side at once, linked).
    const lab = [...side.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim().toLowerCase() === label.toLowerCase());
    const input = lab && [...side.querySelectorAll('input[type=number], input[type=text]')]
      .find((i) => lab.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (!input) return { error: 'no box ' + label };
    type(input, value);
  } else if (kind === 'library') {
    const b = [...side.querySelectorAll('button')].find((x) => x.textContent.trim() === label);
    if (!b) return { error: 'no button ' + label };
    b.click();
    // the modal this button opened (each picker keeps its own, the others hidden)
    let modal = null;
    // (fixed in place, so offsetParent is null even when shown: its boxes say it is shown)
    for (let i = 0; i < 30 && !modal; i++) { await wait(500); modal = [...document.querySelectorAll('.media-modal')].find((m) => m.getClientRects().length > 0 && getComputedStyle(m).visibility !== 'hidden'); }
    if (!modal) return { error: 'no Media Library window opened' };
    const browse = [...modal.querySelectorAll('.media-menu-item, .media-router button, [role=tab]')].find((x) => /media library/i.test(x.textContent));
    if (browse) browse.click();
    // the library's pictures, given up to fifteen seconds to arrive (130 of them)
    let first = null;
    for (let i = 0; i < 30 && !first; i++) { await wait(500); first = modal.querySelector('.attachments .attachment'); }
    if (!first) return { error: 'no picture in the Media Library' };
    first.click();
    const select = modal.querySelector('.media-button-select');
    for (let i = 0; i < 20 && (!select || select.disabled); i++) await wait(250);
    if (!select || select.disabled) return { error: 'the picture could not be chosen' };
    select.click(); await wait(800);
  }
  await wait(700);
  return { ok: true };
}
"""


def block_defaults():
    """{block name: {attribute: default}} for the theme's blocks (blocks/*/block.json)."""
    out = {}
    for path in (ROOT / "theme" / "blocks").glob("*/block.json"):
        meta = json.loads(path.read_text(encoding="utf-8"))
        out[meta["name"]] = {k: v["default"] for k, v in meta.get("attributes", {}).items() if "default" in v}
    return out


def block_list(content, defaults=None):
    """A page's blocks in order, each its name and attributes, every attribute the block
    leaves out at its default (the editor writes the white space and escaping of a save its
    own way, and drops an attribute equal to its default from a block it touched: the blocks
    are what count)."""
    defaults = defaults if defaults is not None else block_defaults()
    decoder, out = json.JSONDecoder(), []
    for m in re.finditer(r"<!-- wp:([a-z0-9/-]+)\s", content):
        attrs = {}
        rest_at = m.end()
        if content[rest_at] == "{":
            attrs, _ = decoder.raw_decode(content, rest_at)
        name = m.group(1) if "/" in m.group(1) else "core/" + m.group(1)
        full = {**defaults.get(name, {}), **attrs}
        full = {k: v for k, v in full.items() if v not in ({}, [], None)}
        out.append((name, json.dumps(full, sort_keys=True)))
    return out


async def try_styles(browser, post_id, problems):
    """Every kind of control of the Styles tab used in the sidebar on one page, as a person
    uses it: the canvas changes at once, the page saved shows it at the device's width; then
    every element reset to the design ("Reset every device to the design") and saved, and
    the page's blocks byte for byte as before."""
    rest = Rest()
    before_content = rest("GET", f"/pages/{post_id}?context=edit")["content"]["raw"]
    ctx, page, errors = await open_editor(browser, f"/wp-admin/post.php?post={post_id}&action=edit")
    link = await page.evaluate("() => wp.data.select('core/editor').getPermalink()")
    done, touched = 0, []
    try:
        backs = {}
        for block, find, device, actions, prop, inner, want, *back in STYLE_TRIES:
            label = f"{block} {' / '.join(a[1] for a in actions[1:])} ({device})"
            client = await page.evaluate(FIND, [block, find])
            if not client:
                problems.append(f"styles: no {block} {find} on the page")
                continue
            touched.append(client)
            if back:
                backs.setdefault(client, []).append(back[0])
            await page.evaluate("(d) => wp.data.dispatch('core/editor').setDeviceType(d)", device)
            await page.wait_for_timeout(900)
            # The sidebar fills a moment after the block is chosen.
            await page.wait_for_function(SIDEBAR, timeout=20000)
            canvas = page.frame(name="editor-canvas")
            target = f"[data-block='{client}'] {inner}" if inner else f"[data-block='{client}']"
            failed = None
            for action in actions:
                said = await page.evaluate(ACT, [action[0], action[1], action[2] if len(action) > 2 else ""])
                if not said.get("ok"):
                    failed = said
                    break
            if failed:
                problems.append(f"styles: {label}: {failed}")
                continue
            # `page:`: shown on the page only (a link the editor keeps a box, an element left
            # out for visitors who do not meet its conditions).
            page_only = prop.startswith("page:")
            prop = prop[len("page:"):] if page_only else prop
            drawn = ""
            for attempt in range(6):   # a picture's address arrives with its record, a moment later
                if page_only:
                    break
                drawn = await read_value(canvas.locator(target).first, prop)
                if holds(drawn, want):
                    break
                await page.wait_for_timeout(1000)
            if not page_only and not holds(drawn, want):
                problems.append(f"styles: {label}: the canvas draws {prop} {drawn[:80]!r}, not {want!r}")
                continue
            styles_before = element_styles(get(link)[1])
            saved = await page.evaluate(PUBLISH, None)
            if saved["failed"]:
                problems.append(f"styles: {label}: the save failed")
                continue
            # The page as saved: its style element changed and names this element (earlier
            # tries on the same element named it already), or what the try looks for is there.
            element = await page.evaluate("(id) => wp.data.select('core/block-editor').getBlockAttributes(id).element", client)
            for _ in range(10):
                text = get(link)[1]
                if prop == "absent":
                    if f'data-id="{element}"' not in text:
                        break
                elif prop.startswith("@"):
                    if want in text:
                        break
                elif f'[data-id="{element}"]' in text and element_styles(text) != styles_before:
                    break
                await page.wait_for_timeout(1000)
            width = {"Desktop": 1440, "Tablet": 900, "Mobile": 479}[device]
            vctx = await browser.new_context(viewport={"width": width, "height": 900})
            await vctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
            vpage = await vctx.new_page()
            for attempt in range(3):   # a save the server has not finished printing: loaded again
                if attempt:
                    await vpage.wait_for_timeout(2000)
                await vpage.goto(link, wait_until="load", timeout=120000)
                if prop == "absent":
                    count = await vpage.locator(f"[data-id='{element}']").count()
                    shown = "absent" if count == 0 else f"{count} on the page"
                    want = "absent"
                else:
                    shown = await read_value(vpage.locator(f"[data-id='{element}'] {inner}".strip()).first, prop)
                if holds(shown, want):
                    break
            await vctx.close()
            if not holds(shown, want):
                problems.append(f"styles: {label}: the page shows {prop} {shown[:80]!r}, not {want!r}")
            else:
                done += 1
        # Every element back to the design, through its own Reset button, saved.
        await page.evaluate("() => wp.data.dispatch('core/editor').setDeviceType('Desktop')")
        for client in dict.fromkeys(touched):
            await page.evaluate("(id) => wp.data.dispatch('core/block-editor').selectBlock(id)", client)
            await page.wait_for_timeout(600)
            await page.wait_for_function(SIDEBAR, timeout=20000)
            # What lives in the element's own settings and classes has its own Default.
            for back in reversed(backs.get(client, [])):
                for action in back:
                    await page.evaluate(ACT, [action[0], action[1], action[2] if len(action) > 2 else ""])
            await page.evaluate(ACT, ["panel", "Style", ""])
            reset = await page.evaluate(
                "() => { const b = [...document.querySelectorAll('.interface-complementary-area button')]"
                ".find((x) => x.textContent.trim() === 'Reset every device to the design'); if (b) b.click(); return !!b; }")
            if not reset:
                problems.append("styles: no Reset on an element that was styled")
        await page.wait_for_timeout(800)
        await page.evaluate(PUBLISH, None)
        # Reset leaves no style on any element (the editor writes the white space between
        # blocks its own way, so the text is compared without it), then the page's own text
        # is put back.
        after_content = rest("GET", f"/pages/{post_id}?context=edit")["content"]["raw"]
        if '"style":' in after_content:
            problems.append("styles: a style is left on the page after every element was reset")
        after_blocks, before_blocks = block_list(after_content), block_list(before_content)
        if after_blocks != before_blocks:
            first = next((i for i, (x, y) in enumerate(zip(before_blocks, after_blocks)) if x != y), min(len(after_blocks), len(before_blocks)))
            was = json.loads(before_blocks[first][1]) if first < len(before_blocks) else {}
            now = json.loads(after_blocks[first][1]) if first < len(after_blocks) else {}
            changed = {k: (was.get(k), now.get(k)) for k in set(was) | set(now) if was.get(k) != now.get(k)}
            if "classes" in changed:
                a, b = (set((v or "").split()) for v in changed["classes"])
                changed["classes"] = (f"taken off {sorted(a - b)}", f"added {sorted(b - a)}")
            problems.append(f"styles: the page's blocks are not as before after every element was reset: block "
                            f"{first} ({before_blocks[first][0] if first < len(before_blocks) else '?'}): {changed}")
        rest("POST", f"/pages/{post_id}", {"content": before_content})
        return done, errors
    finally:
        await ctx.close()


def part_build(rows, problems):
    """A page of every kind made by hand in the editor, seen, moved, deleted; and each item
    page template opened in the editor."""
    rest = Rest()
    snap = editable_php("keep")
    if "__error" in snap:
        raise SystemExit(snap["__error"])
    made, media, good, opened, designed = [], [], 0, [], [0]
    kinds = list(KINDS)
    templates = json.loads(wp_cli("eval", "echo wp_json_encode( array_values( array_filter( array_map( 'harlow_single_template_id',"
                                          " array_keys( harlow_single_templates() ) ) ) ) );"))

    async def run():
        nonlocal good
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            for n, kind in enumerate(kinds):
                files = [STORE / f"owner-test-{kind}-picture.png", STORE / f"owner-test-{kind}-background.png"]
                STORE.mkdir(parents=True, exist_ok=True)
                png(files[0], (200, 40 + n * 30, 40))
                png(files[1], (40, 40 + n * 30, 200))
                said = []
                pid, errors = await build_kind(browser, kind, files, said)
                made.append(pid)
                page_ = rest("GET", f"/pages/{pid}?context=edit")
                for f in files:
                    found = rest("GET", f"/media?search={f.stem}&context=edit")
                    media.extend(m["id"] for m in found)
                # A kind whose sections have no picture of their own (the listing: its
                # pictures are its cards') has none replaced.
                plain = [b for b in re.findall(r"<!-- wp:harlow/image (\{.*?\}) /?-->", page_["content"]["raw"])
                         if '"source"' not in b]
                pictured = {"picture", "background"} if plain else {"background"}
                words = f"Typed by hand for {kind}"
                for width, s in zip((1440, 479), await look(browser, page_["link"], files)):
                    # The words checked by the page's text: a heading's words are compared whole.
                    status, text, _ = get(page_["link"])
                    if words not in text:
                        said.append(f"{kind} at {width}: the words typed are not on the page")
                    for key in ("picture", "background"):
                        if key in pictured and not s[key]:
                            said.append(f"{kind} at {width}: the {key} uploaded is not drawn")
                other = kinds[(n + 1) % len(kinds)]
                rest("POST", f"/pages/{pid}", {"template": f"kind-{other}", "slug": f"built-by-hand-{kind}-moved"})
                status, text, _ = get(WP + f"/built-by-hand-{kind}-moved/")
                if status != 200 or f"page-template-kind-{other}" not in text:
                    said.append(f"{kind}: moved to {other} and a new address, it answers {status}")
                status, _, location = get(page_["link"], follow=False)
                if status != 301 or not location.endswith(f"/built-by-hand-{kind}-moved/"):
                    said.append(f"{kind}: its first address answers {status}")
                if errors:
                    said.append(f"{kind}: errors in the editor: {errors[:2]}")
                good += not said
                problems.extend(said)
            for tid in templates:
                found, errors = await open_template(browser, tid)
                opened.append(found)
                if found["invalid"] or errors or found["named"] < found["sources"]:
                    problems.append(f"item page template #{tid} in the editor: {found}, errors {errors[:2]}")
            about = int(wp_cli("post", "list", "--post_type=page", "--name=about-us", "--field=ID"))
            designed[0], errors = await try_styles(browser, about, problems)
            if errors:
                problems.append(f"styles: errors in the editor: {errors[:2]}")
            await browser.close()

    try:
        asyncio.run(run())
    finally:
        for pid in made:
            rest("DELETE", f"/pages/{pid}?force=true")
        for mid in set(media):
            rest("DELETE", f"/media/{mid}?force=true")
        editable_php("restore")
    return (f"build: {len(kinds)} kinds, {good} made by hand into a page (a heading typed, a picture where its "
            f"sections have one and a background picture uploaded, published, seen at 1440 and 479, moved to another kind and address); "
            f"item page templates: {len(opened)} opened in the editor, {sum(o['blocks'] for o in opened)} blocks, "
            f"{sum(len(o['invalid']) for o in opened)} invalid, {sum(o['named'] for o in opened)} of "
            f"{sum(o['sources'] for o in opened)} item fields shown by their names; styles tab: {designed[0]} of "
            f"{len(STYLE_TRIES)} kinds of control used in the sidebar, drawn on the canvas and shown on the page, "
            f"every element reset to the design")


def snapshot():
    """Every one of the 49 pages, byte for byte, as a visitor gets it."""
    out = {}
    for p in pages():
        status, text, _ = get(WP + wp_path(p), follow=False)
        out[p["name"]] = (status, re.sub(r"(cf-turnstile(?:-br)?-cf7-)\d+", r"\1N", text))
    return out


def main(parts):
    names = [p["name"] for p in pages()]
    rows = {n: {} for n in names}
    if set(parts) != set(PARTS):   # a part run alone keeps the other parts' columns of the last run
        try:
            last_rows = json.loads((ROOT / "_capture" / "editable.json").read_text(encoding="utf-8"))
        except (OSError, ValueError):
            last_rows = {}
        for n in names:
            rows[n].update({k: v for k, v in last_rows.get(n, {}).items() if k not in parts})
    problems, said = [], []
    first = snapshot()
    for part in parts:
        before = len(problems)
        said.append({"blocks": part_blocks, "seo": part_seo, "kinds": part_kinds, "addresses": part_addresses,
                     "build": part_build}[part](rows, problems))
        for p in problems[before:]:
            print("  PROBLEM", p[:400], flush=True)
        print(f"== {said[-1]} ({len(problems)} problems so far)", flush=True)
    last = snapshot()
    changed = [n for n in names if first[n] != last[n]]
    for n in changed:
        problems.append(f"{n}: not byte for byte as before after putting everything back")
    said.append(f"{len(names) - len(changed)} of {len(names)} pages byte for byte as before after putting everything back")
    columns = [p for p in PARTS if p in parts or any(p in rows[n] for n in names)]
    lines = ["| page | " + " | ".join(columns) + " |", "|---|" + "---|" * len(columns)]
    for n in names:
        lines.append(f"| {n} | " + " | ".join(str(rows[n].get(p, "")) for p in columns) + " |")
    (ROOT / "_capture" / "editable.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (ROOT / "_capture" / "editable.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    for n in names:
        print(f"{n[:44]:44} " + "; ".join(str(rows[n].get(p, "")) for p in parts))
    for p in problems:
        print("  PROBLEM", p[:400])
    print(f"\nowner's test: {len(names)} pages; " + "; ".join(said) + f"; {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--back" in sys.argv:
        print(editable_php("back"), editable_php("seo-back"), editable_php("restore"))
        sys.exit(0)
    chosen = [a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--part=")]
    sys.exit(main(chosen or list(PARTS)))
