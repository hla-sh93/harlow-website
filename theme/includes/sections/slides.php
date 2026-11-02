<?php
/**
 * Slides (harlow/slides): Elementor Pro's slides widget, its slides as Swiper's
 * (functions/widgets/slides.php), which assets/js/widgets/slides.js moves with the settings
 * Elementor keeps in data-settings, each slide's words animated in as it comes.
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
$harlow_count  = count( $harlow_slides );
$harlow_arrows = in_array( $attributes['navigation'], array( 'both', 'arrows' ), true );
$harlow_dots   = in_array( $attributes['navigation'], array( 'both', 'dots' ), true );
$harlow_button = 'elementor-button elementor-slide-button elementor-size-' . ( in_array( $attributes['buttonSize'], array( 'xs', 'sm', 'md', 'lg', 'xl' ), true ) ? $attributes['buttonSize'] : 'sm' );

// The settings the page's script reads, as Elementor keeps them.
$harlow_stored   = json_decode( (string) $attributes['settings'], true );
$harlow_settings = array_merge(
	is_array( $harlow_stored ) ? $harlow_stored : array(),
	array_filter(
		array(
			'navigation'           => $attributes['navigation'],
			'autoplay'             => $attributes['autoplay'] ? 'yes' : '',
			'pause_on_hover'       => $attributes['pauseOnHover'] ? 'yes' : '',
			'pause_on_interaction' => $attributes['pauseOnInteraction'] ? 'yes' : '',
			'autoplay_speed'       => (string) (int) $attributes['autoplaySpeed'],
			'infinite'             => $attributes['infinite'] ? 'yes' : '',
			'transition'           => 'fade' === $attributes['transition'] ? 'fade' : 'slide',
			'transition_speed'     => (string) (int) $attributes['transitionSpeed'],
		),
		'strlen'
	)
);

// Elementor's prefix classes: where the arrows, the dots and the words are.
$harlow_h                   = in_array( $attributes['horizontalPosition'], array( 'left', 'center', 'right' ), true ) ? $attributes['horizontalPosition'] : 'center';
$harlow_v                   = in_array( $attributes['verticalPosition'], array( 'top', 'middle', 'bottom' ), true ) ? $attributes['verticalPosition'] : 'middle';
$harlow_element             = $attributes;
$harlow_element['classes']  = trim(
	preg_replace( '/\s*\belementor-(arrows-position|pagination-position|-h-position|-v-position)-\S+/', '', $attributes['classes'] )
	. ' elementor--h-position-' . $harlow_h
	. ' elementor--v-position-' . $harlow_v
	. ' elementor-arrows-position-' . ( 'outside' === $attributes['arrowsPosition'] ? 'outside' : 'inside' )
	. ' elementor-pagination-position-' . ( 'outside' === $attributes['dotsPosition'] ? 'outside' : 'inside' )
);
$harlow_element['settings'] = (string) wp_json_encode( $harlow_settings );

// The slides' height on each device (Elementor's responsive height control).
$harlow_unit = in_array( $attributes['heightUnit'], array( 'px', 'vh', 'em' ), true ) ? $attributes['heightUnit'] : 'px';
$harlow_vars = '';
foreach ( array(
	'desktop' => 'height',
	'tablet'  => 'heightTablet',
	'mobile'  => 'heightMobile',
) as $harlow_device => $harlow_key ) {
	if ( is_numeric( $attributes[ $harlow_key ] ) ) {
		$harlow_vars .= '--e-slides-height-' . $harlow_device . ': ' . max( 0, (float) $attributes[ $harlow_key ] ) . $harlow_unit . '; ';
	}
}

$harlow_items = '';
foreach ( $harlow_slides as $harlow_slide ) {
	$harlow_items .= harlow_slides_slide( $harlow_slide, $harlow_button );
}

$harlow_nav = '';
if ( 1 < $harlow_count ) {
	if ( $harlow_dots ) {
		$harlow_nav .= "\n" . '<div class="swiper-pagination"></div>';
	}
	if ( $harlow_arrows ) {
		$harlow_nav .= "\n" . '<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0" aria-label="' . esc_attr__( 'Previous slide', 'harlow' ) . '">' . "\n"
			. ( '' !== $attributes['prevIcon'] ? harlow_icon( $attributes['prevIcon'] ) : harlow_slides_arrow( 'previous' ) ) . "\n" . '</div>'
			. "\n" . '<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0" aria-label="' . esc_attr__( 'Next slide', 'harlow' ) . '">' . "\n"
			. ( '' !== $attributes['nextIcon'] ? harlow_icon( $attributes['nextIcon'] ) : harlow_slides_arrow( 'next' ) ) . "\n" . '</div>';
	}
}

$harlow_animations = array( '', 'fadeInDown', 'fadeInUp', 'fadeInRight', 'fadeInLeft', 'zoomIn' );
$harlow_animation  = in_array( $attributes['contentAnimation'], $harlow_animations, true ) ? $attributes['contentAnimation'] : 'fadeInUp';

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'slides.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-swiper">' . "\n"
	. '<div class="elementor-slides-wrapper elementor-main-swiper swiper" role="region" aria-roledescription="carousel" aria-label="' . esc_attr( $attributes['carouselName'] ) . '" dir="' . ( is_rtl() ? 'rtl' : 'ltr' ) . '" data-animation="' . esc_attr( $harlow_animation ) . '"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( trim( $harlow_vars ) ) . '"' : '' ) . '>' . "\n"
	. '<div class="swiper-wrapper elementor-slides">' . "\n"
	. $harlow_items . "\n"
	. '</div>'
	. $harlow_nav . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
