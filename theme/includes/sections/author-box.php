<?php
/**
 * The author box (harlow/author-box): Elementor Pro's author box widget, the picture,
 * name, biography and a button to the posts of the author of the item the page shows (a
 * sample post's where there is none), or of an author typed in.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_author = harlow_author_box_author( $attributes );
$harlow_url    = '';
if ( 'website' === $attributes['linkTo'] ) {
	$harlow_url = $harlow_author['website'];
} elseif ( 'posts_archive' === $attributes['linkTo'] ) {
	$harlow_url = $harlow_author['archive'];
}
$harlow_tag  = '' !== $harlow_url ? 'a' : 'div';
$harlow_href = '' !== $harlow_url ? ' href="' . esc_url( $harlow_url ) . '"' : '';
$harlow_name = in_array( $attributes['nameTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['nameTag'] : 'h4';
$harlow_box  = '';

if ( $attributes['avatar'] && '' !== $harlow_author['avatar'] ) {
	$harlow_box .= '<' . $harlow_tag . $harlow_href . ' class="elementor-author-box__avatar">' . "\n"
		. '<img src="' . esc_url( $harlow_author['avatar'] ) . '" alt="' . esc_attr( $harlow_author['name'] ) . '" loading="lazy">' . "\n"
		. '</' . $harlow_tag . '>' . "\n";
}
$harlow_box .= '<div class="elementor-author-box__text">' . "\n";
if ( $attributes['name'] && '' !== $harlow_author['name'] ) {
	$harlow_box .= '<' . $harlow_tag . $harlow_href . '>' . "\n"
		. '<' . $harlow_name . ' class="elementor-author-box__name">' . esc_html( $harlow_author['name'] ) . '</' . $harlow_name . '>' . "\n"
		. '</' . $harlow_tag . '>' . "\n";
}
// In the editor an author with no biography yet shows where it goes, so it can be styled.
if ( $attributes['bio'] && '' === trim( $harlow_author['bio'] ) && wp_is_serving_rest_request() ) {
	$harlow_author['bio'] = esc_html__( 'The author’s biography (Users → Profile → Biographical Info).', 'harlow' );
}
if ( $attributes['bio'] && '' !== trim( $harlow_author['bio'] ) ) {
	$harlow_box .= '<div class="elementor-author-box__bio">' . "\n" . wp_kses_post( $harlow_author['bio'] ) . "\n" . '</div>' . "\n";
}
if ( $attributes['button'] && '' !== $harlow_author['archive'] ) {
	$harlow_box .= '<a class="elementor-author-box__button elementor-button elementor-size-xs" href="' . esc_url( $harlow_author['archive'] ) . '">' . "\n"
		. esc_html( $attributes['buttonText'] ) . "\n"
		. '</a>' . "\n";
}
$harlow_box .= '</div>';

$harlow_extra = array();
foreach ( array( 'avatar', 'name', 'bio' ) as $harlow_part ) {
	if ( $attributes[ $harlow_part ] ) {
		$harlow_extra[] = 'elementor-author-box--' . ( 'bio' === $harlow_part ? 'biography' : $harlow_part ) . '-yes';
	}
}
if ( $attributes['button'] ) {
	$harlow_extra[] = 'elementor-author-box--link-yes';
}
if ( in_array( $attributes['layout'], array( 'left', 'above', 'right' ), true ) ) {
	$harlow_extra[] = 'elementor-author-box--layout-image-' . $attributes['layout'];
}
if ( in_array( $attributes['align'], array( 'left', 'center', 'right' ), true ) ) {
	$harlow_extra[] = 'elementor-author-box--align-' . $attributes['align'];
}

$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'author-box', $harlow_extra ), 'widget', 'author-box.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-author-box">' . "\n" . $harlow_box . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
