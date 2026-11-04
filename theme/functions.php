<?php
/**
 * Harlow Group theme.
 *
 * Each concern has its own file under functions/:
 *
 *   setup.php     what the theme supports, the menu locations
 *   enqueue.php   the stylesheets and scripts, in the reference's order
 *   settings.php  Appearance → Customize: site details, cookie bar, page transition
 *   brand.php     Appearance → Customize → Brand colours
 *   styles.php    each element's Styles tab, as Elementor's, and the site-wide styles
 *   icons.php     SVG icons the owner uploads, cleaned as they arrive
 *   site-settings.php  Customize → Site settings: global colours and fonts, theme style,
 *                      breakpoints, custom fonts and code, as Elementor's Site Settings
 *   nav.php            the header and footer menus, printed as live prints them
 *   content-types.php  news, projects, gallery, jobs, business models, people,
 *                      testimonials, client logos: live's names and addresses
 *   blocks.php         the blocks of the pages (blocks/, markup in includes/sections/),
 *                      readable links, the section library's categories
 *   loops.php          the list block (blocks/loop) and what its cards print
 *   singles.php        the item pages: live's single templates
 *   item-screen.php    an item's edit screen: what it is, where its cards and page are designed
 *   forms.php          Contact Form 7's forms
 *   archives.php       search, categories, dates and authors as live answers them
 *   kinds.php          the kinds of page as page templates, the rules each page loads
 *   page-tools.php     duplicate, original sections, links picked from the pages
 *   seo.php            Rank Math's head for pages made of blocks (the first picture)
 *   install.php        the pages, pictures, items, forms, menus and SEO, in rounds
 *                      (wp harlow install)
 *   site-pages.php     Appearance > Site pages: the installer's table and button
 *   theme-builder.php  Appearance > Theme Builder: header, footer, single, archive,
 *                      search, 404, card and popup templates with display conditions
 *   dynamic-tags.php   words and links that show the page's or the site's data
 *   site-tools.php     Appearance > Editing and maintenance: role manager, maintenance
 *   widgets/*.php      what a widget needs on the server (a form's sending, a login),
 *                      one file per widget (docs/widgets.md)
 *
 * The markup of the header, footer, cookie bar and page transition is in includes/parts/,
 * the cards' in includes/loops/, the blocks' in includes/sections/.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HARLOW_VERSION', '0.1.0' );

require_once __DIR__ . '/functions/setup.php';
require_once __DIR__ . '/functions/enqueue.php';
require_once __DIR__ . '/functions/settings.php';
require_once __DIR__ . '/functions/brand.php';
require_once __DIR__ . '/functions/styles.php';
require_once __DIR__ . '/functions/icons.php';
require_once __DIR__ . '/functions/site-settings.php';
require_once __DIR__ . '/functions/nav.php';
require_once __DIR__ . '/functions/content-types.php';
require_once __DIR__ . '/functions/blocks.php';
require_once __DIR__ . '/functions/loops.php';
require_once __DIR__ . '/functions/singles.php';
require_once __DIR__ . '/functions/item-screen.php';
require_once __DIR__ . '/functions/forms.php';
require_once __DIR__ . '/functions/archives.php';
require_once __DIR__ . '/functions/kinds.php';
require_once __DIR__ . '/functions/page-tools.php';
require_once __DIR__ . '/functions/seo.php';
require_once __DIR__ . '/functions/install.php';
require_once __DIR__ . '/functions/site-pages.php';
require_once __DIR__ . '/functions/theme-builder.php';
require_once __DIR__ . '/functions/dynamic-tags.php';
require_once __DIR__ . '/functions/site-tools.php';
require_once __DIR__ . '/functions/security.php';

// What a widget needs on the server, one file per widget (docs/widgets.md).
foreach ( glob( __DIR__ . '/functions/widgets/*.php' ) as $harlow_widget_file ) {
	require_once $harlow_widget_file;
}
