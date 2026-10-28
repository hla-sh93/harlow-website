<?php
/**
 * A project as a card: picture, name, the first words, Read More.
 *
 * Elementor's loop item #4279 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="4279" class="<?php echo esc_attr( harlow_loop_item_class( 4279 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element e-flex e-con-boxed e-con e-parent hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-100pct hl-v-display-flex hl-v-flex-direction-column hl-v-flex-wrap-mobile-wrap hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0 hl-bgc-f2f2f2--bg" data-id="99e4241" data-element_type="container" data-e-type="container">
		<div class="e-con-inner">
			<div class="elementor-element elementor-widget elementor-widget-theme-post-featured-image elementor-widget-image hl-h-300--img hl-of-cover--img hl-op-center-center--img hl-w-100pct--img hl-ta-center" data-id="7cbf646" data-element_type="widget" data-e-type="widget" data-widget_type="theme-post-featured-image.default">
				<div class="elementor-widget-container">
					<?php echo harlow_card_image( get_post_thumbnail_id(), 'large' ); ?>
				</div>
			</div>
			<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-column-gap-10 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-20 hl-v-padding-left-20 hl-v-padding-right-20 hl-v-padding-top-20 hl-v-row-gap-10" data-id="e99d2cd" data-element_type="container" data-e-type="container">
				<div class="e-con-inner">
					<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-0-0--wc hl-c-000000--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-20--ht hl-fw-600--ht hl-lh-24--ht" data-id="19a42d9" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
						<div class="elementor-widget-container">
							<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
						</div>
					</div>
					<div class="elementor-element elementor-widget elementor-widget-theme-post-excerpt hl-m-n15-0-0-0--wc hl-p-0-0-0-0--wc hl-c-000000--widget-container hl-ff-roboto-sans-serif--widget-container hl-fw-400--widget-container hl-lh-22--widget-container" data-id="75ef32d" data-element_type="widget" data-e-type="widget" data-widget_type="theme-post-excerpt.default">
						<div class="elementor-widget-container">
							<p><?php echo esc_html( harlow_card_text( 10, '...' ) ); ?>				</p></div>
					</div>
					<div class="elementor-element elementor-widget elementor-widget-button hl-m-0-0-0-0--wc hl-p-10-17-10-17--button hl-p-0-0-0-0--wc hl-bgc-0165a1--button hl-bgc-02010100--button-focus hl-bgc-02010100--button-hover hl-bc-0165a1--button hl-br-0-0-0-0--button hl-bs-solid--button hl-bw-1-1-1-1--button hl-c-0165a1--button-focus hl-c-0165a1--button-hover hl-ff-roboto-sans-serif--button hl-fs-16--button hl-fw-600--button" data-id="c3019b0" data-element_type="widget" data-e-type="widget" data-widget_type="button.default">
						<div class="elementor-widget-container">
							<div class="elementor-button-wrapper">
								<a class="elementor-button elementor-button-link elementor-size-sm" href="<?php the_permalink(); ?>">
									<span class="elementor-button-content-wrapper">
										<span class="elementor-button-text"><?php esc_html_e( 'Read More', 'harlow' ); ?></span>
									</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
