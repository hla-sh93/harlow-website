<?php
/**
 * A flip box (harlow/flip-box): Elementor Pro's flip box widget, a box with a front (a
 * picture or an icon, a title, words) and a back (a title, words, a button). Hovered,
 * focused from the keyboard or tapped (assets/js/widgets/flip-box.js), it turns to its
 * back by the effect and direction chosen (Elementor's classes on the element). Its height
 * and corner radius of each device are custom properties of the element
 * (harlow_spacer_vars()). The link is the button's or the whole back's.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_pick = static function ( $value, $allowed ) {
	return in_array( $value, $allowed, true ) ? $value : $allowed[0];
};

$harlow_tags      = array( 'h3', 'h1', 'h2', 'h4', 'h5', 'h6', 'div', 'span', 'p' );
$harlow_graphic   = $harlow_pick( $attributes['graphic'], array( 'icon', 'image', 'none' ) );
$harlow_view      = $harlow_pick( $attributes['iconView'], array( 'default', 'stacked', 'framed' ) );
$harlow_shape     = $harlow_pick( $attributes['iconShape'], array( 'circle', 'rounded', 'square' ) );
$harlow_tag_front = $harlow_pick( $attributes['titleTagFront'], $harlow_tags );
$harlow_tag_back  = $harlow_pick( $attributes['titleTagBack'], $harlow_tags );
$harlow_size      = $harlow_pick( $attributes['buttonSize'], array( 'sm', 'xs', 'md', 'lg', 'xl' ) );
$harlow_effect    = $harlow_pick( $attributes['flipEffect'], array( 'flip', 'slide', 'push', 'zoom-in', 'zoom-out', 'fade' ) );
$harlow_direction = $harlow_pick( $attributes['flipDirection'], array( 'up', 'down', 'left', 'right' ) );

// The link: the button's, or the whole back's (the button then a span).
$harlow_back_tag    = 'div';
$harlow_button_tag  = 'a';
$harlow_back_link   = '';
$harlow_button_link = '';
if ( '' !== $attributes['link'] ) {
	if ( 'box' === $attributes['linkClick'] ) {
		$harlow_back_tag   = 'a';
		$harlow_button_tag = 'span';
		$harlow_back_link  = harlow_link_attributes( $attributes );
	} else {
		$harlow_button_link = harlow_link_attributes( $attributes );
	}
}

// The front: the graphic, the title, the words.
$harlow_front = '';
if ( 'image' === $harlow_graphic ) {
	$harlow_front .= '<div class="elementor-flip-box__image">' . "\n"
		. harlow_image_box_picture( $attributes['image'], $attributes['imageSize'] ) . "\n"
		. '</div>' . "\n";
} elseif ( 'icon' === $harlow_graphic && '' !== $attributes['icon'] ) {
	$harlow_front .= '<div class="elementor-icon-wrapper elementor-view-' . $harlow_view . ( 'default' !== $harlow_view ? ' elementor-shape-' . $harlow_shape : '' ) . '">' . "\n"
		. '<div class="elementor-icon">' . "\n" . harlow_icon( $attributes['icon'] ) . "\n" . '</div>' . "\n"
		. '</div>' . "\n";
}
if ( '' !== trim( (string) $attributes['titleFront'] ) ) {
	$harlow_front .= '<' . $harlow_tag_front . ' class="elementor-flip-box__layer__title">' . wp_kses_post( trim( (string) $attributes['titleFront'] ) ) . '</' . $harlow_tag_front . '>' . "\n";
}
if ( '' !== trim( (string) $attributes['descriptionFront'] ) ) {
	$harlow_front .= '<div class="elementor-flip-box__layer__description">' . wp_kses_post( trim( (string) $attributes['descriptionFront'] ) ) . '</div>' . "\n";
}

// The back: the title, the words, the button.
$harlow_back = '';
if ( '' !== trim( (string) $attributes['titleBack'] ) ) {
	$harlow_back .= '<' . $harlow_tag_back . ' class="elementor-flip-box__layer__title">' . wp_kses_post( trim( (string) $attributes['titleBack'] ) ) . '</' . $harlow_tag_back . '>' . "\n";
}
if ( '' !== trim( (string) $attributes['descriptionBack'] ) ) {
	$harlow_back .= '<div class="elementor-flip-box__layer__description">' . wp_kses_post( trim( (string) $attributes['descriptionBack'] ) ) . '</div>' . "\n";
}
if ( '' !== trim( (string) $attributes['button'] ) ) {
	$harlow_back .= '<' . $harlow_button_tag . ' class="elementor-flip-box__button elementor-button elementor-size-' . $harlow_size . '"' . $harlow_button_link . '>' . wp_kses_post( trim( (string) $attributes['button'] ) ) . '</' . $harlow_button_tag . '>' . "\n";
}

// Elementor's classes on the element: the effect, its direction, the 3D depth.
$harlow_classes = array( 'elementor-flip-box--effect-' . $harlow_effect, 'elementor-flip-box--direction-' . $harlow_direction );
if ( $attributes['flip3d'] ) {
	$harlow_classes[] = 'elementor-flip-box--3d';
}
$harlow_element            = $attributes;
$harlow_element['classes'] = trim( preg_replace( '/(^|\s)elementor-flip-box--\S+/', '', (string) $attributes['classes'] ) . ' ' . implode( ' ', $harlow_classes ) );
$harlow_vars               = array_merge(
	harlow_spacer_vars( $attributes, 'height', '--harlow-flip-height' ),
	harlow_spacer_vars( $attributes, 'radius', '--harlow-flip-radius' )
);

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'flip-box.default' ) . harlow_spacer_style( $harlow_vars ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-flip-box" tabindex="0">' . "\n"
	. '<div class="elementor-flip-box__layer elementor-flip-box__front">' . "\n"
	. '<div class="elementor-flip-box__layer__overlay">' . "\n"
	. '<div class="elementor-flip-box__layer__inner">' . "\n"
	. $harlow_front
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '<' . $harlow_back_tag . ' class="elementor-flip-box__layer elementor-flip-box__back"' . $harlow_back_link . '>' . "\n"
	. '<div class="elementor-flip-box__layer__overlay">' . "\n"
	. '<div class="elementor-flip-box__layer__inner">' . "\n"
	. $harlow_back
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</' . $harlow_back_tag . '>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the links, the picture, the icon and the words are escaped where they are built.
