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

$harlow_id = (int) $attributes['docId'] ? (int) $attributes['docId'] : harlow_document_id();
echo '<div data-elementor-type="' . esc_attr( $attributes['docType'] ) . '" data-elementor-id="' . $harlow_id . '" class="elementor elementor-' . $harlow_id . '" data-elementor-post-type="' . esc_attr( $attributes['postType'] ) . '">' . $content . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the inner blocks, printed by WordPress.
