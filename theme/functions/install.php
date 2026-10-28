<?php
/**
 * Installing the site from install/site.json: its pages, its menus and which page is the
 * front page and which the privacy page.
 *
 * The data file is written by _tools/seed_site.py from the reference. A page is found
 * before it is made: by the name it was installed under (kept in `_harlow_original`, which
 * survives a change of address), as the front or privacy page, then at its address. Only a
 * missing page is made, with live's id when that id is free, so that this site and live
 * print the same menus. A menu is laid down only in a location that has none. Nothing is
 * deleted, and a second run changes nothing.
 *
 * Stage 1 lays the pages down empty; their sections arrive in stage 3, and the button in
 * Appearance (Site pages) in stage 8. Until then: `wp harlow install`.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The site's data file.
 *
 * @return array<string,mixed>
 */
function harlow_site_data() {
	$file = get_theme_file_path( 'install/site.json' );
	$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
	return is_array( $data ) ? $data : array();
}

/**
 * Install everything the data file holds.
 *
 * @return array<string,int> What was done, counted.
 */
function harlow_install_site() {
	$data   = harlow_site_data();
	$report = array(
		'pages_made'  => 0,
		'pages_found' => 0,
		'ids_kept'    => 0,
		'menus_made'  => 0,
		'menus_kept'  => 0,
		'items_made'  => 0,
	);

	$ids = array();
	foreach ( $data['pages'] as $page ) {
		$ids[ $page['path'] ] = harlow_install_page( $page, $data, $report );
	}

	if ( isset( $ids[ $data['front_page'] ] ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $ids[ $data['front_page'] ] );
	}
	if ( isset( $ids[ $data['privacy_page'] ] ) ) {
		update_option( 'wp_page_for_privacy_policy', $ids[ $data['privacy_page'] ] );
	}

	$locations = get_theme_mod( 'nav_menu_locations', array() );
	foreach ( $data['menus'] as $menu ) {
		if ( ! empty( $locations[ $menu['location'] ] ) && wp_get_nav_menu_object( $locations[ $menu['location'] ] ) ) {
			++$report['menus_kept'];
			continue;
		}
		$existing = wp_get_nav_menu_object( $menu['name'] );
		if ( $existing ) {
			$menu_id = (int) $existing->term_id;
			++$report['menus_kept'];
		} else {
			$menu_id = (int) wp_create_nav_menu( $menu['name'] );
			harlow_install_menu_items( $menu_id, $menu['items'], 0, $ids, $report );
			++$report['menus_made'];
		}
		$locations[ $menu['location'] ] = $menu_id;
	}
	set_theme_mod( 'nav_menu_locations', $locations );

	return $report;
}

/**
 * Find a page of the data file, or make it.
 *
 * @param array<string,mixed> $page   The page's entry in the data file.
 * @param array<string,mixed> $data   The whole data file.
 * @param array<string,int>   $report Counts, updated.
 * @return int The page's id.
 */
function harlow_install_page( $page, $data, &$report ) {
	$id = harlow_find_page( $page, $data );
	if ( $id ) {
		++$report['pages_found'];
		if ( $page['path'] === $data['privacy_page'] && 'publish' !== get_post_status( $id ) ) {
			// WordPress's own draft privacy page, adopted: it becomes the site's, at live's address.
			wp_update_post(
				wp_slash(
					array(
						'ID'          => $id,
						'post_title'  => $page['title'],
						'post_name'   => trim( $page['path'], '/' ),
						'post_status' => 'publish',
					)
				)
			);
		}
	} else {
		$free = ! get_post( (int) $page['live_id'] );
		$id   = wp_insert_post(
			wp_slash(
				array(
					'import_id'   => $free ? (int) $page['live_id'] : 0,
					'post_type'   => 'page',
					'post_status' => 'publish',
					'post_title'  => $page['title'],
					'post_name'   => '/' === $page['path'] ? 'home-page' : trim( $page['path'], '/' ),
				)
			)
		);
		++$report['pages_made'];
		if ( (int) $page['live_id'] === (int) $id ) {
			++$report['ids_kept'];
		}
	}
	update_post_meta( $id, '_harlow_original', $page['name'] );
	update_post_meta( $id, '_harlow_translations', $page['translations'] );
	update_post_meta( $id, '_harlow_documents', $page['documents'] );
	return (int) $id;
}

/**
 * The page a data file entry already is, if any.
 *
 * @param array<string,mixed> $page The page's entry in the data file.
 * @param array<string,mixed> $data The whole data file.
 * @return int 0 when the page has to be made.
 */
function harlow_find_page( $page, $data ) {
	$found = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'any',
			'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the installer, run once, not a page view.
			'meta_value'     => $page['name'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	if ( $found ) {
		return (int) $found[0];
	}
	if ( $page['path'] === $data['front_page'] && 'page' === get_option( 'show_on_front' ) ) {
		return (int) get_option( 'page_on_front' );
	}
	if ( $page['path'] === $data['privacy_page'] && get_option( 'wp_page_for_privacy_policy' ) ) {
		return (int) get_option( 'wp_page_for_privacy_policy' );
	}
	$at_address = get_page_by_path( trim( $page['path'], '/' ) );
	return $at_address ? (int) $at_address->ID : 0;
}

/**
 * Lay down a menu's items, with live's ids where they are free.
 *
 * @param int               $menu_id   Menu (term) id.
 * @param array<int,mixed>  $items     Items of the data file.
 * @param int               $parent_id Parent item's id, 0 at the top.
 * @param array<string,int> $ids       Page ids by path.
 * @param array<string,int> $report    Counts, updated.
 */
function harlow_install_menu_items( $menu_id, $items, $parent_id, $ids, &$report ) {
	$position = 1;
	foreach ( $items as $item ) {
		$args = array(
			'menu-item-title'     => $item['title'],
			'menu-item-status'    => 'publish',
			'menu-item-parent-id' => $parent_id,
			'menu-item-position'  => $position++,
		);
		if ( isset( $item['page'] ) ) {
			$args['menu-item-type']      = 'post_type';
			$args['menu-item-object']    = 'page';
			$args['menu-item-object-id'] = $ids[ $item['page'] ];
		} else {
			$args['menu-item-type'] = 'custom';
			$args['menu-item-url']  = isset( $item['path'] ) ? home_url( $item['path'] ) : $item['url'];
		}

		// Reserve live's id, so the item prints live's menu-item-<id> class.
		$item_id = 0;
		if ( ! empty( $item['live_id'] ) && ! get_post( (int) $item['live_id'] ) ) {
			$item_id = (int) wp_insert_post(
				array(
					'import_id'   => (int) $item['live_id'],
					'post_type'   => 'nav_menu_item',
					'post_status' => 'draft',
				)
			);
		}
		$item_id = (int) wp_update_nav_menu_item( $menu_id, $item_id, $args );
		++$report['items_made'];

		if ( ! empty( $item['children'] ) ) {
			harlow_install_menu_items( $menu_id, $item['children'], $item_id, $ids, $report );
		}
	}
}

/**
 * `wp harlow install`: install the site and say what was done.
 */
function harlow_cli_install() {
	$report = harlow_install_site();
	WP_CLI::success(
		sprintf(
			'pages: %d made (%d with live\'s id), %d found; menus: %d made (%d items), %d kept',
			$report['pages_made'],
			$report['ids_kept'],
			$report['pages_found'],
			$report['menus_made'],
			$report['items_made'],
			$report['menus_kept']
		)
	);
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'harlow install', 'harlow_cli_install' );
}
