<?php
/**
 * The pager of a search or an archive, as live's base theme prints it.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $wp_query;
if ( $wp_query->max_num_pages > 1 ) {
	/* translators: %s: an arrow. */
	$harlow_previous = sprintf( esc_html__( '%s Previous', 'harlow' ), '<span class="meta-nav">&larr;</span>' );
	/* translators: %s: an arrow. */
	$harlow_next = sprintf( esc_html__( 'Next %s', 'harlow' ), '<span class="meta-nav">&rarr;</span>' );
	echo '<nav class="pagination">' . "\n"
		. '<div class="nav-previous">' . get_previous_posts_link( $harlow_previous ) . '</div>' . "\n" // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WordPress's own link, the words escaped above.
		. '<div class="nav-next">' . get_next_posts_link( $harlow_next ) . '</div>' . "\n" // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as above.
		. '</nav>';
}
