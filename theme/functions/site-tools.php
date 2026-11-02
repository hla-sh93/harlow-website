<?php
/**
 * Appearance → Editing and maintenance: Elementor's Role Manager and Maintenance Mode.
 *
 * Role manager: a role may be given the words and pictures only (the editor's design panels,
 * Styles tab and Advanced are hidden for it), as Elementor's "Access to edit content only".
 *
 * Maintenance mode: "coming soon" (the page answers 200, for search engines to come back)
 * or "maintenance" (503, with Retry-After): visitors who are not logged in, or whose role is
 * not let through, see one page or Theme Builder template the owner chose, alone.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The options and their defaults.
 *
 * @return array<string,mixed>
 */
function harlow_site_tools() {
	$saved = get_option( 'harlow_site_tools', array() );
	return wp_parse_args(
		is_array( $saved ) ? $saved : array(),
		array(
			'content_only' => array(),
			'mode'         => '',
			'page'         => 0,
			'who'          => 'logged_in',
			'roles'        => array(),
		)
	);
}

/**
 * Whether the person editing has the words and pictures only.
 *
 * @return bool
 */
function harlow_content_only() {
	$user = wp_get_current_user();
	if ( ! $user->exists() || user_can( $user, 'manage_options' ) ) {
		return false;
	}
	return (bool) array_intersect( (array) $user->roles, (array) harlow_site_tools()['content_only'] );
}

/**
 * The editor knows when the person has the words and pictures only (editor/styles.js and
 * the design panel read it).
 */
function harlow_content_only_editor() {
	if ( harlow_content_only() ) {
		wp_add_inline_script( 'harlow-editor', 'window.harlowEditor = window.harlowEditor || {}; window.harlowEditor.contentOnly = true;', 'before' );
	}
}
add_action( 'enqueue_block_editor_assets', 'harlow_content_only_editor', 20 );

/**
 * Maintenance mode: a visitor not let through sees the chosen page alone.
 */
