<?php
/**
 * A spacer (harlow/spacer): Elementor's spacer widget, an empty box as tall as its space.
 * The space of each device is a custom property of the element (harlow_spacer_vars()),
 * which assets/css/widgets/spacer.css turns into Elementor's --spacer-size.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'spacer.default' ) . harlow_spacer_style( harlow_spacer_vars( $attributes, 'space', '--harlow-spacer' ) ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-spacer">' . "\n"
	. '<div class="elementor-spacer-inner"></div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the lengths are escaped where they are built.
