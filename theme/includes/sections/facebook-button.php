<?php
/**
 * A Facebook button (harlow/facebook-button): Elementor Pro's Facebook button widget,
 * Facebook's own like or recommend button (its plugin markup, `fb-like`), for the page
 * (its plain or pretty address) or an address the owner gives. Facebook's SDK draws it,
 * loaded from Facebook's own address in the site's language only on a page that has the
 * widget (assets/js/widgets/facebook-button.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_element = $attributes;
if ( '' === trim( $harlow_element['classes'] ) ) {
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-facebook-button';
}
// What the script needs to load the SDK: the site's language and the site's Facebook app
// (Elementor Pro's setting, when the site has one).
$harlow_own                 = '' !== $attributes['settings'] ? json_decode( $attributes['settings'], true ) : array();
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_own ) ? $harlow_own : array(),
		array(
			'facebook_sdk_lang' => get_locale(),
			'facebook_app_id'   => (string) apply_filters( 'harlow_facebook_app_id', (string) get_option( 'elementor_pro_facebook_app_id', '' ) ),
		)
	)
);

// The address: the page's (plain, so its likes survive a change of address, as Elementor
// does; or its pretty address), or the owner's.
if ( 'custom' === $attributes['urlType'] ) {
	$harlow_url = filter_var( trim( (string) $attributes['url'] ), FILTER_VALIDATE_URL ) ? trim( (string) $attributes['url'] ) : '';
} else {
	$harlow_url = 'pretty' === $attributes['urlFormat'] ? (string) get_permalink() : add_query_arg( 'p', get_the_ID(), home_url() );
}

$harlow_types   = array( 'like', 'recommend' );
$harlow_layouts = array( 'standard', 'button', 'button_count', 'box_count' );
if ( '' === $harlow_url ) {
	/* translators: %s: the widget's name. */
	$harlow_inner = esc_html( sprintf( __( '%s: Please enter a valid URL', 'harlow' ), __( 'Facebook Button', 'harlow' ) ) );
} else {
	$harlow_inner = '<div class="elementor-facebook-widget fb-like"'
		. ' data-layout="' . esc_attr( in_array( $attributes['layout'], $harlow_layouts, true ) ? $attributes['layout'] : 'standard' ) . '"'
		. ' data-colorscheme="' . ( 'dark' === $attributes['colorScheme'] ? 'dark' : 'light' ) . '"'
		. ' data-size="' . ( 'large' === $attributes['size'] ? 'large' : 'small' ) . '"'
		. ' data-show-faces="' . ( $attributes['showFaces'] ? 'true' : 'false' ) . '"'
		. ' data-href="' . esc_url( $harlow_url ) . '"'
		. ' data-share="' . ( $attributes['showShare'] ? 'true' : 'false' ) . '"'
		. ' data-action="' . esc_attr( in_array( $attributes['type'], $harlow_types, true ) ? $attributes['type'] : 'like' ) . '"></div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'facebook-button.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the address are escaped where they are built.
