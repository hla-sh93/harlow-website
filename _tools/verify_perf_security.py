"""The theme's security and performance, measured (stage 9, after the owner's round).

Security (`--part=security`), each test passes or fails, with what it found:
  code        phpcs's WordPress security sniffs pass on the theme (env.sh phpcs), and every
              place the theme silences one says why.
  rest        every REST route the theme registers says who may call it; the install
              route answers no to a visitor, a subscriber, an author and an editor, and to
              the administrator's cookies without the REST nonce (cross-site requests).
  actions     the admin-post actions (a submission marked read, the submissions' CSV)
              answer no to a visitor, an author, and the administrator without a nonce.
  screens     the theme's admin screens (Site pages, Editing and maintenance, Theme
              Builder, Submissions) answer no to an author and an editor.
  stored-xss  an author (no unfiltered_html, as WordPress gives authors) publishes a post
              with every block of the theme, every text attribute holding a script, an
              event handler and a javascript: address, and the style's custom CSS and
              custom attributes trying to break out; the post is read as a visitor: no
              script of theirs runs (Chrome), no handler or javascript: address is printed.
  author      what an author's post may do that only someone trusted with HTML should:
              print page CSS, add attributes to elements, run a shortcode.
  uploads     an author cannot upload an SVG; an administrator's SVG is cleaned to its
              shapes (no script, handler, javascript:, foreignObject or outside address).
  form        the public form route: no nonce, a filled honeypot, a header in the e-mail
              field, a PHP file as an upload are refused; a script in a field is stored and
              shown escaped in Submissions; a formula is defused in the CSV; sending too
              often is slowed down.
  roles       an editor of the words and pictures only (the role manager) cannot change
              an element's style through the REST API.
  maintenance in maintenance mode, a visitor gets 503 and reads no page through the REST
              API, a feed or the sitemap.
  disclosure  what a visitor can read about the site: WordPress's version, its users
              (REST), XML-RPC, readme.html, debug.log, folder listings, the theme's PHP
              files opened directly.
  recursion   a Theme Builder template of every kind holding the item's text and a list of
              whole texts, read by the editor (REST) and as a page: answers, no error.
  secrets     no password, key or token in the repository's files.
  deps        npm audit of the editor's build.

Performance (`--part=performance`), on the 49 pages, each against the same page of the
reference (/static/<name>.html, the live design without WordPress):
  server      per page, three requests: time to the first byte, the database queries,
              PHP's time and peak memory (_tools/local/mu-plugins/harlow-local-metrics.php).
  browser     per page, in Chrome, as a phone on a slow 4G line (4x slower processor) and
              as a desktop: LCP, CLS, total blocking time, requests and bytes by kind, the
              DOM's size, failed requests, script errors, pictures without a size or far
              larger than shown.
  editor      the home page's editor until its blocks and canvas are drawn; the bundle.

Everything made is deleted and the site's options put back; the 49 pages byte for byte as
before. Writes _capture/perf_security.md (and .json).

Passing looks like: `security: N tests, N passed (…); performance: 49 pages x 2 profiles,
0 over budget (…); 49 of 49 pages byte for byte as before`.
"""
import argparse
import asyncio
import json
import re
import shutil
import statistics
import subprocess
import sys
import time
from pathlib import Path

import html5lib
import requests
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, pages  # noqa: E402
from wpsite import WP, wp_cli, wp_path  # noqa: E402
from verify_editable import snapshot  # noqa: E402

THEME = ROOT / "theme"
MARK = "hlx"  # what a payload sets or names when it runs: window.hlx
SCRIPT = f'"><script>window.{MARK}=1</script><img src=x onerror="window.{MARK}=1"><svg onload="window.{MARK}=1">'
JS_URL = f"javascript:window.{MARK}=1//"
# Git Bash: a bare `bash` started from Python on Windows can be WSL's, which has no Docker.
BASH = r"C:\Program Files\Git\bin\bash.exe" if Path(r"C:\Program Files\Git\bin\bash.exe").exists() else "bash"
URLISH = re.compile(r"(link|url|href|src|video|audio|lottie|file|embed|redirect|action|webhook|map|address|playlist)", re.I)


# ---------------------------------------------------------------- helpers

def ps_php(step, data=None):
    """One step of _tools/perf_security.php in WP-CLI, as the site's administrator."""
    shutil.copyfile(ROOT / "_tools" / "perf_security.php", ROOT / "_env" / "perf-security.php")
    (ROOT / "_env" / "perf-security.json").write_text(json.dumps(data or {}), encoding="utf-8")
    admin = wp_cli("user", "list", "--role=administrator", "--field=ID", "--number=1")
    said = wp_cli("eval-file", "/env/perf-security.php", step, f"--user={admin}")
    start = said.find("HARLOW-JSON")
    if start < 0:
        raise RuntimeError(f"perf_security.php {step} said nothing: {said[-400:]}")
    out = json.loads(said[start + len("HARLOW-JSON"):]) or {}
    if isinstance(out, dict) and "__error" in out:
        raise RuntimeError(f"perf_security.php {step}: {out['__error']}")
    return out


class Session:
    """Requests as one person: their cookies (a header: a cookie jar drops 'localhost'),
    and the REST nonce WordPress gives them."""

    def __init__(self, cookies=None, nonce=True):
        self.s = requests.Session()
        self.s.headers["User-Agent"] = "harlow-perf-security"
        if cookies:
            self.s.headers["Cookie"] = "; ".join(f"{k}={v}" for k, v in cookies.items())
            if nonce:
                n = self.s.get(WP + "/wp-admin/admin-ajax.php?action=rest-nonce", timeout=60).text.strip()
                if re.fullmatch(r"[0-9a-f]{10}", n):
                    self.s.headers["X-WP-Nonce"] = n

    def get(self, path, **kw):
        kw.setdefault("timeout", 120)
        kw.setdefault("allow_redirects", False)
        return self.s.get(path if path.startswith("http") else WP + path, **kw)

    def post(self, path, **kw):
        kw.setdefault("timeout", 120)
        kw.setdefault("allow_redirects", False)
        return self.s.post(path if path.startswith("http") else WP + path, **kw)


