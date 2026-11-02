<?php
/**
 * A progress tracker (harlow/progress-tracker): Elementor Pro's progress tracker widget, a
 * bar (horizontal) or a circle (circular) that fills as the visitor scrolls through the
 * whole page or through the element a selector names (assets/js/widgets/progress-tracker.js,
 * which reads its settings from data-settings, as Elementor's does), with the percentage
 * inside it if asked.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_type      = 'circular' === $attributes['trackerType'] ? 'circular' : 'horizontal';
$harlow_direction = 'rtl' === $attributes['direction'] ? 'rtl' : 'ltr';

// The element's classes: the widget's own when it has none yet.
$harlow_classes            = array_filter( preg_split( '/\s+/', (string) $attributes['classes'] ) );
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-progress-tracker' ), $harlow_classes ), $harlow_classes ) );

// The settings the script reads, over those the element came with.
$harlow_settings            = json_decode( '' !== $attributes['settings'] ? $attributes['settings'] : '{}', true );
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_settings ) ? $harlow_settings : array(),
		array(
			'type'        => $harlow_type,
			'relative_to' => 'selector' === $attributes['relativeTo'] ? 'selector' : 'entire_page',
			'selector'    => (string) $attributes['selector'],
			'direction'   => $harlow_direction,
			'percentage'  => $attributes['percentage'] ? 'yes' : '',
		)
	)
);

$harlow_percentage = $attributes['percentage'] ? '<div class="current-progress-percentage"></div>' : '';
if ( 'circular' === $harlow_type ) {
	// The circle in a 100 x 100 box: the thicker stroke's half inside the box, the
	// progress drawn as a dash as long as the part it has come.
	$harlow_progress = max( 1, min( 20, (float) $attributes['progressWidth'] ) );
	$harlow_track    = max( 0, min( 20, (float) $attributes['trackWidth'] ) );
	$harlow_radius   = 50 - max( $harlow_progress, $harlow_track ) / 2;
	$harlow_length   = round( 2 * M_PI * $harlow_radius, 3 );
	$harlow_inside   = "\n" . '<svg viewBox="0 0 100 100" aria-hidden="true">' . "\n"
		. '<circle class="circle-tracker-background" cx="50" cy="50" r="' . esc_attr( (string) $harlow_radius ) . '" stroke-width="' . esc_attr( (string) $harlow_track ) . '"></circle>' . "\n"
		. '<circle class="current-progress" cx="50" cy="50" r="' . esc_attr( (string) $harlow_radius ) . '" stroke-width="' . esc_attr( (string) $harlow_progress ) . '" stroke-dasharray="' . esc_attr( (string) $harlow_length ) . '" stroke-dashoffset="' . esc_attr( (string) $harlow_length ) . '"></circle>' . "\n"
		. '</svg>' . ( '' !== $harlow_percentage ? "\n" . $harlow_percentage : '' ) . "\n";
} else {
	$harlow_inside = "\n" . '<div class="current-progress">' . ( '' !== $harlow_percentage ? "\n" . $harlow_percentage . "\n" : '' ) . '</div>' . "\n";
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'progress-tracker.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-scrolling-tracker elementor-scrolling-tracker-' . $harlow_type . ' elementor-scrolling-tracker-alignment-' . $harlow_direction . '">'
	. $harlow_inside
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
