"""Stage 7 check: every page's head against live's, as Rank Math writes it.

For each of the 48 pages and items live answers with a head (the 404 page has none of its
own), the Rank Math block of this site's head is compared with the one in live's captured
server HTML (_capture/raw/): every tag, in order, with its value (live's addresses written
as this site's), and the schema graph node by node, property by property. Also counted
over the whole head: one title, one description, one canonical.

Counted apart, with why, and never a difference:
* og:image:secure_url: Rank Math writes it only for an https address; this site is http.
* the author: a post's (and the front page's) author is this site's user, live's is its
  administrator account (twitter's "Written by", the Person node, the author's name and
  address in the article); compared by being there, not by value.
* the time to read on two pages (README): Rank Math counts the words of the stored page,
  which on live is Elementor's copy and here is the blocks.
* a page's own schema is named after its row in the database (#schema-<id>).

Then in the editor (Chrome, logged in by a cookie WordPress makes through WP-CLI), the
owner's side: every page's and item's Rank Math panel holds its fields (title,
description, focus keywords, robots, social picture) as install/seo.json gives them; and
one page's title and description are changed through the panel (as its snippet editor
writes them) and saved: the head shows them; then they are put back, with the page's
modified time, and its head is live's again. `--no-editor` leaves this part out.

Run it right after a rebuild: a page's modified time is in its head, and checks that save
pages move it.

Passing looks like: `seo: 48 heads, N tags and N schema nodes compared with live's - 0 of
48 differ (…); one title, description and canonical on 48 of 48; Rank Math's panel: 47
pages and items as installed, 1 edit saved and shown, put back`.

    python -u _tools/verify_seo.py [--no-editor] [name …]
"""

import asyncio
import html as htmllib
import json
import re
import sys
from collections import OrderedDict

import html5lib
from playwright.async_api import async_playwright

from common import CAPTURE, ROOT, pages
from verify_features import PREFS, editor_page, php
from wpsite import WP, fetch, wp_cli, wp_path

LIVE = re.compile(r"https?://(www\.)?harlowgroup\.com")
OWN_SCHEMA = re.compile(r"#schema-\d+")
GRAVATAR = re.compile(r"https://secure\.gravatar\.com/avatar/[0-9a-f]*\?")
# Rank Math counts the stored page's words; live stores Elementor's copy (README).
READING = {"index", "corporate-policies"}


def head_parts(text):
    """(tags in order as (key, value), schema graph, whole head) of a page's head."""
    head = text.split("</head>", 1)[0]
    a = head.find("<!-- Search Engine Optimization by Rank Math")
    b = head.find("<!-- /Rank Math")
    doc = html5lib.parse("<html><head>" + head[a:b] + "</head></html>", treebuilder="lxml", namespaceHTMLElements=False)
    out, graph = [], []
    for el in doc.xpath("//head/*"):
        if el.tag == "title":
            out.append(("title", el.text or ""))
        elif el.tag == "meta":
            out.append((el.get("name") or el.get("property"), el.get("content")))
        elif el.tag == "link":
            out.append(("link:" + el.get("rel"), el.get("href")))
        elif el.tag == "script":
            graph = json.loads(el.text)["@graph"]
    whole = html5lib.parse(head + "</head><body></body>", treebuilder="lxml", namespaceHTMLElements=False)
    return out, graph, whole


def plain(value):
    """A schema value as compared: entities read, live's addresses this site's, a page's own
    schema's database id and an avatar's hash left out."""
    text = htmllib.unescape(json.dumps(value, ensure_ascii=False, sort_keys=True))
    return json.loads(GRAVATAR.sub("https://secure.gravatar.com/avatar/?", OWN_SCHEMA.sub("#schema-N", text)))


def author_node(node):
    return node.get("@type") == "Person"


