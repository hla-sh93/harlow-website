<?php
/**
 * What the owner does with whole pages: duplicate one, put a page's original sections
 * back, pick a link from the site's pages; and the name every page and item is found by,
 * so links follow it when its address changes.
 *
 * A changed address redirects (301) to the new one through Rank Math's redirections
 * (its "Auto Post Redirect" setting, set by the local environment), listed and editable
 * under Rank Math > Redirections.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The types whose items have a page of their own: pages and the single templates' types.
 *
 * @return string[]
 */
function harlow_page_types() {
	return array_merge( array( 'page' ), array_keys( HARLOW_SINGLES ) );
}

/**
 * A page or item published for the first time gets its name (the installed ones have
 * live's): its address's parts joined by "-", as the reference names its pages
 * (/news/x/ is news-x). Links written as the name (news-x.html) find it wherever it moves.
 *
 * @param string  $new_status The new status.
 * @param string  $old_status The old status.
 * @param WP_Post $post       The post.
 */
function harlow_name_new_post( $new_status, $old_status, $post ) {
	if ( 'publish' !== $new_status || ! in_array( $post->post_type, harlow_page_types(), true )
		|| '' !== (string) get_post_meta( $post->ID, '_harlow_name', true ) ) {
		return;
	}
	$path = strtolower( rawurldecode( trim( (string) wp_make_link_relative( get_permalink( $post ) ), '/' ) ) );
	$base = trim( (string) preg_replace( '/[^a-z0-9_]+/', '-', $path ), '-' );
	$base = '' !== $base ? $base : $post->post_type . '-' . $post->ID;
	$name = $base;
	$n    = 1;
	while ( harlow_name_taken( $name, $post->ID ) ) {
		++$n;
		$name = $base . '-' . $n;
	}
	update_post_meta( $post->ID, '_harlow_name', $name );
}
add_action( 'transition_post_status', 'harlow_name_new_post', 10, 3 );

/**
 * Does another post have this name?
 *
 * @param string $name    The name.
 * @param int    $post_id The post asking.
 * @return bool
 */
