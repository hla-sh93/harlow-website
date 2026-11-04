<?php
/**
 * Appearance > Site pages: the installer (functions/install.php) for the owner. A table
 * says what installing will do to each of the site's pages, and how many pictures, items,
 * forms and menus are missing; one button installs, in 15-second rounds the screen asks
 * for one after another (REST: harlow/v1/install), so no request outlasts a host's time
 * limit. A page with content of its own is left alone unless the box is ticked, and then its
 * content is kept as a revision. Until every page has its sections, the dashboard says how
 * many do not.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Who may install the site's pages. */
const HARLOW_INSTALL_CAP = 'manage_options';

/**
 * The screen under Appearance.
 */
function harlow_site_pages_menu() {
	add_theme_page(
		__( 'Site pages', 'harlow' ),
		__( 'Site pages', 'harlow' ),
		HARLOW_INSTALL_CAP,
		'harlow-site-pages',
		'harlow_site_pages_screen'
	);
}
add_action( 'admin_menu', 'harlow_site_pages_menu' );

/**
 * Each of the site's pages: title, address, id here (0 if not here) and its content's state.
 *
 * @return array<int,array<string,mixed>>
 */
function harlow_site_pages_pages() {
	$data  = harlow_site_data();
	$pages = array();
	foreach ( $data['pages'] as $page ) {
		$id    = harlow_find_page( $page, $data );
		$state = harlow_page_content_state( $id );
		if ( $id && $page['path'] === $data['privacy_page'] && 'publish' !== get_post_status( $id ) ) {
			$state = 'empty'; // WordPress's draft privacy page: adopted, its suggested text left out.
		}
		$pages[] = array(
			'title' => $page['title'],
			'path'  => $page['path'],
			'id'    => $id,
			'state' => $state,
		);
	}
	return $pages;
}

/**
 * What installing will find: each page's state, and what is missing of the rest.
 *
 * @return array<string,mixed>
 */
function harlow_site_pages_status() {
	$data     = harlow_site_data();
	$pages    = harlow_site_pages_pages();
	$pictures = 0;
	$absent   = 0;
	$uploads  = wp_upload_dir( null, false );
	foreach ( harlow_site_data( 'media.json' )['media'] as $picture ) {
		$missing   = 'attachment' !== get_post_type( (int) $picture['id'] );
		$pictures += (int) $missing;
		$absent   += (int) ( $missing && ! file_exists( $uploads['basedir'] . '/' . $picture['file'] ) && ! file_exists( get_theme_file_path( 'assets/uploads/' . $picture['file'] ) ) );
	}
	$items = 0;
	foreach ( harlow_site_data( 'items.json' )['items'] as $n => $item ) {
		$items += (int) ! harlow_find_item( $item, $item['type'] . ':' . ( $item['live_id'] ? $item['live_id'] : 'n' . $n ) );
	}
	$locations = get_theme_mod( 'nav_menu_locations', array() );
	$menus     = 0;
	foreach ( $data['menus'] as $menu ) {
		$menus += (int) ( empty( $locations[ $menu['location'] ] ) || ! wp_get_nav_menu_object( $locations[ $menu['location'] ] ) );
	}
	return array(
		'pages'    => $pages,
		'pictures' => array( $pictures, count( harlow_site_data( 'media.json' )['media'] ), $absent ),
		'items'    => array( $items, count( harlow_site_data( 'items.json' )['items'] ) ),
		'menus'    => array( $menus, count( $data['menus'] ) ),
	);
}

/**
 * How many of the site's pages do not have their sections yet.
 *
 * @param array<int,array<string,mixed>> $pages harlow_site_pages_pages().
 * @return int
 */
function harlow_site_pages_waiting( $pages ) {
	return count(
		array_filter(
			$pages,
			function ( $page ) {
				return 'ours' !== $page['state'];
			}
		)
	);
}

/**
 * The screen.
 */
