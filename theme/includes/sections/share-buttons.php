<?php
/**
 * Share buttons (harlow/share-buttons): Elementor Pro's share buttons widget, a button per
 * network (icon and name, icon or name), in five skins and three shapes, in columns or as
 * many as fit; a click shares the page, or the owner's address, on that network, by
 * e-mail or prints it (assets/js/widgets/share-buttons.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_view     = in_array( $attributes['view'], array( 'icon-text', 'icon', 'text' ), true ) ? $attributes['view'] : 'icon-text';
$harlow_skin     = in_array( $attributes['skin'], array( 'gradient', 'minimal', 'framed', 'boxed', 'flat' ), true ) ? $attributes['skin'] : 'gradient';
$harlow_shape    = in_array( $attributes['shape'], array( 'square', 'rounded', 'circle' ), true ) ? $attributes['shape'] : 'square';
$harlow_colour   = 'custom' === $attributes['colorMode'] ? 'custom' : 'official';
$harlow_networks = harlow_share_buttons_networks();

// Elementor's classes when the block has none yet, and the widget's own: view, skin, shape,
// columns per device, colours and alignment (their rules are in share-buttons.css).
$harlow_element = $attributes;
if ( '' === trim( $harlow_element['classes'] ) ) {
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-share-buttons';
}
$harlow_classes = array(
	'elementor-share-buttons--view-' . $harlow_view,
	'elementor-share-buttons--skin-' . $harlow_skin,
	'elementor-share-buttons--shape-' . $harlow_shape,
	'elementor-grid-' . max( 0, min( 6, (int) $attributes['columns'] ) ),
);
foreach ( array(
	'Tablet' => 'tablet',
	'Mobile' => 'mobile',
) as $harlow_device => $harlow_suffix ) {
	if ( '' !== (string) $attributes[ 'columns' . $harlow_device ] && is_numeric( $attributes[ 'columns' . $harlow_device ] ) ) {
		$harlow_classes[] = 'elementor-grid-' . $harlow_suffix . '-' . max( 0, min( 6, (int) $attributes[ 'columns' . $harlow_device ] ) );
	}
}
$harlow_classes[] = 'elementor-share-buttons--color-' . $harlow_colour;
if ( in_array( $attributes['align'], array( 'left', 'center', 'right', 'justify' ), true ) ) {
	$harlow_classes[] = 'elementor-share-buttons--align-' . $attributes['align'];
}
$harlow_element['classes'] .= ' ' . implode( ' ', $harlow_classes );
$harlow_own                 = '' !== $attributes['settings'] ? json_decode( $attributes['settings'], true ) : array();
$harlow_element['settings'] = (string) wp_json_encode( array_merge( is_array( $harlow_own ) ? $harlow_own : array(), harlow_share_buttons_target( $attributes ) ) );

// The owner's own colours, as the custom properties the custom colour rules read.
$harlow_style = '';
if ( 'custom' === $harlow_colour ) {
	foreach ( array(
		'primaryColor'   => 'primary-color',
		'secondaryColor' => 'secondary-color',
		'primaryHover'   => 'primary-color-hover',
		'secondaryHover' => 'secondary-color-hover',
	) as $harlow_key => $harlow_property ) {
		$harlow_value = harlow_share_buttons_colour( $attributes[ $harlow_key ] );
		if ( '' !== $harlow_value ) {
			$harlow_style .= '--e-share-buttons-' . $harlow_property . ':' . $harlow_value . ';';
		}
	}
}

$harlow_items = '';
foreach ( is_array( $attributes['buttons'] ) ? $attributes['buttons'] : array() as $harlow_button ) {
	$harlow_network = is_array( $harlow_button ) && isset( $harlow_button['network'] ) ? (string) $harlow_button['network'] : '';
	if ( ! isset( $harlow_networks[ $harlow_network ] ) ) {
		continue;
	}
	$harlow_title  = isset( $harlow_button['text'] ) && '' !== trim( (string) $harlow_button['text'] ) ? trim( (string) $harlow_button['text'] ) : $harlow_networks[ $harlow_network ]['title'];
	$harlow_items .= '<div class="elementor-grid-item" role="listitem">' . "\n"
		/* translators: %s: the network's name. */
		. '<div class="elementor-share-btn elementor-share-btn_' . esc_attr( $harlow_network ) . '" role="button" tabindex="0" aria-label="' . esc_attr( sprintf( __( 'Share on %s', 'harlow' ), $harlow_networks[ $harlow_network ]['title'] ) ) . '">' . "\n";
	if ( 'text' !== $harlow_view ) {
		$harlow_items .= '<span class="elementor-share-btn__icon">' . "\n" . harlow_icon( $harlow_networks[ $harlow_network ]['icon'] ) . "\n" . '</span>' . "\n";
	}
	if ( 'text' === $harlow_view || ( 'icon-text' === $harlow_view && $attributes['showLabel'] ) ) {
		$harlow_items .= '<div class="elementor-share-btn__text">' . "\n"
			. '<span class="elementor-share-btn__title">' . "\n" . esc_html( $harlow_title ) . "\n" . '</span>' . "\n"
			. '</div>' . "\n";
	}
	$harlow_items .= '</div>' . "\n" . '</div>' . "\n";
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'share-buttons.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-grid" role="list"' . ( '' !== $harlow_style ? ' style="' . esc_attr( $harlow_style ) . '"' : '' ) . '>' . "\n"
	. $harlow_items
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the icons are escaped where they are built.
