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

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'shortcode.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-shortcode">' . harlow_resolve_links( $attributes['html'] ) . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- markup saved in the page by someone allowed to write HTML, printed as core's HTML block prints it.
