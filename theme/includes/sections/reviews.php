<?php
/**
 * Reviews (harlow/reviews): Elementor Pro's reviews widget, slides of reviews, each a
 * header (the reviewer's picture, name, stars, title and the icon of the network the
 * review came from, all a link when the review has one) over its words; moved by the
 * testimonial carousel's script (assets/js/widgets/testimonial-carousel.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! is_admin() ) {
	harlow_enqueue_widget( 'testimonial-carousel' );
}

$harlow_slides   = is_array( $attributes['slides'] ) ? array_values( array_filter( $attributes['slides'], 'is_array' ) ) : array();
$harlow_size     = sanitize_key( $attributes['imageSize'] );
$harlow_stars    = 'star_unicode' === $attributes['starStyle'] ? 'star_unicode' : 'star_fontawesome';
$harlow_unmarked = 'outline' === $attributes['unmarkedStarStyle'] ? 'outline' : 'solid';

list( $harlow_settings, $harlow_style ) = harlow_testimonial_carousel_settings( $attributes, count( $harlow_slides ), array( 3, 2, 1 ) );
$harlow_classes                         = array( 'elementor--star-style-' . $harlow_stars, 'elementor-review--unmarked-' . $harlow_unmarked );
if ( $attributes['separator'] ) {
	$harlow_classes[] = 'elementor-review--has-separator';
}
$harlow_element = harlow_testimonial_carousel_element( $attributes, 'reviews', $harlow_settings, $harlow_classes );

$harlow_items = array();
foreach ( $harlow_slides as $harlow_slide ) {
	$harlow_slide = wp_parse_args(
		$harlow_slide,
		array(
			'id'         => '',
			'image'      => 0,
			'name'       => '',
			'title'      => '',
			'rating'     => '',
			'icon'       => '',
			'link'       => '',
			'linkTarget' => '',
			'linkRel'    => '',
			'content'    => '',
		)
	);
	$harlow_name  = trim( (string) $harlow_slide['name'] );
	$harlow_title = trim( (string) $harlow_slide['title'] );
	$harlow_image = harlow_testimonial_carousel_image( $harlow_slide['image'], $harlow_size, $harlow_name );
	$harlow_item  = '<div class="elementor-testimonial' . ( '' !== $harlow_slide['id'] ? ' elementor-repeater-item-' . sanitize_html_class( $harlow_slide['id'] ) : '' ) . '">' . "\n";
	if ( '' !== $harlow_image || '' !== $harlow_name || '' !== $harlow_title ) {
		$harlow_link  = '' !== trim( (string) $harlow_slide['link'] ) ? harlow_link_attributes( $harlow_slide ) : '';
		$harlow_tag   = '' !== $harlow_link ? 'a' : 'div';
		$harlow_item .= '<' . $harlow_tag . ' class="elementor-testimonial__header"' . $harlow_link . '>' . "\n";
		if ( '' !== $harlow_image ) {
			$harlow_item .= '<div class="elementor-testimonial__image">' . "\n" . $harlow_image . "\n" . '</div>' . "\n";
		}
		if ( '' !== $harlow_name || '' !== $harlow_title ) {
			$harlow_item .= '<cite class="elementor-testimonial__cite">'
				. ( '' !== $harlow_name ? '<span class="elementor-testimonial__name">' . wp_kses_post( $harlow_name ) . '</span>' : '' )
				. ( '' !== (string) $harlow_slide['rating'] && (float) $harlow_slide['rating'] > 0 ? harlow_reviews_stars( $harlow_slide['rating'], $harlow_unmarked ) : '' )
				. ( '' !== $harlow_title ? '<span class="elementor-testimonial__title">' . wp_kses_post( $harlow_title ) . '</span>' : '' )
				. '</cite>' . "\n";
		}
		if ( '' !== trim( (string) $harlow_slide['icon'] ) ) {
			$harlow_network = harlow_reviews_network( $harlow_slide['icon'] );
			$harlow_item   .= '<div class="elementor-testimonial__icon elementor-icon' . ( '' !== $harlow_network ? ' elementor-icon-' . $harlow_network : '' ) . '">'
				. harlow_icon( $harlow_slide['icon'] )
				. '<span class="elementor-screen-only">' . esc_html__( 'Read More', 'harlow' ) . '</span>'
				. '</div>' . "\n";
		}
		$harlow_item .= '</' . $harlow_tag . '>' . "\n";
	}
	if ( '' !== trim( (string) $harlow_slide['content'] ) ) {
		$harlow_item .= '<div class="elementor-testimonial__content">' . "\n"
			. '<div class="elementor-testimonial__text">' . "\n" . wp_kses_post( $harlow_slide['content'] ) . "\n" . '</div>' . "\n"
			. '</div>' . "\n";
	}
	$harlow_items[] = $harlow_item . '</div>' . "\n";
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'reviews.default' ) . '>';
if ( $harlow_items ) {
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n"
		. harlow_testimonial_carousel_markup( $harlow_items, $harlow_settings, $harlow_style )
		. '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words, the pictures and the icons are escaped where they are built.
