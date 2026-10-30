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
 * The stylesheets, in the reference's order, with the page-wide rules of these documents.
 *
 * @param string[] $documents Documents (post-1224, loop-2279, ...).
 */
function harlow_enqueue_styles( $documents ) {
	foreach ( HARLOW_CSS_FIRST as $layer ) {
		harlow_enqueue_css( $layer, $layer );
	}
	foreach ( $documents as $document ) {
		harlow_enqueue_css( 'globals-' . $document, 'design/globals-' . $document );
	}
	foreach ( HARLOW_CSS_DESIGN as $axis ) {
		harlow_enqueue_css( 'design-' . $axis, 'design/' . $axis );
	}
	foreach ( HARLOW_CSS_LAST as $layer ) {
		harlow_enqueue_css( $layer, $layer );
	}
}

/**
 * The stylesheets and scripts of every page.
 */
function harlow_enqueue_assets() {
	harlow_enqueue_styles( harlow_page_documents() );

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
 * The editor's canvas: the page's own stylesheets, with the page-wide rules of the
 * documents of the page being edited, so the blocks are styled as the page styles them,
 * and editor/canvas.css for what the page's scripts draw.
 *
 * WordPress collects the canvas's assets on this action with
 * should_load_block_editor_scripts_and_styles off; on the editor's own screen (on), the
 * page's rules would style the editor itself, and on the site, wp_enqueue_scripts has them.
 */
function harlow_canvas_assets() {
	if ( ! is_admin() || wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}
	$post      = get_post();
	$documents = $post ? get_post_meta( $post->ID, '_harlow_documents', true ) : '';
	// A form's page: CF7's stylesheet first, as on the page (functions/forms.php).
	if ( $post && function_exists( 'wpcf7_plugin_url' ) && false !== strpos( $post->post_content, '[contact-form-7 ' ) ) {
		wp_enqueue_style( 'contact-form-7', wpcf7_plugin_url( 'includes/css/styles.css' ), array(), WPCF7_VERSION );
	}
	harlow_enqueue_styles( is_array( $documents ) && $documents ? array_filter( $documents, 'harlow_is_document' ) : HARLOW_CHROME_DOCUMENTS );
	harlow_brand_style();
	wp_enqueue_style( 'harlow-canvas', get_theme_file_uri( 'editor/canvas.css' ), array( 'harlow-animations' ), harlow_asset_version( 'editor/canvas.css' ) );

	// The canvas's own document has no language; the page's has the site's, which the
	// browser shapes text by.
	wp_register_script( 'harlow-canvas', false, array(), HARLOW_VERSION, false );
	wp_enqueue_script( 'harlow-canvas' );
	wp_add_inline_script( 'harlow-canvas', 'document.documentElement.lang = ' . wp_json_encode( get_bloginfo( 'language' ) ) . ';' );
}
add_action( 'enqueue_block_assets', 'harlow_canvas_assets' );

/**
 * The blocks' edit views (theme/build/, built from theme/editor/ by `npm run build`), and
 * what they need to show links as the page does: the theme's address and every page's.
 */
function harlow_editor_assets() {
	$asset = require get_theme_file_path( 'build/index.asset.php' );
	wp_enqueue_script( 'harlow-editor', get_theme_file_uri( 'build/index.js' ), $asset['dependencies'], $asset['version'], true );
	wp_add_inline_script(
		'harlow-editor',
		'window.harlowEditor = ' . wp_json_encode(
			array(
				'themeUri' => get_theme_file_uri(),
				'pages'    => harlow_page_urls(),
			)
		) . ';',
		'before'
	);
	wp_set_script_translations( 'harlow-editor', 'harlow' );
	if ( file_exists( get_theme_file_path( 'build/index.css' ) ) ) {
		wp_enqueue_style( 'harlow-editor', get_theme_file_uri( 'build/index.css' ), array( 'wp-components' ), $asset['version'] );
	}
}
add_action( 'enqueue_block_editor_assets', 'harlow_editor_assets' );

/**
 * What WordPress and the plugins would add on top of the reference's stylesheets.
 *
 * The reference already holds every rule of WordPress's block library, classic-theme and
 * global styles that the live pages use (build_css.py kept them in base.css); loaded again
 * they would be a second, unpruned copy, and their custom properties would reach every
 * element. Contact Form 7's script and stylesheet are loaded where a form is
 * (functions/forms.php). The emoji script swaps characters for
 * pictures the live site does not show.
 */
function harlow_dequeue_extras() {
	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'classic-theme-styles' );
}
add_action( 'wp_enqueue_scripts', 'harlow_dequeue_extras', 100 );

// WordPress loads a small stylesheet for each core block a page uses (paragraph, list);
// loaded as one library instead, it is the library dequeued above.
add_filter( 'should_load_separate_core_block_assets', '__return_false' );

// Global styles are added late and in more than one place; not adding them is simpler.
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );

/*
 * WordPress 6.7 writes "auto, " at the front of a lazy picture's sizes, a newer way for the
 * browser to pick a file from the srcset. Live's pictures do not have it; left out, the
 * pictures are written as live writes them (and the style that goes with it is not added).
 */
add_filter( 'wp_img_tag_add_auto_sizes', '__return_false' );

/*
 * Rank Math writes rel="noopener" (and, by its settings, nofollow and a new tab) on links
 * in content as the page is printed. Live's pages print their links as they were made;
 * so do these: a link's target and rel are the block's.
 */
add_filter( 'rank_math/noopener', '__return_false' );
add_filter( 'rank_math/link/add_attributes', '__return_false' );

remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
