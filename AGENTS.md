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

1. **html site v1**: every public page of the live site as plain HTML with readable CSS
   and JS, rendering identically to live at 1440x900 and 479x900, with complete content.
   It stays as the reference every later check measures against.
2. **The WordPress theme**: starts only after the whole HTML site is approved in words.

## Scope of v1

The 49 English pages marked `yes` in `_inventory/urls.csv` (decisions in
`_inventory/inventory.md`). The Arabic pages are `later: Arabic`.

## Phase 1 rules

- HTML code only: `.html` pages, `assets/` (CSS, JS, images, fonts, uploads) and the
  checking tools in `_tools/`. No WordPress, no PHP, no theme folder, no Docker, no blocks.
- The source of truth is the live site.
- Correctness is measured, never eyeballed. Every claim comes with the command that proves
  it and its output. A check's pass sentence counts what it checked.
- Results are reported as a table with one row per page.
- Reference pages and their CSS/JS are not edited to make one page look right.
- No generated file is hand-edited: change the generator and run it again. Generated:
  every `*.html` page at the root, `assets/css/{tokens,base,layout,components,navigation,
  utilities,animations}.css` and `assets/css/docs/*.css`. Hand-written: `assets/js/*.js`
  and `assets/css/modules.css`.
- No platform runtime is shipped: no Elementor frontend, no jQuery, no SmartMenus, no
  Swiper, no e-gallery. Each behaviour is a small module in `assets/js/`.
- Live bugs are fixed on purpose and listed in README under "Deliberate differences".
- Code, comments, docs and commit messages are in English. Commits are authored by the
  repository owner only, with no tool or assistant named anywhere.
- The owner runs every `git push`.

## How the pages are made

- **Markup**: Elementor's own DOM, from the captured server HTML (`_capture/raw/`), with
  its class names and `data-id`s kept: the per-element design lives in Elementor's
  per-document CSS, keyed on those classes, and phase 2 maps them to block attributes.
  Removed: every script, the Elementor/WP/plugin stylesheets, analytics, comments, the
  lazy-load class. `data-settings` keep only the keys the modules read.
- **Shared chrome from one source**: header, footer, "major clients" block, cookie bar and
  page-transition element are taken from the home page and spliced into every page. What
  legitimately differs per page is carried over from that page's own capture: active-menu
  classes, `aria-current`, the language link's `href`, image loading hints, `rel`/`target`
  on external links. Anything else that differs is reported and fails the build report.
- **Stylesheets**, in load order: tokens, base, layout, components, navigation, modules,
  the page's Elementor documents (`docs/`), utilities, animations. Every rule comes from a
  live stylesheet and is kept only if it matches an element of a page that loads it
  (state pseudo-classes and runtime classes stripped first). Media queries stay where the
  source put them inside each file. Unused custom properties, keyframes and font faces are
  dropped; font faces are kept only if live really loads them (`_capture/fonts_used.json`).
- **Links**: pages in scope point at `<name>.html`; uploads at `assets/uploads/`; pages
  outside v1 (Arabic) stay on live; Cloudflare-obfuscated emails become `mailto:`.
- **Page names**: the live path's segments joined by `-` (`/news/x/` -> `news-x.html`),
  the home page is `index.html`, the 404 template `404.html`.

## Stages

| stage | what | state |
|---|---|---|
| A | inventory (`_inventory/inventory.md`, `_inventory/urls.csv`) | approved 2026-10-27: English first, 49 pages |
| B | capture: raw HTML, settled DOM, assets, geometry baseline | done 2026-10-27 |
| C | design system and behaviour | done 2026-10-27 (stylesheet set, 12 modules) |
| D | home page + one page of each kind | built and measured 2026-10-27 (tag `stage-d`) |
| E | generate the rest | done 2026-10-27: all 49 pages, same generator |
| F | checks | all 49 pages: geometry, computed styles, behaviour, links (`_tools/report.py`) |
| G | docs, tag `html-v1` | done 2026-10-28; pushed to github.com/hla-sh93/harlow-website |
| Phase 2 | the WordPress theme | planned in `docs/phase-2-plan.md`; waiting for answers to its questions |

## Tools

