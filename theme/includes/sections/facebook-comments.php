<?php
/**
 * Facebook comments (harlow/facebook-comments): Elementor Pro's Facebook comments widget,
 * Facebook's comments box (its plugin markup, `fb-comments`) for the page (its plain or
 * pretty address) or an address the owner gives, so many comments shown, in an order.
 * Facebook's SDK draws it (assets/js/widgets/facebook-comments.js).
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
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-facebook-comments';
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

if ( 'custom' === $attributes['urlType'] ) {
	$harlow_url = filter_var( trim( (string) $attributes['url'] ), FILTER_VALIDATE_URL ) ? trim( (string) $attributes['url'] ) : '';
} else {
	$harlow_url = 'pretty' === $attributes['urlFormat'] ? (string) get_permalink() : add_query_arg( 'p', get_the_ID(), home_url() );
}

if ( '' === $harlow_url ) {
	/* translators: %s: the widget's name. */
	$harlow_inner = esc_html( sprintf( __( '%s: Please enter a valid URL', 'harlow' ), __( 'Facebook Comments', 'harlow' ) ) );
} else {
	// The style keeps the element from counting as empty before the SDK draws it, as on Elementor.
	$harlow_inner = '<div class="elementor-facebook-widget fb-comments"'
		. ' data-href="' . esc_url( $harlow_url ) . '"'
		. ' data-width="100%"'
		. ' data-numposts="' . max( 5, min( 100, (int) $attributes['commentsNumber'] ) ) . '"'
		. ' data-order-by="' . esc_attr( in_array( $attributes['orderBy'], array( 'social', 'reverse_time', 'time' ), true ) ? $attributes['orderBy'] : 'social' ) . '"'
		. ' style="min-height: 1px"></div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'facebook-comments.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the address are escaped where they are built.
