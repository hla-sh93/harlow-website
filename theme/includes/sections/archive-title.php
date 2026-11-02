<?php
/**
 * The title of a list of posts (harlow/archive-title): Elementor Pro's archive title
 * widget, a heading of the category's, tag's, author's, date's or search's title (a
 * category's as a sample where no list is shown).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_html = harlow_theme_builder_heading(
	$attributes,
	'theme-archive-title',
	array( 'elementor-page-title', 'elementor-widget-heading' ),
	wp_kses_post( harlow_archive_title_text( (bool) $attributes['context'] ) )
);
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the title are escaped where they are built.
