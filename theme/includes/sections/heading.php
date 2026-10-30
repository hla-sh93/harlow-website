<?php
/**
 * A heading (harlow/heading): Elementor's heading widget, a title of any level or a line
 * of words in the design's heading styles.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_tag = in_array( $attributes['tag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' ), true ) ? $attributes['tag'] : 'h2';
?>
<div<?php echo harlow_element_attributes( $attributes, 'widget', 'heading.default' ); ?>>
<div class="elementor-widget-container">
<<?php echo esc_html( $harlow_tag ); ?> class="elementor-heading-title elementor-size-<?php echo esc_attr( $attributes['size'] ); ?>"><?php echo wp_kses_post( harlow_resolve_links( $attributes['text'] ) ); ?></<?php echo esc_html( $harlow_tag ); ?>>
</div>
</div><?php
