<?php
/**
 * A gallery item as a card: its picture behind its name.
 *
 * Elementor's loop item #2552 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="2552" class="<?php echo esc_attr( harlow_loop_item_class( 2552 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element e-con-full e-flex e-con e-parent hl-v-align-items-center hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-flex-direction-column hl-v-flex-grow-0--con hl-v-flex-shrink-0--con hl-v-flex-wrap-mobile-wrap hl-v-justify-content-center hl-v-min-height-275 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-background-overlay---before hl-v-background-overlay---hover-before hl-v-overlay-opacity-0_5 hl-v-overlay-opacity-0_7--hover hl-v-overlay-transition-0_5s hl-v-overlay-transition-0_5s--before hl-bgc-transparent--before hl-bgc-transparent--hover-before hl-bgi-linear-gradient-6addcb--before hl-bgi-linear-gradient-19bae8--hover-before hl-bgp-center-center--bg hl-bgr-no-repeat--bg hl-bgs-cover--bg" data-id="b2269f0" data-element_type="container" data-e-type="container" style="<?php echo esc_attr( 'background-image: url("' . esc_url( (string) get_the_post_thumbnail_url( null, 'full' ) ) . '");' ); ?>">
		<div class="elementor-element elementor-widget__width-inherit gallery-item-title elementor-widget elementor-widget-heading hl-mw-100pct hl-w-100pct hl-m-0-0-0-0--wc hl-p-0-0-0-0--wc hl-c-ffffff--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-18--ht hl-fw-500--ht hl-lh-21--ht" data-id="3f5628b" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
			<div class="elementor-widget-container">
				<h2 class="elementor-heading-title elementor-size-default"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
			</div>
		</div>
	</div>
</div>
