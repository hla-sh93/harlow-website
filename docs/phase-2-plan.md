# Phase 2 plan: the Harlow Group WordPress theme

Status: answered by Hla on 2026-10-28 (section 8); the steps and timing are in section 9.
Stage R done on 2026-10-28 (tag `html-v1.1`): the per-element design is 1,111 classes in
`assets/css/design/`, the vocabulary is in `_vocab/vocabulary.md`, and the 49 pages match
html-v1 in every computed property (117,847 elements, 1440/900/479) and live in geometry.
Stage 0 done on 2026-10-28 (tag `stage-0`): WordPress 7.1 runs locally at
http://localhost:8090 with the empty `harlow` theme, Contact Form 7 and Rank Math;
`_tools/verify_env.py`: 21 checks, 0 failed, after a rebuild from a wiped database.
Stage 1 done on 2026-10-28 (tag `stage-1`): the header, footer, cookie bar, language
switcher and page transition are the theme's, from WordPress menus and Appearance →
Customize (site details, social links, cookie bar, page transition, brand colours), and
identical to the reference on the 22 pages WordPress has (`verify_chrome.py`,
`verify_chrome_render.py`, `verify_settings.py`). The other 27 pages arrive with stages 2
(posts and items), 3 (home) and 5 (the blog's pager). Two items of section 1 move: the
offices are not in the header or footer but on the Contact page, so they come with it
(stage 3); the brand fonts come with the editor (stage 4), which must load the same faces.
Next: stage 2 (content types and their data), after Hla's go.

Starting point: `html-v1` (github.com/hla-sh93/harlow-website), the 49 English pages
matching live at 1440x900 and 479x900. It stays in the repository as the reference every
check of this phase measures against.

---

## 1. What "fully controllable and dynamic" means here

Everything below is changed from the WordPress dashboard, with no code and no build.

| what | where it is changed | how |
|---|---|---|
| Every heading, paragraph, list, label, button text | the page, in the block editor | typed in place |
| Every picture, logo, background picture | the block's sidebar | Media Library |
| Every icon (lists, contact details, social links, arrows) | the block's sidebar | an icon picker over the icon set the site uses, plus "upload an SVG" |
| Every link and button target | the block's sidebar | a page picked from the site's pages, or a typed address |
| Section backgrounds | the section's sidebar | a picture from the Media Library, a shade over it, a video for heroes |
| Sections of a page | the block editor | add, remove, reorder, duplicate; insert from the section library (one ready section of every shape the site has) |
| Pages | Pages → Add | "What kind of page is this?" lays down that kind's ready layout (its template and every section, real words to replace); or start empty. Duplicate any page. Restore a page's original sections |
| Dynamic content | its own menu in the dashboard | Blog posts, News, Projects, Gallery items, Jobs, Testimonials, Business models, Harlow's People, Team members, Client logos: add, edit, order; every list and carousel on the site shows them by itself |
| How a list or carousel shows them | the block's sidebar | which type, how many, order, category, columns per device, slides per view, autoplay |
| Menus | Appearance → Menus | header mega menu, footer menus, language link |
| Site details | Appearance → Customize | logos, offices and their contact details, social links, footer text and credit, cookie bar text, page-transition image, the header's scrolled colour |
| Brand colours and fonts | Appearance → Customize → Brand | primary, accent, dark, text, light surface; heading and body font from a short list. The whole site follows, because every colour choice on a block is a role (see 2) |
| SEO of every page | the page, Rank Math panel | title, description, social image, robots |
| Address (slug) of a page | the page | changed freely; the old address redirects (301) and links follow |
| Forms | Contact → Contact Form 7 | fields, recipients, messages; Turnstile on |
| Arabic (stage 11) | WPML | every page and item translated; the theme mirrors itself right to left |

## 2. Where freedom stops, and why

- **Colours, sizes and spacing on a block are words, not free values.** A heading is
  "eyebrow", "section title" or "highlight"; a section is "tall" or "compact", on "light",
  "brand" or "dark". The words come from one table taken from the site itself (section 3).
  This is what keeps a new page looking like the site, and what lets the brand colours
  change the whole site at once. The values behind the words (the palette and fonts) are
  the owner's, in the Customizer.
- **No free colour picker and no free CSS per element.** Elementor-style freedom ends the
  guarantee that every page matches the design: one picked colour is one page that no
  longer follows the brand. For what no word covers there is the block's "Additional CSS
  class(es)" field; every use is counted, and that count only shrinks.

## 3. The step this site needs first: from Elementor's per-element CSS to a vocabulary

The live site was built in Elementor, which stores the design **per element**:

| | count |
|---|---|
| per-element CSS rules (keyed on ids like `elementor-element-7ad0296`) | 2,077 in 36 documents |
| distinct declaration sets among them | 697 |
| containers / images / headings / nav menus | 1,292 / 741 / 650 / 247 |
| text blocks / icon lists / dividers / buttons | 116 / 111 / 66 / 44 |

A section added in WordPress would have no id-keyed rule, so it would have no style. The
theme can only be controllable if the design is first expressed as classes and words.

**Stage R, before any WordPress (still HTML, still measured against live):**

1. `_tools/vocab.py` reads every per-element rule, turns values into tokens (the spacing,
   type, colour and width scales the site really uses) and groups each component's rules
   into variants. Output: `_vocab/report.md`, every variant with its count and pages.
2. Each variant gets a name (`heading: eyebrow / title / title-highlight / card-title`,
   `section: tall / normal / compact`, `surface: light / brand / dark / picture`, …),
   reviewed with Hla.
3. A class-based stylesheet per component (`assets/css/components/`, readable, on the
   tokens), and the 49 reference pages re-expressed with those classes, with no id-keyed
   rule left.
4. Gate: `compare.py` and `style_check.py` against live, 0 of 49 pages differ, tag
   `html-v1.1`. This vocabulary becomes the theme's option table (`functions/design.php`).

One-off values that fit no variant stay as counted extra classes, listed in the report.

## 4. The site mapped to theme parts

**Blocks** (one per component; the final list comes out of stage R):

| group | blocks |
|---|---|
| layout | section (layout, spacing, surface, background picture/video), columns, grid |
| content | heading, text (core paragraph and list inside), image, button, icon list, divider, icon |
| site sections | page banner, hero with video, history slider, clients (logos), offices and contacts, form (Contact Form 7), accordion and item, people (cards with popup), gallery |
| dynamic | items grid (posts, news, projects, jobs, gallery), carousel (business models, testimonials), post header (date, title, featured image), post content |

**Templates**, one per kind of page (never per page, never chosen by slug):

| kind | template | pages today |
|---|---|---|
| K1 | front page | 1 |
| K2 | business | 6 |
| K3 | about | 1 |
| K4 | business (older layout) | 3 |
| K5 | listing | 6 |
| K6 | content | 6 |
| K7 | single post and news | 12 |
| K8 | single project | 7 |
| K9 | single gallery item | 5 |
| K10 | single job | 1 |
| K11 | 404 (plus a search results page, which live does not have) | 1 |

**Content types** keep live's names (`news`, `albahoo_project`, `gallery_item`, `job`,
`testimonial`, `business_model`, `harlows_person`, `team_member`), so the items already in
the live WordPress appear by themselves. Client logos become a list in the Customizer or a
small type of their own.

