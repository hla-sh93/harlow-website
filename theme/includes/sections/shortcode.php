<?php
/**
 * A shortcode's output (harlow/shortcode): what live's plugins printed in a shortcode
 * widget, kept as it is: the contact form (Contact Form 7, which prints it itself from
 * stage 5) and the group chart (hidden on every device on live).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_inside = '' !== $attributes['shortcode'] ? do_shortcode( $attributes['shortcode'] ) : harlow_resolve_links( $attributes['html'] );
// In the editor a shortcode not written yet shows where it goes, so it can be found and styled.
if ( '' === trim( $harlow_inside ) && wp_is_serving_rest_request() ) {
	$harlow_inside = '<p class="harlow-source-note">' . esc_html__( '[A shortcode: write it in the sidebar]', 'harlow' ) . '</p>';
}
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'shortcode.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-shortcode">' . $harlow_inside . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the shortcode's plugin escapes what it prints; markup saved in the page by someone allowed to write HTML is printed as core's HTML block prints it.
