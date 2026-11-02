<?php
/**
 * The item pages: live's four single templates (Elementor theme-builder documents), as
 * blocks in singles/ (written by _tools/gen_blocks.py from the reference), printed with the
 * item the page shows: its title, date, featured picture, text and fields. The installer
 * makes each template a synced pattern (Appearance → Patterns), so the owner edits a
 * template's words and pictures as a page's; the file is the original, and what prints
 * while there is no pattern.
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
 * The single templates and the names their patterns go by.
 *
 * @return array<string,string> Template => title.
 */
function harlow_single_templates() {
	return array(
		'single-post'         => __( 'Item page: posts and news', 'harlow' ),
		'single-project'      => __( 'Item page: projects', 'harlow' ),
		'single-gallery-item' => __( 'Item page: gallery items', 'harlow' ),
		'single-job'          => __( 'Item page: jobs', 'harlow' ),
	);
}

/**
 * The synced pattern that holds a single template, found by its original; 0 when there is
 * none (not installed yet).
 *
 * @param string $name The template.
 * @return int
 */
function harlow_single_template_id( $name ) {
	static $known = array();
	if ( empty( $known[ $name ] ) ) {
		$found          = get_posts(
			array(
				'post_type'      => 'wp_block',
				'post_status'    => 'publish',
				'meta_key'       => '_harlow_original', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one small query.
				'meta_value'     => $name, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);
		$known[ $name ] = $found ? (int) $found[0] : 0;
	}
	return $known[ $name ];
}

/**
 * A single template's blocks: its pattern's, or the theme's file while there is none.
 *
 * @param string $name The template.
 * @return string
 */
function harlow_single_template_blocks( $name ) {
	$id = harlow_single_template_id( $name );
	if ( $id ) {
		return (string) get_post_field( 'post_content', $id, 'raw' );
	}
	$file = get_theme_file_path( 'singles/' . $name . '.html' );
	return file_exists( $file ) ? harlow_with_shared_section( (string) file_get_contents( $file ) ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
}

/**
 * The item's page: its type's single template, or, for a type without one, the item's
 * content in a document as a page prints it.
 */
function harlow_the_single() {
	$type   = get_post_type();
	$blocks = isset( HARLOW_SINGLES[ $type ] ) ? harlow_single_template_blocks( HARLOW_SINGLES[ $type ] ) : '';
	if ( '' === $blocks ) {
		harlow_the_document();
		return;
	}
	echo do_blocks( $blocks ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the blocks escape what they print.
}
