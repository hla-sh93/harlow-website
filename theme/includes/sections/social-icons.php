<?php
/**
 * Social icons (harlow/social-icons): Elementor's social icons widget, one round icon per
 * network.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_icons = '';
foreach ( $attributes['items'] as $harlow_item ) {
	$harlow_item   = wp_parse_args(
		$harlow_item,
		array(
			'linkClass'  => '',
			'link'       => '',
			'linkTarget' => '',
			'linkRel'    => '',
			'label'      => '',
			'icon'       => '',
		)
	);
	$harlow_icons .= "\n" . '<span class="elementor-grid-item" role="listitem">' . "\n"
		. '<a class="' . esc_attr( $harlow_item['linkClass'] ) . '"' . harlow_link_attributes( $harlow_item ) . '>' . "\n"
		. '<span class="elementor-screen-only">' . esc_html( $harlow_item['label'] ) . '</span>' . "\n"
		. harlow_icon( $harlow_item['icon'] ) . "\n" . '</a>' . "\n" . '</span>';
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'social-icons.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-social-icons-wrapper elementor-grid" role="list">' . $harlow_icons . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