**Global settings** (Customizer): logos, offices, social links, footer, cookie bar,
preloader, header scroll colour, brand palette and fonts.

## 5. Stages

Each stage ends the same way: its checks and every earlier check it could break, the
output pasted, AGENTS.md updated, commit, tag, the push command, and a stop for Hla's go.

| stage | what | ends with |
|---|---|---|
| R | design vocabulary (section 3) | `html-v1.1`, 0 of 49 differ |
| 0 | environment: Docker with WordPress, MariaDB, phpMyAdmin, WP-CLI, Mailpit; Rank Math, Contact Form 7, Turnstile; `env.sh` save/restore/rebuild/package | a clean site from one command |
| 1 | skeleton and chrome: header mega menu and footer from WordPress menus, site details and brand palette in the Customizer, cookie bar, preloader | header and footer identical to the reference on every page |
| 2 | content types and their data: the types registered with live's names, sample items from the capture, the dynamic blocks | every list and carousel identical, fed by items |
| 3 | migration: the reference pages read into blocks (anything not expressible stops the tool), the section library, one ready layout per kind, the site's data file | every page's `<main>` identical, geometry at 1440 and 479 |
| 4 | blocks in the editor: the canvas paints what the page paints, every word and picture takes a click | the editor check on every page |
| 5 | blog, news, projects, gallery and job archives and singles, pager, 404, search, the contact form delivering mail | form within 1px, refused when wrong, delivered |
| 6 | page features: kinds and their ready layouts, originals and restore, duplicate, slug changes with 301, links picked from the pages | every page on its kind's template |
| 7 | SEO: every page's Rank Math fields from the reference; one title, description, canonical | every `<head>` checked |
| 8 | installer: Appearance → Site pages fills the pages in place (ids, addresses and history kept), makes only what is missing; tested on a copy shaped like live and on an empty WordPress | a second run changes nothing |
| 9 | the owner's test: every field of every block of every page changed from WordPress, read back, put back; a page of every kind built by hand | a row per page, 0 problems |
| 10 | handoff: theme zip, plugin list, notes in English and Arabic, installed on a WordPress that has never seen the repository | the package makes the reference site |
| 11 | Arabic: WPML, the 49 Arabic pages, right-to-left styles, measured against live's Arabic pages | 0 of 49 Arabic pages differ |
| 12 | live: full backup, a staging copy, every check on staging, then live | live answers and matches |

