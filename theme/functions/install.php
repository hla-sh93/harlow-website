<?php
/**
 * Installing the site from the data files in install/: its pages, pictures, forms, items,
 * menus and SEO, and which page is the front page and which the privacy page.
 *
 * The data files, each written from the reference by a tool:
 *
 *   site.json   pages and menus (_tools/seed_site.py, from the reference)
 *   media.json  the pictures: file, size, every size WordPress made (_tools/seed_items.py)
 *   items.json  posts, news, projects, gallery items, the job, business models, people,
 *               testimonials and client logos (_tools/seed_items.py)
 *   forms.json  live's two Contact Form 7 forms (_tools/seed_forms.py)
 *   seo.json    each page's Rank Math fields and the site's (_tools/seed_seo.py, from
 *               live's heads)
 *   ../pages/   each page's blocks, its "original" (_tools/gen_blocks.py), and the major
 *               clients' blocks, the synced pattern every page shows
 *
 * The same installer runs from Appearance > Site pages (functions/site-pages.php) and from
 * `wp harlow install`. It works in rounds: the work is cut into small units (one page, one
 * picture, one item, ...) done in order, and a round does units until its time is up and
 * keeps its place (option harlow_install_run), so no request outlasts a host's time limit;
 * Rank Math makes each save slow. The dashboard runs 15-second rounds, WP-CLI one long one.
 *
 * Everything is found before it is made, so the installer fills a site that already has
 * the pages (live, or a copy of it) in place: a page by the name it was installed under,
 * as the front or privacy page, at its address, then as an unpublished page with its slug;
 * an item or form by its original, then by live's id, then by its slug. Only what is
 * missing is made, with live's id where that id is free. A page gets its blocks when it has
 * no content; a page with content of its own (Elementor's, on live) is left alone unless
 * the owner asks for it to be replaced, and then its content is kept as a revision. Posts
 * and items keep their texts, nothing is deleted, SEO fields and settings are written only
 * where empty (or as Rank Math leaves them by default), menus only where none is. A second
 * run changes nothing.
 *
 * A picture goes into the Media Library as it is on live: the same files at the same
 * address under uploads/, the same id, the same sizes. They are copied from the theme's
 * assets/uploads/; nothing is made again, so WordPress prints the srcset live prints.
 *
 * `--restore` puts every page's original back (and the major clients', the items' texts,
 * the kinds, the SEO and live's dates), the developer's way back to the installed site.
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
	static $cache = array();
	if ( ! isset( $cache[ $name ] ) ) {
		$file           = get_theme_file_path( 'install/' . $name );
		$data           = file_exists( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
		$cache[ $name ] = is_array( $data ) ? $data : array();
	}
	return $cache[ $name ];
}

/**
 * The installer's steps, in the order they run: pages first (items and menus link to
 * them), pictures before items (featured pictures), menus last (their items take live's
 * ids after everything else was made).
 *
 * @return string[]
 */
function harlow_install_steps() {
	return array( 'pages', 'media', 'forms', 'items', 'shared', 'blocks', 'seo', 'menus', 'finish' );
}

/**
 * How many units a step has.
 *
 * @param string $step A step of harlow_install_steps().
 * @return int
 */
function harlow_install_units( $step ) {
	switch ( $step ) {
		case 'pages':
		case 'blocks':
			return count( harlow_site_data()['pages'] );
		case 'media':
			return count( harlow_site_data( 'media.json' )['media'] );
		case 'items':
			return count( harlow_site_data( 'items.json' )['items'] ) + 1; // The categories, then each item.
		default:
			return 1;
	}
}

/**
 * The run under way (its place, options, counts and what it made), by reference.
 *
 * @return array<string,mixed>
 */
function &harlow_install_state() {
	static $run = array();
	return $run;
}

/**
 * Start a run.
 *
 * @param array<string,bool> $options restore: put the originals back; replace: replace
 *                                    pages' own content (kept as a revision).
 * @return array<string,mixed> The run.
 */
function harlow_install_start( $options = array() ) {
	$run = array(
		'options' => array(
			'restore' => ! empty( $options['restore'] ),
			'replace' => ! empty( $options['replace'] ),
		),
		'step'    => 0,
		'unit'    => 0,
		'rounds'  => 0,
		'done'    => false,
		'fresh'   => array(),
		'report'  => array_fill_keys(
			array( 'pages_made', 'pages_found', 'ids_kept', 'filled', 'replaced', 'media_made', 'media_found', 'files', 'forms_made', 'forms_found', 'posts_made', 'posts_found', 'menus_made', 'menus_kept', 'items_made', 'shared', 'seo' ),
			0
		),
	);
	update_option( 'harlow_install_run', $run, false );
	return $run;
}

