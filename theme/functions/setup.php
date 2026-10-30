<?php
/**
 * What the theme supports, and where menus go.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The page title is the SEO plugin's to print (Rank Math), so the theme declares title-tag
 * and prints no title of its own.
 *
 * The content width is live's theme's (Hello Elementor: 800). WordPress sizes a "large"
 * picture to it, which is why live's cards print width="800" for a 1024px file.
 */
function harlow_setup() {
	// A page's excerpt is what search results show of it (live's, from the installer).
	add_post_type_support( 'page', 'excerpt' );
	$GLOBALS['content_width'] = 800;
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support(
		'html5',
		array( 'search-form', 'gallery', 'caption', 'style', 'script' )
	);
}
add_action( 'after_setup_theme', 'harlow_setup' );

/**
 * The body class of the site's design settings (Elementor's kit, #9 on live). One rule of
 * the design is keyed on it: the page transition's background (#FDFDFD).
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function harlow_body_class( $classes ) {
	$classes[] = 'elementor-kit-9';
	return $classes;
}
add_filter( 'body_class', 'harlow_body_class' );

/**
 * The five places a menu is printed. Registered on init, not after_setup_theme: the labels
 * are translated, and translating before init is a notice since WordPress 6.7.
 *
 * A footer column's heading is the name of the menu in it, so a column is renamed where
 * its links are edited.
 */
function harlow_register_menus() {
	register_nav_menus(
		array(
			'primary'      => __( 'Header menu', 'harlow' ),
			'footer-1'     => __( 'Footer, first column (the heading is the menu name)', 'harlow' ),
			'footer-2'     => __( 'Footer, second column (the heading is the menu name)', 'harlow' ),
			'footer-3'     => __( 'Footer, third column (the heading is the menu name)', 'harlow' ),
			'footer-legal' => __( 'Footer, links under the columns', 'harlow' ),
			'careers'      => __( 'Careers pages, side menu', 'harlow' ),
		)
	);
}
add_action( 'init', 'harlow_register_menus' );
