<?php
/**
 * A basic gallery (harlow/image-gallery): Elementor's image gallery widget, WordPress's own
 * gallery of the pictures (functions/widgets/image-gallery.php), each linked to its file,
 * its attachment page or nothing; a file opens in the site's lightbox
 * (assets/js/lightbox.js), grouped by the element.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_gallery = harlow_image_gallery_markup( $attributes );
if ( '' === $harlow_gallery ) {
	return;
}

// Elementor's prefix class of the spacing (gallery-spacing-custom), and the captions hidden.
$harlow_custom             = 'custom' === $attributes['imageSpacing'] && is_numeric( $attributes['spacing'] );
$harlow_element            = $attributes;
$harlow_element['classes'] = trim(
	preg_replace( '/\s*\bgallery-(spacing|caption)-\S+/', '', $attributes['classes'] )
	. ( $harlow_custom ? ' gallery-spacing-custom' : '' )
	. ( 'none' === $attributes['caption'] ? ' gallery-caption-none' : '' )
);

$harlow_style = $harlow_custom ? ' style="' . esc_attr( '--e-image-gallery-spacing: ' . max( 0, (float) $attributes['spacing'] ) . 'px' ) . '"' : '';

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'image-gallery.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-image-gallery"' . $harlow_style . '>' . "\n"
	. $harlow_gallery . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WordPress's gallery and the attributes are escaped where they are built.
