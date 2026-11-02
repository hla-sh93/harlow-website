<?php
/**
 * An icon (harlow/icon): Elementor's icon widget, an icon of the library, its view and
 * shape (the element's classes), a link if it has one.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// With a link, the icon itself is the link, as Elementor prints it.
$harlow_box  = '' !== $attributes['link'] ? '<a class="elementor-icon"' . harlow_link_attributes( $attributes ) . '>' : '<div class="elementor-icon">';
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'icon.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-icon-wrapper">' . "\n"
	. $harlow_box . "\n" . harlow_icon( $attributes['icon'] ) . "\n" . ( '' !== $attributes['link'] ? '</a>' : '</div>' ) . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the icon are escaped where they are built.
