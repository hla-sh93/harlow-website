<?php
/**
 * Plugin Name: Harlow local queue
 * Description: Runs Action Scheduler's queue from WP-Cron only. Mounted by docker-compose.yml for local development only; never shipped.
 *
 * Action Scheduler (bundled with Rank Math) takes a lock at the end of every admin request
 * by inserting an option when none is there. Two requests that end at the same moment
 * (the checks open several at once) both insert it, and the second insert writes a
 * database error to wp-content/debug.log, the file that must stay empty so that a real
 * error of the theme shows up in it. The step is taken off the end of the request; the
 * queue still runs from WP-Cron, which nothing on this site waits for.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'init',
	function () {
		if ( class_exists( 'ActionScheduler_QueueRunner' ) ) {
			ActionScheduler_QueueRunner::instance()->unhook_dispatch_async_request();
		}
	},
	20
);
