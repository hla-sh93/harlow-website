# AGENTS.md: Harlow Group website

Working rules for anyone (person or tool) changing this repository.

## The project

| value | |
|---|---|
| `SITE_URL` | https://www.harlowgroup.com/ |
| `PROJECT_DIR` | `D:\abbas\هارلو\website` |
| `CLIENT` | Harlow Group |
| `PREFIX` | `harlow` (confirmed 2026-10-28) |

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
  `theme/pages/`, `theme/patterns/`, `theme/install/*.json`, `theme/editor/icons.json`,
  `theme/editor/design-classes.json`, `theme/build/` (phase 2), every `*.html` page at the root, `assets/css/{tokens,base,layout,components,navigation,
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
  `design/globals-<document>.css` for the documents the page uses, `design/brand.css`, the
  seven `design/` axis files, utilities, animations. Every rule comes from a live stylesheet and is kept
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
- **Brand colours are named once.** `design/brand.css` defines `--hl-color-primary`
  (#0165A1), `-dark` (#001420), `-accent` (#00CCCC), `-light` (#F2F2F2) and `-text`
  (#000000, for text and icons only), and every rule of `design/` that uses one of those
  colours exactly asks for the property instead (`BRAND` in `atomize.py`). Shades with their
  own alpha (`#0165A100`) keep their values. The theme's Customizer overrides the properties;
  `assets/js/header.js` reads `--hl-color-primary` for the scrolled header.
- **Links**: pages in scope point at `<name>.html`; uploads at `assets/uploads/`; pages
  outside v1 (Arabic) stay on live; Cloudflare-obfuscated emails become `mailto:`.
- **Page names**: the live path's segments joined by `-` (`/news/x/` -> `news-x.html`),
  the home page is `index.html`, the 404 template `404.html`.

## The theme (phase 2)

A classic theme in `theme/` (`harlow`), to the WordPress Coding Standards (`env.sh phpcs`,
exit 0). `theme/assets` is the repository's `assets/`, mounted read-only: the theme serves
the reference's CSS and JS unchanged.

