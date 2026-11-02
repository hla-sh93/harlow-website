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

// In an item page template's own screen (a synced pattern) there is no item: the
// pattern's own content would print this block again, without end.
$harlow_text = 'wp_block' === get_post_type()
	? '<p>' . esc_html__( 'The item’s text', 'harlow' ) . '</p>'
	: apply_filters( 'the_content', get_the_content() ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress's own filter.
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'theme-post-content.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_text . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the item's text, filtered by WordPress as the_content() prints it.
