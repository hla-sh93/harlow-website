<?php
/**
 * A sitemap (harlow/sitemap): Elementor Pro's sitemap widget, lists of the site's pages,
 * posts, items or terms, each under its title, side by side in columns.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_title_tag = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'h2';
$harlow_sections  = '';
foreach ( is_array( $attributes['sections'] ) ? $attributes['sections'] : array() as $harlow_section ) {
	if ( is_array( $harlow_section ) ) {
		$harlow_sections .= "\n" . harlow_sitemap_section( $harlow_section, $harlow_title_tag, (bool) $attributes['nofollow'] );
	}
}

// Columns per device and the bullet, where they are not Elementor's defaults (4, 2, 1; a
// disc), as custom properties the widget's stylesheet reads.
$harlow_vars = '';
foreach ( array(
	'columns'       => array( '--harlow-sitemap-columns', 4 ),
	'columnsTablet' => array( '--harlow-sitemap-columns-tablet', 2 ),
	'columnsMobile' => array( '--harlow-sitemap-columns-mobile', 1 ),
) as $harlow_key => $harlow_var ) {
	$harlow_count = max( 1, min( 12, (int) $attributes[ $harlow_key ] ) );
	if ( $harlow_count !== $harlow_var[1] ) {
		$harlow_vars .= $harlow_var[0] . ':' . $harlow_count . ';';
	}
}
if ( in_array( $attributes['bullet'], array( 'circle', 'square', 'none' ), true ) ) {
	$harlow_vars .= '--harlow-sitemap-bullet:' . $attributes['bullet'] . ';';
}

$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'sitemap' ), 'widget', 'sitemap.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-sitemap-wrap"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( $harlow_vars ) . '"' : '' ) . '>' . $harlow_sections . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built (harlow_sitemap_section()).
