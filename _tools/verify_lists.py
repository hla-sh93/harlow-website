"""Stage 2 check: every list and carousel of the reference, made by the list block from the
items WordPress has, against the reference, element by element; and each list follows its
items.

For each of the nine lists (and the client logos), the block is given what the reference
widget has (element id, design classes, settings, card, how many, which first) and put
on the page it belongs to, for the time of the check. The page is read as a visitor reads
it and the list compared with the reference's, tag by tag, every attribute and text, with
WordPress's addresses written the reference's way. Loading hints are counted apart.

In Chrome, the lists' modules at work on those pages: both carousels move on by
themselves, and a person's card opens its window and closes it.

Then one item of each list is retitled through WP-CLI: the list must show the new title.
Everything is put back (titles, the pages' empty content) and the pages must read byte for
byte as before.

    python -u _tools/verify_lists.py
"""

import asyncio
import base64
import json
import sys

from playwright.async_api import async_playwright

from common import pages
from wpsite import WP, compare_trees, elements, fetch, known_paths, parse, reference, wp_cli

# page, widget, layout, card, type, how many, by, which first, pager
LISTS = [
    ("index", "bb14510", "carousel", "business-model", "business_model", 5, "date", "DESC", ""),
    ("index", "2af964d", "grid", "post-card", "news", 3, "date", "DESC", ""),
    ("construction-iraq", "a4e4956", "grid", "project", "albahoo_project", 7, "date", "ASC", ""),
    ("about-us", "b193185", "carousel", "testimonial", "testimonial", 5, "date", "DESC", ""),
    ("blog", "1be6882", "grid", "post-card", "post", 6, "date", "DESC", "numbers"),
    ("harlows-people", "96e801d", "grid", "person", "harlows_person", 4, "date", "ASC", ""),
    ("latest-news", "6c728a64", "grid", "post-card", "news", 5, "date", "DESC", "prev_next"),
    ("photo-gallery", "25dbaa8", "grid", "gallery-item", "gallery_item", 5, "date", "DESC", ""),
    ("work-with-us", "52d2b59", "grid", "job", "job", 1, "date", "DESC", ""),
]
# The client logos: the cards alone, inside the "major clients" section (stage 3); checked
# on a page that has no other list, against the section's logos on the reference.
LOGOS = ("sitemap", "client-logo", "client_logo", 100, "menu_order", "ASC")

SET_CONTENT = r"""
$d = json_decode( base64_decode( '%s' ), true );
$out = array();
foreach ( $d as $path => $content ) {
	$page = get_page_by_path( trim( $path, '/' ) );
	if ( '/' === $path ) { $page = get_post( (int) get_option( 'page_on_front' ) ); }
	$out[ $path ] = array( $page->ID, $page->post_content );
	wp_update_post( wp_slash( array( 'ID' => $page->ID, 'post_content' => $content ) ) );
}
echo wp_json_encode( $out );
"""

RESTORE = r"""
$d = json_decode( base64_decode( '%s' ), true );
foreach ( $d['pages'] as $path => $saved ) { wp_update_post( wp_slash( array( 'ID' => $saved[0], 'post_content' => $saved[1] ) ) ); }
foreach ( $d['titles'] as $id => $title ) { wp_update_post( wp_slash( array( 'ID' => (int) $id, 'post_title' => $title ) ) ); }
echo 'put back';
"""

RETITLE = r"""
$d = json_decode( base64_decode( '%s' ), true );
$out = array();
foreach ( $d as $type => $title ) {
	$first = get_posts( array( 'post_type' => $type, 'posts_per_page' => 1, 'orderby' => 'date', 'order' => 'DESC' ) )[0];
	$out[ $first->ID ] = $first->post_title;
	wp_update_post( wp_slash( array( 'ID' => $first->ID, 'post_title' => $title ) ) );
}
echo wp_json_encode( $out );
"""


async def behaviours(paths):
    """The carousels and the people's windows, driven in Chrome on the WordPress pages."""
    out = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)[:120]))
        for name, widget in (("index", "bb14510"), ("about-us", "b193185")):
            await page.goto(WP + paths[name])
            wrapper = f"document.querySelector('[data-id=\"{widget}\"] .swiper-wrapper')"
            t0 = await page.evaluate(f"{wrapper}.style.transform")
            await page.wait_for_timeout(5800)
            t1 = await page.evaluate(f"{wrapper}.style.transform")
            copies = await page.evaluate(f"document.querySelectorAll('[data-id=\"{widget}\"] .swiper-slide-duplicate').length")
            out.append((f"{name} carousel moves on by itself", t0 != t1 and copies > 0, {"before": t0, "after": t1, "copies": copies}))
        await page.goto(WP + paths["harlows-people"])
        await page.locator(".harlow-emp").first.click()
        await page.wait_for_timeout(500)
        opened = await page.evaluate("getComputedStyle(document.querySelector('.harlow-emp .hp-popup-holder')).display")
        await page.locator(".harlow-emp .hp-close").first.click()
        await page.wait_for_timeout(500)
        closed = await page.evaluate("getComputedStyle(document.querySelector('.harlow-emp .hp-popup-holder')).display")
        out.append(("a person's card opens its window and closes it", opened == "flex" and closed == "none", f"{opened} -> {closed}"))
        out.append(("no script errors", not errors, errors[:3]))
        await browser.close()
    return out


