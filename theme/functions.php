<?php
/**
 * Harlow Group theme.
 *
 * Stage 0: the theme exists and can be activated. The header, footer, menus and site
 * settings arrive in stage 1, the blocks and pages after (docs/phase-2-plan.md).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HARLOW_VERSION', '0.0.1' );

/**
 * What the theme supports. The page title is the SEO plugin's to print (Rank Math), so the
 * theme declares title-tag and prints no title of its own.
 */
function harlow_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support(
		'html5',
		array( 'search-form', 'gallery', 'caption', 'style', 'script' )
	);
}
add_action( 'after_setup_theme', 'harlow_setup' );
