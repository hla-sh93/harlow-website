<?php
/**
 * A button (harlow/button): Elementor's button widget, its words, link and icon.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_link = '' !== $attributes['link'] ? harlow_link_attributes( $attributes ) : '';
if ( '' !== $attributes['linkId'] ) {
	$harlow_link .= ' id="' . esc_attr( $attributes['linkId'] ) . '"';
}
$harlow_parts = array( '<span class="elementor-button-text">' . wp_kses_post( $attributes['text'] ) . '</span>' );
if ( $attributes['hasIcon'] ) {
	$harlow_icon = '<span class="elementor-button-icon">' . "\n" . ( '' !== $attributes['icon'] ? harlow_icon( $attributes['icon'] ) . "\n" : '' ) . '</span>';
	if ( $attributes['iconAfter'] ) {
		$harlow_parts[] = $harlow_icon;
	} else {
		array_unshift( $harlow_parts, $harlow_icon );
	}
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'button.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-button-wrapper">' . "\n"
	. '<a class="' . esc_attr( $attributes['buttonClass'] ) . '"' . $harlow_link . '>' . "\n"
	. '<span class="elementor-button-content-wrapper">' . "\n" . implode( "\n", $harlow_parts ) . "\n" . '</span>' . "\n"
	. '</a>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