function harlow_maintenance() {
	$tools = harlow_site_tools();
	if ( '' === $tools['mode'] || ! $tools['page'] || is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || wp_doing_cron() ) {
		return;
	}
	$pagenow = isset( $GLOBALS['pagenow'] ) ? $GLOBALS['pagenow'] : '';
	if ( 'wp-login.php' === $pagenow ) {
		return;
	}
	if ( is_user_logged_in() && ( 'logged_in' === $tools['who'] || array_intersect( (array) wp_get_current_user()->roles, (array) $tools['roles'] ) || current_user_can( 'manage_options' ) ) ) {
		return;
	}
	$page = get_post( (int) $tools['page'] );
	if ( ! $page || 'publish' !== $page->post_status ) {
		return;
	}
	if ( 'maintenance' === $tools['mode'] ) {
		status_header( 503 );
		header( 'Retry-After: 3600' );
	}
	nocache_headers();
	$GLOBALS['post'] = $page; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the one page this visit sees.
	setup_postdata( $page );
	get_header( 'canvas' );
	if ( 'harlow_template' === $page->post_type ) {
		echo harlow_render_template( $page->ID ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the template's blocks, escaped where they are built.
	} else {
		harlow_the_document();
	}
	get_footer( 'canvas' );
	exit;
}
add_action( 'template_redirect', 'harlow_maintenance', 1 );

/**
 * The page under Appearance.
 */
function harlow_site_tools_menu() {
	add_theme_page( __( 'Editing and maintenance', 'harlow' ), __( 'Editing and maintenance', 'harlow' ), 'manage_options', 'harlow-site-tools', 'harlow_site_tools_page' );
}
add_action( 'admin_menu', 'harlow_site_tools_menu' );

/**
 * The option, registered with its cleaning.
 */
function harlow_site_tools_register() {
	register_setting(
		'harlow_site_tools',
		'harlow_site_tools',
		array(
			'type'              => 'array',
			'sanitize_callback' => 'harlow_site_tools_sanitize',
			'default'           => array(),
		)
	);
}
add_action( 'admin_init', 'harlow_site_tools_register' );

/**
 * The options, cleaned.
 *
 * @param mixed $in What the form sent.
 * @return array<string,mixed>
 */
function harlow_site_tools_sanitize( $in ) {
	$in    = is_array( $in ) ? $in : array();
	$roles = array_keys( wp_roles()->get_names() );
	return array(
		'content_only' => array_values( array_intersect( isset( $in['content_only'] ) ? (array) $in['content_only'] : array(), $roles ) ),
		'mode'         => isset( $in['mode'] ) && in_array( $in['mode'], array( 'coming_soon', 'maintenance' ), true ) ? $in['mode'] : '',
		'page'         => isset( $in['page'] ) ? absint( $in['page'] ) : 0,
		'who'          => isset( $in['who'] ) && 'roles' === $in['who'] ? 'roles' : 'logged_in',
		'roles'        => array_values( array_intersect( isset( $in['roles'] ) ? (array) $in['roles'] : array(), $roles ) ),
	);
}

/**
 * The page: the role manager, then maintenance mode.
 */
function harlow_site_tools_page() {
	$tools = harlow_site_tools();
	$roles = wp_roles()->get_names();
	unset( $roles['administrator'] );
	$pages = get_posts(
		array(
			'post_type'      => array( 'page', 'harlow_template' ),
			'post_status'    => 'publish',
			'posts_per_page' => 200, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- the site's pages and templates, for one list on a settings screen.
			'orderby'        => 'title',
			'order'          => 'ASC',
		)
	);
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Editing and maintenance', 'harlow' ); ?></h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'harlow_site_tools' ); ?>
			<h2><?php esc_html_e( 'Role manager', 'harlow' ); ?></h2>
			<p><?php esc_html_e( 'These roles change the words and pictures only: the design panels, the Styles tab and Advanced are hidden for them.', 'harlow' ); ?></p>
			<fieldset>
				<?php foreach ( $roles as $role => $name ) : ?>
					<label style="display:block;margin:4px 0">
						<input type="checkbox" name="harlow_site_tools[content_only][]" value="<?php echo esc_attr( $role ); ?>" <?php checked( in_array( $role, (array) $tools['content_only'], true ) ); ?>>
						<?php echo esc_html( translate_user_role( $name ) ); ?>
					</label>
				<?php endforeach; ?>
			</fieldset>

			<h2><?php esc_html_e( 'Maintenance mode', 'harlow' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="harlow-mode"><?php esc_html_e( 'Mode', 'harlow' ); ?></label></th>
					<td>
						<select id="harlow-mode" name="harlow_site_tools[mode]">
							<option value="" <?php selected( $tools['mode'], '' ); ?>><?php esc_html_e( 'Off', 'harlow' ); ?></option>
							<option value="coming_soon" <?php selected( $tools['mode'], 'coming_soon' ); ?>><?php esc_html_e( 'Coming soon (the page answers 200)', 'harlow' ); ?></option>
							<option value="maintenance" <?php selected( $tools['mode'], 'maintenance' ); ?>><?php esc_html_e( 'Maintenance (the page answers 503)', 'harlow' ); ?></option>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="harlow-mode-page"><?php esc_html_e( 'Page shown', 'harlow' ); ?></label></th>
					<td>
						<select id="harlow-mode-page" name="harlow_site_tools[page]">
							<option value="0"><?php esc_html_e( 'Choose a page or template…', 'harlow' ); ?></option>
							<?php foreach ( $pages as $page ) : ?>
								<option value="<?php echo (int) $page->ID; ?>" <?php selected( (int) $tools['page'], (int) $page->ID ); ?>><?php echo esc_html( get_the_title( $page ) . ( 'harlow_template' === $page->post_type ? ' — ' . __( 'template', 'harlow' ) : '' ) ); ?></option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Who sees the site', 'harlow' ); ?></th>
					<td>
						<label style="display:block"><input type="radio" name="harlow_site_tools[who]" value="logged_in" <?php checked( $tools['who'], 'logged_in' ); ?>> <?php esc_html_e( 'Everyone logged in', 'harlow' ); ?></label>
						<label style="display:block"><input type="radio" name="harlow_site_tools[who]" value="roles" <?php checked( $tools['who'], 'roles' ); ?>> <?php esc_html_e( 'These roles (and administrators):', 'harlow' ); ?></label>
						<?php foreach ( $roles as $role => $name ) : ?>
							<label style="display:inline-block;margin:4px 12px 4px 24px">
								<input type="checkbox" name="harlow_site_tools[roles][]" value="<?php echo esc_attr( $role ); ?>" <?php checked( in_array( $role, (array) $tools['roles'], true ) ); ?>>
								<?php echo esc_html( translate_user_role( $name ) ); ?>
							</label>
						<?php endforeach; ?>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/**
 * The admin bar says when maintenance mode is on.
 *
 * @param WP_Admin_Bar $bar The admin bar.
 */
function harlow_maintenance_notice( $bar ) {
	$tools = harlow_site_tools();
	if ( '' === $tools['mode'] || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$bar->add_node(
		array(
			'id'    => 'harlow-maintenance',
			'title' => 'maintenance' === $tools['mode'] ? __( 'Maintenance mode on', 'harlow' ) : __( 'Coming soon mode on', 'harlow' ),
			'href'  => admin_url( 'themes.php?page=harlow-site-tools' ),
		)
	);
}
add_action( 'admin_bar_menu', 'harlow_maintenance_notice', 100 );
