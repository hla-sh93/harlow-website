<?php
/**
 * A star rating (harlow/star-rating): Elementor's star rating widget, a rating out of 5
 * or 10 as stars, the star after the whole ones filled to the decimal
 * (`elementor-star-5` for half), with the rating for screen readers and search engines.
 *
 * The element carries Elementor's classes for the star style and the alignment of each
 * device, and `elementor--unmarked-style-outline` for outlined unmarked stars, which the
 * stylesheet draws (assets/css/widgets/star-rating.css): Elementor's icon font is not
 * loaded here.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_scale   = '10' === (string) $attributes['ratingScale'] ? 10 : 5;
$harlow_rating  = max( 0.0, min( (float) $attributes['rating'], (float) $harlow_scale ) );
$harlow_text    = $harlow_rating . '/' . $harlow_scale;
$harlow_unicode = 'star_unicode' === $attributes['starStyle'];
$harlow_outline = 'outline' === $attributes['unmarkedStyle'];
if ( $harlow_unicode ) {
	$harlow_glyph = $harlow_outline ? '&#9734;' : '&#9733;';
} else {
	$harlow_glyph = $harlow_outline ? '&#xE933;' : '&#xE934;';
}

// The stars: whole, the one filled to the decimal, empty.
$harlow_whole = floor( $harlow_rating );
$harlow_stars = '';
for ( $harlow_star = 1; $harlow_star <= $harlow_scale; $harlow_star++ ) {
	if ( $harlow_star <= $harlow_whole ) {
		$harlow_class = 'elementor-star-full';
	} elseif ( (int) $harlow_whole + 1 === $harlow_star && $harlow_rating > $harlow_whole ) {
		$harlow_class = 'elementor-star-' . max( 1, min( 9, (int) round( ( $harlow_rating - $harlow_whole ) * 10 ) ) );
	} else {
		$harlow_class = 'elementor-star-empty';
	}
	$harlow_stars .= '<i class="' . $harlow_class . '">' . $harlow_glyph . '</i>';
}

// Elementor's classes on the element: the star style, the unmarked style, the alignment of each device.
$harlow_element = $attributes;
$harlow_classes = array( 'elementor--star-style-' . ( $harlow_unicode ? 'star_unicode' : 'star_fontawesome' ) );
if ( $harlow_outline ) {
	$harlow_classes[] = 'elementor--unmarked-style-outline';
}
foreach ( array(
	'align'       => '',
	'alignTablet' => '-tablet',
	'alignMobile' => '-mobile',
) as $harlow_key => $harlow_device ) {
	if ( in_array( $attributes[ $harlow_key ], array( 'left', 'center', 'right', 'justify' ), true ) ) {
		$harlow_classes[] = 'elementor-star-rating' . $harlow_device . '--align-' . $attributes[ $harlow_key ];
	}
}
$harlow_element['classes'] = trim( preg_replace( '/(^|\s)elementor(--star-style-|--unmarked-style-|-star-rating(-tablet|-mobile)?--align-)\S+/', '', (string) $attributes['classes'] ) . ' ' . implode( ' ', $harlow_classes ) );

$harlow_title = trim( (string) $attributes['title'] );
$harlow_html  = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'star-rating.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-star-rating__wrapper">' . "\n"
	. ( '' !== $harlow_title ? '<div class="elementor-star-rating__title">' . esc_html( $harlow_title ) . '</div>' . "\n" : '' )
	. '<div class="elementor-star-rating" title="' . esc_attr( $harlow_text ) . '" itemtype="http://schema.org/Rating" itemscope="" itemprop="reviewRating">'
	. $harlow_stars . ' <span itemprop="ratingValue" class="elementor-screen-only">' . esc_html( $harlow_text ) . '</span></div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the words are escaped where they are built; the stars are this file's own.
