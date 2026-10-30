<?php
/**
 * A question of an accordion (harlow/accordion-item): its title, which opens and closes
 * it, and its answer, the blocks inside. The icons are the accordion's.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The answer's blocks, printed.
 * @var WP_Block            $block      The block, with the accordion's icons in its context.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_tab    = (int) $attributes['tab'];
$harlow_id     = (int) $attributes['itemId'];
$harlow_style  = '' !== $attributes['contentStyle'] ? ' style="' . esc_attr( $attributes['contentStyle'] ) . '"' : '';
$harlow_closed = isset( $block->context['harlow/iconClosed'] ) ? (string) $block->context['harlow/iconClosed'] : '';
$harlow_opened = isset( $block->context['harlow/iconOpened'] ) ? (string) $block->context['harlow/iconOpened'] : '';

$harlow_html = '<div class="elementor-accordion-item">' . "\n"
	. '<div id="elementor-tab-title-' . $harlow_id . '" class="' . esc_attr( $attributes['titleClass'] ) . '" data-tab="' . $harlow_tab . '" role="button" aria-controls="elementor-tab-content-' . $harlow_id . '" aria-expanded="' . esc_attr( $attributes['expanded'] ) . '">' . "\n"
	. '<span class="elementor-accordion-icon elementor-accordion-icon-left" aria-hidden="true">' . "\n"
	. '<span class="elementor-accordion-icon-closed">' . harlow_icon( $harlow_closed ) . '</span>' . "\n"
	. '<span class="elementor-accordion-icon-opened">' . harlow_icon( $harlow_opened ) . '</span>' . "\n"
	. '</span>' . "\n"
	. '<a class="elementor-accordion-title" tabindex="0">' . wp_kses_post( $attributes['title'] ) . '</a>' . "\n"
	. '</div>' . "\n"
	. '<div id="elementor-tab-content-' . $harlow_id . '" class="' . esc_attr( $attributes['contentClass'] ) . '" data-tab="' . $harlow_tab . '" role="region" aria-labelledby="elementor-tab-title-' . $harlow_id . '"' . $harlow_style . '>'
	. $content . '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built; the answer is the inner blocks, printed by WordPress.