def php(code, data):
    return wp_cli("eval", code % base64.b64encode(json.dumps(data).encode()).decode())


def body(page):
    """A page's <body>: its <head> carries the time the page was last saved (Rank Math)."""
    return page[page.index("<body"):]


def block(attrs):
    return "<!-- wp:harlow/loop " + json.dumps(attrs, ensure_ascii=False) + " /-->"


def main():
    paths = {p["name"]: p["path"] for p in pages()}
    known = known_paths()
    content = {}
    for page, widget, layout, card, post_type, count, by, order, pager in LISTS:
        ref = reference(page).xpath(f"//*[@data-id='{widget}']")[0]
        attrs = {"widget": widget, "classes": ref.get("class"), "settings": ref.get("data-settings", "{}"),
                 "layout": layout, "postType": post_type, "template": card, "perPage": count,
                 "orderby": by, "order": order, "pagination": pager}
        content.setdefault(paths[page], []).append(block(attrs))
    page, card, post_type, count, by, order = LOGOS
    content.setdefault(paths[page], []).append(block({"layout": "plain", "postType": post_type, "template": card,
                                                      "perPage": count, "orderby": by, "order": order}))
    before = {path: body(fetch(path)[1]) for path in content}
    saved = json.loads(php(SET_CONTENT, {path: "\n\n".join(blocks) for path, blocks in content.items()}))
    rows, titles = [], {}
    try:
        for page, widget, layout, card, post_type, count, by, order, pager in LISTS:
            wp_doc = parse(fetch(paths[page])[1])
            found = wp_doc.xpath(f"//main/following-sibling::*[@data-id='{widget}'] | //*[@data-id='{widget}']")
            ref = reference(page).xpath(f"//*[@data-id='{widget}']")[0]
            if not found:
                rows.append((f"{page} {widget}", 0, ["not printed"], []))
                continue
            diff, hints = compare_trees(found[0], ref, known)
            rows.append((f"{page} {widget} ({card}, {layout})", len(elements(ref)), diff, hints))

        page = LOGOS[0]
        wp_doc = parse(fetch(paths[page])[1])
        got = [w for w in wp_doc.xpath("//body/*[@data-widget_type='image.default']")]
        want = reference("about-us").xpath("//*[@data-elementor-type='container']//*[@data-widget_type='image.default']")
        diff, hints, n = [], [], 0
        if len(got) != len(want):
            diff.append(f"{len(got)} logos, the reference {len(want)}")
        for x, y in zip(got, want):
            d, h = compare_trees(x, y, known)
            diff += d
            hints += h
            n += len(elements(y))
        rows.append(("client logos (in the major clients section)", n, diff, hints))

        acts = asyncio.run(behaviours(paths))

        # each list follows its items
        new = {"business_model": "Changed model", "news": "Changed news", "albahoo_project": "Changed project",
               "testimonial": "Changed person", "post": "Changed post", "harlows_person": "Changed colleague",
               "gallery_item": "Changed album", "job": "Changed job"}
        titles = json.loads(php(RETITLE, new))
        follow = []
        for page, widget, layout, card, post_type, count, by, order, pager in LISTS:
            doc = parse(fetch(paths[page])[1])
            text = " ".join("".join(doc.xpath(f"//*[@data-id='{widget}']")[0].itertext()).split())
            follow.append((f"{page} {widget}", new[post_type] in text))
    finally:
        php(RESTORE, {"pages": saved, "titles": titles})

    after = {path: body(fetch(path)[1]) for path in content}
    same = sum(1 for path in content if after[path] == before[path])
    bad = 0
    for name, n, diff, hints in rows:
        bad += bool(diff)
        print(f"{'OK  ' if not diff else 'DIFF'} {name[:62]:62} {n} elements" + (f", {len(diff)} differences" if diff else "") +
              (f", {len(hints)} loading hints" if hints else ""))
        for d in diff[:6]:
            print("       ", d[:230])
    print()
    for label, ok, detail in acts:
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}: {detail}")
    for name, ok in follow:
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}: shows its retitled item")
    failed = sum(1 for _, ok in follow if not ok)
    failed_acts = sum(1 for _, ok, _ in acts if not ok)
    print(f"\nlists: {len(rows)} lists, {sum(n for _, n, _, _ in rows)} elements - {bad} of {len(rows)} differ "
          f"(loading hints differ in {sum(1 for r in rows if r[3])}: {sum(len(r[3]) for r in rows)} attributes); "
          f"{len(acts)} behaviours, {failed_acts} failed; "
          f"{len(follow)} lists follow their items, {failed} do not; {same} of {len(content)} pages as before after putting everything back")
    return 1 if bad or failed or failed_acts or same != len(content) else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
