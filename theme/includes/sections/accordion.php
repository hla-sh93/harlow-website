<?php
/**
 * An accordion (harlow/accordion): Elementor's accordion widget, questions whose answers
 * open one at a time (assets/js/accordion.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_items = '';
foreach ( $attributes['items'] as $harlow_item ) {
	$harlow_item   = wp_parse_args(
		$harlow_item,
		array(
			'tab'          => 1,
			'id'           => 0,
			'title'        => '',
			'content'      => '',
			'expanded'     => 'false',
			'titleClass'   => 'elementor-tab-title',
			'contentClass' => 'elementor-tab-content elementor-clearfix',
			'contentStyle' => '',
		)
	);
	$harlow_tab    = (int) $harlow_item['tab'];
	$harlow_id     = (int) $harlow_item['id'];
	$harlow_style  = '' !== $harlow_item['contentStyle'] ? ' style="' . esc_attr( $harlow_item['contentStyle'] ) . '"' : '';
	$harlow_items .= "\n" . '<div class="elementor-accordion-item">' . "\n"
		. '<div id="elementor-tab-title-' . $harlow_id . '" class="' . esc_attr( $harlow_item['titleClass'] ) . '" data-tab="' . $harlow_tab . '" role="button" aria-controls="elementor-tab-content-' . $harlow_id . '" aria-expanded="' . esc_attr( $harlow_item['expanded'] ) . '">' . "\n"
		. '<span class="elementor-accordion-icon elementor-accordion-icon-left" aria-hidden="true">' . "\n"
		. '<span class="elementor-accordion-icon-closed">' . harlow_icon( $attributes['iconClosed'] ) . '</span>' . "\n"
		. '<span class="elementor-accordion-icon-opened">' . harlow_icon( $attributes['iconOpened'] ) . '</span>' . "\n"
		. '</span>' . "\n"
		. '<a class="elementor-accordion-title" tabindex="0">' . wp_kses_post( $harlow_item['title'] ) . '</a>' . "\n"
		. '</div>' . "\n"
		. '<div id="elementor-tab-content-' . $harlow_id . '" class="' . esc_attr( $harlow_item['contentClass'] ) . '" data-tab="' . $harlow_tab . '" role="region" aria-labelledby="elementor-tab-title-' . $harlow_id . '"' . $harlow_style . '>'
		. wp_kses_post( harlow_resolve_links( $harlow_item['content'] ) ) . '</div>' . "\n"
		. '</div>';
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'accordion.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-accordion">' . $harlow_items . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
