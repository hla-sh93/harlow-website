<?php
/**
 * The posts of a list (harlow/archive-posts): Elementor Pro's archive posts widget, the
 * items of the category, tag, author, date or search being shown, as the posts widget's
 * cards, with the list's pager; the latest posts as a sample where no list is shown (an
 * item page template's screen, the editor, a page), and the "nothing found" words when
 * the list is empty.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $wp_query;
$harlow_page = harlow_posts_current_page();
if ( harlow_archive_title_is_list() ) {
	$harlow_query = $wp_query;
	$harlow_query->rewind_posts();
} else {
	$harlow_query = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => max( 1, (int) get_option( 'posts_per_page' ) ),
			'paged'               => $harlow_page,
			'ignore_sticky_posts' => true,
		)
	);
}
echo harlow_posts_widget( $attributes, $harlow_query, 'archive-posts', $harlow_page ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built (functions/widgets/posts.php).
if ( $harlow_query === $wp_query ) {
	$wp_query->rewind_posts();
}
