<?php
/**
 * The Lottie widget (harlow/lottie): its animations are JSON files, which the Media Library
 * takes from those who may change the site's design (as Elementor Pro lets them), and the
 * animation it plays when none is chosen.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * JSON among the files the Media Library takes, for those who may change the design.
 *
 * @param array<string,string> $types Extension => type.
 * @return array<string,string>
 */
function harlow_lottie_mimes( $types ) {
	if ( current_user_can( 'edit_theme_options' ) ) {
		$types['json'] = 'application/json';
	}
	return $types;
}
add_filter( 'upload_mimes', 'harlow_lottie_mimes' );

/**
 * WordPress reads a JSON file as plain text: its type is taken from its name, for those who
 * may upload one.
 *
 * @param array<string,mixed> $checked  What WordPress found.
 * @param string              $file     The file's path.
 * @param string              $filename The file's name.
 * @return array<string,mixed>
 */
function harlow_lottie_filetype( $checked, $file, $filename ) {
	if ( current_user_can( 'edit_theme_options' ) && preg_match( '/\.json$/i', (string) $filename ) ) {
		$checked['ext']             = 'json';
		$checked['type']            = 'application/json';
		$checked['proper_filename'] = $filename;
	}
	return $checked;
}
add_filter( 'wp_check_filetype_and_ext', 'harlow_lottie_filetype', 10, 3 );

/**
 * The address of the animation a Lottie block plays: its file, its address, or the theme's
 * own when none is chosen.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return string
 */
function harlow_lottie_source( $attributes ) {
	$url = 'external_url' === $attributes['source']
		? harlow_link_url( (string) $attributes['sourceExternalUrl'] )
		: ( $attributes['sourceJson'] ? (string) wp_get_attachment_url( (int) $attributes['sourceJson'] ) : '' );
	return '' !== $url ? $url : get_theme_file_uri( 'blocks/lottie/default.json' );
}
