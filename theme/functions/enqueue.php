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

/**
 * The design vocabulary, one file per axis, then the whole palette for the editor's
 * swatches (assets/css/design/, see _vocab/vocabulary.md).
 */
const HARLOW_CSS_DESIGN = array( 'brand', 'type', 'space', 'layout', 'size', 'surface', 'effects', 'misc', 'palette' );

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
 * those of the documents it shows and no others (harlow_post_documents(): the list live
 * gave it, or its kind's); anything else shows the header and footer.
 *
 * @return string[]
 */
function harlow_page_documents() {
	if ( is_singular() || is_front_page() ) {
		return harlow_post_documents( (int) get_queried_object_id() );
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
 * A module that only some pages need (a slideshow, motion effects, a widget's script),
 * enqueued when a block that uses it is printed: deferred in the footer, as the others.
 *
 * @param string $module The module's name (assets/js/<module>.js).
 */
function harlow_enqueue_module( $module ) {
	$module = sanitize_key( $module );
	$path   = 'assets/js/' . $module . '.js';
	if ( wp_script_is( 'harlow-' . $module, 'enqueued' ) || ! file_exists( get_theme_file_path( $path ) ) ) {
		return;
	}
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

/**
 * A widget's own stylesheet and script (assets/css/widgets/<name>.css,
 * assets/js/widgets/<name>.js), as Elementor loads a widget's assets only where it is
 * used: enqueued for each widget of the page when its head is printed, and, for one found
 * only as the page is printed, then (WordPress prints such a stylesheet in the footer).
 *
 * @param string $name The block's name without its namespace (counter, tabs, ...).
 */
function harlow_enqueue_widget( $name ) {
	$name = sanitize_key( $name );
	$css  = 'assets/css/widgets/' . $name . '.css';
	if ( ! wp_style_is( 'harlow-widget-' . $name, 'enqueued' ) && file_exists( get_theme_file_path( $css ) ) ) {
		wp_enqueue_style( 'harlow-widget-' . $name, get_theme_file_uri( $css ), array( 'harlow-modules' ), harlow_asset_version( $css ) );
	}
	$js = 'assets/js/widgets/' . $name . '.js';
	if ( ! wp_script_is( 'harlow-widget-' . $name, 'enqueued' ) && file_exists( get_theme_file_path( $js ) ) ) {
		wp_enqueue_script(
			'harlow-widget-' . $name,
			get_theme_file_uri( $js ),
			array(),
			harlow_asset_version( $js ),
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
	}
}

/**
 * The names of the blocks a page holds: its own, those of the synced patterns it shows,
 * and, for an item's page, those of the item page templates.
 *
 * @return string[] Block names (harlow/counter, ...).
 */
function harlow_page_block_names() {
	if ( ! is_singular() && ! is_front_page() ) {
		/** This filter is documented below. */
		return apply_filters( 'harlow_page_block_names', array() );
	}
	$id      = (int) get_queried_object_id();
	$content = (string) get_post_field( 'post_content', $id, 'raw' );
	if ( ! is_page( $id ) ) {
		foreach ( array_keys( harlow_single_templates() ) as $template ) {
			$content .= harlow_single_template_blocks( $template );
		}
	}
	$names = array();
	harlow_collect_block_names( parse_blocks( $content ), $names, 0 );
	/**
	 * The page's block names, with those of what is printed around it (Theme Builder
	 * templates, popups).
	 *
	 * @param string[] $names Block names.
	 */
	return apply_filters( 'harlow_page_block_names', array_keys( $names ) );
}

/**
 * Collect block names, following synced patterns a few levels deep.
 *
 * @param array<int,array<string,mixed>> $blocks Parsed blocks.
 * @param array<string,bool>             $names  The names found so far.
 * @param int                            $depth  How deep in synced patterns.
 */
function harlow_collect_block_names( $blocks, &$names, $depth ) {
	foreach ( $blocks as $block ) {
		if ( empty( $block['blockName'] ) ) {
			continue;
		}
		$names[ $block['blockName'] ] = true;
		if ( 'core/block' === $block['blockName'] && ! empty( $block['attrs']['ref'] ) && $depth < 5 ) {
			harlow_collect_block_names( parse_blocks( (string) get_post_field( 'post_content', (int) $block['attrs']['ref'], 'raw' ) ), $names, $depth + 1 );
		}
		harlow_collect_block_names( $block['innerBlocks'], $names, $depth );
	}
}

/**
 * The widgets of the page, in its head.
 */
function harlow_enqueue_page_widgets() {
	foreach ( harlow_page_block_names() as $name ) {
		if ( 0 === strpos( $name, 'harlow/' ) ) {
			harlow_enqueue_widget( substr( $name, 7 ) );
		}
	}
}
add_action( 'wp_enqueue_scripts', 'harlow_enqueue_page_widgets', 20 );

/**
 * A widget printed where the head did not see it (a list's card, a template): its assets.
 *
 * @param string              $html  The block as printed.
 * @param array<string,mixed> $block The block.
 * @return string
 */
function harlow_enqueue_printed_widget( $html, $block ) {
	if ( ! empty( $block['blockName'] ) && 0 === strpos( $block['blockName'], 'harlow/' ) && ! is_admin() ) {
		harlow_enqueue_widget( substr( $block['blockName'], 7 ) );
	}
	return $html;
}
add_filter( 'render_block', 'harlow_enqueue_printed_widget', 10, 2 );

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
	$post = get_post();
	// A form's page: CF7's stylesheet first, as on the page (functions/forms.php).
	if ( $post && function_exists( 'wpcf7_plugin_url' ) && false !== strpos( $post->post_content, '[contact-form-7 ' ) ) {
		wp_enqueue_style( 'contact-form-7', wpcf7_plugin_url( 'includes/css/styles.css' ), array(), WPCF7_VERSION );
	}
	harlow_enqueue_styles( $post ? harlow_post_documents( $post->ID ) : HARLOW_CHROME_DOCUMENTS );
	harlow_brand_style();
	wp_enqueue_style( 'harlow-canvas', get_theme_file_uri( 'editor/canvas.css' ), array( 'harlow-animations' ), harlow_asset_version( 'editor/canvas.css' ) );
	// Every widget's stylesheet: any widget may be added to the page in the editor.
	foreach ( glob( get_theme_file_path( 'assets/css/widgets/*.css' ) ) as $file ) {
		$name = basename( $file, '.css' );
		wp_enqueue_style( 'harlow-widget-' . $name, get_theme_file_uri( 'assets/css/widgets/' . $name . '.css' ), array( 'harlow-modules' ), harlow_asset_version( 'assets/css/widgets/' . $name . '.css' ) );
	}

	// The canvas's own document has no language; the page's has the site's, which the
	// browser shapes text by.
	wp_register_script( 'harlow-canvas', false, array(), HARLOW_VERSION, false );
	wp_enqueue_script( 'harlow-canvas' );
	wp_add_inline_script( 'harlow-canvas', 'document.documentElement.lang = ' . wp_json_encode( get_bloginfo( 'language' ) ) . ';' );
}
add_action( 'enqueue_block_assets', 'harlow_canvas_assets' );

/**
 * The blocks' edit views (theme/build/, built from theme/editor/ by `npm run build`), and
 * what they need: the theme's address and every page's (links are shown as the page shows
 * them), the pages a link can be picked from, the kinds of page and their starters, the
 * page's original sections (functions/page-tools.php), and the design vocabulary as the
 * Design panel reads it (editor/design-classes.json, written by gen_blocks.py: each class's
 * property, value, part and device, and the choices each kind of block offers; handed over
 * here rather than bundled, so the bundle stays small).
 */
function harlow_editor_assets() {
	$asset = require get_theme_file_path( 'build/index.asset.php' );
	$post  = get_post();
	wp_enqueue_script( 'harlow-editor', get_theme_file_uri( 'build/index.js' ), $asset['dependencies'], $asset['version'], true );
	wp_add_inline_script(
		'harlow-editor',
		'window.harlowEditor = ' . wp_json_encode(
			array(
				'themeUri'      => get_theme_file_uri(),
				'pages'         => harlow_page_urls(),
				'linkTargets'   => harlow_link_targets(),
				'kinds'         => harlow_kinds()['pages'],
				'original'      => $post ? harlow_page_original( $post->ID ) : '',
				'design'        => json_decode( (string) file_get_contents( get_theme_file_path( 'editor/design-classes.json' ) ), true ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
				// The Style tab's presets (editor/styles.js): the design's palette and type scale
				// (from the vocabulary), the site's fonts.
				'palette'       => harlow_design_scale( 'palette' ),
				'typeScale'     => array_map( 'intval', harlow_design_scale( 'sizes' ) ),
				'fonts'         => array_values( array_unique( array_merge( harlow_site_fonts(), harlow_owner_fonts() ) ) ),
				// Site settings → Global colours: the kit's four and the owner's own.
				'globals'       => harlow_global_colours_for_editor(),
				// The breakpoints the Styles tab offers, in the order their rules print.
				'devices'       => harlow_devices(),
				// The Theme Builder's templates (a list's card is picked from them).
				'templates'     => harlow_templates_for_editor(),
				'templateKinds' => array_map(
					static function ( $kind ) {
						return $kind[0];
					},
					harlow_template_kinds()
				),
				// The roles a display condition may name.
				'roles'         => array_map( 'translate_user_role', wp_roles()->get_names() ),
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
