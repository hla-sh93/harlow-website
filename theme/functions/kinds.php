<?php
/**
 * The kinds of page (K1-K6 in the project's inventory) as page templates.
 *
 * A page's kind is its template (Page > Template): it decides whether the page is on
 * Elementor's canvas (the front page: no site header or footer around its sections, its
 * own sections hold them) and whose page-wide design rules it loads (its kind's model
 * page's documents, kinds.json, written by _tools/gen_blocks.py with the starters). A new
 * page asks for its kind and can take that kind's ready layout (editor/kinds.js).
 *
 * The installed pages keep the documents live gave each of them (`_harlow_documents`);
 * any page or item also loads the rules of the lists and shared sections it holds.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The kind of a page on the default template: a content page. */
const HARLOW_DEFAULT_KIND = 'k6';

/**
 * The kinds of page and the single templates' documents, from kinds.json.
 *
 * @return array{pages: array<string,array<string,mixed>>, singles: array<string,array<string,mixed>>}
 */
function harlow_kinds() {
	static $kinds = null;
	if ( null === $kinds ) {
		$file  = get_theme_file_path( 'kinds.json' );
		$data  = file_exists( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
		$kinds = array(
			'pages'   => isset( $data['pages'] ) ? $data['pages'] : array(),
			'singles' => isset( $data['singles'] ) ? $data['singles'] : array(),
		);
	}
	return $kinds;
}

/**
 * The page templates: one per kind (kind-k1 ... kind-k6), named as the kinds are.
 *
 * @param array<string,string> $templates The theme's page templates.
 * @return array<string,string>
 */
function harlow_kind_templates( $templates ) {
	foreach ( harlow_kinds()['pages'] as $kind => $info ) {
		$templates[ 'kind-' . $kind ] = $info['title'];
	}
	return $templates;
}
add_filter( 'theme_page_templates', 'harlow_kind_templates' );

/**
 * The kind of a page: its template's, the default template's for any other.
 *
 * @param int $post_id The page.
 * @return string k1 ... k6.
 */
function harlow_page_kind( $post_id ) {
	$template = (string) get_page_template_slug( $post_id );
	$kind     = 0 === strpos( $template, 'kind-' ) ? substr( $template, 5 ) : '';
	return isset( harlow_kinds()['pages'][ $kind ] ) ? $kind : HARLOW_DEFAULT_KIND;
}

/**
 * Is this page on Elementor's canvas (its kind's model page is)?
 *
 * @param int $post_id The page.
 * @return bool
 */
function harlow_is_canvas( $post_id ) {
	$kinds = harlow_kinds()['pages'];
	$kind  = harlow_page_kind( $post_id );
	return 'page' === get_post_type( $post_id ) && ! empty( $kinds[ $kind ]['canvas'] );
}

/**
 * The documents whose page-wide rules a page or item loads, in the reference's order: the
 * ones live gave it, or its kind's (a page) or its single template's (an item); then the
 * lists and the major clients it holds that those lack.
 *
 * @param int $post_id The page or item.
 * @return string[]
 */
function harlow_post_documents( $post_id ) {
	$documents = get_post_meta( $post_id, '_harlow_documents', true );
	if ( ! is_array( $documents ) || ! $documents ) {
		$kinds = harlow_kinds();
		$type  = get_post_type( $post_id );
		if ( 'page' === $type ) {
			$documents = $kinds['pages'][ harlow_page_kind( $post_id ) ]['documents'] ?? array();
		} elseif ( isset( HARLOW_SINGLES[ $type ], $kinds['singles'][ HARLOW_SINGLES[ $type ] ] ) ) {
			$documents = $kinds['singles'][ HARLOW_SINGLES[ $type ] ]['documents'];
		} else {
			$documents = array();
		}
	}
	$documents = $documents ? $documents : HARLOW_CHROME_DOCUMENTS;
	foreach ( harlow_held_documents( (string) get_post_field( 'post_content', $post_id ) ) as $held ) {
		if ( in_array( $held, $documents, true ) ) {
			continue;
		}
		// A list's rules go before the major clients' and the footer's, the clients' before the footer's.
		$before = 'post-5532' === $held ? array( 'post-1066' ) : array( 'post-5532', 'post-1066' );
		$at     = count( $documents );
		foreach ( $before as $next ) {
			$found = array_search( $next, $documents, true );
			if ( false !== $found ) {
				$at = min( $at, (int) $found );
			}
		}
		array_splice( $documents, $at, 0, array( $held ) );
	}
	return array_values( array_filter( $documents, 'harlow_is_document' ) );
}

/**
 * The documents of the lists (their cards' loop templates) and of the major clients (the
 * synced pattern #5532) that a page's blocks hold, in the order they come.
 *
 * @param string $content The page's blocks.
 * @return string[]
 */
function harlow_held_documents( $content ) {
	if ( false === strpos( $content, '<!-- wp:harlow/loop ' ) && false === strpos( $content, '<!-- wp:block ' ) ) {
		return array();
	}
	$found = array();
	$walk  = function ( $blocks ) use ( &$walk, &$found ) {
		foreach ( $blocks as $block ) {
			if ( 'harlow/loop' === $block['blockName'] ) {
				$templates = harlow_loop_templates();
				$card      = isset( $block['attrs']['template'] ) ? $block['attrs']['template'] : 'post-card';
				if ( ! empty( $templates[ $card ] ) ) {
					$found[] = 'loop-' . $templates[ $card ];
				}
			} elseif ( 'core/block' === $block['blockName'] && isset( $block['attrs']['ref'] ) && 5532 === (int) $block['attrs']['ref'] ) {
				$found[] = 'post-5532';
			}
			$walk( $block['innerBlocks'] );
		}
	};
	$walk( parse_blocks( $content ) );
	return array_values( array_unique( $found ) );
}
