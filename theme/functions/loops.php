<?php
/**
 * Lists of items: the block that shows them (blocks/loop) and what its cards print.
 *
 * On live every list and carousel is Elementor's loop grid or loop carousel, which prints
 * one loop item template per item. Here the block prints the same widget, and each item
 * is printed by includes/loops/<template>.php, the same template's markup with the item's
 * title, picture, date and words in it.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The card templates: name => live's loop item template id.
 *
 * @return array<string,int>
 */
function harlow_loop_templates() {
	return array(
		'post-card'      => 1073,
		'business-model' => 1092,
		'project'        => 4279,
		'testimonial'    => 2279,
		'person'         => 4002,
		'gallery-item'   => 2552,
		'job'            => 4058,
		'client-logo'    => 0,
	);
}

/**
 * Is the list being printed a carousel? Set by the block while it prints its items.
 *
 * @param bool|null $set A new value, or null to read.
 * @return bool
 */
function harlow_loop_is_carousel( $set = null ) {
	static $carousel = false;
	if ( null !== $set ) {
		$carousel = (bool) $set;
	}
	return $carousel;
}

/**
 * The classes of a card: Elementor's (and Swiper's, in a carousel), then WordPress's own
 * post classes (type, status, picture, category), as live prints them.
 *
 * @param int $template Live's loop item template id.
 * @return string
 */
function harlow_loop_item_class( $template ) {
	$classes = array( 'elementor', 'elementor-' . $template );
	if ( harlow_loop_is_carousel() ) {
		$classes[] = 'swiper-slide';
	}
	$classes[] = 'e-loop-item';
	$classes[] = 'e-loop-item-' . get_the_ID();
	return implode( ' ', array_merge( $classes, get_post_class() ) );
}

/**
 * A card in a carousel is a slide, to screen readers too.
 */
function harlow_loop_slide_attributes() {
	if ( harlow_loop_is_carousel() ) {
		echo ' role="group" aria-roledescription="slide"';
	}
}

/**
 * The first words of an item: its excerpt if it has one, its text otherwise, cut after so
 * many words and followed by the given mark when cut (live's cards: 10 to 29 words and
 * "…", "...", or nothing).
 *
 * Words are cut as live's cards cut them, which is not wp_trim_words(): a no-break space
 * separates words too, and the words are joined again by one plain space, so a run of
 * no-break spaces in the text ("Job Title:        Marketing") reads as one space.
 *
 * @param int    $words How many words.
 * @param string $more  What follows a text that was cut.
 * @return string Plain text.
 */
function harlow_card_text( $words, $more ) {
	$item  = get_post();
	$text  = wp_strip_all_tags( strip_shortcodes( has_excerpt( $item ) ? $item->post_excerpt : $item->post_content ) );
	$parts = preg_split( '/\s+/u', $text, $words + 1, PREG_SPLIT_NO_EMPTY );
	if ( count( $parts ) > $words ) {
		array_pop( $parts );
		return html_entity_decode( implode( ' ', $parts ) . $more, ENT_QUOTES, 'UTF-8' );
	}
	return html_entity_decode( implode( ' ', $parts ), ENT_QUOTES, 'UTF-8' );
}

/**
 * A picture of a card, as Elementor prints one: WordPress's image with its id in the
 * classes (wp-image-<id>), which WordPress does not add by itself.
 *
 * @param int    $attachment The picture.
 * @param string $size       Its size.
 * @return string
 */
function harlow_card_image( $attachment, $size ) {
	if ( ! $attachment ) {
		return '';
	}
	return wp_get_attachment_image( $attachment, $size, false, array( 'class' => 'attachment-' . $size . ' size-' . $size . ' wp-image-' . $attachment ) );
}

/**
 * Where a card leads: the page chosen for it (a business model), or the item's own page.
 *
 * @return string
 */
function harlow_item_link() {
	$page = (int) get_post_meta( get_the_ID(), '_harlow_link', true );
	return $page ? (string) get_permalink( $page ) : (string) get_permalink();
}

/**
 * The element id a client logo prints: live's, for the ten logos that came from live; one
 * made from the logo's id for a logo added since.
 *
 * @return string
 */
function harlow_client_element() {
	$element = (string) get_post_meta( get_the_ID(), '_harlow_element', true );
	return '' !== $element ? $element : substr( md5( 'harlow-client-' . get_the_ID() ), 0, 7 );
}

/**
 * Pages print their blocks as written: no curly quotes put in, no paragraphs added.
 *
 * WordPress runs wptexturize on content, which would turn a card's "..." into "…" and
 * straight quotes into curly ones; live's pages (Elementor's) print the words as typed.
 */
function harlow_plain_page_content() {
	if ( is_page() ) {
		remove_filter( 'the_content', 'wptexturize' );
		remove_filter( 'the_content', 'wpautop' );
	}
}
add_action( 'wp', 'harlow_plain_page_content' );