def admin_cookies():
    out = wp_cli("eval", "$ids = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );"
                 " $exp = time() + 4 * HOUR_IN_SECONDS;"
                 " echo wp_json_encode( array( AUTH_COOKIE => wp_generate_auth_cookie( (int) $ids[0], $exp, 'auth' ),"
                 " LOGGED_IN_COOKIE => wp_generate_auth_cookie( (int) $ids[0], $exp, 'logged_in' ) ) );")
    return json.loads(out)


def refused(r):
    """A request WordPress refused: a 4xx, a redirect to the login screen, or its 'not
    allowed' page."""
    if r.status_code in (401, 403, 404, 405, 400):
        return True
    if r.status_code in (301, 302) and "wp-login.php" in r.headers.get("Location", ""):
        return True
    body = r.text[:20000].lower()
    return r.status_code in (200, 500) and ("not allowed" in body or "sorry, you are not" in body
                                              or "the link you followed has expired" in body)


class Results:
    def __init__(self):
        self.rows = []

    def add(self, area, test, ok, detail="", severity="", fix=""):
        self.rows.append({"area": area, "test": test, "ok": bool(ok), "detail": detail,
                          "severity": "" if ok else (severity or "medium"), "fix": "" if ok else fix})
        mark = "ok  " if ok else f"FAIL [{severity or 'medium'}]"
        print(f"  {mark} {area}: {test}" + (f" — {detail}" if detail and not ok else ""), flush=True)


def wp_attrs(attrs):
    """Block attributes written as WordPress's serialize_block_attributes() writes them (the
    editor and the REST API alike): <, >, &, -- and quotes inside strings as \\u escapes."""
    s = json.dumps(attrs, ensure_ascii=False, separators=(",", ":"))
    return (s.replace("--", "\\u002d\\u002d").replace("<", "\\u003c").replace(">", "\\u003e")
            .replace("&", "\\u0026").replace('\\"', "\\u0022"))


def attribute_defaults(block_json):
    return {k: v.get("default") for k, v in block_json.get("attributes", {}).items()}


def new_id(n):
    return f"{0xa000000 + n:07x}"


# ---------------------------------------------------------------- security

