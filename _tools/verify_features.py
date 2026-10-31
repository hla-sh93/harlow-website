"""Stage 6 check: what the owner does with whole pages, done as the owner does it.

* kinds: every page of install/site.json is on its kind's template (Page > Template), the
  six kinds are the theme's page templates, and a kind on Elementor's canvas (the front
  page) prints no site header around its sections while the others do.
* a new page of every kind, in the editor (Chrome, logged in by a cookie WordPress makes
  through WP-CLI): Pages > Add, "What kind of page is this?", the kind picked, Start,
  published. Its template is the kind's, it got a name (links find it by that), and its
  page is its kind's model page: the same document element by element (the page's own
  address and the menus' "current" marks aside: it is another page) and the same
  stylesheets in the same order. One more page started empty: the kind's template and
  stylesheets, an empty document. A new news item: its type's single template and
  stylesheets.
* originals: each installed page's original sections, as the editor gets them, are the
  file the installer laid; one page changed, then its original put back through the
  editor's "Original sections" panel and saved: identical to the reference again
  (verify_wp, white space between elements as the editor writes it), the changed version
  kept as a revision.
* duplicates: "Duplicate" under a page and under a project in their lists: a draft with
  the same sections, excerpt, template, documents, fields and categories, without the
  original's name; published, the copied page is the original page.
* addresses: a page's and an item's address changed through the REST API (as the editor
  saves it) and a parent page's: the old address answers 301 to the new one (a child's
  too), the pages linking to it link to the new address (typed menu links included),
  and put back, the first address answers 200 again (no loop).
* links picked: a button's link picked from the site's pages in the editor's sidebar.

Everything made is deleted and everything changed put back; the 22 pages and a news
item are compared byte for byte with what they were before.

Passing looks like: `features: 22 pages on their kinds' templates; 8 new pages and items
… 0 differ …; 0 problems; 23 of 23 pages byte for byte as before after putting
everything back`.

    python -u _tools/verify_features.py
"""

import asyncio
import json
import re
import sys

import requests
from playwright.async_api import async_playwright

from common import ROOT
from verify_wp import main as verify_wp
from wpsite import WP, compare_trees, elements, fetch, known_paths, login_cookies, parse, wp_cli

SITE = json.loads((ROOT / "theme" / "install" / "site.json").read_text(encoding="utf-8"))
KINDS = json.loads((ROOT / "theme" / "kinds.json").read_text(encoding="utf-8"))["pages"]
ITEMS = json.loads((ROOT / "theme" / "install" / "items.json").read_text(encoding="utf-8"))["items"]
PATH = {p["name"]: p["path"] for p in SITE["pages"]}
DOC = "//body/*[@data-elementor-type='wp-page']"
# The menus mark the page they are printed on; a new page is not its model page.
CURRENT = {"current-menu-item", "current_page_item", "current-menu-ancestor", "current-menu-parent",
           "current_page_parent", "current_page_ancestor", "elementor-item-active", "page_item"}
CHANGED = "Changed by the stage 6 check"

PREFS = """
() => {
  const p = wp.data.dispatch('core/preferences');
  p.set('core/edit-post', 'welcomeGuide', false);
  p.set('core', 'fixedToolbar', true);
}
"""
READY = "() => window.wp && wp.data && wp.data.select('core/block-editor').getBlockCount() > 0"
PUBLISH = """
async (title) => {
  const d = wp.data.dispatch('core/editor');
  if (title) d.editPost({ title, status: 'publish' });
  await d.savePost();
  const s = wp.data.select('core/editor');
  return { id: s.getCurrentPostId(), failed: s.didPostSaveRequestFail(), dirty: s.isEditedPostDirty(),
           template: s.getEditedPostAttribute('template') };
}
"""


def php(code, data=None):
    """PHP in WP-CLI; data handed over in a file (_env/ is /env in the container)."""
    (ROOT / "_env" / "verify-features.json").write_text(json.dumps(data), encoding="utf-8")
    return wp_cli("eval", "$d = json_decode( file_get_contents( '/env/verify-features.json' ), true ); " + code)


