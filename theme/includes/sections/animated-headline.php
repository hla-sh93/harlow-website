<?php
/**
 * An animated headline (harlow/animated-headline): Elementor Pro's animated headline
 * widget. Highlighted: words before and after, and between them the highlighted words
 * with a shape drawn over them (a circle, an underline, a cross...) when the headline
 * comes into view. Rotating: the rotating words take turns (typing, clip, flip, swirl,
 * blinds, drop-in, wave, slide, slide down). assets/js/widgets/animated-headline.js runs
 * both from the element's data-settings, as Elementor's script does; the shape is printed
 * here, where Elementor's script draws it, with the owner's width and edges.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Elementor Pro's shapes, in a 500 x 150 box stretched over the highlighted words.
$harlow_shapes = array(
	'circle'           => array( 'M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7' ),
	'underline_zigzag' => array( 'M9.3,127.3c49.3-3,150.7-7.6,199.7-7.4c121.9,0.4,189.9,0.4,282.3,7.2C380.1,129.6,181.2,130.6,70,139 c82.6-2.9,254.2-1,335.9,1.3c-56,1.4-137.2-0.3-197.1,9' ),
	'x'                => array( 'M497.4,23.9C301.6,40,155.9,80.6,4,144.4', 'M14.1,27.6c204.5,20.3,393.8,74,467.3,111.7' ),
	'strikethrough'    => array( 'M3,75h493.5' ),
	'curly'            => array( 'M3,146.1c17.1-8.8,33.5-17.8,51.4-17.8c15.6,0,17.1,18.1,30.2,18.1c22.9,0,36-18.6,53.9-18.6 c17.1,0,21.3,18.5,37.5,18.5c21.3,0,31.8-18.6,49-18.6c22.1,0,18.8,18.8,36.8,18.8c18.8,0,37.5-18.6,49-18.6c20.4,0,17.1,19,36.8,19 c22.9,0,36.8-20.6,54.7-18.6c17.7,1.4,7.1,19.5,33.5,18.8c17.1,0,47.2-6.5,61.1-15.6' ),
	'diagonal'         => array( 'M13.5,15.5c131,13.7,289.3,55.5,475,125.5' ),
	'double'           => array( 'M8.4,143.1c14.2-8,97.6-8.8,200.6-9.2c122.3-0.4,287.5,7.2,287.5,7.2', 'M8,19.4c72.3-5.3,162-7.8,216-7.8c54,0,136.2,0,267,7.8' ),
	'double_underline' => array( 'M5,125.4c30.5-3.8,137.9-7.6,177.3-7.6c117.2,0,252.2,4.7,312.7,7.6', 'M26.9,143.8c55.1-6.1,126-6.3,162.2-6.1c46.5,0.2,203.9,3.2,268.9,6.4' ),
	'underline'        => array( 'M7.7,145.6C109,125,299.9,116.2,401,121.3c42.1,2.2,87.6,11.8,87.3,25.7' ),
);
$harlow_types  = array( 'typing', 'clip', 'flip', 'swirl', 'blinds', 'drop-in', 'wave', 'slide', 'slide-down' );

$harlow_style  = 'rotate' === $attributes['headlineStyle'] ? 'rotate' : 'highlight';
$harlow_marker = isset( $harlow_shapes[ $attributes['marker'] ] ) ? $attributes['marker'] : 'circle';
$harlow_type   = in_array( $attributes['animationType'], $harlow_types, true ) ? $attributes['animationType'] : 'typing';
$harlow_tag    = in_array( $attributes['tag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['tag'] : 'h3';
$harlow_words  = array_values( array_filter( array_map( 'trim', preg_split( '/\r?\n/', (string) $attributes['rotatingText'] ) ), 'strlen' ) );

// The element's classes: the widget's own, with the headline's style.
$harlow_classes            = array_filter(
	preg_split( '/\s+/', (string) $attributes['classes'] ),
	static function ( $name ) {
		return '' !== $name && 0 !== strpos( $name, 'elementor-headline--style-' );
	}
);
$harlow_classes            = array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-animated-headline' ), $harlow_classes ), $harlow_classes );
$harlow_classes[]          = 'elementor-headline--style-' . $harlow_style;
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', $harlow_classes );

// The settings the script reads, over those the element came with.
$harlow_settings            = json_decode( '' !== $attributes['settings'] ? $attributes['settings'] : '{}', true );
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_settings ) ? $harlow_settings : array(),
		array(
			'headline_style'               => $harlow_style,
			'animation_type'               => $harlow_type,
			'marker'                       => $harlow_marker,
			'highlighted_text'             => wp_strip_all_tags( $attributes['highlightedText'] ),
			'rotating_text'                => implode( "\n", $harlow_words ),
			'loop'                         => $attributes['loop'] ? 'yes' : '',
			'highlight_animation_duration' => max( 0, (int) $attributes['highlightDuration'] ),
			'highlight_iteration_delay'    => max( 0, (int) $attributes['highlightDelay'] ),
			'rotate_iteration_delay'       => max( 0, (int) $attributes['rotateDelay'] ),
		)
	)
);

$harlow_headline = 'elementor-headline';
if ( 'rotate' === $harlow_style ) {
	$harlow_headline .= ' elementor-headline-animation-type-' . $harlow_type;
	if ( in_array( $harlow_type, array( 'typing', 'swirl', 'blinds', 'wave' ), true ) ) {
		$harlow_headline .= ' elementor-headline-letters';
	}
}

// The words that move, or the highlighted words with their shape.
$harlow_dynamic = '';
if ( 'rotate' === $harlow_style ) {
	foreach ( $harlow_words as $harlow_index => $harlow_word ) {
		$harlow_dynamic .= "\n" . '<span class="elementor-headline-dynamic-text' . ( 0 === $harlow_index ? ' elementor-headline-text-active' : '' ) . '">'
			. str_replace( ' ', '&nbsp;', esc_html( $harlow_word ) ) . '</span>';
	}
} elseif ( '' !== $attributes['highlightedText'] ) {
	$harlow_stroke = ' stroke-width="' . esc_attr( (string) max( 1, min( 50, (float) $attributes['markerWidth'] ) ) ) . '"';
	if ( $attributes['markerRounded'] ) {
		$harlow_stroke .= ' stroke-linecap="round" stroke-linejoin="round"';
	}
	$harlow_paths = '';
	foreach ( $harlow_shapes[ $harlow_marker ] as $harlow_path ) {
		$harlow_paths .= '<path d="' . esc_attr( $harlow_path ) . '"' . $harlow_stroke . '></path>';
	}
	$harlow_dynamic = "\n" . '<span class="elementor-headline-dynamic-text elementor-headline-text-active">' . wp_kses_post( $attributes['highlightedText'] ) . '</span>'
		. "\n" . '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150" preserveAspectRatio="none" aria-hidden="true"' . ( $attributes['markerFront'] ? ' style="z-index: 2"' : '' ) . '>' . $harlow_paths . '</svg>';
}

$harlow_inner = '<' . $harlow_tag . ' class="' . esc_attr( $harlow_headline ) . '">';
if ( '' !== $attributes['beforeText'] ) {
	$harlow_inner .= "\n" . '<span class="elementor-headline-plain-text elementor-headline-text-wrapper">' . wp_kses_post( $attributes['beforeText'] ) . '</span>';
}
$harlow_inner .= "\n" . '<span class="elementor-headline-dynamic-wrapper elementor-headline-text-wrapper">' . $harlow_dynamic . "\n" . '</span>';
if ( '' !== $attributes['afterText'] ) {
	$harlow_inner .= "\n" . '<span class="elementor-headline-plain-text elementor-headline-text-wrapper">' . wp_kses_post( $attributes['afterText'] ) . '</span>';
}
$harlow_inner .= "\n" . '</' . $harlow_tag . '>';
if ( '' !== $attributes['link'] ) {
	$harlow_inner = '<a' . harlow_link_attributes( $attributes ) . '>' . $harlow_inner . '</a>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'animated-headline.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
