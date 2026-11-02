<?php
/**
 * Icons the owner uploads (Elementor Pro's custom icons): an SVG file may be added to the
 * Media Library by someone who may change the site's design, and is cleaned as it arrives,
 * kept to the shapes an icon has (harlow_icon()), so nothing in it runs or loads. The icon
 * picker (editor/shared.js) takes an uploaded SVG as an icon.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * SVG among the files the Media Library takes, for those who may change the design.
 *
 * @param array<string,string> $types Extension => type.
 * @return array<string,string>
 */
function harlow_icons_mimes( $types ) {
	if ( current_user_can( 'edit_theme_options' ) ) {
		$types['svg'] = 'image/svg+xml';
	}
	return $types;
}
add_filter( 'upload_mimes', 'harlow_icons_mimes' );

/**
 * WordPress reads an SVG's type from its contents, which it does not know: it is taken from
 * its name, for those who may upload one.
 *
 * @param array<string,mixed> $checked  What WordPress found.
 * @param string              $file     The file's path.
 * @param string              $filename The file's name.
 * @return array<string,mixed>
 */
function harlow_icons_filetype( $checked, $file, $filename ) {
	if ( current_user_can( 'edit_theme_options' ) && preg_match( '/\.svg$/i', $filename ) ) {
		$checked['ext']             = 'svg';
		$checked['type']            = 'image/svg+xml';
		$checked['proper_filename'] = $filename;
	}
	return $checked;
}
add_filter( 'wp_check_filetype_and_ext', 'harlow_icons_filetype', 10, 3 );

/**
 * An uploaded SVG, cleaned before it is kept: only its icon shapes; refused when none is
 * left.
 *
 * @param array<string,mixed> $file The upload.
 * @return array<string,mixed>
 */
function harlow_icons_clean_upload( $file ) {
	if ( empty( $file['tmp_name'] ) || ! preg_match( '/\.svg$/i', (string) $file['name'] ) ) {
		return $file;
	}
	$svg   = (string) file_get_contents( $file['tmp_name'] ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- the uploaded file, on this server.
	$clean = preg_match( '/<svg\b.*<\/svg>/is', $svg, $m ) ? harlow_icon( $m[0] ) : '';
	if ( false === strpos( $clean, '<svg' ) ) {
		$file['error'] = __( 'This SVG file holds no icon the site can use.', 'harlow' );
		return $file;
	}
	file_put_contents( $file['tmp_name'], '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . $clean ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- the uploaded file, cleaned in place before WordPress keeps it.
	return $file;
}
add_filter( 'wp_handle_upload_prefilter', 'harlow_icons_clean_upload' );