| tool | what it does | passing looks like |
|---|---|---|
| `_tools/inventory.py <raw_dir>` | crawls sitemaps, REST API (en + ar) and every internal link; records status, redirects and structure in `_inventory/pages.json` | `N urls known, N fetched, M answered 200` |
| `_tools/inventory_report.py` | writes `_inventory/urls.csv` (one row per URL, with its kind K1–K11 and the clone decision) and prints kind, status and section-archetype tables | `175 urls in urls.csv` … `pages with a kind: 98, without: 0` |
| `_tools/capture.py [name…]` | per page, in installed Chrome at 1440x900 and 479x900: raw HTML, settled DOM, geometry of every `[data-id]`, asset list, screenshot | `captured 49 pages at 2 widths` |
| `_tools/fetch_assets.py` | downloads every file the pages use: `assets/uploads/`, `assets/fonts/`, and the platform's own CSS/JS into `_source/` (reference only) | `N files stored (… MB), 1 failed` (the one live 404, see hazards) |
| `_tools/font_usage.py` | records the font faces live really loads | `N loaded faces across 49 pages` |
| `_tools/build_css.py` | writes the stylesheet set from the live CSS, pruned to this markup | `84 source stylesheets, N rules read, M kept in 7 layers + K docs` |
| `_tools/build_pages.py [name…]` | writes the pages | `N pages built, 0 with chrome that differs from the source` |
| `_tools/compare.py [name…]` | page height and every element box against live, both widths (carousel slides skipped; boxes inside the fixed header measured from the header's top) | `done at 1440x900 and 479x900 - 0 of N pages differ` |
| `_tools/style_check.py [name…]` | 43 computed properties (box, typography, colour, background) of every element and the element inside it, against live, both widths; timed parts (history slider, carousel tracks) and the scroll-animated header colour left out; px within 0.5 | `N elements x 86 properties checked over 2 widths - 0 of M pages differ` |
| `_tools/style_diff.py <name> [width] [id… / tree:id]` | the same properties for one page, printed by property, or one element's subtree node by node: the tool for finding which rule a difference comes from | (diagnostic, no pass sentence) |
| `_tools/behaviour.py` | drives each module on the built pages: header on scroll, hover submenu, burger menu, carousel, history slider, entrance animations, gallery, lightbox, cookie bar, page transition, internal link | `N behaviours checked, 0 failed, 0 skipped` |
| `_tools/links.py` | every local reference in pages and stylesheets exists | `N references in M files checked - 0 broken, 0 pages linked but not built yet` |
| `_tools/report.py` | the per-page table from the latest compare, style_check and links runs: `_capture/report.md` | `49 pages, 0 with any difference` |
| `_tools/client_copy.py [folder]` | the client's copy outside the repository (default `../harlow-website` and `../harlow-website.zip`): the pages and only the files they use, CSS without internal comments, checked on its own | `49 pages and N files (… MB) in <folder> - 0 missing references, 0 workshop mentions` |

## Hazards met on this project

| hazard | how it was caught |
|---|---|
| The site is bilingual (WPML, English + Arabic RTL). Each language has its own header and footer template, and Arabic slugs are percent-encoded. | WPML `generator` meta; Arabic home renders `header#6606` / `footer#7508` against English `header#1179` / `footer#1066`. |
| Three custom post types have public REST entries whose single pages 301 to the home page (`team_member`, `harlows_person`, `business_model`). They are data for loops, not pages. | `curl -I` on each single URL. |
| Console error `Uncaught SyntaxError: Unexpected identifier 'wpdaOrgChartPopup'` (Organization Chart plugin) seen once in the in-app browser, not reproduced headless. | Browser console on the home page; headless probe of 15 pages × 2 widths. |
| Live JS error on 48 of 49 pages: `Cannot read properties of undefined (reading 'querySelector')`, the history-slider script running where there is no slider. | `pageerror` in 96 of 98 capture runs. |
| Some internal links carry `?utm_source=chatgpt.com`; keyed naively, one page is counted twice. | First crawl showed three paths twice; `norm()` now drops `utm_*`. |
| Emails are Cloudflare-obfuscated (`/cdn-cgi/l/email-protection#…`); the raw HTML has no readable address. | Linked-files list of the crawl. |
| Playwright's bundled Chromium cannot play the H.264 hero video. Every browser tool uses `channel="chrome"`. | `requestfailed` on the video in the headless probe. |
| The cookie bar overlays the bottom of every page at first visit. Capture accepts it once per context; compare sets the same consent. | Screenshots at 1440 and 479. |
| Upload file names contain U+202F (macOS screenshot names). Splitting `srcset` on `\s` cuts the URL; split on ASCII whitespace only, as the spec does. | Two 404s in the first asset run. |
| One image the history slider's custom CSS uses is a 404 on live (`2025/01/harlow-overhauls-prime-minister-office-sm.jpg`). | The one failure left in `fetch_assets.py`. |
| `site` as a module name shadows Python's own `site` module; the shared module is `common.py`. | Import picked the standard library. |
| Git Bash eats backslashes in heredocs; regex code goes through the editor. | `SyntaxWarning: invalid escape sequence` and an assertion that found nothing. |
| `:where()` / `:is()` selectors cannot be judged by cssselect; unexpanded, 1185 lines of block-library CSS were kept. They are expanded into their alternatives first. | `base.css` 4342 lines on the first run. |
| Elementor kit loads Roboto and Roboto Slab in every weight; the site forces Plus Jakarta Sans. Font faces are pruned to the ones live loads. | 281 `@font-face` rules in the first `base.css`. |
| Person popups on harlows-people keep 4 elements `elementor-invisible` on live (hidden until opened, so never in view). Same behaviour in the clone. | `stillInvisible: 4` in both capture runs of that page. |
| Inserting `*` after every combinator followed by a space turned `.a > .b` into `.a >* .b`: every rule written with ` > ` was dropped (250 rules), so widget margins, footer fonts and icon sizes were missing. Selectors are now tokenised; only a compound emptied by stripping becomes `*`. | style_diff: `margin-top: 10px -> 0px` on the logo's widget container. |
| A generic at-rule formatter broke the braces of an `@supports` block, and Chrome dropped the rest of `base.css` (25 of ~200 rules parsed): no body line-height. `@media` and `@supports` now go through the parser, and build_css re-parses every file it writes. | style_diff: `line-height: 24px -> normal`; CSSOM rule count per sheet. |
| Removing an unused `@keyframes` with `^(\s*)…` ate the next block: `\s` matches newlines. Indentation is `[ \t]*`. | The Nunito face missing although live loads it. |
| html5lib puts inline SVG in the SVG namespace and lxml prints `ns0:svg`, which the browser does not draw (footer social icons 0px). Names are made plain before writing, and build_pages fails if `ns0:` is left. | style_diff tree: `structure differs: svg / ns0:svg`. |
| `html { scroll-behavior: smooth }`: `scrollTo(0,0)` has not finished when geometry is read, so fixed elements show a stray scrollY (64px at 479). Settle scrolls instantly; compare measures fixed boxes from their container. | 4px on the header only, at 479. |
| Live forms gain DOM at run time: Turnstile's 71px widget, CF7's 24px block spinner, Honeypot fields. build_pages adds the spinner and an empty slot of the widget's size. | compare: contact and job 115px short. |
| A fresh live session with an explicit user agent sometimes gets images rewritten by Cloudflare at run time (classes `entered exited`, a `noscript`, the milestone icon drawn 300px wide). Not in the server HTML, not in the captured DOM, not in a direct session with or without consent. The capture is the baseline. | style_check: one icon 300px on live against 6.36px. |
| The history slider changes slide every 9s and the settle takes about that long: it is time-dependent like a carousel. | style_check: slide 0 opacity 1 on one side, 0 on the other. |
| Plugin images in the markup (language flags, cookie dialog logo) were rewritten to `assets/vendor/` but never copied there; build_pages now copies them from `_source/`. | links.py: 37 broken references. |
| The history slider sizes the home page's section by the active slide's text, so the page below moves by up to 48px depending on when it is measured. The baseline records which slide showed (`slide` per width in the geometry file); compare stops the clone's long timers (>= 5s) and clicks that slide's thumbnail before measuring; style_check stops the timers on both sides. | compare: home page matched in one run and differed by 48px in the next. |
| A 0x0 box (an element hidden on every device) reports the scroll offset as its position. compare checks only that such a box is 0x0 on both sides. | 0x0 containers "off" by 3px and 59px at 479. |
| One inline style id can repeat: photo-gallery has five `<style id="loop-dynamic-2552">`, one per gallery item, each with that item's background image. Keyed by id, only the last survived and four items lost their background. build_css keeps every distinct block under an id. | style_check: `background-image: url(...) -> none` on 4 items. |
| style_check measures live in real time, and live varies between sessions: the footer logo drawn 350px against 286.9 (seen on a different page in each run, while the clone's footer is one source), entrance animations not yet run, the news post's images handled late. These flags move between pages from run to run; compare against the fixed baseline is the deterministic check. Elements that draw nothing (0x0) are not compared on `visibility`. | Re-measuring the flagged pages: bismayah clean in one run, harlows-people flagged in the other, with the same footer element. |
| A network drop (`ERR_NAME_NOT_RESOLVED`) or a Cloudflare delay over 90s killed a 30-minute run. style_check retries a page 4 times, 20s apart, and keeps results after every page (`_capture/style_check.partial.json`), resuming from it. compare and style_check runs on a few pages merge into the full results. | Two runs lost to the network. |
