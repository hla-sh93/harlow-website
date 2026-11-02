"""Stage 8 check: the installer, through Appearance > Site pages, on an empty WordPress and on
a copy shaped like live.

    python -u _tools/verify_install.py --empty   after `env.sh rebuild --yes --empty`
    python -u _tools/verify_install.py --live    after that and `live_shape.py`
    python -u _tools/verify_install.py --short   after `env.sh rebuild --yes --empty`

In Chrome, logged in by a cookie WordPress makes through WP-CLI, the screen is read (what
each page is now, what installing will do, what is missing, the dashboard's notice) and
"Install the pages" pressed; the screen asks for 15-second rounds until done.

--empty: every page made or filled, every picture, item, form and menu made; then each of
the 49 pages identical to the reference (verify_wp, verify_chrome) and each head live's
(verify_seo, without its editor part); the screen and the notice say nothing is missing.

--live: first without the box: the pages keep their own content, template, id and
address; live's items keep their texts; only what live lacks is made (the theme's own
items, its menus' places, the major clients' synced pattern, beside live's template on
#5532); Rank Math's settings stay live's. Then with the box: every page gets its sections
and keeps its id and address, its own content kept as a revision; each of the 49 pages
identical to the reference.

--short: the empty site installed by rounds of one second, each its own request (a WP-CLI
process), as a host with a short time limit takes them: every round goes on from where the
last stopped; then the same as --empty without the screen.

All: a second run changes nothing (posts, fields, terms and options compared before and
after), and nothing is ever deleted.

Passing looks like: `install (empty): 22 pages, 130 pictures, 49 items, 2 forms, 6 menus
installed in N rounds; 49 pages as the reference, 48 heads as live's; a second run changed
nothing; 0 problems`.

    python -u _tools/verify_install.py --empty | --live | --short
"""

import asyncio
import json
import re
import sys

from playwright.async_api import async_playwright

from common import ROOT
from verify_chrome import main as verify_chrome
from verify_features import editor_page, php
from verify_seo import main as verify_seo
from verify_wp import main as verify_wp
from wpsite import wp_cli

SITE = json.loads((ROOT / "theme" / "install" / "site.json").read_text(encoding="utf-8"))
ITEMS = json.loads((ROOT / "theme" / "install" / "items.json").read_text(encoding="utf-8"))["items"]
SCREEN = "/wp-admin/themes.php?page=harlow-site-pages"

FINGERPRINT = r"""
global $wpdb;
$hash = function ( $sql ) use ( $wpdb ) { return md5( wp_json_encode( $wpdb->get_results( $sql, ARRAY_N ) ) ); };
$out = array(
	'counts'  => $wpdb->get_results( "SELECT post_type, post_status, COUNT(*) FROM {$wpdb->posts} GROUP BY post_type, post_status ORDER BY post_type, post_status", ARRAY_N ),
	'max_id'  => (int) $wpdb->get_var( "SELECT MAX(ID) FROM {$wpdb->posts}" ),
	'posts'   => $hash( "SELECT ID, post_type, post_status, post_name, post_parent, post_author, post_title, post_excerpt, post_content, post_date, post_modified, menu_order FROM {$wpdb->posts} ORDER BY ID" ),
	'meta'    => $hash( "SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE meta_key NOT IN ('_edit_lock', '_edit_last', 'rank_math_og_content_image') ORDER BY post_id, meta_key, meta_id" ),
	'terms'   => $hash( "SELECT t.term_id, t.slug, tt.taxonomy, tt.count FROM {$wpdb->terms} t JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id ORDER BY t.term_id" ),
	'links'   => $hash( "SELECT object_id, term_taxonomy_id FROM {$wpdb->term_relationships} ORDER BY object_id, term_taxonomy_id" ),
	'options' => md5( wp_json_encode( array_map( 'get_option', array( 'show_on_front', 'page_on_front', 'wp_page_for_privacy_policy', 'theme_mods_harlow', 'rank-math-options-titles', 'rank_math_modules' ) ) ) ),
);
echo wp_json_encode( $out );
"""

