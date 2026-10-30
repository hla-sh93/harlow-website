"""Stage 5 check: the addresses outside the 49 pages answer as live answers them.

Live prints a category's posts and search results in its base theme's own lists (Hello
Elementor), sends date archives home, and answers 404 for author, tag and content type
archives. For each address below, the local site and live are asked the same thing:

* the answer: the same status, and a redirect to the same place;
* for a list: the same `main`, element by element (tag, every attribute, every text), with
  live's addresses read as this site's and live's caching plugin's rewrite read back (it
  swaps pictures for placeholders until they scroll in: data-lazy-*, <noscript>). A search's
  results are WordPress's own search over each site's stored text, which differs (Elementor
  keeps a plain copy of a page, this site keeps its blocks): there the page's head, the
  "nothing found" words and every result both sites list are compared, result by result;
* in Chrome, at 1440 and 479, the box of every element of `main` within 1px, and its
  typography and colours.

    python -u _tools/verify_archives.py

Passing looks like: `archives: N addresses - 0 differ (N elements compared, …)`.
"""

import asyncio
import sys
from urllib.parse import urlsplit

import requests
from playwright.async_api import async_playwright

from common import SITE, UA
from wpsite import HINTS, WP, compare_trees, elements, known_paths, parse

# address, what it is, how lists are compared ("whole" or "results")
ADDRESSES = [
    ("/?s=power", "a search with results", "results"),
    ("/?s=rasheed", "a search with one result", "results"),
    ("/?s=zzzqqq", "a search with none", "whole"),
    ("/category/blog-post/", "a category's posts", "whole"),
    ("/category/latest-news/", "a category without posts", "whole"),
    ("/category/uncategorized/", "another category", "whole"),
    ("/2025/05/", "a month's archive", None),
    ("/2025/", "a year's archive", None),
    ("/?author=3", "an author's archive", None),
    ("/news/", "the news type's archive", None),
    ("/albahoo-project/", "the projects' archive", None),
    ("/gallery-item/", "the gallery's archive", None),
    ("/job/", "the jobs' archive", None),
    ("/tag/iraq/", "a tag", None),
    ("/blog/3/", "the blog's pager past its last page", None),
]
LIVE_HOSTS = (SITE, SITE.replace("://www.", "://"))
PROPS = ["font-family", "font-size", "font-weight", "font-style", "line-height", "color", "text-decoration-line",
         "text-transform", "display", "object-fit", "background-color"]


def answer(base, path):
    r = requests.get(base + path, headers={"User-Agent": UA}, allow_redirects=False, timeout=90)
    where = r.headers.get("Location", "")
    if where:
        where = urlsplit(where).path or "/"
    return r.status_code, where, r.text


def as_local(doc):
    """Live's page with its addresses as this site's, and its caching rewrite read back."""
    for el in list(doc.iter()):
        if not isinstance(el.tag, str):
            continue
        if el.tag == "noscript":
            parent = el.getparent()
            prev = el.getprevious()
            if prev is not None:
                prev.tail = (prev.tail or "") + (el.tail or "")
            else:
                parent.text = (parent.text or "") + (el.tail or "")
            parent.remove(el)
            continue
        for name in [k for k in el.attrib if k.startswith("data-rocket-") or k.startswith("data-wpr-")]:
            del el.attrib[name]
        for name in ("src", "srcset", "sizes"):
            lazy = el.attrib.pop(f"data-lazy-{name}", None)
            if lazy is not None:
                el.set(name, lazy)
        for k, v in el.attrib.items():
            for host in LIVE_HOSTS:
                v = v.replace(host, WP)
            el.set(k, v)
    return doc


def main_of(text, local=False):
    doc = parse(text)
    if local:
        as_local(doc)
    found = doc.xpath("//body//main")
    return found[0] if found else None


def results(main):
    return {a.xpath(".//h2/a/@href")[0]: a for a in main.xpath(".//article")}


def compare_lists(path, how, mine, live, known):
    """(elements compared, differences)."""
    if how == "whole":
        diff, hints = compare_trees(mine, live, known)
        return len(elements(live)), diff
    count, diff = 0, []
    for part in (".//div[@class='page-header']", ".//nav[@class='pagination']"):
        a, b = mine.xpath(part), live.xpath(part)
        if bool(a) != bool(b) and "pagination" not in part:
            diff.append(f"{part}: here {len(a)}, live {len(b)}")
        if a and b:
            d, h = compare_trees(a[0], b[0], known)
            count += len(elements(b[0]))
            diff += [f"{part.split('@class=')[1][:-1]} {x}" for x in d]
    ours, theirs = results(mine), results(live)
    both = [href for href in theirs if href in ours]
    if not both and theirs:
        diff.append(f"no result in common with live ({len(ours)} here, {len(theirs)} on live)")
    for href in both:
        d, h = compare_trees(ours[href], theirs[href], known)
        count += len(elements(theirs[href]))
        diff += [f"{urlsplit(href).path}: {x}" for x in d]
    return count, diff


