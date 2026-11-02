<?php
/**
 * A widget area (harlow/sidebar): Elementor's sidebar widget, the widgets of the area
 * chosen (Appearance → Widgets) as WordPress prints them.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_area    = harlow_sidebar_area( (string) $attributes['sidebar'] );
$harlow_widgets = '';
if ( '' !== $harlow_area ) {
	ob_start();
	dynamic_sidebar( $harlow_area );
	$harlow_widgets = (string) ob_get_clean();
}
// The editor says what is missing; the page prints the area as it is.
if ( '' === trim( $harlow_widgets ) && defined( 'REST_REQUEST' ) && REST_REQUEST ) {
	$harlow_widgets = '<p class="harlow-source-note">' . esc_html__( '[No widgets in this area yet: Appearance → Widgets]', 'harlow' ) . '</p>';
}
$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'sidebar' ), 'widget', 'sidebar.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_widgets . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the widgets as WordPress prints them; the attributes in harlow_element_attributes().
