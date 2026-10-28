<?php
/**
 * Plugin Name: Harlow local offline
 * Description: Answers WordPress.org's update API locally with an empty reply. Mounted by docker-compose.yml for local development only; never shipped.
 *
 * The container cannot reach wordpress.org over TLS on this machine. Every update check
 * WordPress makes (after a plugin install, on admin pages, from cron) then fails and writes
 * a PHP warning to wp-content/debug.log, the file that must stay empty so that a real error
 * of the theme shows up in it. A local site has nothing to update (the plugins come from
 * zips the host fetches, see _tools/env.sh), so the update API is answered here with an
 * empty 200: WordPress finds no updates and moves on without a warning.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter(
	'pre_http_request',
	function ( $preempt, $args, $url ) {
		if ( 'api.wordpress.org' !== wp_parse_url( (string) $url, PHP_URL_HOST ) ) {
			return $preempt;
		}
		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	},
	10,
	3
);