class Rest:
    """The REST API as the editor uses it: the administrator's cookies and a REST nonce."""

    def __init__(self):
        self.s = requests.Session()
        # A cookie jar does not send cookies set for "localhost"; the header does.
        self.s.headers["Cookie"] = "; ".join(f"{c['name']}={c['value']}" for c in login_cookies())
        self.s.headers["X-WP-Nonce"] = self.s.get(WP + "/wp-admin/admin-ajax.php?action=rest-nonce").text.strip()

    def __call__(self, method, path, data=None):
        r = self.s.request(method, WP + "/wp-json/wp/v2" + path, json=data, timeout=120)
        if r.status_code >= 300:
            raise RuntimeError(f"{method} {path}: {r.status_code} {r.text[:200]}")
        return r.json()


def path_of(url):
    return url[len(WP):] if url.startswith(WP) else url


def stylesheets(doc):
    return [link.get("href") for link in doc.xpath("//head/link[@rel='stylesheet']")]


def unmark(root):
    for el in root.iter():
        if not isinstance(el.tag, str):
            continue
        if el.get("class") is not None:
            el.set("class", " ".join(c for c in el.get("class").split()
                                     if c not in CURRENT and not re.fullmatch(r"page-item-\d+", c)))
        el.attrib.pop("aria-current", None)


def as_model(text, path, model_path):
    """The page's own address written as its model page's, plain and as JSON writes it."""
    for a, b in ((WP + path, WP + model_path), (WP + path.rstrip("/"), WP + model_path.rstrip("/"))):
        text = text.replace(a, b).replace(a.replace("/", "\\/"), b.replace("/", "\\/"))
    return text


def same_page(path, model_path, known, space=None):
    """(elements, differences) between a page's document and stylesheets and its model's; white
    space between elements that differs only by the editor's writing goes to `space`."""
    status, text = fetch(path)
    mstatus, mtext = fetch(model_path)
    if status != 200 or mstatus != 200:
        return 0, [f"answers {status}, the model {mstatus}"]
    got, want = parse(as_model(text, path, model_path)), parse(mtext)
    a, b = got.xpath(DOC), want.xpath(DOC)
    if len(a) != 1 or len(b) != 1:
        return 0, [f"{len(a)} documents, the model {len(b)}"]
    a, b = a[0], b[0]
    for key in ("data-elementor-id", "class"):
        if b.get(key) is not None:
            a.set(key, b.get(key))
    unmark(a)
    unmark(b)
    diff, _ = compare_trees(a, b, known, space)
    if stylesheets(got) != stylesheets(want):
        diff.append(f"stylesheets {[h for h in stylesheets(got) if h not in stylesheets(want)]} extra, "
                    f"{[h for h in stylesheets(want) if h not in stylesheets(got)]} missing")
    return len(elements(b)), diff


async def editor_page(browser, url):
    ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    await ctx.add_cookies(login_cookies())
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))
    await page.goto(WP + url, wait_until="load", timeout=120000)
    return ctx, page, errors


async def open_editor(browser, url):
    ctx, page, errors = await editor_page(browser, url)
    await page.wait_for_function(READY, timeout=90000)
    await page.evaluate(PREFS)
    return ctx, page, errors


async def new_page(browser, kind, title, with_sections):
    """A page made through the kind window; (result, errors)."""
    ctx, page, errors = await open_editor(browser, "/wp-admin/post-new.php?post_type=page")
    try:
        dialog = page.get_by_role("dialog", name="What kind of page is this?")
        await dialog.wait_for(timeout=60000)
        await dialog.get_by_label(KINDS[kind]["title"], exact=True).check()
        if not with_sections:
            await dialog.get_by_label("Start with its ready sections (real words to replace)").uncheck()
        await dialog.get_by_role("button", name="Start", exact=True).click()
        await page.wait_for_function(
            "([t, w]) => { const b = wp.data.select('core/block-editor').getBlocks();"
            " return wp.data.select('core/editor').getEditedPostAttribute('template') === t"
            " && b.length === 1 && (!w || b[0].innerBlocks.length > 0); }", arg=[f"kind-{kind}", with_sections],
            timeout=60000)
        return await page.evaluate(PUBLISH, title), errors
    finally:
        await ctx.close()


