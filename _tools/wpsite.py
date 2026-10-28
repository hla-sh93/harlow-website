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
