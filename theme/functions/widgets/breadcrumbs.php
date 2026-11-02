<?php
/**
 * The trail of the breadcrumbs widget: home, then where the page being shown sits (a
 * page's parents; a post's category; an item's list page), then the page itself; and the
 * trail as schema.org's BreadcrumbList.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The trail to the page being shown, as [ name, address ] pairs; the last has no address.
 * In the editor, and in an item page template's screen, the trail of the page being edited
 * (or of a sample post).
 *
 * @param string $home What the home page is called.
 * @return array<int,array{0:string,1:string}>
 */
function harlow_breadcrumbs_trail( $home ) {
	$trail = array( array( $home, home_url( '/' ) ) );
	$front = did_action( 'wp' ) && ! is_admin() && ! defined( 'REST_REQUEST' );
	if ( $front && ! is_singular() ) {
		return array_merge( $trail, harlow_breadcrumbs_list_trail() );
	}
	$post = harlow_theme_builder_post();
	if ( ! $post || (int) get_option( 'page_on_front' ) === $post->ID ) {
		return array( array( $home, '' ) );
	}
	if ( 'page' === $post->post_type ) {
		foreach ( array_reverse( get_post_ancestors( $post ) ) as $parent ) {
			$trail[] = array( get_the_title( $parent ), (string) get_permalink( $parent ) );
		}
	} elseif ( 'post' === $post->post_type ) {
		$terms = get_the_terms( $post, 'category' );
		if ( is_array( $terms ) && $terms ) {
			$trail = array_merge( $trail, harlow_breadcrumbs_term_trail( $terms[0], true ) );
		}
	} else {
		$list = harlow_breadcrumbs_type_page( $post->post_type );
		if ( $list ) {
			$trail[] = array( get_the_title( $list ), (string) get_permalink( $list ) );
		}
	}
	$trail[] = array( get_the_title( $post ), '' );
	return $trail;
}

/**
 * The end of the trail of a list of posts: a category with its parents, a tag, an author,
 * a date, a search, the blog, the page that is not there.
 *
 * @return array<int,array{0:string,1:string}>
 */
function harlow_breadcrumbs_list_trail() {
	if ( is_search() ) {
		/* translators: %s: the words searched for. */
		return array( array( sprintf( __( 'You searched for %s', 'harlow' ), get_search_query() ), '' ) );
	}
	if ( is_404() ) {
		return array( array( __( 'Error 404: Page not found', 'harlow' ), '' ) );
	}
	if ( is_category() || is_tag() || is_tax() ) {
		return harlow_breadcrumbs_term_trail( get_queried_object(), false );
	}
	if ( is_author() ) {
		/* translators: %s: an author's name. */
		return array( array( sprintf( __( 'Archives for %s', 'harlow' ), get_the_author_meta( 'display_name', (int) get_query_var( 'author' ) ) ), '' ) );
	}
	if ( is_date() ) {
		$year  = (int) get_query_var( 'year' );
		$month = (int) get_query_var( 'monthnum' );
		$trail = array( array( (string) $year, is_year() ? '' : get_year_link( $year ) ) );
		if ( $month ) {
			$trail[] = array( date_i18n( 'F', mktime( 0, 0, 0, $month, 1, $year ) ), is_month() ? '' : get_month_link( $year, $month ) );
		}
		if ( is_day() ) {
			$trail[] = array( (string) (int) get_query_var( 'day' ), '' );
		}
		return $trail;
	}
	if ( is_home() && get_option( 'page_for_posts' ) ) {
		return array( array( get_the_title( (int) get_option( 'page_for_posts' ) ), '' ) );
	}
	return array();
}

/**
 * A term with its parents.
 *
 * @param WP_Term $term   The term.
 * @param bool    $linked The term itself linked (it is not the page being shown).
 * @return array<int,array{0:string,1:string}>
 */
function harlow_breadcrumbs_term_trail( $term, $linked ) {
	$trail = array();
	foreach ( array_reverse( get_ancestors( $term->term_id, $term->taxonomy, 'taxonomy' ) ) as $parent ) {
		$parent_term = get_term( $parent, $term->taxonomy );
		if ( $parent_term instanceof WP_Term ) {
			$link    = get_term_link( $parent_term );
			$trail[] = array( $parent_term->name, is_string( $link ) ? $link : '' );
		}
	}
	$link    = $linked ? get_term_link( $term ) : '';
	$trail[] = array( $term->name, is_string( $link ) ? $link : '' );
	return $trail;
}

/**
 * The page that lists a type's items (a list block of that type in its sections): the
 * news page for a news item, the projects' page for a project. The home page only when no
 * other page lists them.
 *
 * @param string $type The content type.
 * @return int 0 when no page lists them.
 */
function harlow_breadcrumbs_type_page( $type ) {
	static $found = array();
	if ( ! isset( $found[ $type ] ) ) {
		$found[ $type ] = 0;
		$front          = (int) get_option( 'page_on_front' );
		$pages          = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'menu_order title',
				'order'          => 'ASC',
			)
		);
		foreach ( $pages as $page ) {
			if ( false !== strpos( $page->post_content, '"postType":"' . $type . '"' ) ) {
				$found[ $type ] = $page->ID;
				if ( $page->ID !== $front ) {
					break;
				}
			}
		}
	}
	return $found[ $type ];
}

/**
 * The trail as schema.org's BreadcrumbList (JSON-LD).
 *
 * @param array<int,array{0:string,1:string}> $trail The trail.
 * @return string The script element.
 */
function harlow_breadcrumbs_schema( $trail ) {
	$items = array();
	foreach ( $trail as $index => $crumb ) {
		$item = array(
			'@type'    => 'ListItem',
			'position' => $index + 1,
			'name'     => wp_strip_all_tags( $crumb[0] ),
		);
		if ( '' !== $crumb[1] ) {
			$item['item'] = $crumb[1];
		}
		$items[] = $item;
	}
	$schema = array(
		'@context'        => 'https://schema.org',
		'@type'           => 'BreadcrumbList',
		'itemListElement' => $items,
	);
	return '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG ) . '</script>';
}
