<?php
/**
 * The site's name (harlow/site-title): Elementor Pro's site title widget, a heading of the
 * site's title (Settings → General), linked to the home page.
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
	'theme-site-title',
	array( 'elementor-widget-heading' ),
	esc_html( get_bloginfo( 'name' ) ),
	home_url( '/' )
);
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the title are escaped where they are built.
