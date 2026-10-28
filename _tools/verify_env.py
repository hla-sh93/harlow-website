"""Stage 0 check: the local WordPress is complete and every piece of it works.

Reads the running stack (docker compose), its pages over HTTP, WordPress itself through
WP-CLI, and Mailpit's API. A message is really sent through wp_mail() and found in the
inbox; the static reference and the theme's assets are compared byte for byte with the
files in this repository, which proves the mounts.

Usage:
    python -u _tools/verify_env.py

Passing looks like: `env: N checks, 0 failed`.
"""

import json
import os
import subprocess
import sys
import time
import uuid

import requests

from common import ROOT

WP = "http://localhost:8090"
PMA = "http://localhost:8091"
MAILPIT = "http://localhost:8035"
PLUGINS = {"contact-form-7/wp-contact-form-7.php", "seo-by-rank-math/rank-math.php"}
SERVICES = {"wordpress", "db", "mailpit", "phpmyadmin"}

results = []


def check(name, ok, detail=""):
    results.append(ok)
    print(f"  {'ok  ' if ok else 'FAIL'}  {name}{': ' + str(detail) if detail else ''}")


def compose(*args):
    env = dict(os.environ, MSYS_NO_PATHCONV="1")
    out = subprocess.run(["docker", "compose", *args], cwd=ROOT, capture_output=True, text=True, env=env)
    return out.returncode, out.stdout.strip(), out.stderr.strip()


def wp_eval(php):
    code, out, err = compose("--progress", "quiet", "--profile", "tools", "run", "--rm", "-T", "cli",
                             "wp", "eval", php)
    if code:
        raise RuntimeError(err[-400:] or out[-400:])
    return out


def get(url):
    try:
        return requests.get(url, timeout=30)
    except requests.RequestException as err:
        return err


def main():
    print("services")
    code, out, _ = compose("ps", "--format", "json")
    running = set()
    for line in out.splitlines():
        try:
            row = json.loads(line)
        except ValueError:
            continue
        if row.get("State") == "running":
            running.add(row.get("Service"))
    check("wordpress, db, mailpit and phpmyadmin running", SERVICES <= running, sorted(running))

    print("pages")
    r = get(WP + "/")
    check("home page answers 200 from the harlow theme",
          not isinstance(r, Exception) and r.status_code == 200 and 'id="harlow-stage-0"' in r.text,
          getattr(r, "status_code", r))
    r = get(WP + "/wp-login.php")
    check("login page answers 200", not isinstance(r, Exception) and r.status_code == 200, getattr(r, "status_code", r))
    for path, local in (("/static/index.html", "index.html"),
                        ("/static/about-us.html", "about-us.html"),
                        ("/wp-content/themes/harlow/assets/css/base.css", "assets/css/base.css"),
                        ("/wp-content/themes/harlow/style.css", "theme/style.css")):
        r = get(WP + path)
        same = not isinstance(r, Exception) and r.status_code == 200 and r.content == (ROOT / local).read_bytes()
        check(f"{path} is this repository's {local}, byte for byte", same, getattr(r, "status_code", r))
    r = get(PMA + "/")
    check("phpMyAdmin answers 200", not isinstance(r, Exception) and r.status_code == 200, getattr(r, "status_code", r))
    r = get(MAILPIT + "/api/v1/info")
    check("Mailpit answers 200", not isinstance(r, Exception) and r.status_code == 200, getattr(r, "status_code", r))

    print("WordPress")
    subject = f"harlow env check {uuid.uuid4().hex[:8]}"
    facts = json.loads(wp_eval(
        "echo wp_json_encode( array("
        " 'version' => get_bloginfo( 'version' ),"
        " 'theme' => get_stylesheet(),"
        " 'plugins' => (array) get_option( 'active_plugins' ),"
        " 'permalinks' => get_option( 'permalink_structure' ),"
        " 'timezone' => get_option( 'timezone_string' ),"
        " 'debug_log' => defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG,"
        " 'dev_mode' => wp_get_development_mode(),"
        " 'rank_math_skip' => (int) get_option( 'rank_math_registration_skip' ),"
        " 'posts' => (int) wp_count_posts( 'post' )->publish,"
        " 'pages' => (int) wp_count_posts( 'page' )->publish,"
        f" 'mail' => wp_mail( 'check@localhost.test', '{subject}', 'Sent by _tools/verify_env.py.' ),"
        " ) );"))
    check("WordPress 7.1, as on live", str(facts["version"]).startswith("7.1"), facts["version"])
    check("active theme is harlow", facts["theme"] == "harlow", facts["theme"])
    check("Contact Form 7 and Rank Math active", PLUGINS <= set(facts["plugins"]), facts["plugins"])
    check("permalinks /%postname%/, as on live", facts["permalinks"] == "/%postname%/", facts["permalinks"])
    check("timezone Asia/Baghdad", facts["timezone"] == "Asia/Baghdad", facts["timezone"])
    check("errors go to debug.log, development mode theme", facts["debug_log"] and facts["dev_mode"] == "theme",
          f"log {facts['debug_log']}, mode {facts['dev_mode']}")
    check("Rank Math first screen skipped", facts["rank_math_skip"] == 1, facts["rank_math_skip"])
    check("the site starts empty (no sample post or page)", facts["posts"] == 0 and facts["pages"] == 0,
          f"{facts['posts']} posts, {facts['pages']} pages")
    check("wp_mail() returns true", facts["mail"] is True, facts["mail"])

    found = False
    for _ in range(10):
        r = get(MAILPIT + "/api/v1/messages")
        if not isinstance(r, Exception) and r.ok:
            found = any(m.get("Subject") == subject for m in r.json().get("messages", []))
        if found:
            break
        time.sleep(1)
    check("the message arrived in Mailpit", found, subject)

    code, out, err = compose("exec", "-T", "wordpress", "php", "-r",
                             "echo ini_get('upload_max_filesize'), ' ', ini_get('post_max_size');")
    check("uploads up to 64 MB on the web server", out == "64M 64M", out or err)

    code, out, _ = compose("exec", "-T", "wordpress", "sh", "-c",
                           "test -s /var/www/html/wp-content/debug.log && tail -n 5 /var/www/html/wp-content/debug.log || true")
    check("no PHP errors in debug.log", out == "", out[-300:])

    failed = results.count(False)
    print(f"\nenv: {len(results)} checks, {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
