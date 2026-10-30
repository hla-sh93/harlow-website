<?php
/**
 * A text (harlow/text): Elementor's text editor widget. Its paragraphs and lists are
 * WordPress's own blocks inside it; what they cannot hold as it is sits in HTML blocks.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The paragraphs and lists, already printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'text-editor.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . $content . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the inner blocks, printed by WordPress.
