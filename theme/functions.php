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
 *   nav.php            the header and footer menus, printed as live prints them
 *   content-types.php  news, projects, gallery, jobs, business models, people,
 *                      testimonials, client logos: live's names and addresses
 *   blocks.php         the blocks of the pages (blocks/, markup in includes/sections/),
 *                      readable links, the section library's categories
 *   loops.php          the list block (blocks/loop) and what its cards print
 *   singles.php        the item pages: live's single templates
 *   forms.php          Contact Form 7's forms
 *   archives.php       search, categories, dates and authors as live answers them
 *   kinds.php          the kinds of page as page templates, the rules each page loads
 *   page-tools.php     duplicate, original sections, links picked from the pages
 *   install.php        the pages, pictures, items and menus (wp harlow install)
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
require_once __DIR__ . '/functions/nav.php';
require_once __DIR__ . '/functions/content-types.php';
require_once __DIR__ . '/functions/blocks.php';
require_once __DIR__ . '/functions/loops.php';
require_once __DIR__ . '/functions/singles.php';
require_once __DIR__ . '/functions/forms.php';
require_once __DIR__ . '/functions/archives.php';
require_once __DIR__ . '/functions/kinds.php';
require_once __DIR__ . '/functions/page-tools.php';
require_once __DIR__ . '/functions/install.php';
