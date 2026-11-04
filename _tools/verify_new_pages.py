"""A new page made the ways an owner makes one, each compared element by element with a page
of the site (stage 9, after the owner's round: "build a whole page and match it with one of
the site's pages; anything short of 100% means the tools cannot make new pages yet").

  blank     for every one of the 22 pages: a page started empty through "What kind of page
            is this?" (the page's kind), its sections put in from the editor's patterns (the
            section library and the shared Major clients), in the page's order, as the
            inserter puts a pattern in; a section of the page that no pattern holds is
            reported (the page cannot be made from blank).
  any page  every one of the 22 pages saved as a pattern (the editor's Create pattern, not
            synced, as Elementor's Save as template), a page started empty, the pattern
            put in.
  (template: every kind's starter through the kind window is verify_features.py's.)

Each new page is published, compared with its page (verify_features.same_page: its
document element by element, its stylesheets; its own address and the menus' current marks
aside, the editor's white space between elements counted apart) and deleted with the
patterns made. The 49 pages byte for byte as before.

Passing looks like: `new pages: from blank 22 of 22 pages made and identical (N elements);
from a page saved as a pattern 22 of 22 identical (N elements); 0 problems; 49 of 49 pages
byte for byte as before`.
"""
import asyncio
import json
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT  # noqa: E402
from verify_editable import snapshot  # noqa: E402
import verify_features as vf  # noqa: E402
from verify_features import KINDS, PATH, PUBLISH, SITE, Rest, open_editor, path_of, same_page  # noqa: E402
from wpsite import known_paths, wp_cli  # noqa: E402

IDS = {}
ONLY = set(sys.argv[1:])


def compare(result, name, known, space):
    """The new page against its page (same_page). Contact Form 7 writes the page's own id into
    a form's id, action and hidden field: a new page has its own, as it has its own address,
    and it is read as its page's."""
    if not result.get("link"):
        return 0, [result.get("error") or "not made"]
    new_id, model_id = result.get("id"), IDS.get(name)
    original = vf.as_model

    def as_model(text, path, model_path):
        text = original(text, path, model_path)
        # a form's action: the page's own address, as a path
        text = text.replace(f'action="{path}#', f'action="{model_path}#')
        if new_id and model_id:
            text = re.sub(rf"(wpcf7-f\d+-p){new_id}(-o\d+)", rf"\g<1>{model_id}\2", text)
            text = text.replace(f'name="_wpcf7_container_post" value="{new_id}"',
                                f'name="_wpcf7_container_post" value="{model_id}"')
        return text
    vf.as_model = as_model
    try:
        return same_page(path_of(result["link"]), PATH[name], known, space)
    finally:
        vf.as_model = original

THEME = ROOT / "theme"


def norm(markup):
    """Block markup without the white space between blocks (how it is written aside)."""
    return re.sub(r">\s+<", "><", markup.strip())


def top_sections(markup):
    """The blocks directly inside a page's document block, each as its markup."""
    out, depth, start = [], 0, None
    for m in re.finditer(r"<!-- (/?)wp:([\w/-]+)(?:\s+(\{.*?\}))?\s*(/?)-->", markup, re.S):
        close, name, selfc = m.group(1), m.group(2), m.group(4)
        if name == "harlow/document":
            depth = 0 if close else 1
            continue
        if not depth:
            continue
        if close:
            depth -= 1
            if depth == 1:
                out.append(markup[start:m.end()])
        else:
            if depth == 1:
                start = m.start()
                if selfc:
                    out.append(markup[start:m.end()])
                    continue
            if not selfc:
                depth += 1
    return out


def library():
    """The section library: {normalised markup: pattern slug} (patterns/section-*.php)."""
    out = {}
    for f in sorted((THEME / "patterns").glob("section-*.php")):
        text = f.read_text(encoding="utf-8")
        slug = re.search(r"Slug: (\S+)", text).group(1)
        body = text.split("?>", 1)[1] if "?>" in text else text
        out[norm(body)] = slug
    return out


MAKE = r"""
async ([kind, title, contents]) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const be = wp.data.select('core/block-editor');
  const doc = be.getBlocks()[0];
  if (!doc || doc.name !== 'harlow/document') return { error: 'no document block' };
  // the editor takes blocks into the document only once the canvas has drawn it
  for (let i = 0; i < 120 && !(be.getBlockListSettings(doc.clientId) && be.canInsertBlockType('harlow/container', doc.clientId)); i++) await wait(250);
  // each pattern as the inserter puts it: its blocks parsed, put in at the end of the document
  for (const content of contents) {
    wp.data.dispatch('core/block-editor').insertBlocks(wp.blocks.parse(content), be.getBlockOrder(doc.clientId).length, doc.clientId, false);
    await wait(150);
  }
  await wait(1500);
  const expected = contents.reduce((n, c) => n + wp.blocks.parse(c).length, 0);
  if (be.getBlockOrder(doc.clientId).length !== expected) return { error: `${be.getBlockOrder(doc.clientId).length} sections put in of ${expected}` };
  const d = wp.data.dispatch('core/editor');
  d.editPost({ title, status: 'publish' });
  for (let n = 0; n < 3; n++) {
    for (let i = 0; i < 120 && wp.data.select('core/editor').isSavingPost(); i++) await wait(250);
    await d.savePost();
    for (let i = 0; i < 120 && wp.data.select('core/editor').isSavingPost(); i++) await wait(250);
    if (!wp.data.select('core/editor').isEditedPostDirty()) break;
  }
  const s = wp.data.select('core/editor');
  return { id: s.getCurrentPostId(), link: s.getPermalink(), failed: s.didPostSaveRequestFail(), template: s.getEditedPostAttribute('template'), blocks: be.getBlockOrder(doc.clientId).length };
}
"""


