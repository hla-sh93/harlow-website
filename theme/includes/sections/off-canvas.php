<?php
/**
 * An off-canvas panel (harlow/off-canvas): Elementor Pro's off-canvas widget, a panel
 * holding any blocks that comes in from a side of the screen over a dark overlay. It
 * opens from any link to its id (#off-canvas-<element id>) or from Elementor's own action
 * links (#elementor-action:action=off_canvas:open&settings=..., with toggle and close),
 * and closes from its close button, a click on the overlay, Escape, or a link to it inside
 * it (assets/js/widgets/off-canvas.js, from the element's data-settings).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The blocks inside the panel, printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_animations = array( 'slide', 'fade', 'zoom', 'none' );
$harlow_position   = in_array( $attributes['position'], array( 'left', 'right', 'top', 'bottom' ), true ) ? $attributes['position'] : 'left';
$harlow_unit       = in_array( $attributes['sizeUnit'], array( 'px', '%', 'vw', 'vh', 'em', 'rem' ), true ) ? $attributes['sizeUnit'] : 'px';
$harlow_size       = max( 0, (float) $attributes['size'] ) . $harlow_unit;
$harlow_vertical   = in_array( $harlow_position, array( 'top', 'bottom' ), true );

// The element's classes: the widget's own when it has none yet.
$harlow_classes            = array_filter( preg_split( '/\s+/', (string) $attributes['classes'] ) );
$harlow_element            = $attributes;
$harlow_element['classes'] = implode( ' ', array_merge( array_diff( array( 'elementor-element', 'elementor-widget', 'elementor-widget-off-canvas' ), $harlow_classes ), $harlow_classes ) );

// The settings the script reads, over those the element came with.
$harlow_settings            = json_decode( '' !== $attributes['settings'] ? $attributes['settings'] : '{}', true );
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_settings ) ? $harlow_settings : array(),
		array(
			'position'                  => $harlow_position,
			'entrance_animation'        => in_array( $attributes['openAnimation'], $harlow_animations, true ) ? $attributes['openAnimation'] : 'slide',
			'exit_animation'            => in_array( $attributes['closeAnimation'], $harlow_animations, true ) ? $attributes['closeAnimation'] : 'slide',
			'animation_duration'        => max( 0, (int) $attributes['duration'] ),
			'has_overlay'               => $attributes['overlay'] ? 'yes' : '',
			'is_not_close_on_overlay'   => $attributes['closeOnOverlay'] ? '' : 'yes',
			'is_not_close_on_esc'       => $attributes['closeOnEscape'] ? '' : 'yes',
			'prevent_scroll'            => $attributes['preventScroll'] ? 'yes' : '',
			'off_canvas_name'           => wp_strip_all_tags( $attributes['name'] ),
			'off_canvas_wrapper_suffix' => (string) $attributes['element'],
		)
	)
);

$harlow_style = $harlow_vertical
	? '--e-off-canvas-width: 100%; --e-off-canvas-height: ' . $harlow_size . ';'
	: '--e-off-canvas-width: ' . $harlow_size . '; --e-off-canvas-height: 100vh;';
$harlow_close = '';
if ( $attributes['closeButton'] ) {
	$harlow_close = '<button type="button" class="e-off-canvas__close" aria-label="' . esc_attr__( 'Close', 'harlow' ) . '">' . harlow_icon( $attributes['closeIcon'] ) . '</button>' . "\n";
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'off-canvas.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div id="off-canvas-' . esc_attr( $attributes['element'] ) . '" class="e-off-canvas e-off-canvas--' . $harlow_position . ( $attributes['overlay'] ? '' : ' e-off-canvas--no-overlay' ) . '" role="dialog" aria-hidden="true" aria-label="' . esc_attr( '' !== $attributes['name'] ? wp_strip_all_tags( $attributes['name'] ) : __( 'Off-Canvas', 'harlow' ) ) . '" aria-modal="true" inert="" data-delay-child-handlers="true" style="' . esc_attr( $harlow_style ) . '">' . "\n"
	. '<div class="e-off-canvas__overlay"></div>' . "\n"
	. '<div class="e-off-canvas__main" tabindex="-1">' . "\n"
	. $harlow_close
	. '<div class="e-off-canvas__content">' . $content . '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built; the panel's blocks are printed by WordPress.
