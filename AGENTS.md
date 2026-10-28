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
  utilities,animations}.css` and `assets/css/design/*.css`. Hand-written: `assets/js/*.js`
  and `assets/css/modules.css`. Run in this order: `build_css.py`, `atomize.py`,
  `build_pages.py`.
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
  `design/globals-<document>.css` for the documents the page uses, the seven `design/`
  axis files, utilities, animations. Every rule comes from a live stylesheet and is kept
  only if it matches an element of a page that loads it (state pseudo-classes and runtime
  classes stripped first). Media queries stay where the source put them inside each file.
  Unused custom properties, keyframes and font faces are dropped; font faces are kept only
  if live really loads them (`_capture/fonts_used.json`).
- **The design of each element is classes, not an id.** Elementor stored it per element
  (2,077 rules keyed on ids). `atomize.py` turns each declaration into a class named after
  its value (`hl-fs-32--ht`, `hl-v-padding-top-50`; the `hl-` prefix keeps them apart from
  the site's own `.m-0`, `.d-none`), grouped by axis in `design/{type,space,layout,size,
  surface,effects,misc}.css`, and an element wears the classes of its values
  (`_vocab/element_classes.json`). Selectors keep their tail and so their specificity; media
  queries keep their conditions and Elementor's order. The vocabulary, with its scales
  (palette, type sizes, spacing), is in `_vocab/vocabulary.md`. A new section in WordPress
  is styled by wearing these same classes.
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
| R | design vocabulary: per-element design as classes | done 2026-10-28, tag `html-v1.1`: 0 of 49 pages differ from html-v1 (117,847 elements, every computed property, 1440/900/479), 0 of 49 from the live baseline |
| Phase 2 | the WordPress theme | planned in `docs/phase-2-plan.md`; answers recorded; starts after stage R |

## Tools

| tool | what it does | passing looks like |
|---|---|---|
| `_tools/inventory.py <raw_dir>` | crawls sitemaps, REST API (en + ar) and every internal link; records status, redirects and structure in `_inventory/pages.json` | `N urls known, N fetched, M answered 200` |
| `_tools/inventory_report.py` | writes `_inventory/urls.csv` (one row per URL, with its kind K1–K11 and the clone decision) and prints kind, status and section-archetype tables | `175 urls in urls.csv` … `pages with a kind: 98, without: 0` |
| `_tools/capture.py [name…]` | per page, in installed Chrome at 1440x900 and 479x900: raw HTML, settled DOM, geometry of every `[data-id]`, asset list, screenshot | `captured 49 pages at 2 widths` |
| `_tools/fetch_assets.py` | downloads every file the pages use: `assets/uploads/`, `assets/fonts/`, and the platform's own CSS/JS into `_source/` (reference only) | `N files stored (… MB), 1 failed` (the one live 404, see hazards) |
| `_tools/font_usage.py` | records the font faces live really loads | `N loaded faces across 49 pages` |
| `_tools/build_css.py` | writes the stylesheet set from the live CSS, pruned to this markup; the per-document rules go to `_vocab/docs/` (an intermediate) with `_vocab/css_map.json` | `91 source stylesheets, N rules read, M kept in 7 layers + K docs` and `44 files written, 0 with parse errors` |
| `_tools/vocab.py` | counts the designs Elementor stored per element, by kind of element (the analysis behind stage R) | `N designs for M elements -> _vocab/designs.json` |
| `_tools/atomize.py` | turns the per-element rules into classes and writes `assets/css/design/`, `_vocab/element_classes.json`, `_vocab/dynamic.json`, `_vocab/vocabulary.md`; stops on any selector it cannot express, on a class name that already exists in the site, and on CSS that does not parse | `642 elements, 7814 declarations -> 1111 classes`, `order conflicts … 0` |
| `_tools/refcheck.py [name…]` | the stage R check: every computed property and the box of every element of every page, against the same page of tag html-v1 (a checkout at `../_ref-v1`), at 1440, 900 (tablet) and 479; animations and long timers held still; a difference counts only if it stays when the page is measured again alone | `49 pages x 3 widths, N elements compared - 0 of 49 pages differ` |
| `_tools/build_pages.py [name…]` | writes the pages | `N pages built, 0 with chrome that differs from the source` |
| `_tools/compare.py [name…]` | page height and every element box against live, both widths (carousel slides skipped; boxes inside the fixed header measured from the header's top; a differing page is measured again alone, twice at most) | `done at 1440x900 and 479x900 - 0 of N pages differ (M pages measured again)` |
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
| style_check measures live in real time and moves between runs. Part of that is Chrome, not the sites: **the footer logo is laid out 286.9px wide or 350px wide depending on when its image arrives, on live and on this clone alike** (the live baseline of all 49 pages says 286.9; 350 shows up on either side in some loads). This was first put down to the live site only; refcheck, which compares the clone with itself, showed it is on both. Also entrance animations not yet run and the news post's images handled late. Compare against the fixed baseline, or against html-v1 with refcheck, which re-measures a difference alone before believing it. Elements that draw nothing (0x0) are not compared on `visibility`. | Re-measuring the flagged pages: clean in one run, flagged in the next, with the same footer element; refcheck on html-v1 against html-v1 flagged the same element. |
| `getComputedStyle` lists custom properties in a different order on every page, so a hash over the list differs for every element of two identical pages. Properties are sorted by name before hashing. | refcheck on identical pages: every element "different", and no property different. |
| Infinite animations (the sliding `pluses` background) and transitions are caught mid-way. refcheck holds them still (`animation: none; transition: none`) on both sides before measuring. | `background-position` 8px against 32px on identical pages. |
| A generated class name can equal one the site already uses: the atom for `margin: 0` was `m-0`, and the site's own CSS has `.m-0 p { margin: 0 }`, which started to hit paragraphs it never hit. Every class of the vocabulary starts with `hl-`, and atomize.py stops if one equals a class found in the markup or stylesheets. | refcheck: a paragraph with 16px margins on html-v1 and 0 on the new build. |
| Rules of a document that name no element (`.m-0 p`) apply to the whole page whenever that document's stylesheet is loaded. Merged into one file for all pages they reached pages that never loaded that document. They stay per document (`design/globals-<document>.css`), linked by the pages that use it (`_vocab/css_map.json`). | refcheck: the home page 8px shorter in a carousel. |
| A media block written without its `@` is dropped whole by the browser, so every tablet and mobile rule vanished. atomize.py re-parses every file it writes and refuses `media` or `supports` at the start of a line. | refcheck: `--content-width: 1151px -> min(100%, 1140px)` on every page. |
| Two rules of one element can set the same property on the same node with equal weight and be decided by order: `.page-numbers:not(.dots)` grey, then `.page-numbers.current` blue. Sorted alphabetically, the current page number of the blog pager turned grey. atomize.py finds every such pair (131) by matching both selectors on the captured DOM and comparing specificity, and keeps them in source order (a topological sort inside each property); it stops if two elements need opposite orders. | refcheck: blog and blog-2, one element each, `color: rgb(1, 101, 161) -> rgb(155, 155, 155)` at all three widths. |
| On a busy machine the header's scroll script can still be in its scrolled state when the page is measured (logo 125px against 165, header 50px against 59.1): one page of 49 in one run, clean in three runs alone. compare.py now re-measures a differing page alone before believing it, as refcheck does. | compare: `iraq-renaissance…` at 1440, header elements only. |
| A pipeline ending in `| head` reports the exit code of `head`: a failed generator did not stop the chain, and a comparison started on half-written files. Run the chain with `&&` and no pipe, redirecting to a log. | A traceback in the first lines and `49 pages built` after it. |
| A git worktree of tag html-v1 inside the scratchpad failed on Windows (`Filename too long`: one page name is 140 characters). The reference checkout is `../_ref-v1`, a short path. | `git worktree add` error. |
| A network drop (`ERR_NAME_NOT_RESOLVED`) or a Cloudflare delay over 90s killed a 30-minute run. style_check retries a page 4 times, 20s apart, and keeps results after every page (`_capture/style_check.partial.json`), resuming from it. compare and style_check runs on a few pages merge into the full results. | Two runs lost to the network. |
