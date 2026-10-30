<?php
/**
 * An image (harlow/image): Elementor's image widget, a picture with a link if it has one.
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
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', $attributes['widgetType'] ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n" . $harlow_picture . "\n" . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the picture is WordPress's image, or built escaped in harlow_block_image().
