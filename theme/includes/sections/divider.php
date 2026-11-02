<?php
/**
 * A divider (harlow/divider): Elementor's divider widget, a line; its look is in its
 * design classes.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// A word or an icon in the line's middle (Elementor's "Add element").
$harlow_element = '';
if ( 'text' === $attributes['elementType'] ) {
	$harlow_element = '<span class="elementor-divider__text elementor-divider__element">' . esc_html( $attributes['elementText'] ) . '</span>' . "\n";
} elseif ( 'icon' === $attributes['elementType'] ) {
	$harlow_element = '<div class="elementor-icon elementor-divider__element">' . harlow_icon( $attributes['elementIcon'] ) . '</div>' . "\n";
}
// Its line's style, or a pattern in its place (classes of modules.css).
$harlow_line = '';
if ( '' !== $attributes['pattern'] ) {
	$harlow_line = ' harlow-divider-pattern harlow-divider-pattern-' . sanitize_html_class( $attributes['pattern'] );
} elseif ( '' !== $attributes['lineStyle'] ) {
	$harlow_line = ' harlow-divider-style-' . sanitize_html_class( $attributes['lineStyle'] );
}
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'divider.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-divider' . $harlow_line . '">' . "\n"
	. '<span class="elementor-divider-separator">' . "\n" . $harlow_element . '</span>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes are escaped in harlow_element_attributes().
