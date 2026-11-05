<?php
/**
 * The history slider (harlow/history): live's own slider of the home page, which Elementor
 * kept as an HTML widget written by hand, printed from its milestones, element for element
 * as that markup (assets/js/history-slider.js runs it, components.css draws it). Each
 * milestone has its year, its title in two colours, its words and, when the owner chooses
 * them, its own pictures (else the design's for its place: .history_slide_<n>).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_items  = is_array( $attributes['items'] ) ? array_values( $attributes['items'] ) : array();
$harlow_field  = static function ( $item, $key ) {
	return is_array( $item ) && isset( $item[ $key ] ) && is_scalar( $item[ $key ] ) ? (string) $item[ $key ] : '';
};
$harlow_icon   = $attributes['labelPicture'] ? wp_get_attachment_image_url( (int) $attributes['labelPicture'], 'full' ) : '';
$harlow_icon   = $harlow_icon ? $harlow_icon : ( '' !== $attributes['labelImage'] ? harlow_link_url( $attributes['labelImage'] ) : '' );
$harlow_label  = ( $harlow_icon ? ' <img decoding="async" src="' . esc_url( $harlow_icon ) . '" alt="">' : '' )
	. ' <span>' . esc_html( $attributes['label'] ) . '</span> </div>';
$harlow_slides = '';
$harlow_thumbs = '';
foreach ( $harlow_items as $harlow_n => $harlow_item ) {
	$harlow_first = 0 === $harlow_n;
	// The owner's pictures of this milestone: on every width, and its own on phones
	// (modules.css reads them).
	$harlow_vars = '';
	foreach ( array(
		'picture'       => '--hl-slide-picture',
		'pictureMobile' => '--hl-slide-picture-mobile',
	) as $harlow_key => $harlow_var ) {
		$harlow_url = (int) $harlow_field( $harlow_item, $harlow_key ) ? wp_get_attachment_image_url( (int) $harlow_field( $harlow_item, $harlow_key ), 'full' ) : '';
		if ( $harlow_url ) {
			$harlow_vars .= $harlow_var . ': url("' . esc_url( $harlow_url ) . '");';
		}
	}
	$harlow_slides .= ' <div class="history_slide history_slide_' . $harlow_n . '"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( $harlow_vars ) . '"' : '' ) . '>'
		. ' <div class="history_slide_content"> <div class="milestone_wrapper' . ( $harlow_first ? ' active-content' : '' ) . '">' . $harlow_label
		. ' <div class="slide_title_wrapper"> <p class="' . ( $harlow_first ? 'active-content' : '' ) . '"> ' . esc_html( $harlow_field( $harlow_item, 'title' ) )
		. ' <span style="color: rgb(106, 218, 219)">' . esc_html( $harlow_field( $harlow_item, 'highlight' ) ) . '</span> </p>'
		. ' <p class="slide_text' . ( $harlow_first ? ' active-content' : '' ) . '">' . esc_html( $harlow_field( $harlow_item, 'text' ) ) . '</p>'
		. ' </div> </div> </div>';
	// The timeline's years: the first shown; live's markup marks the second `active` too.
	$harlow_mark    = $harlow_first ? ' active-thumb' : ( 1 === $harlow_n ? ' active' : '' );
	$harlow_thumbs .= ' <div class="thumb-wrapper' . $harlow_mark . '"> <span>' . esc_html( $harlow_field( $harlow_item, 'year' ) ) . '</span> <span class="thumb"></span> </div>';
}
$harlow_every  = (float) $attributes['interval'];
$harlow_slider = '<div id="history-slider"' . ( $harlow_every > 0 && 9.0 !== $harlow_every ? ' data-interval="' . esc_attr( (string) $harlow_every ) . '"' : '' ) . '>'
	. $harlow_slides
	. ' <div class="navigation-wrapper"> <div class="connector-wrapper"> <span class="connector"></span> </div> <div class="slide-nav">' . $harlow_thumbs . ' </div> </div> </div>';

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'html.default', 'history' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n" . $harlow_slider . "\n" . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped where it is built.
