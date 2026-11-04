# Harlow Group theme: handoff

This folder makes the Harlow Group website on a WordPress site.

| file | what it is |
|---|---|
| `harlow.zip` | the theme (about 14 MB, with the design's own pictures): uploaded from the WordPress dashboard |
| `harlow-pictures.zip` | the site's pictures (about 93 MB): for a new host only |
| `README.md`, `README-ar.md` | these notes, in English and Arabic |

## What the site needs

- WordPress 7.1 or newer, PHP 8.1 or newer (built and checked on WordPress 7.1, PHP 8.3).
- An upload limit of at least 16 MB for the theme zip. Most hosts allow 64 MB or more.
- These plugins, installed and active before the theme's pages are installed:

| plugin | version | why |
|---|---|---|
| Contact Form 7 | 6.2.3 | the contact and job application forms (the forms print this version, as live's do) |
| Contact Form 7 Dynamic Text Extension | 5.0.7 | the job's title carried into the application |
| Rank Math SEO | current | each page's title, description, social picture and schema; addresses that change redirect |

Later: WPML for the Arabic pages (stage 11), and Simple Cloudflare Turnstile with the live
site's keys (stage 12).

## On a new host (or a staging copy that starts empty)

1. Install WordPress. In **Plugins → Add New Plugin**, install and activate the three plugins
   above.
2. In **Appearance → Themes → Add New Theme → Upload Theme**, choose `harlow.zip`, press
   **Install Now**, then **Activate**.
3. Upload `harlow-pictures.zip` to the folder `wp-content/themes/harlow/assets/` with the
   host's File Manager (or FTP) and extract it there. The pictures then sit in
   `wp-content/themes/harlow/assets/uploads/`.
4. Open **Appearance → Site pages** and press **Install the pages**. The screen works in
   short rounds until it says it is done. It makes the pages, pictures, items (posts, news,
   projects, gallery, jobs, business models, people, testimonials, client logos), the two
   forms, the menus and every page's SEO.

   On a WordPress that still has its first settings it also sets what the site needs:
   addresses by name (`/about-us/`), the Baghdad timezone, Rank Math's first screen
   answered and its redirections on (a page whose address changes redirects). WordPress's
   own sample post and page go to the trash. A site with its own settings keeps them.
5. Open the home page.

If Site pages says some pictures have no file yet, step 3 was skipped or went to another
folder. Put the pictures in place and press **Install the pages** again: it makes only what
is missing.

If the dashboard refuses `harlow.zip` (the host's upload limit), unzip it on your computer and
upload the `harlow` folder to `wp-content/themes/` by FTP, then activate it in
**Appearance → Themes**.

## On the live site (stage 12)

The live site already has the pictures, under the same ids: skip step 3. Take a full backup
and try it on a staging copy first. Site pages leaves a page that has content of its own
(Elementor's) as it is unless you tick the box to replace it; its content is then kept in
its Revisions. Nothing is deleted, and installing again changes nothing.

## Where things are edited

| what | where |
|---|---|
| a page's words, pictures, links and design | **Pages**, the page, then click any word or picture; the sidebar's **Styles** tab styles the element (Style and Advanced, per device) |
| a new page | **Pages → Add New Page**: "What kind of page is this?" gives its ready sections |
| posts, news, projects, jobs and the other items | their own menus on the left; a new item's panel on the right says where it shows |
| the cards of a list | the page with the list: select the list, then **Styles → Card, Card: picture, title, text, button** |
| a new card design | **Appearance → Theme Builder**, a list card, then pick it in the list's **Card** setting |
| menus | **Appearance → Menus** |
| header, footer, social links, cookie bar, page transition | **Appearance → Customize** |
| brand colours, site-wide fonts and buttons | **Appearance → Customize → Brand colours** and **Site settings** |
| each page's SEO | Rank Math's panel in the page's editor |
| who may change the design; maintenance mode | **Appearance → Editing and maintenance** |
| put a page back as it was made | the page's editor, **Original sections** in the sidebar |
