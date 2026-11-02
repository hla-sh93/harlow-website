<?php
/**
 * An image carousel (harlow/image-carousel): Elementor's image carousel widget, its pictures
 * as Swiper's slides, which assets/js/widgets/image-carousel.js moves with the settings
 * Elementor keeps in data-settings. A picture's link opens the site's lightbox
 * (assets/js/lightbox.js), grouped by the element.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_ids = array_values( array_filter( array_map( 'absint', (array) $attributes['pictures'] ) ) );
if ( ! $harlow_ids ) {
	return;
}

$harlow_count  = count( $harlow_ids );
$harlow_size   = '' !== $attributes['imageSize'] ? $attributes['imageSize'] : 'full';
$harlow_arrows = in_array( $attributes['navigation'], array( 'both', 'arrows' ), true );
$harlow_dots   = in_array( $attributes['navigation'], array( 'both', 'dots' ), true );

// The settings Elementor gives the page's script (frontend settings, as it stores them).
$harlow_stored   = json_decode( (string) $attributes['settings'], true );
$harlow_settings = array_merge(
	is_array( $harlow_stored ) ? $harlow_stored : array(),
	array_filter(
		array(
			'slides_to_show'          => harlow_image_carousel_number( $attributes['slidesToShow'] ),
			'slides_to_show_tablet'   => harlow_image_carousel_number( $attributes['slidesToShowTablet'] ),
			'slides_to_show_mobile'   => harlow_image_carousel_number( $attributes['slidesToShowMobile'] ),
			'slides_to_scroll'        => harlow_image_carousel_number( $attributes['slidesToScroll'] ),
			'slides_to_scroll_tablet' => harlow_image_carousel_number( $attributes['slidesToScrollTablet'] ),
			'slides_to_scroll_mobile' => harlow_image_carousel_number( $attributes['slidesToScrollMobile'] ),
			'navigation'              => $attributes['navigation'],
			'autoplay'                => $attributes['autoplay'] ? 'yes' : '',
			'pause_on_hover'          => $attributes['pauseOnHover'] ? 'yes' : '',
			'pause_on_interaction'    => $attributes['pauseOnInteraction'] ? 'yes' : '',
			'autoplay_speed'          => (int) $attributes['autoplaySpeed'],
			'infinite'                => $attributes['infinite'] ? 'yes' : '',
			'effect'                  => $attributes['effect'],
			'speed'                   => (int) $attributes['speed'],
			'lazyload'                => $attributes['lazyload'] ? 'yes' : '',
		),
		'strlen'
	)
);
if ( 'custom' === $attributes['imageSpacing'] ) {
	foreach ( array(
		''        => 'spacing',
		'_tablet' => 'spacingTablet',
		'_mobile' => 'spacingMobile',
	) as $harlow_suffix => $harlow_key ) {
		if ( is_numeric( $attributes[ $harlow_key ] ) ) {
			$harlow_settings[ 'image_spacing_custom' . $harlow_suffix ] = array(
				'unit'  => 'px',
				'size'  => 0 + $attributes[ $harlow_key ],
				'sizes' => array(),
			);
		}
	}
}

// Elementor's prefix classes: where the arrows and the dots are.
$harlow_element             = $attributes;
$harlow_element['classes']  = trim(
	preg_replace( '/\s*\belementor-(arrows|pagination)-position-\S+/', '', $attributes['classes'] )
	. ' elementor-arrows-position-' . ( 'outside' === $attributes['arrowsPosition'] ? 'outside' : 'inside' )
	. ' elementor-pagination-position-' . ( 'inside' === $attributes['dotsPosition'] ? 'inside' : 'outside' )
);
$harlow_element['settings'] = (string) wp_json_encode( $harlow_settings );

// The first view before the script runs (and in the editor): the slides each device shows,
// and the space between them, as Elementor's breakpoints fall back.
$harlow_show        = (float) harlow_image_carousel_number( $attributes['slidesToShow'] ) ? (float) $attributes['slidesToShow'] : 3;
$harlow_show_tablet = (float) harlow_image_carousel_number( $attributes['slidesToShowTablet'] ) ? (float) $attributes['slidesToShowTablet'] : ( 1.0 === $harlow_show ? 1 : 2 );
$harlow_show_mobile = (float) harlow_image_carousel_number( $attributes['slidesToShowMobile'] ) ? (float) $attributes['slidesToShowMobile'] : 1;
$harlow_space       = 'custom' === $attributes['imageSpacing'] && is_numeric( $attributes['spacing'] ) ? (float) $attributes['spacing'] : 0;
$harlow_space_t     = 'custom' === $attributes['imageSpacing'] && is_numeric( $attributes['spacingTablet'] ) ? (float) $attributes['spacingTablet'] : $harlow_space;
$harlow_space_m     = 'custom' === $attributes['imageSpacing'] && is_numeric( $attributes['spacingMobile'] ) ? (float) $attributes['spacingMobile'] : $harlow_space_t;
$harlow_vars        = '--e-image-carousel-slides-to-show-desktop: ' . $harlow_show . '; --e-image-carousel-slides-to-show-tablet: ' . $harlow_show_tablet . '; --e-image-carousel-slides-to-show-mobile: ' . $harlow_show_mobile
	. '; --e-image-carousel-space-desktop: ' . $harlow_space . 'px; --e-image-carousel-space-tablet: ' . $harlow_space_t . 'px; --e-image-carousel-space-mobile: ' . $harlow_space_m . 'px';

$harlow_slides = '';
foreach ( $harlow_ids as $harlow_index => $harlow_id ) {
	$harlow_src = wp_get_attachment_image_src( $harlow_id, $harlow_size );
	if ( ! $harlow_src ) {
		continue;
	}
	$harlow_alt = (string) get_post_meta( $harlow_id, '_wp_attachment_image_alt', true );
	$harlow_img = $attributes['lazyload']
		? '<img class="swiper-slide-image swiper-lazy" data-src="' . esc_url( $harlow_src[0] ) . '" alt="' . esc_attr( $harlow_alt ) . '" /><div class="swiper-lazy-preloader"></div>'
		: '<img class="swiper-slide-image" src="' . esc_url( $harlow_src[0] ) . '" alt="' . esc_attr( $harlow_alt ) . '" />';

	$harlow_link = '';
	if ( 'file' === $attributes['linkTo'] ) {
		$harlow_link = '<a' . harlow_image_carousel_lightbox( $harlow_id, $attributes['openLightbox'], $attributes['element'] ) . ' href="' . esc_url( (string) wp_get_attachment_url( $harlow_id ) ) . '">';
	} elseif ( 'custom' === $attributes['linkTo'] && '' !== $attributes['link'] ) {
		$harlow_link = '<a' . harlow_image_carousel_lightbox( 0, $attributes['openLightbox'], $attributes['element'] ) . harlow_link_attributes( $attributes ) . '>';
	}

	$harlow_caption = harlow_image_carousel_caption( $harlow_id, $attributes['captionType'] );
	$harlow_slides .= '<div class="swiper-slide" role="group" aria-roledescription="slide" aria-label="' . esc_attr( ( $harlow_index + 1 ) . ' of ' . $harlow_count ) . '">'
		. $harlow_link
		. '<figure class="swiper-slide-inner">' . $harlow_img
		. ( '' !== $harlow_caption ? '<figcaption class="elementor-image-carousel-caption">' . wp_kses_post( $harlow_caption ) . '</figcaption>' : '' )
		. '</figure>'
		. ( '' !== $harlow_link ? '</a>' : '' )
		. '</div>';
}

$harlow_nav = '';
if ( 1 < $harlow_count ) {
	if ( $harlow_arrows ) {
		$harlow_nav .= "\n" . '<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0" aria-label="' . esc_attr__( 'Previous slide', 'harlow' ) . '">' . "\n"
			. ( '' !== $attributes['prevIcon'] ? harlow_icon( $attributes['prevIcon'] ) : harlow_image_carousel_arrow( 'previous' ) ) . "\n" . '</div>'
			. "\n" . '<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0" aria-label="' . esc_attr__( 'Next slide', 'harlow' ) . '">' . "\n"
			. ( '' !== $attributes['nextIcon'] ? harlow_icon( $attributes['nextIcon'] ) : harlow_image_carousel_arrow( 'next' ) ) . "\n" . '</div>';
	}
	if ( $harlow_dots ) {
		$harlow_nav .= "\n" . '<div class="swiper-pagination"></div>';
	}
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'image-carousel.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-image-carousel-wrapper swiper" role="region" aria-roledescription="carousel" aria-label="' . esc_attr( $attributes['carouselName'] ) . '" dir="' . ( 'rtl' === $attributes['direction'] ? 'rtl' : 'ltr' ) . '" style="' . esc_attr( $harlow_vars ) . '">' . "\n"
	. '<div class="elementor-image-carousel swiper-wrapper' . ( $attributes['imageStretch'] ? ' swiper-image-stretch' : '' ) . '" aria-live="' . ( $attributes['autoplay'] ? 'off' : 'polite' ) . '">' . "\n"
	. $harlow_slides . "\n"
	. '</div>'
	. $harlow_nav . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