def sec_code(res):
    """phpcs's security sniffs, and every silenced one with its reason."""
    r = subprocess.run([BASH, "_tools/env.sh", "phpcs"], cwd=ROOT, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    res.add("code", "WordPress security sniffs (escaping, nonces, sanitizing, prepared SQL) pass on the theme",
            r.returncode == 0, r.stdout.strip().splitlines()[-1][:200] if r.stdout.strip() else r.stderr[-200:],
            "high", "Fix what phpcs reports.")
    silenced, unexplained = 0, []
    for f in THEME.rglob("*.php"):
        if "build" in f.parts:
            continue
        for n, line in enumerate(f.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if re.search(r"phpcs:(ignore|disable)[^\n]*WordPress\.(Security|DB)", line):
                silenced += 1
                if "--" not in line.split("phpcs:", 1)[1]:
                    unexplained.append(f"{f.relative_to(ROOT)}:{n}")
    res.add("code", f"every silenced security sniff says why ({silenced} places)", not unexplained,
            ", ".join(unexplained[:8]), "low", "Give each its reason after `--`, or fix the code.")


def sec_rest(res, people):
    found = ps_php("routes")
    routes = found["routes"]
    public = {"/harlow/v1/form": "a form anyone may send"}
    for r in routes:
        if r["route"].count("/") <= 2:  # /harlow/v1: WordPress's index of the namespace
            continue
        open_ = r["permission"] in ("__return_true", "none")
        res.add("rest", f"{r['route']} {'/'.join(r['methods'])} says who may call it ({r['permission']})",
                not open_ or r["route"] in public,
                "anyone" if open_ else "", "high", "Give the route a permission callback.")
    install = "/wp-json/harlow/v1/install"
    for who in ("visitor", "subscriber", "author", "editor"):
        s = people[who]
        r = s.post(install, json={"start": False, "replace": False})
        res.add("rest", f"Site pages' install route refuses {who}s", r.status_code in (401, 403),
                f"answered {r.status_code}", "high", "Its permission callback must ask for the administrator's capability.")
    r = Session(admin_cookies(), nonce=False).post(install, json={"start": False, "replace": False})
    res.add("rest", "the install route refuses the administrator's cookies without the REST nonce (a cross-site request)",
            r.status_code in (401, 403), f"answered {r.status_code}", "high", "")
    return found["actions"]


def sec_actions(res, people, actions):
    hooks = sorted({a["hook"] for a in actions if a["hook"].startswith("admin_post_")})
    for hook in hooks:
        action = hook.replace("admin_post_nopriv_", "").replace("admin_post_", "")
        nopriv = any(a["hook"] == f"admin_post_nopriv_{action}" for a in actions)
        res.add("actions", f"{action} is not offered to visitors (no admin_post_nopriv_)", not nopriv, "", "high",
                "Register only admin_post_ for actions of logged-in people.")
        for who in ("visitor", "author"):
            r = people[who].get(f"/wp-admin/admin-post.php?action={action}&post=1")
            leaked = "text/csv" in r.headers.get("Content-Type", "")
            res.add("actions", f"{action} refuses {who}s", refused(r) and not leaked,
                    f"answered {r.status_code} {r.headers.get('Content-Type', '')}", "high",
                    "Check the capability and the nonce first.")
        r = people["admin-no-nonce"].get(f"/wp-admin/admin-post.php?action={action}&post=1")
        leaked = "text/csv" in r.headers.get("Content-Type", "")
        res.add("actions", f"{action} refuses the administrator without its nonce (a cross-site link)",
                refused(r) and not leaked, f"answered {r.status_code}", "high", "check_admin_referer() first.")


def sec_screens(res, people):
    screens = {
        "Site pages": "/wp-admin/themes.php?page=harlow-site-pages",
        "Editing and maintenance": "/wp-admin/themes.php?page=harlow-site-tools",
        "Theme Builder": "/wp-admin/edit.php?post_type=harlow_template",
        "Submissions": "/wp-admin/edit.php?post_type=harlow_submission",
        "Customize (Site settings)": "/wp-admin/customize.php",
    }
    for name, path in screens.items():
        for who in ("author", "editor"):
            r = people[who].get(path)
            res.add("screens", f"{name} refuses {who}s", refused(r), f"answered {r.status_code}", "high",
                    "The screen and its saving must ask for the administrator's capability.")


def payload_blocks():
    """Every block of the theme, its text attributes holding the payloads; its style's custom
    CSS and attributes trying to break out. (block name, its markup)"""
    out = []
    n = 0
    for f in sorted((THEME / "blocks").glob("*/block.json")):
        meta = json.loads(f.read_text(encoding="utf-8"))
        name = meta["name"]
        if name in ("harlow/document", "harlow/site-part", "harlow/accordion-item"):
            continue
        attrs = {}
        for key, spec in meta.get("attributes", {}).items():
            if key in ("element", "widget"):
                continue
            if spec.get("type") == "string" and key != "classes":
                attrs[key] = JS_URL if URLISH.search(key) else SCRIPT
        n += 1
        if "element" in meta.get("attributes", {}):
            attrs["element"] = new_id(n)
            attrs["classes"] = f"elementor-element elementor-widget elementor-widget-{f.parent.name}"
        attrs["style"] = {
            "desktop": {"css": f"selector{{outline:7px solid rgb(1,2,3)}}</style><script>window.{MARK}=1</script>"},
            "attributes": f"onclick|window.{MARK}=1\nhref|{JS_URL}\nformaction|{JS_URL}\ndata-hl|\"><script>window.{MARK}=1</script>",
            "classes": f"ok\" onmouseover=\"window.{MARK}=1",
        }
        body = wp_attrs(attrs)
        out.append((name, f"<!-- wp:{name} {body} /-->"))
    return out


async def run_in_chrome(url, cookies=None):
    """A page in Chrome: whether a payload ran (window.hlx), the page's script errors."""
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        if cookies:
            await ctx.add_cookies([{"name": k, "value": v, "domain": "localhost", "path": "/"} for k, v in cookies.items()])
        page = await ctx.new_page()
        errors, dialogs = [], []
        page.on("pageerror", lambda e: errors.append(str(e)[:160]))
        page.on("dialog", lambda d: (dialogs.append(d.message), asyncio.ensure_future(d.dismiss())))
        await page.goto(url, wait_until="load", timeout=120000)
        await page.wait_for_timeout(1500)
        # what a visitor does: scroll the page, move over and click its elements
        await page.evaluate("async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } }")
        await page.evaluate(f"() => document.querySelectorAll('[onmouseover], [onclick], a[href^=\"javascript\"]').forEach((e) => {{ e.dispatchEvent(new MouseEvent('mouseover', {{bubbles: true}})); }})")
        ran = await page.evaluate(f"() => !!window.{MARK}")
        await browser.close()
        return ran, errors, dialogs


def printed_payloads(html):
    """What of the payloads the markup prints: script elements of theirs, handlers, and
    javascript: addresses."""
    doc = html5lib.parse(html, treebuilder="lxml", namespaceHTMLElements=False)
    found = []
    for el in doc.iter():
        if not isinstance(el.tag, str):
            continue
        if el.tag == "script" and MARK in (el.text or "") and "json" not in (el.get("type") or ""):
            found.append("a <script> of the payload")
        for k, v in el.attrib.items():
            if k.lower().startswith("on") and MARK in v:
                found.append(f"<{el.tag} {k}=…>")
            if k.lower() in ("href", "src", "action", "formaction", "xlink:href", "data", "poster") \
                    and v.strip().lower().startswith("javascript:"):
                found.append(f"<{el.tag} {k}=javascript:…>")
    return found


def sec_stored_xss(res, people, made):
    author = people["author"]
    blocks = payload_blocks()
    content = "\n\n".join(markup for _, markup in blocks)
    r = author.post("/wp-json/wp/v2/posts", json={"title": "Security probe", "status": "publish", "content": content})
    if r.status_code not in (200, 201):
        res.add("stored-xss", "an author can publish the probe post", False, f"{r.status_code} {r.text[:160]}", "info")
        return None
    post = r.json()
    made.append(post["id"])
    page = requests.get(post["link"], timeout=120)
    found = printed_payloads(page.text)
    res.add("stored-xss", f"no script, handler or javascript: address of an author's {len(blocks)} blocks is printed",
            not found, "; ".join(sorted(set(found))[:6]), "high",
            "Escape every attribute where it is printed (esc_attr, esc_url, wp_kses).")
    ran, errors, dialogs = asyncio.run(run_in_chrome(post["link"]))
    res.add("stored-xss", "no script of the author's runs in the page (Chrome, scrolled and moved over)",
            not ran and not dialogs, f"window.{MARK} set" if ran else "; ".join(dialogs[:2]), "high", "")
    # Per block: which ones print what, so a fix knows where to look.
    by_block = []
    for name, markup in blocks:
        r2 = author.post("/wp-json/wp/v2/posts", json={"title": f"Probe {name}", "status": "draft", "content": markup})
        if r2.status_code in (200, 201):
            pid = r2.json()["id"]
            made.append(pid)
            rendered = people["admin"].get(f"/wp-json/wp/v2/posts/{pid}?context=view").json().get("content", {}).get("rendered", "")
            bad = printed_payloads(f"<div>{rendered}</div>")
            if bad:
                by_block.append(f"{name}: {', '.join(sorted(set(bad)))}")
    if by_block:
        res.add("stored-xss", f"per block, what is printed ({len(by_block)} blocks)", False, " | ".join(by_block), "high", "")
    return post


def sec_author(res, people, post):
    if not post:
        return
    html = requests.get(post["link"], timeout=120).text
    css = "outline:7pxsolidrgb(1,2,3)" in html.replace(" ", "")
    res.add("author", "an author's custom CSS is not printed (page CSS is for those trusted with HTML)", not css,
            "printed", "medium", "Print an element's custom CSS only when its post's author can unfiltered_html.")
    attr = 'data-hl="' in html
    res.add("author", "an author's custom attributes are not printed", not attr, "printed", "low",
            "Print custom attributes only when the post's author can unfiltered_html.")
    author = people["author"]
    span = '<span class="harlow-dynamic" data-tag="shortcode" data-key="[contact-form-7 id=&quot;3453&quot;]">x</span>'
    probes = {
        "in a block's words": '<!-- wp:harlow/heading ' + wp_attrs({"element": "a0fffff", "classes": "elementor-element elementor-widget elementor-widget-heading",
                                                                       "text": "Short: " + span}) + ' /-->',
        "in the post's own HTML": f"<p>Short: {span}</p>",
    }
    ran = []
    for where, probe in probes.items():
        r = author.post("/wp-json/wp/v2/posts", json={"title": "Shortcode probe", "status": "publish", "content": probe})
        if r.status_code in (200, 201):
            people["made"].append(r.json()["id"])
            page = requests.get(r.json()["link"], timeout=120).text
            if re.search(r"Your (Name|Email)|wpcf7", page):
                ran.append(where)
    res.add("author", "an author's dynamic tag cannot run a shortcode (in a block, in their HTML)", not ran,
            "ran " + ", ".join(ran), "medium",
            "Run the shortcode tag only when the post's author can unfiltered_html.")


def sec_uploads(res, people, made):
    svg = (b'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 8 8" onload="alert(1)">'
           b'<script>alert(1)</script><a xlink:href="javascript:alert(1)"><path d="M0 0h8v8H0z"/></a>'
           b'<foreignObject><iframe src="https://example.com"></iframe></foreignObject>'
           b'<use href="https://example.com/x.svg#a"/><path d="M1 1h6v6H1z" onclick="alert(1)"/></svg>')
    headers = {"Content-Disposition": 'attachment; filename="probe.svg"', "Content-Type": "image/svg+xml"}
    r = people["author"].post("/wp-json/wp/v2/media", data=svg, headers=headers)
    if r.status_code in (200, 201):
        made.append(r.json()["id"])
    res.add("uploads", "an author cannot upload an SVG", r.status_code >= 400, f"answered {r.status_code}", "high",
            "SVG only for those who may change the design.")
    r = people["admin"].post("/wp-json/wp/v2/media", data=svg, headers=headers)
    if r.status_code in (200, 201):
        made.append(r.json()["id"])
        kept = requests.get(r.json()["source_url"], timeout=60).text
        bad = [w for w in ("<script", "onload", "onclick", "javascript:", "foreignobject", "https://example.com")
               if w in kept.lower()]
        res.add("uploads", "an administrator's SVG is cleaned to its shapes", not bad, ", ".join(bad), "high",
                "harlow_icon() must take these out.")
    else:
        res.add("uploads", "an administrator's SVG is cleaned to its shapes (refused instead)", r.status_code < 500,
                f"answered {r.status_code} {r.text[:100]}", "low")
    php = b"<?php echo 'ran'; ?>"
    r = people["admin"].post("/wp-json/wp/v2/media", data=php,
                             headers={"Content-Disposition": 'attachment; filename="probe.php.png"', "Content-Type": "image/png"})
    stored = r.status_code in (200, 201)
    if stored:
        made.append(r.json()["id"])
    res.add("uploads", "a PHP file named as a picture is refused", not stored, f"answered {r.status_code}", "high", "")


def form_page(admin, made):
    fields = [{"id": "name", "type": "text", "label": "Name", "required": True, "width": "100"},
              {"id": "email", "type": "email", "label": "Email", "required": True, "width": "100"},
              {"id": "file", "type": "upload", "label": "File", "required": False, "width": "100",
               "fileTypes": "pdf", "fileSize": "1"}]
    block = {"element": "a0f0f0f", "classes": "elementor-element elementor-widget elementor-widget-form",
             "formName": "Probe", "fields": fields, "actions": ["collect"], "honeypot": True}
    content = ('<!-- wp:harlow/document --><!-- wp:harlow/container {"element":"a0f0f0e","classes":"elementor-element e-flex e-con-boxed e-con e-parent","boxed":true} -->'
               f'<!-- wp:harlow/form {json.dumps(block)} /--><!-- /wp:harlow/container --><!-- /wp:harlow/document -->')
    r = admin.post("/wp-json/wp/v2/pages", json={"title": "Form probe", "status": "publish", "content": content})
    page = r.json()
    made.append(page["id"])
    html = requests.get(page["link"], timeout=120).text
    nonce = re.search(r'name="harlow_form_nonce" value="([^"]+)"', html)
    return page, nonce.group(1) if nonce else ""


def sec_form(res, people, made):
    admin = people["admin"]
    page, nonce = form_page(admin, made)
    if not nonce:
        res.add("form", "the probe form prints its nonce", False, "no harlow_form_nonce in the page", "medium")
        return
    # harlow_js: the page's script sends it, and the route then answers with its status code
    base = {"post_id": page["id"], "form_id": "a0f0f0f", "harlow_form_nonce": nonce, "harlow_js": "1",
            "form_fields[name]": "Probe", "form_fields[email]": "probe@example.com"}
    visitor = people["visitor"]

    def send(extra=None, drop=(), files=None):
        data = {k: v for k, v in base.items() if k not in drop}
        data.update(extra or {})
        return visitor.post("/wp-json/harlow/v1/form", data=data, files=files)

    r = send(drop=("harlow_form_nonce",))
    res.add("form", "a sending without its nonce is refused", r.status_code in (400, 403), f"{r.status_code}", "medium")
    r = send({"harlow_website": "http://spam.example"})
    res.add("form", "a filled honeypot is refused", r.status_code == 400, f"{r.status_code}", "low")
    r = send({"form_fields[email]": "probe@example.com\r\nBcc: victim@example.com"})
    res.add("form", "a header in the e-mail field is refused", r.status_code == 400, f"{r.status_code}", "high",
            "Validate the e-mail with is_email() and never put a field in a mail header unchecked.")
    r = send(files={"form_fields[file]": ("probe.php", b"<?php echo 1; ?>", "application/pdf")})
    res.add("form", "a PHP file sent as a PDF is refused", r.status_code in (400, 500) and "probe.php" not in r.text,
            f"{r.status_code}", "high", "Check the file's real type and extension against the field's types.")
    r = send({"form_fields[name]": f'=HYPERLINK("http://x")<script>window.{MARK}=1</script>'})
    stored_ok = r.status_code in (200, 201)
    res.add("form", "a sending with a script in a field is accepted (it is data)", stored_ok, f"{r.status_code} {r.text[:120]}", "info")
    lst = admin.get("/wp-admin/edit.php?post_type=harlow_submission").text
    res.add("form", "Submissions shows the script escaped", not printed_payloads(lst) and f"<script>window.{MARK}" not in lst,
            "", "high", "Escape every field where Submissions prints it.")
    link = re.search(r'href="([^"]*action=harlow_submissions_export[^"]*)"', lst)
    if link:
        csv = admin.get(link.group(1).replace("&amp;", "&"))
        text = csv.text
        defused = "'=HYPERLINK" in text or '"\'=HYPERLINK' in text or "=HYPERLINK" not in text
        res.add("form", "the CSV defuses a formula (a cell starting with =, +, - or @)", defused, text[:120], "medium",
                "Prefix such cells with an apostrophe.")
    else:
        res.add("form", "Submissions offers the CSV", False, "no export link", "info")
    codes = [send().status_code for _ in range(12)]
    res.add("form", "sending again and again is slowed down (429)", 429 in codes, f"{codes}", "low")
    wp_cli("eval", "global $wpdb; $wpdb->query( \"DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient%harlow_form_rate_%'\" );")


def sec_roles(res, people, made):
    admin = people["admin"]
    content = ('<!-- wp:harlow/document --><!-- wp:harlow/container {"element":"a0e0e0e","classes":"elementor-element e-flex e-con-boxed e-con e-parent","boxed":true} -->'
               '<!-- wp:harlow/heading {"element":"a0e0e0f","classes":"elementor-element elementor-widget elementor-widget-heading","text":"Role probe"} /-->'
               '<!-- /wp:harlow/container --><!-- /wp:harlow/document -->')
    page = admin.post("/wp-json/wp/v2/pages", json={"title": "Role probe", "status": "publish", "content": content}).json()
    made.append(page["id"])
    ps_php("tools-set", {"tools": {"content_only": ["editor"], "mode": "", "page": 0, "who": "logged_in", "roles": []}})
    styled = content.replace('"text":"Role probe"}', '"text":"Role probe changed","style":{"desktop":{"color":"#ff0000"}}}')
    r = people["content"].post(f"/wp-json/wp/v2/pages/{page['id']}", json={"content": styled})
    saved = admin.get(f"/wp-json/wp/v2/pages/{page['id']}?context=edit").json()["content"]["raw"]
    res.add("roles", "an editor of the words and pictures only can change the words", "Role probe changed" in saved,
            f"{r.status_code}", "medium")
    res.add("roles", "an editor of the words and pictures only cannot change an element's style (REST API)",
            "#ff0000" not in saved, "the style was saved", "medium",
            "Keep the design attributes of a content-only editor's saves as they were (on the server).")


def sec_maintenance(res, people):
    home_id = int(wp_cli("option", "get", "page_on_front"))
    about = int(wp_cli("post", "list", "--post_type=page", "--name=about-us", "--field=ID"))
    ps_php("tools-set", {"tools": {"content_only": [], "mode": "maintenance", "page": about, "who": "logged_in", "roles": []}})
    try:
        v = people["visitor"]
        r = v.get("/")
        res.add("maintenance", "a visitor gets 503 (maintenance)", r.status_code == 503, f"{r.status_code}", "medium")
        r = v.get(f"/wp-json/wp/v2/pages/{home_id}")
        leaked = r.status_code == 200 and "content" in r.text
        res.add("maintenance", "a visitor reads no page through the REST API", not leaked, f"{r.status_code}", "low",
                "In maintenance, answer the REST API's content routes for visitors with 503 too.")
        r = v.get("/feed/")
        res.add("maintenance", "a visitor reads no feed", r.status_code != 200 or "<item>" not in r.text, f"{r.status_code}", "low", "")
        r = v.get("/sitemap_index.xml")
        res.add("maintenance", "a visitor reads no sitemap", r.status_code != 200, f"{r.status_code}", "low", "")
    finally:
        ps_php("tools-set", {"tools": {"content_only": [], "mode": "", "page": 0, "who": "logged_in", "roles": []}})


def sec_disclosure(res, people):
    v = people["visitor"]
    home = v.get("/").text
    gen = re.search(r'<meta name="generator" content="WordPress[^"]*"', home)
    res.add("disclosure", "the pages do not name WordPress's version", not gen, gen.group(0) if gen else "", "low",
            "remove_action( 'wp_head', 'wp_generator' ).")
    r = v.get("/wp-json/wp/v2/users")
    users = r.status_code == 200 and r.text.strip().startswith("[") and len(json.loads(r.text)) > 0
    res.add("disclosure", "a visitor cannot list the site's users (REST)", not users,
            f"{len(json.loads(r.text)) if users else 0} users listed", "medium",
            "Answer /wp/v2/users for visitors with nothing (rest_endpoints).")
    r = v.post("/xmlrpc.php", data="<?xml version=\"1.0\"?><methodCall><methodName>system.listMethods</methodName></methodCall>",
               headers={"Content-Type": "text/xml"})
    methods = len(re.findall(r"<string>", r.text))
    res.add("disclosure", "XML-RPC is refused (no password guessing many at once)", r.status_code in (403, 405) or methods == 0,
            f"{methods} methods listed", "medium", "xmlrpc_methods: an empty list.")
    for path, what in (("/readme.html", "WordPress's readme"), ("/wp-content/debug.log", "the debug log")):
        r = v.get(path)
        res.add("disclosure", f"{what} is not readable", r.status_code != 200, f"{r.status_code}",
                "host", "The host's server answers it with 403 or 404 (stage 12); WP_DEBUG_LOG off on live.")
    for path in ("/wp-content/uploads/", "/wp-content/themes/harlow/", "/wp-content/themes/harlow/assets/"):
        r = v.get(path)
        listing = r.status_code == 200 and "Index of" in r.text
        res.add("disclosure", f"{path} is not listed", not listing, "a folder listing", "host",
                "The host's server: no folder listings (Options -Indexes).")
    bad = []
    for f in sorted(THEME.rglob("*.php")):
        if "build" in f.parts or "vendor" in f.parts:
            continue
        rel = f.relative_to(THEME).as_posix()
        r = v.get(f"/wp-content/themes/harlow/{rel}")
        if re.search(r"(Fatal error|Warning:|Notice:|/var/www|Stack trace)", r.text):
            bad.append(rel)
    res.add("disclosure", "no theme PHP file opened directly shows an error or a path", not bad,
            ", ".join(bad[:6]), "low", "Start every file with the ABSPATH guard.")


def sec_recursion(res, people, made):
    admin = people["admin"]
    content = ('<!-- wp:harlow/post-content {"element":"a0d0d0d","classes":"elementor-element elementor-widget elementor-widget-theme-post-content"} /-->'
               '<!-- wp:harlow/posts {"element":"a0d0d0e","classes":"elementor-element elementor-widget elementor-widget-posts","skin":"full_content","postType":"harlow_template"} /-->')
    ids = []
    for kind in ("single", "archive", "header", "footer", "popup", "loop-item"):
        r = admin.post("/wp-json/wp/v2/harlow_template", json={"title": f"Recursion {kind}", "status": "publish", "content": content,
                                                                "meta": {"_harlow_template_kind": kind}})
        if r.status_code in (200, 201):
            ids.append(r.json()["id"])
            made.append(r.json()["id"])
    r = admin.get("/wp-json/wp/v2/harlow_template?context=edit")
    res.add("recursion", "the editor's list of Theme Builder templates answers with templates holding the item's text",
            r.status_code == 200, f"{r.status_code}", "high", "Never print a text inside itself (harlow_text_printing()).")
    ok = all(admin.get(f"/wp-json/wp/v2/harlow_template/{i}?context=edit").status_code == 200 for i in ids)
    res.add("recursion", "each such template answers on its own (REST)", ok, "", "high", "")
    r = admin.post("/wp-json/wp/v2/posts", json={"title": "Recursion post", "status": "publish", "content": content})
    if r.status_code in (200, 201):
        made.append(r.json()["id"])
        page = requests.get(r.json()["link"], timeout=120)
        res.add("recursion", "a post holding its own text and a list of whole texts is printed", page.status_code == 200,
                f"{page.status_code}", "high", "")


def sec_secrets(res):
    files = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout.split("\n")
    patterns = {
        "a private key": r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----",
        "an AWS key": r"AKIA[0-9A-Z]{16}",
        "a GitHub token": r"gh[pousr]_[A-Za-z0-9]{30,}",
        "an API key (sk-)": r"\bsk-[A-Za-z0-9]{32,}",
        "a Slack token": r"xox[abpr]-[A-Za-z0-9-]{10,}",
        "a password written out": r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"][^'\"$\s]{6,}['\"]",
    }
    hits = []
    for f in files:
        p = ROOT / f
        if not f or not p.is_file() or p.stat().st_size > 2_000_000 or p.suffix.lower() in (
                ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".woff", ".woff2", ".ttf", ".ico", ".pdf", ".svg"):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for what, pat in patterns.items():
            for m in re.finditer(pat, text):
                if "wp_generate_password" in text[max(0, m.start() - 80):m.end()]:
                    continue
                hits.append(f"{what} in {f}")
    res.add("secrets", f"no password, key or token in the repository's {len(files)} files", not hits,
            "; ".join(sorted(set(hits))[:6]), "high", "Take it out, and change it where it is used.")
    res.add("secrets", ".env is not in the repository", ".env" not in files, "", "high", "")


def sec_deps(res):
    r = subprocess.run("npm audit --omit=dev --json", cwd=ROOT, shell=True, capture_output=True, text=True, encoding="utf-8")
    try:
        meta = json.loads(r.stdout).get("metadata", {}).get("vulnerabilities", {})
    except ValueError:
        meta = {}
    serious = meta.get("high", 0) + meta.get("critical", 0)
    res.add("deps", "no high or critical advisory in the packages the theme ships (npm audit --omit=dev)", serious == 0,
            json.dumps(meta), "medium", "Update the package.")


def debug_log():
    """WordPress's debug log as it is now (WP_DEBUG_LOG writes every PHP notice, warning and error)."""
    return wp_cli("eval", "$f = WP_CONTENT_DIR . '/debug.log'; echo file_exists( $f ) ? file_get_contents( $f ) : '';")


def part_security():
    res = Results()
    made = []
    before = snapshot()
    log_before = debug_log()
    try:
        users = ps_php("users")["users"]
        people = {"visitor": Session(), "admin": Session(admin_cookies()), "admin-no-nonce": Session(admin_cookies(), nonce=False),
                  "made": made}
        for role, info in users.items():
            people[role] = Session(info["cookies"])
        sec_code(res)
        actions = sec_rest(res, people)
        sec_actions(res, people, actions)
        sec_screens(res, people)
        post = sec_stored_xss(res, people, made)
        sec_author(res, people, post)
        sec_uploads(res, people, made)
        sec_form(res, people, made)
        sec_roles(res, people, made)
        sec_maintenance(res, people)
        sec_disclosure(res, people)
        sec_recursion(res, people, made)
        sec_secrets(res)
        sec_deps(res)
    finally:
        ps_php("back", {"delete": made})
    # every test above is something a visitor, an author or the owner may do: none may leave a PHP warning
    log_after = debug_log()
    written = log_after[len(log_before):] if log_after.startswith(log_before) else log_after
    lines = [line for line in written.splitlines() if line.strip()]
    res.add("errors", "no PHP notice, warning or error written while the tests ran", not lines,
            f"{len(lines)} lines: " + " | ".join(sorted({line.split('] ', 1)[-1][:120] for line in lines}))[:400], "medium",
            "Each is a bug a visitor or the owner would also cause.")
    after = snapshot()
    same = sum(before[n] == after[n] for n in before)
    return res, f"{same} of {len(before)} pages byte for byte as before"


# ---------------------------------------------------------------- performance

METRICS = re.compile(r"<!-- harlow-metrics queries=(\d+) time=([\d.]+) memory=([\d.]+) -->")
BUDGET = {"cls": 0.1, "tbt_ms": 300, "dom": 3000, "queries": 150, "ttfb_ms": 800, "memory_mb": 96}

COLLECT = r"""
async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await wait(80); }
  window.scrollTo(0, 0); await wait(400);
  const res = performance.getEntriesByType('resource');
  const nav = performance.getEntriesByType('navigation')[0];
  const by = {};
  for (const r of res) { const k = r.initiatorType === 'img' || /\.(png|jpe?g|webp|gif|svg)(\?|$)/.test(r.name) ? 'image'
      : /\.css(\?|$)/.test(r.name) || r.initiatorType === 'link' ? 'css' : /\.js(\?|$)/.test(r.name) ? 'js'
      : /\.(woff2?|ttf|otf)(\?|$)/.test(r.name) ? 'font' : /\.(mp4|webm)(\?|$)/.test(r.name) ? 'video' : 'other';
    by[k] = by[k] || { n: 0, bytes: 0 }; by[k].n++; by[k].bytes += r.transferSize || r.encodedBodySize || 0; }
  const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth);
  const unsized = [...document.images].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).map((i) => (i.getAttribute('src') || '').split('/').pop()).slice(0, 20);
  const oversized = imgs.filter((i) => { const r = i.getBoundingClientRect(); return r.width > 0 && i.naturalWidth > 2.2 * r.width * devicePixelRatio && i.naturalWidth > 600; })
    .map((i) => `${(i.currentSrc || '').split('/').pop()} ${i.naturalWidth}px for ${Math.round(i.getBoundingClientRect().width)}px`).slice(0, 20);
  return { lcp: window.__lcp || 0, cls: window.__cls || 0, tbt: window.__tbt || 0, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0,
           ttfb: nav ? nav.responseStart : 0, load: nav ? nav.loadEventEnd : 0, html: nav ? (nav.transferSize || nav.encodedBodySize) : 0,
           by, requests: res.length + 1, dom: document.getElementsByTagName('*').length, unsized, oversized };
}
"""

OBSERVE = r"""
window.__lcp = 0; window.__cls = 0; window.__tbt = 0;
new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
"""


async def measure(browser, url, phone):
    ctx = await browser.new_context(viewport={"width": 479, "height": 900} if phone else {"width": 1440, "height": 900},
                                    device_scale_factor=2 if phone else 1, is_mobile=phone)
    await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
    await ctx.add_init_script(OBSERVE)
    page = await ctx.new_page()
    errors, failed = [], []
    page.on("pageerror", lambda e: errors.append(str(e)[:160]))
    page.on("response", lambda r: failed.append(f"{r.status} {r.url.split('/')[-1][:60]}") if r.status >= 400 else None)
    cdp = await ctx.new_cdp_session(page)
    if phone:
        await cdp.send("Network.enable")
        await cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 150,
                                                            "downloadThroughput": 1.6 * 1024 * 1024 / 8,
                                                            "uploadThroughput": 750 * 1024 / 8})
        await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    await page.goto(url, wait_until="load", timeout=240000)
    await page.wait_for_timeout(2500)
    data = await page.evaluate(COLLECT)
    data["errors"], data["failed"] = errors, failed
    await ctx.close()
    return data


