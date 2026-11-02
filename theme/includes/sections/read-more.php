<?php
/**
 * Read more (harlow/read-more): Elementor's read more widget, WordPress's more mark
 * (`<!--more Continue reading-->`) where a post is cut when it is listed.
 *
 * Printed for a post shown somewhere else than on its own page (a list, an archive, a
 * search), it is followed by WordPress's "more" link to the post (`#more-<id>`, the
 * the_content_more_link filter applied); on the post's own page, by the place that link
 * leads to (`<span id="more-<id>">`), as WordPress prints the full post. Nothing of it is
 * seen there.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_text = trim( wp_strip_all_tags( (string) $attributes['text'] ) );
$harlow_more = '<!--more' . ( '' !== $harlow_text ? ' ' . esc_html( $harlow_text ) : '' ) . '-->';
$harlow_post = get_post();
if ( $harlow_post ) {
	if ( is_singular() && (int) get_queried_object_id() === (int) $harlow_post->ID ) {
		$harlow_more .= '<span id="more-' . (int) $harlow_post->ID . '"></span>';
	} else {
		$harlow_label = esc_html( '' !== $harlow_text ? $harlow_text : __( 'Continue reading', 'harlow' ) );
		$harlow_link  = '<a href="' . esc_url( get_permalink( $harlow_post ) . '#more-' . $harlow_post->ID ) . '" class="more-link">' . $harlow_label . '</a>';
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress's own filter of its more link.
		$harlow_more .= wp_kses_post( apply_filters( 'the_content_more_link', $harlow_link, $harlow_label ) );
	}
}

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'read-more.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_more . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the link are escaped where they are built.
