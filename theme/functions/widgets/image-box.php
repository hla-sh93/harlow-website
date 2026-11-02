<?php
/**
 * The picture of a widget that holds one (blocks/image-box, blocks/call-to-action,
 * blocks/flip-box): the Media Library's picture at the size chosen, as Elementor prints
 * it, or, while none is chosen, a placeholder in the place of Elementor's own.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The placeholder picture: a grey box with a picture's sign, as a data address.
 *
 * @return string
 */
function harlow_image_box_placeholder() {
	$svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">'
		. '<rect width="1200" height="800" fill="#e5e5e5"/>'
		. '<circle cx="560" cy="350" r="24" fill="#c4c4c4"/>'
		. '<path d="M500 470l70-90 45 55 35-40 80 75z" fill="#c4c4c4"/>'
		. '</svg>';
	return 'data:image/svg+xml,' . rawurlencode( $svg );
}

/**
 * A picture size as WordPress names it (thumbnail, medium, large, full...).
 *
 * @param mixed $size The size chosen.
 * @return string
 */
function harlow_image_box_size( $size ) {
	$size = sanitize_key( (string) $size );
	return '' !== $size ? $size : 'full';
}

/**
 * A picture as Elementor prints it: the Media Library's at its size (with its srcset and
 * `wp-image-<id>`), or the placeholder.
 *
 * @param int    $id   The picture (Media Library), 0 for none.
 * @param string $size Its size.
 * @return string Markup.
 */
function harlow_image_box_picture( $id, $size ) {
	$id   = (int) $id;
	$size = harlow_image_box_size( $size );
	if ( $id && wp_attachment_is_image( $id ) ) {
		return wp_get_attachment_image( $id, $size, false, array( 'class' => 'attachment-' . $size . ' size-' . $size . ' wp-image-' . $id ) );
	}
	return '<img src="' . esc_attr( harlow_image_box_placeholder() ) . '" title="" alt="" loading="lazy">';
}

/**
 * The address of a picture at its size, or the placeholder's (a background picture).
 *
 * @param int    $id   The picture (Media Library), 0 for none.
 * @param string $size Its size.
 * @return string
 */
function harlow_image_box_picture_url( $id, $size ) {
	$id  = (int) $id;
	$url = $id ? wp_get_attachment_image_url( $id, harlow_image_box_size( $size ) ) : '';
	return $url ? esc_url( $url ) : harlow_image_box_placeholder();
}