/**
 * One round: units in order until the time is up or the run is done; the place is kept.
 *
 * @param int $seconds How long the round may work; 0 for no limit.
 * @return array<string,mixed> The run.
 */
function harlow_install_round( $seconds = 15 ) {
	$run = &harlow_install_state();
	$run = get_option( 'harlow_install_run' );
	if ( ! is_array( $run ) ) {
		$run = harlow_install_start();
	}
	if ( $run['done'] ) {
		return $run;
	}
	// The installer's own writes are not edits to go back to: no revisions, whose ids would
	// also take live's ids from the items made after them. The data is the theme's own,
	// written from live: kept as it is, not filtered as a visitor's comment would be.
	add_filter( 'wp_revisions_to_keep', '__return_zero', 99 );
	kses_remove_filters();
	$start = microtime( true );
	$steps = harlow_install_steps();
	++$run['rounds'];
	while ( ! $run['done'] && ( ! $seconds || microtime( true ) - $start < $seconds ) ) {
		$step = $steps[ $run['step'] ];
		if ( $run['unit'] >= harlow_install_units( $step ) ) {
			++$run['step'];
			$run['unit'] = 0;
			$run['done'] = $run['step'] >= count( $steps );
			continue;
		}
		harlow_install_unit( $step, $run['unit'], $run );
		++$run['unit'];
	}
	kses_init();
	remove_filter( 'wp_revisions_to_keep', '__return_zero', 99 );
	update_option( 'harlow_install_run', $run, false );
	return $run;
}

/**
 * How far a run is: units done and units in all.
 *
 * @param array<string,mixed> $run The run.
 * @return array{done: int, total: int, step: string}
 */
function harlow_install_progress( $run ) {
	$steps = harlow_install_steps();
	$done  = 0;
	$total = 0;
	foreach ( $steps as $n => $step ) {
		$units  = harlow_install_units( $step );
		$total += $units;
		if ( $n < $run['step'] ) {
			$done += $units;
		} elseif ( $n === $run['step'] ) {
			$done += min( $run['unit'], $units );
		}
	}
	return array(
		'done'  => $done,
		'total' => $total,
		'step'  => $run['done'] ? '' : $steps[ $run['step'] ],
	);
}

/**
 * Install everything in one go (WP-CLI): a run of rounds with no time limit.
 *
 * @param bool $restore Put the originals back over the owner's.
 * @return array<string,int> What was done, counted.
 */
function harlow_install_site( $restore = false ) {
	harlow_install_start( array( 'restore' => $restore ) );
	do {
		$run = harlow_install_round( 0 );
	} while ( ! $run['done'] );
	return $run['report'];
}

/**
 * One unit of a step.
 *
 * @param string              $step The step.
 * @param int                 $n    The unit's place in the step.
 * @param array<string,mixed> $run  The run, updated.
 */
function harlow_install_unit( $step, $n, &$run ) {
	$data    = harlow_site_data();
	$options = $run['options'];
	switch ( $step ) {
		case 'pages':
			$page = $data['pages'][ $n ];
			$id   = harlow_install_page( $page, $data, $run['report'] );
			if ( $page['path'] === $data['front_page'] ) {
				update_option( 'show_on_front', 'page' );
				update_option( 'page_on_front', $id );
			}
			if ( $page['path'] === $data['privacy_page'] ) {
				update_option( 'wp_page_for_privacy_policy', $id );
			}
			break;
		case 'media':
			harlow_install_picture( harlow_site_data( 'media.json' )['media'][ $n ], $run['report'] );
			break;
		case 'forms':
			harlow_install_forms( $run['report'] );
			break;
		case 'items':
			if ( 0 === $n ) {
				harlow_install_categories();
			} else {
				harlow_install_item( $n - 1, harlow_install_page_ids(), $options['restore'], $run['report'] );
			}
			break;
		case 'shared':
			harlow_install_shared_sections( $options['restore'], $run['report'] );
			break;
		case 'blocks':
			$page = $data['pages'][ $n ];
			$id   = harlow_install_page_ids()[ $page['path'] ];
			harlow_install_page_blocks( $id, $page, $options, $run['report'] );
			break;
		case 'seo':
			harlow_install_seo( harlow_install_page_ids(), $options['restore'], $run['report'] );
			break;
		case 'menus':
			harlow_install_menus( harlow_install_page_ids(), $run['report'] );
			break;
		case 'finish':
			// The content types' addresses (/news/<item>/, ...) are known to WordPress only
			// once its address rules are written again.
			flush_rewrite_rules( false );
			break;
	}
}

