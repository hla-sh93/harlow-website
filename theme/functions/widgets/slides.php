<?php
/**
 * The slides (harlow/slides, includes/sections/slides.php): one slide's markup, as Elementor
 * Pro's slides widget writes it, with the slide's own design (its background, overlay,
 * position, alignment and colour) in its own elements' style.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Elementor's arrow icons (eicons chevron left and right), drawn when no icon is chosen.
 *
 * @param string $which 'previous' or 'next'.
 * @return string
 */
function harlow_slides_arrow( $which ) {
	if ( 'next' === $which ) {
		return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-right" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z"></path></svg>';
	}
	return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-left" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"></path></svg>';
}

/**
 * A colour as typed (#hex, rgb(), rgba(), hsl(), hsla(), transparent), or ''.
 *
 * @param mixed $value The colour.
 * @return string
 */
function harlow_slides_colour( $value ) {
	$value = is_string( $value ) ? trim( $value ) : '';
	if ( preg_match( '/^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([0-9.,%\s\/-]+\)|transparent)$/i', $value ) ) {
		return $value;
	}
	return '';
}

/**
 * One slide.
 *
 * @param array<string,mixed> $slide  The slide (an item of the block's slides).
 * @param string              $button The button's classes.
 * @return string
 */
function harlow_slides_slide( $slide, $button ) {
	$get = static function ( $key, $fallback = '' ) use ( $slide ) {
		return isset( $slide[ $key ] ) && null !== $slide[ $key ] ? $slide[ $key ] : $fallback;
	};

	// The background: its colour, picture and size; Ken Burns' zoom.
	$bg_style = '';
	$colour   = harlow_slides_colour( $get( 'backgroundColor', '#bbbbbb' ) );
	if ( '' !== $colour ) {
		$bg_style .= 'background-color: ' . $colour . ';';
	}
	$picture = (int) $get( 'backgroundImage', 0 );
	$url     = $picture ? wp_get_attachment_image_url( $picture, 'full' ) : '';
	if ( $url ) {
		$size      = in_array( $get( 'backgroundSize', 'cover' ), array( 'cover', 'contain', 'auto' ), true ) ? $get( 'backgroundSize', 'cover' ) : 'cover';
		$bg_style .= ' background-image: url(' . esc_url( $url ) . '); background-size: ' . $size . ';';
	}
	$ken  = $url && $get( 'kenBurns', false ) ? ' elementor-ken-burns elementor-ken-burns--' . ( 'out' === $get( 'zoomDirection', 'in' ) ? 'out' : 'in' ) : '';
	$html = '<div class="swiper-slide-bg' . $ken . '" role="img"' . ( '' !== $bg_style ? ' style="' . esc_attr( trim( $bg_style ) ) . '"' : '' ) . '></div>';

	if ( $get( 'overlay', false ) ) {
		$tint    = harlow_slides_colour( $get( 'overlayColor', 'rgba(0,0,0,0.5)' ) );
		$overlay = 'background-color: ' . ( '' !== $tint ? $tint : 'rgba(0,0,0,0.5)' ) . ';';
		$blend   = $get( 'overlayBlend' );
		if ( in_array( $blend, array( 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hue', 'saturation', 'color', 'exclusion', 'luminosity' ), true ) ) {
			$overlay .= ' mix-blend-mode: ' . $blend . ';';
		}
		$html .= '<div class="elementor-background-overlay" style="' . esc_attr( $overlay ) . '"></div>';
	}

	// The slide's own position, alignment and colour (Elementor's custom style of a slide).
	$inner_style = '';
	$words_style = '';
	if ( $get( 'customStyle', false ) ) {
		$across = array(
			'left'   => 'flex-start',
			'center' => 'center',
			'right'  => 'flex-end',
		);
		$down   = array(
			'top'    => 'flex-start',
			'middle' => 'center',
			'bottom' => 'flex-end',
		);
		if ( isset( $across[ $get( 'horizontalPosition' ) ] ) ) {
			$inner_style .= 'justify-content: ' . $across[ $get( 'horizontalPosition' ) ] . ';';
		}
		if ( isset( $down[ $get( 'verticalPosition' ) ] ) ) {
			$inner_style .= ' align-items: ' . $down[ $get( 'verticalPosition' ) ] . ';';
		}
		if ( in_array( $get( 'textAlign' ), array( 'left', 'center', 'right' ), true ) ) {
			$inner_style .= ' text-align: ' . $get( 'textAlign' ) . ';';
		}
		$content = harlow_slides_colour( $get( 'contentColor' ) );
		if ( '' !== $content ) {
			$words_style = ' style="' . esc_attr( 'color: ' . $content . '; border-color: ' . $content ) . '"';
		}
	}

	// The link: the whole slide, or its button.
	$link       = (string) $get( 'link' );
	$link_attrs = '';
	if ( '' !== $link ) {
		$link_attrs = harlow_link_attributes(
			array(
				'link'       => $link,
				'linkTarget' => $get( 'linkTarget' ),
				'linkRel'    => $get( 'linkRel' ),
			)
		);
	}
	$on_button = '' !== $link && 'button' === $get( 'linkClick', 'slide' );
	$slide_tag = '' !== $link && ! $on_button ? 'a' : 'div';

	$contents = '';
	if ( '' !== (string) $get( 'heading' ) ) {
		$contents .= '<div class="elementor-slide-heading"' . $words_style . '>' . wp_kses_post( $get( 'heading' ) ) . '</div>';
	}
	if ( '' !== (string) $get( 'description' ) ) {
		$contents .= '<div class="elementor-slide-description"' . $words_style . '>' . wp_kses_post( $get( 'description' ) ) . '</div>';
	}
	if ( '' !== (string) $get( 'buttonText' ) ) {
		$tag       = $on_button ? 'a' : 'div';
		$contents .= '<' . $tag . ( $on_button ? $link_attrs : '' ) . ' class="' . esc_attr( $button ) . '"' . $words_style . '>' . wp_kses_post( $get( 'buttonText' ) ) . '</' . $tag . '>';
	}

	$html .= '<' . $slide_tag . ' class="swiper-slide-inner"' . ( 'a' === $slide_tag ? $link_attrs : '' ) . ( '' !== $inner_style ? ' style="' . esc_attr( trim( $inner_style ) ) . '"' : '' ) . '>'
		. '<div class="swiper-slide-contents">' . $contents . '</div>'
		. '</' . $slide_tag . '>';

	$id = preg_replace( '/[^a-z0-9_-]/i', '', (string) $get( 'id' ) );
	return '<div class="elementor-repeater-item-' . esc_attr( $id ) . ' swiper-slide" role="group" aria-roledescription="slide">' . $html . '</div>';
}
