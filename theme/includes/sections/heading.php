<?php
/**
 * A heading (harlow/heading): Elementor's heading widget, a title of any level or a line
 * of words in the design's heading styles; on an item's page, the item's title, date or a
 * field of it (source).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_tag  = in_array( $attributes['tag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' ), true ) ? $attributes['tag'] : 'h2';
$harlow_text = '' !== $attributes['source'] ? harlow_item_text( $attributes['source'] ) : harlow_resolve_links( $attributes['text'] );
?>
<div<?php echo harlow_element_attributes( $attributes, 'widget', 'heading.default' ); ?>>
<div class="elementor-widget-container">
<<?php echo esc_html( $harlow_tag ); ?> class="elementor-heading-title elementor-size-<?php echo esc_attr( $attributes['size'] ); ?>"><?php echo wp_kses_post( $harlow_text ); ?></<?php echo esc_html( $harlow_tag ); ?>>
</div>
</div><?php
