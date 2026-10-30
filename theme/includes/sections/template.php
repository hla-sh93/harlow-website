<?php
/**
 * A shared section (harlow/template): Elementor's template widget, around a synced pattern
 * (the major clients, edited once for every page) or, on the home page, the site's header
 * or footer.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The synced pattern or the header or footer, printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'template.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-template">' . "\n" . $content . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the inner blocks, printed by WordPress; the attributes escaped in harlow_element_attributes().
