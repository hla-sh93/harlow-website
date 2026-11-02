<?php
/**
 * The lists of the sitemap widget: a content type's items or a taxonomy's terms, nested
 * by their parents when asked, as Elementor Pro's sitemap widget prints them.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * One section of the sitemap: its title and its list.
 *
 * @param array<string,mixed> $section   The section: type (post_type, taxonomy), postType,
 *                                       taxonomy, title, orderby, order, hideEmpty,
 *                                       hierarchical, depth, exclude (ids), excludeCurrent.
 * @param string              $title_tag The titles' tag.
 * @param bool                $nofollow  Links with rel="nofollow".
 * @return string
 */
function harlow_sitemap_section( $section, $title_tag, $nofollow ) {
	$get      = static function ( $key, $fallback ) use ( $section ) {
		return isset( $section[ $key ] ) && '' !== $section[ $key ] ? $section[ $key ] : $fallback;
	};
	$taxonomy = 'taxonomy' === $get( 'type', 'post_type' );
	$source   = $taxonomy ? sanitize_key( (string) $get( 'taxonomy', 'category' ) ) : sanitize_key( (string) $get( 'postType', 'page' ) );
	$exclude  = array_filter( array_map( 'intval', explode( ',', (string) $get( 'exclude', '' ) ) ) );
	if ( ! $taxonomy && $get( 'excludeCurrent', false ) && get_the_ID() ) {
		$exclude[] = (int) get_the_ID();
	}
	$order        = 'desc' === strtolower( (string) $get( 'order', 'asc' ) ) ? 'DESC' : 'ASC';
	$hierarchical = (bool) $get( 'hierarchical', true );
	$depth        = $hierarchical ? max( 0, (int) $get( 'depth', 0 ) ) : -1;
	$rel          = $nofollow ? ' rel="nofollow"' : '';
	$items        = '';

	if ( $taxonomy ) {
		$terms = get_terms(
			array(
				'taxonomy'   => $source,
				'hide_empty' => (bool) $get( 'hideEmpty', false ),
				'orderby'    => in_array( $get( 'orderby', 'name' ), array( 'name', 'id', 'count', 'slug', 'term_order' ), true ) ? $get( 'orderby', 'name' ) : 'name',
				'order'      => $order,
				'exclude'    => $exclude,
			)
		);
		if ( ! is_wp_error( $terms ) ) {
			$items = harlow_sitemap_terms( $terms, $hierarchical ? 0 : null, $depth, 1, $rel );
		}
	} else {
		$posts = get_posts(
			array(
				'post_type'        => $source,
				'post_status'      => 'publish',
				'posts_per_page'   => -1,
				'orderby'          => in_array( $get( 'orderby', 'post_date' ), array( 'post_date', 'post_title', 'menu_order', 'rand', 'ID' ), true ) ? $get( 'orderby', 'post_date' ) : 'post_date',
				'order'            => $order,
				'post__not_in'     => $exclude,
				'has_password'     => false,
				'suppress_filters' => false,
			)
		);
		$items = harlow_sitemap_posts( $posts, $hierarchical && is_post_type_hierarchical( $source ) ? 0 : null, $depth, 1, $rel );
	}

	$html  = '<div class="elementor-sitemap-section">' . "\n";
	$title = (string) $get( 'title', '' );
	if ( '' !== $title ) {
		$html .= '<' . $title_tag . ' class="elementor-sitemap-title elementor-sitemap-' . esc_attr( $source ) . '-title">' . esc_html( $title ) . '</' . $title_tag . '>' . "\n";
	}
	if ( '' !== $items ) {
		$html .= '<ul class="elementor-sitemap-list elementor-sitemap-' . esc_attr( $source ) . '-list">' . $items . "\n" . '</ul>' . "\n";
	}
	return $html . '</div>';
}

/**
 * The items of a content type, nested under their parents.
 *
 * @param WP_Post[] $posts  The items.
 * @param int|null  $above  The parent whose children to list; null for every item, flat.
 * @param int       $depth  How many levels; 0 for all.
 * @param int       $level  This level.
 * @param string    $rel    The links' rel attribute, with its leading space, or ''.
 * @return string
 */
function harlow_sitemap_posts( $posts, $above, $depth, $level, $rel ) {
	$html = '';
	foreach ( $posts as $post ) {
		if ( null !== $above && (int) $post->post_parent !== $above && ( 0 !== $above || harlow_sitemap_has_parent( $post, $posts ) ) ) {
			continue;
		}
		$children = null !== $above && ( 0 === $depth || $level < $depth ) ? harlow_sitemap_posts( $posts, $post->ID, $depth, $level + 1, $rel ) : '';
		$classes  = 'elementor-sitemap-item elementor-sitemap-item-' . $post->post_type;
		if ( 'page' === $post->post_type ) {
			$classes .= ' page_item page-item-' . $post->ID . ( '' !== $children ? ' page_item_has_children' : '' );
		}
		$html .= "\n" . '<li class="' . esc_attr( $classes ) . '"><a href="' . esc_url( get_permalink( $post ) ) . '"' . $rel . '>' . esc_html( get_the_title( $post ) ) . '</a>'
			. ( '' !== $children ? "\n" . '<ul class="children">' . $children . "\n" . '</ul>' . "\n" : '' )
			. '</li>';
	}
	return $html;
}

/**
 * Does an item's parent show in the list (so the item is listed under it)?
 *
 * @param WP_Post   $post  The item.
 * @param WP_Post[] $posts The items listed.
 * @return bool
 */
function harlow_sitemap_has_parent( $post, $posts ) {
	if ( ! $post->post_parent ) {
		return false;
	}
	foreach ( $posts as $other ) {
		if ( $other->ID === (int) $post->post_parent ) {
			return true;
		}
	}
	return false;
}

/**
 * The terms of a taxonomy, nested under their parents.
 *
 * @param WP_Term[] $terms  The terms.
 * @param int|null  $above  The parent whose children to list; null for every term, flat.
 * @param int       $depth  How many levels; 0 for all.
 * @param int       $level  This level.
 * @param string    $rel    The links' rel attribute, with its leading space, or ''.
 * @return string
 */
function harlow_sitemap_terms( $terms, $above, $depth, $level, $rel ) {
	$html = '';
	$ids  = wp_list_pluck( $terms, 'term_id' );
	foreach ( $terms as $term ) {
		if ( null !== $above && $term->parent !== $above && ( 0 !== $above || in_array( $term->parent, $ids, true ) ) ) {
			continue;
		}
		$children = null !== $above && ( 0 === $depth || $level < $depth ) ? harlow_sitemap_terms( $terms, $term->term_id, $depth, $level + 1, $rel ) : '';
		$link     = get_term_link( $term );
		$html    .= "\n" . '<li class="elementor-sitemap-item elementor-sitemap-item-' . esc_attr( $term->taxonomy ) . ' cat-item cat-item-' . $term->term_id . '"><a href="' . esc_url( is_string( $link ) ? $link : '' ) . '"' . $rel . '>' . esc_html( $term->name ) . '</a>'
			. ( '' !== $children ? "\n" . '<ul class="children">' . $children . "\n" . '</ul>' . "\n" : '' )
			. '</li>';
	}
	return $html;
}
