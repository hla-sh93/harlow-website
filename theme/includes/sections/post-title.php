<?php
/**
 * The item's title (harlow/post-title): Elementor Pro's post title widget, a heading of the
 * title of the item the page shows (a sample post where there is none).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_post = harlow_theme_builder_post();
$harlow_html = harlow_theme_builder_heading(
	$attributes,
	'theme-post-title',
	array( 'elementor-page-title', 'elementor-widget-heading' ),
	$harlow_post ? wp_kses_post( get_the_title( $harlow_post ) ) : esc_html__( 'Post Title', 'harlow' ),
	$harlow_post ? (string) get_permalink( $harlow_post ) : ''
);
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the title are escaped where they are built.
