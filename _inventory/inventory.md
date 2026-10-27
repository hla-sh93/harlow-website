# Stage A inventory: harlowgroup.com

Taken 2026-10-27 from the live site. Every number below comes from
`python -u _tools/inventory.py <raw_dir>` followed by `python -u _tools/inventory_report.py`
(the full per-URL table is `urls.csv`; per-page details are in `pages.json`), plus a headless
Chrome probe of one page per kind at 1440x900 and 479x900.

## In one paragraph

A bilingual WordPress site (English + Arabic RTL, WPML) built entirely with Elementor Pro on
the Hello Elementor child theme, behind Cloudflare. **98 pages to clone: 49 English, 49
Arabic**, in 11 kinds, plus 77 URLs that are 301 redirects. Each language has its own header,
footer and "Major clients" block. About 395 upload files, one 3 MB hero video and 4 PDFs.
One Contact Form 7 form (contact) and one CV form (job page), both behind Cloudflare
Turnstile. No lorem ipsum.

## Platform and plugins

| what | value | seen in |
|---|---|---|
| CMS | WordPress 7.1.2 | `generator` meta |
| Builder | Elementor 4.3.2 + Elementor Pro (theme builder, loop grid/carousel, motion effects, page transitions, nav menu) | `generator`, plugin asset paths |
| Theme | `hello-elementor` + `hello-elementor-child-theme` | body classes, asset paths |
| Languages | WPML 4.9.7 (`stt:5,1` = Arabic, English), `wpml-cms-nav` | `generator`, `/ar/` URLs, `hreflang` |
| SEO | Rank Math (robots `follow, index, max-snippet:-1, …` on all 96 pages; `sitemap_index.xml`) | HTML comments on 98 of 98 fetched pages |
| Forms | Contact Form 7 + Simple Cloudflare Turnstile + Honeypot | `wpcf7-form`, `cf-turnstile` |
| Other plugins | GDPR Cookie Compliance (cookie bar), Organization Chart (wpdevart), Simple Custom CSS and JS (2 CSS + 2 JS files) | asset paths |
| Hosting | Cloudflare in front (email obfuscation on, `cf-cache-status: DYNAMIC`) | response headers, `/cdn-cgi/l/email-protection` links |
| Page cache / lazy load | none found: no `data-lazy-src`, no `data-wpr-lazyrender`, 0 `data:` images after load | probe, lazy-marker scan |
| Analytics | Google Tag Manager `GTM-TM44GZ4J`, GA4 `G-0FNBP6L69T`, Microsoft Clarity | scripts on every page |

**Custom post types in WordPress:** `post` 7+7, `news` 5+5, `albahoo_project` 7+7,
`gallery_item` 5+5, `job` 1+1 (all have public single pages), and three that are data only,
whose single URLs 301 to the home page: `team_member` 28+28, `harlows_person` 4+4,
`business_model` 5+5. Also `testimonial` (5, shown in the About carousel, not in REST).
WordPress holds 22 pages per language today.

## Every URL

| | count |
|---|---|
| URLs known (sitemaps + REST in both languages + crawl of every internal link + two 404 probes) | 175 |
| answer 200 | 96 |
| 404 template (probe) | 2 |
| 301 redirects | 77 |

The 301s, all deliberate on live and not cloned as pages:

| redirect | count | target |
|---|---|---|
| `team_member` singles | 56 | home of the same language |
| `business_model` singles | 10 | home |
| `harlows_person` singles | 8 | home |
| `/ar/الصفحة-الرئيسية/` (old Arabic home, still in the sitemap) | 1 | `/ar/` |
| `/ar/latest-news/` (linked from the Arabic site) | 1 | `/ar/الاخبار/` |
| `/drc-cement-plant` (linked from content, no trailing slash) | 1 | `/drc-cement-plant-iraq/` |

Bare host and `http://` both 301 to `https://www.harlowgroup.com/`; a URL without its
trailing slash 301s to the one with it.

## Kinds of page

