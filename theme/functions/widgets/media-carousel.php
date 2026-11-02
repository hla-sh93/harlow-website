<?php
/**
 * The media carousel (harlow/media-carousel, includes/sections/media-carousel.php): one
 * slide's markup, as Elementor Pro's media carousel writes it (a picture as a background, a
 * video's play icon, the overlay, the link or the lightbox), and the icons it draws.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Elementor's icons the widget draws: the arrows (eicons chevrons), the play icon (eicons
 * play) and the overlay's default (Font Awesome's search plus).
 *
 * @param string $which previous, next, play or overlay.
 * @return string
 */
function harlow_media_carousel_icon( $which ) {
	$icons = array(
		'previous' => '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-left" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"></path></svg>',
		'next'     => '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-right" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z"></path></svg>',
		'play'     => '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-play" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M838 162C746 71 633 25 500 25 371 25 258 71 163 162 71 254 25 367 25 500 25 633 71 746 163 837 254 929 367 979 500 979 633 979 746 933 838 837 929 746 975 633 975 500 975 367 929 254 838 162M808 192C892 279 933 379 933 500 933 621 892 725 808 808 725 892 621 938 500 938 379 938 279 896 196 808 113 725 67 621 67 500 67 379 108 279 196 192 279 108 383 63 500 63 621 63 721 104 808 192M438 392V642L642 517 438 392Z"></path></svg>',
		'overlay'  => '<svg aria-hidden="true" class="e-font-icon-svg e-fas-search-plus" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M304 192v32c0 6.6-5.4 12-12 12h-56v56c0 6.6-5.4 12-12 12h-32c-6.6 0-12-5.4-12-12v-56h-56c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h56v-56c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v56h56c6.6 0 12 5.4 12 12zm201 284.7L476.7 505c-9.4 9.4-24.6 9.4-33.9 0L343 405.3c-4.5-4.5-7-10.6-7-17V372c-35.3 27.6-79.7 44-128 44C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208c0 48.3-16.4 92.7-44 128h16.3c6.4 0 12.5 2.5 17 7l99.7 99.7c9.3 9.4 9.3 24.6 0 34zM344 208c0-75.2-60.8-136-136-136S72 132.8 72 208s60.8 136 136 136 136-60.8 136-136z"></path></svg>',
	);
	return isset( $icons[ $which ] ) ? $icons[ $which ] : '';
}

/**
 * The player's embed address of a YouTube or Vimeo address, for the lightbox (autoplay on,
 * no related videos, no controls bar, as Elementor asks for), or ''.
 *
 * @param string $url The video's address.
 * @return string
 */
function harlow_media_carousel_embed_url( $url ) {
	$params = array(
		'autoplay' => 1,
		'rel'      => 0,
		'controls' => 0,
	);
	if ( preg_match( '/^.*(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:(?:watch)?\?(?:.*&)?vi?=|(?:embed|v|vi|user|shorts)\/))([^\?&\"\'>]+)/', (string) $url, $m ) ) {
		return add_query_arg( $params, 'https://www.youtube.com/embed/' . $m[1] . '?feature=oembed' );
	}
	if ( preg_match( '/^.*vimeo\.com\/(?:[a-z]*\/)*([0-9]{6,11})[?]?.*/', (string) $url, $m ) ) {
		return add_query_arg( $params, 'https://player.vimeo.com/video/' . $m[1] . '#t=' );
	}
	return '';
}

/**
 * The lightbox's action hash of a link, as Elementor writes it.
 *
 * @param array<string,mixed> $params The lightbox's settings.
 * @return string
 */
function harlow_media_carousel_hash( $params ) {
	return '#' . rawurlencode(
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Elementor's lightbox reads its settings as base64 JSON.
		'elementor-action:action=lightbox&settings=' . base64_encode( (string) wp_json_encode( $params ) )
	);
}

/**
 * One slide's contents.
 *
 * @param array<string,mixed> $slide      The slide (an item of the block's slides).
 * @param array<string,mixed> $attributes The block's attributes.
 * @param bool                $thumbs     A slide of the slideshow's thumbnails.
 * @return string
 */