| path | what |
|---|---|
| `functions/setup.php` | theme supports, the five menu locations (registered on `init`), the kit body class |
| `functions/enqueue.php` | the reference's stylesheets in its order, the page's own documents' `globals-*.css` (`_harlow_documents`), the 12 modules; WordPress's global styles, block library and emoji, and CF7's assets, left out; in the editor, the same stylesheets for the canvas only (`enqueue_block_assets` while WordPress collects the canvas's assets) with `editor/canvas.css`, and the blocks' edit views (`build/`) with every page's address |
| `functions/settings.php` | Appearance → Customize: header and footer, social links, language link, cookie bar, page transition. Every default is live's value; an empty picture is the design's own |
| `functions/brand.php` | Customize → Brand colours: an inline `:root` override after `brand.css`, printed only for a changed colour |
| `functions/nav.php` | the menus through WordPress's own walker with Elementor's classes; the language link; the footer's icon lists |
| `functions/content-types.php` | news, projects (`albahoo_project`), gallery items, jobs, business models, Harlow's people, team members (live's names and addresses), testimonials, client logos; the extra fields (a business model's icon and page, a testimonial's position) in a box under the editor; business models', people's and team members' addresses lead home (301), as on live |
| `functions/loops.php` | the list block `harlow/loop` (`blocks/loop/block.json`, markup in `includes/sections/loop.php`): Elementor's loop grid or loop carousel, the cards alone, or the cards in a container of the page that the list prints (`box`: the client logos), fed by a query (type, how many, by date or order, which first) and a card from `includes/loops/`; the card helpers (`harlow_card_text()` cuts words as live's cards do, `harlow_card_image()` adds `wp-image-<id>`) |
| `functions/blocks.php` | registers every block of `blocks/` (markup in `includes/sections/<name>.php`); the shared pieces: an element's attributes, readable links (`about-us.html#part` → the page's address now, `assets/...` → the theme's file), WordPress's added prose classes taken off, the icon allowlist, the document element around a page's sections, the pattern categories; a new page's template (its document block first, `templateLock: 'insert'`) |
| `functions/install.php` | `wp harlow install [--restore]`: pages, pictures, items, menus, each page's blocks (when empty, or all with `--restore`) and the major clients' synced pattern from `install/` and `pages/` |
| `page.php`, `front-page.php`, `header-canvas.php`, `footer-canvas.php` | a page: header, the page's document with its blocks, footer; the home page on Elementor's canvas (no site header, footer or skip link around it: its own sections hold them) |
| `blocks/` | one block per kind of Elementor element: container, heading, text (WordPress paragraphs and lists inside, a box of them, an element written as HTML), image, button, divider, icon, icon list, social icons, accordion (its questions as blocks), HTML, shortcode output, menu, shared section (template), site header or footer, document (a page's first block), list of items; each with its edit view (`edit.js`), which prints the same elements as its `includes/sections/` file |
| `editor/` | the editor's code: `index.js` registers the 20 blocks; `shared.js` (an element's attributes, readable links as addresses, the icon chooser, link fields, the server's markup for blocks kept elsewhere: menus, lists, header and footer, pictures); `items.js` (the lines of a list in the sidebar); `paragraph-data.js` (data attributes on a paragraph); `design-classes.js` (the vocabulary's classes in Advanced); `ui.css`; `canvas.css` (what the page's scripts draw, what the editor adds); `icons.json` and `design-classes.json`, written by `gen_blocks.py` |
| `build/` | the editor bundle, `npm run build` (wp-scripts) from `editor/`: committed, so the theme installs without a build |
| `theme.json` | settings only: the canvas as wide as the window, no colour, size or spacing pickers (the design is the vocabulary) |
| `pages/` | each page's blocks (its original) and the major clients' blocks, written by `_tools/gen_blocks.py`: never hand-edited |
| `patterns/` | the section library (one section of every shape the pages have, `section-*.php`) and one starter per kind of page (`starter-k1.php` … `starter-k6.php`), written by `_tools/gen_blocks.py`: never hand-edited |
| `includes/parts/` | the markup of the header, footer, cookie bar, cookie window, language switcher and page transition, taken from html-v1 with their design classes |
| `includes/loops/` | the eight cards (post and news, business model, project, testimonial, person with its window, gallery item, job, client logo): Elementor's loop item templates as html-v1 has them, with the item's fields |
| `install/site.json`, `install/items.json`, `install/media.json` | the site's data, written by `_tools/seed_site.py` and `_tools/seed_items.py` from the reference and live's REST capture: never hand-edited |
| `admin/image-field.js` | the picture chooser of the icon field |

- **The chrome is html-v1's markup.** Only what an owner changes is PHP: the logo, menus,
  words, links and pictures. A footer column's heading is the name of its menu.
- **Typed menu links are never "current".** Live never marks a Custom Link as the current
  page; its About links point at parts of the About page, which the scroll script marks.
  `harlow_nav_current_items()` takes WordPress's mark off typed links.
- **Pages keep live's ids** where the id is free (`import_id`), and so do menu items, so the
  menus print live's `menu-item-<id>` and `page-item-<id>`. Found again by `_harlow_original`
  (survives a slug change). Each page stores its Arabic address (`_harlow_translations`) and
  the documents whose page-wide rules it loads (`_harlow_documents`).
- **Pictures are live's files under live's ids.** The installer copies each picture and
  every size of it from `assets/uploads/` to `uploads/`, at the same path, and writes its
  attachment with live's id and live's size list, so `wp_get_attachment_image()` prints
  live's srcset; nothing is regenerated. Items keep live's ids, dates and addresses.
- **A page is blocks, one per Elementor element.** Each keeps the element's id, design
  classes and settings, and its words, pictures and links as named attributes; the white
  space between elements is the reference's (written into the blocks by gen_blocks.py), so
  the page's markup is the reference's, not only its look. The major clients section is one
  synced pattern (`wp_block` #5532) that 22 pages show; its ten logos are the Client logos.
- **Links stay readable in the blocks** (`about-us.html#section-2`, `assets/uploads/...`)
  and become addresses when printed, the page found by its name (`_harlow_name`), so links
  follow a page whose address changes (stage 6 adds the redirects).
- **The editor draws a page with the page's own stylesheets.** Each edit view prints its
  PHP file's elements, words typed in place (rich text); menus, lists, header, footer and
  pictures are the server's own markup, with the block on its first element. What the
  page's scripts draw, the edit views draw the same way (a background video's size, a
  carousel's slide widths, the header following the scroll, the first question open);
  `canvas.css` takes back what the editor adds (`position: relative` and word breaking on
  every block, its own id on every block). `verify_editor.py` holds the canvas against the
  page at 1440, 900 and 479, element by element.
- **A page's first block is its Elementor document** (`harlow/document`): the page's own
  rules are keyed on `.elementor-<id>`, so the canvas needs it too. A new page starts with
  one; nothing is added beside it.
- **Words the editor types into are written without the markup's stray white space**
  (`gen_blocks.words()`): rich text shows white space as written and turns a line break
  into `<br>` when edited. The page draws them the same; the checks fold white space at
  the ends of a heading, paragraph or list item.
- **The language link and the footer switcher are the theme's** until WPML (stage 11);
  with WPML active they are left to it.

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
| Phase 2 | the WordPress theme | planned in `docs/phase-2-plan.md`; answers recorded |
| 0 | local WordPress (Docker): WordPress 7.1, MariaDB, phpMyAdmin, Mailpit, WP-CLI; Contact Form 7 and Rank Math; the `harlow` theme folder mounted from `theme/`; coding standards | done 2026-10-28, tag `stage-0`: `env: 21 checks, 0 failed` after a rebuild from a wiped database; phpcs exit 0 |
| 1 | skeleton and chrome: header, footer, cookie bar and window, language switcher, page transition from html-v1's markup; menus in Appearance → Menus; site details, social links, language link, cookie words, transition picture and brand colours in the Customizer; brand colours as `--hl-color-*` in the design; the 22 pages and 5 menus from `install/site.json` | done 2026-10-28, tag `stage-1`, after a rebuild from a wiped database: `chrome: 22 pages checked, 13925 elements - 0 of 22 pages differ (27 pages not in WordPress yet)`; `chrome in the browser: 22 pages x 3 widths, 41970 elements - 0 of 22 pages differ (0 page-widths measured again); 7 behaviours, 0 failed`; `settings: 33 settings and menu changes checked, 0 problems; 2 of 2 pages byte for byte as before`; `env: 21 checks, 0 failed`; phpcs exit 0 (16 files); the reference after the brand colours: refcheck `49 pages x 3 widths, 117847 elements compared - 0 of 49 pages differ`, behaviour `13 behaviours checked, 0 failed`, links `0 broken` |
| 2 | content types and their data: live's types and addresses, 49 items (7 posts, 5 news, 7 projects, 5 gallery items, 1 job, 5 business models, 4 people, 5 testimonials, 10 client logos) and 88 pictures in the Media Library with live's ids and sizes; the list block and eight cards | done 2026-10-28, tag `stage-2`, after a rebuild from a wiped database: `lists: 10 lists, 1182 elements - 0 of 10 differ (loading hints differ in 7: 24 attributes); 4 behaviours, 0 failed; 9 lists follow their items, 0 do not; 9 of 9 pages as before`; `chrome: 47 pages checked, 29750 elements - 0 of 47 pages differ (2 pages not in WordPress yet; loading hints differ on 25 pages: 48 attributes)`; `chrome in the browser: 47 pages x 3 widths, 89670 elements - 0 of 47 pages differ (1 page-widths measured again); 7 behaviours, 0 failed`; settings 33, 0 problems; env 21, 0 failed; phpcs exit 0 (27 files) |
| 3 | the 22 pages as blocks: one block per Elementor element (17 kinds), read from the reference by `gen_blocks.py`; the major clients as one synced pattern; the careers side menu; `page.php` and the home page on the canvas; the section library (72 shapes) and six page starters | done 2026-10-30, tag `stage-3`, after a rebuild from a wiped database: `pages: 22 pages, 4817 elements - 0 of 22 pages differ (loading hints differ on 22 pages: 43 attributes; 10 accepted)`; `pages in the browser: 22 pages x 3 widths, 15199 elements - 0 of 22 pages differ (0 page-widths measured again)`; `chrome: 47 pages checked, 29750 elements - 0 of 47 pages differ`; `chrome in the browser: 47 pages x 3 widths, 89670 elements - 0 of 47 pages differ; 7 behaviours, 0 failed`; lists 10, 0 differ; settings 33, 0 problems; env 21, 0 failed; `behaviour.py --wp`: `11 behaviours checked, 0 failed, 2 skipped` (the gallery: stage 5); phpcs exit 0 (76 files) |
| 4 | the blocks in the editor: an edit view per block printing its PHP file's elements, words typed in place, pictures replaced from the Media Library, links, icons, menus, lists and design classes in the sidebar; the page's own stylesheets in the canvas (`editor/canvas.css` for what scripts draw and what the editor adds); a page's document as its first block (new pages too); questions, boxes and HTML elements as blocks; the client logos' grid printed by their list; `theme.json` settings only; the bundle built and committed | done 2026-10-30, tag `stage-4`, after a rebuild from a wiped database: `editor: 22 pages, 789 blocks valid, 0 invalid or missing; canvas: 22 pages x 3 widths, 11829 elements - 0 of 22 pages differ (2 page-widths measured again) (1380 elements that take typing keep the browser's white space for typing, 104 of them a few px wider where a line ends in a space); clicks: 866 words and pictures, 0 missed, 4 under the page's own elements as on the page`; `patterns: 78 read by the editor, 980 blocks, 0 invalid; 78 printed, 5970 elements - 0 differ from their source`; `--save`: `saved through the editor: 22 pages, 0 failed to save; markup identical, browser identical` (white space between elements differs in 245 places, 15199 elements identical in the browser); pages 4817 elements, 0 differ; pages in the browser 15199, 0 differ; chrome 47 pages, 0 differ; chrome in the browser 89670 elements, 0 differ, 7 behaviours; lists 10 (1184 elements), 0 differ; settings 33, 0 problems; env 21, 0 failed; `behaviour.py --wp` 11, 0 failed, 2 skipped; links 8565, 0 broken; phpcs exit 0 (129 PHP files); `npm run lint` exit 0 |

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
| `_tools/behaviour.py [--wp]` | drives each module on the built pages: header on scroll, hover submenu, burger menu, carousel, history slider, entrance animations, gallery, lightbox, cookie bar, page transition, internal link; with `--wp` on the local WordPress, the item pages skipped until stage 5 | `13 behaviours checked, 0 failed, 0 skipped`; `--wp`: `11 behaviours checked, 0 failed, 2 skipped` |
| `_tools/links.py` | every local reference in pages and stylesheets exists | `8565 references in 101 files checked - 0 broken, 0 pages linked but not built yet` |
| `_tools/env.sh up/down/status/wp/save/restore/list/rebuild --yes/phpcs/phpcbf` | the local WordPress (`docker-compose.yml`, project `harlow`, http://localhost:8090, phpMyAdmin 8091, Mailpit 8035): `rebuild` wipes the database and builds the site from the repository (core, theme, plugins from host-fetched zips, Rank Math's first screen skipped, permalinks, empty site); the admin login is in `.env`, written with a random password, never committed | `Built. WordPress 7.1 at http://localhost:8090`; phpcs: `theme/ meets the WordPress Coding Standards (exit 0)` |
| `_tools/seed_site.py` | writes `theme/install/site.json` from the reference: the 22 WordPress pages (title, address, live id, Arabic address, stylesheet documents), the five menus item by item (live ids, labels, page or typed address), the language link | `22 pages and 5 menus (43 items) -> theme/install/site.json` |
| `_tools/capture_items.py` | reads live's REST API: the English items of every type with a REST route, the post categories, and the media records of every picture the items and the 49 pages use (`_capture/rest/`); fetches the sizes of those pictures the reference lacked into `assets/uploads/` (not the team members': no page shows one) | `media: 111 of 116 pictures …; not answered: [2292, 2305, 2307, 2309, 2311]` (the testimonials' pictures) |
| `_tools/seed_items.py` | writes `theme/install/items.json` and `media.json`: the items from the REST capture, plus what only the pages show (a business model's icon and page, the testimonials, the client logos, each item page's Arabic address and documents); the pictures kept to the files that are here | `49 items (post 7, news 5, albahoo_project 7, gallery_item 5, job 1, business_model 5, harlows_person 4, testimonial 5, client_logo 10)` and `88 pictures (237 sizes) …; 0 originals not here; 0 unknown` |
| `wp harlow install` (the theme's) | lays `install/` into WordPress: pages, pictures (files copied, attachments with live's ids and sizes), items (live's ids, dates, addresses, categories, featured pictures, fields), menus; finds before it makes; adopts WordPress's draft privacy page (emptied); rewrites the address rules; run by `env.sh rebuild` | first run `pages: 21 made (21 with live's id), 1 found; pictures: 88 made (269 files), 0 found; items: 49 made, 0 found; menus: 5 made (43 items), 0 kept`, second run `0 made … 22 found … 88 found … 49 found … 5 kept` |
| `_tools/gen_blocks.py [name…]` | stage 3: each of the 22 pages' own Elementor document read into blocks (theme/pages/), the major clients into a synced pattern's blocks, the section library and starters (theme/patterns/); stops on any element of a kind or shape it does not know, with the page and the element's id | `22 pages written to theme/pages/, 0 stopped; blocks: container 252, …` and `section library: 72 shapes …; starters: 6 kinds …` |
| `npm run build`, `npm run lint` | the editor bundle (`theme/editor/` and `theme/blocks/*/edit.js` into `theme/build/`), and the WordPress JavaScript standards on it | `webpack … compiled successfully`; lint exit 0 |
| `_tools/verify_editor.py [--save] [name…]` | stage 4, in Chrome, logged in by a cookie WordPress makes through WP-CLI: every block valid; the canvas against the page at 1440, 900 and 479 (every computed property and box of every element of the document; the editor's own custom properties and what it sets for typing and dragging counted apart; what a script rebuilds held as one element; a differing page-width measured again); every word and picture takes a click (those the design lays another element over, as on the page, listed apart); every pattern read by the editor and printed as its source section. `--save`: every page saved through the editor, compared by verify_wp (`--space`) and verify_render, put back. `--width=`, `--no-clicks`, `--why` find what differs | `editor: 22 pages, N blocks valid, 0 invalid or missing; canvas: 22 pages x 3 widths, N elements - 0 of 22 pages differ …; clicks: N words and pictures, 0 missed …`, `patterns: 78 read by the editor, N blocks, 0 invalid; 78 printed, N elements - 0 differ from their source` |
| `_tools/listdata.py` | which items each list of the reference shows, in which order and how many (read off the reference, live keeps its queries on the server); used by gen_blocks.py and verify_lists.py | (data) |
| `_tools/verify_wp.py [name…]` | stage 3: each page's document on WordPress against the reference, element by element (tag, every attribute, every text, the white space between elements), and the elements directly in `<body>` in order; loading hints counted apart; the home page's footer links' rel/target counted as accepted (README) | `pages: 22 pages, 4817 elements - 0 of 22 pages differ (loading hints differ on 22 pages: 43 attributes; 10 accepted)` |
| `_tools/verify_render.py [name…]` | stage 3, in Chrome: every computed property and box of every element of each page's document at 1440, 900 and 479 against `/static/<name>.html`; boxes from the document's top (inside fixed elements from the screen's); timers of 5s or more held still; a difference measured again alone | `pages in the browser: 22 pages x 3 widths, 15199 elements - 0 of 22 pages differ (…)` |
| `_tools/verify_lists.py` | stage 2: each of the nine lists and the client logos made by the list block on its own page (for the time of the check) from the reference widget's id, classes and settings, compared with the reference element by element; the carousels and people's windows driven in Chrome; one item of each list retitled, the list must show it; all put back, pages' bodies byte for byte as before | `lists: 10 lists, 1182 elements - 0 of 10 differ (…); 4 behaviours, 0 failed; 9 lists follow their items, 0 do not; 9 of 9 pages as before after putting everything back` |
| `_tools/verify_chrome.py [name…]` | stage 1: on every page WordPress has, the page transition, skip link, header, footer, cookie bar, language switcher and cookie window against the reference, element by element (tag, every attribute, every text, WordPress addresses rewritten to the reference's form); their order; every stylesheet in order; the scripts | `chrome: 47 pages checked, 29750 elements - 0 of 47 pages differ (2 pages not in WordPress yet; loading hints differ on 25 pages: 48 attributes)` (loading, decoding and fetchpriority counted apart) |
| `_tools/verify_chrome_render.py [name…]` | stage 1, in Chrome: every computed property and box of every chrome element at 1440, 900 and 479 against `/static/<name>.html` on the same site (boxes from their part's top, inside the fixed header bar from the top of the screen; 0x0 boxes by being 0x0); then the chrome's behaviours on a WordPress page | `chrome in the browser: 47 pages x 3 widths, 89670 elements - 0 of 47 pages differ (…); 7 behaviours, 0 failed` |
| `_tools/verify_settings.py` | stage 1: every Customizer setting, a footer menu's name and two menu items given test values through WP-CLI (pictures: one imported for the test), each found in its place on a page and the 404 page; then all put back and the pages compared byte for byte | `settings: 33 settings and menu changes checked, 0 problems; 2 of 2 pages byte for byte as before after putting everything back` |
| `_tools/verify_env.py` | stage 0 check: services running; home page from the harlow theme; the static reference and the theme's assets served byte for byte from the repository; WordPress version, theme, plugins, permalinks, timezone, debug logging and development mode in WP-CLI; a message sent through wp_mail() found in Mailpit; 64 MB uploads on the web server; an empty debug.log | `env: 21 checks, 0 failed` |
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
| The Osous stack runs on this machine on 8080, 8081 and 8025. The Harlow stack is its own compose project (`harlow`) on 8090, 8091 and 8035, so both run side by side and neither is stopped for the other. | `docker ps` before the first start. |
| The WordPress image's wp-config.php reads `WORDPRESS_DEBUG` and `WORDPRESS_CONFIG_EXTRA` at run time, so the WP-CLI container, which had only the database settings, ran without debug logging and without `WP_DEVELOPMENT_MODE`. One YAML anchor (`x-wordpress-env`) gives both containers the same settings. | verify_env: `log False, mode ''` in WP-CLI while the web server had both. |
| The container cannot reach wordpress.org over TLS on this machine: every update check (after a plugin install, from admin pages, from cron) wrote a PHP warning to debug.log, the file that must stay empty. A local-only must-use plugin (`harlow-local-offline.php`) answers api.wordpress.org with an empty 200; plugins come from zips the host fetches. | verify_env: `no PHP errors in debug.log` failed on `wp_version_check()` after a rebuild. |
| WordPress marks a typed menu link (Custom Link) current when its address is the page's; live never does, on any of the 49 pages. On the About page all five About links would be underlined at once, against the scroll script. The theme takes the mark off typed links. | Per-page chrome differences against one page: no About link marked on about-us. |
| PHP drops the newline right after `?>`. A template line ending in `?>` followed by a tag at column 0 loses the space the reference has there. | verify_chrome: `cookie window #7 </img> followed by '' / reference ' '`. |
| `wp_dequeue_style( 'global-styles' )` at priority 100 left the global styles in the head (WordPress adds them late and in two places). The two actions are removed instead. | `global-styles-inline-css` in the first WordPress page. |
| A page-wide custom property comes from the page's own document (`--page-title-display: none` in `globals-post-1224.css`), not from the chrome's: a page loads its documents' rules from stage 1 on, in the reference's order. | verify_chrome_render: `--page-title-display 'block' / reference 'none'` on every chrome element. |
| One design rule is keyed on the body class of Elementor's kit (`.elementor-kit-9 e-page-transition`: the transition's background). The theme adds `elementor-kit-9` to the body. | grep of every body class against the stylesheets: 1 of 105 used. |
| On Windows, Python's `Path.write_text()` writes CRLF; phpcs refuses it. Theme files are written with `newline="\n"`, and `.gitattributes` keeps `theme/**` and `*.sh` LF on every checkout (this machine has `core.autocrlf=true`, which would write CRLF back). | phpcs: `End of line character is invalid; expected "\n" but found "\r\n"`. |
| Git Bash started from Python cannot open a script by a path with Arabic letters (`env.sh: No such file or directory`). The checks call `docker compose` directly (`wpsite.wp_cli`). | verify_settings' first run. |
| The vocabulary report sorted equal counts in a different order on each run (string hashing). Ties are sorted by value. | `_vocab/vocabulary.md` changed with nothing else changed. |
| After settling, a page can be left a few pixels down (8 to 79px seen, on the reference and on WordPress alike), so a box inside the fixed header bar, measured from the static `<header>` around it, moved with the scroll. Boxes inside a fixed element are measured from the top of the screen. | verify_chrome_render: one post at 479, the header bar 8px lower on the reference, three runs in a row. |
| A short page cannot scroll 200px, so the header never changes colour on it. Until the pages have their sections, the placeholder in `index.php` is 120vh tall. | verify_chrome_render: header scroll `{'bg': '', 'logo': ''}`. |
| lxml's HTML parser (libxml2) closes a heading at a `<p>`; html5lib, like the browser, keeps the `<p>` inside. Card templates copied from an lxml parse printed `<h2></h2><p>…</p>`, which the browser reads as two siblings. The reference's raw markup is the one to copy; the checks parse both sides with html5lib. | verify_lists: job and testimonial cards, `</h2> followed by '' / reference ' '`. |
| `wp_get_attachment_image()` writes `attachment-<size> size-<size>` but not `wp-image-<id>`, which Elementor adds. `harlow_card_image()` passes the class. | verify_lists: `class: 'attachment-large size-large' / reference '… wp-image-9377'`. |
| Live's cards cut text after N words counting a no-break space as a separator and joining with one plain space; `wp_trim_words()` splits on ASCII white space only and keeps runs of no-break spaces (visible gaps). `harlow_card_text()` splits on `\s` with `/u`. The checks fold only HTML's own white space, never U+00A0. | verify_lists: the job card's text, one word short and with wide gaps. |
| WordPress 6.7 writes `sizes="auto, …"` on lazy pictures; live does not. `wp_img_tag_add_auto_sizes` returns false. | verify_lists: `sizes: 'auto, (max-width: 800px) …'`. |
| WordPress's rules for loading hints (lazy, decoding, fetchpriority) differ from what Elementor gave each live page (the footer logo lazy on posts only, the header logo's priority missing on four posts). Tried: printing the logos as Media Library pictures; WordPress then decided differently again. They change when a picture downloads, not how it looks: counted apart by the checks, listed in README. | verify_chrome on the 25 item pages: only `loading` and `fetchpriority` differ. |
| New content types answer 404 until the address rules are written again; the installer flushes them. | `curl` on `/news/<item>/`: 404 after the first install. |
| WP-CLI runs as no user, so `wp_insert_post()` filters content through kses. The installer turns kses off for its own data and on again after. | (avoided; the posts' content holds Elementor markup) |
| WordPress's draft privacy page comes with its suggested text in blocks, which loads block styles live does not have. Adopted, it is emptied. | verify_chrome after a rebuild: `inline style 'wp-block-heading-inline-css'` on policy. |
| Python's `str.replace()` replaces every match: a card's text and the window's text began with the same words, and both were replaced. Replace once, or anchor the match. | The generator's popup assertion failed. |
| A long patch script inside a Bash heredoc broke on its quotes (`unexpected EOF while looking for matching`). Scripts go into a file with the editor and are run from there. | Two failed tool calls. |
| WordPress 7 adds `wp-block-paragraph` and `wp-block-list` in `render_block_core/paragraph` (and `…/list`), which runs after `render_block`: a `render_block` filter at any priority cannot take them off. The theme filters the named hooks at priority 20. | verify_wp: `<p> class: 'wp-block-paragraph' / reference 'None'` on every page, with a `render_block` filter in place. |
| An empty container written as a self-closing block (`<!-- wp:harlow/container {...} /-->`) loses the white space it had inside. Blocks that hold blocks are always written open and closed. | verify_wp: `#1 <div> text: '' / reference ' '` on 20 pages, an empty first section. |
| Rank Math writes `rel="noopener"` (and by its settings nofollow and a new tab) on links in content as a page is printed (`rank_math/noopener`, `rank_math/link/add_attributes`); live's pages show none, except the home page's footer (a side effect of the footer being in that page's content there). Both filters return false; the home page's footer is printed as on every page (README). | verify_wp: `<a> rel: 'noopener' / reference 'None'` on the home and industrial pages. |
| `wp_remove_targeted_link_rel_filters()` is deprecated since 6.7: WordPress no longer adds `rel="noopener"` on save. | `PHP Deprecated` in debug.log. |
| A block registered twice (stage 2's own `register_block_type( 'blocks/loop' )` and stage 3's loop over `blocks/*`) writes a notice on every request. One registration. | `Block type "harlow/loop" is already registered` in debug.log. |
| WordPress loads a small stylesheet for each core block a page uses (`wp-block-paragraph-inline-css`, `wp-block-list-inline-css`) once pages hold paragraphs and lists; `should_load_separate_core_block_assets` returns false, so they come as the block library, which is dequeued (the reference holds the rules it uses). | verify_chrome after the pages got their blocks: `inline style 'wp-block-paragraph-inline-css'` on 21 pages. |
| A command line on Windows holds about 32,000 characters: verify_lists handed the pages' saved content to WP-CLI on its command line, failed, and the `finally` that puts the pages back failed the same way, leaving nine pages with only their lists. Data goes through a file in `_env/` (`/env` in the container); `wp harlow install --restore` put the pages back. | `FileNotFoundError: [WinError 206] The filename or extension is too long`; the home page without its header. |
| Chrome reports an auto side margin as its length or as `0px` depending on the layout pass (a boxed container's inner box: 134.5px on one side, 0px on the other, same box). verify_render compares side margins through the boxes. | verify_render: home page at 1440, one element, margins only. |
| The block editor makes every block and every box of blocks `position: relative` (content.css, two classes), outranking Elementor's one-class `.e-con { position: var(--position) }`: an absolute box of the home page's banner fell into the flow beside the other. `canvas.css` undoes it at two classes, later, and restores the design's two low-specificity position rules (widgets, containers). | verify_editor: `position 'relative' / page 'absolute'`; the banner's boxes 715 and 705px wide side by side. |
| The editor keeps every block's `id` for itself (`block-<clientId>`), so `#fullpage { overflow: hidden }` (utilities.css) never matched in the canvas. The block carries the page's id as `data-html-id`, and canvas.css has the one id rule on a block. | verify_editor: `overflow 'visible' / page 'hidden'` on the main container. |
| `vh` in the canvas is the canvas frame's height (771px under the editor's bar). The check sizes the window so the frame is 900px tall. | verify_editor: `min-height '771px' / page '900px'`. |
| A block has one root element: the client logos, printed as their cards alone, needed a holder in the editor, and `.e-con-inner > .elementor-widget` stopped matching (no `max-width`, the cards 90px tall instead of 111). The list prints the logos' container around the cards (`layout: box`). | verify_editor: `max-width 'none' / page '100%'` on ten cards. |
| The canvas carries hundreds of the editor's own custom properties on every element (`--wpds-*`, `--wp--preset--*`). Custom properties are compared where the page has them. | verify_editor: every element different, the first four differences all `--wpds-…`. |
| Chrome gives anything typeable `overflow-wrap: break-word` and `line-break: after-white-space`, and rich text has `white-space: pre-wrap`, also where it is not editable (a synced pattern). Counted by name; a line ending in a space is a few px wider there. | verify_editor: `white-space-collapse 'preserve' / page 'collapse'`, two spans 4.3px wider at 479. |
| What a script draws on the page is not in the canvas: the banner video's size (background-video.js), the carousels' slide widths, the header's logo width after a scroll (header.js), the first question open. The edit views do the same maths; what a script rebuilds (menus, a carousel's copies, the history slider) is held as one element. | verify_editor: the video 810px tall against 900; `style attribute: 165px` on the header logo. |
| Core's Custom HTML block (WordPress 7.1) previews its markup in a sandboxed frame of its own, which the page's stylesheets do not reach. The three pieces of raw prose markup are `harlow/markup` blocks, drawn in place. | Reading core's `HTMLEditPreview`: `SandBox`. |
| Rich text shows white space as written and turns a line break in the words into `<br>` when they are edited: a heading with a line break at its end was two lines in the canvas. gen_blocks writes typed words without stray white space. | verify_editor: a heading 52px tall against 26. |
| A picture drawn by the edit view from the Media Library record had no srcset; the page's browser picks another file from its srcset, a hair different in proportion. Pictures in the canvas are the server's markup. | verify_editor: a picture 78.8px tall against 79.1 at 479. |
| A click check: the page's `scroll-behavior: smooth` moved the target after its point was read, and focus left on a deselected block made the next click in it select nothing. Scroll instantly; blur before each click. | verify_editor: `covered by None` on 113 of 118 words; `a click selected nothing` on the history slider's second word. |
| Some pictures and words lie under another element of the design on the page too (white fade boxes over the carousels' edges, decorative lines under sections). Listed apart, not repainted; List View selects them. | verify_editor: a carousel card `under` a `z-index: 1` box. |
| A menu marks the page it is printed on as current, and a pager links to its own page's next one: a pattern rendered away from its page differs from its source. The check renders each pattern in its source page's context. | verify_editor patterns: `current-menu-item` missing on seven patterns. |
| phpcs refuses wp-scripts' `build/index.asset.php` (a file the build writes). `theme/build/` is excluded. | phpcs: `Filenames should be all lowercase` on index.asset.php. |
| After the machine sleeps or restarts, Docker Desktop is not running, and the first start can exit by itself; started a second time it comes up. `env.sh` says "The stack is not running". | `failed to connect to the docker API` twice in one session. |
| A pipeline ending in `| head` reports the exit code of `head`: a failed generator did not stop the chain, and a comparison started on half-written files. Run the chain with `&&` and no pipe, redirecting to a log. | A traceback in the first lines and `49 pages built` after it. |
| A git worktree of tag html-v1 inside the scratchpad failed on Windows (`Filename too long`: one page name is 140 characters). The reference checkout is `../_ref-v1`, a short path. | `git worktree add` error. |
| A network drop (`ERR_NAME_NOT_RESOLVED`) or a Cloudflare delay over 90s killed a 30-minute run. style_check retries a page 4 times, 20s apart, and keeps results after every page (`_capture/style_check.partial.json`), resuming from it. compare and style_check runs on a few pages merge into the full results. | Two runs lost to the network. |
