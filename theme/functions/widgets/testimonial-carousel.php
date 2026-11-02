<?php
/**
 * What Elementor Pro's carousel widgets share (the testimonial carousel and the reviews,
 * both built on Pro's carousel base): the settings their script reads, the slides per view
 * and the space between them as the carousel's own custom properties (so the editor and a
 * page whose script has not run yet lay the slides out as the script will), the pagination
 * and the arrows. The script is assets/js/widgets/testimonial-carousel.js, for both.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * A number of a responsive setting: the device's own, or the larger device's, or the
 * default.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $name       The attribute (slidesPerView, spaceBetween...).
 * @param string              $device     '', 'Tablet' or 'Mobile'.
 * @param float               $fallback   What to use when no device has one.
 * @param bool                $inherit    Whether a device without its own takes the larger device's.
 * @return float
 */
function harlow_testimonial_carousel_number( $attributes, $name, $device, $fallback, $inherit = true ) {
	$chain = $inherit ? array_slice( array( 'Mobile', 'Tablet', '' ), array_search( $device, array( 'Mobile', 'Tablet', '' ), true ) ) : array( $device );
	foreach ( $chain as $one ) {
		$value = isset( $attributes[ $name . $one ] ) ? $attributes[ $name . $one ] : '';
		if ( '' !== $value && null !== $value && is_numeric( $value ) ) {
			return (float) $value;
		}
	}
	return (float) $fallback;
}

/**
 * The carousel's settings (as Elementor keeps them in data-settings) and its custom
 * properties.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param int                 $count      How many slides.
 * @param array<int,int>      $views      Slides per view when none is set: desktop, tablet, mobile.
 * @return array{0: array<string,mixed>, 1: string} The settings, and the style attribute's value.
 */
function harlow_testimonial_carousel_settings( $attributes, $count, $views ) {
	$devices  = array( '', 'Tablet', 'Mobile' );
	$suffixes = array( '', '_tablet', '_mobile' );
	$css      = array( '', '-tablet', '-mobile' );
	$settings = array();
	$style    = '';
	foreach ( $devices as $i => $device ) {
		// A device without its own slides per view takes the widget's default for it, as
		// Elementor's script does; the space and the slides to scroll take the larger device's.
		$view  = (int) harlow_testimonial_carousel_number( $attributes, 'slidesPerView', $device, $views[ $i ], false );
		$view  = max( 1, min( 10, $view, max( 1, $count ) ) );
		$space = max( 0, min( 200, harlow_testimonial_carousel_number( $attributes, 'spaceBetween', $device, 10 ) ) );
		$step  = (int) harlow_testimonial_carousel_number( $attributes, 'slidesToScroll', $device, 1 );

		$settings[ 'slides_per_view' . $suffixes[ $i ] ]  = (string) $view;
		$settings[ 'slides_to_scroll' . $suffixes[ $i ] ] = (string) max( 1, min( 10, $step ) );
		$settings[ 'space_between' . $suffixes[ $i ] ]    = array(
			'unit' => 'px',
			'size' => $space,
		);
		$style .= '--e-slides-per-view' . $css[ $i ] . ':' . $view . ';--e-space-between' . $css[ $i ] . ':' . $space . 'px;';
	}
	$settings['show_arrows']          = $attributes['showArrows'] ? 'yes' : '';
	$settings['pagination']           = in_array( $attributes['pagination'], array( 'bullets', 'fraction', 'progressbar' ), true ) ? $attributes['pagination'] : '';
	$settings['speed']                = max( 0, min( 10000, (int) $attributes['speed'] ) );
	$settings['autoplay']             = $attributes['autoplay'] ? 'yes' : '';
	$settings['autoplay_speed']       = max( 0, min( 60000, (int) $attributes['autoplaySpeed'] ) );
	$settings['loop']                 = $attributes['loop'] ? 'yes' : '';
	$settings['pause_on_hover']       = $attributes['pauseOnHover'] ? 'yes' : '';
	$settings['pause_on_interaction'] = $attributes['pauseOnInteraction'] ? 'yes' : '';

	// The carousel's width (Elementor's width control), less the arrows' room when it has them.
	$width = isset( $attributes['width'] ) ? trim( (string) $attributes['width'] ) : '';
	if ( '' !== $width && is_numeric( $width ) ) {
		$unit   = in_array( $attributes['widthUnit'], array( 'px', '%', 'vw' ), true ) ? $attributes['widthUnit'] : '%';
		$style .= $attributes['showArrows'] ? 'width:calc(' . (float) $width . $unit . ' - 40px);' : 'width:' . (float) $width . $unit . ';';
	}
	return array( $settings, $style );
}

