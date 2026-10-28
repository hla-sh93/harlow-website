<?php
/**
 * A job as a card: title, the first words, Apply Now.
 *
 * Elementor's loop item #4058 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="4058" class="<?php echo esc_attr( harlow_loop_item_class( 4058 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element e-con-full e-flex e-con e-child hl-v-display-flex hl-v-flex-grow-0--con hl-v-flex-shrink-0--con hl-v-width-100pct--d hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0 hl-v-border-radius-20-20-20-20 hl-v-border-style-none hl-bs-none" data-id="f45d772" data-element_type="container" data-e-type="container">
		<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-20-0--wc hl-c-000000--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-22--ht hl-fw-500--ht" data-id="43831a0" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
			<div class="elementor-widget-container">
				<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
			</div>
		</div>
		<div class="elementor-element elementor-widget elementor-widget-heading hl-p-0-0-0-0--wc hl-c-000000--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-16--ht hl-fw-400--ht hl-lh-160pct--ht" data-id="3c1e13b" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
			<div class="elementor-widget-container">
				<h2 class="elementor-heading-title elementor-size-default"><p><?php echo esc_html( harlow_card_text( 30, '...' ) ); ?></p></h2>
			</div>
		</div>
		<div class="elementor-element elementor-align-center elementor-widget elementor-widget-button hl-p-8-24-8-24--button hl-bgc-0165a1--button hl-br-0-0-0-0--button hl-ff-roboto-sans-serif--button hl-fw-600--button" data-id="0ef0828" data-element_type="widget" data-e-type="widget" data-widget_type="button.default">
			<div class="elementor-widget-container">
				<div class="elementor-button-wrapper">
					<a class="elementor-button elementor-button-link elementor-size-sm" href="<?php the_permalink(); ?>">
						<span class="elementor-button-content-wrapper">
							<span class="elementor-button-text"><?php esc_html_e( 'Apply Now', 'harlow' ); ?></span>
						</span>
					</a>
				</div>
			</div>
		</div>
		<div class="elementor-element elementor-widget-divider--view-line elementor-widget elementor-widget-divider hl-v-divider-border-style-solid hl-v-divider-border-width-1 hl-v-divider-color-bfbfbf hl-w-100pct--sep hl-padding-block-end-15--div hl-padding-block-start-15--div" data-id="2507f03" data-element_type="widget" data-e-type="widget" data-widget_type="divider.default">
			<div class="elementor-widget-container">
				<div class="elementor-divider">
					<span class="elementor-divider-separator">
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
