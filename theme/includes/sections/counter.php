<?php
/**
 * A counter (harlow/counter): Elementor's counter widget, a number that counts from its
 * starting number to its ending number when it comes into view
 * (assets/js/widgets/counter.js), between a prefix and a suffix, with a title above, below
 * or beside it.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// The element's classes: the widget's own when it has none yet.
$harlow_classes            = array_filter( preg_split( '/\s+/', (string) $attributes['classes'] ) );
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-counter' ), $harlow_classes ), $harlow_classes ) );

$harlow_number = static function ( $value ) {
	return is_numeric( $value ) ? (string) ( 0 + $value ) : '0';
};
$harlow_from   = $harlow_number( $attributes['startingNumber'] );
$harlow_to     = $harlow_number( $attributes['endingNumber'] );
$harlow_data   = ' data-duration="' . esc_attr( (string) max( 0, (int) $attributes['duration'] ) ) . '" data-to-value="' . esc_attr( $harlow_to ) . '" data-from-value="' . esc_attr( $harlow_from ) . '"';
if ( $attributes['thousandSeparator'] ) {
	$harlow_data .= ' data-delimiter="' . esc_attr( in_array( $attributes['separator'], array( ',', '.', ' ', "'", '_' ), true ) ? $attributes['separator'] : ',' ) . '"';
}

// The title's place: below the number (Elementor's own), above it, before or after it.
$harlow_positions = array(
	'before' => 'column',
	'start'  => 'row',
	'end'    => 'row-reverse',
);
$harlow_direction = isset( $harlow_positions[ $attributes['titlePosition'] ] ) ? ' style="flex-direction: ' . $harlow_positions[ $attributes['titlePosition'] ] . '"' : '';
$harlow_tag       = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'div';
$harlow_title     = '' !== $attributes['title'] ? "\n" . '<' . $harlow_tag . ' class="elementor-counter-title">' . wp_kses_post( $attributes['title'] ) . '</' . $harlow_tag . '>' : '';

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'counter.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-counter"' . $harlow_direction . '>' . $harlow_title . "\n"
	. '<div class="elementor-counter-number-wrapper">' . "\n"
	. '<span class="elementor-counter-number-prefix">' . wp_kses_post( $attributes['prefix'] ) . '</span>' . "\n"
	. '<span class="elementor-counter-number"' . $harlow_data . '>' . esc_html( $harlow_from ) . '</span>' . "\n"
	. '<span class="elementor-counter-number-suffix">' . wp_kses_post( $attributes['suffix'] ) . '</span>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
