<?php
/**
 * A testimonial carousel (harlow/testimonial-carousel): Elementor Pro's testimonial
 * carousel, slides of what people said with their picture, name and title, in the default
 * skin or as speech bubbles, the picture inline, stacked, above, left or right of the
 * words; moved by assets/js/widgets/testimonial-carousel.js.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_slides = is_array( $attributes['slides'] ) ? array_values( array_filter( $attributes['slides'], 'is_array' ) ) : array();
$harlow_skin   = 'bubble' === $attributes['skin'] ? 'bubble' : 'default';
// Bubbles always have the picture inline, as on Elementor.
$harlow_layout = 'bubble' === $harlow_skin ? 'image_inline' : ( in_array( $attributes['layout'], array( 'image_inline', 'image_stacked', 'image_above', 'image_left', 'image_right' ), true ) ? $attributes['layout'] : 'image_inline' );
$harlow_align  = in_array( $attributes['align'], array( 'left', 'center', 'right' ), true ) ? $attributes['align'] : 'center';
$harlow_size   = sanitize_key( $attributes['imageSize'] );

list( $harlow_settings, $harlow_style ) = harlow_testimonial_carousel_settings( $attributes, count( $harlow_slides ), array( 1, 1, 1 ) );
$harlow_element                         = harlow_testimonial_carousel_element(
	$attributes,
	'testimonial-carousel',
	$harlow_settings,
	array(
		'elementor-testimonial--skin-' . $harlow_skin,
		'elementor-testimonial--layout-' . $harlow_layout,
		'elementor-testimonial--align-' . $harlow_align,
	)
);

// The name and title go with the words (picture above, left or right) or with the picture.
$harlow_outside = in_array( $harlow_layout, array( 'image_above', 'image_left', 'image_right' ), true );

$harlow_items = array();
foreach ( $harlow_slides as $harlow_slide ) {
	$harlow_slide = wp_parse_args(
		$harlow_slide,
		array(
			'content' => '',
			'image'   => 0,
			'name'    => '',
			'title'   => '',
		)
	);
	$harlow_name  = trim( (string) $harlow_slide['name'] );
	$harlow_title = trim( (string) $harlow_slide['title'] );
	$harlow_cite  = '';
	if ( '' !== $harlow_name || '' !== $harlow_title ) {
		$harlow_cite = '<cite class="elementor-testimonial__cite">'
			. ( '' !== $harlow_name ? '<span class="elementor-testimonial__name">' . wp_kses_post( $harlow_name ) . '</span>' : '' )
			. ( '' !== $harlow_title ? '<span class="elementor-testimonial__title">' . wp_kses_post( $harlow_title ) . '</span>' : '' )
			. '</cite>';
	}
	$harlow_image = harlow_testimonial_carousel_image( $harlow_slide['image'], $harlow_size, $harlow_name );
	$harlow_item  = '<div class="elementor-testimonial">' . "\n";
	if ( '' !== trim( (string) $harlow_slide['content'] ) ) {
		$harlow_item .= '<div class="elementor-testimonial__content">' . "\n"
			. '<div class="elementor-testimonial__text">' . "\n" . wp_kses_post( $harlow_slide['content'] ) . "\n" . '</div>' . "\n"
			. ( $harlow_outside && '' !== $harlow_cite ? $harlow_cite . "\n" : '' )
			. '</div>' . "\n";
	}
	$harlow_item   .= '<div class="elementor-testimonial__footer">' . "\n"
		. ( '' !== $harlow_image ? '<div class="elementor-testimonial__image">' . "\n" . $harlow_image . "\n" . '</div>' . "\n" : '' )
		. ( ! $harlow_outside && '' !== $harlow_cite ? $harlow_cite . "\n" : '' )
		. '</div>' . "\n"
		. '</div>' . "\n";
	$harlow_items[] = $harlow_item;
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'testimonial-carousel.default' ) . '>';
if ( $harlow_items ) {
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n"
		. harlow_testimonial_carousel_markup( $harlow_items, $harlow_settings, $harlow_style )
		. '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the pictures are escaped where they are built.
