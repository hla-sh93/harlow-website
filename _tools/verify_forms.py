"""Stage 5 check: the forms work as live's do.

The two forms (contact, on the Contact page; job application, on the job's page) are
Contact Form 7's, laid down by the installer from theme/install/forms.json. Their look at
rest is held against the reference by verify_wp.py (markup) and verify_render.py (every
computed property and box at 1440, 900 and 479). This drives them in Chrome:

* refused when wrong: sent empty, every required field shows CF7's message under it (in
  CF7's red, its stylesheet loaded), the form says it has errors, and no mail leaves;
* delivered: filled with test values (the job application with a small PDF as the CV), the
  form thanks the sender, and the mail is in Mailpit (http://localhost:8035), addressed to
  the site's administration address, answering to the sender (Reply-To), with the fields in
  it, the job's title in the application, and the CV attached.

    python -u _tools/verify_forms.py

Passing looks like: `forms: 2 forms, 4 sendings - 0 failed`.
"""

import asyncio
import sys
import time

import requests
from playwright.async_api import async_playwright

from capture import SETTLE
from common import HEIGHT, ROOT
from wpsite import WP, wp_cli

MAILPIT = "http://localhost:8035/api/v1"
TIP_RED = "rgb(220, 50, 50)"   # CF7's .wpcf7-not-valid-tip

FORMS = [
    {"name": "contact", "path": "/contact-us/", "required": 5,
     "fill": {"your-name": "Form Check", "mobile-phone": "+964 700 000 0000", "your-email": "form-check@localhost.test",
              "your-subject": "Contact check {stamp}", "your-message": "A message from the form check {stamp}."},
     "subject": "Contact check {stamp}", "body": ["A message from the form check {stamp}.", "+964 700 000 0000"]},
    {"name": "job application", "path": "/job/marketing-coordinator/", "required": 4,
     "fill": {"your-name": "Form Check {stamp}", "your-email": "form-check@localhost.test",
              "mobile-phone": "+964 700 000 0001"},
     "file": "resume",
     "subject": "Job application: Marketing Coordinator", "body": ["Form Check {stamp}", "Marketing Coordinator"]},
]

PDF = (b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
       b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n")


def mails():
    return requests.get(f"{MAILPIT}/messages", params={"limit": 200}, timeout=30).json().get("messages", [])


async def open_form(browser, path):
    ctx = await browser.new_context(viewport={"width": 1440, "height": HEIGHT})
    await ctx.add_init_script("try{localStorage.setItem('harlow-cookie-consent','all')}catch(e){}")
    page = await ctx.new_page()
    await page.goto(WP + path, wait_until="load", timeout=120000)
    await page.evaluate(SETTLE)
    await page.wait_for_function("() => window.wpcf7 && document.querySelector('.wpcf7 .wpcf7-spinner')", timeout=30000)
    return ctx, page


async def send(page):
    await page.click(".wpcf7 input[type=submit]")
    await page.wait_for_function("() => ['invalid', 'sent', 'failed', 'aborted', 'spam']"
                                 ".includes(document.querySelector('.wpcf7 form').dataset.status)", timeout=60000)
    return await page.evaluate("""() => {
      const form = document.querySelector('.wpcf7 form');
      const tips = [...form.querySelectorAll('.wpcf7-not-valid-tip')];
      const out = form.querySelector('.wpcf7-response-output');
      return { status: form.dataset.status, tips: tips.length,
               colours: [...new Set(tips.map((t) => getComputedStyle(t).color))],
               message: out.textContent.trim(), shown: getComputedStyle(out).display !== 'none' };
    }""")


async def run():
    problems, sendings = [], 0
    stamp = time.strftime("%H%M%S")
    upload = ROOT / "_env" / "form-check-cv.pdf"
    upload.parent.mkdir(exist_ok=True)
    upload.write_bytes(PDF)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="chrome")
        for form in FORMS:
            label = form["name"]
            # refused when wrong
            before = {m["ID"] for m in mails()}
            ctx, page = await open_form(browser, form["path"])
            r = await send(page)
            sendings += 1
            if r["status"] != "invalid" or r["tips"] != form["required"] or r["colours"] != [TIP_RED] or not r["shown"]:
                problems.append(f"{label}, sent empty: {r} (expected invalid, {form['required']} messages in CF7's red)")
            await ctx.close()
            time.sleep(2)
            if {m["ID"] for m in mails()} - before:
                problems.append(f"{label}, sent empty: a mail left")
            print(f"  {label}, sent empty: {r['status']}, {r['tips']} messages, '{r['message'][:60]}'", flush=True)

            # delivered
            before = {m["ID"] for m in mails()}
            ctx, page = await open_form(browser, form["path"])
            for field, value in form["fill"].items():
                await page.fill(f".wpcf7 [name='{field}']", value.format(stamp=stamp))
            if form.get("file"):
                await page.set_input_files(f".wpcf7 [name='{form['file']}']", str(upload))
            r = await send(page)
            sendings += 1
            await ctx.close()
            if r["status"] != "sent":
                problems.append(f"{label}, filled: {r}")
                continue
            new = []
            for _ in range(20):
                new = [m for m in mails() if m["ID"] not in before]
                if new:
                    break
                time.sleep(1)
            if len(new) != 1:
                problems.append(f"{label}, filled: {len(new)} mails in Mailpit")
                continue
            m = requests.get(f"{MAILPIT}/message/{new[0]['ID']}", timeout=30).json()
            admin = wp_cli("option", "get", "admin_email")
            to = [a["Address"] for a in m.get("To", [])]
            reply = [a["Address"] for a in m.get("ReplyTo", [])]
            files = [a.get("FileName") for a in m.get("Attachments", [])]
            want_subject = form["subject"].format(stamp=stamp)
            missing = [w for w in (s.format(stamp=stamp) for s in form["body"]) if w not in m.get("Text", "")]
            if to != [admin]:
                problems.append(f"{label}: mail to {to}, not {admin}")
            if reply != ["form-check@localhost.test"]:
                problems.append(f"{label}: Reply-To {reply}")
            if want_subject not in m.get("Subject", ""):
                problems.append(f"{label}: subject {m.get('Subject')!r}")
            if missing:
                problems.append(f"{label}: not in the mail: {missing}")
            if form.get("file") and files != [upload.name]:
                problems.append(f"{label}: attachments {files}")
            print(f"  {label}, filled: sent; mail to {to}, Reply-To {reply}, subject {m.get('Subject')!r}"
                  + (f", attached {files}" if files else ""), flush=True)
        await browser.close()
    upload.unlink()
    return problems, sendings


def main():
    problems, sendings = asyncio.run(run())
    for p in problems:
        print("  FAIL", p)
    print(f"\nforms: {len(FORMS)} forms, {sendings} sendings - {len(problems)} failed")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
