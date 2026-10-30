"""Facts shared by the phase 2 checks: the local WordPress, and how its addresses map onto
the reference's.

The reference links pages as `about-us.html` and files as `assets/...`; WordPress links
the same things as `http://localhost:8090/about-us/` and
`http://localhost:8090/wp-content/themes/harlow/assets/...?ver=...`. `as_reference()`
rewrites a WordPress address into the reference's form, so the two can be compared as
they are written.
"""

import base64
import json
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
URL_ATTRS = ("href", "src", "poster", "preloader-image-url", "data-thumbnail", "action")

# When a picture downloads, not how it looks: WordPress decides these by its own rules
# (header logo high priority, pictures further down lazy), live by how Elementor rendered
# each page. Compared and counted apart (README, "Deliberate differences").
HINTS = ("loading", "decoding", "fetchpriority")


def norm_url(value, known):
    value = unquote(value)   # a U+202F in a file name: written as is, or %E2%80%AF; one address
    if value.startswith("/") and not value.startswith("//"):
        value = WP + value   # root-relative (a form's action): this site's
    if value.startswith(UPLOADS):
        return "assets/uploads/" + value[len(UPLOADS):]
    return as_reference(value, known)


def norm_action_hash(value, known):
    """An Elementor lightbox link (#elementor-action:action=lightbox&settings=<base64 JSON>)
    with the picture's address inside written the reference's way. The reference keeps
    live's address there (build_pages does not open it); both sides are read as the path of
    the picture's file."""
    prefix = "#elementor-action%3Aaction%3Dlightbox%26settings%3D"
    if not value.startswith(prefix):
        return value
    raw = unquote(value[len(prefix):])
    data = json.loads(base64.b64decode(raw + "=" * (-len(raw) % 4)))
    url = data.get("url", "")
    for base in (UPLOADS, SITE + "/wp-content/uploads/"):
        if url.startswith(base):
            data["url"] = "assets/uploads/" + url[len(base):]
    return "lightbox " + json.dumps(data, sort_keys=True)


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
        elif k == "data-e-action-hash":
            v = norm_action_hash(v, known)
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


# White space at the start or end of a heading's, paragraph's or list item's words is not
# drawn (HTML takes it off a line's ends); the editor keeps those words without it.
EDGE_TRIMMED = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li"}


def edge_trimmed(el):
    return el.tag in EDGE_TRIMMED or "elementor-heading-title" in (el.get("class") or "").split()


def elements(root):
    return [e for e in root.iter() if isinstance(e.tag, str)]


def compare_trees(wp, ref, known, space=None):
    """Two copies of one piece of a page, element by element: (differences, hint differences).
    With a list as `space`, a difference only in white space between elements (one space or
    none, after folding) goes there instead (pages saved through the editor, which writes its
    own line breaks between blocks)."""
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
        tx, ty = norm_text(x.text), norm_text(y.text)
        if edge_trimmed(x):
            tx, ty = tx.lstrip(" "), ty.lstrip(" ")
            if not len(x):
                tx, ty = tx.rstrip(" "), ty.rstrip(" ")
        if tx != ty:
            line = f"#{i} <{x.tag}> text: {tx[:60]!r} / reference {ty[:60]!r}"
            (space if space is not None and not tx.strip(" ") and not ty.strip(" ") else out).append(line)
        ax_tail, ay_tail = norm_text(x.tail), norm_text(y.tail)
        parent = x.getparent()
        if parent is not None and x.getnext() is None and edge_trimmed(parent):
            ax_tail, ay_tail = ax_tail.rstrip(" "), ay_tail.rstrip(" ")
        if i and ax_tail != ay_tail:
            line = f"#{i} </{x.tag}> followed by {ax_tail[:40]!r} / reference {ay_tail[:40]!r}"
            (space if space is not None and not ax_tail.strip(" ") and not ay_tail.strip(" ") else out).append(line)
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


def login_cookies():
    """Browser cookies of the site's first administrator, made by WordPress itself through
    WP-CLI (a new session, four hours long), for the checks that drive the dashboard. No
    password is read or typed."""
    out = wp_cli("eval", "$ids = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );"
                 " $exp = time() + 4 * HOUR_IN_SECONDS;"
                 " echo wp_json_encode( array( AUTH_COOKIE => wp_generate_auth_cookie( (int) $ids[0], $exp, 'auth' ),"
                 " LOGGED_IN_COOKIE => wp_generate_auth_cookie( (int) $ids[0], $exp, 'logged_in' ) ) );")
    return [{"name": k, "value": v, "domain": "localhost", "path": "/"} for k, v in json.loads(out).items()]
