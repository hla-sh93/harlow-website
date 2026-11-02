<?php
/**
 * An icon box (harlow/icon-box): Elementor's icon box widget, an icon with a title and
 * words, the icon above them, at their left or at their right. The icon's view (plain,
 * stacked on a shape, framed by one), its shape and its position are Elementor's classes
 * on the element. With a link, the icon and the title lead to it.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_view     = in_array( $attributes['view'], array( 'default', 'stacked', 'framed' ), true ) ? $attributes['view'] : 'default';
$harlow_shape    = in_array( $attributes['shape'], array( 'circle', 'rounded', 'square' ), true ) ? $attributes['shape'] : 'circle';
$harlow_position = in_array( $attributes['position'], array( 'top', 'left', 'right' ), true ) ? $attributes['position'] : 'top';
$harlow_valign   = in_array( $attributes['verticalAlign'], array( 'top', 'middle', 'bottom' ), true ) ? $attributes['verticalAlign'] : 'top';
$harlow_tag      = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'h3';
$harlow_title    = trim( (string) $attributes['title'] );
$harlow_words    = trim( (string) $attributes['description'] );
$harlow_svg      = harlow_icon( (string) $attributes['icon'] );
$harlow_link     = '' !== $attributes['link'] ? harlow_link_attributes( $attributes ) : '';
$harlow_link_tag = '' !== $harlow_link ? 'a' : 'span';

$harlow_inner = '';
if ( '' !== $harlow_svg ) {
	$harlow_inner .= '<div class="elementor-icon-box-icon">' . "\n"
		. '<' . $harlow_link_tag . $harlow_link . ' class="elementor-icon elementor-animation-">' . "\n"
		. $harlow_svg . "\n"
		. '</' . $harlow_link_tag . '>' . "\n"
		. '</div>' . "\n";
}
if ( '' !== $harlow_title || '' !== $harlow_words ) {
	$harlow_inner .= '<div class="elementor-icon-box-content">' . "\n";
	if ( '' !== $harlow_title ) {
		$harlow_inner .= '<' . $harlow_tag . ' class="elementor-icon-box-title">' . "\n"
			. '<' . $harlow_link_tag . $harlow_link . '>' . wp_kses_post( $harlow_title ) . '</' . $harlow_link_tag . '>' . "\n"
			. '</' . $harlow_tag . '>' . "\n";
	}
	if ( '' !== $harlow_words ) {
		$harlow_inner .= '<p class="elementor-icon-box-description">' . wp_kses_post( $harlow_words ) . '</p>' . "\n";
	}
	$harlow_inner .= '</div>' . "\n";
}

// Elementor's classes on the element: the icon's view and shape, its position, the content's vertical alignment.
$harlow_classes = array( 'elementor-view-' . $harlow_view );
if ( 'default' !== $harlow_view ) {
	$harlow_classes[] = 'elementor-shape-' . $harlow_shape;
}
$harlow_classes[] = 'elementor-position-' . $harlow_position;
if ( 'top' !== $harlow_position ) {
	$harlow_classes[] = 'elementor-vertical-align-' . $harlow_valign;
}
$harlow_element            = $attributes;
$harlow_element['classes'] = trim( preg_replace( '/(^|\s)elementor-(view|shape|position|vertical-align)-\S+/', '', (string) $attributes['classes'] ) . ' ' . implode( ' ', $harlow_classes ) );

// Without an icon, a title and words, Elementor prints nothing inside the element.
$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'icon-box.default' ) . '>';
if ( '' !== $harlow_inner ) {
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n"
		. '<div class="elementor-icon-box-wrapper">' . "\n" . $harlow_inner . '</div>' . "\n"
		. '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the link, the icon and the words are escaped where they are built.
