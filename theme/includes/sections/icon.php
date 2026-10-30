<?php
/**
 * An icon (harlow/icon): Elementor's icon widget, an icon of the site's set.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'icon.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-icon-wrapper">' . "\n"
	. '<div class="elementor-icon">' . "\n" . harlow_icon( $attributes['icon'] ) . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the icon are escaped where they are built.
