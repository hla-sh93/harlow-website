<?php
/**
 * The box of a page's sections or of a shared section's blocks (harlow/document): Elementor's
 * document element, which the page's own design rules (.elementor-<id>) are keyed on. A page
 * made in WordPress has no id of live's: its document is its own.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The blocks inside, printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_id    = (int) $attributes['docId'] ? (int) $attributes['docId'] : harlow_document_id();
$harlow_class = 'elementor elementor-' . $harlow_id;
if ( 'single' === $attributes['location'] ) {
	// A single template's box carries the item's classes, as Elementor's theme builder prints it.
	$harlow_class .= ' elementor-location-single ' . implode( ' ', get_post_class() );
} elseif ( 'loop-item' === $attributes['location'] ) {
	// A list's card made in the Theme Builder: Elementor's loop item, with the item's classes.
	$harlow_class .= ' e-loop-item e-loop-item-' . get_the_ID() . ' ' . implode( ' ', get_post_class() );
} elseif ( '' !== $attributes['location'] ) {
	$harlow_class .= ' elementor-location-' . sanitize_html_class( $attributes['location'] );
}
echo '<div data-elementor-type="' . esc_attr( $attributes['docType'] ) . '" data-elementor-id="' . $harlow_id . '" class="' . esc_attr( $harlow_class ) . '" data-elementor-post-type="' . esc_attr( $attributes['postType'] ) . '">' . $content . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the inner blocks, printed by WordPress.
