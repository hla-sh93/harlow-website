<?php
/**
 * The page's title (harlow/page-title): Elementor Pro's page title widget, a heading of the
 * title of the page being shown; on a list of posts (a category, a search, the blog) its
 * title, as Elementor's page title tag gives it.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( harlow_archive_title_is_list() ) {
	$harlow_title = wp_kses_post( harlow_archive_title_text( (bool) $attributes['context'] ) );
	$harlow_url   = '';
} else {
	$harlow_post  = harlow_theme_builder_post();
	$harlow_title = $harlow_post ? wp_kses_post( get_the_title( $harlow_post ) ) : esc_html__( 'Page Title', 'harlow' );
	if ( $harlow_post && $attributes['context'] ) {
		$harlow_type  = get_post_type_object( $harlow_post->post_type );
		$harlow_title = ( $harlow_type ? esc_html( $harlow_type->labels->singular_name ) . ': ' : '' ) . $harlow_title;
	}
	$harlow_url = $harlow_post ? (string) get_permalink( $harlow_post ) : '';
}
$harlow_html = harlow_theme_builder_heading(
	$attributes,
	'theme-page-title',
	array( 'elementor-page-title', 'elementor-widget-heading' ),
	$harlow_title,
	$harlow_url
);
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the title are escaped where they are built.
