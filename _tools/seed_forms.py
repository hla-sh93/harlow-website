"""Stage 5: live's two forms as data for the theme's installer (theme/install/forms.json).

Live's forms are Contact Form 7 forms: the contact form (id 3453, on the Contact page) and
the job application (id 4176, on every job's page, with the job's title in a hidden field
of the Dynamic Text Extension). What CF7 prints comes from a form's template; live's
templates are not public, so each is written here as the template that prints what the
reference shows (verify_wp.py holds the printed form against the reference, element by
element).

Live also prints Cloudflare Turnstile's widget in each form; Turnstile needs live's keys
and comes with the live step (README, "Deliberate differences"). Its empty slot keeps the
form's layout: the slot is the reference's own markup, which the theme puts where the
Turnstile plugin puts its widget (theme/functions/forms.php).

The mails go to the site's administration address, answer to the sender (Reply-To), and
the job application carries the CV.

    python -u _tools/seed_forms.py
"""

import json
import re
import sys

from lxml import html

from common import ROOT

OUT = ROOT / "theme" / "install" / "forms.json"

FORMS = [
    {
        "id": 3453,
        "title": "Contact",
        "page": "contact-us",
        "template": (
            '<label> Name\n    [text* your-name autocomplete:name placeholder "Name"] </label>\n\n'
            '<label> Mobile\n    [tel* mobile-phone placeholder "Mobile"]</label>\n\n'
            '<label> Email\n    [email* your-email autocomplete:email placeholder "Email"] </label>\n\n'
            '<label> Subject\n    [text* your-subject placeholder "Subject"] </label>\n\n'
            '<label> Message\n    [textarea* your-message placeholder "Message"] </label>\n\n'
            '[submit "Submit"]'
        ),
        "mail": {
            "subject": '[_site_title] "[your-subject]"',
            "sender": "[_site_title] <wordpress@[_site_domain]>",
            "recipient": "[_site_admin_email]",
            "body": ("From: [your-name] <[your-email]>\nMobile: [mobile-phone]\nSubject: [your-subject]\n\n"
                     "Message Body:\n[your-message]\n\n-- \nThis is a notification that a contact form was "
                     "submitted on your website ([_site_title] [_site_url])."),
            "additional_headers": "Reply-To: [your-email]",
            "attachments": "",
        },
    },
    {
        "id": 4176,
        "title": "Job application",
        "page": "job-marketing-coordinator",
        "template": (
            "[dynamic_hidden job-title \"CF7_get_post_var key='title'\"]\n"
            '[text* your-name autocomplete:name placeholder "Name"]\n\n'
            '[email* your-email autocomplete:email placeholder "Email"]\n\n'
            '[tel* mobile-phone placeholder "Phone No"]\n\n'
            "<label>Attach CV (pdf, doc/docx; size less than 6MB) [file* resume limit:6mb filetypes:pdf|doc|docx]</label>\n\n"
            '[submit "Submit"]'
        ),
        "mail": {
            "subject": "[_site_title] Job application: [job-title]",
            "sender": "[_site_title] <wordpress@[_site_domain]>",
            "recipient": "[_site_admin_email]",
            "body": ("Job: [job-title]\nFrom: [your-name] <[your-email]>\nPhone: [mobile-phone]\n\n"
                     "The CV is attached.\n\n-- \nThis is a notification that a job application was "
                     "submitted on your website ([_site_title] [_site_url])."),
            "additional_headers": "Reply-To: [your-email]",
            "attachments": "[resume]",
        },
    },
]


def slot(page, form_id):
    """The Turnstile widget's slot as the reference prints it in that form."""
    doc = html.parse(str(ROOT / f"{page}.html"))
    found = doc.xpath(f"//div[@data-wpcf7-id='{form_id}']//div[contains(@class, 'cf7-cf-turnstile')]")
    if len(found) != 1:
        raise SystemExit(f"{page}: {len(found)} Turnstile slots in form {form_id}")
    markup = html.tostring(found[0], encoding="unicode", with_tail=False)
    return re.sub(r"\s+$", "", markup)


def main():
    out = []
    for form in FORMS:
        out.append(dict(form, slot=slot(form["page"], form["id"])))
    OUT.write_text(json.dumps({"forms": out}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(out)} forms -> theme/install/forms.json: " + ", ".join(f"{f['title']} ({f['id']})" for f in out))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
