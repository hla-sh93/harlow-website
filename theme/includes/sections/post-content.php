<?php
/**
 * The item's text (harlow/post-content): Elementor's post content widget on a single
 * template, around the text of the item the page shows.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'theme-post-content.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. apply_filters( 'the_content', get_the_content() ) . "\n" // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress's own filter.
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the item's text, filtered by WordPress as the_content() prints it.