function harlow_site_pages_screen() {
	if ( ! current_user_can( HARLOW_INSTALL_CAP ) ) {
		return;
	}
	$status = harlow_site_pages_status();
	$now    = array(
		'missing' => __( 'Not here', 'harlow' ),
		'empty'   => __( 'Here, empty', 'harlow' ),
		'ours'    => __( 'Has its sections', 'harlow' ),
		'theirs'  => __( 'Has content of its own', 'harlow' ),
	);
	$will   = array(
		'missing' => __( 'Make it, with its sections', 'harlow' ),
		'empty'   => __( 'Give it its sections', 'harlow' ),
		'ours'    => __( 'Nothing', 'harlow' ),
		'theirs'  => __( 'Leave it as it is', 'harlow' ),
	);
	$last   = get_option( 'harlow_install_last' );
	?>
	<div class="wrap harlow-site-pages">
		<h1><?php esc_html_e( 'Site pages', 'harlow' ); ?></h1>
		<p>
			<?php esc_html_e( 'The site\'s pages, pictures, items, forms, menus and search settings, as the site was made. Installing finds what is already here and makes only what is missing. A page that has content of its own is left as it is, unless you choose to replace it; its content is then kept in its history (Revisions). Posts and items keep their texts, nothing is deleted, and installing again changes nothing.', 'harlow' ); ?>
		</p>
		<?php if ( isset( $_GET['installed'] ) && is_array( $last ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only shows the last result. ?>
			<div class="notice notice-success"><p><?php echo esc_html( $last['summary'] ); ?></p></div>
		<?php endif; ?>
		<p class="harlow-site-pages__summary">
			<?php
			echo esc_html(
				sprintf(
					/* translators: 1: pages without their sections, 2: all pages, 3: pictures missing, 4: all pictures, 5: items missing, 6: all items, 7: menus missing, 8: all menus. */
					__( 'Pages without their sections: %1$d of %2$d. Pictures missing: %3$d of %4$d. Items missing: %5$d of %6$d. Menus missing: %7$d of %8$d.', 'harlow' ),
					harlow_site_pages_waiting( $status['pages'] ),
					count( $status['pages'] ),
					$status['pictures'][0],
					$status['pictures'][1],
					$status['items'][0],
					$status['items'][1],
					$status['menus'][0],
					$status['menus'][1]
				)
			);
			?>
		</p>
		<?php if ( $status['pictures'][2] ) : ?>
			<div class="notice notice-warning inline"><p>
				<?php
				echo esc_html(
					sprintf(
						/* translators: %d: pictures whose files are not on the site yet. */
						_n( '%d picture has no file on this site yet. On a new host, unpack harlow-pictures.zip into wp-content/themes/harlow/assets/ (the host\'s File Manager or FTP), then install: the pictures are made then. Until then they are left out.', '%d pictures have no file on this site yet. On a new host, unpack harlow-pictures.zip into wp-content/themes/harlow/assets/ (the host\'s File Manager or FTP), then install: the pictures are made then. Until then they are left out.', $status['pictures'][2], 'harlow' ),
						$status['pictures'][2]
					)
				);
				?>
			</p></div>
		<?php endif; ?>
		<table class="widefat striped harlow-site-pages__table">
			<thead>
				<tr>
					<th scope="col"><?php esc_html_e( 'Page', 'harlow' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Address', 'harlow' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Now', 'harlow' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Installing will', 'harlow' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $status['pages'] as $page ) : ?>
					<tr data-state="<?php echo esc_attr( $page['state'] ); ?>">
						<td>
							<?php if ( $page['id'] ) : ?>
								<a href="<?php echo esc_url( (string) get_edit_post_link( $page['id'] ) ); ?>"><?php echo esc_html( $page['title'] ); ?></a>
							<?php else : ?>
								<?php echo esc_html( $page['title'] ); ?>
							<?php endif; ?>
						</td>
						<td><code><?php echo esc_html( $page['path'] ); ?></code></td>
						<td><?php echo esc_html( $now[ $page['state'] ] ); ?></td>
						<td class="harlow-site-pages__will"
							data-keep="<?php echo esc_attr( $will[ $page['state'] ] ); ?>"
							data-replace="<?php echo esc_attr( 'theirs' === $page['state'] ? __( 'Replace it with its sections (its content kept as a revision)', 'harlow' ) : $will[ $page['state'] ] ); ?>"><?php echo esc_html( $will[ $page['state'] ] ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<p>
			<label>
				<input type="checkbox" id="harlow-replace" />
				<?php esc_html_e( 'Also replace the content of pages that have content of their own (each one\'s content is kept as a revision)', 'harlow' ); ?>
			</label>
		</p>
		<p>
			<button type="button" class="button button-primary" id="harlow-install"><?php esc_html_e( 'Install the pages', 'harlow' ); ?></button>
		</p>
		<div class="harlow-site-pages__progress" hidden>
			<progress id="harlow-install-progress" max="100" value="0"></progress>
			<p id="harlow-install-message" role="status" aria-live="polite"></p>
		</div>
	</div>
	<?php
}

/**
 * The screen's script.
 *
 * @param string $hook The admin screen.
 */
function harlow_site_pages_assets( $hook ) {
	if ( 'appearance_page_harlow-site-pages' !== $hook ) {
		return;
	}
	$path = 'admin/site-pages.js';
	wp_enqueue_script( 'harlow-site-pages', get_theme_file_uri( $path ), array( 'wp-api-fetch', 'wp-i18n' ), harlow_asset_version( $path ), true );
	wp_set_script_translations( 'harlow-site-pages', 'harlow' );
}
add_action( 'admin_enqueue_scripts', 'harlow_site_pages_assets' );

/**
 * The installer's rounds, for the screen.
 */
function harlow_site_pages_route() {
	register_rest_route(
		'harlow/v1',
		'/install',
		array(
			'methods'             => 'POST',
			'permission_callback' => function () {
				return current_user_can( HARLOW_INSTALL_CAP );
			},
			'args'                => array(
				'start'   => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'replace' => array(
					'type'    => 'boolean',
					'default' => false,
				),
			),
			'callback'            => 'harlow_site_pages_round',
		)
	);
}
add_action( 'rest_api_init', 'harlow_site_pages_route' );

/**
 * One round of the installer: the first starts the run.
 *
 * @param WP_REST_Request $request The request.
 * @return array<string,mixed>
 */
function harlow_site_pages_round( $request ) {
	if ( $request['start'] ) {
		harlow_install_start( array( 'replace' => (bool) $request['replace'] ) );
	}
	$run = harlow_install_round( 15 );
	$out = array(
		'done'     => $run['done'],
		'rounds'   => $run['rounds'],
		'progress' => harlow_install_progress( $run ),
		'report'   => $run['report'],
	);
	if ( $run['done'] ) {
		$out['summary'] = harlow_install_summary( $run['report'] );
		update_option(
			'harlow_install_last',
			array(
				'summary' => $out['summary'],
				'rounds'  => $run['rounds'],
				'report'  => $run['report'],
			),
			false
		);
	}
	return $out;
}

/**
 * On the dashboard's screens: how many of the site's pages do not have their sections yet.
 */
function harlow_site_pages_notice() {
	$screen = get_current_screen();
	if ( ! current_user_can( HARLOW_INSTALL_CAP ) || ( $screen && 'appearance_page_harlow-site-pages' === $screen->id ) ) {
		return;
	}
	$waiting = harlow_site_pages_waiting( harlow_site_pages_pages() );
	if ( ! $waiting ) {
		return;
	}
	printf(
		'<div class="notice notice-info harlow-site-pages-notice"><p>%s <a href="%s">%s</a></p></div>',
		esc_html(
			sprintf(
				/* translators: 1: pages without their sections, 2: all pages. */
				_n( '%1$d of the site\'s %2$d pages does not have its sections yet.', '%1$d of the site\'s %2$d pages do not have their sections yet.', $waiting, 'harlow' ),
				$waiting,
				count( harlow_site_data()['pages'] )
			)
		),
		esc_url( admin_url( 'themes.php?page=harlow-site-pages' ) ),
		esc_html__( 'Appearance → Site pages', 'harlow' )
	);
}
add_action( 'admin_notices', 'harlow_site_pages_notice' );