# Every element of `main` (box from main's top-left, typography and colours), and the same
# per part: the page's head and each result, keyed by its link (boxes from the part's own
# top-left), for searches, whose result lists differ.
BOXES = """
() => {
  const main = document.querySelector('main'); if (!main) return null;
  const props = %s;
  const rows = (root) => { const r0 = root.getBoundingClientRect();
    return [root, ...root.querySelectorAll('*')].filter((e) => e.tagName !== 'NOSCRIPT').map((e) => {
      const b = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return [e.tagName.toLowerCase(), [b.left - r0.left, b.top - r0.top, b.width, b.height].map((v) => +v.toFixed(1)),
              props.map((p) => cs.getPropertyValue(p)).join('|')]; }); };
  const parts = {};
  const head = main.querySelector('.page-header'); if (head) parts.head = rows(head);
  main.querySelectorAll('article').forEach((a) => { const link = a.querySelector('h2 a');
    if (link) parts[new URL(link.href).pathname] = rows(a); });
  return { all: rows(main), parts };
}
""" % PROPS


def compare_rows(a, b):
    if a is None or b is None or [r[0] for r in a] != [r[0] for r in b]:
        return [f"elements: {len(a or [])} here, {len(b or [])} on live"]
    diff = []
    for i, (x, y) in enumerate(zip(a, b)):
        if any(abs(p - q) > 1 for p, q in zip(x[1], y[1])):
            diff.append(f"#{i} <{x[0]}> box {x[1]} / live {y[1]}")
        if x[2] != y[2]:
            pairs = [f"{n} {p!r}/{q!r}" for n, p, q in zip(PROPS, x[2].split("|"), y[2].split("|")) if p != q]
            diff.append(f"#{i} <{x[0]}> " + "; ".join(pairs[:3]))
    return diff


async def look(browser, url, width):
    ctx = await browser.new_context(viewport={"width": width, "height": 900}, user_agent=UA)
    await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
    page = await ctx.new_page()
    await page.goto(url, wait_until="load", timeout=120000)
    await page.evaluate("async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y);"
                        " await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); await document.fonts.ready;"
                        " await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => {"
                        " i.onload = i.onerror = r; setTimeout(r, 8000); }))); }")
    # live's caching plugin renders articles lazily (content-visibility): drawn in full here
    await page.add_style_tag(content="[data-wpr-lazyrender] { content-visibility: visible !important; }")
    await page.wait_for_timeout(800)
    rows = await page.evaluate(BOXES)
    await ctx.close()
    return rows


async def compare_looks(paths):
    """{(path, width): (boxes compared, differences)}; paths: [(path, how)]."""
    out = {}
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        for path, how in paths:
            for width in (1440, 479):
                for attempt in (1, 2):   # live answers in real time: a difference is measured again
                    a = await look(browser, WP + path, width)
                    b = await look(browser, SITE + path, width)
                    if a is None or b is None:
                        diff, count = ["no <main>"], 0
                    elif how == "whole":
                        diff, count = compare_rows(a["all"], b["all"]), len(b["all"])
                    else:
                        common = [k for k in b["parts"] if k in a["parts"]]
                        diff, count = [], 0
                        for key in common:
                            diff += [f"{key}: {d}" for d in compare_rows(a["parts"][key], b["parts"][key])]
                            count += len(b["parts"][key])
                    if not diff:
                        break
                out[(path, width)] = (count, diff)
        await browser.close()
    return out


def main():
    known = known_paths()
    rows, compared, looked = [], 0, []
    for path, what, how in ADDRESSES:
        mine, live = answer(WP, path), answer(SITE, path)
        problems = []
        if mine[:2] != live[:2]:
            problems.append(f"answers {mine[0]} {mine[1]}, live {live[0]} {live[1]}")
        elif how and mine[0] == 200:
            a, b = main_of(mine[2]), main_of(live[2], local=True)
            if a is None or b is None:
                problems.append("no <main>")
            else:
                n, diff = compare_lists(path, how, a, b, known)
                compared += n
                problems += diff
                looked.append((path, how))
        rows.append((path, what, f"{mine[0]} {mine[1]}".strip(), problems))
    looks = asyncio.run(compare_looks(looked))
    boxes = sum(n for n, _ in looks.values())
    for (path, width), (n, diff) in looks.items():
        row = next(r for r in rows if r[0] == path)
        row[3].extend(f"{width}: {d}" for d in diff)
    differ = 0
    for path, what, said, problems in rows:
        differ += bool(problems)
        print(f"{'OK  ' if not problems else 'DIFF'} {path:28} {what:38} {said}")
        for p in problems[:6]:
            print(f"        {p[:230]}")
    print(f"\narchives: {len(rows)} addresses - {differ} differ ({compared} elements of lists compared with live's; "
          f"{boxes} boxes at 1440 and 479)")
    return 1 if differ else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
