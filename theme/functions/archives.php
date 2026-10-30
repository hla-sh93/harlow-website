<?php
/**
 * The addresses outside the site's pages, as live answers them: a category's posts and
 * search results in its base theme's own lists (archive.php, search.php, with that theme's
 * rules for them, css/archive.css); date archives sent home (301); author archives not
 * found. Content types have no archives (has_archive false): not found, as on live.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Date archives lead home, author archives are not found.
 */
function harlow_archive_addresses() {
	if ( is_date() ) {
		wp_safe_redirect( home_url( '/' ), 301 );
		exit;
	}
	if ( is_author() ) {
		global $wp_query;
		remove_action( 'template_redirect', 'redirect_canonical' ); // ?author=1 would be sent on to /author/<name>/
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();
	}
}
add_action( 'template_redirect', 'harlow_archive_addresses', 1 ); // Before WordPress's canonical redirect.

/**
 * The base theme's rules for its lists, on the pages that show one.
 */
function harlow_archive_styles() {
	if ( is_search() || is_archive() ) {
		wp_enqueue_style( 'harlow-archive', get_theme_file_uri( 'css/archive.css' ), array( 'harlow-animations' ), harlow_asset_version( 'css/archive.css' ) );
	}
}
add_action( 'wp_enqueue_scripts', 'harlow_archive_styles', 20 );