| # | kind | WordPress template | EN | AR | sections | pages |
|---|---|---|---|---|---|---|
| K1 | Home | `elementor_canvas`, page 17 / 5431 | 1 | 1 | 1 wrapper, 9 blocks | `/`, `/ar/` |
| K2 | Business landing | default (Al Khairat: `elementor_header_footer`) | 6 | 6 | 4–8 | al-khairat-thermal-power-plant-iraq, smart-metering-iraq, drc-cement-plant-iraq, construction-iraq, security-services-iraq, consultancy-iraq |
| K3 | About | default | 1 | 1 | 9 | about-us |
| K4 | Old business pages (orphans, see Q2) | default | 3 | 3 | 3–4 | energy-and-smart-solutions, industrial, security-services |
| K5 | Listing (loop grid) | default | 6 | 6 | 3–4 | blog, blog/2, latest-news, photo-gallery, work-with-us, harlows-people |
| K6 | Content page | default | 6 | 6 | 3–5 | contact-us, faq, policy, corporate-policies, sitemap, application-process |
| K7 | Single post / news | single template 2473 (same id in both languages) | 12 | 12 | 3 | 7 posts + 5 news per language |
| K8 | Single project | 4330 / AR 8047 | 7 | 7 | 4 | `albahoo-project/*` |
| K9 | Single gallery item | 2590 / AR 7715 | 5 | 5 | 3 | `gallery-item/*` |
| K10 | Single job | 4152 / AR 6170 | 1 | 1 | 6 | `job/*` |
| K11 | 404 | theme default | 1 | 1 | — | any unknown URL |
| | **total** | | **49** | **49** | | **98** |

Arabic slugs are Arabic (percent-encoded on the wire), except `/ar/contact-us/` and the
`news` slugs, some of which are English.

**Section archetypes** (one page per single template counted): 246 sections, 36 shapes;
the top 10 cover 78%. The recurring ones: page banner (empty spacer under the fixed header +
image banner), heading + image + text block, text-only block, "Major clients and associates"
logo block (a global template on every page except K9), loop grid with button, and the home
page's own blocks (video hero, history slider, business carousel, news grid).

## Shared chrome

| part | English | Arabic | notes |
|---|---|---|---|
| Header | Elementor `header#1179` | `header#6606` | fixed, 59px; transparent, turns `#0165A1` after 200px scroll and the logo shrinks 165→125px (custom jQuery file 1332); dropdown mega menu (SmartMenus), mobile toggle menu, language link |
| Footer | `footer#1066` | `footer#7508` | 4 menus, contact list (emails Cloudflare-obfuscated), social links, agency credit |
| Major clients block | `container#5532` | `container#7509` | on every page except K9 and K11 |
| Cookie bar | GDPR Cookie Compliance | same, English text on Arabic pages | bottom bar with Accept + settings |
| Page transition | Elementor Pro preloader image (`iva-icon.png`), fades on every navigation | same | |

## Behaviour and animation

| behaviour | where | spec lives in |
|---|---|---|
| Header colour + logo size on scroll | every page | `uploads/custom-css-js/1332.js` |
| Dropdown and mobile menu | every page | Elementor Pro nav menu (SmartMenus) |
| Background scroll + scale motion effects | header on every page | Elementor Pro motion_fx settings in `data-settings` |
| Entrance animations | 94 of 98 pages: fadeInUp 182, fadeInDown 107, zoomIn 49, slideInLeft 23, fadeIn 12, fadeInLeft 5, slideInRight 4, fadeInRight 2 | `data-settings` per element |
| Hero background video (mp4) | home | `background_video_link` |
| History slider with thumbnails and milestones | home | `uploads/custom-css-js/9163.css` + `9164.js` |
| Loop carousels (Swiper 8) | home (business models), about (testimonials) | Elementor Pro loop carousel |
| Accordion | faq | Elementor accordion |
| Person popup | harlows-people | `1332.js` |
| Image gallery | K8, K9 | Elementor gallery widget |
| Google Map iframe | Arabic contact only (English contact has none) | |

## Forms