function harlow_name_taken( $name, $post_id ) {
	$found = get_posts(
		array(
			'post_type'      => array_values( get_post_types( array( 'public' => true ) ) ),
			'post_status'    => 'any',
			'meta_key'       => '_harlow_name', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- once, when a page is first published.
			'meta_value'     => $name, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			'post__not_in'   => array( $post_id ),
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	return 'index' === $name || (bool) $found;
}

/**
 * A page's or item's address changed: the typed menu links (Custom Links) to it, and to the
 * pages under it, are written with the new address. Links in the pages' blocks follow by
 * themselves (they name the page); menu links to the page itself are WordPress's own.
 *
 * @param int     $post_id The page or item.
 * @param WP_Post $after   It after the change.
 * @param WP_Post $before  It before.
 */
function harlow_menu_links_follow( $post_id, $after, $before ) {
	if ( 'publish' !== $after->post_status || 'publish' !== $before->post_status
		|| ! in_array( $after->post_type, harlow_page_types(), true ) ) {
		return;
	}
	$old = (string) get_permalink( $before );
	$new = (string) get_permalink( $after );
	if ( $old === $new || untrailingslashit( $old ) === untrailingslashit( home_url() ) ) {
		return;
	}
	$items = get_posts(
		array(
			'post_type'      => 'nav_menu_item',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'meta_key'       => '_menu_item_type', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- once, when an address changes.
			'meta_value'     => 'custom', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			'fields'         => 'ids',
		)
	);
	foreach ( $items as $item ) {
		$url = (string) get_post_meta( $item, '_menu_item_url', true );
		if ( 0 === strpos( $url, $old ) ) {
			update_post_meta( $item, '_menu_item_url', $new . substr( $url, strlen( $old ) ) );
		}
	}
}
add_action( 'post_updated', 'harlow_menu_links_follow', 10, 3 );

/**
 * An address changed back to an earlier one: Rank Math keeps the earlier address among the
 * redirection's sources, so the page is sent to itself, a loop the browser cannot open. A
 * source that is the redirection's own destination is taken off; a redirection left with
 * no source is deleted.
 *
 * @param int $redirection_id The redirection Rank Math has just written for a page or item.
 */
function harlow_redirection_not_to_itself( $redirection_id ) {
	if ( ! class_exists( 'RankMath\Redirections\DB' ) || ! class_exists( 'RankMath\Redirections\Redirection' ) ) {
		return;
	}
	$redirection = RankMath\Redirections\DB::get_redirection_by_id( (int) $redirection_id );
	if ( ! $redirection ) {
		return;
	}
	$to      = trim( RankMath\Redirections\Redirection::strip_subdirectory( ltrim( (string) wp_parse_url( $redirection['url_to'], PHP_URL_PATH ), '/' ) ), '/' );
	$sources = array_values(
		array_filter(
			(array) $redirection['sources'],
			function ( $source ) use ( $to ) {
				return 'exact' !== $source['comparison'] || trim( $source['pattern'], '/' ) !== $to;
			}
		)
	);
	if ( count( $sources ) === count( (array) $redirection['sources'] ) ) {
		return;
	}
	if ( ! $sources ) {
		RankMath\Redirections\DB::delete( array( (int) $redirection_id ) );
		return;
	}
	RankMath\Redirections\DB::update(
		array(
			'id'          => (int) $redirection_id,
			'sources'     => $sources,
			'url_to'      => $redirection['url_to'],
			'header_code' => $redirection['header_code'],
			'status'      => $redirection['status'],
		)
	);
}
add_action( 'rank_math/redirection/post_updated', 'harlow_redirection_not_to_itself' );

/**
 * The pages and items a link can be picked from in the editor: name, title and type.
 *
 * @return array<int,array<string,string>>
 */
function harlow_link_targets() {
	$targets = array();
	foreach ( harlow_named_posts() as $name => $id ) {
		$type      = get_post_type_object( (string) get_post_type( $id ) );
		$targets[] = array(
			'name'  => (string) $name,
			'title' => html_entity_decode( get_the_title( $id ), ENT_QUOTES, 'UTF-8' ),
			'type'  => $type ? $type->labels->singular_name : '',
		);
	}
	usort(
		$targets,
		function ( $a, $b ) {
			return array( 'Page' !== $a['type'], $a['type'], strtolower( $a['title'] ) ) <=> array( 'Page' !== $b['type'], $b['type'], strtolower( $b['title'] ) );
		}
	);
	return $targets;
}

/**
 * A page's original blocks (theme/pages/), for the editor's "put back" button: the blocks
 * the installer laid down, found by the page's original name.
 *
 * @param int $post_id The page.
 * @return string '' for a page made since.
 */
function harlow_page_original( $post_id ) {
	$name = (string) get_post_meta( $post_id, '_harlow_original', true );
	return '' !== $name && 'page' === get_post_type( $post_id ) ? harlow_original_blocks( $name ) : '';
}

/**
 * "Duplicate" under a page or item in its list.
 *
 * @param array<string,string> $actions The row's links.
 * @param WP_Post              $post    The page or item.
 * @return array<string,string>
 */
function harlow_duplicate_link( $actions, $post ) {
	$type = get_post_type_object( $post->post_type );
	if ( ! in_array( $post->post_type, harlow_duplicable_types(), true ) || ! $type
		|| ! current_user_can( 'edit_post', $post->ID ) || ! current_user_can( $type->cap->create_posts ) ) {
		return $actions;
	}
	$url                         = wp_nonce_url( admin_url( 'admin.php?action=harlow_duplicate&post=' . $post->ID ), 'harlow_duplicate_' . $post->ID );
	$actions['harlow_duplicate'] = '<a href="' . esc_url( $url ) . '" aria-label="' . esc_attr(
		/* translators: %s: the page's title. */
		sprintf( __( 'Duplicate “%s”', 'harlow' ), get_the_title( $post ) )
	) . '">' . esc_html__( 'Duplicate', 'harlow' ) . '</a>';
	return $actions;
}
add_filter( 'page_row_actions', 'harlow_duplicate_link', 10, 2 );
add_filter( 'post_row_actions', 'harlow_duplicate_link', 10, 2 );

/**
 * The types whose items can be duplicated: pages, posts and the site's own types.
 *
 * @return string[]
 */
function harlow_duplicable_types() {
	return array( 'page', 'post', 'news', 'albahoo_project', 'gallery_item', 'job', 'business_model', 'harlows_person', 'team_member', 'testimonial', 'client_logo' );
}

/**
 * Make the copy: a draft with the same sections, excerpt, template, picture, fields and
 * categories, titled "(copy)", and open it in the editor. What names the original (its
 * name, its original sections, its Arabic address) and its SEO fields stay with it.
 */
function harlow_duplicate() {
	$id   = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the nonce, keyed on this id, is checked on the next line.
	$post = get_post( $id );
	check_admin_referer( 'harlow_duplicate_' . $id );
	$type = $post ? get_post_type_object( $post->post_type ) : null;
	if ( ! $post || ! $type || ! in_array( $post->post_type, harlow_duplicable_types(), true )
		|| ! current_user_can( 'edit_post', $id ) || ! current_user_can( $type->cap->create_posts ) ) {
		wp_die( esc_html__( 'This cannot be duplicated.', 'harlow' ), 403 );
	}
	$copy = wp_insert_post(
		wp_slash(
			array(
				'post_type'      => $post->post_type,
				'post_status'    => 'draft',
				/* translators: %s: the original's title. */
				'post_title'     => sprintf( __( '%s (copy)', 'harlow' ), $post->post_title ),
				'post_content'   => $post->post_content,
				'post_excerpt'   => $post->post_excerpt,
				'post_parent'    => $post->post_parent,
				'menu_order'     => $post->menu_order,
				'comment_status' => $post->comment_status,
				'ping_status'    => $post->ping_status,
			)
		),
		true
	);
	if ( is_wp_error( $copy ) ) {
		wp_die( esc_html( $copy->get_error_message() ) );
	}
	$skip = array( '_harlow_name', '_harlow_original', '_harlow_translations', '_edit_lock', '_edit_last', '_wp_old_slug', '_wp_old_date' );
	foreach ( get_post_meta( $id ) as $key => $values ) {
		if ( in_array( $key, $skip, true ) || 0 === strpos( $key, 'rank_math_' ) ) {
			continue;
		}
		foreach ( $values as $value ) {
			add_post_meta( $copy, $key, wp_slash( maybe_unserialize( $value ) ) );
		}
	}
	foreach ( get_object_taxonomies( $post->post_type ) as $taxonomy ) {
		$terms = wp_get_object_terms( $id, $taxonomy, array( 'fields' => 'ids' ) );
		if ( ! is_wp_error( $terms ) && $terms ) {
			wp_set_object_terms( $copy, $terms, $taxonomy );
		}
	}
	wp_safe_redirect( get_edit_post_link( $copy, 'raw' ) );
	exit;
}
add_action( 'admin_action_harlow_duplicate', 'harlow_duplicate' );
