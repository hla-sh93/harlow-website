<?php
/**
 * The share buttons widget: the networks it shares to (their names and icons, in
 * blocks/share-buttons/networks.json, which the editor reads too), what a page shares
 * (its address, title, excerpt and featured picture), and the owner's own colours.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The networks: name => [ title, icon ].
 *
 * @return array<string,array{title: string, icon: string}>
 */
function harlow_share_buttons_networks() {
	static $networks = null;
	if ( null === $networks ) {
		$file     = get_theme_file_path( 'blocks/share-buttons/networks.json' );
		$data     = file_exists( $file ) ? wp_json_file_decode( $file, array( 'associative' => true ) ) : null;
		$networks = is_array( $data ) ? $data : array();
	}
	return $networks;
}

/**
 * What the buttons share, as the widget's script reads it: the custom address, or the
 * page's address with its title, excerpt and featured picture (as Elementor's script takes
 * them from the page).
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return array<string,string>
 */
function harlow_share_buttons_target( $attributes ) {
	if ( 'custom_url' === $attributes['shareUrlType'] && '' !== trim( (string) $attributes['shareUrl'] ) ) {
		return array(
			'share_url_type' => 'custom_url',
			'share_url'      => harlow_link_url( trim( (string) $attributes['shareUrl'] ) ),
		);
	}
	$post = get_post();
	return array(
		'share_url_type' => 'current_page',
		'share_title'    => $post ? wp_strip_all_tags( get_the_title( $post ) ) : '',
		'share_text'     => $post && ! post_password_required( $post ) ? wp_strip_all_tags( get_the_excerpt( $post ) ) : '',
		'share_image'    => $post ? (string) get_the_post_thumbnail_url( $post, 'full' ) : '',
	);
}

/**
 * A colour the owner picked, if it is one: #hex, rgb(a) or hsl(a), or one of the kit's.
 *
 * @param mixed $colour The colour.
 * @return string The colour, or ''.
 */
function harlow_share_buttons_colour( $colour ) {
	$colour = trim( (string) $colour );
	if ( preg_match( '/^#[0-9a-f]{3,8}$/i', $colour ) || preg_match( '/^(rgb|hsl)a?\([\d\s.,%\/]+\)$/i', $colour ) || preg_match( '/^var\(--e-global-color-[a-z0-9_-]+\)$/i', $colour ) ) {
		return $colour;
	}
	return '';
}
