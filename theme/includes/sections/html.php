<?php
/**
 * An HTML widget (harlow/html): markup written by hand, printed as written (the home
 * page's history slider, run by assets/js/history-slider.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'html.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . harlow_resolve_links( $attributes['html'] ) . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- markup saved in the page by someone allowed to write HTML, printed as core's HTML block prints it.
