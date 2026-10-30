<?php
/**
 * Installing the site from the data files in install/: its pages, menus, pictures and
 * items, and which page is the front page and which the privacy page.
 *
 * The data files, each written from the reference by a tool:
 *
 *   site.json   pages and menus (_tools/seed_site.py, from the reference)
 *   media.json  the pictures: file, size, every size WordPress made (_tools/seed_items.py)
 *   items.json  posts, news, projects, gallery items, the job, business models, people,
 *               testimonials and client logos (_tools/seed_items.py)
 *   ../pages/   each page's blocks, its "original" (_tools/gen_blocks.py), and the major
 *               clients' blocks, the synced pattern every page shows
 *
 * A picture goes into the Media Library as it is on live: the same files at the same
 * address under uploads/, the same id, the same sizes. They are copied from the theme's
 * assets/uploads/; nothing is made again, so WordPress prints the srcset live prints.
 *
 * A page is found
 * before it is made: by the name it was installed under (kept in `_harlow_original`, which
 * survives a change of address), as the front or privacy page, then at its address. Only a
 * missing page is made, with live's id when that id is free, so that this site and live
 * print the same menus. A menu is laid down only in a location that has none. Nothing is
 * deleted, and a second run changes nothing.
 *
 * An item is found the same way (`_harlow_original` is its type and live id), and made
 * with live's id, date and address when missing.
 *
 * A page gets its original's blocks when it has no content of its own; `--restore` puts
 * every page's original back (and the major clients'), as "Restore the original sections"
 * will for one page (stage 6). The button in Appearance (Site pages) comes in stage 8.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * One of the site's data files.
 *
 * @param string $name File name inside install/.
 * @return array<string,mixed>
 */
function harlow_site_data( $name = 'site.json' ) {
	$file = get_theme_file_path( 'install/' . $name );
	$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
	return is_array( $data ) ? $data : array();
}

/**
 * Install everything the data files hold.
 *
 * @param bool $restore Put every page's original blocks back over its own content.
 * @return array<string,int> What was done, counted.
 */
