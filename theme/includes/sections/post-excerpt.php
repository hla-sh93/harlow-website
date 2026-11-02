<?php
/**
 * The item's excerpt (harlow/post-excerpt): Elementor Pro's post excerpt widget, the
 * excerpt of the item the page shows (a sample post's where there is none), or the first
 * words of its text when it has none and that is asked; cut after so many words when a
 * length is set; with a Read More link when asked.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_post = harlow_theme_builder_post();
$harlow_text = $harlow_post ? harlow_post_excerpt_text( $harlow_post, (int) $attributes['length'], (bool) $attributes['fromContent'] ) : '';
if ( $harlow_post && $attributes['readMore'] && '' !== $attributes['readMoreText'] ) {
	$harlow_text .= ' <a class="elementor-post__read-more" href="' . esc_url( get_permalink( $harlow_post ) ) . '">' . esc_html( $attributes['readMoreText'] ) . '</a>';
}
$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'theme-post-excerpt' ), 'widget', 'theme-post-excerpt.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<p>' . $harlow_text . '</p>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the words are escaped in harlow_post_excerpt_text(), the link and attributes where they are built.
