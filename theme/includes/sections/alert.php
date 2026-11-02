<?php
/**
 * An alert (harlow/alert): Elementor's alert widget, a notice coloured by its type with a
 * title, words and a dismiss button (assets/js/widgets/alert.js closes it). Without a
 * title and words, Elementor prints nothing inside the element, and neither does this.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_type  = in_array( $attributes['alertType'], array( 'info', 'success', 'warning', 'danger' ), true ) ? $attributes['alertType'] : 'info';
$harlow_title = trim( (string) $attributes['title'] );
$harlow_words = trim( (string) $attributes['description'] );

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'alert.default' ) . '>';
if ( '' !== $harlow_title || '' !== $harlow_words ) {
	$harlow_inner = '';
	if ( '' !== $harlow_title ) {
		$harlow_inner .= '<span class="elementor-alert-title">' . wp_kses_post( $harlow_title ) . '</span>' . "\n";
	}
	if ( '' !== $harlow_words ) {
		$harlow_inner .= '<span class="elementor-alert-description">' . wp_kses_post( $harlow_words ) . '</span>' . "\n";
	}
	if ( $attributes['showDismiss'] ) {
		$harlow_inner .= '<button type="button" class="elementor-alert-dismiss" aria-label="' . esc_attr__( 'Dismiss this alert.', 'harlow' ) . '">' . "\n"
			. ( '' !== $attributes['dismissIcon'] ? harlow_icon( $attributes['dismissIcon'] ) : '<span aria-hidden="true">&times;</span>' ) . "\n"
			. '</button>' . "\n";
	}
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n"
		. '<div class="elementor-alert elementor-alert-' . esc_attr( $harlow_type ) . '" role="alert">' . "\n"
		. $harlow_inner
		. '</div>' . "\n"
		. '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the icon are escaped where they are built.
