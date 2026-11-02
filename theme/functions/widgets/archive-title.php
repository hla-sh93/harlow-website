<?php
/**
 * The title of a list of posts (the archive title and page title widgets): a category's,
 * a tag's, an author's, a date's, a search's, as Elementor Pro's archive title tag gives
 * it, with its context ("Category: ...") when asked.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The title of the list of posts being shown; a category's as a sample where none is (an
 * item page template's screen, the editor).
 *
 * @param bool $context With its context: "Category: News", "Search Results for: x".
 * @return string Markup (an author's name is in a vcard span, as Elementor prints it).
 */
function harlow_archive_title_text( $context = true ) {
	$title = '';
	$label = '';
	if ( is_search() ) {
		/* translators: %s: the words searched for. */
		$title = sprintf( __( 'Search Results for: %s', 'harlow' ), get_search_query() );
		if ( get_query_var( 'paged' ) ) {
			/* translators: %s: a page number. */
			$title .= sprintf( __( '&nbsp;&ndash; Page %s', 'harlow' ), get_query_var( 'paged' ) );
		}
		return $title;
	}
	if ( is_category() ) {
		$title = single_cat_title( '', false );
		/* translators: %s: a category's name. */
		$label = __( 'Category: %s', 'harlow' );
	} elseif ( is_tag() ) {
		$title = single_tag_title( '', false );
		/* translators: %s: a tag's name. */
		$label = __( 'Tag: %s', 'harlow' );
	} elseif ( is_author() ) {
		$title = '<span class="vcard">' . esc_html( get_the_author() ) . '</span>';
		/* translators: %s: an author's name. */
		$label = __( 'Author: %s', 'harlow' );
	} elseif ( is_year() ) {
		$title = get_the_date( _x( 'Y', 'yearly archives date format', 'harlow' ) );
		/* translators: %s: a year. */
		$label = __( 'Year: %s', 'harlow' );
	} elseif ( is_month() ) {
		$title = get_the_date( _x( 'F Y', 'monthly archives date format', 'harlow' ) );
		/* translators: %s: a month. */
		$label = __( 'Month: %s', 'harlow' );
	} elseif ( is_day() ) {
		$title = get_the_date( _x( 'F j, Y', 'daily archives date format', 'harlow' ) );
		/* translators: %s: a day. */
		$label = __( 'Day: %s', 'harlow' );
	} elseif ( is_post_type_archive() ) {
		$title = post_type_archive_title( '', false );
		/* translators: %s: a content type's name. */
		$label = __( 'Archives: %s', 'harlow' );
	} elseif ( is_tax() ) {
		$taxonomy = get_taxonomy( get_queried_object()->taxonomy );
		$title    = single_term_title( '', false );
		$label    = $taxonomy ? $taxonomy->labels->singular_name . ': %s' : '%s';
	} elseif ( is_home() ) {
		$page  = (int) get_option( 'page_for_posts' );
		$title = $page ? get_the_title( $page ) : get_bloginfo( 'name' );
	} elseif ( is_404() ) {
		$title = __( 'Page Not Found', 'harlow' );
	} elseif ( is_archive() ) {
		$title = __( 'Archives', 'harlow' );
	} else {
		// No list here: a category's title, as a sample.
		$sample = get_terms(
			array(
				'taxonomy'   => 'category',
				'hide_empty' => true,
				'number'     => 1,
			)
		);
		$title  = ! is_wp_error( $sample ) && $sample ? $sample[0]->name : __( 'Archives', 'harlow' );
		/* translators: %s: a category's name. */
		$label = __( 'Category: %s', 'harlow' );
	}
	return $context && '' !== $label ? sprintf( $label, $title ) : $title;
}

/**
 * Is a list of posts being shown (a category, tag, author, date, search, the blog)?
 *
 * @return bool
 */
function harlow_archive_title_is_list() {
	return did_action( 'wp' ) && ! is_admin() && ! defined( 'REST_REQUEST' ) && ( is_archive() || is_search() || is_home() || is_404() );
}
