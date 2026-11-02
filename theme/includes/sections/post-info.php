<?php
/**
 * The item's details (harlow/post-info): Elementor Pro's post info widget, a list of the
 * item's author, date, time, comments, terms or words of the owner's, each with its icon
 * (or the author's picture), words before it and its link; in a row or one under another.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_post   = harlow_theme_builder_post();
$harlow_inline = 'inline' === $attributes['layout'];
$harlow_lines  = '';
foreach ( is_array( $attributes['items'] ) ? $attributes['items'] : array() as $harlow_index => $harlow_item ) {
	if ( ! is_array( $harlow_item ) || ! $harlow_post ) {
		continue;
	}
	$harlow_data = harlow_post_info_item( $harlow_item, $harlow_post );
	if ( null === $harlow_data ) {
		continue;
	}
	$harlow_id    = isset( $harlow_item['id'] ) && '' !== $harlow_item['id'] ? sanitize_html_class( $harlow_item['id'] ) : 'i' . $harlow_index;
	$harlow_type  = sanitize_html_class( $harlow_data['type'] );
	$harlow_icon  = harlow_post_info_icon( $harlow_item, $harlow_data );
	$harlow_text  = '<span class="elementor-icon-list-text elementor-post-info__item elementor-post-info__item--type-' . $harlow_type . '">';
	$harlow_text .= isset( $harlow_item['prefix'] ) && '' !== $harlow_item['prefix'] ? '<span class="elementor-post-info__item-prefix">' . esc_html( $harlow_item['prefix'] ) . '</span>' : '';
	$harlow_text .= $harlow_data['html'] . '</span>';
	$harlow_body  = $harlow_icon . $harlow_text;
	if ( '' !== $harlow_data['url'] ) {
		$harlow_body = '<a href="' . esc_url( $harlow_data['url'] ) . '">' . $harlow_body . '</a>';
	}
	$harlow_lines .= "\n" . '<li class="elementor-icon-list-item elementor-repeater-item-' . $harlow_id . ( $harlow_inline ? ' elementor-inline-item' : '' ) . '"'
		. ( '' !== $harlow_data['itemprop'] ? ' itemprop="' . esc_attr( $harlow_data['itemprop'] ) . '"' : '' ) . '>' . "\n"
		. $harlow_body . "\n"
		. '</li>';
}

$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'post-info' ), 'widget', 'post-info.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<ul class="' . ( $harlow_inline ? 'elementor-inline-items ' : '' ) . 'elementor-icon-list-items elementor-post-info">' . $harlow_lines . "\n" . '</ul>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built (harlow_post_info_item(), harlow_post_info_icon()).