def compare(name, live_text, wp_text):
    """(tags compared, nodes compared, differences, accepted) for one page."""
    live_tags, live_graph, _ = head_parts(LIVE.sub(WP, live_text))
    wp_tags, wp_graph, whole = head_parts(wp_text)
    diffs, accepted = [], []
    if not wp_text or not wp_tags:
        return 0, 0, ["no Rank Math head"], []

    secure = [t for t in live_tags if t[0] == "og:image:secure_url"]
    if secure and WP.startswith("http:"):
        accepted.append(f"og:image:secure_url x{len(secure)} (http)")
        live_tags = [t for t in live_tags if t[0] != "og:image:secure_url"]
    labels = {v: k.replace("label", "data") for k, v in wp_tags if k.startswith("twitter:label")}
    live_labels = {v: k.replace("label", "data") for k, v in live_tags if k.startswith("twitter:label")}
    for label, why in (("Written by", "author"), ("Time to read", "time to read")):
        if label in labels and label in live_labels and (label == "Written by" or name in READING):
            wk, lk = labels[label], live_labels[label]
            if dict(wp_tags).get(wk) != dict(live_tags).get(lk):
                accepted.append(why)
                wp_tags = [(k, "(accepted)") if k == wk else (k, v) for k, v in wp_tags]
                live_tags = [(k, "(accepted)") if k == lk else (k, v) for k, v in live_tags]
    if wp_tags != live_tags:
        for i, (a, b) in enumerate(zip(wp_tags, live_tags)):
            if a != b:
                diffs.append(f"tag {i}: {a[0]}={a[1]!r} / live {b[0]}={b[1]!r}")
                break
        if len(wp_tags) != len(live_tags):
            diffs.append(f"{len(wp_tags)} tags, live {len(live_tags)}: "
                         f"{[k for k, _ in wp_tags if k not in dict(live_tags)]} extra, "
                         f"{[k for k, _ in live_tags if k not in dict(wp_tags)]} missing")

    def keyed(graph):
        out = OrderedDict()
        for node in graph:
            types = node["@type"] if isinstance(node["@type"], list) else [node["@type"]]
            key = "Person (the author)" if types == ["Person"] else "/".join(types) + " " + node.get("@id", "")
            out[OWN_SCHEMA.sub("#schema-N", key)] = node
        return out
    wp_nodes, live_nodes = keyed(wp_graph), keyed(live_graph)
    if list(wp_nodes) != list(live_nodes):
        diffs.append(f"schema nodes {list(wp_nodes)} / live {list(live_nodes)}")
    for key in wp_nodes.keys() & live_nodes.keys():
        a, b = plain(wp_nodes[key]), plain(live_nodes[key])
        if author_node(wp_nodes[key]):
            accepted.append("author")
            continue
        for prop in sorted(set(a) | set(b)):
            x, y = a.get(prop), b.get(prop)
            if prop == "author" and isinstance(x, dict) and isinstance(y, dict) and set(x) == set(y):
                accepted.append("author")
                continue
            if x != y:
                diffs.append(f"{key} {prop}: {json.dumps(x, ensure_ascii=False)[:120]} / live {json.dumps(y, ensure_ascii=False)[:120]}")

    counts = (len(whole.xpath("//head/title")), len(whole.xpath("//head/meta[@name='description']")),
              len(whole.xpath("//head/link[@rel='canonical']")))
    live_has_description = any(k == "description" for k, _ in live_tags)
    if counts != (1, 1 if live_has_description else 0, 1):
        diffs.append(f"titles, descriptions, canonicals in the head: {counts}")
    return len(live_tags), len(live_nodes), diffs, sorted(set(accepted))


PANEL = """
() => {
  const s = wp.data.select('rank-math');
  return { title: s.getTitle(), description: s.getDescription(), keywords: s.getKeywords(),
           robots: Object.keys(s.getRobots() || {}).filter((k) => s.getRobots()[k]),
           image: s.getFacebookImage() || '' };
}
"""
EDIT = """
async ([title, description]) => {
  const r = wp.data.dispatch('rank-math');
  r.updateTitle(title);
  r.updateDescription(description);
  wp.data.dispatch('core/editor').editPost({ meta: {} });
  await wp.data.dispatch('core/editor').savePost();
  await new Promise((done) => setTimeout(done, 1500));
  return wp.data.select('core/editor').didPostSaveRequestFail();
}
"""


async def open_panel(browser, post):
    """The editor of a page or item, once Rank Math's panel has its data: the block editor's
    sidebar, or for a type with no text (gallery items) the classic screen's box, both on
    Rank Math's one store."""
    ctx, page, errors = await editor_page(browser, f"/wp-admin/post.php?post={post}&action=edit")
    await page.wait_for_function("() => window.wp && wp.data && wp.data.select('rank-math')"
                                 " && wp.data.select('rank-math').getRobots", timeout=90000)
    await page.evaluate(PREFS)
    return ctx, page, errors


