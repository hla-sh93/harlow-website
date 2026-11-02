<?php
/**
 * A media carousel (harlow/media-carousel): Elementor Pro's media carousel widget, its
 * pictures and videos as Swiper's slides (functions/widgets/media-carousel.php) in one of
 * three skins: a carousel, a slideshow with its thumbnails under it, or a coverflow.
 * assets/js/widgets/media-carousel.js moves them with the settings Elementor keeps in
 * data-settings and plays a video in a lightbox; a picture opens the site's lightbox.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_slides = array_values( array_filter( (array) $attributes['slides'], 'is_array' ) );
if ( ! $harlow_slides ) {
	return;
}
$harlow_skin  = in_array( $attributes['skin'], array( 'carousel', 'slideshow', 'coverflow' ), true ) ? $attributes['skin'] : 'carousel';
$harlow_count = count( $harlow_slides );
$harlow_pages = 'slideshow' === $harlow_skin ? '' : ( in_array( $attributes['pagination'], array( 'bullets', 'fraction', 'progressbar' ), true ) ? $attributes['pagination'] : '' );
$harlow_ratio = in_array( $attributes['thumbsRatio'], array( '169', '219', '43', '11' ), true ) ? $attributes['thumbsRatio'] : '219';

// The settings the page's script reads, as Elementor keeps them.
$harlow_number   = static function ( $value ) {
	return is_numeric( $value ) ? (string) ( 0 + $value ) : '';
};
$harlow_stored   = json_decode( (string) $attributes['settings'], true );
$harlow_settings = array_merge(
	is_array( $harlow_stored ) ? $harlow_stored : array(),
	array_filter(
		array(
			'skin'                    => $harlow_skin,
			'effect'                  => 'slideshow' === $harlow_skin && 'fade' === $attributes['effect'] ? 'fade' : 'slide',
			'slides_per_view'         => $harlow_number( $attributes['slidesPerView'] ),
			'slides_per_view_tablet'  => $harlow_number( $attributes['slidesPerViewTablet'] ),
			'slides_per_view_mobile'  => $harlow_number( $attributes['slidesPerViewMobile'] ),
			'slides_to_scroll'        => $harlow_number( $attributes['slidesToScroll'] ),
			'slides_to_scroll_tablet' => $harlow_number( $attributes['slidesToScrollTablet'] ),
			'slides_to_scroll_mobile' => $harlow_number( $attributes['slidesToScrollMobile'] ),
			'show_arrows'             => $attributes['showArrows'] ? 'yes' : '',
			'pagination'              => $harlow_pages,
			'speed'                   => (string) (int) $attributes['speed'],
			'autoplay'                => $attributes['autoplay'] ? 'yes' : '',
			'autoplay_speed'          => (string) (int) $attributes['autoplaySpeed'],
			'loop'                    => $attributes['loop'] ? 'yes' : '',
			'pause_on_hover'          => $attributes['pauseOnHover'] ? 'yes' : '',
			'pause_on_interaction'    => $attributes['pauseOnInteraction'] ? 'yes' : '',
			'lazyload'                => $attributes['lazyload'] ? 'yes' : '',
		),
		'strlen'
	)
);
foreach ( array(
	''        => 'spaceBetween',
	'_tablet' => 'spaceBetweenTablet',
	'_mobile' => 'spaceBetweenMobile',
) as $harlow_suffix => $harlow_key ) {
	if ( is_numeric( $attributes[ $harlow_key ] ) ) {
		$harlow_settings[ 'space_between' . $harlow_suffix ] = array(
			'unit'  => 'px',
			'size'  => 0 + $attributes[ $harlow_key ],
			'sizes' => array(),
		);
	}
}

// Elementor's prefix classes: the skin, the pagination and its place, the thumbnails' ratio.
$harlow_element             = $attributes;
$harlow_element['classes']  = trim(
	preg_replace( '/\s*\belementor-(skin|pagination-type|pagination-position|aspect-ratio)-\S+/', '', $attributes['classes'] )
	. ' elementor-skin-' . $harlow_skin
	. ( '' !== $harlow_pages ? ' elementor-pagination-type-' . $harlow_pages : '' )
	. ( '' !== $harlow_pages ? ' elementor-pagination-position-' . ( 'inside' === $attributes['paginationPosition'] ? 'inside' : 'outside' ) : '' )
	. ( 'slideshow' === $harlow_skin ? ' elementor-aspect-ratio-' . $harlow_ratio : '' )
);
$harlow_element['settings'] = (string) wp_json_encode( $harlow_settings );

// The first view before the script runs (and in the editor): the slides each device shows,
// the space between them, the carousel's height.
$harlow_show   = (float) $harlow_number( $attributes['slidesPerView'] ) ? (float) $attributes['slidesPerView'] : ( 'slideshow' === $harlow_skin ? 5 : 3 );
$harlow_show_t = (float) $harlow_number( $attributes['slidesPerViewTablet'] ) ? (float) $attributes['slidesPerViewTablet'] : ( 'slideshow' === $harlow_skin ? $harlow_show : ( 1.0 === $harlow_show ? 1 : 2 ) );
$harlow_show_m = (float) $harlow_number( $attributes['slidesPerViewMobile'] ) ? (float) $attributes['slidesPerViewMobile'] : ( 'slideshow' === $harlow_skin ? $harlow_show_t : 1 );
$harlow_gap    = is_numeric( $attributes['spaceBetween'] ) ? (float) $attributes['spaceBetween'] : 10;
$harlow_gap_t  = is_numeric( $attributes['spaceBetweenTablet'] ) ? (float) $attributes['spaceBetweenTablet'] : $harlow_gap;
$harlow_gap_m  = is_numeric( $attributes['spaceBetweenMobile'] ) ? (float) $attributes['spaceBetweenMobile'] : $harlow_gap_t;
$harlow_vars   = '--e-media-carousel-slides-desktop: ' . $harlow_show . '; --e-media-carousel-slides-tablet: ' . $harlow_show_t . '; --e-media-carousel-slides-mobile: ' . $harlow_show_m
	. '; --e-media-carousel-space-desktop: ' . $harlow_gap . 'px; --e-media-carousel-space-tablet: ' . $harlow_gap_t . 'px; --e-media-carousel-space-mobile: ' . $harlow_gap_m . 'px;';
foreach ( array(
	'desktop' => 'height',
	'tablet'  => 'heightTablet',
	'mobile'  => 'heightMobile',
) as $harlow_device => $harlow_key ) {
	if ( is_numeric( $attributes[ $harlow_key ] ) ) {
		$harlow_vars .= ' --e-media-carousel-height-' . $harlow_device . ': ' . max( 0, (float) $attributes[ $harlow_key ] ) . 'px;';
	}
}
$harlow_fit = in_array( $attributes['imageFit'], array( 'cover', 'contain', 'auto' ), true ) ? $attributes['imageFit'] : 'cover';

// One carousel: the main one, or the slideshow's thumbnails.
$harlow_slider = static function ( $thumbs ) use ( $harlow_slides, $attributes, $harlow_count, $harlow_pages, $harlow_vars, $harlow_fit ) {
	$items = '';
	foreach ( $harlow_slides as $harlow_slide ) {
		$items .= '<div class="swiper-slide" role="group" aria-roledescription="slide">' . harlow_media_carousel_slide( $harlow_slide, $attributes, $thumbs ) . '</div>';
	}
	$nav = '';
	if ( 1 < $harlow_count ) {
		if ( '' !== $harlow_pages && ! $thumbs ) {
			$nav .= "\n" . '<div class="swiper-pagination"></div>';
		}
		if ( $attributes['showArrows'] && ! $thumbs ) {
			$nav .= "\n" . '<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0" aria-label="' . esc_attr__( 'Previous slide', 'harlow' ) . '">' . harlow_media_carousel_icon( 'previous' ) . '</div>'
				. "\n" . '<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0" aria-label="' . esc_attr__( 'Next slide', 'harlow' ) . '">' . harlow_media_carousel_icon( 'next' ) . '</div>';
		}
	}
	return '<div class="elementor-swiper">' . "\n"
		. '<div class="' . ( $thumbs ? 'elementor-thumbnails-swiper' : 'elementor-main-swiper' ) . ' swiper" role="region" aria-roledescription="carousel" aria-label="' . esc_attr( $attributes['carouselName'] ) . '" style="' . esc_attr( $harlow_vars . ' --e-media-carousel-fit: ' . $harlow_fit . ';' ) . '">' . "\n"
		. '<div class="swiper-wrapper">' . "\n" . $items . "\n" . '</div>'
		. $nav . "\n"
		. '</div>' . "\n"
		. '</div>';
};

$harlow_inner = $harlow_slider( false );
if ( 'slideshow' === $harlow_skin && 1 < $harlow_count ) {
	$harlow_inner .= "\n" . $harlow_slider( true );
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'media-carousel.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