def server_costs(path):
    times, last = [], None
    for _ in range(3):
        t = time.perf_counter()
        r = requests.get(WP + path, headers={"X-Harlow-Metrics": "1"}, timeout=120, stream=True)
        first = time.perf_counter() - t
        body = r.text
        times.append(first * 1000)
        last = METRICS.search(body)
    q, t_php, mem = (int(last.group(1)), float(last.group(2)), float(last.group(3))) if last else (0, 0.0, 0.0)
    return {"ttfb_ms": statistics.median(times), "queries": q, "php_ms": t_php, "memory_mb": mem}


def part_performance(only=None):
    rows, problems = [], []
    todo = [p for p in pages() if not only or p["name"] in only]

    async def run():
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(channel="chrome")
            for p in todo:
                path = wp_path(p)
                row = {"page": p["name"], "server": server_costs(path)}
                for profile, phone in (("phone", True), ("desktop", False)):
                    wp = await measure(browser, WP + path, phone)
                    ref = await measure(browser, f"{WP}/static/{p['name']}.html", phone)
                    row[profile] = {"wp": wp, "ref": ref}
                rows.append(row)
                judge(row, problems)
                ph = row["phone"]["wp"]
                print(f"  {p['name'][:36]:36} phone LCP {ph['lcp']/1000:.2f}s (ref {row['phone']['ref']['lcp']/1000:.2f}s)"
                      f" CLS {ph['cls']:.3f} TBT {ph['tbt']:.0f}ms {sum(v['bytes'] for v in ph['by'].values())/1e6:.2f}MB"
                      f" {ph['requests']} req; server {row['server']['ttfb_ms']:.0f}ms {row['server']['queries']} q", flush=True)
            # the editor: the home page until its blocks and canvas are drawn
            from verify_editor import open_editor  # noqa: E402
            ids = json.loads(wp_cli("eval", "echo wp_json_encode( harlow_named_posts() );"))
            times = []
            for _ in range(3):
                t = time.perf_counter()
                ctx, page, frame, errors = await open_editor(browser, ids["index"], 1440, settle=False)
                times.append(time.perf_counter() - t)
                await ctx.close()
            await browser.close()
            return statistics.median(times)

    editor_s = asyncio.run(run())
    bundle = (THEME / "build" / "index.js").stat().st_size
    return rows, problems, editor_s, bundle


