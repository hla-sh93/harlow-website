<?php
/**
 * The item pager (harlow/post-navigation): Elementor Pro's post navigation widget, links to
 * the item before and after the one the page shows (of its type, in the same term when
 * asked), each with its label, title and arrow, a line between them and borders around.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_arrows = array( 'angle', 'angle-double', 'chevron', 'caret', 'arrow' );
$harlow_arrow  = in_array( $attributes['arrow'], $harlow_arrows, true ) ? $attributes['arrow'] : 'angle';
$harlow_prev   = '';
$harlow_next   = '';
if ( $attributes['showArrow'] ) {
	$harlow_prev = '<span class="post-navigation__arrow-wrapper post-navigation__arrow-prev">' . harlow_theme_builder_icon( $harlow_arrow . '-left' ) . '<span class="elementor-screen-only">' . esc_html__( 'Prev', 'harlow' ) . '</span></span>';
	$harlow_next = '<span class="post-navigation__arrow-wrapper post-navigation__arrow-next">' . harlow_theme_builder_icon( $harlow_arrow . '-right' ) . '<span class="elementor-screen-only">' . esc_html__( 'Next', 'harlow' ) . '</span></span>';
}
$harlow_prev_words = ( $attributes['showLabel'] ? '<span class="post-navigation__prev--label">' . esc_html( $attributes['prevLabel'] ) . '</span>' : '' )
	. ( $attributes['showTitle'] ? '<span class="post-navigation__prev--title">%title</span>' : '' );
$harlow_next_words = ( $attributes['showLabel'] ? '<span class="post-navigation__next--label">' . esc_html( $attributes['nextLabel'] ) . '</span>' : '' )
	. ( $attributes['showTitle'] ? '<span class="post-navigation__next--title">%title</span>' : '' );
$harlow_taxonomy   = sanitize_key( $attributes['taxonomy'] );
$harlow_same       = (bool) $attributes['sameTerm'];

// Where the page has no item of its own (an item page template's screen), a sample post's
// neighbours.
$harlow_sample = harlow_theme_builder_is_sample() ? harlow_theme_builder_post() : null;
if ( $harlow_sample ) {
	$harlow_query = new WP_Query(
		array(
			'p'         => $harlow_sample->ID,
			'post_type' => $harlow_sample->post_type,
		)
	);
	$harlow_query->the_post();
}
$harlow_prev_link = get_previous_post_link( '%link', $harlow_prev . '<span class="elementor-post-navigation__link__prev">' . $harlow_prev_words . '</span>', $harlow_same, '', $harlow_taxonomy );
$harlow_next_link = get_next_post_link( '%link', '<span class="elementor-post-navigation__link__next">' . $harlow_next_words . '</span>' . $harlow_next, $harlow_same, '', $harlow_taxonomy );
if ( $harlow_sample ) {
	wp_reset_postdata();
}

$harlow_html = '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, 'post-navigation', $attributes['showBorders'] ? array( 'elementor-post-navigation-borders-yes' ) : array() ), 'widget', 'post-navigation.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<nav class="elementor-post-navigation" aria-label="' . esc_attr__( 'Post Navigation', 'harlow' ) . '">' . "\n"
	. '<div class="elementor-post-navigation__prev elementor-post-navigation__link">' . "\n" . $harlow_prev_link . "\n" . '</div>' . "\n"
	. ( $attributes['showBorders'] ? '<div class="elementor-post-navigation__separator-wrapper">' . "\n" . '<div class="elementor-post-navigation__separator"></div>' . "\n" . '</div>' . "\n" : '' )
	. '<div class="elementor-post-navigation__next elementor-post-navigation__link">' . "\n" . $harlow_next_link . "\n" . '</div>' . "\n"
	. '</nav>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WordPress's own links, the words escaped above; the attributes in harlow_element_attributes().
