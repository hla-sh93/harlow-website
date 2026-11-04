<?php
/**
 * Plugin Name: Harlow local metrics
 * Description: What a page cost the server, for the performance check. Mounted by docker-compose.yml for local development only; never shipped.
 *
 * A request carrying the header `X-Harlow-Metrics: 1` (only _tools/verify_perf_security.py
 * sends it) ends with one HTML comment: the database queries the page made, the PHP time
 * and the peak memory. Every other request is printed byte for byte as before, so the
 * checks that compare pages are not touched.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'shutdown',
	function () {
		if ( empty( $_SERVER['HTTP_X_HARLOW_METRICS'] ) || is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}
		$type = '';
		foreach ( headers_list() as $header ) {
			if ( 0 === stripos( $header, 'Content-Type:' ) ) {
				$type = $header;
			}
		}
		if ( '' !== $type && false === stripos( $type, 'text/html' ) ) {
			return;
		}
		printf(
			"\n<!-- harlow-metrics queries=%d time=%.1f memory=%.1f -->",
			(int) get_num_queries(),
			1000 * ( microtime( true ) - ( isset( $_SERVER['REQUEST_TIME_FLOAT'] ) ? (float) $_SERVER['REQUEST_TIME_FLOAT'] : microtime( true ) ) ),
			memory_get_peak_usage() / 1048576
		);
	},
	0
);
