<?php
/**
 * A post or a news item as a card: picture, date, title, the first words, Read More.
 *
 * Elementor's loop item #1073 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="1073" class="<?php echo esc_attr( harlow_loop_item_class( 1073 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element news-item e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-min-height-100pct hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0 hl-bgc-f2f2f2--bg" data-id="34e94b5" data-element_type="container" data-e-type="container">
		<div class="e-con-inner">
			<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0" data-id="b5a3063" data-element_type="container" data-e-type="container">
				<div class="e-con-inner">
					<div class="elementor-element elementor-absolute elementor-widget elementor-widget-image hl-bottom-n21 hl-ltr-right-20 hl-mw-94--img" data-id="aa8eee5" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
						<div class="elementor-widget-container">
							<?php echo harlow_card_image( 625, 'large' ); ?>
						</div>
					</div>
					<div class="elementor-element news-item-img-holder e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="e72cbd5" data-element_type="container" data-e-type="container">
						<div class="e-con-inner">
							<div class="elementor-element elementor-widget__width-inherit elementor-widget elementor-widget-image hl-v-align-self-center--el hl-v-flex-grow-1--el hl-v-flex-shrink-0--el hl-h-200--img hl-mw-100pct hl-of-cover--img hl-op-center-center--img hl-w-100pct hl-w-100pct--img hl-m-0-0-0-0--wc hl-p-0-0-0-0--wc" data-id="a830f36" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
								<div class="elementor-widget-container">
									<a href="<?php the_permalink(); ?>">
										<?php echo harlow_card_image( get_post_thumbnail_id(), 'large' ); ?>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-25 hl-v-padding-left-25 hl-v-padding-right-25 hl-v-padding-top-25 hl-v-row-gap-0" data-id="0648260" data-element_type="container" data-e-type="container">
				<div class="e-con-inner">
					<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-15-0--wc hl-c-002840--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-13--ht hl-fw-800--ht" data-id="dceabee" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
						<div class="elementor-widget-container">
							<h4 class="elementor-heading-title elementor-size-default"><?php echo esc_html( get_the_date( 'F j, Y' ) ); ?></h4>
						</div>
					</div>
					<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-min-height-50 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="dd86060" data-element_type="container" data-e-type="container">
						<div class="e-con-inner">
							<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-0-0--wc hl-p-0-0-10-0--wc hl-c-001420--ht hl-ff-roboto-sans-serif--ht hl-fs-14--ht hl-fw-700--ht hl-ls-0_006em--ht hl-lh-18--ht" data-id="83552d0" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
								<div class="elementor-widget-container">
									<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
								</div>
							</div>
						</div>
					</div>
					<div class="elementor-element elementor-widget elementor-widget-text-editor hl-m-0-0-10-0--wc hl-c-001420 hl-ff-plus-jakarta-san-4f7b99 hl-fs-14 hl-fw-400 hl-lh-21" data-id="b7e757d" data-element_type="widget" data-e-type="widget" data-widget_type="text-editor.default">
						<div class="elementor-widget-container">
							<p><?php echo esc_html( harlow_card_text( 12, '…' ) ); ?>								</p></div>
					</div>
					<div class="elementor-element e-transform elementor-mobile-align-left elementor-widget__width-initial elementor-widget elementor-widget-button hl-v-e-transform-translateX-15--wc-hover hl-v-align-self-flex-end--el hl-v-align-self-center--el--m hl-v-container-widget-flex-grow-0 hl-v-container-widget-flex-grow-0--m hl-v-container-widget-width-130 hl-v-container-widget-width-111--m hl-mw-130 hl-mw-111--m hl-w-var-container-wi-710d30 hl-w-var-container-wi-26f3b7--m hl-p-0-0-0-0--button hl-bgc-e46e6e00--button hl-bgi-url-blue-arrow--wc hl-bgp-center-right--wc hl-bgr-no-repeat--wc hl-br-0-0-0-0--button hl-bs-none--button hl-fill-0165a1--button hl-c-0165a1--button hl-ff-roboto-sans-serif--button hl-fs-14--button hl-fst-normal--button hl-fw-600--button hl-ls-0_6--button hl-tt-uppercase--button" data-id="3d2fe41" data-element_type="widget" data-e-type="widget" data-settings='{"_animation":"none"}' data-widget_type="button.default">
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
