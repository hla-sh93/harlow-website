<?php
/**
 * The performance and security check, inside WordPress (run by verify_perf_security.py,
 * which copies this file to _env/ and calls `wp eval-file /env/perf-security.php <step>`
 * as the administrator).
 *
 *   routes       the REST routes and the admin-post and AJAX actions the theme registers,
 *                each with what may call it (its permission callback, nopriv or not).
 *   users        test users of the roles the site has (author, editor, subscriber, and an
 *                editor of the words and pictures only), each a fresh session's cookies; no
 *                password is ever printed. Written down in /env/perf-security/kept.json.
 *   tools-set    the site tools option (maintenance, the role manager) set to the JSON
 *                handed over; the one before written down.
 *   back         the users made deleted with every post and picture they made, the site
 *                tools option put back.
 *
 * @package Harlow
 */

// phpcs:ignoreFile -- a check run by WP-CLI, not part of the theme.

$what  = isset( $args[0] ) ? $args[0] : '';
$store = '/env/perf-security';
$input = file_exists( '/env/perf-security.json' ) ? json_decode( file_get_contents( '/env/perf-security.json' ), true ) : array();
$out   = array();
wp_mkdir_p( $store );
$kept_file = $store . '/kept.json';
$kept      = file_exists( $kept_file ) ? json_decode( file_get_contents( $kept_file ), true ) : array();
$kept      = is_array( $kept ) ? $kept : array();

/** What a callback is, in words: a function's name, a method, or a closure's file and line. */
function hl_ps_callable( $cb ) {
	if ( is_string( $cb ) ) {
		return $cb;
	}
	if ( is_array( $cb ) && 2 === count( $cb ) ) {
		return ( is_object( $cb[0] ) ? get_class( $cb[0] ) : (string) $cb[0] ) . '::' . $cb[1];
	}
	if ( $cb instanceof Closure ) {
		$r = new ReflectionFunction( $cb );
		return 'closure ' . basename( (string) $r->getFileName() ) . ':' . $r->getStartLine();
	}
	return 'unknown';
}

/** Cookies of a fresh session of one user, as WordPress makes them. */
function hl_ps_cookies( $user_id ) {
	$exp = time() + 4 * HOUR_IN_SECONDS;
	return array(
		AUTH_COOKIE      => wp_generate_auth_cookie( $user_id, $exp, 'auth' ),
		LOGGED_IN_COOKIE => wp_generate_auth_cookie( $user_id, $exp, 'logged_in' ),
	);
}

switch ( $what ) {
	case 'routes':
		$routes = array();
		foreach ( rest_get_server()->get_routes() as $route => $handlers ) {
			if ( 0 !== strpos( $route, '/harlow/' ) ) {
				continue;
			}
			foreach ( $handlers as $handler ) {
				$routes[] = array(
					'route'      => $route,
					'methods'    => array_keys( array_filter( (array) $handler['methods'] ) ),
					'permission' => isset( $handler['permission_callback'] ) ? hl_ps_callable( $handler['permission_callback'] ) : 'none',
				);
			}
		}
		global $wp_filter;
		$actions = array();
		foreach ( $wp_filter as $hook => $callbacks ) {
			if ( ! preg_match( '/^(wp_ajax_nopriv_|wp_ajax_|admin_post_nopriv_|admin_post_)/', $hook ) ) {
				continue;
			}
			foreach ( $callbacks->callbacks as $priority => $list ) {
				foreach ( $list as $one ) {
					$name = hl_ps_callable( $one['function'] );
					if ( false !== strpos( $name, 'harlow' ) ) {
						$actions[] = array( 'hook' => $hook, 'callback' => $name );
					}
				}
			}
		}
		$out = array( 'routes' => $routes, 'actions' => $actions );
		break;

	case 'users':
		$roles = array( 'author', 'editor', 'subscriber', 'content' );
		$made  = isset( $kept['users'] ) ? $kept['users'] : array();
		$users = array();
		foreach ( $roles as $role ) {
			$login = 'hl-sec-' . $role;
			$found = get_user_by( 'login', $login );
			$id    = $found ? $found->ID : wp_insert_user(
				array(
					'user_login' => $login,
					'user_pass'  => wp_generate_password( 32, true, true ),
					'user_email' => $login . '@example.invalid',
					'role'       => 'content' === $role ? 'editor' : $role,
				)
			);
			if ( is_wp_error( $id ) ) {
				$out['__error'] = $id->get_error_message();
				break 2;
			}
			if ( ! in_array( $id, $made, true ) ) {
				$made[] = $id;
			}
			$users[ $role ] = array( 'id' => (int) $id, 'cookies' => hl_ps_cookies( (int) $id ) );
		}
		$kept['users'] = $made;
		file_put_contents( $kept_file, wp_json_encode( $kept ) );
		$out = array( 'users' => $users );
		break;

	case 'tools-set':
		if ( ! array_key_exists( 'tools', $kept ) ) {
			$kept['tools'] = get_option( 'harlow_site_tools', null );
			file_put_contents( $kept_file, wp_json_encode( $kept ) );
		}
		update_option( 'harlow_site_tools', isset( $input['tools'] ) ? $input['tools'] : array() );
		$out = array( 'tools' => get_option( 'harlow_site_tools' ) );
		break;

	case 'back':
		require_once ABSPATH . 'wp-admin/includes/user.php';
		$deleted = 0;
		foreach ( isset( $kept['users'] ) ? $kept['users'] : array() as $id ) {
			foreach ( get_posts( array( 'author' => (int) $id, 'post_type' => 'any', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids' ) ) as $post_id ) {
				wp_delete_post( $post_id, true );
			}
			foreach ( get_posts( array( 'author' => (int) $id, 'post_type' => 'attachment', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids' ) ) as $post_id ) {
				wp_delete_attachment( $post_id, true );
			}
			$deleted += wp_delete_user( (int) $id ) ? 1 : 0;
		}
		if ( array_key_exists( 'tools', $kept ) ) {
			if ( null === $kept['tools'] ) {
				delete_option( 'harlow_site_tools' );
			} else {
				update_option( 'harlow_site_tools', $kept['tools'] );
			}
		}
		foreach ( isset( $input['delete'] ) ? (array) $input['delete'] : array() as $post_id ) {
			if ( 'attachment' === get_post_type( (int) $post_id ) ) {
				wp_delete_attachment( (int) $post_id, true );
			} elseif ( get_post( (int) $post_id ) ) {
				wp_delete_post( (int) $post_id, true );
			}
		}
		@unlink( $kept_file );
		$out = array( 'users deleted' => $deleted );
		break;

	default:
		$out = array( '__error' => 'unknown step ' . $what );
}

echo 'HARLOW-JSON' . wp_json_encode( $out );
