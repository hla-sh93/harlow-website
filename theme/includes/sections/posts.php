<?php
/**
 * A posts list (harlow/posts): Elementor Pro's posts widget, the items of a content type
 * (posts, news, projects, gallery items, jobs, pages) as cards in columns, skin classic,
 * cards or full content, with a pager and a filter bar by term when asked.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Only a list with a pager follows the page number in the address.
$harlow_page = '' !== $attributes['pagination'] ? harlow_posts_current_page() : 1;
echo harlow_posts_widget( $attributes, harlow_posts_query( $attributes, $harlow_page ), 'posts', $harlow_page ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built (functions/widgets/posts.php).
