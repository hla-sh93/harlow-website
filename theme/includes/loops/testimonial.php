<?php
/**
 * A testimonial as a slide: name, words, picture, name and position.
 *
 * Elementor's loop item #2279 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="2279" class="<?php echo esc_attr( harlow_loop_item_class( 2279 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element e-flex e-con-boxed e-con e-parent hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-100pct hl-v-display-flex hl-v-flex-direction-column hl-v-flex-wrap-mobile-wrap hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-40 hl-v-padding-left-30 hl-v-padding-right-30 hl-v-padding-top-40 hl-v-border-bottom-width-1 hl-v-border-color-d5d5d5 hl-v-border-left-width-1 hl-v-border-radius-0-0-0-0 hl-v-border-right-width-1 hl-v-border-style-solid hl-v-border-top-width-1 hl-bgc-ffffff--bg hl-bc-d5d5d5 hl-bs-solid hl-bw-1-1-1-1" data-id="56e11e3" data-element_type="container" data-e-type="container">
		<div class="e-con-inner">
			<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-0-0--wc hl-c-0165a1--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-16--ht hl-fw-800--ht hl-ls-0_4--ht hl-tt-uppercase--ht" data-id="60bfd47" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
				<div class="elementor-widget-container">
					<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
				</div>
			</div>
			<div class="elementor-element m-0 elementor-widget elementor-widget-heading hl-m-0-0-28-0--wc hl-p-0rem-0rem-0rem-0rem--wc hl-c-001420--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-13--ht hl-fw-400--ht hl-ls-0_4--ht hl-lh-20--ht hl-ta-justify" data-id="326b2d6" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
				<div class="elementor-widget-container">
					<h3 class="elementor-heading-title elementor-size-default"><?php echo wp_kses_post( get_post_field( 'post_content', get_the_ID() ) ); ?> </h3>
				</div>
			</div>
			<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-align-items-center hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-justify-content-flex-start hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="06c094a" data-element_type="container" data-e-type="container">
				<div class="e-con-inner">
					<div class="elementor-element elementor-widget__width-initial elementor-widget elementor-widget-image hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-23_352pct hl-v-flex-grow-0--el hl-v-flex-shrink-0--el hl-mw-23_352pct hl-w-var-container-wi-b97c03" data-id="d6069f0" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
						<div class="elementor-widget-container">
							<?php echo harlow_card_image( get_post_thumbnail_id(), 'thumbnail' ); ?>
						</div>
					</div>
					<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-column-gap-8 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-8" data-id="6a81dba" data-element_type="container" data-e-type="container">
						<div class="e-con-inner">
							<div class="elementor-element elementor-widget elementor-widget-heading hl-c-001420--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-13--ht hl-fw-600--ht hl-ls-0_4--ht" data-id="3f4b7ba" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
								<div class="elementor-widget-container">
									<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
								</div>
							</div>
							<div class="elementor-element elementor-widget elementor-widget-heading hl-c-001420--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-13--ht hl-fw-600--ht hl-ls-0_4--ht" data-id="9601fc7" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
								<div class="elementor-widget-container">
									<h2 class="elementor-heading-title elementor-size-default"><?php echo esc_html( get_post_meta( get_the_ID(), '_harlow_position', true ) ); ?></h2>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
