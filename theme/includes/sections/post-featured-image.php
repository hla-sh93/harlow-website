<?php
/**
 * The item's featured picture (harlow/post-featured-image): Elementor Pro's featured
 * image widget, an image widget of the featured picture of the item the page shows (a
 * sample post's where there is none), or the fallback picture chosen; with its link and
 * caption. An item without a picture and no fallback prints nothing, as Elementor's.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_post    = harlow_theme_builder_post();
$harlow_size    = in_array( $attributes['size'], array( 'thumbnail', 'medium', 'medium_large', 'large', 'full' ), true ) ? $attributes['size'] : 'large';
$harlow_picture = $harlow_post ? (int) get_post_thumbnail_id( $harlow_post ) : 0;
if ( ! $harlow_picture || ! wp_attachment_is_image( $harlow_picture ) ) {
	$harlow_picture = $attributes['fallback'] && wp_attachment_is_image( (int) $attributes['fallback'] ) ? (int) $attributes['fallback'] : 0;
}
// In the editor, an item without one (a new page) shows a post's featured picture as a
// sample, so the picture can be seen and styled; the page shows nothing.
if ( ! $harlow_picture && wp_is_serving_rest_request() ) {
	$harlow_sample  = get_posts(
		array(
			'post_type'   => 'post',
			'numberposts' => 1,
			'meta_key'    => '_thumbnail_id', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one post, in the editor only.
			'fields'      => 'ids',
		)
	);
	$harlow_picture = $harlow_sample ? (int) get_post_thumbnail_id( $harlow_sample[0] ) : 0;
}
$harlow_classes = harlow_theme_builder_classes( $attributes, 'theme-post-featured-image', array( 'elementor-widget-image' ) );
if ( ! $harlow_picture ) {
	// The editor shows where the picture goes; the page shows nothing.
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		echo '<div' . harlow_element_attributes( $harlow_classes, 'widget', 'theme-post-featured-image.default' ) . '>' . "\n" // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in harlow_element_attributes().
			. '<div class="elementor-widget-container">' . "\n"
			. '<p class="harlow-source-note">' . esc_html__( '[The item’s featured picture]', 'harlow' ) . '</p>' . "\n"
			. '</div>' . "\n"
			. '</div>';
	}
	return;
}

$harlow_image = wp_get_attachment_image( $harlow_picture, $harlow_size, false, array( 'class' => 'attachment-' . $harlow_size . ' size-' . $harlow_size . ' wp-image-' . $harlow_picture ) );
$harlow_href  = '';
if ( 'file' === $attributes['linkTo'] ) {
	$harlow_href = (string) wp_get_attachment_image_url( $harlow_picture, 'full' );
} elseif ( 'item' === $attributes['linkTo'] && $harlow_post ) {
	$harlow_href = (string) get_permalink( $harlow_post );
} elseif ( 'custom' === $attributes['linkTo'] ) {
	$harlow_href = harlow_link_url( $attributes['link'] );
}
if ( '' !== $harlow_href ) {
	$harlow_link = ' href="' . esc_url( $harlow_href ) . '"';
	if ( 'file' === $attributes['linkTo'] ) {
		$harlow_link .= ' data-elementor-open-lightbox="' . ( $attributes['lightbox'] ? 'yes' : 'no' ) . '"';
	} else {
		$harlow_link .= '' !== $attributes['linkTarget'] ? ' target="' . esc_attr( $attributes['linkTarget'] ) . '"' : '';
		$harlow_link .= '' !== $attributes['linkRel'] ? ' rel="' . esc_attr( $attributes['linkRel'] ) . '"' : '';
	}
	$harlow_image = '<a' . $harlow_link . '>' . "\n" . $harlow_image . "\n" . '</a>';
}

$harlow_caption = '';
if ( 'attachment' === $attributes['captionSource'] ) {
	$harlow_caption = (string) wp_get_attachment_caption( $harlow_picture );
} elseif ( 'custom' === $attributes['captionSource'] ) {
	$harlow_caption = $attributes['caption'];
}
// In the editor a caption asked for and still empty shows where it goes.
if ( '' === $harlow_caption && '' !== $attributes['captionSource'] && 'none' !== $attributes['captionSource'] && wp_is_serving_rest_request() ) {
	$harlow_caption = esc_html__( 'The picture’s caption', 'harlow' );
}
if ( '' !== $harlow_caption ) {
	$harlow_image = '<figure class="wp-caption">' . "\n" . $harlow_image . "\n"
		. '<figcaption class="widget-image-caption wp-caption-text">' . wp_kses_post( $harlow_caption ) . '</figcaption>' . "\n"
		. '</figure>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_classes, 'widget', 'theme-post-featured-image.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n" . $harlow_image . "\n" . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the picture is WordPress's image; the rest is escaped where it is built.
