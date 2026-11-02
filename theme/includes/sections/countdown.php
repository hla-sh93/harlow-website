<?php
/**
 * A countdown (harlow/countdown): Elementor Pro's countdown widget, boxes of days, hours,
 * minutes and seconds counting down (assets/js/widgets/countdown.js) to a date in the
 * site's time zone (data-date, its moment in seconds) or, as an evergreen timer, for a
 * time each visitor gets from their first visit (data-evergreen-interval, in seconds).
 * When it runs out it does what the owner chose (data-expire-actions): hides, shows a
 * message, goes to another address.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_display = 'inline' === $attributes['labelDisplay'] ? 'inline' : 'block';

// The element's classes: the widget's own, with the labels' display.
$harlow_classes            = array_filter(
	preg_split( '/\s+/', (string) $attributes['classes'] ),
	static function ( $name ) {
		return '' !== $name && 0 !== strpos( $name, 'elementor-countdown--label-' );
	}
);
$harlow_classes            = array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-countdown' ), $harlow_classes ), $harlow_classes );
$harlow_classes[]          = 'elementor-countdown--label-' . $harlow_display;
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', $harlow_classes );

// When it ends: the due date (a month from now until one is chosen), or each visitor's own.
if ( 'evergreen' === $attributes['countdownType'] ) {
	$harlow_interval = max( 0, (int) $attributes['evergreenHours'] ) * HOUR_IN_SECONDS + max( 0, (int) $attributes['evergreenMinutes'] ) * MINUTE_IN_SECONDS;
	$harlow_data     = ' data-evergreen-interval="' . esc_attr( (string) $harlow_interval ) . '"';
	$harlow_date     = '';
} else {
	$harlow_due  = preg_match( '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $attributes['dueDate'] ) ? $attributes['dueDate'] : wp_date( 'Y-m-d H:i', time() + MONTH_IN_SECONDS );
	$harlow_date = (string) strtotime( get_gmt_from_date( $harlow_due . ':00' ) . ' UTC' );
	$harlow_data = '';
}

// What to do when it ends.
$harlow_actions = array();
foreach ( array_intersect( array( 'hide', 'redirect', 'message' ), (array) $attributes['expireActions'] ) as $harlow_action ) {
	if ( 'redirect' === $harlow_action ) {
		if ( '' !== $attributes['expireRedirect'] ) {
			$harlow_actions[] = array(
				'type'         => 'redirect',
				'redirect_url' => esc_url_raw( harlow_link_url( $attributes['expireRedirect'] ) ),
			);
		}
		continue;
	}
	$harlow_actions[] = array( 'type' => $harlow_action );
}
if ( $harlow_actions ) {
	$harlow_data .= ' data-expire-actions="' . esc_attr( (string) wp_json_encode( $harlow_actions ) ) . '"';
}

// The boxes: the digits, filled by the script, and their labels.
$harlow_parts = array(
	'days'    => array( 'showDays', 'labelDays', __( 'Days', 'harlow' ) ),
	'hours'   => array( 'showHours', 'labelHours', __( 'Hours', 'harlow' ) ),
	'minutes' => array( 'showMinutes', 'labelMinutes', __( 'Minutes', 'harlow' ) ),
	'seconds' => array( 'showSeconds', 'labelSeconds', __( 'Seconds', 'harlow' ) ),
);
$harlow_items = '';
foreach ( $harlow_parts as $harlow_part => $harlow_keys ) {
	if ( ! $attributes[ $harlow_keys[0] ] ) {
		continue;
	}
	$harlow_items .= '<div class="elementor-countdown-item"><span class="elementor-countdown-digits elementor-countdown-' . $harlow_part . '"></span>';
	if ( $attributes['showLabels'] ) {
		$harlow_label  = $attributes['customLabels'] ? $attributes[ $harlow_keys[1] ] : $harlow_keys[2];
		$harlow_items .= ' <span class="elementor-countdown-label">' . esc_html( $harlow_label ) . '</span>';
	}
	$harlow_items .= '</div>';
}

$harlow_message = '';
if ( in_array( 'message', (array) $attributes['expireActions'], true ) ) {
	$harlow_message = "\n" . '<div class="elementor-countdown-expire--message">' . wp_kses_post( $attributes['expireMessage'] ) . '</div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'countdown.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-countdown-wrapper" data-date="' . esc_attr( $harlow_date ) . '"' . $harlow_data . '>' . $harlow_items . '</div>'
	. $harlow_message . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