def judge(row, problems):
    name = row["page"]
    s = row["server"]
    for key in ("queries", "ttfb_ms", "memory_mb"):
        if s[key] > BUDGET[key]:
            problems.append(f"{name}: server {key} {s[key]:.0f} over {BUDGET[key]}")
    for profile in ("phone", "desktop"):
        wp, ref = row[profile]["wp"], row[profile]["ref"]
        if wp["cls"] > BUDGET["cls"] and wp["cls"] > ref["cls"] + 0.02:
            problems.append(f"{name} {profile}: CLS {wp['cls']:.3f} (reference {ref['cls']:.3f})")
        if wp["tbt"] > BUDGET["tbt_ms"] and wp["tbt"] > ref["tbt"] * 1.25 + 50:
            problems.append(f"{name} {profile}: total blocking time {wp['tbt']:.0f}ms (reference {ref['tbt']:.0f}ms)")
        if wp["lcp"] > ref["lcp"] * 1.15 + 300:
            problems.append(f"{name} {profile}: LCP {wp['lcp']/1000:.2f}s, reference {ref['lcp']/1000:.2f}s")
        wb, rb = sum(v["bytes"] for v in wp["by"].values()), sum(v["bytes"] for v in ref["by"].values())
        if wb > rb * 1.10 + 60_000:
            problems.append(f"{name} {profile}: {wb/1e6:.2f}MB against the reference's {rb/1e6:.2f}MB")
        if wp["dom"] > BUDGET["dom"]:
            problems.append(f"{name} {profile}: {wp['dom']} DOM elements")
        if wp["failed"]:
            problems.append(f"{name} {profile}: failed requests {wp['failed'][:3]}")
        if wp["errors"]:
            problems.append(f"{name} {profile}: script errors {wp['errors'][:2]}")


