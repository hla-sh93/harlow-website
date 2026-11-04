# How a widget is made

Every Elementor widget the owner can put on a page is one block of the `harlow` theme. A
widget is a folder and a few files; nothing else in the theme names it. Read one existing
widget first: `theme/blocks/icon/` with `theme/includes/sections/icon.php` (simple),
`theme/blocks/accordion/` (items and a script), `theme/blocks/loop/` (server-printed in the
editor).

## The files of a widget `<name>`

| file | what |
|---|---|
| `theme/blocks/<name>/block.json` | the block: `apiVersion` 3, `name` `harlow/<name>`, Elementor's widget title, a category (`text`, `media`, `design`, `widgets`, `theme`, `embed`), a description, `textdomain` `harlow`; the attributes (below); `supports` `{ "html": false, "className": false, "customClassName": false, "customCSS": false }` (the Styles tab has the custom CSS: WordPress 7.1's own "Additional CSS" would repeat it, written into the same `style` attribute); `"render": "file:../../includes/sections/<name>.php"`; an `example` with the attributes a preview shows; `harlowWidget` when Elementor's widget type is not `<name>` (`theme-site-logo` for `site-logo`) |
| `theme/includes/sections/<name>.php` | the widget as the page prints it: Elementor's own markup, class for class |
| `theme/blocks/<name>/edit.js` | the widget in the editor: the same markup, with the content fields in the sidebar and words typed in place; `export default function Edit`; `export const save` only for a widget that holds other blocks |
| `theme/blocks/<name>/parts.json` | the widget's style groups (Elementor's Style tab sections), below |
| `assets/css/widgets/<name>.css` | the widget's own look, as Elementor's stylesheet for that widget draws it; loaded only on pages that have the widget, and always in the editor's canvas |
| `assets/js/widgets/<name>.js` | its behaviour, if it has one; loaded only on pages that have it |
| `theme/functions/widgets/<name>.php` | what it needs on the server, if anything (a form's sending, a login's redirect, a REST route): loaded by functions.php, functions named `harlow_<name>_…` |

The folder name is the widget type's name before its skin, without Elementor's `theme-`
prefix and with `-` for `_` (`harlow_widget_kind()`): `google_maps.default` is the folder
`google-maps`, `theme-site-logo.default` the folder `site-logo`.

## Attributes

Every widget has these four, first, as the others have them, and `style` last:

```json
"element": { "type": "string", "default": "" },
"classes": { "type": "string", "default": "" },
"settings": { "type": "string", "default": "" },
"htmlId": { "type": "string", "default": "" },
...the widget's own content attributes...
"style": { "type": "object", "default": {} }
```

`element` and `classes` stay empty in block.json: the editor gives a new widget its id and
Elementor's classes (`elementor-element elementor-widget elementor-widget-<type>`) when it
is put on a page (`theme/editor/new-element.js`). Content attributes take the values
Elementor's own widget starts with as defaults (its default title, its default words), so a
widget put on a page shows what Elementor's shows. Repeaters (tabs, slides, list items,
price features) are an array attribute of objects. A picture is its Media Library id
(`integer`), a link a string (with `linkNewTab` and `linkNofollow` booleans where Elementor
has them), an icon its SVG (`icon`, string; the editor's `IconPicker` offers the icon
library, `harlow_icon( $svg )` prints it cleaned). An icon a widget always has (a star, a
quote mark, an arrow) may be drawn by the widget itself.

## The markup (PHP)

```php
echo '<div' . harlow_element_attributes( $attributes, 'widget', '<type>.default' ) . '>'
	. '<div class="elementor-widget-container">'
	. ...the widget's own markup...
	. '</div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped where it is built.
```

