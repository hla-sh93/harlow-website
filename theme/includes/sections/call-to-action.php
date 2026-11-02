<?php
/**
 * A call to action (harlow/call-to-action): Elementor Pro's call to action widget, a
 * picture with a graphic (a picture or an icon), a title, words and a button: beside the
 * picture (the classic skin: the picture above, at the left or at the right) or over it (the
 * cover skin, the content animated on hover). A ribbon in a top corner; the picture zooms or
 * moves on hover. The link is the button's or the whole box's.
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

$harlow_tags        = array( 'h2', 'h1', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' );
$harlow_skin        = $harlow_pick( $attributes['skin'], array( 'classic', 'cover' ) );
$harlow_layout      = $harlow_pick( $attributes['layout'], array( '', 'left', 'above', 'right' ) );
$harlow_graphic     = $harlow_pick( $attributes['graphic'], array( 'none', 'image', 'icon' ) );
$harlow_view        = $harlow_pick( $attributes['iconView'], array( 'default', 'stacked', 'framed' ) );
$harlow_shape       = $harlow_pick( $attributes['iconShape'], array( 'circle', 'rounded', 'square' ) );
$harlow_title_tag   = $harlow_pick( $attributes['titleTag'], $harlow_tags );
$harlow_words_tag   = $harlow_pick( $attributes['descriptionTag'], array( 'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ) );
$harlow_size        = $harlow_pick( $attributes['buttonSize'], array( 'sm', 'xs', 'md', 'lg', 'xl' ) );
$harlow_ribbon_side = $harlow_pick( $attributes['ribbonPosition'], array( 'right', 'left' ) );
$harlow_valign      = $harlow_pick( $attributes['verticalPosition'], array( 'middle', 'top', 'bottom' ) );
$harlow_animation   = $harlow_pick( $attributes['contentAnimation'], array( '', 'grow', 'shrink', 'enter-from-right', 'enter-from-left', 'enter-from-top', 'enter-from-bottom', 'enter-zoom-in', 'enter-zoom-out', 'fade-in', 'move-right', 'move-left', 'move-up', 'move-down', 'exit-to-right', 'exit-to-left', 'exit-to-top', 'exit-to-bottom', 'exit-zoom-in', 'exit-zoom-out', 'fade-out' ) );
$harlow_transform   = $harlow_pick( $attributes['bgTransform'], array( '', 'zoom-in', 'zoom-out', 'move-left', 'move-right', 'move-up', 'move-down' ) );
$harlow_title       = trim( (string) $attributes['title'] );
$harlow_words       = trim( (string) $attributes['description'] );
$harlow_button      = trim( (string) $attributes['button'] );
$harlow_ribbon      = trim( (string) $attributes['ribbonTitle'] );

// The content's animation (the cover skin's), on each item of the content.
$harlow_animated = 'cover' === $harlow_skin && '' !== $harlow_animation ? ' elementor-animated-item--' . $harlow_animation : '';

// The link: the button's, or the whole box's (the button then a span).
$harlow_wrapper_tag = 'div';
$harlow_button_tag  = 'a';
$harlow_box_link    = '';
$harlow_button_link = '';
if ( '' !== $attributes['link'] ) {
	if ( 'box' === $attributes['linkClick'] ) {
		$harlow_wrapper_tag = 'a';
		$harlow_button_tag  = 'span';
		$harlow_box_link    = harlow_link_attributes( $attributes );
	} else {
		$harlow_button_link = harlow_link_attributes( $attributes );
	}
}

$harlow_inner = '';
// The picture, a background: always over the content in the cover skin, optional in the classic one.
if ( 'cover' === $harlow_skin || $attributes['hasImage'] ) {
	$harlow_alt    = $attributes['image'] ? (string) get_post_meta( (int) $attributes['image'], '_wp_attachment_image_alt', true ) : '';
	$harlow_inner .= '<div class="elementor-cta__bg-wrapper">' . "\n"
		. '<div class="elementor-cta__bg elementor-bg" style="' . esc_attr( 'background-image: url("' . harlow_image_box_picture_url( $attributes['image'], $attributes['imageSize'] ) . '");' ) . '" role="img" aria-label="' . esc_attr( $harlow_alt ) . '"></div>' . "\n"
		. '<div class="elementor-cta__bg-overlay"></div>' . "\n"
		. '</div>' . "\n";
}

// The content: the graphic, the title, the words, the button.
$harlow_items = '';
if ( 'image' === $harlow_graphic ) {
	$harlow_items .= '<div class="elementor-content-item elementor-cta__content-item elementor-cta__image' . $harlow_animated . '">' . "\n"
		. harlow_image_box_picture( $attributes['graphicImage'], $attributes['graphicImageSize'] ) . "\n"
		. '</div>' . "\n";
} elseif ( 'icon' === $harlow_graphic && '' !== $attributes['icon'] ) {
	$harlow_items .= '<div class="elementor-content-item elementor-cta__content-item elementor-icon-wrapper elementor-cta__icon elementor-view-' . $harlow_view . ( 'default' !== $harlow_view ? ' elementor-shape-' . $harlow_shape : '' ) . $harlow_animated . '">' . "\n"
		. '<div class="elementor-icon">' . "\n" . harlow_icon( $attributes['icon'] ) . "\n" . '</div>' . "\n"
		. '</div>' . "\n";
}
if ( '' !== $harlow_title ) {
	$harlow_items .= '<' . $harlow_title_tag . ' class="elementor-cta__title elementor-cta__content-item elementor-content-item' . $harlow_animated . '">' . wp_kses_post( $harlow_title ) . '</' . $harlow_title_tag . '>' . "\n";
}
if ( '' !== $harlow_words ) {
	$harlow_items .= '<' . $harlow_words_tag . ' class="elementor-cta__description elementor-cta__content-item elementor-content-item' . $harlow_animated . '">' . wp_kses_post( $harlow_words ) . '</' . $harlow_words_tag . '>' . "\n";
}
if ( '' !== $harlow_button ) {
	$harlow_items .= '<div class="elementor-cta__button-wrapper elementor-cta__content-item elementor-content-item' . $harlow_animated . '">' . "\n"
		. '<' . $harlow_button_tag . ' class="elementor-cta__button elementor-button elementor-size-' . $harlow_size . '"' . $harlow_button_link . '>' . wp_kses_post( $harlow_button ) . '</' . $harlow_button_tag . '>' . "\n"
		. '</div>' . "\n";
}
if ( '' !== $harlow_items ) {
	$harlow_inner .= '<div class="elementor-cta__content">' . "\n" . $harlow_items . '</div>' . "\n";
}

// The ribbon.
if ( '' !== $harlow_ribbon ) {
	$harlow_inner .= '<div class="elementor-ribbon elementor-ribbon-' . $harlow_ribbon_side . '">' . "\n"
		. '<div class="elementor-ribbon-inner">' . esc_html( $harlow_ribbon ) . '</div>' . "\n"
		. '</div>' . "\n";
}

// Elementor's classes on the element: the skin, the picture's place, the content's vertical position, the picture's hover effect.
$harlow_classes = array( 'elementor-cta--skin-' . $harlow_skin, 'elementor-animated-content' );
if ( 'classic' === $harlow_skin && '' !== $harlow_layout ) {
	$harlow_classes[] = 'elementor-cta--layout-image-' . $harlow_layout;
}
$harlow_classes[] = 'elementor-cta--valign-' . $harlow_valign;
if ( '' !== $harlow_transform ) {
	$harlow_classes[] = 'elementor-bg-transform';
	$harlow_classes[] = 'elementor-bg-transform-' . $harlow_transform;
}
$harlow_element            = $attributes;
$harlow_element['classes'] = trim( preg_replace( '/(^|\s)(elementor-cta--\S+|elementor-animated-content|elementor-bg-transform\S*)/', '', (string) $attributes['classes'] ) . ' ' . implode( ' ', $harlow_classes ) );

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'call-to-action.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<' . $harlow_wrapper_tag . ' class="elementor-cta"' . $harlow_box_link . '>' . "\n"
	. $harlow_inner
	. '</' . $harlow_wrapper_tag . '>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the links, the pictures, the icon and the words are escaped where they are built.
