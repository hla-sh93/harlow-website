<?php
/**
 * Lengths set per device (blocks/spacer, blocks/flip-box): a length typed with its unit,
 * checked, and the custom properties that carry it for desktop, tablet and mobile, which
 * the widget's stylesheet reads in its media queries (as Elementor writes a responsive
 * control's value per device).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * A length as typed (50 with its unit, 50px, 2.5em, 10vh, 20%), checked.
 *
 * @param mixed  $value The length, or its number.
 * @param string $unit  The unit, when the value has none.
 * @return string The length, or '' when it is not one.
 */
function harlow_spacer_length( $value, $unit = 'px' ) {
	if ( ! is_scalar( $value ) || ! preg_match( '/^\s*(\d+(?:\.\d+)?)\s*(px|em|rem|vh|vw|%)?\s*$/', (string) $value, $m ) ) {
		return '';
	}
	if ( ! empty( $m[2] ) ) {
		$unit = $m[2];
	}
	return $m[1] . ( in_array( $unit, array( 'px', 'em', 'rem', 'vh', 'vw', '%' ), true ) ? $unit : 'px' );
}

/**
 * A length of a block for each device, as custom properties: `<name>`, `<name>-tablet`,
 * `<name>-mobile`, from the attributes `<key>`, `<key>Unit`, `<key>Tablet`,
 * `<key>TabletUnit`, `<key>Mobile` and `<key>MobileUnit`; a device without its own length
 * takes the larger one's (in the stylesheet).
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $key        The attribute's name.
 * @param string              $name       The custom property.
 * @return array<string,string> Property => length, the empty ones left out.
 */
function harlow_spacer_vars( $attributes, $key, $name ) {
	$vars    = array();
	$devices = array(
		''       => '',
		'Tablet' => '-tablet',
		'Mobile' => '-mobile',
	);
	foreach ( $devices as $device => $suffix ) {
		$value = isset( $attributes[ $key . $device ] ) ? $attributes[ $key . $device ] : '';
		$unit  = isset( $attributes[ $key . $device . 'Unit' ] ) ? (string) $attributes[ $key . $device . 'Unit' ] : 'px';
		$value = harlow_spacer_length( $value, $unit );
		if ( '' !== $value ) {
			$vars[ $name . $suffix ] = $value;
		}
	}
	return $vars;
}

/**
 * Custom properties as a style attribute.
 *
 * @param array<string,string> $vars Property => value.
 * @return string The attribute with its leading space, or '' when there is none.
 */
function harlow_spacer_style( $vars ) {
	$css = '';
	foreach ( $vars as $name => $value ) {
		$css .= $name . ':' . $value . ';';
	}
	return '' === $css ? '' : ' style="' . esc_attr( $css ) . '"';
}