function harlow_media_carousel_slide( $slide, $attributes, $thumbs ) {
	$get     = static function ( $key, $fallback = '' ) use ( $slide ) {
		return isset( $slide[ $key ] ) && null !== $slide[ $key ] ? $slide[ $key ] : $fallback;
	};
	$picture = (int) $get( 'image', 0 );
	$size    = '' !== $attributes['imageSize'] ? $attributes['imageSize'] : 'full';
	$src     = $picture ? (string) wp_get_attachment_image_url( $picture, $size ) : '';
	$video   = 'video' === $get( 'type', 'image' ) && '' !== (string) $get( 'video' );

	// The picture, as the slide's background.
	$classes = 'elementor-carousel-image' . ( $thumbs ? ' elementor-fit-aspect-ratio' : '' );
	$attrs   = ' role="img" aria-label="' . esc_attr( $picture ? (string) get_post_meta( $picture, '_wp_attachment_image_alt', true ) : '' ) . '"';
	if ( '' !== $src && $attributes['lazyload'] ) {
		$classes .= ' swiper-lazy';
		$attrs   .= ' data-background="' . esc_url( $src ) . '"';
	} elseif ( '' !== $src ) {
		$attrs .= ' style="' . esc_attr( 'background-image: url(' . esc_url( $src ) . ')' ) . '"';
	}
	$image = '<div class="' . esc_attr( $classes ) . '"' . $attrs . '>';
	if ( $video && ! $thumbs ) {
		$image .= '<div class="elementor-custom-embed-play">' . harlow_media_carousel_icon( 'play' ) . '<span class="elementor-screen-only">' . esc_html__( 'Play', 'harlow' ) . '</span></div>';
	}
	$image .= '</div>';

	// The overlay: the picture's words or an icon, shown on hover.
	if ( ! $thumbs && in_array( $attributes['overlay'], array( 'text', 'icon' ), true ) ) {
		$animation = in_array( $attributes['overlayAnimation'], array( 'fade', 'slide-up', 'slide-down', 'slide-right', 'slide-left', 'zoom-in' ), true ) ? $attributes['overlayAnimation'] : 'fade';
		$inside    = '';
		if ( 'text' === $attributes['overlay'] && $picture ) {
			if ( 'title' === $attributes['caption'] ) {
				$inside = esc_html( (string) get_post_field( 'post_title', $picture, 'raw' ) );
			} elseif ( 'description' === $attributes['caption'] ) {
				$inside = wp_kses_post( (string) get_post_field( 'post_content', $picture, 'raw' ) );
			} else {
				$inside = wp_kses_post( (string) wp_get_attachment_caption( $picture ) );
			}
		} elseif ( 'icon' === $attributes['overlay'] ) {
			$inside = '' !== $attributes['overlayIcon'] ? harlow_icon( $attributes['overlayIcon'] ) : harlow_media_carousel_icon( 'overlay' );
		}
		$image .= '<div class="elementor-carousel-image-overlay e-overlay-animation-' . esc_attr( $animation ) . '">' . $inside . '</div>';
	}
	if ( $thumbs ) {
		return $image;
	}

	// The link: the picture's file in the lightbox, a video in the lightbox, or an address.
	$link_type = $video ? 'file' : (string) $get( 'linkType' );
	if ( 'custom' === $link_type && '' !== (string) $get( 'link' ) ) {
		$open = '<a' . harlow_link_attributes(
			array(
				'link'       => (string) $get( 'link' ),
				'linkTarget' => $get( 'linkTarget' ),
				'linkRel'    => $get( 'linkRel' ),
			)
		) . '>';
		return $open . $image . '</a>';
	}
	if ( 'file' === $link_type && ( '' !== $src || $video ) ) {
		$href   = $picture ? (string) wp_get_attachment_url( $picture ) : '';
		$params = array( 'slideshow' => $attributes['element'] );
		$open   = '<a href="' . esc_url( $href ) . '" data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="' . esc_attr( $attributes['element'] ) . '"';
		if ( $picture ) {
			$title = (string) get_post_field( 'post_title', $picture, 'raw' );
			if ( '' !== $title ) {
				$open .= ' data-elementor-lightbox-title="' . esc_attr( $title ) . '"';
			}
			$params['id']  = $picture;
			$params['url'] = $href;
		}
		if ( $video ) {
			$embed = harlow_media_carousel_embed_url( (string) $get( 'video' ) );
			$open .= ' data-elementor-lightbox-video="' . esc_url( '' !== $embed ? $embed : (string) $get( 'video' ) ) . '"';
		}
		$open .= ' data-e-action-hash="' . esc_attr( harlow_media_carousel_hash( $params ) ) . '">';
		return $open . $image . '</a>';
	}
	return $image;
}
