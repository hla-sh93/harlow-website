<?php
/**
 * An item's excerpt, for the post excerpt widget.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The excerpt of an item as Elementor Pro's post excerpt tag gives it: its own excerpt, or,
 * when it has none and that is asked, its text's first 55 words (WordPress's excerpt);
 * cut after so many words when a length is set (no mark after it, as Elementor cuts).
 * Words are split as the theme's cards split them: a no-break space separates words too.
 *
 * @param WP_Post $post         The item.
 * @param int     $length       How many words; 0 for the whole excerpt.
 * @param bool    $from_content Use the text's first words when there is no excerpt.
 * @return string Escaped text.
 */
function harlow_post_excerpt_text( $post, $length, $from_content ) {
	if ( has_excerpt( $post ) ) {
		$text = $post->post_excerpt;
	} elseif ( $from_content ) {
		$text = wp_trim_words( excerpt_remove_blocks( strip_shortcodes( $post->post_content ) ), $length > 0 ? $length + 1 : 55, '…' );
	} else {
		return '';
	}
	$text = trim( wp_strip_all_tags( $text ) );
	if ( $length > 0 ) {
		$words = preg_split( '/\s+/u', $text, $length + 1, PREG_SPLIT_NO_EMPTY );
		if ( count( $words ) > $length ) {
			array_pop( $words );
		}
		$text = implode( ' ', $words );
	}
	return esc_html( html_entity_decode( $text, ENT_QUOTES, 'UTF-8' ) );
}
