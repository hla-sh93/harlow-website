# Elementor parity: everything the owner can do in Elementor (Free and Pro), in this theme

Hla, 2026-11-01: "make the editing similar to Elementor; do not leave behind any feature,
even the paid ones." This is the specification. Every line is built, then used in the editor
by the owner's test (`_tools/verify_editable.py`) as a person uses it, and seen on the page
at every breakpoint. An element nobody touches stays identical to the reference.

Status: ✅ built and proven · 🔨 building · ⬜ to build.

## 1. Every element: the Style and Advanced tabs

Each control below is per breakpoint (§6), with Normal / Hover where Elementor has it, and
a Reset.

### 1.1 Background (sections, containers, columns, every widget's box)
- ✅ Type: classic colour, gradient (linear), image from the Media Library or uploaded
  (position, size, repeat, attachment), colour over the image
- ✅ Gradient: linear or radial (its centre), two stops with their positions, angle
- ✅ Image: custom position (x, y), custom size (width) · ✅ lazy load (Site settings)
- ✅ Video background (a container's video, by address or the Media Library)
- ✅ Video background: a file, YouTube or Vimeo; start/end time, play once, play on
  mobile, fallback image
- ✅ Slideshow background (pictures, duration, transition fade/slide, Ken Burns, size,
  position, loop)
- ✅ Background overlay as its own layer (colour, gradient, image) with opacity, blend
  mode, CSS filters, transition (Normal / Hover)
- ✅ Hover background (colour) and transition duration
- ✅ Hover background: gradient, image

### 1.2 Border
- ✅ Type, width and colour for all sides at once or each side on its own
- ✅ Radius for all corners or each corner (px, %, em)
- ✅ Box shadow (x, y, blur, spread, colour, inset) — Normal / Hover
- ✅ Hover border colour, type, width, radius

### 1.3 Typography (every widget with words)
- ✅ Font family (the site's fonts), size with unit, weight, transform, style (italic),
  decoration (underline), line height, letter spacing
- ✅ Word spacing; font from Google Fonts or an uploaded font (Pro custom fonts); the
  global fonts
- ✅ Text colour (any; the brand's and the palette first) — Normal / Hover
- ✅ Text shadow
- ✅ Text stroke (width, colour); blend mode
- ✅ Alignment (left, centre, right, justify)

### 1.4 Layout of a container (Flexbox and Grid)
- ✅ Content width boxed / full width, width, min height, HTML tag
- ✅ Flexbox: direction (row, column, reversed), justify content, align items, align
  content, wrap, column and row gaps
- ✅ Grid: columns, rows (number or a template such as `2fr 1fr`), gaps, auto flow,
  justify items, align items
- ✅ Overflow (visible, hidden, auto)
- ✅ Shape dividers top and bottom (18 shapes, colour, width, height per device, flip,
  invert, bring to front)
- ✅ Link the whole container (Pro)

### 1.5 Position and size (Advanced → Layout)
- ✅ Width: default, full width, inline (auto), custom
- ✅ Align self, order (first, last, custom), size in its row (none, grow, shrink)
- ✅ Position: default, relative, absolute, fixed, sticky; offsets (horizontal from left or
  right, vertical from top or bottom) with units; z-index
- ✅ Margin and padding per side with units

### 1.6 Motion
- ✅ Entrance animation (16: fades, slides, zoom, bounce, flips, rotate, light speed,
  roll), per device, duration, delay
- ✅ Scrolling effects (Pro): vertical and horizontal scroll, transparency, blur, rotate,
  scale, each with speed, direction and viewport range, per device
- ✅ Mouse effects (Pro): mouse track, 3D tilt
- ✅ Sticky (Pro): top or bottom, offset, effects offset, stay in column, devices
- ✅ Hover animations (27: grow, shrink, pulse, push, pop, bounce, rotate, float, sink,
  bob, hang, skew, wobble, buzz…)

### 1.7 Transform
- ✅ Rotate, offset X and Y, scale — Normal / Hover; transition
- ✅ Rotate in 3D (X, Y, perspective), skew, flip horizontal and vertical, anchor point

### 1.8 Effects
- ✅ Opacity
- ✅ CSS filters on pictures (blur, brightness, contrast, saturation, hue) — Normal / Hover
- ✅ Blend mode

### 1.9 Advanced
- ✅ CSS ID, CSS classes
- ✅ Custom CSS (`selector`)
- ✅ Custom attributes (Pro): `key|value` pairs on the element
- ✅ Responsive: hide on desktop, tablet or mobile
- ✅ Display conditions (Pro): by user (logged in, role), dates, days, time of day;
  devices by Hide on this device

## 2. Widgets

Each with its own content fields and its own style groups, as in Elementor.

### 2.1 Already on the site's pages (built, with their content fields)
- ✅ Heading (words, tag, size, link) · ✅ Text editor (columns, drop cap, links) · ✅ Image
  (Media Library or upload, file size, link, alt, title, caption, drawn size, fit, radius,
  filters) · ✅ Button (words, link, icon, icon position and spacing, colours Normal /
  Hover, padding, corners) · ✅ Icon (colour, size, rotate, link, view: stacked / framed,
  shape) · ✅ Icon list (icon, text, divider, spacing; Normal / Hover) · ✅ Social icons
  (shape, columns, colours, size, spacing; Normal / Hover) · ✅ Divider (style, patterns, width, weight, colour,
  element text or icon and its position) · ✅ Accordion (questions; item, title, icon, content style
  Normal / Hover / Active) ·
  ✅ HTML · ✅ Shortcode · ✅ Gallery · ✅ Nav menu · ✅ Loop grid and carousel (query, card
  words, a card made in the Theme Builder, columns, gap, arrows, dots, pager; slides per
  device, autoplay, pause, loop, speed) ·
  ✅ Template (synced pattern) · ✅ Post content · ✅ Form (Contact Form 7)

### 2.2 Elementor Free widgets
- ✅ Spacer · ✅ Image box · ✅ Icon box · ✅ Star rating · ✅ Counter · ✅ Progress bar ·
  ✅ Testimonial · ✅ Tabs · ✅ Toggle (FAQ schema) · ✅ Alert · ✅ Menu anchor · ✅ Read more ·
  ✅ Sidebar
- ✅ Video (YouTube, Vimeo, Dailymotion, self-hosted; overlay, lightbox) · ✅ Image carousel ·
  ✅ Basic gallery · ✅ Audio (SoundCloud) · ✅ Google Maps

### 2.3 Elementor Pro widgets
- ✅ Animated headline · ✅ Flip box · ✅ Call to action · ✅ Price table · ✅ Price list ·
  ✅ Countdown (due date, evergreen, actions) · ✅ Testimonial carousel · ✅ Reviews ·
  ✅ Table of contents · ✅ Share buttons (18 networks) · ✅ Blockquote · ✅ Hotspot ·
  ✅ Off-canvas · ✅ Progress tracker · ✅ Login · ✅ Form (17 field types, steps, email,
  email 2, redirect, webhook, submissions with CSV, popup) · ✅ Posts and portfolio (skins,
  filter bar, load more, infinite scroll) · ✅ Archive posts · ✅ Facebook button, comments,
  embed, page · ✅ Search form (classic, minimal, full screen) · ✅ Site logo, site title,
  page title, post title, post excerpt, featured image, post info, author box, post
  navigation, breadcrumbs (schema), archive title · ✅ Sitemap
- ✅ Slides · ✅ Media carousel (carousel, slideshow, coverflow) · ✅ Lottie (the theme's own
  player) · ✅ Code highlight (the theme's own highlighting) · ✅ Video playlist

Every widget: its content as in Elementor, its Style tab groups (parts.json) per device with
Normal / Hover / Active, its own stylesheet and script loaded only where it is, proven by
`_tools/verify_widgets.py` (put on a page in the editor, seen at 1440 and 479, driven).

## 3. Theme Builder (Pro)
- ✅ Header and footer edited as blocks (Appearance → Theme Builder), with display
  conditions; sticky (Motion → Sticky) and transparent (Position → absolute) header
- ✅ Single templates for posts and news, projects, gallery items, jobs (Appearance →
  Patterns) · ✅ single templates for any page or item with display conditions
- ✅ Archive templates (archives, a type's archive, a category), search results, 404 page
- ✅ Loop item templates' words, arrow and badge from the list · ✅ the card itself edited
  as blocks (Pro loop item), picked by a list

## 4. Popups (Pro)
- ✅ Popup builder (position, size, entrance animation, overlay, close button, Escape,
  overlay click, scroll lock)
- ✅ Triggers: on page load, on scroll, scroll to element, after clicks, after
  inactivity, on exit intent; a link opens or closes it
- ✅ Conditions (where it shows) and advanced rules (times per visit, day, week, month or
  ever; after N page views, after N visits, arriving from an address, devices, logged in)

## 5. Site Settings (the Customizer, as Elementor's Site Settings)
- ✅ Brand colours · ✅ global colours: the kit's four and any number of the owner's,
  named, in every picker
- ✅ Headings colour and sizes H1–H6, text colour and size, links, buttons
- ✅ Global fonts (the kit's four: font, weight, size, line height, capitals, spacing) ·
  ✅ typography per element (H1–H6 font, size, weight, colour, line height, spacing,
  capitals; body; paragraph spacing; links Normal / Hover)
- ✅ Buttons (typography, colours Normal / Hover, border, radius, padding)
- ✅ Images (border, radius, opacity, hover opacity) · ✅ form fields and labels
- ✅ Layout: content width, widget spacing, page background colour and picture;
  lightbox colours
- ✅ Site identity (logo, name) · ✅ Additional CSS (WordPress's)
- ✅ Custom fonts (uploaded files, Google Fonts) and custom icons (SVG uploads, cleaned);
  the icon library (WordPress's icon set); custom code in the head and body (Pro)
- ✅ Page transitions and preloader (on or off, cover colour, entrance and exit
  animations, duration, the preloader picture, its width and movement)

## 6. Breakpoints and responsive editing
- ✅ Desktop, tablet, mobile, with the editor's own preview at each
- ✅ Custom breakpoints: widescreen, laptop, tablet extra, mobile extra (Site settings →
  Breakpoints), in every Styles tab

## 7. The editor itself
- ✅ Navigator (List View), history and revisions, undo
- ✅ Templates library (Harlow sections, page layouts) · ✅ global widgets (synced patterns)
- ✅ Copy and paste a block; ✅ copy and paste its style only (the block's menu)
- ✅ Duplicate a page or item · ✅ page kinds with ready sections
- ✅ Finder: WordPress's command palette (Ctrl+K) in the editor
- ✅ Role manager: roles that edit the words and pictures only (Appearance → Editing and
  maintenance)
- ✅ Maintenance (503) / coming soon (200) mode, with the page or template shown and who
  sees the site

## 8. Dynamic content (Pro)
- ✅ Item fields in item templates (title, date, featured picture, text, project fields)
- ✅ Dynamic tags in any words (22: post title, excerpt, dates, terms, author, archive,
  page and site titles, current date, visitor, request parameter, custom field,
  shortcode; before, after, fallback) and dynamic links (post, site, archive, author,
  custom field)
