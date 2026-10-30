<?php
/**
 * The list block (harlow/loop): Elementor's loop grid or loop carousel, as live prints
 * it, with the items WordPress has.
 *
 * Attributes: the widget's element id, design classes and settings (from the page it is
 * on); which items (type, how many, by date or by their order, which first); which card;
 * grid, carousel, plain (the cards alone), or box (the cards in a container of the page,
 * the list's own element: the client logos, a grid of the major clients section, whose
 * id, classes and settings are then the container's); the pager under a grid.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_templates = harlow_loop_templates();
$harlow_template  = isset( $harlow_templates[ $attributes['template'] ] ) ? $attributes['template'] : 'post-card';
$harlow_carousel  = 'carousel' === $attributes['layout'];
$harlow_plain     = in_array( $attributes['layout'], array( 'plain', 'box' ), true );
// Only a list with a pager follows the page number (/blog/2/); the others show their first page.
$harlow_page      = '' !== $attributes['pagination'] ? max( 1, (int) get_query_var( 'page' ), (int) get_query_var( 'paged' ) ) : 1;
$harlow_items     = new WP_Query(
	array(
		'post_type'           => sanitize_key( $attributes['postType'] ),
		'post_status'         => 'publish',
		'posts_per_page'      => max( 1, (int) $attributes['perPage'] ),
		'paged'               => $harlow_page,
		'orderby'             => 'menu_order' === $attributes['orderby'] ? 'menu_order' : 'date',
		'order'               => 'ASC' === $attributes['order'] ? 'ASC' : 'DESC',
		'ignore_sticky_posts' => true,
	)
);
$harlow_pages     = (int) $harlow_items->max_num_pages;
$harlow_permalink = trailingslashit( (string) get_permalink() );

if ( $harlow_plain ) {
	ob_start();
	while ( $harlow_items->have_posts() ) {
		$harlow_items->the_post();
		get_template_part( 'includes/loops/' . $harlow_template );
	}
	wp_reset_postdata();
	$harlow_cards = (string) ob_get_clean();
	if ( 'box' === $attributes['layout'] ) {
		$harlow_box   = array(
			'classes'  => $attributes['classes'],
			'element'  => $attributes['widget'],
			'settings' => $attributes['settings'],
			'htmlId'   => '',
		);
		$harlow_cards = '<div' . harlow_element_attributes( $harlow_box, 'container' ) . '>'
			. ( $attributes['boxed'] ? "\n" . '<div class="e-con-inner">' . "\n" . $harlow_cards . "\n" . '</div>' . "\n" : "\n" . $harlow_cards . "\n" )
			. '</div>';
	}
	echo $harlow_cards; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the cards are escaped where they are printed (includes/loops/), the box's attributes in harlow_element_attributes().
	return;
}
?>
<div class="<?php echo esc_attr( $attributes['classes'] ); ?>" data-id="<?php echo esc_attr( $attributes['widget'] ); ?>" data-element_type="widget" data-e-type="widget" data-settings="<?php echo esc_attr( $attributes['settings'] ); ?>" data-widget_type="<?php echo $harlow_carousel ? 'loop-carousel.post' : 'loop-grid.post'; ?>">
	<div class="elementor-widget-container">
		<?php if ( $harlow_carousel ) : ?>
		<div class="swiper elementor-loop-container elementor-grid" role="list" dir="ltr">
			<div class="swiper-wrapper" aria-live="off">
		<?php else : ?>
		<div class="elementor-loop-container elementor-grid" role="list">
		<?php endif; ?>
			<?php
			harlow_loop_is_carousel( $harlow_carousel );
			while ( $harlow_items->have_posts() ) {
				$harlow_items->the_post();
				get_template_part( 'includes/loops/' . $harlow_template );
			}
			harlow_loop_is_carousel( false );
			wp_reset_postdata();
			?>
		</div>
		<?php if ( $harlow_carousel ) : ?>
		</div>
		<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0" aria-label="<?php esc_attr_e( 'Previous', 'harlow' ); ?>">
			<svg aria-hidden="true" class="e-font-icon-svg e-fas-arrow-left" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path></svg>
		</div>
		<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0" aria-label="<?php esc_attr_e( 'Next', 'harlow' ); ?>">
			<svg aria-hidden="true" class="e-font-icon-svg e-fas-arrow-right" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path></svg>
		</div>
		<?php endif; ?>
		<?php if ( 'numbers' === $attributes['pagination'] && $harlow_pages > 1 ) : ?>
		<div class="e-load-more-anchor" data-page="<?php echo esc_attr( (string) $harlow_page ); ?>" data-max-page="<?php echo esc_attr( (string) $harlow_pages ); ?>" data-next-page="<?php echo esc_url( $harlow_permalink . ( $harlow_page + 1 ) . '/' ); /* the next page even on the last, as Elementor writes it */ ?>"></div>
		<nav class="elementor-pagination" aria-label="<?php esc_attr_e( 'Pagination', 'harlow' ); ?>">
			<?php
			echo wp_kses_post(
				(string) paginate_links(
					array(
						'base'               => $harlow_permalink . '%_%',
						'format'             => '%#%/',
						'current'            => $harlow_page,
						'total'              => $harlow_pages,
						'prev_next'          => false,
						'before_page_number' => '<span class="elementor-screen-only">' . esc_html__( 'Page', 'harlow' ) . '</span>',
					)
				)
			);
			?>
		</nav>
		<?php endif; ?>
	</div>
</div>
