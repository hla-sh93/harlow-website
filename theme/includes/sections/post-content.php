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

// On a template's own screen (an item page template, a Theme Builder template, read in
// the editor or by the REST API) there is no item, and a text already being printed
// further up is not printed inside itself: either would print this block again, without
// end (harlow_text_printing()).
$harlow_text = in_array( get_post_type(), array( 'wp_block', 'harlow_template' ), true ) || harlow_text_printing( (int) get_the_ID() )
	? '<p>' . esc_html__( 'The item’s text', 'harlow' ) . '</p>'
	: apply_filters( 'the_content', get_the_content() ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress's own filter.
// In the editor an empty text shows where it will be, so it can be seen and styled.
if ( '' === trim( wp_strip_all_tags( $harlow_text ) ) && wp_is_serving_rest_request() ) {
	$harlow_text = '<p>' . esc_html__( 'The item’s text', 'harlow' ) . '</p>';
}
$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'theme-post-content.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_text . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the item's text, filtered by WordPress as the_content() prints it.