async def put_back_original(browser, post_id):
    """The page's original sections put back through its "Original sections" panel, saved."""
    ctx, page, errors = await open_editor(browser, f"/wp-admin/post.php?post={post_id}&action=edit")
    try:
        await page.evaluate(
            "() => { wp.data.dispatch('core/interface').enableComplementaryArea('core', 'edit-post/document');"
            " const n = 'harlow-page/harlow-original';"
            " if (!wp.data.select('core/editor').isEditorPanelOpened(n)) wp.data.dispatch('core/editor').toggleEditorPanelOpened(n); }")
        await page.get_by_role("button", name="Put back the original sections", exact=True).click()
        dialog = page.get_by_role("dialog", name="Put back the original sections?")
        await dialog.get_by_role("button", name="Put them back", exact=True).click()
        await page.wait_for_function("(t) => !wp.data.select('core/editor').getEditedPostContent().includes(t)",
                                     arg=CHANGED, timeout=60000)
        return await page.evaluate(PUBLISH, None), errors
    finally:
        await ctx.close()


async def duplicate(browser, post_type, post_id):
    """"Duplicate" clicked under an item in its list; the copy's id, as the editor opens it."""
    ctx, page, errors = await editor_page(browser, f"/wp-admin/edit.php?post_type={post_type}")
    try:
        row = page.locator(f"#post-{post_id}")
        await row.hover()
        await row.locator(".row-actions .harlow_duplicate a").click()
        await page.wait_for_url(re.compile(r"post\.php\?post=\d+&action=edit"), timeout=60000)
        await page.wait_for_function(READY, timeout=90000)
        return int(re.search(r"post=(\d+)", page.url).group(1)), errors
    finally:
        await ctx.close()


async def pick_link(browser, post_id, element):
    """A button's link picked from the site's pages; (link attribute, the canvas's href)."""
    ctx, page, errors = await open_editor(browser, f"/wp-admin/post.php?post={post_id}&action=edit")
    try:
        client = await page.evaluate(
            "(el) => { const s = wp.data.select('core/block-editor');"
            " const b = s.getBlocksByName('harlow/button').find((id) => s.getBlockAttributes(id).element === el);"
            " wp.data.dispatch('core/block-editor').selectBlock(b);"
            " wp.data.dispatch('core/interface').enableComplementaryArea('core', 'edit-post/block'); return b; }", element)
        combo = page.get_by_role("combobox", name="Page of the site")
        await combo.wait_for(timeout=30000)
        title = next(p["title"] for p in SITE["pages"] if p["name"] == "contact-us")
        await combo.fill(title[:7].lower())
        await page.get_by_role("option", name=f"{title} (Page)", exact=True).click()
        link = await page.evaluate("(id) => wp.data.select('core/block-editor').getBlockAttributes(id).link", client)
        frame = page.frame(name="editor-canvas")
        href = await frame.locator(f"[data-id='{element}'] a").first.get_attribute("href")
        return link, href, errors
    finally:
        await ctx.close()


def snapshot():
    paths = [p["path"] for p in SITE["pages"]] + [news_item()["path"]]
    return {p: fetch(p) for p in paths}


def news_item():
    return next(i for i in ITEMS if i["type"] == "news")


