<?php
/**
 * What only those trusted with HTML may put in an element, kept out of anyone else's save;
 * the role manager's editors of the words and pictures only held to them on the server too;
 * and what a visitor may read about the site kept to what a visitor needs
 * (_tools/verify_perf_security.py tests each).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * A save of a page, item or template made of the theme's blocks:
 *
 * - by someone WordPress does not trust with HTML (unfiltered_html: an author, a
 *   contributor), an element's custom CSS, its custom attributes and a dynamic tag running a
 *   shortcode are taken out, as WordPress's kses takes their scripts out of the words;
 * - by an editor of the words and pictures only (Appearance → Editing and maintenance), every
 *   element keeps the design it had (its style, design classes, settings and id); an element
 *   they add has none of its own.
 *
 * Elementor lets anyone who edits with it write Custom CSS; WordPress gives page CSS and
 * markup to those with unfiltered_html only, and so does this theme.
 *
 * @param array<string,mixed> $data    The post as it will be saved (slashed).
 * @param array<string,mixed> $postarr What the save was given.
 * @return array<string,mixed>
 */
function harlow_security_save( $data, $postarr ) {
	if ( empty( $data['post_content'] ) ) {
		return $data;
	}
	// The installer runs in WP-CLI as no one: its content is the site's own (it turns kses off
	// for its data too).
	$trusted      = current_user_can( 'unfiltered_html' ) || ( defined( 'WP_CLI' ) && WP_CLI && ! get_current_user_id() );
	$content_only = harlow_content_only();
	if ( ! $trusted && false !== strpos( $data['post_content'], 'shortcode' ) ) {
		// A dynamic tag running a shortcode written as the words' own HTML (kses lets an author
		// write a span with data attributes) keeps only its words.
		$data['post_content'] = wp_slash( harlow_security_no_shortcode_tags( wp_unslash( $data['post_content'] ) ) );
	}
	if ( ( $trusted && ! $content_only ) || false === strpos( $data['post_content'], 'wp:harlow/' ) ) {
		return $data;
	}
	$before = array();
	if ( $content_only && ! empty( $postarr['ID'] ) ) {
		$old = get_post( (int) $postarr['ID'] );
		if ( $old ) {
			harlow_security_designs( parse_blocks( $old->post_content ), $before );
		}
	}
	$changed = false;
	$blocks  = harlow_security_walk( parse_blocks( wp_unslash( $data['post_content'] ) ), $trusted, $content_only, $before, $changed );
	if ( $changed ) {
		$data['post_content'] = wp_slash( serialize_blocks( $blocks ) );
	}
	return $data;
}
add_filter( 'wp_insert_post_data', 'harlow_security_save', 20, 2 );

/**
 * Words with every dynamic tag that runs a shortcode turned back into its plain words.
 *
 * @param string $html Words, as HTML.
 * @return string
 */
function harlow_security_no_shortcode_tags( $html ) {
	return (string) preg_replace( '#<span\b[^>]*\bdata-tag\s*=\s*(["\']?)shortcode\1[^>]*>(.*?)</span>#is', '$2', $html );
}

/** The attributes that are an element's design, not its words and pictures. */
const HARLOW_DESIGN_ATTRIBUTES = array( 'style', 'classes', 'settings', 'htmlId' );

/**
 * Every element's design in a post's blocks, by its element id.
 *
 * @param array<int,array<string,mixed>> $blocks Parsed blocks.
 * @param array<string,array>            $out    Element id => its design attributes.
 */
function harlow_security_designs( $blocks, &$out ) {
	foreach ( $blocks as $block ) {
		$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
		if ( ! empty( $attrs['element'] ) && is_string( $attrs['element'] ) ) {
			$out[ $attrs['element'] ] = array_intersect_key( $attrs, array_flip( HARLOW_DESIGN_ATTRIBUTES ) );
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			harlow_security_designs( $block['innerBlocks'], $out );
		}
	}
}

/**
 * The blocks as they may be saved (harlow_security_save()).
 *
 * @param array<int,array<string,mixed>> $blocks       Parsed blocks.
 * @param bool                           $trusted      The person saving has unfiltered_html.
 * @param bool                           $content_only The person saving edits words and pictures only.
 * @param array<string,array>            $before       Each element's design before the save.
 * @param bool                           $changed      Set when anything was taken out or put back.
 * @return array<int,array<string,mixed>>
 */
function harlow_security_walk( $blocks, $trusted, $content_only, $before, &$changed ) {
	foreach ( $blocks as $index => $block ) {
		$name  = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';
		$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
		$was   = $attrs;
		if ( 0 === strpos( $name, 'harlow/' ) ) {
			if ( ! $trusted ) {
				if ( isset( $attrs['style'] ) && is_array( $attrs['style'] ) ) {
					unset( $attrs['style']['attributes'] );
					foreach ( $attrs['style'] as $key => $value ) {
						if ( is_array( $value ) && array_key_exists( 'css', $value ) ) {
							unset( $attrs['style'][ $key ]['css'] );
						}
					}
				}
				foreach ( $attrs as $key => $value ) {
					if ( is_string( $value ) && false !== strpos( $value, 'shortcode' ) ) {
						$attrs[ $key ] = harlow_security_no_shortcode_tags( $value );
					}
				}
			}
			if ( $content_only ) {
				$element = isset( $attrs['element'] ) && is_string( $attrs['element'] ) ? $attrs['element'] : '';
				foreach ( HARLOW_DESIGN_ATTRIBUTES as $design ) {
					if ( '' !== $element && isset( $before[ $element ] ) ) {
						if ( array_key_exists( $design, $before[ $element ] ) ) {
							$attrs[ $design ] = $before[ $element ][ $design ];
						} else {
							unset( $attrs[ $design ] );
						}
					} elseif ( 'style' === $design ) {
						unset( $attrs['style'] );
					}
				}
			}
		}
		if ( $attrs !== $was ) {
			$blocks[ $index ]['attrs'] = $attrs;
			$changed                   = true;
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			$blocks[ $index ]['innerBlocks'] = harlow_security_walk( $block['innerBlocks'], $trusted, $content_only, $before, $changed );
		}
	}
	return $blocks;
}

/**
 * Hardening a visitor needs nothing of: WordPress's version in the head (live shows it: a
 * deliberate difference, README), XML-RPC (password guessing many at once; nothing on this
 * site uses it), and the list of the site's users through the REST API (their login names).
 */
remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );
add_filter( 'xmlrpc_enabled', '__return_false' );
// No method at all (xmlrpc_enabled leaves the ones without a login: listing, pingbacks).
add_filter( 'xmlrpc_methods', '__return_empty_array' );

/**
 * XML-RPC refused as a whole: its server adds its own system methods to any list.
 */
function harlow_security_no_xmlrpc() {
	if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
		status_header( 403 );
		exit;
	}
}
add_action( 'init', 'harlow_security_no_xmlrpc', 0 );

/**
 * The REST API's users routes, for those logged in only.
 *
 * @param array<string,mixed> $endpoints The routes.
 * @return array<string,mixed>
 */
function harlow_security_users_endpoints( $endpoints ) {
	if ( ! is_user_logged_in() ) {
		foreach ( array_keys( $endpoints ) as $route ) {
			if ( 0 === strpos( $route, '/wp/v2/users' ) ) {
				unset( $endpoints[ $route ] );
			}
		}
	}
	return $endpoints;
}
add_filter( 'rest_endpoints', 'harlow_security_users_endpoints' );
