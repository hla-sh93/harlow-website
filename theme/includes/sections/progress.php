<?php
/**
 * A progress bar (harlow/progress): Elementor's progress bar widget, a title above a bar
 * that fills to its percentage when it comes into view (assets/js/widgets/progress.js),
 * with words and the percentage inside it. Like Elementor's, it prints nothing without a
 * title and a percentage.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_percent = is_numeric( $attributes['percent'] ) ? min( 100, max( 0, 0 + $attributes['percent'] ) ) : 0;
if ( '' === $attributes['title'] && ! $harlow_percent ) {
	return;
}

// The element's classes: the widget's own when it has none yet.
$harlow_classes            = array_filter( preg_split( '/\s+/', (string) $attributes['classes'] ) );
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-progress' ), $harlow_classes ), $harlow_classes ) );

$harlow_bar_id  = 'elementor-progress-bar-' . $attributes['element'];
$harlow_tag     = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'span';
$harlow_type    = in_array( $attributes['progressType'], array( 'info', 'success', 'warning', 'danger' ), true ) ? ' progress-' . $attributes['progressType'] : '';
$harlow_title   = '';
$harlow_wrapper = ' class="elementor-progress-wrapper' . $harlow_type . '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' . esc_attr( (string) $harlow_percent ) . '"';
if ( '' !== $attributes['title'] ) {
	$harlow_title    = '<' . $harlow_tag . ' class="elementor-title" id="' . esc_attr( $harlow_bar_id ) . '">' . wp_kses_post( $attributes['title'] ) . '</' . $harlow_tag . '>' . "\n";
	$harlow_wrapper .= ' aria-labelledby="' . esc_attr( $harlow_bar_id ) . '"';
}
if ( '' !== $attributes['innerText'] ) {
	$harlow_wrapper .= ' aria-valuetext="' . esc_attr( $harlow_percent . '% (' . wp_strip_all_tags( $attributes['innerText'] ) . ')' ) . '"';
}
$harlow_percentage = $attributes['displayPercentage'] ? "\n" . '<span class="elementor-progress-percentage">' . esc_html( (string) $harlow_percent ) . '%</span>' : '';

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'progress.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_title
	. '<div' . $harlow_wrapper . '>' . "\n"
	. '<div class="elementor-progress-bar" data-max="' . esc_attr( (string) $harlow_percent ) . '">' . "\n"
	. '<span class="elementor-progress-text">' . wp_kses_post( $attributes['innerText'] ) . '</span>' . $harlow_percentage . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
