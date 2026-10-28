"""Facts shared by the phase 2 checks: the local WordPress, and how its addresses map onto
the reference's.

The reference links pages as `about-us.html` and files as `assets/...`; WordPress links
the same things as `http://localhost:8090/about-us/` and
`http://localhost:8090/wp-content/themes/harlow/assets/...?ver=...`. `as_reference()`
rewrites a WordPress address into the reference's form, so the two can be compared as
they are written.
"""

import os
import re
import subprocess
from urllib.parse import quote, unquote, urlsplit

import html5lib
import requests
from lxml import etree

from common import ROOT, SITE, pages

WP = "http://localhost:8090"
THEME_ASSETS = WP + "/wp-content/themes/harlow/assets/"
PROBE_404 = "/page-that-does-not-exist-404-probe/"


def wp_path(page):
    """The address of a reference page on the local WordPress (path part)."""
    return PROBE_404 if page["name"] == "404" else page["path"]


def known_paths():
    """Live path -> reference file name."""
    return {p["path"]: p["name"] for p in pages() if p["name"] != "404"}


def fetch(path):
    """(status, text) of a WordPress page, as a visitor sees it: no cookies, no cache."""
    r = requests.get(WP + quote(path, safe="/%"), headers={"Cache-Control": "no-cache"},
                     allow_redirects=False, timeout=60)
    return r.status_code, r.text


def parse(text):
    """One parser for both sides (html5lib, as the browser parses), lxml elements out."""
    return html5lib.parse(text, treebuilder="lxml", namespaceHTMLElements=False)


def reference(name):
    return parse((ROOT / f"{name}.html").read_text(encoding="utf-8"))


def as_reference(value, known):
    """A WordPress address in the reference's form; anything else unchanged."""
    if not value.startswith(WP):
        return value
    if value.startswith(THEME_ASSETS):
        return "assets/" + value[len(THEME_ASSETS):].split("?", 1)[0]
    parts = urlsplit(value)
    path = unquote(parts.path) or "/"
    if not path.endswith("/"):
        path += "/"
    name = known.get(path)
    if name is None:
        return value
    out = f"{name}.html"
    return out + (f"#{parts.fragment}" if parts.fragment else "")


def srcset_as_reference(value, known):
    out = []
    for cand in value.split(","):
        bits = cand.strip().split(" ", 1)
        bits[0] = as_reference(bits[0], known)
        out.append(" ".join(bits))
    return ", ".join(out)


# The page transition leaves links into the dashboard alone; its pattern is the escaped
# address of wp-admin, which is the local site's here and live's in the reference.
def preg_quote(text, delimiter="/"):
    """PHP's preg_quote(), which writes that pattern."""
    special = set(".\\+*?[^]$(){}=!<>|:-#" + delimiter)
    return "".join("\\" + c if c in special else c for c in text)


LOCAL_ADMIN = preg_quote(WP + "/wp-admin/")
LIVE_ADMIN = preg_quote(SITE + "/wp-admin/")


UPLOADS = WP + "/wp-content/uploads/"
URL_ATTRS = ("href", "src", "poster", "preloader-image-url")

# When a picture downloads, not how it looks: WordPress decides these by its own rules
# (header logo high priority, pictures further down lazy), live by how Elementor rendered
# each page. Compared and counted apart (README, "Deliberate differences").
HINTS = ("loading", "decoding", "fetchpriority")


def norm_url(value, known):
    value = unquote(value)   # a U+202F in a file name: written as is, or %E2%80%AF; one address
    if value.startswith(UPLOADS):
        return "assets/uploads/" + value[len(UPLOADS):]
    return as_reference(value, known)


def norm_attrs(el, known):
    """An element's attributes with WordPress's addresses in the reference's form."""
    out = {}
    for k, v in el.attrib.items():
        if k in URL_ATTRS:
            v = norm_url(v, known)
        elif k == "srcset":
            v = ", ".join(" ".join([norm_url(c.strip().split(" ", 1)[0], known)] + c.strip().split(" ", 1)[1:])
                          for c in v.split(","))
        elif k == "style":
            v = re.sub(r'url\((["\']?)([^)"\']+)\1\)', lambda m: f'url({m.group(1)}{norm_url(m.group(2), known)}{m.group(1)})', v)
        elif k == "exclude":
            v = v.replace(LOCAL_ADMIN, LIVE_ADMIN)
        elif k == "class":
            v = " ".join(sorted(set(v.split())))
        elif WP in v:
            v = v.replace(WP, SITE)
        out[k] = v
    return out


def norm_text(s):
    # HTML folds runs of its own white space (space, tab, line feed, form feed, return);
    # a no-break space is a visible space and is kept, unlike Python's \s.
    return re.sub(r"[ \t\n\f\r]+", " ", s or "")


def elements(root):
    return [e for e in root.iter() if isinstance(e.tag, str)]


def compare_trees(wp, ref, known):
    """Two copies of one piece of a page, element by element: (differences, hint differences)."""
    a, b = elements(wp), elements(ref)
    if len(a) != len(b):
        tags = lambda els: [e.tag for e in els]
        first = next((i for i, (x, y) in enumerate(zip(tags(a), tags(b))) if x != y), min(len(a), len(b)))
        return [f"{len(a)} elements, the reference {len(b)}; first different at #{first}: "
                f"{a[first].tag if first < len(a) else '-'} / {b[first].tag if first < len(b) else '-'}"], []
    out, hints = [], []
    for i, (x, y) in enumerate(zip(a, b)):
        if x.tag != y.tag:
            out.append(f"#{i}: <{x.tag}> where the reference has <{y.tag}>")
            continue
        ax, ay = norm_attrs(x, known), norm_attrs(y, known)
        for k in sorted(set(ax) | set(ay)):
            if ax.get(k) != ay.get(k):
                line = f"#{i} <{x.tag}> {k}: {str(ax.get(k))[:90]!r} / reference {str(ay.get(k))[:90]!r}"
                (hints if k in HINTS else out).append(line)
        if norm_text(x.text) != norm_text(y.text):
            out.append(f"#{i} <{x.tag}> text: {norm_text(x.text)[:60]!r} / reference {norm_text(y.text)[:60]!r}")
        if i and norm_text(x.tail) != norm_text(y.tail):
            out.append(f"#{i} </{x.tag}> followed by {norm_text(x.tail)[:40]!r} / reference {norm_text(y.tail)[:40]!r}")
    return out, hints


def wp_cli(*args):
    """WP-CLI in the stack's tools container, as `env.sh wp` runs it; its output."""
    env = dict(os.environ, MSYS_NO_PATHCONV="1")
    r = subprocess.run(["docker", "compose", "--progress", "quiet", "--profile", "tools", "run", "--rm", "-T",
                        "cli", "wp", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", env=env)
    if r.returncode:
        raise RuntimeError(f"wp {' '.join(args[:2])}: {(r.stderr or r.stdout).strip()[-300:]}")
    return r.stdout.strip()


def tree_text(el):
    return etree.tostring(el, method="html", encoding="unicode")
