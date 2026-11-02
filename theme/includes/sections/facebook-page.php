<?php
/**
 * A Facebook page (harlow/facebook-page): Elementor Pro's Facebook page widget, a page of
 * Facebook (`fb-page`: its timeline, events or messages, a small header or not, its cover,
 * the faces of friends who like it, its call to action) at a height, in Facebook's plugin
 * markup. Facebook's SDK draws it (assets/js/widgets/facebook-page.js).
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
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-facebook-page';
}
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

$harlow_url  = trim( (string) $attributes['url'] );
$harlow_tabs = array_values( array_intersect( array( 'timeline', 'events', 'messages' ), is_array( $attributes['tabs'] ) ? $attributes['tabs'] : array() ) );
$harlow_high = max( 70, min( 1000, (int) $attributes['height'] ) ) . 'px';

if ( '' === $harlow_url ) {
	/* translators: %s: the widget's name. */
	$harlow_inner = esc_html( sprintf( __( '%s: Please enter a valid URL', 'harlow' ), __( 'Facebook Page', 'harlow' ) ) );
} else {
	// The widest Facebook draws (it narrows to the element); the style keeps the element from
	// counting as empty before the SDK draws it, at the page's height, as on Elementor.
	$harlow_inner = '<div class="elementor-facebook-widget fb-page"'
		. ' data-href="' . esc_url( $harlow_url ) . '"'
		. ' data-tabs="' . esc_attr( implode( ',', $harlow_tabs ) ) . '"'
		. ' data-height="' . esc_attr( $harlow_high ) . '"'
		. ' data-width="500px"'
		. ' data-small-header="' . ( $attributes['smallHeader'] ? 'true' : 'false' ) . '"'
		. ' data-hide-cover="' . ( $attributes['showCover'] ? 'false' : 'true' ) . '"'
		. ' data-show-facepile="' . ( $attributes['showFacepile'] ? 'true' : 'false' ) . '"'
		. ' data-hide-cta="' . ( $attributes['showCta'] ? 'false' : 'true' ) . '"'
		. ' style="' . esc_attr( 'min-height: 1px;height:' . $harlow_high ) . '"></div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'facebook-page.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the address are escaped where they are built.
