<?php
/**
 * The basic gallery (harlow/image-gallery, includes/sections/image-gallery.php): WordPress's
 * own gallery, its links given what Elementor's lightbox reads, as Elementor's image gallery
 * widget prints it.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The gallery being printed (its block's attributes), for the link filter below.
 *
 * @param array<string,mixed>|null $set The gallery's attributes, to set; false to clear.
 * @return array<string,mixed>|null
 */
function harlow_image_gallery_current( $set = null ) {
	static $current = null;
	if ( false === $set ) {
		$current = null;
	} elseif ( null !== $set ) {
		$current = $set;
	}
	return $current;
}

/**
 * WordPress's gallery markup of a gallery block.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return string
 */
function harlow_image_gallery_markup( $attributes ) {
	$ids = array_values( array_filter( array_map( 'absint', (array) $attributes['pictures'] ) ) );
	if ( ! $ids ) {
		return '';
	}
	$atts = array(
		'ids'     => implode( ',', $ids ),
		'size'    => '' !== $attributes['imageSize'] ? $attributes['imageSize'] : 'thumbnail',
		'columns' => max( 1, min( 10, (int) $attributes['columns'] ) ),
		'link'    => in_array( $attributes['link'], array( 'file', 'none' ), true ) ? $attributes['link'] : '',
	);
	if ( 'rand' === $attributes['orderby'] ) {
		$atts['orderby'] = 'rand';
	}
	harlow_image_gallery_current( $attributes );
	add_filter( 'wp_get_attachment_link', 'harlow_image_gallery_link', 10, 2 );
	$html = gallery_shortcode( $atts );
	remove_filter( 'wp_get_attachment_link', 'harlow_image_gallery_link', 10 );
	harlow_image_gallery_current( false );
	return $html;
}

/**
 * A picture's link in the gallery: the lightbox's attributes, as Elementor adds them (only
 * to a link to the picture's file: the lightbox shows files).
 *
 * @param string $html The link.
 * @param int    $id   The picture.
 * @return string
 */
function harlow_image_gallery_link( $html, $id ) {
	$gallery = harlow_image_gallery_current();
	if ( ! $gallery || 'file' !== $gallery['link'] || 0 !== strpos( $html, '<a' ) ) {
		return $html;
	}
	if ( 'no' === $gallery['openLightbox'] ) {
		return '<a data-elementor-open-lightbox="no"' . substr( $html, 2 );
	}
	$params = array(
		'slideshow' => $gallery['element'],
		'id'        => (int) $id,
		'url'       => (string) wp_get_attachment_url( $id ),
	);
	$attrs  = ' data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="' . esc_attr( $gallery['element'] ) . '"';
	// As typed: get_the_title() curls quotes.
	$title = (string) get_post_field( 'post_title', $id, 'raw' );
	if ( '' !== $title ) {
		$attrs .= ' data-elementor-lightbox-title="' . esc_attr( $title ) . '"';
	}
	$description = (string) get_post_field( 'post_content', $id, 'raw' );
	if ( '' !== $description ) {
		$attrs .= ' data-elementor-lightbox-description="' . esc_attr( wp_strip_all_tags( $description ) ) . '"';
	}
	$hash = '#' . rawurlencode(
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Elementor's lightbox reads its settings as base64 JSON.
		'elementor-action:action=lightbox&settings=' . base64_encode( (string) wp_json_encode( $params ) )
	);
	$attrs .= ' data-e-action-hash="' . esc_attr( $hash ) . '"';
	return '<a' . $attrs . substr( $html, 2 );
}