PAGES = r"""
$out = array();
foreach ( $d['pages'] as $p ) {
	$id = harlow_find_page( $p, harlow_site_data() );
	$out[ $p['path'] ] = array(
		'id'        => $id,
		'content'   => md5( (string) get_post_field( 'post_content', $id ) ),
		'template'  => (string) get_page_template_slug( $id ),
		'address'   => $id ? wp_make_link_relative( get_permalink( $id ) ) : '',
		'revisions' => array_values( array_map( function ( $r ) { return md5( $r->post_content ); }, wp_get_post_revisions( $id ) ) ),
	);
}
$items = array();
foreach ( $d['items'] as $id ) {
	$items[ $id ] = array( md5( (string) get_post_field( 'post_content', $id ) ), get_post_type( $id ), (string) get_post_meta( $id, '_harlow_original', true ) );
}
$forms = array();
foreach ( array( 3453, 4176 ) as $id ) {
	$forms[ $id ] = array( get_post_type( $id ), (bool) get_post_meta( $id, '_harlow_turnstile_slot', true ), (string) get_post_meta( $id, '_harlow_original', true ) );
}
echo wp_json_encode( array( 'pages' => $out, 'items' => $items, 'forms' => $forms, 'shared' => harlow_shared_section_id(), 'library' => get_post_type( 5532 ) ) );
"""


def fingerprint():
    return json.loads(wp_cli("eval", FINGERPRINT))


def page_facts():
    live_items = [int(i["live_id"]) for i in ITEMS if i["live_id"]]
    return json.loads(php(PAGES, {"pages": SITE["pages"], "items": live_items}))


async def read_screen(page):
    """(rows: [(title, path, now state, will)], summary, notice on the dashboard)."""
    await page.goto("http://localhost:8090" + SCREEN, wait_until="load", timeout=120000)
    rows = await page.evaluate("() => [...document.querySelectorAll('.harlow-site-pages__table tbody tr')].map((tr) =>"
                               " [tr.cells[0].innerText.trim(), tr.cells[1].innerText.trim(), tr.dataset.state,"
                               " tr.cells[3].innerText.trim()])")
    summary = await page.inner_text(".harlow-site-pages__summary")
    await page.goto("http://localhost:8090/wp-admin/index.php", wait_until="load", timeout=120000)
    notice = await page.locator(".harlow-site-pages-notice").all_inner_texts()
    return rows, summary.strip(), " ".join(notice).strip()


async def press_install(page, replace):
    """Press "Install the pages" (the box ticked or not); the summary the screen shows after."""
    await page.goto("http://localhost:8090" + SCREEN, wait_until="load", timeout=120000)
    if replace:
        await page.check("#harlow-replace")
        will = await page.locator(".harlow-site-pages__table tr[data-state='theirs'] .harlow-site-pages__will").all_inner_texts()
        if will and not all("Replace" in w for w in will):
            raise AssertionError(f"the box does not change what the table says: {will[:2]}")
    await page.click("#harlow-install")
    await page.wait_for_url(re.compile(r"installed=1"), timeout=900000)
    return (await page.inner_text(".notice-success")).strip()


def last_run():
    return json.loads(wp_cli("eval", "echo wp_json_encode( get_option( 'harlow_install_last' ) );"))


ROUND = """$r = harlow_install_round( %d );
echo wp_json_encode( array( 'done' => $r['done'], 'rounds' => $r['rounds'], 'at' => harlow_install_progress( $r )['done'], 'report' => $r['report'] ) );"""


def short_rounds(problems, seconds=1):
    """A run of rounds of `seconds` each, every round its own request (a WP-CLI process), as a
    host with a short time limit takes them; each round must go on from where the last stopped."""
    wp_cli("eval", "harlow_install_start();")
    at = -1
    while True:
        state = json.loads(wp_cli("eval", ROUND % seconds))
        if state["at"] <= at and not state["done"]:
            problems.append(f"round {state['rounds']} did not go on: at {state['at']} after {at}")
            return state
        at = state["at"]
        if state["done"] or state["rounds"] > 1000:
            return state