function harlow_install_site( $restore = false ) {
	$data   = harlow_site_data();
	$report = array(
		'pages_made'  => 0,
		'pages_found' => 0,
		'ids_kept'    => 0,
		'menus_made'  => 0,
		'menus_kept'  => 0,
		'items_made'  => 0,
		'media_made'  => 0,
		'media_found' => 0,
		'files'       => 0,
		'posts_made'  => 0,
		'posts_found' => 0,
		'filled'      => 0,
	);

	// The data is the theme's own, written from live: kept as it is, not filtered as a
	// visitor's comment would be.
	kses_remove_filters();

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

	harlow_install_media( $report );
	harlow_install_items( $ids, $report );
	harlow_install_shared_sections( $restore, $report );
	foreach ( $data['pages'] as $page ) {
		harlow_install_page_blocks( $ids[ $page['path'] ], $page['name'], $restore, $report );
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
	kses_init();

	// The content types' addresses (/news/<item>/, ...) are known to WordPress only once
	// its address rules are written again.
	flush_rewrite_rules( false );

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
			// WordPress's own draft privacy page, adopted: it becomes the site's, at live's
			// address, without WordPress's suggested text (the site's own comes with the pages).
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $id,
						'post_title'   => $page['title'],
						'post_name'    => trim( $page['path'], '/' ),
						'post_status'  => 'publish',
						'post_content' => '',
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
	update_post_meta( $id, '_harlow_name', $page['name'] );
	update_post_meta( $id, '_harlow_document', (int) $page['live_id'] );
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
 * Put the pictures into the Media Library, as they are on live.
 *
 * @param array<string,int> $report Counts, updated.
 */
function harlow_install_media( &$report ) {
	$uploads = wp_upload_dir( null, false );
	foreach ( harlow_site_data( 'media.json' )['media'] as $picture ) {
		$id = (int) $picture['id'];
		if ( 'attachment' === get_post_type( $id ) ) {
			++$report['media_found'];
			continue;
		}
		$folder = dirname( $picture['file'] );
		$names  = array( basename( $picture['file'] ) );
		foreach ( $picture['sizes'] as $size ) {
			$names[] = $size['file'];
		}
		foreach ( array_unique( $names ) as $name ) {
			$from = get_theme_file_path( 'assets/uploads/' . $folder . '/' . $name );
			$to   = $uploads['basedir'] . '/' . $folder . '/' . $name;
			if ( ! file_exists( $to ) && file_exists( $from ) ) {
				wp_mkdir_p( dirname( $to ) );
				copy( $from, $to );
				++$report['files'];
			}
		}
		$id = wp_insert_attachment(
			array(
				'import_id'      => get_post( $id ) ? 0 : $id,
				'post_mime_type' => $picture['mime'],
				'post_title'     => $picture['title'],
				'post_status'    => 'inherit',
				'post_date'      => str_replace( 'T', ' ', $picture['date'] ),
				'guid'           => $uploads['baseurl'] . '/' . $picture['file'],
			),
			$uploads['basedir'] . '/' . $picture['file'],
			0,
			true
		);
		if ( is_wp_error( $id ) ) {
			continue;
		}
		wp_update_attachment_metadata(
			$id,
			array(
				'width'      => (int) $picture['width'],
				'height'     => (int) $picture['height'],
				'file'       => $picture['file'],
				'sizes'      => $picture['sizes'],
				'image_meta' => array(),
			)
		);
		if ( '' !== $picture['alt'] ) {
			update_post_meta( $id, '_wp_attachment_image_alt', $picture['alt'] );
		}
		++$report['media_made'];
	}
}

/**
 * Lay down the items, with live's ids, dates and addresses where free.
 *
 * @param array<string,int> $pages  Page ids by path.
 * @param array<string,int> $report Counts, updated.
 */
function harlow_install_items( $pages, &$report ) {
	foreach ( harlow_site_data( 'items.json' )['items'] as $n => $item ) {
		$original = $item['type'] . ':' . ( $item['live_id'] ? $item['live_id'] : 'n' . $n );
		$found    = get_posts(
			array(
				'post_type'      => $item['type'],
				'post_status'    => 'any',
				'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the installer, run once, not a page view.
				'meta_value'     => $original, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);
		if ( $found ) {
			++$report['posts_found'];
			continue;
		}
		$id = wp_insert_post(
			wp_slash(
				array(
					'import_id'     => ( $item['live_id'] && ! get_post( (int) $item['live_id'] ) ) ? (int) $item['live_id'] : 0,
					'post_type'     => $item['type'],
					'post_status'   => 'publish',
					'post_title'    => $item['title'],
					'post_name'     => $item['slug'],
					'post_content'  => $item['content'],
					'post_date'     => str_replace( 'T', ' ', $item['date'] ),
					'post_date_gmt' => str_replace( 'T', ' ', $item['date_gmt'] ),
					'menu_order'    => isset( $item['menu_order'] ) ? (int) $item['menu_order'] : 0,
				)
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			continue;
		}
		if ( $item['categories'] ) {
			$terms = array();
			foreach ( $item['categories'] as $category ) {
				$term = get_term_by( 'slug', $category['slug'], 'category' );
				if ( ! $term ) {
					$made = wp_insert_term( $category['name'], 'category', array( 'slug' => $category['slug'] ) );
					$term = is_wp_error( $made ) ? null : get_term( $made['term_id'], 'category' );
				}
				if ( $term ) {
					$terms[] = (int) $term->term_id;
				}
			}
			wp_set_post_categories( $id, $terms );
		}
		if ( $item['featured'] && 'attachment' === get_post_type( (int) $item['featured'] ) ) {
			set_post_thumbnail( $id, (int) $item['featured'] );
		}
		$meta = isset( $item['meta'] ) ? $item['meta'] : array();
		foreach ( $meta as $key => $value ) {
			if ( 'harlow_link' === $key ) {
				$value = isset( $pages[ $value ] ) ? $pages[ $value ] : 0;
			}
			update_post_meta( $id, '_' . $key, $value );
		}
		update_post_meta( $id, '_harlow_original', $original );
		if ( ! empty( $item['name'] ) ) {
			update_post_meta( $id, '_harlow_name', $item['name'] );
		}
		if ( $item['translations'] ) {
			update_post_meta( $id, '_harlow_translations', $item['translations'] );
		}
		if ( $item['documents'] ) {
			update_post_meta( $id, '_harlow_documents', $item['documents'] );
		}
		++$report['posts_made'];
	}
}

/**
 * One file of pages/: a page's original blocks.
 *
 * @param string $name The page's reference name, or _major-clients.
 * @return string '' when the theme has no such file.
 */
function harlow_original_blocks( $name ) {
	$file = get_theme_file_path( 'pages/' . $name . '.html' );
	return file_exists( $file ) ? (string) file_get_contents( $file ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
}

/**
 * Give a page its original blocks: when it has no content of its own, or when asked to.
 *
 * @param int               $id      The page.
 * @param string            $name    Its reference name.
 * @param bool              $restore Put the original back over the page's own content.
 * @param array<string,int> $report  Counts, updated.
 */
function harlow_install_page_blocks( $id, $name, $restore, &$report ) {
	$blocks = harlow_original_blocks( $name );
	if ( '' === $blocks || ( ! $restore && '' !== trim( (string) get_post_field( 'post_content', $id ) ) ) ) {
		return;
	}
	wp_update_post(
		wp_slash(
			array(
				'ID'           => $id,
				'post_content' => $blocks,
			)
		)
	);
	++$report['filled'];
}

/**
 * The major clients: one synced pattern (Appearance > Patterns), live's saved template
 * #5532, which every page shows; edited once, it changes on every page.
 *
 * @param bool              $restore Put its original blocks back.
 * @param array<string,int> $report  Counts, updated.
 */
function harlow_install_shared_sections( $restore, &$report ) {
	$blocks = harlow_original_blocks( '_major-clients' );
	if ( '' === $blocks ) {
		return;
	}
	$existing = get_post( 5532 );
	if ( $existing && 'wp_block' === $existing->post_type ) {
		if ( $restore ) {
			wp_update_post(
				wp_slash(
					array(
						'ID'           => 5532,
						'post_content' => $blocks,
					)
				)
			);
			++$report['filled'];
		}
		return;
	}
	wp_insert_post(
		wp_slash(
			array(
				'import_id'    => $existing ? 0 : 5532,
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => __( 'Major clients', 'harlow' ),
				'post_content' => $blocks,
			)
		)
	);
	++$report['filled'];
}

/**
 * `wp harlow install [--restore]`: install the site and say what was done.
 *
 * @param string[]             $args       Positional arguments (none).
 * @param array<string,string> $assoc_args `--restore` to put the pages' originals back.
 */
function harlow_cli_install( $args = array(), $assoc_args = array() ) {
	$report = harlow_install_site( isset( $assoc_args['restore'] ) );
	WP_CLI::success(
		sprintf(
			'pages: %d made (%d with live\'s id), %d found, %d filled with their blocks; pictures: %d made (%d files), %d found; items: %d made, %d found; menus: %d made (%d items), %d kept',
			$report['pages_made'],
			$report['ids_kept'],
			$report['pages_found'],
			$report['filled'],
			$report['media_made'],
			$report['files'],
			$report['media_found'],
			$report['posts_made'],
			$report['posts_found'],
			$report['menus_made'],
			$report['items_made'],
			$report['menus_kept']
		)
	);
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'harlow install', 'harlow_cli_install' );
}
