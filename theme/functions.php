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
 *   nav.php       the header and footer menus, printed as live prints them
 *   install.php   the pages and menus of the site (wp harlow install)
 *
 * The markup of the header, footer, cookie bar and page transition is in includes/parts/.
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
require_once __DIR__ . '/functions/install.php';
