<?php
/**
 * A container (harlow/container): Elementor's flex or grid box, with the blocks inside it.
 *
 * Boxed: the inner box (.e-con-inner) holds the blocks, as Elementor's boxed width does.
 * A background video (the home page's banner) comes first, playing by itself: a file, or a
 * YouTube or Vimeo address, from a start time to an end time, once or again and again, on
 * phones or not (then its fallback picture). A background slideshow and the shape dividers
 * come from the owner's style, and the whole container may be a link (Elementor Pro's).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The blocks inside, already printed, with the white
 *                                      space the reference has between them.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_style = harlow_block_style( $attributes );
$harlow_video = '';
if ( '' !== $attributes['video'] ) {
	$harlow_video = "\n" . '<div class="elementor-background-video-container">' . "\n"
		. harlow_background_video( $attributes ) . "\n"
		. '</div>';
	$harlow_rules = '';
	$harlow_at    = harlow_element_selector( $attributes['element'] );
	if ( empty( $attributes['videoMobile'] ) ) {
		$harlow_rules .= $harlow_at . ' > .elementor-background-video-container{display:none !important;}';
	}
	$harlow_fallback = $attributes['videoFallback'] ? wp_get_attachment_image_url( (int) $attributes['videoFallback'], 'full' ) : '';
	if ( $harlow_fallback ) {
		$harlow_rules = $harlow_at . '{background-image:url("' . esc_url_raw( $harlow_fallback ) . '") !important;background-size:cover !important;background-position:center center !important;}' . $harlow_rules;
	}
	if ( '' !== $harlow_rules ) {
		// Phones: the fallback picture, and the video only when the owner asked for it there.
		harlow_collected_styles( '@media ' . HARLOW_DEVICES['mobile'] . '{' . $harlow_rules . '}' );
	}
	harlow_enqueue_module( 'background-video' );
}
$harlow_extra  = harlow_background_slideshow( $harlow_style ) . harlow_shapes_markup( $harlow_style );
$harlow_inside = $attributes['boxed'] ? "\n" . '<div class="e-con-inner">' . $content . '</div>' . "\n" : $content;

// Its HTML tag, as Elementor's container offers it, or a link around all of it.
$harlow_tag  = in_array( $attributes['tag'], array( 'div', 'section', 'header', 'footer', 'main', 'article', 'aside', 'nav' ), true ) ? $attributes['tag'] : 'div';
$harlow_link = '';
if ( 'a' === $attributes['tag'] && '' !== $attributes['link'] ) {
	$harlow_tag  = 'a';
	$harlow_link = ' href="' . esc_url( harlow_link_url( $attributes['link'] ) ) . '"' . ( $attributes['linkNewTab'] ? ' target="_blank" rel="noopener"' : '' );
}
echo '<' . $harlow_tag . harlow_element_attributes( $attributes, 'container' ) . $harlow_link . harlow_picture_style( $attributes['picture'] ) . '>' . $harlow_video . $harlow_extra . $harlow_inside . '</' . $harlow_tag . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, link, picture, video, slideshow and shapes are escaped where they are built; the inside is the inner blocks, printed by WordPress.
