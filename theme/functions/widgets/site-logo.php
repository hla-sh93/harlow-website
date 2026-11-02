<?php
/**
 * The site's logo, for the site logo widget: the picture the header shows.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The logo's Media Library picture: Customize's custom logo where a plugin or WordPress
 * set one, else the header logo chosen in Customize → Header and footer, else the
 * design's own logo where the installer put it in the Media Library under live's id.
 *
 * @return int 0 when the logo is only the design's file.
 */
function harlow_site_logo_id() {
	$candidates = array( (int) get_theme_mod( 'custom_logo' ), (int) harlow_setting( 'header_logo' ) );
	$design     = harlow_default_images();
	if ( preg_match( '/wp-image-(\d+)/', (string) $design['header_logo']['class'], $m ) ) {
		$candidates[] = (int) $m[1];
	}
	foreach ( $candidates as $id ) {
		if ( $id && wp_attachment_is_image( $id ) ) {
			return $id;
		}
	}
	return 0;
}

/**
 * The design's own logo, as the header prints it, when no picture of the Media Library is
 * the logo.
 *
 * @return string
 */
function harlow_site_logo_design() {
	ob_start();
	harlow_the_image( 'header_logo' );
	return (string) ob_get_clean();
}
