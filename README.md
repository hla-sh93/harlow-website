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

The site's pages, pictures, items, forms, menus and search settings are installed by the
theme itself: Appearance → Site pages shows what installing will do to each page and has
one button, "Install the pages" (`wp harlow install` is the same code). It finds what is
already there and makes only what is missing, so it fills a copy of the live site in place
(ids, addresses and history kept); a page with content of its own (Elementor's) is left as
it is unless the box is ticked, and then its content is kept in its Revisions. Posts keep
their texts, nothing is deleted, and installing again changes nothing. It works in
15-second rounds, so no request outlasts a host's time limit. `rebuild --yes --empty`
builds WordPress without the site, for that button.

What can be changed from the dashboard so far, with every page staying identical to the
reference until something is changed:

| what | where |
|---|---|
| the header menu, the three footer columns (a column's heading is its menu's name) and the links under them | Appearance → Menus |
| logos, footer background, the heading over the social links, copyright line, credit | Appearance → Customize → Header and footer |
| the five social links (an empty one hides its icon) | Appearance → Customize → Social links |
| the label of the Arabic link, and where it goes from a page with no Arabic version | Appearance → Customize → Language link |
| every word of the cookie bar and its settings window, and the window's logo | Appearance → Customize → Cookie bar |
| the picture of the page transition | Appearance → Customize → Page transition |
| the brand colours: blue, dark, accent, light surface, text | Appearance → Customize → Brand colours |
| posts, news, projects, gallery items, jobs, business models (with their icon and page), Harlow's people, testimonials (with their position), client logos (in their order) | their own menus in the dashboard; every list and carousel shows them by itself, and each item's page shows its title, date, picture and text |
| a project's short description, year and pictures; a gallery item's pictures | the item's screen, the box under the editor |
| the forms' fields, messages and where their mails go | Contact → Contact Forms (Contact Form 7) |
| which form a page shows | the editor: the form's block, its shortcode in the sidebar (the form is shown as the page shows it) |
| what search results show of a page | the page's Excerpt in the editor |
| every word of a page: headings, paragraphs and lists, buttons, questions and their answers, the lines of icon lists | the page in the editor (Pages → Edit): click the words and type |
| a page's pictures, their words for screen readers and titles, and the links of pictures and buttons | the editor: "Replace picture" in the toolbar (Media Library), the rest in the sidebar |
| a box's background picture and video, a button's background picture (empty: the design's own) | the editor's sidebar: Background (a picture from the Media Library; a video from it or by its address) |
| the icons of buttons, icon lists, social links and the accordion | the editor's sidebar, from the icons the site uses |
| which menu a menu shows; which items a list shows, how many and in what order | the editor's sidebar |
| the words of a list's card buttons (Read More, Apply Now), the buttons' arrow, the badge on the post cards' picture; a carousel's arrows (empty: the cards' and the design's own) | the list's sidebar in the editor: Cards, Arrows |
| what every item page of a type shows besides the item (its headings, decorations, the major clients): posts and news, projects, gallery items, jobs | Appearance → Patterns: Item page: …, edited as a page is; the item's own title, date, picture, text and fields show where the template's blocks say |
| an element's style, as in Elementor, for desktop, tablet or mobile: background type (none, a colour, a gradient, a picture from the Media Library with position, size, repeat, attachment and a colour over it); text colour, font, size (any value, the design's sizes offered), weight, italic and underline, capitals, line height, letter spacing; alignment; padding and margin per side with a unit; width and minimum height; a picture's width, height, fit and rounded corners; border, rounded corners, shadow, opacity; hide on a device; custom CSS for the element (`selector`, as in Elementor). Any colour from a picker, the brand's five and the design's palette offered first. "Reset" puts the design's own back; an element never styled stays the design's, identical to the live site | the editor's sidebar, Styles tab (the brush), one panel per group |
| an element's design from the design's own vocabulary (swatches and lists of the values the site already uses) | the editor's sidebar, Settings tab: Design and More design; the raw classes under Advanced, for developers |
| the rest of an element's style, as in Elementor Pro: the overlay layer, slideshow and video backgrounds, radial gradients, shape dividers, a link on a whole box, Flexbox and Grid, borders and corners per side, shadows, blend modes, word spacing, text outline, 3D transforms, hover states and hover animations, entrance animations, scrolling and mouse effects, sticky, display conditions, custom attributes, the extra devices (widescreen, laptop, tablet extra, mobile extra) | the editor's sidebar, Styles tab, the same panels |
| a widget's own parts (a tab's title, a price table's button, a carousel's arrows…), each with its colours, typography, spacing, border and hover state | the widget's Styles tab: one panel per part |
| site-wide design, as Elementor's Site Settings: global colours and fonts (offered in every picker), typography (body, links, H1 to H6), buttons, images, form fields, layout and the page's background, the lightbox, the page transition and preloader, breakpoints, uploaded and Google fonts, custom code | Appearance → Customize → Site settings (empty: the design's own; an element styled in the editor keeps its own) |
| every Elementor widget, Free and Pro: tabs, toggles, counters, progress bars, countdowns, carousels, galleries, videos, maps, price tables, testimonials, forms, posts, the site's and a post's parts, and the rest (58 added to the site's own kinds) | the editor's inserter (+), Harlow widgets |
| a form made in the editor, its fields, actions (mail, a webhook, a redirect, a popup) and what it collected | the Form widget's sidebar; Submissions in the dashboard (with a CSV export) |
| templates for the header, footer, item pages, archives, search, the 404 page, a list's card, and popups, each shown where its conditions say (the entire site, a page, a type, a category…) | Appearance → Theme Builder (the template's conditions and popup settings in its sidebar) |
| live words in any text: a page's or post's title, date, author, a custom field, the site's name, today's date…; a link to the post, its author or a field | the words' toolbar in the editor: Dynamic tag; a link field's Dynamic choice |
| an element's style copied to another | the block's menu (⋮): Copy style, Paste style |
| roles that may change the words and pictures only; maintenance or coming-soon mode | Appearance → Editing and maintenance |
| icons from a library of 345, or an uploaded SVG file | the icon chooser in the editor's sidebar |
| new sections and pages: one section of every shape the pages have, one starter per kind of page | the editor's Patterns: Harlow sections, Harlow page layouts |
| a new page: its kind (front, business, about, older business, listing, content) and, if wanted, that kind's ready sections with real words to replace | Pages → Add: "What kind of page is this?" |
| a page's kind: whether it is on the front page's canvas, and whose page-wide design rules it loads | the page's Template, in the editor's sidebar |
| a copy of a page or item, as a draft | "Duplicate" under it in its list |
| a page's original sections, put back | the editor's sidebar: Original sections (nothing is saved until Save; Undo takes it back) |
| a page's or item's address | the editor's sidebar (its slug): the old address redirects (301) to the new one, listed under Rank Math → Redirections; links in the pages, links typed in posts' and items' texts, and typed menu links follow |
| a page's or item's SEO: its title and description in search results, focus keywords, social picture, robots, its own schema | the Rank Math panel in the editor (Rank Math's button in the top bar; for a gallery item, the Rank Math box under its title) |
| the site's pages, pictures, items, forms and menus, installed or filled in place | Appearance → Site pages: Install the pages (a page's own content replaced only with the box ticked, and kept as a revision) |
| the organization search engines show: name, logo, address, map position, e-mail, telephone, social profiles; which page is the about page and which the contact page | Rank Math → Titles & Meta → Local SEO and Social Meta |
| where a button or picture links | the editor's sidebar: a page of the site picked from a list (the link follows the page), or a typed address |

All 49 pages are on WordPress and look like the reference: the 22 pages built from blocks,
the 25 item pages from live's four single templates (posts and news, projects, gallery
items, the job), the blog's second page, and the page that is not there. The contact form
and the job application are Contact Form 7's, as on live: they refuse what is missing and
send their mails (to the site's administration address, answering to the sender; locally
every mail lands in Mailpit). Search results and a category's posts are printed as live
prints them; date archives lead home and author archives are not found, as on live. Each
page is on its kind's template, and a new page made from a kind's ready sections is its
kind's model page, element by element. A changed address redirects through Rank Math's
redirections with its Auto Post Redirect setting, which the local environment turns on;
on the live site that setting is the owner's to turn on (stage 12). In
the editor each page
looks as it does on the site, drawn by the site's own stylesheets: the canvas is checked
against the page at three widths, element by element. Menus, lists, the header and footer
are drawn as the site prints them; their contents are kept where the table says. The major
clients section is one synced pattern (Appearance → Patterns): changed once, it changes on
every page that shows it. A few pictures and words lie under another element of the
design, on the site as in the editor (the carousels' faded edges, two decorative lines);
the editor's List View selects them. The items and pictures are live's, with live's ids,
addresses and dates; the pictures are in the Media Library with every size live has.

The editor's code is in `theme/editor/` and `theme/blocks/*/edit.js`, built into
`theme/build/` (committed, so the theme needs no build to be installed). After changing it:

```bash
npm install
npm run build
npm run lint
```

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
| WordPress theme: search results leave out team members and testimonials | live lists them, but their links only lead to the home page |
| WordPress theme: in a post's (and the front page's) head, "Written by" and the author's schema name the site's own user | live names its administrator account (`adminfirstonline2`) on every post; the posts are the site administrator's here, and on live they keep their author |
| WordPress theme: the "Time to read" in the head differs on two pages (the front page, corporate policies) | Rank Math counts the words of the stored page: on live Elementor's copy, here the blocks; the other 20 pages read the same |
| WordPress theme: the order of search results can differ from live's | live searches Elementor's plain copy of each page, the theme searches the pages' blocks; the items found are the same kinds |
| WordPress theme: the home page's footer links open in the same tab, without nofollow, as on every other page | on live's home page Rank Math gave five of them a new tab and nofollow, because there the footer is part of the page's content |

## Known gaps

- All 49 English pages are built. The 49 Arabic pages come later (decision 1).
- Focus keywords: Rank Math does not print a page's focus keywords, so only those live's
  heads show are installed (four posts and pages); the rest are live's to carry over, or
  the owner's to write in the Rank Math panel.
- On the live site, Rank Math's Local SEO module and the settings the installer lays
  (`install/seo.json`) should be compared with live's own before the live step (stage 12).
- The latest checks, one row per page, are in `_capture/report.md`: geometry 0 differences
  on all 49 pages at 1440 and 479, 0 broken links, 13 behaviours passing. The computed-style
  check, which reads live in real time, flags three pages (harlows-people, one news item,
  one project) with differences that move between pages from run to run on live's side;
  see AGENTS.md.
- The About page's "Group chart" section is hidden on every device on live; its markup is
  kept, the Organization Chart plugin's script is not.
- Content gaps on live are kept as they are for now (inventory decision 6), for example the
  gallery item at `gallery-item-british-embassy.html` titled "Bismayah New City".
