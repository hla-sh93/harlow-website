<?php
/**
 * A price list (harlow/price-list): Elementor Pro's price list widget, items each with a
 * picture, a title and a price joined by a separator, and words under them; an item with a
 * link is a link as a whole.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_separator = in_array( $attributes['separatorStyle'], array( 'solid', 'dotted', 'dashed', 'double', 'none' ), true ) ? $attributes['separatorStyle'] : 'dotted';
$harlow_valign    = in_array( $attributes['verticalAlign'], array( 'top', 'center', 'bottom' ), true ) ? $attributes['verticalAlign'] : 'top';
$harlow_element   = $attributes;
if ( '' === trim( $harlow_element['classes'] ) ) {
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-price-list';
}
// The separator's line and the items' vertical alignment, as classes of the element (their
// rules are in assets/css/widgets/price-list.css).
$harlow_element['classes'] .= ' elementor-price-list--separator-' . $harlow_separator . ' elementor-price-list--align-' . $harlow_valign;

$harlow_size  = sanitize_key( $attributes['imageSize'] );
$harlow_size  = '' !== $harlow_size ? $harlow_size : 'thumbnail';
$harlow_items = is_array( $attributes['items'] ) ? array_values( array_filter( $attributes['items'], 'is_array' ) ) : array();

$harlow_list = '<ul class="elementor-price-list">' . "\n";
foreach ( $harlow_items as $harlow_item ) {
	$harlow_item  = wp_parse_args(
		$harlow_item,
		array(
			'title'       => '',
			'price'       => '',
			'description' => '',
			'image'       => 0,
			'link'        => '',
			'linkTarget'  => '',
			'linkRel'     => '',
		)
	);
	$harlow_title = trim( (string) $harlow_item['title'] );
	$harlow_price = trim( (string) $harlow_item['price'] );
	$harlow_words = trim( (string) $harlow_item['description'] );
	if ( '' === $harlow_title && '' === $harlow_price && '' === $harlow_words ) {
		continue;
	}
	$harlow_linked = '' !== trim( (string) $harlow_item['link'] );
	$harlow_list  .= $harlow_linked
		? '<li><a class="elementor-price-list-item"' . harlow_link_attributes( $harlow_item ) . '>' . "\n"
		: '<li class="elementor-price-list-item">' . "\n";

	$harlow_src = (int) $harlow_item['image'] && wp_attachment_is_image( (int) $harlow_item['image'] ) ? wp_get_attachment_image_url( (int) $harlow_item['image'], $harlow_size ) : '';
	if ( $harlow_src ) {
		$harlow_list .= '<div class="elementor-price-list-image">' . "\n"
			. '<img src="' . esc_url( $harlow_src ) . '" alt="' . esc_attr( wp_strip_all_tags( $harlow_title ) ) . '" />' . "\n"
			. '</div>' . "\n";
	}

	$harlow_list .= '<div class="elementor-price-list-text">' . "\n";
	if ( '' !== $harlow_title || '' !== $harlow_price ) {
		$harlow_list .= '<div class="elementor-price-list-header">' . "\n"
			. ( '' !== $harlow_title ? '<span class="elementor-price-list-title">' . "\n" . wp_kses_post( $harlow_title ) . "\n" . '</span>' . "\n" : '' )
			. ( 'none' !== $harlow_separator ? '<span class="elementor-price-list-separator"></span>' . "\n" : '' )
			. ( '' !== $harlow_price ? '<span class="elementor-price-list-price">' . wp_kses_post( $harlow_price ) . '</span>' . "\n" : '' )
			. '</div>' . "\n";
	}
	if ( '' !== $harlow_words ) {
		$harlow_list .= '<p class="elementor-price-list-description">' . "\n" . wp_kses_post( $harlow_words ) . "\n" . '</p>' . "\n";
	}
	$harlow_list .= '</div>' . "\n"
		. ( $harlow_linked ? '</a></li>' : '</li>' ) . "\n";
}
$harlow_list .= '</ul>' . "\n";

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'price-list.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_list
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the pictures are escaped where they are built.
