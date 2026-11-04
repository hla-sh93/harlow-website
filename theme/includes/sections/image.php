<?php
/**
 * An image (harlow/image): Elementor's image widget, a picture with a link and a caption
 * if it has them.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_image = $attributes;
if ( 'featured' === $attributes['source'] ) {
	$harlow_image['image'] = (int) get_post_thumbnail_id();
}
$harlow_picture = harlow_block_image( $harlow_image );
if ( '' !== $attributes['link'] ) {
	$harlow_picture = '<a' . harlow_link_attributes( $attributes ) . '>' . "\n" . $harlow_picture . "\n" . '</a>';
}
// A caption (the picture's own from the Media Library, or typed), as Elementor prints it.
$harlow_caption = '';
if ( 'attachment' === $attributes['caption'] && $harlow_image['image'] ) {
	$harlow_caption = (string) wp_get_attachment_caption( (int) $harlow_image['image'] );
} elseif ( 'custom' === $attributes['caption'] ) {
	$harlow_caption = $attributes['captionText'];
}
// In the editor a caption asked for and still empty shows where it goes.
if ( '' === $harlow_caption && in_array( $attributes['caption'], array( 'attachment', 'custom' ), true ) && wp_is_serving_rest_request() ) {
	$harlow_caption = esc_html__( 'The picture’s caption', 'harlow' );
}
if ( '' !== $harlow_caption ) {
	$harlow_picture = '<figure class="wp-caption">' . "\n" . $harlow_picture . "\n"
		. '<figcaption class="widget-image-caption wp-caption-text">' . wp_kses_post( $harlow_caption ) . '</figcaption>' . "\n"
		. '</figure>';
}
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', $attributes['widgetType'] ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n" . $harlow_picture . "\n" . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the picture is WordPress's image, or built escaped in harlow_block_image().
