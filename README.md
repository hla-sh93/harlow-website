# Harlow Group website

**The complete English website of https://www.harlowgroup.com/ as static HTML pages:**
all 49 English pages, plain HTML with readable CSS and JS, no platform runtime, matching
the live site at 1440x900 and 479x900. Open `index.html`, or serve the folder with any
static server.

A rebuild in two phases:

1. **html site v1** (done, tag `html-v1`): every public English page as plain HTML with
   readable CSS and JS, rendering identically to the live site at 1440x900 and 479x900.
2. **WordPress theme**: a classic theme built from the approved HTML site.

## Layout

| path | what |
|---|---|
| `*.html` | the pages, named after the live path (`/news/x/` -> `news-x.html`, home `index.html`, `404.html`). Generated: do not edit |
| `assets/css/` | stylesheets in load order: `tokens`, `base`, `layout`, `components`, `navigation`, `modules`, `design/globals-*` (the rules of each Elementor document that name no element), the seven `design/` axis files (`type`, `space`, `layout`, `size`, `surface`, `effects`, `misc`: one class per design value, see `_vocab/vocabulary.md`), `utilities`, `animations`. All generated except `modules.css` |
| `assets/js/` | one small module per behaviour (header, nav menu, entrance animations, background video, carousel, gallery, accordion, history slider, people popups, lightbox, cookie bar, page transition). Hand-written, no libraries |
| `assets/uploads/` | images, video and PDFs, same paths as `wp-content/uploads/` |
| `assets/fonts/`, `assets/vendor/` | the font faces live really loads, and plugin images and fonts the pages use |
| `_inventory/` | stage A: the inventory, every URL and the decisions |
| `_vocab/` | stage R: the design vocabulary (`vocabulary.md`: the palette, type sizes and spacing the site uses), which classes each element wears, and the intermediate rules |
| `_capture/` | stage B: live server HTML, settled DOM, geometry baseline, asset list (screenshots are not committed) |
| `_source/` | the live platform's own CSS and JS, kept for reference and checks only; never loaded by a page |
| `_tools/` | the tools that build and check everything (see AGENTS.md) |
| `theme/` | phase 2: the WordPress theme "Harlow Group" (see AGENTS.md, "The theme") |
| `docker-compose.yml`, `_tools/env.sh` | phase 2: the local WordPress |

## How to run

Any static file server from the project root, then open http://localhost:8000/:

```bash
python -m http.server 8000
```

### The local WordPress (phase 2)

Needs Docker Desktop running. Build it once (and again whenever you want it fresh from
the repository):

```bash
./_tools/env.sh rebuild --yes
```

Then WordPress is at http://localhost:8090 (admin login in `.env`, written by the first
rebuild), phpMyAdmin at http://localhost:8091 and every e-mail the site sends at
http://localhost:8035. `./_tools/env.sh up` and `./_tools/env.sh down` start and stop
it; `python -u _tools/verify_env.py` proves it works.

What can be changed from the dashboard so far (stage 1), with the header and footer
staying identical to the reference until something is changed:

| what | where |
|---|---|
| the header menu, the three footer columns (a column's heading is its menu's name) and the links under them | Appearance → Menus |
| logos, footer background, the heading over the social links, copyright line, credit | Appearance → Customize → Header and footer |
| the five social links (an empty one hides its icon) | Appearance → Customize → Social links |
| the label of the Arabic link, and where it goes from a page with no Arabic version | Appearance → Customize → Language link |
| every word of the cookie bar and its settings window, and the window's logo | Appearance → Customize → Cookie bar |
| the picture of the page transition | Appearance → Customize → Page transition |
| the brand colours: blue, dark, accent, light surface, text | Appearance → Customize → Brand colours |
| posts, news, projects, gallery items, jobs, business models (with their icon and page), Harlow's people, testimonials (with their position), client logos (in their order) | their own menus in the dashboard; every list and carousel shows them by itself |

The 22 pages are built from blocks and look like the reference (the 25 item pages, the 404
page and the blog's second page get their templates in stage 5). Editing a page's blocks in
the editor comes in stage 4; until then the editor shows them as blocks it cannot draw.
The major clients section is one synced pattern (Appearance → Patterns), and the section
library and page starters are in the editor's Patterns, under Harlow sections and Harlow
page layouts. The items and pictures are live's, with live's ids, addresses
and dates; the pictures are in the Media Library with every size live has.

To rebuild the static pages after changing a generator:

```bash
python -u _tools/build_css.py && python -u _tools/atomize.py && python -u _tools/build_pages.py
```

## Deliberate differences from live

| difference | why |
|---|---|
| Only the English pages; the header's language link opens the live Arabic page | decision 1: English first |
| No Google Tag Manager, GA4 or Microsoft Clarity | decision 4: back in phase 2 |
| Cloudflare Turnstile is not loaded; its widget's slot (71px) stays, empty, so the form keeps its live layout. The forms keep Contact Form 7's markup and field names but do not send | decision 4: a static site has no form backend; the real form drops in at phase 2 |
| The Honeypot plugin's hidden spam-trap fields are not added | they are added at run time by the plugin; phase 2 |
| Emails are plain `mailto:` links | live hides them behind Cloudflare's email obfuscation |
| The cookie bar has the same markup and look; the choice is kept in `localStorage`, no cookie is set; the settings dialog opens as a simple overlay | decision 5; nothing here needs consent |
| Images open in a small own lightbox (dark backdrop, arrows, counter, title), not Elementor's | Elementor's lightbox is part of its runtime, which is not shipped |
| Section backgrounds load at once instead of when scrolled near | Elementor's background lazy-loading is runtime; the settled look is the same |
| The history slider's mobile picture for the fourth milestone shows the full-size image | live points at a `-sm` file that does not exist (404), so phones get no picture |
| No JavaScript errors | live throws on 48 of 49 pages (the history slider script running where there is no slider) and once from the Organization Chart plugin |
| Logo scale and header background "motion effects" are not implemented | on live they are set with speed 0 and do nothing visible |
| Hover submenus and the burger menu are an own module with SmartMenus' timings (250ms open, 500ms close) | no jQuery or SmartMenus is shipped |
| Two kinds of dead CSS are not carried: Elementor's `margin-center` (not a CSS property; browsers ignore it) and rules for the motion-effects layer Elementor's runtime adds (that layer is not in this markup) | they did nothing on live |
| No `<link rel="prerender">` on hovering a link | Elementor's page transition adds it; browsers have dropped prerender |
| WordPress theme: pictures' loading hints (`loading="lazy"`, `decoding`, `fetchpriority`) follow WordPress's rules, not the ones Elementor gave each live page | they decide when a picture downloads, not how it looks; the checks count them apart |
| WordPress theme: the pages of business models, people and team members lead to the home page | as on live (301) |
| WordPress theme: the home page's footer links open in the same tab, without nofollow, as on every other page | on live's home page Rank Math gave five of them a new tab and nofollow, because there the footer is part of the page's content |

## Known gaps

- All 49 English pages are built. The 49 Arabic pages come later (decision 1).
- The latest checks, one row per page, are in `_capture/report.md`: geometry 0 differences
  on all 49 pages at 1440 and 479, 0 broken links, 13 behaviours passing. The computed-style
  check, which reads live in real time, flags three pages (harlows-people, one news item,
  one project) with differences that move between pages from run to run on live's side;
  see AGENTS.md.
- The About page's "Group chart" section is hidden on every device on live; its markup is
  kept, the Organization Chart plugin's script is not.
- Content gaps on live are kept as they are for now (inventory decision 6), for example the
  gallery item at `gallery-item-british-embassy.html` titled "Bismayah New City".