def run_short(problems):
    """--short: an empty site installed in one-second rounds, then a second run of them."""
    lines = []
    before = fingerprint()
    first = short_rounds(problems)
    report = first["report"]
    lines.append(f"installed in {first['rounds']} rounds of 1 second, each its own request: {summary_of(report)}")
    if first["rounds"] < 5:
        problems.append(f"the run fit in {first['rounds']} rounds: nothing was proved about going on")
    expect = {"pages_made": len(SITE["pages"]) - 1, "media_made": 130, "posts_made": len(ITEMS), "forms_made": 2,
              "menus_made": len(SITE["menus"])}
    for key, value in expect.items():
        if report.get(key) != value:
            problems.append(f"{key} {report.get(key)} / {value}")
    once = fingerprint()
    second = short_rounds(problems)
    again = fingerprint()
    lines.append(f"again: {second['rounds']} rounds: {summary_of(second['report'])}")
    changed = [k for k in once if once[k] != again[k]]
    if changed:
        problems.append(f"a second run changed: {changed}")
    if any(second["report"][k] for k in ("pages_made", "filled", "replaced", "media_made", "posts_made", "forms_made", "menus_made", "singles", "seo")):
        problems.append(f"a second run did something: {second['report']}")
    lost = {}
    for b_counts, a_counts in ((before, once), (once, again)):
        b, a = {}, {}
        for counts, into in ((b_counts["counts"], b), (a_counts["counts"], a)):
            for t, s, n in counts:
                if s not in ("trash", "auto-draft") and t != "revision":
                    into[t] = into.get(t, 0) + int(n)
        lost.update({k: (v, a.get(k, 0)) for k, v in b.items() if a.get(k, 0) < v})
    if lost:
        problems.append(f"something was deleted: {lost}")
    return lines, first["rounds"]


def summary_of(report):
    return json.loads(wp_cli("eval", "echo wp_json_encode( harlow_install_summary( json_decode( '%s', true ) ) );"
                             % json.dumps(report)))


async def run(mode, problems):
    lines = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        ctx, page, errors = await editor_page(browser, "/wp-admin/index.php")
        try:
            rows, summary, notice = await read_screen(page)
            states = [r[2] for r in rows]
            lines.append(f"before: {summary} Notice: {notice or '(none)'}")
            before = fingerprint()
            facts0 = page_facts()

            if mode == "empty":
                if states.count("missing") + states.count("empty") != len(SITE["pages"]):
                    problems.append(f"an empty site's pages are not all to make: {states}")
                if f"{len(SITE['pages'])} of the site's {len(SITE['pages'])} pages" not in notice:
                    problems.append(f"the dashboard's notice: {notice!r}")
                said = await press_install(page, False)
                first = last_run()
                lines.append(f"installed: {said} ({first['rounds']} rounds)")
                rows, summary, notice = await read_screen(page)
                lines.append(f"after: {summary} Notice: {notice or '(none)'}")
                if any(r[2] != "ours" for r in rows) or notice or not summary.startswith("Pages without their sections: 0 of"):
                    problems.append(f"after installing: {[r for r in rows if r[2] != 'ours']}, {summary!r}, notice {notice!r}")
                report = first["report"]
                expect = {"pages_made": len(SITE["pages"]) - 1, "media_made": 130, "posts_made": len(ITEMS), "forms_made": 2,
                          "menus_made": len(SITE["menus"])}
                for key, value in expect.items():
                    if report.get(key) != value:
                        problems.append(f"{key} {report.get(key)} / {value}")
                rounds = first["rounds"]
            else:
                if states.count("theirs") != len(SITE["pages"]):
                    problems.append(f"a live-shaped site's pages do not all have content of their own: {states}")
                said = await press_install(page, False)
                kept = page_facts()
                lines.append(f"without the box: {said} ({last_run()['rounds']} rounds)")
                for path, f in kept["pages"].items():
                    g = facts0["pages"][path]
                    if (f["id"], f["content"], f["template"], f["address"]) != (g["id"], g["content"], g["template"], g["address"]):
                        problems.append(f"{path} changed without the box: {g} -> {f}")
                for item_id, (content, kind, original) in kept["items"].items():
                    if content != facts0["items"][item_id][0] or kind != facts0["items"][item_id][1] or not original:
                        problems.append(f"item {item_id}: text kept {content == facts0['items'][item_id][0]}, adopted {bool(original)}")
                if kept["library"] != "elementor_library" or not kept["shared"] or kept["shared"] == 5532:
                    problems.append(f"#5532 {kept['library']}, the major clients' pattern {kept['shared']}")
                if any(not (t == "wpcf7_contact_form" and slot and orig) for t, slot, orig in kept["forms"].values()):
                    problems.append(f"live's forms not adopted: {kept['forms']}")
                places = json.loads(wp_cli("eval", "echo wp_json_encode( array_filter( (array) get_theme_mod( 'nav_menu_locations', array() ) ) );"))
                if len(places) != len(SITE["menus"]):
                    problems.append(f"the menus' places: {places}")
                titles = json.loads(wp_cli("eval", "echo wp_json_encode( get_option( 'rank-math-options-titles' ) );"))
                if titles.get("knowledgegraph_name") != "Harlow Group" or titles.get("pt_page_default_rich_snippet") != "off":
                    problems.append("Rank Math's settings are not live's after installing")
                said = await press_install(page, True)
                replaced = page_facts()
                second = last_run()
                lines.append(f"with the box: {said} ({second['rounds']} rounds)")
                for path, f in replaced["pages"].items():
                    g = facts0["pages"][path]
                    if ((f["id"], f["address"]) != (g["id"], g["address"]) or g["content"] not in f["revisions"]
                            or not f["template"].startswith("kind-") or f["content"] == g["content"]):
                        problems.append(f"{path}: id and address kept {(f['id'], f['address']) == (g['id'], g['address'])}, "
                                        f"own content in its revisions {g['content'] in f['revisions']}, template {f['template']!r}")
                rows, summary, notice = await read_screen(page)
                lines.append(f"after: {summary} Notice: {notice or '(none)'}")
                if any(r[2] != "ours" for r in rows) or notice:
                    problems.append(f"after replacing: {[r for r in rows if r[2] != 'ours']}, notice {notice!r}")
                rounds = second["rounds"]

            # a second run changes nothing
            once = fingerprint()
            said = await press_install(page, mode == "live")
            again = fingerprint()
            third = last_run()["report"]
            lines.append(f"again: {said}")
            changed = [k for k in once if once[k] != again[k]]
            if changed:
                problems.append(f"a second run changed: {changed}")
            if any(third[k] for k in ("pages_made", "filled", "replaced", "media_made", "posts_made", "forms_made", "menus_made", "singles", "seo")):
                problems.append(f"a second run did something: {third}")
            for before_counts, after_counts in ((before, once), (once, again)):
                # by type: a draft published (WordPress's privacy page, adopted) is not a loss
                b, a = {}, {}
                for counts, into in ((before_counts["counts"], b), (after_counts["counts"], a)):
                    for t, s, n in counts:
                        if s not in ("trash", "auto-draft") and t != "revision":
                            into[t] = into.get(t, 0) + int(n)
                lost = {k: (v, a.get(k, 0)) for k, v in b.items() if a.get(k, 0) < v}
                if lost:
                    problems.append(f"something was deleted: {lost}")
            if errors:
                problems.append(f"page errors: {errors[:3]}")
        finally:
            await ctx.close()
            await browser.close()
    return lines, rounds


