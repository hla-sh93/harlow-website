<?php
/**
 * Breadcrumbs (harlow/breadcrumbs): Elementor Pro's breadcrumbs widget, the trail from the
 * home page to the page being shown, in the markup of the SEO plugin's breadcrumbs it
 * prints (`<p id="breadcrumbs">`), with the trail as schema.org's BreadcrumbList.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_tag   = in_array( $attributes['tag'], array( 'p', 'div', 'nav', 'span' ), true ) ? $attributes['tag'] : 'p';
$harlow_trail = harlow_breadcrumbs_trail( '' !== $attributes['homeText'] ? $attributes['homeText'] : __( 'Home', 'harlow' ) );
$harlow_last  = count( $harlow_trail ) - 1;
$harlow_parts = array();
foreach ( $harlow_trail as $harlow_index => $harlow_crumb ) {
	$harlow_parts[] = $harlow_index === $harlow_last
		? '<span class="breadcrumb_last" aria-current="page">' . esc_html( $harlow_crumb[0] ) . '</span>'
		: '<span><a href="' . esc_url( $harlow_crumb[1] ) . '">' . esc_html( $harlow_crumb[0] ) . '</a></span>';
}
$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'breadcrumbs' ), 'widget', 'breadcrumbs.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<' . $harlow_tag . ' id="breadcrumbs"><span>' . implode( ' ' . esc_html( $attributes['separator'] ) . ' ', $harlow_parts ) . '</span></' . $harlow_tag . '>'
	. ( $attributes['schema'] ? "\n" . harlow_breadcrumbs_schema( $harlow_trail ) : '' ) . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built; the schema is JSON with its tags escaped.