`harlow_element_attributes()` writes the element's classes, data-id, settings, id, the
owner's custom attributes and motion effects, and collects the owner's styles. Everything
else is escaped where it is built (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post` for
words that may hold links and emphasis). Helpers:

- `harlow_link_url( $link )`: a link as blocks write it (a page's name `about-us.html`, an
  `assets/...` file, or a full address) as the page's address now.
- `harlow_icon( $svg )`: an icon's SVG, cleaned (only the shapes and attributes an icon has).
- `wp_get_attachment_image( $id, $size, false, array( 'class' => 'attachment-' . $size . ' size-' . $size . ' wp-image-' . $id ) )`:
  a picture as Elementor prints it.
- Settings the script reads go in `data-settings` (the `settings` attribute, JSON, as
  Elementor keeps them) or in data attributes of the widget's own markup.

## The edit view (JS)

```js
const blockProps = useBlockProps(
	elementProps( attributes, 'widget', '<type>.default' )
);
```

`elementProps()` (theme/editor/shared.js) gives the element's attributes as the PHP prints
them. The view prints the same elements as the PHP file, so the canvas is styled by the same
stylesheets. Words Elementor edits in place are `RichText` (with `tagName` the element's
tag and `allowedFormats` bold, italic, link). The content fields are in `InspectorControls`
panels named as Elementor names them (Content: "Title", "Description", "Link"...).
Shared pieces: `IconPicker` and `iconHtml` (an icon), `PicturePicker` and `usePictureUrl`
(a picture from the Media Library or uploaded), `LinkFields` (a link, the site's pages
offered), `ServerMarkup` (the PHP's own markup, for a widget whose content lives on the
server: posts, a menu, a sidebar), `ItemPanels` (editor/items.js: a repeater's rows, each
a panel; `title` names a row from its number, "Tab 1", and `addLabel` the add button),
`withClass` and `classOf` (one class of a group on the element: a view, a shape).
Labels use `__( '…', 'harlow' )`.

A widget is put in a container, as in Elementor: a page's document takes containers only,
and a container takes every block of the theme but the parts of others (inContainer()).

## Style groups (parts.json)

The element's Styles tab shows the widget's own groups first, its parts: each a part of its
markup the owner styles on its own, per device, with states. Then, under "The box around
the element", the general groups (background, spacing, border, motion, custom CSS…, on the
whole element), as Elementor's Advanced tab. One place per property (Hla, 2026-11-02): a
general group a part covers is left out, the general Typography where the parts style the
widget's words, the general Icon where a part has `icon`, the general Alignment where a
part has `align`, the general Text shadow where a part has `textShadow`. A widget whose own
box fills it and paints over it (an alert's coloured box) is listed in `HARLOW_STYLE_COVERS`
(styles.php) and `COVERS` (styles.js): the box's background paints that box too, so a part
of it does not offer a background of its own. A widget whose own layers cover it whole, each
with its background (a flip box's front and back, each slide of the slides), is in
`OWN_BACKGROUND` (styles.js): the
box's Background, hidden behind them, is not offered.

```json
{
	"parts": [
		{
			"key": "title",
			"label": "Title",
			"selector": " .elementor-tab-title",
			"controls": [ "color", "typography", "textShadow", "background", "padding", "border" ],
			"states": {
				"hover": { "label": "Hover", "selector": " .elementor-tab-title:hover" },
				"active": { "label": "Active", "selector": " .elementor-tab-title.elementor-active" }
			}
		}
	]
}
```

`selector` is inside the element (it starts with a space or `>`; several with `|`). A
state's `selector` is the whole selector of the part in that state. Controls offered:
`color` (text colour), `typography`, `textShadow`, `background` (colour, gradient,
picture), `padding`, `margin`, `border` (sides, corners), `line` (a border without corners: a divider between rows), `shadow`, `size` (width, minimum
height), `icon` (an icon's colour and size, font or SVG), `gap`, `align`, `opacity`,
`transform`, `columns` (a grid's), `textColumns`, `dropCap`, `divider` (a divider's line:
colour, weight, width). Name the parts and controls as
Elementor's Style tab does for that widget; offer every group it has. A part that is there
only for some of the widget's settings has `when`, its block attributes and the values it
is there for (`"when": { "headlineStyle": [ "rotate" ], "animationType": [ "typing", "clip" ] }`
on the animated headline's cursor; `"*"` for any value (0 is none: a picture's id; an empty list is none); `{ "has": [ "message" ] }` for a
list holding one of the values (a countdown's expiry actions); `{ "any": { "avatar": [ true ] } }`
for a list with a line that fits: post info's author picture; a list of such objects for
alternatives, any one enough: a hotspot's box with a label or an icon), as Elementor shows such a
group only then; a part drawn
only while something runs (typing selecting words) is labelled "While …", one drawn once
something opens it "(shown when opened)" (a full screen search). A part whose selector is a
first letter (a drop cap) is offered no text outline: browsers draw none there.

The panel draws each group as a property panel (Gate 2, 2026-11-03): the part's label is the
group's title with an icon by what it styles, a dot once it holds a value and its reset; each
control is a row, its label on the left (the part's name before a colon read by screen
readers only), so a control's label is written in full in the code ("Title: Size"), as the
checks read it.

## The look (CSS) and the behaviour (JS)

The stylesheet is Elementor's look for the widget written plainly (readable, two-space
indent, a comment over each group), with Elementor's class names, so the widget looks as it
does in Elementor before the owner styles it. It may read the kit's custom properties
(`--e-global-color-primary`, `--e-global-color-text`, `--e-global-color-accent`,
`--e-global-typography-primary-font-family`...). The script is a small module of its own,
as the others in `assets/js/` (an IIFE, no library), working on every instance of the
widget on the page; it reads its settings from `data-settings` or data attributes.

## Rules

- No jQuery, no Swiper, no library from a CDN: every behaviour is the theme's own.
- The code and comments are in English, in the plain words the rest of the theme uses.
  No tool or assistant is named anywhere.
- PHP passes the WordPress Coding Standards: `bash _tools/env.sh phpcs` (exit 0).
- JS passes `npx wp-scripts lint-js theme/blocks/<name>` (format with
  `npx wp-scripts format <files>` from `theme/`).
- A widget is seen working before it is done: rendered on the local WordPress
  (`bash _tools/env.sh wp eval 'echo do_blocks( "<!-- wp:harlow/<name> {\"element\":\"a1b2c3d\"} /-->" );'`),
  its markup Elementor's, and nothing written to `wp-content/debug.log`; then
  `python _tools/verify_widgets.py <name>` puts it on a page in the editor and reads the
  page at 1440 and 479.
