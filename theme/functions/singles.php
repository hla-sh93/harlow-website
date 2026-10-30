<?php
/**
 * The item pages: live's four single templates (Elementor theme-builder documents), as
 * blocks in singles/ (written by _tools/gen_blocks.py from the reference), printed with the
 * item the page shows: its title, date, featured picture, text and fields.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Content type => its single template (singles/<name>.html). */
const HARLOW_SINGLES = array(
	'post'            => 'single-post',
	'news'            => 'single-post',
	'albahoo_project' => 'single-project',
	'gallery_item'    => 'single-gallery-item',
	'job'             => 'single-job',
);

/**
 * The item's page: its type's single template, or, for a type without one, the item's
 * content in a document as a page prints it.
 */
function harlow_the_single() {
	$type = get_post_type();
	$file = isset( HARLOW_SINGLES[ $type ] ) ? get_theme_file_path( 'singles/' . HARLOW_SINGLES[ $type ] . '.html' ) : '';
	if ( '' === $file || ! file_exists( $file ) ) {
		harlow_the_document();
		return;
	}
	echo do_blocks( (string) file_get_contents( $file ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped -- a file inside the theme, not a URL; the blocks escape what they print.
}