| page | plugin | fields | anti-spam |
|---|---|---|---|
| contact-us (EN, AR) | Contact Form 7 | `your-name`, `mobile-phone`, `your-email`, `your-subject`, `your-message` | Turnstile |
| job single (EN, AR) | Contact Form 7 | `your-name`, `your-email`, `mobile-phone`, `resume` (file) | Turnstile |

## Fonts and assets

- Fonts, self-hosted by Elementor under `uploads/elementor/google-fonts/`: **Plus Jakarta
  Sans** (forced on everything by custom CSS 1399 with `!important`), **Cairo** for Arabic;
  Roboto, Roboto Slab and Nunito are loaded by the kit but nearly unused (to be confirmed
  in stage C).
- 395 distinct upload files referenced from page HTML (jpg 253, png 119, webp 14, svg 1,
  pdf 4, a few with odd suffixes), plus CSS background images (counted in stage B). The media
  library holds 396 (EN) / 414 (AR) attachments.
- Video: `uploads/2024/05/…harlow-banner-video-3mb-1.mp4`. PDFs: 4 corporate policies.

## Content gaps upstream (cloned as they are unless you say otherwise)

1. About: the "Group chart" section is hidden on all three devices, but the footer's
   "GROUP CHART" link points at it, so the link scrolls nowhere.
2. `/gallery-item/british-embassy/` is titled "Bismayah New City"; the real British Embassy
   item is `/gallery-item/british-embassy-2/`.
3. 10 gallery item pages have no meta description.
4. One Arabic post links to three internal pages with `?utm_source=chatgpt.com`.
5. The 404 page shows English text on the Arabic site.
6. The cookie bar is English on the Arabic site.
7. Duplicate titles: blog page 2 repeats page 1's title (both languages).
8. The old Arabic home slug is still in the sitemap (301).

## Bugs on live

1. `Uncaught SyntaxError: Unexpected identifier 'wpdaOrgChartPopup'` (Organization Chart
   plugin) appeared once in the in-app browser on the home page; the headless probe did not
   reproduce it on 15 pages × 2 widths. To be confirmed in stage B.
2. Pages with Turnstile log three console errors from the Turnstile iframe (CSP on
   `data:`), on contact and job pages.
3. Arabic home at 1440x900: 9 elements keep `elementor-invisible` after a full scroll, so
   those blocks never animate in (6 at 479). To be pinned down in stage B.

## Measuring hazards found already

- Playwright's bundled Chromium cannot play the H.264 hero video (request fails); geometry
  runs must use the Chrome channel or the video's poster.
- The hero video URL uses the bare host, which 301s to www.
- The cookie bar overlays the bottom of every page at first visit; measure with it accepted
  on both sides.
- Page heights at 1440 (live, after settling): home 6615, about 5427, smart-metering 3428,
  blog 2555, contact 2663, post 4116, project 2703, gallery item 1870, job 3631.

## Decisions (Hla, 2026-10-27)

| # | question | answer |
|---|---|---|
| 1 | Which languages | **English first**: html site v1 is the 49 English pages. The 49 Arabic pages are kept in `urls.csv` as `later: Arabic`. The header's language link points at the live Arabic page until then. |
| 2 | Old orphan pages (K4) and everything else | **The current site exactly**: every English page that answers 200 is cloned, K4 included. |
| 3 | Posts | All of them (7 posts, 5 news); what matters is every page design complete. The unpublished article designs in the parent folder are not part of v1. |
| 4 | Tracking (GTM, GA4, Clarity) and Turnstile | Left out of v1. Forms keep CF7 markup and field names and do not send. Back in phase 2. |
| 5 | Cookie bar and page-transition preloader | Rebuilt as small modules; measured with the cookie bar accepted on both sides. |
| 6 | Upstream gaps | Design defects may be fixed (listed in README as deliberate differences); content gaps wait for later. Cloudflare-obfuscated emails become plain `mailto:` links. |

**In scope for v1: 49 pages** (K1 1, K2 6, K3 1, K4 3, K5 6, K6 6, K7 12, K8 7, K9 5, K10 1, K11 1).
