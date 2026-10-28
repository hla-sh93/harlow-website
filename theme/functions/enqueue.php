<?php
/**
 * Stylesheets and scripts, in the order the reference pages load them.
 *
 * The CSS and JS are the reference's own files (assets/, shared with html-v1 and served
 * unchanged), so a page here and the same page of the reference are styled by the same
 * rules in the same order.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The layers before the per-document rules, in load order. */
const HARLOW_CSS_FIRST = array( 'tokens', 'base', 'layout', 'components', 'navigation', 'modules' );

/** The design vocabulary, one file per axis (assets/css/design/, see _vocab/vocabulary.md). */
const HARLOW_CSS_DESIGN = array( 'brand', 'type', 'space', 'layout', 'size', 'surface', 'effects', 'misc' );

/** The layers after the vocabulary. */
const HARLOW_CSS_LAST = array( 'utilities', 'animations' );

/**
 * The Elementor documents every page shows: the header (#1179) and the footer (#1066).
 * Their rules that name no element are in design/globals-<document>.css.
 */
const HARLOW_CHROME_DOCUMENTS = array( 'post-1179', 'post-1066' );

/** One small module per behaviour (assets/js/), as the reference loads them. */
const HARLOW_SCRIPTS = array(
	'header',
	'nav-menu',
	'reveal',
	'background-video',
	'carousel',
	'gallery',
	'accordion',
	'history-slider',
	'people-popup',
	'lightbox',
	'cookie-bar',
	'page-transition',
);

/**
 * A file's version: its modification time while developing, so a browser never keeps an
 * old copy (browsers cache assets hard), and the theme's version otherwise.
 *
 * @param string $file Path inside the theme.
 * @return string
 */
function harlow_asset_version( $file ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		$path = get_theme_file_path( $file );
		if ( file_exists( $path ) ) {
			return (string) filemtime( $path );
		}
	}
	return HARLOW_VERSION;
}

/**
 * Enqueue one stylesheet of assets/css/.
 *
 * @param string $handle Handle, without the theme's prefix.
 * @param string $file   Path inside assets/css/, without .css.
 */
function harlow_enqueue_css( $handle, $file ) {
	$path = 'assets/css/' . $file . '.css';
	wp_enqueue_style( 'harlow-' . $handle, get_theme_file_uri( $path ), array(), harlow_asset_version( $path ) );
}

/**
 * The documents whose page-wide rules this page loads, in the reference's order.
 *
 * A document's rules that name no element (`.m-0 p`) reach the whole page, so a page loads
 * those of the documents it shows and no others. The installer stores each page's list
 * (`_harlow_documents`, from the reference); anything else shows the header and footer.
 *
 * @return string[]
 */
function harlow_page_documents() {
	if ( is_singular() || is_front_page() ) {
		$documents = get_post_meta( (int) get_queried_object_id(), '_harlow_documents', true );
		if ( is_array( $documents ) && $documents ) {
			return array_filter( $documents, 'harlow_is_document' );
		}
	}
	return HARLOW_CHROME_DOCUMENTS;
}

/**
 * Is this the name of a document whose rules the theme has?
 *
 * @param string $document A name like post-1224 or loop-2279.
 * @return bool
 */
function harlow_is_document( $document ) {
	return (bool) preg_match( '/^(post|loop)-\d+$/', $document )
		&& file_exists( get_theme_file_path( 'assets/css/design/globals-' . $document . '.css' ) );
}

/**
 * The stylesheets and scripts of every page.
 */
function harlow_enqueue_assets() {
	foreach ( HARLOW_CSS_FIRST as $layer ) {
		harlow_enqueue_css( $layer, $layer );
	}
	foreach ( harlow_page_documents() as $document ) {
		harlow_enqueue_css( 'globals-' . $document, 'design/globals-' . $document );
	}
	foreach ( HARLOW_CSS_DESIGN as $axis ) {
		harlow_enqueue_css( 'design-' . $axis, 'design/' . $axis );
	}
	foreach ( HARLOW_CSS_LAST as $layer ) {
		harlow_enqueue_css( $layer, $layer );
	}

	foreach ( HARLOW_SCRIPTS as $module ) {
		$path = 'assets/js/' . $module . '.js';
		wp_enqueue_script(
			'harlow-' . $module,
			get_theme_file_uri( $path ),
			array(),
			harlow_asset_version( $path ),
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'harlow_enqueue_assets' );

/**
 * What WordPress and the plugins would add on top of the reference's stylesheets.
 *
 * The reference already holds every rule of WordPress's block library, classic-theme and
 * global styles that the live pages use (build_css.py kept them in base.css); loaded again
 * they would be a second, unpruned copy, and their custom properties would reach every
 * element. Contact Form 7's own CSS is in the reference the same way, and its script is
 * only needed where a form is, which is stage 5. The emoji script swaps characters for
 * pictures the live site does not show.
 */
function harlow_dequeue_extras() {
	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'classic-theme-styles' );
}
add_action( 'wp_enqueue_scripts', 'harlow_dequeue_extras', 100 );

// Global styles are added late and in more than one place; not adding them is simpler.
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );

/*
 * WordPress 6.7 writes "auto, " at the front of a lazy picture's sizes, a newer way for the
 * browser to pick a file from the srcset. Live's pictures do not have it; left out, the
 * pictures are written as live writes them (and the style that goes with it is not added).
 */
add_filter( 'wp_img_tag_add_auto_sizes', '__return_false' );

add_filter( 'wpcf7_load_css', '__return_false' );
add_filter( 'wpcf7_load_js', '__return_false' );
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
