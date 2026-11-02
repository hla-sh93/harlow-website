<?php
/**
 * A hotspot (harlow/hotspot): Elementor Pro's hotspot widget, a picture with spots on it,
 * each placed by its distance in % from a side (--hotspot-translate-x and -y, the custom
 * properties Elementor sets for each spot) and drawn as a pulsing circle, an icon or a
 * label. A spot shows its tooltip on click or hover (assets/js/widgets/hotspot.js, from
 * the element's data-settings as Elementor keeps them), or leads to its link.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_positions  = array( 'top', 'right', 'bottom', 'left' );
$harlow_trigger    = in_array( $attributes['tooltipTrigger'], array( 'click', 'mouseenter', 'none' ), true ) ? $attributes['tooltipTrigger'] : 'click';
$harlow_tooltip_fx = in_array( $attributes['tooltipAnimation'], array( 'e-hotspot--fade-in-out', 'e-hotspot--fade-grow', 'e-hotspot--fade-direction', 'e-hotspot--slide-direction' ), true ) ? $attributes['tooltipAnimation'] : 'e-hotspot--fade-in-out';
$harlow_spot_fx    = in_array( $attributes['hotspotAnimation'], array( 'e-hotspot--soft-beat', 'e-hotspot--expand', 'e-hotspot--overlay', '' ), true ) ? $attributes['hotspotAnimation'] : 'e-hotspot--expand';
$harlow_direction  = in_array( $harlow_tooltip_fx, array( 'e-hotspot--fade-direction', 'e-hotspot--slide-direction' ), true );
$harlow_position   = in_array( $attributes['tooltipPosition'], $harlow_positions, true ) ? $attributes['tooltipPosition'] : 'top';

// The element's classes: the widget's own when it has none yet.
$harlow_classes            = array_filter( preg_split( '/\s+/', (string) $attributes['classes'] ) );
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-hotspot' ), $harlow_classes ), $harlow_classes ) );

// The settings the script reads, over those the element came with.
$harlow_settings            = json_decode( '' !== $attributes['settings'] ? $attributes['settings'] : '{}', true );
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_settings ) ? $harlow_settings : array(),
		array(
			'tooltip_position'                     => $harlow_position,
			'tooltip_trigger'                      => $harlow_trigger,
			'tooltip_animation'                    => $harlow_tooltip_fx,
			'tooltip_animation_duration'           => max( 0, (int) $attributes['tooltipDuration'] ),
			'hotspot_animation'                    => $harlow_spot_fx,
			'hotspot_sequenced_animation'          => $attributes['sequenced'] ? 'yes' : '',
			'hotspot_sequenced_animation_duration' => max( 0, (int) $attributes['sequencedDuration'] ),
		)
	)
);

// The picture, or a grey placeholder as Elementor shows one until a picture is chosen.
$harlow_size = in_array( $attributes['imageSize'], get_intermediate_image_sizes(), true ) ? $attributes['imageSize'] : 'full';
if ( $attributes['image'] && wp_attachment_is_image( $attributes['image'] ) ) {
	$harlow_extra = array( 'class' => 'attachment-' . $harlow_size . ' size-' . $harlow_size . ' wp-image-' . $attributes['image'] );
	if ( '' !== $attributes['alt'] ) {
		$harlow_extra['alt'] = $attributes['alt'];
	}
	$harlow_picture = wp_get_attachment_image( $attributes['image'], $harlow_size, false, $harlow_extra );
} else {
	$harlow_picture = '<img src="' . esc_attr( "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23e6e9ec'/%3E%3C/svg%3E" ) . '" width="800" height="450" alt="' . esc_attr( $attributes['alt'] ) . '">';
}

$harlow_spots = '';
foreach ( array_values( (array) $attributes['hotspots'] ) as $harlow_index => $harlow_spot ) {
	$harlow_spot    = wp_parse_args(
		(array) $harlow_spot,
		array(
			'id'              => '',
			'label'           => '',
			'icon'            => '',
			'link'            => '',
			'linkTarget'      => '',
			'linkRel'         => '',
			'x'               => 50,
			'horizontal'      => 'left',
			'y'               => 50,
			'vertical'        => 'top',
			'tooltip'         => '',
			'tooltipPosition' => '',
		)
	);
	$harlow_item_id = preg_match( '/^[0-9a-z]{1,16}$/i', (string) $harlow_spot['id'] ) ? $harlow_spot['id'] : substr( md5( $attributes['element'] . $harlow_index ), 0, 7 );
	$harlow_link    = '' !== $harlow_spot['link'];
	$harlow_icon    = harlow_icon( $harlow_spot['icon'] );
	$harlow_label   = wp_kses_post( $harlow_spot['label'] );
	$harlow_own     = in_array( $harlow_spot['tooltipPosition'], $harlow_positions, true ) ? $harlow_spot['tooltipPosition'] : '';
	$harlow_shows   = 'none' !== $harlow_trigger && ! ( 'click' === $harlow_trigger && $harlow_link );

	$harlow_spot_classes = array(
		'e-hotspot',
		'elementor-repeater-item-' . $harlow_item_id,
		$attributes['sequenced'] ? 'e-hotspot--sequenced' : '',
		'e-hotspot--position-' . ( 'right' === $harlow_spot['horizontal'] ? 'right' : 'left' ),
		'e-hotspot--position-' . ( 'bottom' === $harlow_spot['vertical'] ? 'bottom' : 'top' ),
		$harlow_link ? 'e-hotspot--link' : '',
		'click' === $harlow_trigger && $harlow_link ? 'e-hotspot--no-tooltip' : '',
		'' === $harlow_label && '' === $harlow_icon ? 'e-hotspot--circle' : '',
		'' === $harlow_label && '' !== $harlow_icon ? 'e-hotspot--icon' : '',
		'e-hotspot--tooltip-position-' . ( '' !== $harlow_own ? $harlow_own : $harlow_position ),
	);
	$harlow_place        = '--hotspot-translate-x: ' . min( 100, max( 0, (float) $harlow_spot['x'] ) ) . '%; --hotspot-translate-y: ' . min( 100, max( 0, (float) $harlow_spot['y'] ) ) . '%;';
	$harlow_tag          = $harlow_link ? 'a' : 'div';
	$harlow_open         = '<' . $harlow_tag . ' class="' . esc_attr( implode( ' ', array_filter( $harlow_spot_classes ) ) ) . '" style="' . esc_attr( $harlow_place ) . '"' . ( $harlow_link ? harlow_link_attributes( $harlow_spot ) : '' ) . '>';

	// The spot: a circle, or its icon and label.
	if ( '' === $harlow_label && '' === $harlow_icon ) {
		$harlow_button = "\n" . '<div class="e-hotspot__outer-circle"></div>' . "\n" . '<div class="e-hotspot__inner-circle"></div>' . "\n";
	} else {
		$harlow_button = ( '' !== $harlow_icon ? "\n" . '<div class="e-hotspot__icon">' . $harlow_icon . '</div>' : '' )
			. ( '' !== $harlow_label ? "\n" . '<div class="e-hotspot__label">' . $harlow_label . '</div>' : '' ) . "\n";
	}

	// Its tooltip, in a mask for the animations that come from a side.
	$harlow_tooltip = '';
	if ( $harlow_shows ) {
		$harlow_override = $harlow_direction && '' !== $harlow_own ? ' e-hotspot--override-tooltip-animation-from-' . $harlow_own : '';
		$harlow_tooltip  = '<div class="e-hotspot__tooltip' . ( $harlow_direction ? '' : ' e-hotspot--tooltip-position' ) . ' ' . $harlow_tooltip_fx . $harlow_override . '">' . wp_kses_post( $harlow_spot['tooltip'] ) . '</div>';
		if ( $harlow_direction ) {
			$harlow_tooltip = '<div class="e-hotspot__direction-mask e-hotspot--tooltip-position">' . "\n" . $harlow_tooltip . "\n" . '</div>';
		}
		$harlow_tooltip = "\n" . $harlow_tooltip;
	}

	$harlow_spots .= "\n" . $harlow_open . "\n"
		. '<div class="e-hotspot__button' . ( '' !== $harlow_spot_fx ? ' ' . $harlow_spot_fx : '' ) . '">' . $harlow_button . '</div>'
		. $harlow_tooltip . "\n"
		. '</' . $harlow_tag . '>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'hotspot.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_picture
	. $harlow_spots . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
