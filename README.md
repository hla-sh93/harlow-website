# Harlow Group website

A rebuild of https://www.harlowgroup.com/ in two phases:

1. **html site v1** (current): every public English page as plain HTML with readable CSS
   and JS, rendering identically to the live site at 1440x900 and 479x900.
2. **WordPress theme**: a classic theme built from the approved HTML site.

## Layout

| path | what |
|---|---|
| `*.html` | the pages, named after the live path (`/news/x/` -> `news-x.html`, home `index.html`, `404.html`). Generated: do not edit |
| `assets/css/` | stylesheets in load order: `tokens`, `base`, `layout`, `components`, `navigation`, `modules`, `docs/*` (one per Elementor document), `utilities`, `animations`. All generated except `modules.css` |
| `assets/js/` | one small module per behaviour (header, nav menu, entrance animations, background video, carousel, gallery, accordion, history slider, people popups, lightbox, cookie bar, page transition). Hand-written, no libraries |
| `assets/uploads/` | images, video and PDFs, same paths as `wp-content/uploads/` |
| `assets/fonts/`, `assets/vendor/` | the font faces live really loads, and plugin images and fonts the pages use |
| `_inventory/` | stage A: the inventory, every URL and the decisions |
| `_capture/` | stage B: live server HTML, settled DOM, geometry baseline, asset list (screenshots are not committed) |
| `_source/` | the live platform's own CSS and JS, kept for reference and checks only; never loaded by a page |
| `_tools/` | the tools that build and check everything (see AGENTS.md) |

## How to run

Any static file server from the project root, then open http://localhost:8000/:

```bash
python -m http.server 8000
```

To rebuild after changing a generator:

```bash
python -u _tools/build_css.py
```

```bash
python -u _tools/build_pages.py
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
| No `<link rel="prerender">` on hovering a link | Elementor's page transition adds it; browsers have dropped prerender |

## Known gaps

- Stage D: the home page and one page of each kind are built (11 of 49); the other 38 are
  generated in stage E.
- The About page's "Group chart" section is hidden on every device on live; its markup is
  kept, the Organization Chart plugin's script is not.
- Content gaps on live are kept as they are for now (inventory decision 6), for example the
  gallery item at `gallery-item-british-embassy.html` titled "Bismayah New City".