async def run(report):
    known = known_paths()
    rest = Rest()
    ids = json.loads(wp_cli("eval", "echo wp_json_encode( harlow_named_posts() );"))
    made, problems, rows = [], [], []
    redirections = int(wp_cli("db", "query", "SELECT COALESCE(MAX(id), 0) FROM wp_rank_math_redirections",
                              "--skip-column-names") or 0)
    revisions = set(json.loads(php("echo wp_json_encode( array_values( wp_list_pluck( wp_get_post_revisions( (int) $d ), 'ID' ) ) );",
                                   ids["about-us"])))
    touched = [ids["about-us"], ids[news_item()["name"]]]
    dates = json.loads(php("echo wp_json_encode( array_map( function ( $id ) { $p = get_post( (int) $id );"
                           " return array( (int) $id, $p->post_modified, $p->post_modified_gmt ); }, $d ) );", touched))
    before = snapshot()

    # kinds of the installed pages
    facts = json.loads(wp_cli("eval", "$o = array(); foreach ( harlow_named_posts() as $n => $id ) {"
                              " if ( 'page' === get_post_type( $id ) ) { $o[ $n ] = get_page_template_slug( $id ); } }"
                              " echo wp_json_encode( array( 'templates' => wp_get_theme()->get_page_templates( null, 'page' ),"
                              " 'pages' => $o ) );"))
    want = {f"kind-{k}": v["title"] for k, v in KINDS.items()}
    if {k: v for k, v in facts["templates"].items() if k.startswith("kind-")} != want:
        problems.append(f"page templates {facts['templates']} / {want}")
    on_kind = 0
    for page in SITE["pages"]:
        kind = page["kind"].lower()
        status, text = fetch(page["path"])
        framed = bool(parse(text).xpath("//body/a[contains(concat(' ', @class, ' '), ' skip-link ')]"))
        trouble = []
        if facts["pages"].get(page["name"]) != f"kind-{kind}":
            trouble.append(f"template {facts['pages'].get(page['name'])!r}")
        if framed == KINDS[kind]["canvas"]:
            trouble.append("site header around it" if framed else "no site header around it")
        on_kind += not trouble
        problems += [f"{page['name']}: {t}" for t in trouble]
    report["kinds"] = on_kind

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        try:
            # new pages from the kind window
            compared, differ, spaces = 0, 0, []
            for kind, info in KINDS.items():
                title = f"Check kind {kind}"
                result, errors = await new_page(browser, kind, title, True)
                made.append(result["id"])
                page = rest("GET", f"/pages/{result['id']}?context=edit")
                name = php("echo get_post_meta( (int) $d, '_harlow_name', true );", result["id"])
                n, diff = same_page(path_of(page["link"]), PATH[info["model"]], known, spaces)
                compared += n
                trouble = diff + [f"page error {e}" for e in errors]
                if result["failed"] or page["template"] != f"kind-{kind}":
                    trouble.append(f"saved {not result['failed']}, template {page['template']!r}")
                if name != page["slug"]:
                    trouble.append(f"name {name!r} / its address {page['slug']!r}")
                differ += bool(trouble)
                rows.append((f"new {info['title'].lower()}", f"{n} elements against {info['model']}", trouble))
            result, errors = await new_page(browser, "k2", "Check kind k2 empty", False)
            made.append(result["id"])
            page = rest("GET", f"/pages/{result['id']}?context=edit")
            status, text = fetch(path_of(page["link"]))
            doc = parse(text)
            model = parse(fetch(PATH[KINDS["k2"]["model"]])[1])
            trouble = [f"page error {e}" for e in errors]
            if page["template"] != "kind-k2" or len(doc.xpath(DOC)) != 1 or len(doc.xpath(DOC)[0]):
                trouble.append(f"template {page['template']!r}, document {[len(d) for d in doc.xpath(DOC)]}")
            if stylesheets(doc) != stylesheets(model) or not doc.xpath("//body/a[contains(@class, 'skip-link')]"):
                trouble.append("stylesheets or site header not the kind's")
            differ += bool(trouble)
            rows.append(("new business page, started empty", "the kind's template, an empty document", trouble))

            item = news_item()
            news = rest("POST", "/news", {"title": "Check news item", "content": "<p>Words of the check.</p>",
                                          "status": "publish"})
            made.append(news["id"])
            got, want = parse(fetch(path_of(news["link"]))[1]), parse(fetch(item["path"])[1])
            trouble = []
            if stylesheets(got) != stylesheets(want) or len(got.xpath("//body/*[@data-elementor-id='2473']")) != 1:
                trouble.append("not the single template's page")
            differ += bool(trouble)
            rows.append(("new news item", "its single template and stylesheets", trouble))
            report["new"], report["compared"], report["new_differ"] = len(KINDS) + 2, compared, differ
            report["spaces"] = len(spaces)

            # originals
            originals = json.loads(php(
                "$o = array(); foreach ( $d['names'] as $n => $id ) { $file = get_theme_file_path( 'pages/' . $n . '.html' );"
                " $o[ $n ] = harlow_page_original( (int) $id ) === file_get_contents( $file ); }"
                " $o['(a page made since)'] = '' === harlow_page_original( (int) $d['new'] ); echo wp_json_encode( $o );",
                {"names": {p["name"]: ids[p["name"]] for p in SITE["pages"]}, "new": made[0]}))
            problems += [f"original of {n}: not the installed file" for n, ok in originals.items() if not ok]
            content = php("echo get_post_field( 'post_content', (int) $d );", ids["about-us"])
            first = re.search(r'"text":"([^"\\]{3,})"', content)
            rest("POST", f"/pages/{ids['about-us']}", {"content": content.replace(first.group(0), f'"text":"{CHANGED}"', 1)})
            if CHANGED not in fetch("/about-us/")[1]:
                problems.append("the changed about-us page does not show the change")
            result, errors = await put_back_original(browser, ids["about-us"])
            same = verify_wp({"about-us"}, space=True) == 0
            kept = int(php("echo count( array_filter( wp_get_post_revisions( (int) $d['id'] ),"
                           " function ( $r ) use ( $d ) { return false !== strpos( $r->post_content, $d['text'] ); } ) );",
                           {"id": ids["about-us"], "text": CHANGED}))
            trouble = [f"page error {e}" for e in errors]
            if result["failed"] or result["dirty"] or not same or not kept:
                trouble.append(f"saved {not result['failed']}, identical to the reference {same}, revisions kept {kept}")
            rows.append(("original put back", "about-us, through the editor", trouble))
            report["originals"] = sum(1 for n, ok in originals.items() if ok and n in ids)
            php("$p = get_post( (int) $d['id'] ); $p->post_content = $d['content']; wp_update_post( wp_slash( (array) $p ) );"
                " echo 'put back';", {"id": ids["about-us"], "content": content})

            # duplicates
            project = next(i for i in ITEMS if i["type"] == "albahoo_project")
            dups = 0
            for post_type, source in (("page", ids["about-us"]), ("albahoo_project", ids[project["name"]])):
                copy, errors = await duplicate(browser, post_type, source)
                made.append(copy)
                fields = json.loads(php(
                    "$out = array(); foreach ( array( $d['source'], $d['copy'] ) as $id ) { $p = get_post( (int) $id );"
                    " $meta = get_post_meta( (int) $id ); unset( $meta['_edit_lock'], $meta['_edit_last'] );"
                    " ksort( $meta ); $terms = wp_get_object_terms( (int) $id, get_object_taxonomies( $p->post_type ), array( 'fields' => 'ids' ) );"
                    " $out[] = array( 'status' => $p->post_status, 'title' => $p->post_title, 'content' => $p->post_content,"
                    " 'excerpt' => $p->post_excerpt, 'meta' => $meta, 'terms' => $terms ); } echo wp_json_encode( $out );",
                    {"source": source, "copy": copy}))
                orig, dup = fields
                trouble = [f"page error {e}" for e in errors]
                gone = {"_harlow_name", "_harlow_original", "_harlow_translations"}
                kept_meta = {k: v for k, v in orig["meta"].items() if k not in gone and not k.startswith("rank_math_")}
                # Rank Math's own bookkeeping, which it writes on the copy itself
                dup["meta"] = {k: v for k, v in dup["meta"].items() if not k.startswith("rank_math_")}
                if dup["status"] != "draft" or dup["title"] != f"{orig['title']} (copy)":
                    trouble.append(f"{dup['status']} {dup['title']!r}")
                if (dup["content"], dup["excerpt"], dup["terms"]) != (orig["content"], orig["excerpt"], orig["terms"]):
                    trouble.append("sections, excerpt or categories differ")
                if dup["meta"] != kept_meta:
                    trouble.append(f"fields {sorted(set(dup['meta']) ^ set(kept_meta))} "
                                   f"{[k for k in kept_meta if dup['meta'].get(k) != kept_meta[k]]}")
                if post_type == "page":
                    page = rest("POST", f"/pages/{copy}", {"status": "publish"})
                    n, diff = same_page(path_of(page["link"]), "/about-us/", known, spaces)
                    trouble += diff
                dups += not trouble
                rows.append((f"duplicate of a {'project' if post_type == 'albahoo_project' else post_type}",
                             f"{len(kept_meta)} fields copied, the original's name left behind", trouble))
            report["duplicates"] = dups

            # addresses
            changes = 0
            home_before = fetch("/")[1]
            page = rest("POST", f"/pages/{ids['about-us']}", {"slug": "about-us-check"})
            old = requests.get(WP + "/about-us/", allow_redirects=False, timeout=60)
            home = fetch("/")[1]
            trouble = []
            if old.status_code != 301 or old.headers.get("Location") != WP + "/about-us-check/":
                trouble.append(f"/about-us/ {old.status_code} {old.headers.get('Location')}")
            if fetch("/about-us-check/")[0] != 200:
                trouble.append("/about-us-check/ not 200")
            stale = home.count('"' + WP + "/about-us/")
            moved = home.count('"' + WP + "/about-us-check/")
            if stale or moved != home_before.count('"' + WP + "/about-us/"):
                trouble.append(f"home page: {stale} links to the old address, {moved} to the new")
            rest("POST", f"/pages/{ids['about-us']}", {"slug": "about-us"})
            back = requests.get(WP + "/about-us/", allow_redirects=False, timeout=60)
            left = requests.get(WP + "/about-us-check/", allow_redirects=False, timeout=60)
            if back.status_code != 200 or left.status_code != 301 or left.headers.get("Location") != WP + "/about-us/":
                trouble.append(f"put back: /about-us/ {back.status_code}, /about-us-check/ {left.status_code}")
            changes += not trouble
            rows.append(("a page's address changed", f"about-us: 301, {moved} links on the home page follow; put back", trouble))

            item = news_item()
            news_id = ids[item["name"]]
            slug = item["path"].strip("/").split("/")[-1]
            listing_before = fetch("/latest-news/")[1]
            rest("POST", f"/news/{news_id}", {"slug": slug + "-check"})
            new_path = item["path"].replace(slug, slug + "-check")
            old = requests.get(WP + item["path"], allow_redirects=False, timeout=60)
            listing = fetch("/latest-news/")[1]
            trouble = []
            if old.status_code != 301 or old.headers.get("Location") != WP + new_path:
                trouble.append(f"{item['path']} {old.status_code} {old.headers.get('Location')}")
            if listing.count(WP + new_path) != listing_before.count(WP + item["path"]) or listing.count(WP + item["path"] + '"'):
                trouble.append("the news list does not link to the new address")
            rest("POST", f"/news/{news_id}", {"slug": slug})
            if fetch(item["path"])[0] != 200:
                trouble.append("put back: not 200")
            changes += not trouble
            rows.append(("an item's address changed", "a news item: 301, the news list follows; put back", trouble))

            parent = rest("POST", "/pages", {"title": "Check parent", "slug": "check-parent", "status": "publish"})
            child = rest("POST", "/pages", {"title": "Check child", "slug": "check-child", "status": "publish",
                                            "parent": parent["id"]})
            made += [child["id"], parent["id"]]
            rest("POST", f"/pages/{parent['id']}", {"slug": "check-parent-moved"})
            old = requests.get(WP + "/check-parent/check-child/", allow_redirects=False, timeout=60)
            trouble = []
            if old.status_code != 301 or old.headers.get("Location") != WP + "/check-parent-moved/check-child/":
                trouble.append(f"the child's old address {old.status_code} {old.headers.get('Location')}")
            changes += not trouble
            rows.append(("a parent page's address changed", "its child's old address: 301", trouble))
            report["addresses"] = changes

            # a link picked from the pages
            link, href, errors = await pick_link(browser, ids["about-us"], "da7ef43")
            trouble = [f"page error {e}" for e in errors]
            if link != "contact-us.html" or href != WP + "/contact-us/":
                trouble.append(f"link {link!r}, shown as {href!r}")
            rows.append(("a link picked from the pages", "a button on about-us: the contact page", trouble))
            report["links"] = int(not trouble)
        finally:
            await browser.close()
            php("foreach ( $d['made'] as $id ) { wp_delete_post( (int) $id, true ); }"
                " foreach ( wp_get_post_revisions( (int) $d['about'] ) as $r ) { if ( ! in_array( (int) $r->ID, array_map( 'intval', $d['revisions'] ), true ) ) { wp_delete_post_revision( $r ); } }"
                " global $wpdb; $wpdb->query( $wpdb->prepare( \"DELETE FROM {$wpdb->prefix}rank_math_redirections_cache WHERE redirection_id > %d\", (int) $d['redirections'] ) );"
                " $wpdb->query( $wpdb->prepare( \"DELETE FROM {$wpdb->prefix}rank_math_redirections WHERE id > %d\", (int) $d['redirections'] ) );"
                " delete_post_meta( (int) $d['news'][0], '_wp_old_slug', $d['news'][1] . '-check' );"
                " delete_post_meta( (int) $d['news'][0], '_wp_old_slug', $d['news'][1] );"
                " foreach ( $d['dates'] as $date ) { $wpdb->update( $wpdb->posts, array( 'post_modified' => $date[1],"
                " 'post_modified_gmt' => $date[2] ), array( 'ID' => $date[0] ) ); clean_post_cache( $date[0] ); }"
                " echo 'cleaned';",
                {"made": made, "about": ids["about-us"], "revisions": sorted(revisions), "redirections": redirections,
                 "news": [ids[news_item()["name"]], news_item()["path"].strip("/").split("/")[-1]], "dates": dates})

    for what, detail, trouble in rows:
        print(f"{'OK  ' if not trouble else 'DIFF'} {what:36} {detail}")
        for t in trouble[:6]:
            print("       ", t)
    for p in problems:
        print("  PROBLEM", p)
    after = snapshot()
    report["same"] = sum(1 for p in before if before[p] == after[p])
    report["snap"] = len(before)
    for p in before:
        if before[p] != after[p]:
            print("  NOT AS BEFORE", p)
    return len(problems) + sum(1 for r in rows if r[2])


def main():
    report = {}
    bad = asyncio.run(run(report))
    print(f"\nfeatures: {report.get('kinds', 0)} pages on their kinds' templates; {report.get('new', 0)} new pages and items, "
          f"{report.get('compared', 0)} elements against their models - {report.get('new_differ', 0)} differ "
          f"(white space between elements as the editor writes it differs in {report.get('spaces', 0)} places); "
          f"originals: {report.get('originals', 0)} pages, one put back through the editor; "
          f"duplicates: {report.get('duplicates', 0)} of 2 as their originals; addresses: {report.get('addresses', 0)} of 3 "
          f"changes redirect and are followed; links picked: {report.get('links', 0)} of 1; {bad} problems; "
          f"{report.get('same', 0)} of {report.get('snap', 0)} pages byte for byte as before after putting everything back")
    return 1 if bad or report.get("same") != report.get("snap") else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
