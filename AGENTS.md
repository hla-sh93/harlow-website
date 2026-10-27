# AGENTS.md: Harlow Group website

Working rules for anyone (person or tool) changing this repository.

## The project

| value | |
|---|---|
| `SITE_URL` | https://www.harlowgroup.com/ |
| `PROJECT_DIR` | `D:\abbas\هارلو\website` |
| `CLIENT` | Harlow Group |
| `PREFIX` | `harlow` (proposed; confirmed before phase 2) |

Two phases, each ending in a version that is kept:

1. **html site v1**: every public page of the live site as plain HTML with hand-written,
   readable CSS and JS, rendering identically to live at 1440x900 and 479x900, with
   complete content. It stays as the reference every later check measures against.
2. **The WordPress theme**: starts only after the whole HTML site is approved in words.

## Phase 1 rules

- HTML code only: `.html` pages, `assets/` (CSS, JS, images, fonts, uploads) and the
  checking tools in `_tools/`. No WordPress, no PHP, no theme folder, no Docker, no blocks.
- The source of truth is the live site.
- Correctness is measured, never eyeballed. Every claim comes with the command that proves
  it and its output. A check's pass sentence counts what it checked.
- Results are reported as a table with one row per page.
- Reference pages and their CSS/JS are not edited to make one page look right.
- No generated file is hand-edited: change the generator and run it again.
- No platform runtime (Elementor frontend, Swiper bundle from Elementor, jQuery for
  Elementor) is shipped.
- Live bugs are fixed on purpose and listed in README under "Deliberate differences".
- Code, comments, docs and commit messages are in English. Commits are authored by the
  repository owner only, with no tool or assistant named anywhere.
- The owner runs every `git push`.

## Stages

| stage | what | state |
|---|---|---|
| A | inventory (`_inventory/inventory.md`, `_inventory/urls.csv`) | in review |
| B | capture: raw HTML, settled DOM, assets, geometry baseline | not started |
| C | design system and behaviour | not started |
| D | home page + one page of each kind by hand | not started |
| E | generate the rest | not started |
| F | checks | not started |
| G | docs, tag `html-v1` | not started |

## Tools

| tool | what it does | passing looks like |
|---|---|---|
| `_tools/inventory.py <raw_dir>` | crawls sitemaps, REST API (en + ar) and every internal link; records status, redirects and structure in `_inventory/pages.json` | `N urls known, N fetched, M answered 200` |
| `_tools/inventory_report.py` | writes `_inventory/urls.csv` (one row per URL, with its kind K1–K11 and the proposed clone decision) and prints kind, status and section-archetype tables | `175 urls in urls.csv` … `pages with a kind: 98, without: 0` |

## Hazards met on this project

| hazard | how it was caught |
|---|---|
| The site is bilingual (WPML, English + Arabic RTL). Each language has its own header and footer template, and Arabic slugs are percent-encoded. | WPML `generator` meta; Arabic home renders `header#6606` / `footer#7508` against English `header#1179` / `footer#1066`. |
| Three custom post types have public REST entries whose single pages 301 to the home page (`team_member`, `harlows_person`, `business_model`). They are data for loops, not pages. | `curl -I` on each single URL. |
| Console error `Uncaught SyntaxError: Unexpected identifier 'wpdaOrgChartPopup'` (Organization Chart plugin) seen once in the in-app browser, not reproduced headless. | Browser console on the home page; headless probe of 15 pages × 2 widths. |
| Some internal links carry `?utm_source=chatgpt.com`; keyed naively, one page is counted twice. | First crawl showed three paths twice; `norm()` now drops `utm_*`. |
| Emails are Cloudflare-obfuscated (`/cdn-cgi/l/email-protection#…`); the raw HTML has no readable address. | Linked-files list of the crawl. |
| Playwright's bundled Chromium cannot play the H.264 hero video. | `requestfailed` on the video in the headless probe. |
| The cookie bar overlays the bottom of every page at first visit. | Screenshots at 1440 and 479. |
