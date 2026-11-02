<?php
/**
 * Tabs (harlow/tabs): Elementor's tabs widget (the classic one). The titles stand in a row
 * (horizontal) or a column (vertical) and each shows its own content; on a phone every
 * title stands above its content, as an accordion (assets/js/widgets/tabs.js). The layout
 * and the titles' alignment are Elementor's prefix classes on the element.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_type  = 'vertical' === $attributes['type'] ? 'vertical' : 'horizontal';
$harlow_align = in_array( $attributes['align'], array( 'center', 'end', 'stretch' ), true ) ? $attributes['align'] : '';

// The element's classes: the widget's own, with the layout and alignment chosen.
$harlow_classes   = array_filter(
	preg_split( '/\s+/', (string) $attributes['classes'] ),
	static function ( $name ) {
		return '' !== $name && ! preg_match( '/^elementor-tabs-(?:view|alignment)-/', $name );
	}
);
$harlow_classes   = array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-tabs' ), $harlow_classes ), $harlow_classes );
$harlow_classes[] = 'elementor-tabs-view-' . $harlow_type;
if ( '' !== $harlow_align ) {
	$harlow_classes[] = 'elementor-tabs-alignment-' . $harlow_align;
}
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', $harlow_classes );

// Elementor's ids: the first three digits of the element's id as a number, then the tab's.
$harlow_id = substr( (string) hexdec( preg_replace( '/[^0-9a-f]/i', '', (string) $attributes['element'] ) ), 0, 3 );

// A tab's content as Elementor's text editor prints it: its own paragraphs, or one.
$harlow_prose = static function ( $html ) {
	$html = harlow_resolve_links( wp_kses_post( (string) $html ) );
	return preg_match( '/<(?:p|ul|ol|h[1-6]|div|blockquote|table|figure)[\s>]/i', $html ) ? $html : '<p>' . $html . '</p>';
};

$harlow_titles   = '';
$harlow_contents = '';
foreach ( array_values( (array) $attributes['tabs'] ) as $harlow_index => $harlow_tab ) {
	$harlow_tab   = wp_parse_args(
		(array) $harlow_tab,
		array(
			'title'   => '',
			'content' => '',
		)
	);
	$harlow_count = $harlow_index + 1;
	$harlow_first = 1 === $harlow_count;
	$harlow_title = wp_kses_post( $harlow_tab['title'] );
	$harlow_ids   = 'aria-controls="elementor-tab-content-' . $harlow_id . $harlow_count . '" aria-expanded="false"';
	$harlow_state = 'aria-selected="' . ( $harlow_first ? 'true' : 'false' ) . '" data-tab="' . $harlow_count . '" role="tab" tabindex="' . ( $harlow_first ? '0' : '-1' ) . '"';

	$harlow_titles .= "\n" . '<div id="elementor-tab-title-' . $harlow_id . $harlow_count . '" class="elementor-tab-title elementor-tab-desktop-title" ' . $harlow_state . ' ' . $harlow_ids . '>' . $harlow_title . '</div>';

	$harlow_contents .= "\n" . '<div class="elementor-tab-title elementor-tab-mobile-title" ' . $harlow_state . ' ' . $harlow_ids . '>' . $harlow_title . '</div>'
		. "\n" . '<div id="elementor-tab-content-' . $harlow_id . $harlow_count . '" class="elementor-tab-content elementor-clearfix" data-tab="' . $harlow_count . '" role="tabpanel" aria-labelledby="elementor-tab-title-' . $harlow_id . $harlow_count . '" tabindex="0" hidden="' . ( $harlow_first ? 'false' : 'hidden' ) . '">'
		. $harlow_prose( $harlow_tab['content'] ) . '</div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'tabs.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-tabs">' . "\n"
	. '<div class="elementor-tabs-wrapper" role="tablist">' . $harlow_titles . "\n" . '</div>' . "\n"
	. '<div class="elementor-tabs-content-wrapper" role="tablist" aria-orientation="vertical">' . $harlow_contents . "\n" . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
