<?php
/**
 * A search form (harlow/search-form): Elementor Pro's search form widget, the site's search
 * (?s=) as a field with its button (classic), a field with an icon in it (minimal), or an
 * icon that opens the field over the whole screen (full screen).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_skin   = in_array( $attributes['skin'], array( 'classic', 'minimal', 'full_screen' ), true ) ? $attributes['skin'] : 'classic';
$harlow_button = 'text' === $attributes['buttonType'] ? 'text' : 'icon';
$harlow_icon   = 'arrow' === $attributes['icon'] ? 'arrow' : 'search';
$harlow_label  = esc_html__( 'Search', 'harlow' );
$harlow_input  = 'elementor-search-form-' . sanitize_html_class( '' !== $attributes['element'] ? $attributes['element'] : 'search' );
$harlow_svg    = static function ( $name ) {
	return '<div class="e-font-icon-svg-container">' . harlow_theme_builder_icon( $name ) . '</div>';
};

// The input's size and the toggle's, where they are not Elementor's (50px, 33px), as the
// custom properties the widget's stylesheet reads.
$harlow_vars = '';
if ( 50 !== (int) $attributes['size'] ) {
	$harlow_vars .= '--harlow-search-form-size:' . max( 20, min( 200, (int) $attributes['size'] ) ) . 'px;';
}
if ( 33 !== (int) $attributes['toggleSize'] ) {
	$harlow_vars .= '--e-search-form-toggle-size:' . max( 10, min( 200, (int) $attributes['toggleSize'] ) ) . 'px;';
}

$harlow_form = '<form class="elementor-search-form" role="search" action="' . esc_url( home_url( '/' ) ) . '" method="get"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( $harlow_vars ) . '"' : '' ) . '>' . "\n";
if ( 'full_screen' === $harlow_skin ) {
	$harlow_form .= '<div class="elementor-search-form__toggle" role="button" tabindex="0" aria-label="' . $harlow_label . '">' . "\n"
		. $harlow_svg( 'search' ) . "\n"
		. '<span class="elementor-screen-only">' . $harlow_label . '</span>' . "\n"
		. '</div>' . "\n";
}
$harlow_form .= '<div class="elementor-search-form__container">' . "\n"
	. '<label class="elementor-screen-only" for="' . esc_attr( $harlow_input ) . '">' . $harlow_label . '</label>' . "\n";
if ( 'minimal' === $harlow_skin ) {
	$harlow_form .= '<div class="elementor-search-form__icon">' . "\n"
		. $harlow_svg( 'search' ) . "\n"
		. '<span class="elementor-screen-only">' . $harlow_label . '</span>' . "\n"
		. '</div>' . "\n";
}
$harlow_form .= '<input id="' . esc_attr( $harlow_input ) . '" placeholder="' . esc_attr( $attributes['placeholder'] ) . '" class="elementor-search-form__input" type="search" name="s" value="' . esc_attr( get_search_query() ) . '">' . "\n";
if ( 'classic' === $harlow_skin ) {
	$harlow_form .= '<button class="elementor-search-form__submit" type="submit" aria-label="' . $harlow_label . '">' . "\n"
		. ( 'icon' === $harlow_button
			? $harlow_svg( 'arrow' === $harlow_icon ? ( is_rtl() ? 'arrow-left' : 'arrow-right' ) : 'search' ) . "\n" . '<span class="elementor-screen-only">' . $harlow_label . '</span>' . "\n"
			: esc_html( $attributes['buttonText'] ) . "\n" )
		. '</button>' . "\n";
}
if ( 'full_screen' === $harlow_skin ) {
	$harlow_close = esc_attr__( 'Close this search box.', 'harlow' );
	$harlow_form .= '<div class="dialog-lightbox-close-button dialog-close-button" role="button" tabindex="0" aria-label="' . $harlow_close . '">' . "\n"
		. harlow_theme_builder_icon( 'close' ) . "\n"
		. '<span class="elementor-screen-only">' . $harlow_close . '</span>' . "\n"
		. '</div>' . "\n";
}
$harlow_form .= '</div>' . "\n" . '</form>';

$harlow_extra = array( 'elementor-search-form--skin-' . $harlow_skin );
if ( 'classic' === $harlow_skin ) {
	$harlow_extra[] = 'elementor-search-form--button-type-' . $harlow_button;
	if ( 'icon' === $harlow_button ) {
		$harlow_extra[] = 'elementor-search-form--icon-' . $harlow_icon;
	}
}
$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'search-form', $harlow_extra ), 'widget', 'search-form.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n" . $harlow_form . "\n" . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