# ---------------------------------------------------------------- report

def report(sec, perf, same):
    lines = ["# Security and performance", ""]
    out = {}
    if sec:
        rows = sec.rows
        failed = [r for r in rows if not r["ok"]]
        out["security"] = rows
        lines += ["## Security", "", f"{len(rows)} tests, {len(rows) - len(failed)} passed, {len(failed)} failed.", "",
                  "| area | test | result | severity | what to do |", "|---|---|---|---|---|"]
        for r in rows:
            lines.append(f"| {r['area']} | {r['test']} | {'pass' if r['ok'] else 'FAIL: ' + r['detail'][:160]} | {r['severity']} | {r['fix']} |")
        lines.append("")
    if perf:
        rows, problems, editor_s, bundle = perf
        out["performance"] = {"rows": rows, "problems": problems, "editor_s": editor_s, "bundle": bundle}
        lines += ["## Performance", "", f"Budgets: {BUDGET}. Phone: 479x900, slow 4G (150 ms, 1.6 Mbit/s), processor 4x slower.", "",
                  "| page | phone LCP (ref) | phone CLS | phone TBT | phone MB (ref) | requests | desktop LCP (ref) | TTFB | queries | PHP ms | memory MB | unsized pictures | oversized pictures |",
                  "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
        for r in rows:
            ph, dk, s = r["phone"], r["desktop"], r["server"]
            mb = lambda d: sum(v["bytes"] for v in d["by"].values()) / 1e6  # noqa: E731
            lines.append(f"| {r['page']} | {ph['wp']['lcp']/1000:.2f}s ({ph['ref']['lcp']/1000:.2f}s) | {ph['wp']['cls']:.3f} | {ph['wp']['tbt']:.0f}ms"
                         f" | {mb(ph['wp']):.2f} ({mb(ph['ref']):.2f}) | {ph['wp']['requests']} | {dk['wp']['lcp']/1000:.2f}s ({dk['ref']['lcp']/1000:.2f}s)"
                         f" | {s['ttfb_ms']:.0f}ms | {s['queries']} | {s['php_ms']:.0f} | {s['memory_mb']:.1f} | {len(ph['wp']['unsized'])} | {len(ph['wp']['oversized'])} |")
        lines += ["", f"Editor: the home page drawn in {editor_s:.1f}s; bundle {bundle/1024:.0f} KB.", "",
                  "Over budget:" if problems else "Nothing over budget.", ""] + [f"- {p}" for p in problems]
    if same:
        lines += ["", same]
    (ROOT / "_capture" / "perf_security.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (ROOT / "_capture" / "perf_security.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--part", choices=["security", "performance", "all"], default="all")
    ap.add_argument("pages", nargs="*")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    sec = perf = None
    same = ""
    said = []
    if args.part in ("security", "all"):
        print("security:", flush=True)
        sec, same = part_security()
        failed = [r for r in sec.rows if not r["ok"]]
        sev = {s: sum(r["severity"] == s for r in failed) for s in ("high", "medium", "low", "info", "host")}
        said.append(f"security: {len(sec.rows)} tests, {len(sec.rows) - len(failed)} passed"
                    f" ({', '.join(f'{v} {k}' for k, v in sev.items() if v) or 'no finding'})")
    if args.part in ("performance", "all"):
        print("performance:", flush=True)
        perf = part_performance(set(args.pages) or None)
        rows, problems, editor_s, bundle = perf
        said.append(f"performance: {len(rows)} pages x 2 profiles against the reference, {len(problems)} over budget;"
                    f" editor {editor_s:.1f}s, bundle {bundle/1024:.0f} KB")
    report(sec, perf, same)
    if same:
        said.append(same)
    print("\n" + "; ".join(said))
    bad = (sec and any(not r["ok"] and r["severity"] not in ("info", "host") for r in sec.rows)) or (perf and perf[1]) \
        or (same and not same.startswith(f"{len(pages())} of"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
