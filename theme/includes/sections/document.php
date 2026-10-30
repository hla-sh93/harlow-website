<?php
/**
 * The box of a shared section (harlow/document): Elementor's document element around the
 * blocks of a saved template, which its design classes (.elementor-<id>) are keyed on.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The blocks inside, printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_id = (int) $attributes['docId'];
echo '<div data-elementor-type="' . esc_attr( $attributes['docType'] ) . '" data-elementor-id="' . $harlow_id . '" class="elementor elementor-' . $harlow_id . '" data-elementor-post-type="elementor_library">' . $content . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the inner blocks, printed by WordPress.
