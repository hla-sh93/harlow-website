<?php
/**
 * A form (harlow/form): Elementor Pro's form widget, the owner's own form. Its markup is
 * built by harlow_form_markup() (functions/widgets/form.php), which the sending shares;
 * assets/js/widgets/form.js sends it without leaving the page and walks its steps.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_settings = harlow_form_settings( $attributes );
$harlow_element  = $attributes;
// The button's alignment, per device, as Elementor's prefix classes on the widget.
$harlow_element['classes'] = trim( $attributes['classes'] . harlow_form_root_classes( $harlow_settings ) );

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'form.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. harlow_form_markup( $attributes ) . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the form are escaped where they are built.
