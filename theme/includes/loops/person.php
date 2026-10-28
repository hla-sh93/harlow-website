<?php
/**
 * A person as a card that opens a window: picture, name and job, the first words; in the window, the whole text.
 *
 * Elementor's loop item #4002 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="4002" class="<?php echo esc_attr( harlow_loop_item_class( 4002 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element harlow-emp e-con-full e-flex e-con e-child hl-v-align-items-center hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-justify-content-flex-start hl-v-column-gap-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0 hl-bgc-f7f7f7--bg" data-id="c2b0595" data-element_type="container" data-e-type="container">
		<div class="elementor-element cursor-pointer elementor-widget elementor-widget-image hl-w-100pct--img" data-id="34ba751" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
			<div class="elementor-widget-container">
				<?php echo harlow_card_image( get_post_thumbnail_id(), 'large' ); ?>
			</div>
		</div>
		<div class="elementor-element hp-item-inner cursor-pointer e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-flex-grow-1--con hl-v-flex-shrink-0--con hl-v-z-index-9 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-70 hl-v-padding-left-10 hl-v-padding-right-10 hl-v-padding-top-10" data-id="2e60dfb" data-element_type="container" data-e-type="container">
			<div class="e-con-inner">
				<div class="elementor-element elementor-widget elementor-widget-heading hl-m-5-0-n20-0--wc hl-p-0-0-0-0--wc hl-c-000000--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-20--ht hl-fw-500--ht hl-ta-center" data-id="51ac2e9" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
					<div class="elementor-widget-container">
						<h4 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h4>
					</div>
				</div>
				<div class="elementor-element elementor-widget elementor-widget-text-editor hl-p-0-0-0-0--wc hl-c-000000 hl-ff-roboto-sans-serif hl-fs-16 hl-fw-500 hl-ta-justify" data-id="afa3bfa" data-element_type="widget" data-e-type="widget" data-widget_type="text-editor.default">
					<div class="elementor-widget-container">
						<p><?php echo esc_html( harlow_card_text( 16, '' ) ); ?>								</p></div>
				</div>
				<div class="elementor-element he-read-more elementor-widget elementor-widget-heading hl-c-000000--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-16--ht hl-fw-600--ht hl-ta-center" data-id="5948674" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
					<div class="elementor-widget-container">
						<span class="elementor-heading-title elementor-size-default"><a href="#"><?php esc_html_e( 'Read More', 'harlow' ); ?></a></span>
					</div>
				</div>
				<div class="elementor-element bottom-line e-flex e-con-boxed e-con e-child hl-v-content-width-100pct--d hl-v-display-flex hl-v-position-absolute hl-v-z-index-1 hl-bottom-0 hl-ltr-left-0 hl-v-min-height-4 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-bgc-0165a1--bg" data-id="ee8b743" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
					</div>
				</div>
			</div>
		</div>
		<div class="elementor-element hp-popup-holder e-flex e-con-boxed elementor-invisible e-con e-child hl-v-align-items-center hl-v-align-self-center--con hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-content-width-100vw--d hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-justify-content-center hl-v-position-fixed hl-v-z-index-98 hl-ltr-left-0 hl-top-0 hl-v-min-height-100vh hl-v-column-gap-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0 hl-bgc-00000075--bg" data-id="f7a03fe" data-element_type="container" data-e-type="container" data-settings='{"animation":"fadeIn"}'>
			<div class="e-con-inner">
				<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-align-items-center hl-v-align-self-center--con hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-content-width-850--d hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-justify-content-center hl-v-min-height-430 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="2abac54" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
						<div class="elementor-element e-con-full hp-inner-popup-holder e-flex e-con e-child hl-v-align-items-flex-start hl-v-align-self-center--con hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-column-gap-25 hl-v-padding-bottom-16 hl-v-padding-left-016 hl-v-padding-right-0 hl-v-padding-top-16 hl-v-row-gap-25 hl-v-border-radius-5-5-5-5 hl-bgc-ffffff--bg" data-id="7969f22" data-element_type="container" data-e-type="container" data-settings='{"animation":"none"}'>
							<div class="elementor-element elementor-align-center elementor-absolute hp-close elementor-widget elementor-widget-button hl-v-align-self-center--el hl-ltr-right-17 hl-top-15 hl-z-99 hl-m-0-0-0-0--wc hl-p-0-5-5-5--button hl-p-0-0-0-0--wc hl-bgc-12421900--button hl-fill-00000078--button hl-c-00000078--button hl-ff-roboto-sans-serif--button hl-fs-26--button hl-fw-600--button" data-id="5c2e405" data-element_type="widget" data-e-type="widget" data-widget_type="button.default">
								<div class="elementor-widget-container">
									<div class="elementor-button-wrapper">
										<a class="elementor-button elementor-button-link elementor-size-sm" href="#">
											<span class="elementor-button-content-wrapper">
												<span class="elementor-button-text">×</span>
											</span>
										</a>
									</div>
								</div>
							</div>
							<div class="elementor-element e-con-full hp-popup-inner e-flex e-con e-child hl-v-align-items-flex-start hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-justify-content-flex-start hl-v-column-gap-30 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-30" data-id="ecb7afc" data-element_type="container" data-e-type="container">
								<div class="elementor-element e-con-full e-flex e-con e-child hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-100pct hl-v-display-flex hl-v-flex-direction-column hl-v-flex-grow-0--con hl-v-flex-shrink-0--con hl-v-flex-wrap-mobile-wrap hl-v-width-30pct--d hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="1a1e016" data-element_type="container" data-e-type="container">
									<div class="elementor-element elementor-widget elementor-widget-image" data-id="8a1df4c" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
										<div class="elementor-widget-container">
											<?php echo harlow_card_image( get_post_thumbnail_id(), 'large' ); ?>
										</div>
									</div>
								</div>
								<div class="elementor-element e-con-full hp-content e-flex e-con e-child hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-100pct hl-v-display-flex hl-v-flex-direction-column hl-v-flex-grow-0--con hl-v-flex-shrink-0--con hl-v-flex-wrap-mobile-wrap hl-v-width-70pct--d hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="ea7b66f" data-element_type="container" data-e-type="container">
									<div class="elementor-element elementor-widget__width-initial elementor-widget elementor-widget-heading hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-88pct hl-mw-88pct hl-w-var-container-wi-be5eab hl-m-0-0-0-0--wc hl-p-0-0-0-0--wc hl-c-000000--ht hl-ff-plus-jakarta-san-4f7b99--ht hl-fs-21--ht hl-fw-500--ht hl-lh-26--ht" data-id="49dfe0b" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
										<div class="elementor-widget-container">
											<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
										</div>
									</div>
									<div class="elementor-element elementor-widget__width-initial elementor-widget elementor-widget-theme-post-content hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-95_063pct hl-v-flex-grow-0--el hl-v-flex-shrink-0--el hl-mw-95_063pct hl-w-var-container-wi-c437d2 hl-m-n10-0-0-0--wc hl-p-0-15-0-1--wc hl-c-000000 hl-ff-roboto-sans-serif hl-fw-400 hl-lh-160pct hl-ta-justify" data-id="18fd9ef" data-element_type="widget" data-e-type="widget" data-widget_type="theme-post-content.default">
										<div class="elementor-widget-container">
											<?php the_content(); ?>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
