<?php
/**
 * Google Maps (harlow/google-maps): Elementor's Google Maps widget, Google's map of the
 * address at the zoom chosen, in Elementor's embed (no API key: maps.google.com's own).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_address = trim( (string) $attributes['address'] );
if ( '' === $harlow_address ) {
	return;
}
$harlow_zoom = absint( $attributes['zoom'] );
if ( 0 === $harlow_zoom ) {
	$harlow_zoom = 10;
}
$harlow_url = sprintf( 'https://maps.google.com/maps?q=%1$s&t=m&z=%2$d&output=embed&iwloc=near', rawurlencode( $harlow_address ), min( 20, $harlow_zoom ) );

// The map's height on each device (Elementor's responsive height control).
$harlow_unit = in_array( $attributes['heightUnit'], array( 'px', 'vh' ), true ) ? $attributes['heightUnit'] : 'px';
$harlow_vars = '';
foreach ( array(
	'desktop' => 'height',
	'tablet'  => 'heightTablet',
	'mobile'  => 'heightMobile',
) as $harlow_device => $harlow_key ) {
	if ( is_numeric( $attributes[ $harlow_key ] ) ) {
		$harlow_vars .= '--e-google-maps-height-' . $harlow_device . ': ' . max( 0, (float) $attributes[ $harlow_key ] ) . $harlow_unit . '; ';
	}
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'google_maps.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-custom-embed"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( trim( $harlow_vars ) ) . '"' : '' ) . '>' . "\n"
	. '<iframe loading="lazy" src="' . esc_url( $harlow_url ) . '" title="' . esc_attr( $harlow_address ) . '" aria-label="' . esc_attr( $harlow_address ) . '"></iframe>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