/**
 * The element's attributes with the carousel's classes and settings: Elementor's classes
 * when the block has none yet, e-widget-swiper, the arrows' and the pagination's classes,
 * and the settings merged into the element's own.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $type       The widget type (testimonial-carousel, reviews).
 * @param array<string,mixed> $settings   The carousel's settings.
 * @param string[]            $classes    The widget's own classes (skin, layout...).
 * @return array<string,mixed> The attributes to print the element with.
 */
function harlow_testimonial_carousel_element( $attributes, $type, $settings, $classes ) {
	$element = $attributes;
	if ( '' === trim( $element['classes'] ) ) {
		$element['classes'] = 'elementor-element elementor-widget elementor-widget-' . $type;
	}
	$classes[] = 'e-widget-swiper';
	if ( 'yes' === $settings['show_arrows'] ) {
		$classes[] = 'elementor-arrows-yes';
	}
	if ( '' !== $settings['pagination'] ) {
		$classes[] = 'elementor-pagination-type-' . $settings['pagination'];
	}
	$element['classes'] .= ' ' . implode( ' ', $classes );
	$own                 = '' !== $attributes['settings'] ? json_decode( $attributes['settings'], true ) : array();
	$element['settings'] = (string) wp_json_encode( array_merge( is_array( $own ) ? $own : array(), $settings ) );
	return $element;
}

/**
 * An arrow: Elementor's chevron icon (eicons, as inline SVG).
 *
 * @param string $direction 'prev' or 'next'.
 * @return string
 */
function harlow_testimonial_carousel_arrow( $direction ) {
	if ( 'prev' === $direction ) {
		return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-left" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"></path></svg>';
	}
	return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-right" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z"></path></svg>';
}

/**
 * The carousel around its slides: the swiper, its wrapper, then the pagination and the
 * arrows when there is more than one slide (the script fills the pagination).
 *
 * @param string[]            $slides   Each slide's inside, printed.
 * @param array<string,mixed> $settings The carousel's settings.
 * @param string              $style    The carousel's custom properties.
 * @return string
 */
function harlow_testimonial_carousel_markup( $slides, $settings, $style ) {
	$count = count( $slides );
	$html  = '<div class="elementor-main-swiper swiper" role="region" aria-roledescription="carousel" aria-label="' . esc_attr__( 'Slides', 'harlow' ) . '" style="' . esc_attr( $style ) . '">' . "\n"
		. '<div class="swiper-wrapper">' . "\n";
	foreach ( array_values( $slides ) as $i => $slide ) {
		/* translators: 1: the slide's number, 2: how many slides. */
		$label = sprintf( __( '%1$s of %2$s', 'harlow' ), $i + 1, $count );
		$html .= '<div class="swiper-slide" role="group" aria-roledescription="slide" aria-label="' . esc_attr( $label ) . '">' . "\n" . $slide . '</div>' . "\n";
	}
	$html .= '</div>' . "\n";
	if ( 1 < $count ) {
		if ( '' !== $settings['pagination'] ) {
			$html .= '<div class="swiper-pagination"></div>' . "\n";
		}
		if ( 'yes' === $settings['show_arrows'] ) {
			$html .= '<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0" aria-label="' . esc_attr__( 'Previous', 'harlow' ) . '">' . "\n" . harlow_testimonial_carousel_arrow( 'prev' ) . "\n" . '</div>' . "\n"
				. '<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0" aria-label="' . esc_attr__( 'Next', 'harlow' ) . '">' . "\n" . harlow_testimonial_carousel_arrow( 'next' ) . "\n" . '</div>' . "\n";
		}
	}
	return $html . '</div>' . "\n";
}

/**
 * A slide's picture as Elementor's carousels print it: its address at the widget's size,
 * the name for its words.
 *
 * @param int    $id   The picture.
 * @param string $size The size's name.
 * @param string $alt  Its words for screen readers.
 * @return string
 */
function harlow_testimonial_carousel_image( $id, $size, $alt ) {
	$id = (int) $id;
	if ( ! $id || ! wp_attachment_is_image( $id ) ) {
		return '';
	}
	$src = wp_get_attachment_image_url( $id, '' !== $size ? $size : 'full' );
	return $src ? '<img src="' . esc_url( $src ) . '" alt="' . esc_attr( wp_strip_all_tags( $alt ) ) . '">' : '';
}
