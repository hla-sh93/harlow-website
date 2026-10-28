<?php
/**
 * A business model as a slide: picture, icon, name, the first words, Read More to its page.
 *
 * Elementor's loop item #1092 as html-v1 has it, design classes and all; printed once per
 * item by the list block (includes/sections/loop.php), inside the loop.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div data-elementor-type="loop-item" data-elementor-id="1092" class="<?php echo esc_attr( harlow_loop_item_class( 1092 ) ); ?>" data-elementor-post-type="elementor_library"<?php harlow_loop_slide_attributes(); ?> data-custom-edit-handle="1">
	<div class="elementor-element bussiness-item e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-min-height-100pct hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0" data-id="d80bced" data-element_type="container" data-e-type="container">
		<div class="e-con-inner">
			<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-0" data-id="0f2a7a9" data-element_type="container" data-e-type="container">
				<div class="e-con-inner">
					<div class="elementor-element business-img-holder e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="68a349e" data-element_type="container" data-e-type="container">
						<div class="e-con-inner">
							<div class="elementor-element elementor-widget elementor-widget-image hl-h-300--img hl-h-250--img--t hl-of-cover--img hl-op-center-center--img hl-w-100pct--img hl-m-0-0-0-0--wc hl-box-shadow-0px-0px-10px-0px-df3383--img" data-id="70dfbfd" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
								<div class="elementor-widget-container">
									<a href="<?php echo esc_url( harlow_item_link() ); ?>">
										<?php echo harlow_card_image( get_post_thumbnail_id(), 'large' ); ?>
									</a>
								</div>
							</div>
						</div>
					</div>
					<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-align-items-center hl-v-align-self-flex-start--con hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-justify-content-flex-start hl-v-justify-content-flex-start--m hl-v-position-absolute hl-bottom-n18 hl-ltr-left-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-18 hl-v-padding-left-25 hl-v-padding-right-40 hl-v-padding-top-18 hl-v-border-radius-0-0-0-0 hl-v-border-style-none hl-bgc-transparent--bg hl-bgi-linear-gradient-0b9d9a--bg hl-bs-none hl-box-shadow-8px-0px-0px-0px-ad715f" data-id="c2dad07" data-element_type="container" data-e-type="container">
						<div class="e-con-inner">
							<div class="elementor-element elementor-widget elementor-widget-image hl-mw-20--img" data-id="4b5fe05" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
								<div class="elementor-widget-container">
									<?php echo harlow_card_image( (int) get_post_meta( get_the_ID(), '_harlow_icon', true ), 'thumbnail' ); ?>
								</div>
							</div>
							<div class="elementor-element elementor-widget elementor-widget-heading hl-c-ffffff9e--ht hl-ff-roboto-sans-serif--ht hl-fs-16--ht hl-fs-12--ht--m hl-fw-600--ht hl-ls-0_6--ht hl-tt-uppercase--ht" data-id="bfbb1ab" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
								<div class="elementor-widget-container">
									<h2 class="elementor-heading-title elementor-size-default"><?php the_title(); ?></h2>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="elementor-element m-0 e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-column-gap-0 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-10 hl-v-row-gap-0" data-id="619cdd0" data-element_type="container" data-e-type="container">
				<div class="e-con-inner">
					<div class="elementor-element m-0 elementor-widget elementor-widget-text-editor hl-column-gap-0 hl-m-0-0-20-0--wc hl-p-0-0-0-0--wc hl-c-001420 hl-ff-plus-jakarta-san-4f7b99 hl-fs-16 hl-fw-400 hl-tt-capitalize" data-id="636a5d9" data-element_type="widget" data-e-type="widget" data-widget_type="text-editor.default">
						<div class="elementor-widget-container">
							<p><?php echo esc_html( harlow_card_text( 10, '…' ) ); ?>								</p></div>
					</div>
					<div class="elementor-element e-transform elementor-mobile-align-left elementor-widget__width-initial elementor-widget elementor-widget-button hl-v-e-transform-translateX-15--wc-hover hl-v-align-self-flex-start--el hl-v-align-self-center--el--m hl-v-container-widget-flex-grow-0 hl-v-container-widget-flex-grow-0--m hl-v-container-widget-width-116 hl-v-container-widget-width-111--m hl-mw-116 hl-mw-111--m hl-w-var-container-wi-90295b hl-w-var-container-wi-26f3b7--m hl-p-0-0-0-0--button hl-bgc-e46e6e00--button hl-bgi-url-blue-arrow--wc hl-bgp-center-right--wc hl-bgr-no-repeat--wc hl-br-0-0-0-0--button hl-bs-none--button hl-fill-0165a1--button hl-c-0165a1--button hl-ff-roboto-sans-serif--button hl-fs-14--button hl-fst-normal--button hl-fw-600--button hl-ls-0_6--button hl-tt-uppercase--button" data-id="0ec893f" data-element_type="widget" data-e-type="widget" data-settings='{"_animation":"none"}' data-widget_type="button.default">
						<div class="elementor-widget-container">
							<div class="elementor-button-wrapper">
								<a class="elementor-button elementor-button-link elementor-size-sm" href="<?php echo esc_url( harlow_item_link() ); ?>">
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