def main(mode):
    problems = []
    lines, rounds = run_short(problems) if mode == "short" else asyncio.run(run(mode, problems))
    for line in lines:
        print(" ", line)
    same = verify_wp(set()) == 0 and verify_chrome(set()) == 0
    heads = verify_seo(set(), editor=False) == 0 if mode in ("empty", "short") else None
    if not same:
        problems.append("pages differ from the reference")
    if heads is False:
        problems.append("heads differ from live's")
    for p in problems:
        print("  PROBLEM", p)
    what = (f"{len(SITE['pages'])} pages, 130 pictures, {len(ITEMS)} items, 2 forms, {len(SITE['menus'])} menus installed"
            if mode == "empty" else
            f"{len(SITE['pages'])} pages, 130 pictures, {len(ITEMS)} items, 2 forms, {len(SITE['menus'])} menus installed "
            f"by rounds of 1 second, each going on from the last,"
            if mode == "short" else
            f"{len(SITE['pages'])} pages left as they were without the box, then given their sections with it (their own "
            f"content kept as revisions), live's items and forms adopted with their texts kept")
    print(f"\ninstall ({mode}): {what} in {rounds} rounds; 49 pages as the reference {'yes' if same else 'NO'}"
          + (f", 48 heads as live's {'yes' if heads else 'NO'}" if heads is not None else "")
          + f"; a second run changed nothing {'yes' if not any('second run' in p for p in problems) else 'NO'}; "
            f"{len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    modes = [a.lstrip("-") for a in sys.argv[1:] if a in ("--empty", "--live", "--short")]
    if len(modes) != 1:
        raise SystemExit(__doc__)
    sys.exit(main(modes[0]))
