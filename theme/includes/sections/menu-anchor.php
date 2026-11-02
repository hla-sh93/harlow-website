<?php
/**
 * A menu anchor (harlow/menu-anchor): Elementor's menu anchor widget, an empty element
 * with the id a link leads to (`#contact`). Without an id, Elementor prints nothing inside
 * the element, and neither does this.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_anchor = sanitize_html_class( (string) $attributes['anchor'] );
$harlow_html   = '<div' . harlow_element_attributes( $attributes, 'widget', 'menu-anchor.default' ) . '>';
if ( '' !== $harlow_anchor ) {
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n"
		. '<div class="elementor-menu-anchor" id="' . esc_attr( $harlow_anchor ) . '"></div>' . "\n"
		. '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the id are escaped where they are built.