async def make_page(browser, kind, title, contents):
    """A page started empty through the kind window, the patterns put in, published."""
    ctx, page, errors = await open_editor(browser, "/wp-admin/post-new.php?post_type=page")
    try:
        dialog = page.get_by_role("dialog", name="What kind of page is this?")
        await dialog.wait_for(timeout=60000)
        await dialog.get_by_label(KINDS[kind]["title"], exact=True).check()
        await dialog.get_by_label("Start with its ready sections (real words to replace)").uncheck()
        await dialog.get_by_role("button", name="Start", exact=True).click()
        await page.wait_for_function(
            "(t) => wp.data.select('core/editor').getEditedPostAttribute('template') === t"
            " && wp.data.select('core/block-editor').getBlocks().length === 1", arg=f"kind-{kind}", timeout=60000)
        result = await page.evaluate(MAKE, [kind, title, contents])
        return result, errors
    finally:
        await ctx.close()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    rest = Rest()
    known = known_paths()
    IDS.update(json.loads(wp_cli("eval", "echo wp_json_encode( harlow_named_posts() );")))
    lib = library()
    clients = norm((THEME / "pages" / "_major-clients.html").read_text(encoding="utf-8")) if (THEME / "pages" / "_major-clients.html").exists() else ""
    problems, made, patterns = [], [], []
    blank_ok = blank_n = any_ok = any_n = 0
    space = []
    before = snapshot()

    async def run():
        nonlocal blank_ok, blank_n, any_ok, any_n
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            for p in SITE["pages"]:
                name, kind = p["name"], p["kind"].lower()
                if ONLY and name not in ONLY:
                    continue
                source = (THEME / "pages" / f"{name}.html").read_text(encoding="utf-8")
                sections = top_sections(source)
                # From blank: each section from the library (or the shared Major clients).
                contents, missing = [], []
                for n, sec in enumerate(sections, 1):
                    key = norm(sec)
                    if key in lib:
                        contents.append(sec)
                    else:
                        missing.append(n)
                if missing:
                    problems.append(f"{name}: from blank, sections {missing} of {len(sections)} are in no pattern")
                else:
                    result, errors = await make_page(browser, kind, f"From blank {name}", contents)
                    if result.get("id"):
                        made.append(result["id"])
                    n_el, diff = compare(result, name, known, space)
                    diff += [f"page error {e}" for e in errors]
                    if result.get("failed") or result.get("template") != f"kind-{kind}":
                        diff.append(f"saved {not result.get('failed')}, template {result.get('template')!r}")
                    blank_n += n_el
                    blank_ok += not diff
                    for d in diff[:4]:
                        problems.append(f"{name} from blank: {d}")
                    print(f"  {'OK  ' if not diff else 'DIFF'} {name[:40]:40} from blank: {len(contents)} sections, {n_el} elements", flush=True)
                # Any page as a template: the page saved as a pattern, a new page from it.
                whole = "".join(sections)
                r = rest("POST", "/blocks", {"title": f"Page as a pattern: {name}", "status": "publish", "content": whole,
                                              "meta": {"wp_pattern_sync_status": "unsynced"}})
                patterns.append(r["id"])
                result, errors = await make_page(browser, kind, f"From pattern {name}", [r["content"]["raw"]])
                if result.get("id"):
                    made.append(result["id"])
                n_el, diff = compare(result, name, known, space)
                diff += [f"page error {e}" for e in errors]
                any_n += n_el
                any_ok += not diff
                for d in diff[:4]:
                    problems.append(f"{name} from its pattern: {d}")
                print(f"  {'OK  ' if not diff else 'DIFF'} {name[:40]:40} from its pattern: {n_el} elements", flush=True)
            await browser.close()

    try:
        asyncio.run(run())
    finally:
        for pid in made:
            rest("DELETE", f"/pages/{pid}?force=true")
        for bid in patterns:
            rest("DELETE", f"/blocks/{bid}?force=true")
    after = snapshot()
    same = sum(before[n] == after[n] for n in before)
    if same != len(before):
        problems.append(f"{len(before) - same} pages not byte for byte as before")
    for p in problems:
        print("  PROBLEM", p[:400])
    total = len([p for p in SITE["pages"] if not ONLY or p["name"] in ONLY])
    print(f"\nnew pages: from blank {blank_ok} of {total} pages made and identical ({blank_n} elements);"
          f" from a page saved as a pattern {any_ok} of {total} identical ({any_n} elements)"
          f" (white space between elements as the editor writes it differs in {len(space)} places);"
          f" {len(problems)} problems; {same} of {len(before)} pages byte for byte as before")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
