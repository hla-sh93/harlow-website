<?php
/**
 * A toggle (harlow/toggle): Elementor's toggle widget, titles that each open and close
 * their own content, several open at once (assets/js/widgets/toggle.js); with the FAQ
 * schema on, the titles and contents are also printed as a FAQPage for search engines.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// The element's classes: the widget's own when it has none yet.
$harlow_classes            = array_filter( preg_split( '/\s+/', (string) $attributes['classes'] ) );
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-toggle' ), $harlow_classes ), $harlow_classes ) );

$harlow_tag   = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'div';
$harlow_align = 'right' === $attributes['iconAlign'] ? 'right' : 'left';
$harlow_id    = substr( (string) hexdec( preg_replace( '/[^0-9a-f]/i', '', (string) $attributes['element'] ) ), 0, 3 );
$harlow_icons = '';
if ( '' !== $attributes['iconClosed'] || '' !== $attributes['iconOpened'] ) {
	$harlow_icons = '<span class="elementor-toggle-icon elementor-toggle-icon-' . $harlow_align . '" aria-hidden="true">' . "\n"
		. '<span class="elementor-toggle-icon-closed">' . harlow_icon( $attributes['iconClosed'] ) . '</span>' . "\n"
		. '<span class="elementor-toggle-icon-opened">' . harlow_icon( $attributes['iconOpened'] ) . '</span>' . "\n"
		. '</span>' . "\n";
}

// A content as Elementor's text editor prints it: its own paragraphs, or one.
$harlow_prose = static function ( $html ) {
	$html = harlow_resolve_links( wp_kses_post( (string) $html ) );
	return preg_match( '/<(?:p|ul|ol|h[1-6]|div|blockquote|table|figure)[\s>]/i', $html ) ? $html : '<p>' . $html . '</p>';
};

$harlow_items = '';
$harlow_faq   = array();
foreach ( array_values( (array) $attributes['tabs'] ) as $harlow_index => $harlow_item ) {
	$harlow_item   = wp_parse_args(
		(array) $harlow_item,
		array(
			'title'   => '',
			'content' => '',
		)
	);
	$harlow_count  = $harlow_index + 1;
	$harlow_text   = $harlow_prose( $harlow_item['content'] );
	$harlow_items .= "\n" . '<div class="elementor-toggle-item">' . "\n"
		. '<' . $harlow_tag . ' id="elementor-tab-title-' . $harlow_id . $harlow_count . '" class="elementor-tab-title" data-tab="' . $harlow_count . '" role="button" aria-controls="elementor-tab-content-' . $harlow_id . $harlow_count . '" aria-expanded="false">' . "\n"
		. $harlow_icons
		. '<a class="elementor-toggle-title" tabindex="0">' . wp_kses_post( $harlow_item['title'] ) . '</a>' . "\n"
		. '</' . $harlow_tag . '>' . "\n"
		. '<div id="elementor-tab-content-' . $harlow_id . $harlow_count . '" class="elementor-tab-content elementor-clearfix" data-tab="' . $harlow_count . '" role="region" aria-labelledby="elementor-tab-title-' . $harlow_id . $harlow_count . '">' . $harlow_text . '</div>' . "\n"
		. '</div>';
	$harlow_faq[]  = array(
		'@type'          => 'Question',
		'name'           => wp_strip_all_tags( $harlow_item['title'] ),
		'acceptedAnswer' => array(
			'@type' => 'Answer',
			'text'  => $harlow_text,
		),
	);
}

// The FAQ schema, its < and > written as < and > (JSON_HEX_TAG), so the words
// cannot close the script.
$harlow_schema = '';
if ( $attributes['faqSchema'] ) {
	$harlow_schema = "\n" . '<script type="application/ld+json">'
		. wp_json_encode(
			array(
				'@context'   => 'https://schema.org',
				'@type'      => 'FAQPage',
				'mainEntity' => $harlow_faq,
			),
			JSON_HEX_TAG
		)
		. '</script>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'toggle.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-toggle">' . $harlow_items . $harlow_schema . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built; the schema is JSON from wp_json_encode().
