<?php
/**
 * The site's logo (harlow/site-logo): Elementor Pro's site logo widget, an image widget of
 * the logo the header shows (Customize's custom logo, else Customize → Header and footer's
 * header logo, else the design's own), linked to the home page, with a caption if one is
 * chosen.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_size    = in_array( $attributes['size'], array( 'thumbnail', 'medium', 'medium_large', 'large', 'full' ), true ) ? $attributes['size'] : 'full';
$harlow_logo    = harlow_site_logo_id();
$harlow_picture = $harlow_logo
	? wp_get_attachment_image( $harlow_logo, $harlow_size, false, array( 'class' => 'attachment-' . $harlow_size . ' size-' . $harlow_size . ' wp-image-' . $harlow_logo ) )
	: harlow_site_logo_design();

$harlow_href = '';
if ( 'file' === $attributes['linkTo'] ) {
	$harlow_href = $harlow_logo ? (string) wp_get_attachment_image_url( $harlow_logo, 'full' ) : harlow_image_url( 'header_logo' );
} elseif ( 'custom' === $attributes['linkTo'] ) {
	$harlow_href = '' !== $attributes['link'] ? harlow_link_url( $attributes['link'] ) : home_url( '/' );
}
if ( '' !== $harlow_href ) {
	$harlow_link = ' href="' . esc_url( $harlow_href ) . '"';
	if ( 'file' === $attributes['linkTo'] ) {
		$harlow_link .= ' data-elementor-open-lightbox="' . ( $attributes['lightbox'] ? 'yes' : 'no' ) . '"';
	} else {
		$harlow_link .= '' !== $attributes['linkTarget'] ? ' target="' . esc_attr( $attributes['linkTarget'] ) . '"' : '';
		$harlow_link .= '' !== $attributes['linkRel'] ? ' rel="' . esc_attr( $attributes['linkRel'] ) . '"' : '';
	}
	$harlow_picture = '<a' . $harlow_link . '>' . "\n" . $harlow_picture . "\n" . '</a>';
}

$harlow_caption = '';
if ( 'attachment' === $attributes['captionSource'] && $harlow_logo ) {
	$harlow_caption = (string) wp_get_attachment_caption( $harlow_logo );
} elseif ( 'custom' === $attributes['captionSource'] ) {
	$harlow_caption = $attributes['caption'];
}
// In the editor a caption asked for and still empty shows where it goes.
if ( '' === $harlow_caption && in_array( $attributes['captionSource'], array( 'attachment', 'custom' ), true ) && wp_is_serving_rest_request() ) {
	$harlow_caption = esc_html__( 'The picture’s caption', 'harlow' );
}
if ( '' !== $harlow_caption ) {
	$harlow_picture = '<figure class="wp-caption">' . "\n" . $harlow_picture . "\n"
		. '<figcaption class="widget-image-caption wp-caption-text">' . wp_kses_post( $harlow_caption ) . '</figcaption>' . "\n"
		. '</figure>';
}

$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'theme-site-logo', array( 'elementor-widget-image' ) ), 'widget', 'theme-site-logo.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n" . $harlow_picture . "\n" . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the picture is WordPress's image or the design's, built escaped; the rest is escaped where it is built.
