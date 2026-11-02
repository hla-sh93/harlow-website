<?php
/**
 * A blockquote (harlow/blockquote): Elementor Pro's blockquote widget, a quotation with its
 * author and a button that shares it on X (the quotation, the author, the username after
 * "via" and the page's address in the post). The skin, the alignment and the button's
 * view, skin and colour are Elementor's classes on the element.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_skin   = in_array( $attributes['skin'], array( 'border', 'quotation', 'boxed', 'clean' ), true ) ? $attributes['skin'] : 'border';
$harlow_align  = in_array( $attributes['alignment'], array( 'left', 'center', 'right' ), true ) ? $attributes['alignment'] : 'left';
$harlow_view   = in_array( $attributes['tweetView'], array( 'icon-text', 'icon', 'text' ), true ) ? $attributes['tweetView'] : 'icon-text';
$harlow_bskin  = in_array( $attributes['tweetSkin'], array( 'classic', 'bubble', 'link' ), true ) ? $attributes['tweetSkin'] : 'classic';
$harlow_color  = 'custom' === $attributes['tweetColor'] ? 'custom' : 'official';
$harlow_words  = trim( (string) $attributes['content'] );
$harlow_author = trim( (string) $attributes['author'] );
$harlow_tweet  = (bool) $attributes['tweetButton'];

$harlow_footer = '';
if ( '' !== $harlow_author ) {
	$harlow_footer .= '<cite class="elementor-blockquote__author">' . wp_kses_post( $harlow_author ) . '</cite>' . "\n";
}
if ( $harlow_tweet ) {
	// The post: the quotation and its author, the username, the page's address.
	$harlow_text = wp_strip_all_tags( $harlow_words );
	if ( '' !== $harlow_author ) {
		$harlow_text .= ' — ' . wp_strip_all_tags( $harlow_author );
	}
	$harlow_share = 'https://twitter.com/intent/tweet?text=' . rawurlencode( html_entity_decode( $harlow_text, ENT_QUOTES, 'UTF-8' ) );
	$harlow_user  = ltrim( trim( (string) $attributes['userName'] ), '@' );
	if ( '' !== $harlow_user ) {
		$harlow_share .= '&via=' . rawurlencode( $harlow_user );
	}
	if ( 'current_page' === $attributes['urlType'] ) {
		$harlow_page   = is_singular() ? get_permalink( get_queried_object_id() ) : trailingslashit( home_url( isset( $GLOBALS['wp']->request ) ? (string) $GLOBALS['wp']->request : '' ) );
		$harlow_share .= '&url=' . rawurlencode( (string) $harlow_page );
	} elseif ( 'custom' === $attributes['urlType'] && '' !== trim( (string) $attributes['url'] ) ) {
		$harlow_share .= '&url=' . rawurlencode( harlow_link_url( trim( (string) $attributes['url'] ) ) );
	}
	// X's mark (Font Awesome's x-twitter, as Elementor prints it).
	$harlow_x       = '<svg aria-hidden="true" class="e-font-icon-svg e-fab-x-twitter" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>';
	$harlow_label   = wp_kses_post( (string) $attributes['tweetLabel'] );
	$harlow_button  = '<a href="' . esc_url( $harlow_share ) . '" class="elementor-blockquote__tweet-button" target="_blank">' . "\n";
	$harlow_button .= 'text' !== $harlow_view ? $harlow_x . "\n" : '';
	$harlow_button .= 'icon' === $harlow_view ? '<span class="elementor-screen-only">' . esc_html__( 'Tweet', 'harlow' ) . '</span>' . "\n" : '';
	$harlow_button .= 'icon' !== $harlow_view ? '<span class="elementor-blockquote__tweet-label">' . $harlow_label . '</span>' . "\n" : '';
	$harlow_button .= '</a>' . "\n";
	$harlow_footer .= $harlow_button;
}

// Elementor's classes on the element: the skin, the alignment, the button's view, skin and colour.
$harlow_classes = array( 'elementor-blockquote--skin-' . $harlow_skin );
if ( 'border' !== $harlow_skin ) {
	$harlow_classes[] = 'elementor-blockquote--align-' . $harlow_align;
}
if ( $harlow_tweet ) {
	$harlow_classes[] = 'elementor-blockquote--button-view-' . $harlow_view;
	$harlow_classes[] = 'elementor-blockquote--button-skin-' . $harlow_bskin;
	$harlow_classes[] = 'elementor-blockquote--button-color-' . $harlow_color;
}
$harlow_element            = $attributes;
$harlow_element['classes'] = trim( preg_replace( '/(^|\s)elementor-blockquote--\S+/', '', (string) $attributes['classes'] ) . ' ' . implode( ' ', $harlow_classes ) );

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'blockquote.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<blockquote class="elementor-blockquote">' . "\n"
	. '<p class="elementor-blockquote__content">' . wp_kses_post( $harlow_words ) . '</p>' . "\n"
	. ( '' !== $harlow_footer ? '<footer>' . "\n" . $harlow_footer . '</footer>' . "\n" : '' )
	. '</blockquote>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the link are escaped where they are built; the icon is this theme's own.
