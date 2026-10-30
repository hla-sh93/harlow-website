<?php
/**
 * An accordion (harlow/accordion): Elementor's accordion widget, questions whose answers
 * open one at a time (assets/js/accordion.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The questions (harlow/accordion-item), printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'accordion.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-accordion">' . $content . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes are escaped in harlow_element_attributes(); the inside is the inner blocks, printed by WordPress.
