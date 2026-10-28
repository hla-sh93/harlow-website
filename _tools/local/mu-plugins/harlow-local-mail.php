<?php
/**
 * Plugin Name: Harlow local mail
 * Description: Routes wp_mail() to the Mailpit container. Mounted by docker-compose.yml for local development only; never shipped.
 *
 * The WordPress image has no mail transport, so wp_mail() returns false and Contact Form 7
 * tells every visitor "there was an error trying to send your message". Pointing PHPMailer
 * at Mailpit makes every message land in http://localhost:8035 instead, where a check can
 * read it back to prove the form really sent what was typed.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'phpmailer_init',
	function ( $phpmailer ) {
		$phpmailer->isSMTP();
		$phpmailer->Host     = 'mailpit'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer's own property.
		$phpmailer->Port     = 1025;      // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer's own property.
		$phpmailer->SMTPAuth = false;     // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer's own property.
	}
);

/*
 * WordPress builds the default sender from the site's host, and here that is `localhost`:
 * PHPMailer refuses `wordpress@localhost` before anything is sent ("Invalid address
 * (From)"). A host with a dot in it is all it wants.
 */
add_filter(
	'wp_mail_from',
	function ( $from ) {
		return 'wordpress@localhost' === $from ? 'wordpress@localhost.test' : $from;
	}
);

add_action(
	'wp_mail_failed',
	function ( $error ) {
		error_log( 'wp_mail failed: ' . $error->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- local diagnostics.
	}
);