/**
 * The site's pages by their address in site.json, as they are found after the pages step
 * (looked for once a request).
 *
 * @return array<string,int>
 */
function harlow_install_page_ids() {
	static $ids = null;
	if ( null === $ids || in_array( 0, $ids, true ) ) {
		$data = harlow_site_data();
		$ids  = array();
		foreach ( $data['pages'] as $page ) {
			$ids[ $page['path'] ] = harlow_find_page( $page, $data );
		}
	}
	return $ids;
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
	global $wpdb;
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
			harlow_install_fresh( (int) $id );
		}
		if ( ! empty( $page['excerpt'] ) && '' === (string) get_post_field( 'post_excerpt', $id ) ) {
			// What search results show of the page: live's excerpt where it has none. Written
			// without wp_update_post(), which would write the time of an edit no one made.
			$wpdb->update( $wpdb->posts, array( 'post_excerpt' => $page['excerpt'] ), array( 'ID' => $id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- as above.
			clean_post_cache( $id );
		}
	} else {
		$free = ! get_post( (int) $page['live_id'] );
		$id   = wp_insert_post(
			wp_slash(
				array(
					'import_id'    => $free ? (int) $page['live_id'] : 0,
					'post_type'    => 'page',
					'post_status'  => 'publish',
					'post_author'  => harlow_install_author(),
					'post_title'   => $page['title'],
					'post_name'    => '/' === $page['path'] ? 'home-page' : trim( $page['path'], '/' ),
					'post_excerpt' => isset( $page['excerpt'] ) ? $page['excerpt'] : '',
				)
			)
		);
		++$report['pages_made'];
		harlow_install_fresh( (int) $id );
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
 * The page a data file entry already is, if any: by the name it was installed under, as
 * the front or privacy page, at its address, then as an unpublished page with its slug.
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
			'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the installer and its screen, not a page view.
			'meta_value'     => $page['name'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	if ( $found ) {
		return (int) $found[0];
	}
	if ( $page['path'] === $data['front_page'] && 'page' === get_option( 'show_on_front' ) && get_option( 'page_on_front' ) ) {
		return (int) get_option( 'page_on_front' );
	}
	if ( $page['path'] === $data['privacy_page'] && get_option( 'wp_page_for_privacy_policy' ) && get_post( (int) get_option( 'wp_page_for_privacy_policy' ) ) ) {
		return (int) get_option( 'wp_page_for_privacy_policy' );
	}
	if ( '/' === $page['path'] ) {
		return 0;
	}
	// get_page_by_path() looks among pictures too: only a page is the page.
	$at_address = get_page_by_path( trim( $page['path'], '/' ) );
	if ( $at_address && 'page' === $at_address->post_type && 'trash' !== $at_address->post_status ) {
		return (int) $at_address->ID;
	}
	$unpublished = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => array( 'draft', 'pending', 'private', 'future' ),
			'name'           => basename( trim( $page['path'], '/' ) ),
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	return $unpublished ? (int) $unpublished[0] : 0;
}

/**
 * Lay down the menus: in a location that has none, the menu of that name if the site has
 * one, else made with its items.
 *
 * @param array<string,int> $ids    Page ids by path.
 * @param array<string,int> $report Counts, updated.
 */
function harlow_install_menus( $ids, &$report ) {
	$locations = get_theme_mod( 'nav_menu_locations', array() );
	foreach ( harlow_site_data()['menus'] as $menu ) {
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
 * Put one picture into the Media Library, as it is on live; a picture already there under
 * its id is kept.
 *
 * @param array<string,mixed> $picture Its entry in media.json.
 * @param array<string,int>   $report  Counts, updated.
 */
function harlow_install_picture( $picture, &$report ) {
	$id = (int) $picture['id'];
	if ( 'attachment' === get_post_type( $id ) ) {
		++$report['media_found'];
		return;
	}
	$uploads = wp_upload_dir( null, false );
	$folder  = dirname( $picture['file'] );
	$names   = array( basename( $picture['file'] ) );
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
		return;
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

/**
 * An item's extra fields (a business model's icon and page, a project's description, year
 * and pictures, ...), stored as _<name>.
 *
 * @param int                 $id        The item.
 * @param array<string,mixed> $item      The item's data.
 * @param array<string,int>   $pages     Page ids by path (a card's page).
 * @param bool                $overwrite Write every field, or only those not there yet.
 */
function harlow_install_item_fields( $id, $item, $pages, $overwrite ) {
	$meta = isset( $item['meta'] ) ? $item['meta'] : array();
	foreach ( $meta as $key => $value ) {
		if ( ! $overwrite && metadata_exists( 'post', $id, '_' . $key ) ) {
			continue;
		}
		if ( 'harlow_link' === $key ) {
			$value = isset( $pages[ $value ] ) ? $pages[ $value ] : 0;
		}
		update_post_meta( $id, '_' . $key, $value );
	}
}

/**
 * Live's forms (install/forms.json) as Contact Form 7 forms under live's ids, with their
 * templates, mails and Turnstile slots. A form already there (installed before, or live's
 * own under its id) is kept as it is; it only learns where the Turnstile slot goes.
 *
 * @param array<string,int> $report Counts, updated.
 */
function harlow_install_forms( &$report ) {
	if ( ! class_exists( 'WPCF7_ContactForm' ) ) {
		return;
	}
	foreach ( harlow_site_data( 'forms.json' )['forms'] as $data ) {
		$found = get_posts(
			array(
				'post_type'      => 'wpcf7_contact_form',
				'post_status'    => 'any',
				'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the installer, not a page view.
				'meta_value'     => 'form:' . $data['id'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);
		if ( ! $found && 'wpcf7_contact_form' === get_post_type( (int) $data['id'] ) ) {
			$found = array( (int) $data['id'] );
		}
		if ( $found ) {
			add_post_meta( $found[0], '_harlow_original', 'form:' . $data['id'], true );
			add_post_meta( $found[0], '_harlow_turnstile_slot', $data['slot'], true );
			++$report['forms_found'];
			continue;
		}
		$id = wp_insert_post(
			array(
				'import_id'   => get_post( (int) $data['id'] ) ? 0 : (int) $data['id'],
				'post_type'   => 'wpcf7_contact_form',
				'post_status' => 'publish',
				'post_title'  => $data['title'],
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			continue;
		}
		update_post_meta( $id, '_locale', 'en_US' );
		$form = wpcf7_contact_form( $id );
		$form->set_properties(
			array(
				'form'     => $data['template'],
				'mail'     => array_merge(
					WPCF7_ContactFormTemplate::get_default( 'mail' ),
					$data['mail'],
					array(
						'active'        => true,
						'use_html'      => false,
						'exclude_blank' => false,
					)
				),
				'mail_2'   => WPCF7_ContactFormTemplate::get_default( 'mail_2' ),
				'messages' => WPCF7_ContactFormTemplate::get_default( 'messages' ),
			)
		);
		$form->save();
		update_post_meta( $id, '_harlow_original', 'form:' . $data['id'] );
		update_post_meta( $id, '_harlow_turnstile_slot', $data['slot'] );
		++$report['forms_made'];
	}
}

/**
 * An item's text with this site's addresses: live's picture files become this site's
 * (the Media Library holds them at the same paths), and links to live's pages lead to
 * this site's (the same paths); links to the Arabic pages stay on live, as the reference
 * has them.
 *
 * @param string $html The text as live printed it.
 * @param string $live Live's address (https://www.example.com).
 * @return string
 */
function harlow_local_content( $html, $live ) {
	$uploads = trailingslashit( wp_upload_dir()['baseurl'] );
	foreach ( array_unique( array( $live, str_replace( '://www.', '://', $live ) ) ) as $site ) {
		$html = str_replace( $site . '/wp-content/uploads/', $uploads, $html );
		$html = (string) preg_replace_callback(
			'#(href=["\'])' . preg_quote( $site, '#' ) . '(/(?!ar/)[^"\']*)#',
			static function ( $m ) {
				return $m[1] . home_url( $m[2] );
			},
			$html
		);
	}
	return $html;
}

/**
 * The files an item's text shows that are not in the Media Library (pictures put in the
 * text by address), copied from the theme's copy of live's uploads to the same path.
 *
 * @param string $html The item's text, with this site's addresses.
 */
function harlow_install_content_files( $html ) {
	$uploads = wp_upload_dir();
	$base    = trailingslashit( $uploads['baseurl'] );
	if ( ! preg_match_all( '#' . preg_quote( $base, '#' ) . '([^"\'\s,?]+)#', $html, $found ) ) {
		return;
	}
	foreach ( array_unique( $found[1] ) as $rel ) {
		$rel  = rawurldecode( $rel );
		$to   = trailingslashit( $uploads['basedir'] ) . $rel;
		$from = get_theme_file_path( 'assets/uploads/' . $rel );
		if ( ! file_exists( $to ) && file_exists( $from ) && false === strpos( $rel, '..' ) ) {
			wp_mkdir_p( dirname( $to ) );
			copy( $from, $to );
		}
	}
}

/**
 * Every category live has, those without posts too (their page answers, as on live).
 */
function harlow_install_categories() {
	$data = harlow_site_data( 'items.json' );
	foreach ( isset( $data['categories'] ) ? $data['categories'] : array() as $category ) {
		if ( ! get_term_by( 'slug', $category['slug'], 'category' ) ) {
			wp_insert_term( $category['name'], 'category', array( 'slug' => $category['slug'] ) );
		}
	}
}

/**
 * The item a data file entry already is: by its original, then live's item under live's
 * id or at its slug (a site shaped like live), which is adopted as it is.
 *
 * @param array<string,mixed> $item     The item's data.
 * @param string              $original Its original (type:live id).
 * @return int 0 when the item has to be made.
 */
function harlow_find_item( $item, $original ) {
	$found = get_posts(
		array(
			'post_type'      => $item['type'],
			'post_status'    => 'any',
			'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the installer and its screen, not a page view.
			'meta_value'     => $original, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	if ( $found ) {
		return (int) $found[0];
	}
	$live = $item['live_id'] ? get_post( (int) $item['live_id'] ) : null;
	if ( $live && $item['type'] === $live->post_type && 'trash' !== $live->post_status && rawurldecode( $live->post_name ) === rawurldecode( $item['slug'] ) ) {
		return (int) $live->ID;
	}
	if ( '' !== (string) $item['slug'] ) {
		// get_page_by_path() looks among pictures too: only an item of this type is the item.
		$at_slug = get_page_by_path( $item['slug'], OBJECT, $item['type'] );
		if ( $at_slug && $item['type'] === $at_slug->post_type && 'trash' !== $at_slug->post_status && ! get_post_meta( $at_slug->ID, '_harlow_original', true ) ) {
			return (int) $at_slug->ID;
		}
	}
	return 0;
}

/**
 * Lay down one item, with live's id, date and address where free. An item already there
 * keeps its text, date, picture and categories; the fields it has not got are added.
 *
 * @param int               $n       The item's place in items.json.
 * @param array<string,int> $pages   Page ids by path.
 * @param bool              $restore Put the item's text back as it came.
 * @param array<string,int> $report  Counts, updated.
 */
function harlow_install_item( $n, $pages, $restore, &$report ) {
	$data            = harlow_site_data( 'items.json' );
	$item            = $data['items'][ $n ];
	$item['content'] = harlow_local_content( $item['content'], $data['site'] );
	harlow_install_content_files( $item['content'] );
	$original = $item['type'] . ':' . ( $item['live_id'] ? $item['live_id'] : 'n' . $n );
	$id       = harlow_find_item( $item, $original );
	if ( $id ) {
		harlow_install_item_fields( $id, $item, $pages, false );
		add_post_meta( $id, '_harlow_original', $original, true );
		if ( ! empty( $item['name'] ) ) {
			add_post_meta( $id, '_harlow_name', $item['name'], true );
		}
		if ( $item['translations'] ) {
			add_post_meta( $id, '_harlow_translations', $item['translations'], true );
		}
		if ( $item['documents'] ) {
			add_post_meta( $id, '_harlow_documents', $item['documents'], true );
		}
		if ( $restore ) {
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $id,
						'post_content' => $item['content'],
					)
				)
			);
		}
		++$report['posts_found'];
		return;
	}
	$id = wp_insert_post(
		wp_slash(
			array(
				'import_id'     => ( $item['live_id'] && ! get_post( (int) $item['live_id'] ) ) ? (int) $item['live_id'] : 0,
				'post_type'     => $item['type'],
				'post_status'   => 'publish',
				'post_title'    => $item['title'],
				'post_author'   => harlow_install_author(),
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
		return;
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
	harlow_install_item_fields( $id, $item, $pages, true );
	harlow_install_fresh( (int) $id );
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

/**
 * One file of pages/: a page's original blocks, the major clients' synced pattern named by
 * its id on this site (live's 5532, unless that id was taken).
 *
 * @param string $name The page's reference name, or _major-clients.
 * @return string '' when the theme has no such file.
 */
function harlow_original_blocks( $name ) {
	$file = get_theme_file_path( 'pages/' . $name . '.html' );
	if ( ! file_exists( $file ) ) {
		return '';
	}
	return harlow_with_shared_section( (string) file_get_contents( $file ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
}

/**
 * Blocks of the theme's files with the major clients' synced pattern named by its id on
 * this site: live's 5532, unless that id was taken (on live, by Elementor's template).
 *
 * @param string $blocks Blocks naming the pattern {"ref":5532}.
 * @return string
 */
function harlow_with_shared_section( $blocks ) {
	$shared = harlow_shared_section_id();
	return $shared && 5532 !== $shared ? str_replace( '{"ref":5532}', '{"ref":' . $shared . '}', $blocks ) : $blocks;
}

/**
 * The major clients' synced pattern on this site: the one installed (its original is
 * _major-clients), or live's id 5532 when that is a synced pattern.
 *
 * @return int 0 when there is none yet.
 */
function harlow_shared_section_id() {
	static $known = 0;
	if ( $known ) {
		return $known;
	}
	$found = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'any',
			'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one small query.
			'meta_value'     => '_major-clients', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	if ( $found ) {
		$known = (int) $found[0];
	} elseif ( 'wp_block' === get_post_type( 5532 ) ) {
		$known = 5532;
	}
	return $known;
}

/**
 * The author of what the installer makes: the site's first administrator (WP-CLI runs as
 * no user, and Rank Math prints a post's author in its head, as live does).
 *
 * @return int
 */
function harlow_install_author() {
	$ids = get_users(
		array(
			'role'    => 'administrator',
			'number'  => 1,
			'orderby' => 'ID',
			'fields'  => 'ID',
		)
	);
	return $ids ? (int) $ids[0] : 0;
}

/**
 * The pages and items made in this run: they get live's dates once their content is laid.
 *
 * @param int $id A post made now; 0 to read the list.
 * @return int[]
 */
function harlow_install_fresh( $id = 0 ) {
	$run = &harlow_install_state();
	if ( ! isset( $run['fresh'] ) ) {
		$run['fresh'] = array();
	}
	if ( $id ) {
		$run['fresh'][] = $id;
	}
	return $run['fresh'];
}

/**
 * Rank Math, as live's heads show it (install/seo.json): the site's settings (the
 * organization and its address, map position, logo, e-mail, telephone and social
 * profiles; the website's name; the facebook page; the about and contact pages; the
 * robots every page says; no article schema on pages; Rank Math's Local SEO module, which
 * prints the organization's address and place) where Rank Math has none of its own (empty,
 * or as it leaves them by default), all of them with --restore; each page's and item's own
 * fields (title, description, focus keyword, social picture, its own schema) where it has
 * none yet; and live's dates on what was made now (or every page and item with
 * --restore), which the head prints.
 *
 * @param array<string,int> $ids     The pages, by their address in site.json.
 * @param bool              $restore Put live's back over the owner's.
 * @param array<string,int> $report  Counts, updated.
 */
function harlow_install_seo( $ids, $restore, &$report ) {
	global $wpdb;
	$data = harlow_site_data( 'seo.json' );
	if ( ! $data || ! defined( 'RANK_MATH_VERSION' ) ) {
		return;
	}
	$named = array();
	foreach ( harlow_site_data()['pages'] as $page ) {
		$named[ $page['name'] ] = isset( $ids[ $page['path'] ] ) ? (int) $ids[ $page['path'] ] : 0;
	}
	$named += harlow_named_posts();

	$site   = $data['site'];
	$titles = (array) get_option( 'rank-math-options-titles', array() );
	$blog   = get_bloginfo( 'name' );
	// Each setting with the values Rank Math leaves in it by itself: those are not the owner's.
	$settings = array(
		'knowledgegraph_type'          => array( 'company', array( 'person' ) ),
		'knowledgegraph_name'          => array( $site['name'], array( $blog ) ),
		'website_name'                 => array( $site['website_name'], array( $blog ) ),
		'local_business_type'          => array( 'Organization', array( 'Organization' ) ),
		'knowledgegraph_logo'          => array( (string) wp_get_attachment_url( (int) $site['logo']['id'] ), array() ),
		'knowledgegraph_logo_id'       => array( (int) $site['logo']['id'], array() ),
		'url'                          => array( untrailingslashit( home_url() ), array() ),
		'email'                        => array( $site['email'], array() ),
		'phone_numbers'                => array( $site['phones'], array() ),
		'local_address'                => array( $site['address'], array() ),
		'geo'                          => array( $site['geo'], array() ),
		'social_url_facebook'          => array( $site['facebook'], array() ),
		'social_additional_profiles'   => array( implode( "\n", $site['profiles'] ), array() ),
		'local_seo_about_page'         => array( isset( $named[ $site['about_page'] ] ) ? $named[ $site['about_page'] ] : 0, array() ),
		'local_seo_contact_page'       => array( isset( $named[ $site['contact_page'] ] ) ? $named[ $site['contact_page'] ] : 0, array() ),
		'robots_global'                => array( $site['robots'], array() ),
		'pt_page_default_rich_snippet' => array( $site['page_schema'], array( 'article' ) ),
	);
	$changed  = false;
	foreach ( $settings as $key => $setting ) {
		$now = isset( $titles[ $key ] ) ? $titles[ $key ] : '';
		if ( $restore || empty( $now ) || in_array( $now, $setting[1], true ) ) {
			$changed        = $changed || $now !== $setting[0];
			$titles[ $key ] = $setting[0];
		}
	}
	if ( $changed ) {
		update_option( 'rank-math-options-titles', $titles );
	}
	if ( class_exists( 'RankMath\Helper' ) && ! in_array( 'local-seo', (array) get_option( 'rank_math_modules', array() ), true ) ) {
		RankMath\Helper::update_modules( array( 'local-seo' => 'on' ) );
	}

	$uploads = trailingslashit( wp_upload_dir()['baseurl'] );
	$fresh   = harlow_install_fresh();
	foreach ( $data['pages'] as $name => $fields ) {
		$id = isset( $named[ $name ] ) ? (int) $named[ $name ] : 0;
		if ( ! $id ) {
			continue;
		}
		$meta = array();
		if ( isset( $fields['title'] ) ) {
			$meta['rank_math_title'] = $fields['title'];
		}
		if ( isset( $fields['description'] ) ) {
			$meta['rank_math_description'] = $fields['description'];
		}
		if ( isset( $fields['focus'] ) ) {
			$meta['rank_math_focus_keyword'] = $fields['focus'];
		}
		if ( isset( $fields['image'] ) ) {
			$meta['rank_math_facebook_image']    = $uploads . $fields['image']['file'];
			$meta['rank_math_facebook_image_id'] = (int) $fields['image']['id'];
		}
		foreach ( isset( $fields['schema'] ) ? $fields['schema'] : array() as $node ) {
			$meta[ 'rank_math_schema_' . $node['@type'] ] = array_merge(
				$node,
				array(
					'metadata' => array(
						'title'     => $node['@type'],
						'type'      => 'template',
						'isPrimary' => true,
					),
				)
			);
		}
		$given = false;
		foreach ( $meta as $key => $value ) {
			if ( $restore || ! metadata_exists( 'post', $id, $key ) ) {
				update_post_meta( $id, $key, wp_slash( $value ) );
				$given = true;
			}
		}
		$report['seo'] += (int) $given;
		if ( ! (int) get_post_field( 'post_author', $id ) ) {
			// Made by an earlier install without an author: the site's administrator, as above.
			$wpdb->update( $wpdb->posts, array( 'post_author' => harlow_install_author() ), array( 'ID' => $id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- wp_update_post() would also write the time of the update.
			clean_post_cache( $id );
		}
		if ( $restore || in_array( $id, $fresh, true ) ) {
			harlow_install_dates( $id, $fields );
		}
	}
}

/**
 * Live's dates on a page or item, as WordPress stores them (local and GMT).
 *
 * @param int                 $id     The page or item.
 * @param array<string,mixed> $fields Its entry in seo.json.
 */
function harlow_install_dates( $id, $fields ) {
	global $wpdb;
	$dates = array();
	if ( isset( $fields['published'] ) ) {
		$dates['post_date']     = $fields['published'][0];
		$dates['post_date_gmt'] = $fields['published'][1];
	}
	if ( isset( $fields['modified'] ) ) {
		$dates['post_modified']     = $fields['modified'][0];
		$dates['post_modified_gmt'] = $fields['modified'][1];
	}
	if ( $dates ) {
		$wpdb->update( $wpdb->posts, $dates, array( 'ID' => $id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- wp_update_post() writes the time of the update; the installer writes live's.
		clean_post_cache( $id );
	}
}

/**
 * What a page's content is, for the installer and its screen.
 *
 * @param int $id The page; 0 for one not there yet.
 * @return string missing | empty | ours (the theme's blocks) | theirs (content of its own).
 */
function harlow_page_content_state( $id ) {
	if ( ! $id ) {
		return 'missing';
	}
	$content = trim( (string) get_post_field( 'post_content', $id ) );
	if ( '' === $content ) {
		return 'empty';
	}
	return 0 === strpos( $content, '<!-- wp:harlow/document ' ) ? 'ours' : 'theirs';
}

/**
 * Give a page its blocks and its kind's template: an empty page; a page with content of
 * its own when the owner asks (its content kept as a revision first); every page with
 * --restore. The kind comes with the blocks (over Elementor's template, on live), and to a
 * page of the theme's that has no template; a page left as it is keeps its template.
 *
 * @param int                 $id      The page.
 * @param array<string,mixed> $page    Its entry in the data file.
 * @param array<string,bool>  $options restore, replace.
 * @param array<string,int>   $report  Counts, updated.
 */
function harlow_install_page_blocks( $id, $page, $options, &$report ) {
	$blocks = harlow_original_blocks( $page['name'] );
	$state  = harlow_page_content_state( $id );
	$fill   = '' !== $blocks && ( 'empty' === $state || $options['restore'] || ( 'theirs' === $state && $options['replace'] ) );
	if ( $fill && 'theirs' === $state ) {
		// The page's own content stays in its history (Revisions), the owner's way back.
		remove_filter( 'wp_revisions_to_keep', '__return_zero', 99 );
		wp_save_post_revision( $id );
		add_filter( 'wp_revisions_to_keep', '__return_zero', 99 );
		++$report['replaced'];
	}
	if ( $fill ) {
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
	$template = (string) get_page_template_slug( $id );
	if ( ! empty( $page['kind'] ) && ( $fill || ( '' === $template && 'theirs' !== $state ) ) ) {
		update_post_meta( $id, '_wp_page_template', 'kind-' . strtolower( $page['kind'] ) );
	}
}

/**
 * The major clients: one synced pattern (Appearance > Patterns), live's saved template
 * #5532 (under that id where it is free), which every page shows; edited once, it changes
 * on every page.
 *
 * @param bool              $restore Put its original blocks back.
 * @param array<string,int> $report  Counts, updated.
 */
function harlow_install_shared_sections( $restore, &$report ) {
	$blocks = harlow_original_blocks( '_major-clients' );
	if ( '' === $blocks ) {
		return;
	}
	$id = harlow_shared_section_id();
	if ( $id ) {
		add_post_meta( $id, '_harlow_original', '_major-clients', true );
		if ( $restore ) {
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $id,
						'post_content' => $blocks,
					)
				)
			);
			++$report['shared'];
		}
		return;
	}
	$id = wp_insert_post(
		wp_slash(
			array(
				'import_id'    => get_post( 5532 ) ? 0 : 5532,
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => __( 'Major clients', 'harlow' ),
				'post_content' => $blocks,
			)
		),
		true
	);
	if ( ! is_wp_error( $id ) ) {
		update_post_meta( $id, '_harlow_original', '_major-clients' );
		++$report['shared'];
	}
}

/**
 * `wp harlow install [--restore]`: install the site and say what was done.
 *
 * @param string[]             $args       Positional arguments (none).
 * @param array<string,string> $assoc_args `--restore` to put the pages' originals back.
 */
function harlow_cli_install( $args = array(), $assoc_args = array() ) {
	$report = harlow_install_site( isset( $assoc_args['restore'] ) );
	WP_CLI::success( harlow_install_summary( $report ) );
}

/**
 * What a run did, in one sentence.
 *
 * @param array<string,int> $report The run's counts.
 * @return string
 */
function harlow_install_summary( $report ) {
	return sprintf(
		'pages: %d made (%d with live\'s id), %d found, %d filled with their blocks (%d replaced, kept as revisions); pictures: %d made (%d files), %d found; forms: %d made, %d found; items: %d made, %d found; menus: %d made (%d items), %d kept; the major clients\' pattern: %d made or put back; SEO: %d pages and items given theirs',
		$report['pages_made'],
		$report['ids_kept'],
		$report['pages_found'],
		$report['filled'],
		$report['replaced'],
		$report['media_made'],
		$report['files'],
		$report['media_found'],
		$report['forms_made'],
		$report['forms_found'],
		$report['posts_made'],
		$report['posts_found'],
		$report['menus_made'],
		$report['items_made'],
		$report['menus_kept'],
		$report['shared'],
		$report['seo']
	);
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'harlow install', 'harlow_cli_install' );
}
