<?php
/**
 * A price table (harlow/price-table): Elementor Pro's price table widget, a header (title
 * and description), the price (currency symbol before or after, the fractional part
 * raised, an original price struck through on sale, the period beside or below), the
 * features with their icons, a footer (a button and words under it), and a ribbon.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_element = $attributes;
if ( '' === trim( $harlow_element['classes'] ) ) {
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-price-table';
}

$harlow_tag      = in_array( $attributes['headingTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['headingTag'] : 'h3';
$harlow_heading  = trim( (string) $attributes['heading'] );
$harlow_sub      = trim( (string) $attributes['subHeading'] );
$harlow_symbol   = harlow_price_table_symbol( $attributes['currencySymbol'], $attributes['currencySymbolCustom'] );
$harlow_position = 'after' === $attributes['currencyPosition'] ? 'after' : 'before';
$harlow_format   = ',' === $attributes['currencyFormat'] ? ',' : '.';
$harlow_price    = explode( $harlow_format, (string) $attributes['price'] );
$harlow_integer  = $harlow_price[0];
$harlow_fraction = 2 === count( $harlow_price ) ? $harlow_price[1] : '';
$harlow_period   = trim( (string) $attributes['period'] );
$harlow_beside   = 'beside' === $attributes['periodPosition'];

// The currency symbol at its place (before or after the price).
$harlow_currency    = static function ( $place ) use ( $harlow_symbol, $harlow_position ) {
	return '' !== $harlow_symbol && $place === $harlow_position
		? '<span class="elementor-price-table__currency elementor-currency--' . $place . '">' . esc_html( $harlow_symbol ) . '</span>'
		: '';
};
$harlow_period_html = '<span class="elementor-price-table__period elementor-typo-excluded">' . wp_kses_post( $harlow_period ) . '</span>';

$harlow_inner = '<div class="elementor-price-table">' . "\n";
if ( '' !== $harlow_heading || '' !== $harlow_sub ) {
	$harlow_inner .= '<div class="elementor-price-table__header">' . "\n"
		. ( '' !== $harlow_heading ? '<' . $harlow_tag . ' class="elementor-price-table__heading">' . "\n" . wp_kses_post( $harlow_heading ) . "\n" . '</' . $harlow_tag . '>' . "\n" : '' )
		. ( '' !== $harlow_sub ? '<span class="elementor-price-table__subheading">' . "\n" . wp_kses_post( $harlow_sub ) . "\n" . '</span>' . "\n" : '' )
		. '</div>' . "\n";
}

$harlow_inner .= '<div class="elementor-price-table__price">' . "\n";
if ( $attributes['sale'] && '' !== trim( (string) $attributes['originalPrice'] ) ) {
	$harlow_inner .= '<div class="elementor-price-table__original-price elementor-typo-excluded">'
		. $harlow_currency( 'before' ) . esc_html( $attributes['originalPrice'] ) . $harlow_currency( 'after' )
		. '</div>' . "\n";
}
if ( is_numeric( $harlow_integer ) ) {
	$harlow_inner .= $harlow_currency( 'before' );
}
$harlow_inner .= '<span class="elementor-price-table__integer-part">' . "\n" . esc_html( $harlow_integer ) . "\n" . '</span>' . "\n";
if ( '' !== $harlow_fraction || ( '' !== $harlow_period && $harlow_beside ) ) {
	$harlow_inner .= '<div class="elementor-price-table__after-price">' . "\n"
		. '<span class="elementor-price-table__fractional-part">' . "\n" . esc_html( $harlow_fraction ) . "\n" . '</span>' . "\n"
		. ( '' !== $harlow_period && $harlow_beside ? $harlow_period_html . "\n" : '' )
		. '</div>' . "\n";
}
if ( is_numeric( $harlow_integer ) ) {
	$harlow_inner .= $harlow_currency( 'after' );
}
if ( '' !== $harlow_period && ! $harlow_beside ) {
	$harlow_inner .= $harlow_period_html . "\n";
}
$harlow_inner .= '</div>' . "\n";

$harlow_features = is_array( $attributes['features'] ) ? array_values( array_filter( $attributes['features'], 'is_array' ) ) : array();
if ( $harlow_features ) {
	$harlow_inner .= '<ul class="elementor-price-table__features-list">' . "\n";
	foreach ( $harlow_features as $harlow_feature ) {
		$harlow_feature = wp_parse_args(
			$harlow_feature,
			array(
				'id'        => '',
				'text'      => '',
				'icon'      => '',
				'iconColor' => '',
			)
		);
		$harlow_colour  = harlow_price_table_colour( $harlow_feature['iconColor'] );
		$harlow_text    = trim( (string) $harlow_feature['text'] );
		$harlow_id      = sanitize_html_class( (string) $harlow_feature['id'] );
		$harlow_inner  .= '<li' . ( '' !== $harlow_id ? ' class="elementor-repeater-item-' . esc_attr( $harlow_id ) . '"' : '' )
			. ( '' !== $harlow_colour ? ' style="' . esc_attr( '--e-price-table-feature-icon-color: ' . $harlow_colour ) . '"' : '' ) . '>' . "\n"
			. '<div class="elementor-price-table__feature-inner">' . "\n"
			. ( '' !== trim( (string) $harlow_feature['icon'] ) ? harlow_icon( $harlow_feature['icon'] ) . "\n" : '' )
			. ( '' !== $harlow_text ? '<span>' . "\n" . wp_kses_post( $harlow_text ) . "\n" . '</span>' . "\n" : '&nbsp;' . "\n" )
			. '</div>' . "\n"
			. '</li>' . "\n";
	}
	$harlow_inner .= '</ul>' . "\n";
}

$harlow_button = trim( (string) $attributes['buttonText'] );
$harlow_info   = trim( (string) $attributes['footerInfo'] );
if ( '' !== $harlow_button || '' !== $harlow_info ) {
	$harlow_size   = in_array( $attributes['buttonSize'], array( 'xs', 'sm', 'md', 'lg', 'xl' ), true ) ? $attributes['buttonSize'] : 'md';
	$harlow_inner .= '<div class="elementor-price-table__footer">' . "\n"
		. ( '' !== $harlow_button ? '<a class="elementor-price-table__button elementor-button elementor-size-' . $harlow_size . '"' . ( '' !== $attributes['link'] ? harlow_link_attributes( $attributes ) : '' ) . '>' . wp_kses_post( $harlow_button ) . '</a>' . "\n" : '' )
		. ( '' !== $harlow_info ? '<div class="elementor-price-table__additional_info">' . wp_kses_post( $harlow_info ) . '</div>' . "\n" : '' )
		. '</div>' . "\n";
}
$harlow_inner .= '</div>' . "\n";

$harlow_ribbon = trim( (string) $attributes['ribbonTitle'] );
if ( $attributes['showRibbon'] && '' !== $harlow_ribbon ) {
	$harlow_inner .= '<div class="elementor-price-table__ribbon elementor-ribbon-' . ( 'left' === $attributes['ribbonPosition'] ? 'left' : 'right' ) . '">' . "\n"
		. '<div class="elementor-price-table__ribbon-inner">' . "\n" . wp_kses_post( $harlow_ribbon ) . "\n" . '</div>' . "\n"
		. '</div>' . "\n";
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'price-table.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the icons are escaped where they are built.
