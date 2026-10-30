<?php
/**
 * A gallery (harlow/gallery): Elementor's gallery widget, the pictures in a grid that
 * assets/js/gallery.js lays out and the lightbox opens. The pictures are the block's own,
 * or the gallery field of the item the page shows (source "meta:harlow_gallery"). Each
 * picture's link carries what Elementor's lightbox reads: its id, address and gallery.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_ids = 'meta:harlow_gallery' === $attributes['source']
	? (array) get_post_meta( get_the_ID(), '_harlow_gallery', true )
	: (array) $attributes['pictures'];

$harlow_items = '';
foreach ( array_filter( array_map( 'absint', $harlow_ids ) ) as $harlow_id ) {
	$harlow_url   = (string) wp_get_attachment_url( $harlow_id );
	$harlow_thumb = wp_get_attachment_image_src( $harlow_id, 'large' );
	if ( '' === $harlow_url || ! $harlow_thumb ) {
		continue;
	}
	// As typed: get_the_title() curls quotes.
	$harlow_title  = (string) get_post_field( 'post_title', $harlow_id, 'raw' );
	$harlow_action = '#' . rawurlencode(
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Elementor's lightbox reads its settings as base64 JSON.
		'elementor-action:action=lightbox&settings=' . base64_encode(
			(string) wp_json_encode(
				array(
					'id'        => $harlow_id,
					'url'       => $harlow_url,
					'slideshow' => $attributes['element'],
				)
			)
		)
	);
	$harlow_inside = $attributes['captions']
		? '<div class="elementor-gallery-item__content">' . "\n" . '<div class="elementor-gallery-item__title">' . "\n" . esc_html( $harlow_title ) . "\t" . '</div>' . "\n" . '</div>'
		: '<div class="elementor-gallery-item__overlay"></div>';
	$harlow_items .= "\n" . '<a class="e-gallery-item elementor-gallery-item elementor-animated-content" href="' . esc_url( $harlow_url ) . '" data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="' . esc_attr( $attributes['element'] ) . '" data-elementor-lightbox-title="' . esc_attr( $harlow_title ) . '" data-e-action-hash="' . esc_attr( $harlow_action ) . '">' . "\n"
		. '<div class="e-gallery-image elementor-gallery-item__image" data-thumbnail="' . esc_url( $harlow_thumb[0] ) . '" data-width="' . (int) $harlow_thumb[1] . '" data-height="' . (int) $harlow_thumb[2] . '" aria-label="' . esc_attr( (string) get_post_meta( $harlow_id, '_wp_attachment_image_alt', true ) ) . '" role="img"></div>' . "\n"
		. $harlow_inside . "\n"
		. '</a>';
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'gallery.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-gallery__container">' . $harlow_items . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