async def panels(names):
    """(pages and items whose panel holds their fields, problems, the edit's problems)."""
    seo = json.loads((ROOT / "theme" / "install" / "seo.json").read_text(encoding="utf-8"))["pages"]
    ids = json.loads(wp_cli("eval", "echo wp_json_encode( harlow_named_posts() );"))
    types = json.loads(wp_cli("eval", "$o = array(); foreach ( harlow_named_posts() as $n => $id ) { $o[ $n ] = get_post_type( $id ); }"
                              " echo wp_json_encode( $o );"))
    titles = json.loads(wp_cli("eval", "echo wp_json_encode( get_option( 'rank-math-options-titles' ) );"))
    templates = {t: titles.get(f"pt_{t}_title", "") for t in set(types.values())}
    uploads = WP + "/wp-content/uploads/"
    seen, ok, problems = set(), 0, []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        try:
            for name in names:
                if name not in ids or ids[name] in seen:
                    continue
                seen.add(ids[name])
                want = seo.get(name, {})
                ctx, page, errors = await open_panel(browser, ids[name])
                try:
                    got = await page.evaluate(PANEL)
                finally:
                    await ctx.close()
                # A page without a title of its own shows its type's title template; without a
                # social picture of its own, the one Rank Math found, which its head prints.
                shown = re.findall(r'<meta property="og:image" content="([^"]+)"', fetch(PATH[name])[1].split("</head>", 1)[0])
                expect = {"title": want.get("title", templates.get(types[name], "")),
                          "description": want.get("description", ""), "keywords": want.get("focus", ""),
                          "robots": ["index"],
                          "image": uploads + want["image"]["file"] if "image" in want else got["image"]}
                if "image" not in want and got["image"] not in ("", *shown[:1]):
                    expect["image"] = shown[0] if shown else ""
                if got != expect:
                    problems.append(f"{name}: panel {got} / {expect}")
                else:
                    ok += 1

            # one page edited through the panel, saved, shown, put back
            name = "contact-us"
            post = ids[name]
            before = json.loads(php("$p = get_post( (int) $d ); echo wp_json_encode( array( $p->post_modified, $p->post_modified_gmt,"
                                    " array_values( wp_list_pluck( wp_get_post_revisions( (int) $d ), 'ID' ) ) ) );", post))
            edits = []
            for title, description in (("Check title of the SEO stage", "Check description of the SEO stage"),
                                       (seo[name].get("title", ""), seo[name].get("description", ""))):
                ctx, page, errors = await open_panel(browser, post)
                try:
                    failed = await page.evaluate(EDIT, [title, description])
                finally:
                    await ctx.close()
                head = fetch(PATH[name])[1].split("</head>", 1)[0]
                shown_title = re.search(r"<title>(.*?)</title>", head).group(1)
                shown_desc = re.search(r'<meta name="description" content="([^"]*)"', head).group(1)
                if failed or htmllib.unescape(shown_title) != title or htmllib.unescape(shown_desc) != description:
                    edits.append(f"saved {not failed}; head title {shown_title!r}, description {shown_desc[:60]!r} / {title!r}")
            php("global $wpdb; $wpdb->update( $wpdb->posts, array( 'post_modified' => $d['m'][0], 'post_modified_gmt' => $d['m'][1] ),"
                " array( 'ID' => (int) $d['id'] ) ); clean_post_cache( (int) $d['id'] );"
                " foreach ( wp_get_post_revisions( (int) $d['id'] ) as $r ) { if ( ! in_array( (int) $r->ID, array_map( 'intval', $d['m'][2] ), true ) ) { wp_delete_post_revision( $r ); } }"
                " echo 'put back';", {"id": post, "m": before})
        finally:
            await browser.close()
    return ok, problems, edits


PATH = {p["name"]: p["path"] for p in pages()}


def main(only, editor=True):
    rows = []
    for page in pages():
        name = page["name"]
        raw = CAPTURE / "raw" / f"{name}.html"
        if name == "404" or not raw.exists() or (only and name not in only):
            continue
        status, text = fetch(wp_path(page))
        tags, nodes, diffs, accepted = compare(name, raw.read_text(encoding="utf-8"), text if status == 200 else "")
        rows.append((name, tags, nodes, diffs, accepted))

    for name, tags, nodes, diffs, accepted in rows:
        print(f"{'OK  ' if not diffs else 'DIFF'} {name[:52]:52} {tags} tags, {nodes} schema nodes"
              + (f"; accepted: {', '.join(accepted)}" if accepted else ""))
        for d in diffs[:8]:
            print("       ", d)
    bad = sum(1 for r in rows if r[3])
    kinds = {}
    for r in rows:
        for a in r[4]:
            key = a.split(" x")[0]
            kinds[key] = kinds.get(key, 0) + 1
    single = sum(1 for r in rows if not any(d.startswith("titles,") for d in r[3]))
    panel_line, panel_bad = "", 0
    if editor:
        ok, problems, edits = asyncio.run(panels([r[0] for r in rows]))
        for p in problems + edits:
            print("  PANEL", p)
        after = compare("contact-us", (CAPTURE / "raw" / "contact-us.html").read_text(encoding="utf-8"), fetch(PATH["contact-us"])[1])
        if after[2]:
            edits.append("contact-us not as live after putting back")
            print("  PANEL contact-us after putting back:", after[2][:3])
        panel_bad = len(problems) + len(edits)
        panel_line = (f"; Rank Math's panel: {ok} pages and items as installed, {len(problems)} not; "
                      f"{2 - len([e for e in edits if 'saved' in e])} of 2 edits saved and shown, "
                      f"{'put back' if not any('putting back' in e for e in edits) else 'NOT put back'}")
    print(f"\nseo: {len(rows)} heads, {sum(r[1] for r in rows)} tags and {sum(r[2] for r in rows)} schema nodes compared "
          f"with live's - {bad} of {len(rows)} differ (accepted: "
          + ", ".join(f"{k} on {v}" for k, v in sorted(kinds.items())) + f"); one title, description and canonical "
          f"on {single} of {len(rows)}" + panel_line)
    return 1 if bad or panel_bad or not rows else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main({a for a in sys.argv[1:] if not a.startswith("--")}, "--no-editor" not in sys.argv))
