<?php
/**
 * The image carousel (harlow/image-carousel, includes/sections/image-carousel.php): what its
 * markup is made of, as Elementor's image carousel writes it.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Elementor's arrow icons (eicons chevron left and right), drawn when no icon is chosen.
 *
 * @param string $which 'previous' or 'next'.
 * @return string
 */
function harlow_image_carousel_arrow( $which ) {
	if ( 'next' === $which ) {
		return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-right" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z"></path></svg>';
	}
	return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-left" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"></path></svg>';
}

/**
 * The lightbox attributes of a picture's link, as Elementor writes them (the kit has the
 * image lightbox on, so "default" opens it as "yes" does).
 *
 * @param int    $id    The picture.
 * @param string $open  The widget's lightbox setting: default, yes or no.
 * @param string $group The slideshow the picture belongs to (the element's id).
 * @return string Attributes, each with its leading space.
 */
function harlow_image_carousel_lightbox( $id, $open, $group ) {
	if ( 'no' === $open ) {
		return ' data-elementor-open-lightbox="no"';
	}
	$out    = ' data-elementor-open-lightbox="yes"';
	$params = array();
	if ( '' !== $group ) {
		$out                .= ' data-elementor-lightbox-slideshow="' . esc_attr( $group ) . '"';
		$params['slideshow'] = $group;
	}
	if ( $id ) {
		// As typed: get_the_title() curls quotes.
		$title = (string) get_post_field( 'post_title', $id, 'raw' );
		if ( '' !== $title ) {
			$out .= ' data-elementor-lightbox-title="' . esc_attr( $title ) . '"';
		}
		$description = (string) get_post_field( 'post_content', $id, 'raw' );
		if ( '' !== $description ) {
			$out .= ' data-elementor-lightbox-description="' . esc_attr( wp_strip_all_tags( $description ) ) . '"';
		}
		$params['id']  = $id;
		$params['url'] = (string) wp_get_attachment_url( $id );
	}
	$hash = '#' . rawurlencode(
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Elementor's lightbox reads its settings as base64 JSON.
		'elementor-action:action=lightbox&settings=' . base64_encode( (string) wp_json_encode( $params ) )
	);
	return $out . ' data-e-action-hash="' . esc_attr( $hash ) . '"';
}

/**
 * A picture's caption, as the carousel shows it: its title, caption or description.
 *
 * @param int    $id   The picture.
 * @param string $type '', title, caption or description.
 * @return string
 */
function harlow_image_carousel_caption( $id, $type ) {
	if ( 'title' === $type ) {
		return (string) get_post_field( 'post_title', $id, 'raw' );
	}
	if ( 'caption' === $type ) {
		return (string) wp_get_attachment_caption( $id );
	}
	if ( 'description' === $type ) {
		return (string) get_post_field( 'post_content', $id, 'raw' );
	}
	return '';
}

/**
 * A number of a device as the owner typed it ('' when none), for the settings.
 *
 * @param mixed $value The value.
 * @return string
 */
function harlow_image_carousel_number( $value ) {
	return is_numeric( $value ) ? (string) ( 0 + $value ) : '';
}
