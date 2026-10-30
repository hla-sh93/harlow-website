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

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'divider.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-divider">' . "\n"
	. '<span class="elementor-divider-separator">' . "\n" . '</span>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes are escaped in harlow_element_attributes().
