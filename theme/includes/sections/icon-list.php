<?php
/**
 * An icon list (harlow/icon-list): Elementor's icon list widget, lines with an icon and a
 * link each, one under the other or in a row.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_lines = '';
foreach ( $attributes['items'] as $harlow_item ) {
	$harlow_item  = wp_parse_args(
		$harlow_item,
		array(
			'link'       => '',
			'linkTarget' => '',
			'linkRel'    => '',
			'icon'       => '',
			'text'       => '',
		)
	);
	$harlow_parts = '';
	if ( '' !== $harlow_item['icon'] ) {
		$harlow_parts .= '<span class="elementor-icon-list-icon">' . "\n" . harlow_icon( $harlow_item['icon'] ) . "\n" . '</span>' . "\n";
	}
	$harlow_parts .= '<span class="elementor-icon-list-text">' . wp_kses_post( $harlow_item['text'] ) . '</span>';
	if ( '' !== $harlow_item['link'] ) {
		$harlow_parts = '<a' . harlow_link_attributes( $harlow_item ) . '>' . "\n\n" . $harlow_parts . "\n" . '</a>';
	}
	$harlow_lines .= "\n" . '<li class="elementor-icon-list-item' . ( $attributes['inline'] ? ' elementor-inline-item' : '' ) . '">' . "\n" . $harlow_parts . "\n" . '</li>';
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'icon-list.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<ul class="elementor-icon-list-items' . ( $attributes['inline'] ? ' elementor-inline-items' : '' ) . '">' . $harlow_lines . "\n" . '</ul>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