## 6. Checks of this phase

The phase 1 checks keep running against the reference (`compare.py`, `style_check.py`,
`behaviour.py`, `links.py`), now also against the WordPress pages. Added: the page `<main>`
against the reference element by element; header and footer on every page; every list
against its items; the editor (canvas = page, every block valid, every word clickable);
every word of the option table has a CSS rule and every block value is known; every
Customizer field reaches its place; templates; slugs; SEO heads; the installer; the owner's
test; WordPress coding standards (phpcs, lint) with exit 0; one `check.sh` running all of
them, each passed by its counting sentence.

## 7. Risks

| risk | what we do |
|---|---|
| Stage R finds many one-off values | counted extra classes, reviewed; the count only shrinks |
| The live WordPress holds Elementor content and WPML translations | the installer fills pages in place and keeps ids; Elementor is deactivated, not deleted; staging first |
| Live's content types are registered by a plugin or the child theme | read it on staging; the theme registers a type only where nothing else does |
| Translations need their links kept (WPML) | Arabic is its own stage, after English is approved |
| The theme zip is refused on upload (PHP limit) | the real upload tested; the limit written in the notes |
| The repository is public | no keys, licences, live database or export in it; Elementor Pro's files stay only in `_source/` as reference, never in the theme |

For scale: Osous was 57 pages in 7 kinds and took five weeks; this site is 49 English pages
in 11 kinds, with stage R and nine content types on top.

## 8. Questions and answers (Hla, 2026-10-28)

| # | question | answer |
|---|---|---|
| 1 | Who will read the code and judge it? | Hla |
| 2 | Freedom | **The current design, kept.** Full editing in place of Elementor, not a redesign: the vocabulary model; the brand palette keeps today's colours as its values |
| 3 | Where the theme lands | **A new theme named after the site** ("Harlow Group", slug and text domain `harlow`), on a **local WordPress first**. The live site is a later, separate step (stage 12) |
| 4 | Plugins, upload limit, mail | Decided for the local site: Rank Math (SEO fields) and Contact Form 7 (forms) as on live; Turnstile left off locally (it needs live's keys); WPML at stage 11; the cookie bar stays the theme's own module (no plugin). Docker gives 64 MB uploads and catches mail in Mailpit. Asked again only before live |
| 5 | Content | The items as they are on live (recreated locally from the capture, under live's type names, so live's own items show the same way later) |
| 6 | Arabic | Stage 11, after English is approved |
| 7 | Prefix | `harlow` |

## 9. The way to a complete, editable local site

Active working days per stage; each stage ends with a stop for Hla's go, so the calendar
also depends on review time. The estimate is widest for stages R and 3, where the
number of one-off styles decides the work.

| stage | after it, Hla can… | estimate |
|---|---|---|
| R | read the site's design as named words (the vocabulary report), and the HTML reference still matches live | 2–3 days |
| 0 | open WordPress on her machine (`http://localhost:8090`), empty, with the plugins | half a day |
| 1 | change the header and footer menus, logos, offices, social links and brand colours from the dashboard | 1–2 days |
| 2 | add and edit blog posts, news, projects, gallery items, jobs, testimonials, business models, people and client logos | 2 days |
| 3 | open every one of the 49 pages in WordPress, looking exactly like the reference, and insert sections from the library | 3–4 days |
| 4 | click any word or picture in the editor and change it, with the editor showing the page as it really looks | 2–3 days |
| 5 | see archives, single pages, 404 and search working, and send the contact form (caught locally) | 1–2 days |
| 6 | make a new page of any kind from its ready layout, duplicate, restore originals, change addresses safely | 1–2 days |
| 7 | edit every page's SEO in Rank Math | half a day |
| 8 | install all pages into any WordPress with one button | 1 day |
| 9 | trust it: every field of every page has been changed from WordPress and checked, one row per page | 1–2 days |
| 10 | hand over a theme zip that installs and makes the site on a clean WordPress | half to 1 day |

Total: about 16–23 working days, three to four weeks with reviews. The site becomes
editable in WordPress at the end of stage 3 (about halfway); stages 4–10 make that editing
comfortable, complete and proven. Arabic (stage 11) and live (stage 12) come after.

Needed on Hla's machine: Docker Desktop running (installed, version 29.8).
