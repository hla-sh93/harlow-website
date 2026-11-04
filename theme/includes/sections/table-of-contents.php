<?php
/**
 * A table of contents (harlow/table-of-contents): Elementor Pro's table of contents widget,
 * a box with a title and the list of the page's headings, which
 * assets/js/widgets/table-of-contents.js makes as the page opens (the headings of the
 * levels chosen, in the container chosen, but those the exclude selectors name), giving
 * an id to a heading that has none; a click scrolls smoothly to the heading. The box can
 * be minimised from the title, and starts minimised on the devices chosen. The settings
 * are the element's data-settings, as Elementor keeps them.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_minimized = in_array( $attributes['minimizedOn'], array( 'desktop', 'tablet', 'mobile' ), true ) ? $attributes['minimizedOn'] : 'tablet';
$harlow_tags      = array_values( array_intersect( array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ), (array) $attributes['headingsTags'] ) );

// The element's classes: the widget's own, with the devices the box starts minimised on.
$harlow_classes = array_filter(
	preg_split( '/\s+/', (string) $attributes['classes'] ),
	static function ( $name ) {
		return '' !== $name && 0 !== strpos( $name, 'elementor-toc--minimized-on-' );
	}
);
$harlow_classes = array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-table-of-contents' ), $harlow_classes ), $harlow_classes );
if ( $attributes['minimizeBox'] ) {
	$harlow_classes[] = 'elementor-toc--minimized-on-' . $harlow_minimized;
}
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', $harlow_classes );

// The settings the script reads, over those the element came with.
$harlow_settings            = json_decode( '' !== $attributes['settings'] ? $attributes['settings'] : '{}', true );
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_settings ) ? $harlow_settings : array(),
		array(
			'headings_by_tags'             => $harlow_tags ? $harlow_tags : array( 'h2' ),
			'container'                    => (string) $attributes['container'],
			'exclude_headings_by_selector' => (string) $attributes['exclude'],
			'marker_view'                  => 'bullets' === $attributes['markerView'] ? 'bullets' : 'numbers',
			'icon'                         => array( 'rendered_tag' => harlow_icon( $attributes['icon'] ) ),
			'hierarchical_view'            => $attributes['hierarchical'] ? 'yes' : '',
			'collapse_subitems'            => $attributes['hierarchical'] && $attributes['collapseSubitems'] ? 'yes' : '',
			'minimize_box'                 => $attributes['minimizeBox'] ? 'yes' : '',
			'minimized_on'                 => $harlow_minimized,
			'no_headings_message'          => wp_strip_all_tags( $attributes['noHeadingsMessage'] ),
			'scroll_offset'                => max( 0, (int) $attributes['offset'] ),
		)
	)
);

$harlow_id       = 'elementor-toc__' . $attributes['element'];
$harlow_tag      = in_array( $attributes['htmlTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['htmlTag'] : 'h4';
$harlow_body     = 'elementor-toc__body' . ( $attributes['hierarchical'] && $attributes['collapseSubitems'] ? ' elementor-toc__list-items--collapsible' : '' );
$harlow_controls = 'role="button" tabindex="0" aria-controls="' . esc_attr( $harlow_id ) . '" aria-expanded="true"';
$harlow_buttons  = '';
if ( $attributes['minimizeBox'] ) {
	$harlow_buttons = "\n" . '<div class="elementor-toc__toggle-button elementor-toc__toggle-button--expand" ' . $harlow_controls . ' aria-label="' . esc_attr__( 'Open table of contents', 'harlow' ) . '">' . harlow_icon( $attributes['expandIcon'] ) . '</div>'
		. "\n" . '<div class="elementor-toc__toggle-button elementor-toc__toggle-button--collapse" ' . $harlow_controls . ' aria-label="' . esc_attr__( 'Close table of contents', 'harlow' ) . '">' . harlow_icon( $attributes['collapseIcon'] ) . '</div>';
}
$harlow_spinner = '<svg aria-hidden="true" class="elementor-toc__spinner eicon-animation-spin e-font-icon-svg e-eicon-loading" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M500 975V858C696 858 858 696 858 500S696 142 500 142 142 304 142 500H25C25 237 238 25 500 25S975 237 975 500 763 975 500 975Z"></path></svg>';

// The list is built from the page's headings by the page's script (table-of-contents.js),
// which does not run in the editor: there the list is a sample in the script's markup, so
// its text, markers and indent can be seen and styled.
$harlow_inside = '<div class="elementor-toc__spinner-container">' . "\n" . $harlow_spinner . "\n" . '</div>';
if ( wp_is_serving_rest_request() ) {
	$harlow_list   = 'bullets' === $attributes['markerView'] ? 'ul' : 'ol';
	$harlow_marker = 'bullets' === $attributes['markerView'] ? harlow_icon( $attributes['icon'] ) : '';
	$harlow_item   = static function ( $text, $top, $inner = '' ) use ( $harlow_marker ) {
		return '<li class="elementor-toc__list-item"><div class="elementor-toc__list-item-text-wrapper">' . $harlow_marker
			. '<a href="#" class="elementor-toc__list-item-text' . ( $top ? ' elementor-toc__top-level' : '' ) . '">' . esc_html( $text ) . '</a></div>' . $inner . '</li>';
	};
	$harlow_inside = '<' . $harlow_list . ' class="elementor-toc__list-wrapper">'
		. $harlow_item( __( 'A heading of the page', 'harlow' ), true, '<' . $harlow_list . ' class="elementor-toc__list-wrapper">' . $harlow_item( __( 'A heading under it', 'harlow' ), false ) . '</' . $harlow_list . '>' )
		. $harlow_item( __( 'Another heading', 'harlow' ), true )
		. '</' . $harlow_list . '>';
}
$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'table-of-contents.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-toc__header" aria-controls="' . esc_attr( $harlow_id ) . '">' . "\n"
	. '<' . $harlow_tag . ' class="elementor-toc__header-title">' . wp_kses_post( $attributes['title'] ) . '</' . $harlow_tag . '>'
	. $harlow_buttons . "\n"
	. '</div>' . "\n"
	. '<div id="' . esc_attr( $harlow_id ) . '" class="' . esc_attr( $harlow_body ) . '">' . "\n"
	. $harlow_inside . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
