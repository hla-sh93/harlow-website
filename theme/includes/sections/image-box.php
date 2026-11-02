<?php
/**
 * An image box (harlow/image-box): Elementor's image box widget, a picture with a title and
 * words, the picture above them, at their left or at their right (Elementor's
 * `elementor-position-*` and `elementor-vertical-align-*` classes on the element). With a
 * link, the picture and the title lead to it.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_position = in_array( $attributes['position'], array( 'top', 'left', 'right' ), true ) ? $attributes['position'] : 'top';
$harlow_valign   = in_array( $attributes['verticalAlign'], array( 'top', 'middle', 'bottom' ), true ) ? $attributes['verticalAlign'] : 'top';
$harlow_tag      = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'h3';
$harlow_title    = trim( (string) $attributes['title'] );
$harlow_words    = trim( (string) $attributes['description'] );
$harlow_link     = '' !== $attributes['link'] ? harlow_link_attributes( $attributes ) : '';

$harlow_inner = '<div class="elementor-image-box-wrapper">';
$harlow_image = harlow_image_box_picture( $attributes['image'], $attributes['imageSize'] );
if ( '' !== $harlow_link ) {
	$harlow_image = '<a' . $harlow_link . ' tabindex="-1">' . $harlow_image . '</a>';
}
$harlow_inner .= '<figure class="elementor-image-box-img">' . $harlow_image . '</figure>';
if ( '' !== $harlow_title || '' !== $harlow_words ) {
	$harlow_inner .= '<div class="elementor-image-box-content">';
	if ( '' !== $harlow_title ) {
		$harlow_words_html = wp_kses_post( $harlow_title );
		if ( '' !== $harlow_link ) {
			$harlow_words_html = '<a' . $harlow_link . '>' . $harlow_words_html . '</a>';
		}
		$harlow_inner .= '<' . $harlow_tag . ' class="elementor-image-box-title">' . $harlow_words_html . '</' . $harlow_tag . '>';
	}
	if ( '' !== $harlow_words ) {
		$harlow_inner .= '<p class="elementor-image-box-description">' . wp_kses_post( $harlow_words ) . '</p>';
	}
	$harlow_inner .= '</div>';
}
$harlow_inner .= '</div>';

// Elementor's classes on the element: the picture's position and the content's vertical alignment.
$harlow_element            = $attributes;
$harlow_element['classes'] = trim( preg_replace( '/(^|\s)elementor-(position|vertical-align)-\S+/', '', (string) $attributes['classes'] ) . ' elementor-position-' . $harlow_position . ' elementor-vertical-align-' . $harlow_valign );

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'image-box.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the link, the picture and the words are escaped where they are built.
