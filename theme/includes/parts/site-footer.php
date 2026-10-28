<?php
/**
 * The site footer: logo, three menu columns, the social links, the copyright line, the
 * credit and the links under the columns.
 *
 * The markup is live's footer template (Elementor #1066) as html-v1 has it. A column's
 * heading is the name of its menu (Appearance → Menus); the rest is Appearance →
 * Customize → Header and footer, and Social links.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<footer data-elementor-type="footer" data-elementor-id="1066" class="elementor elementor-1066" data-elementor-post-type="elementor_library">
	<div class="elementor-element e-con-full e-flex e-con e-parent hl-v-display-flex hl-v-flex-grow-0--con hl-v-flex-shrink-0--con hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-30 hl-v-padding-bottom-30--t hl-v-padding-bottom-10--m hl-v-padding-left-0 hl-v-padding-left-15--t hl-v-padding-left-10--m hl-v-padding-right-0 hl-v-padding-right-15--t hl-v-padding-right-10--m hl-v-padding-top-60 hl-v-padding-top-30--t hl-v-padding-top-25--m hl-bgi-url-footer-images-1--bg hl-bgr-no-repeat--bg hl-bgs-cover--bg" data-id="d549ec0" data-element_type="container" data-e-type="container" id="footer"<?php echo harlow_footer_background_style(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped where it is built. ?>>
		<div class="elementor-element e-grid e-con-boxed e-con e-child hl-v-content-width-1151--d hl-v-display-grid hl-v-e-con-grid-template-columns-1-5fr-0-8fr-1-1f-d95a00 hl-v-e-con-grid-template-columns-1fr--m hl-v-e-con-grid-template-rows-repeat-1-1fr hl-v-e-con-grid-template-rows-1fr--m hl-v-grid-auto-flow-row hl-v-grid-auto-flow-row--t hl-v-grid-auto-flow-row--m hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="30c6753" data-element_type="container" data-e-type="container">
			<div class="e-con-inner">
				<div class="elementor-element elementor-widget__width-initial animated-slow elementor-widget elementor-widget-image hl-v-align-self-center--el--m hl-v-container-widget-flex-grow-0--m hl-v-container-widget-width-100pct--m hl-v-flex-grow-1--el--m hl-v-flex-shrink-0--el--m hl-v-order-n99999--el--m hl-mw-initial hl-mw-100pct--m hl-w-initial hl-w-350--img hl-w-var-container-wi-66f143--m hl-w-155--img--m hl-m-0-0-0-0--wc hl-p-0-0-0-0--wc hl-ta-start hl-ta-center--m" data-id="2ea9679" data-element_type="widget" data-e-type="widget" data-settings='{"_animation":"none"}' data-widget_type="image.default">
					<div class="elementor-widget-container">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
							<?php harlow_the_image( 'footer_logo' ); ?>
						</a>
					</div>
				</div>
				<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-container-widget-flex-grow-0 hl-v-container-widget-width-100pct hl-v-display-flex hl-v-flex-direction-column hl-v-flex-wrap-mobile-wrap hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="4c5c22a" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
						<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-0-0--wc hl-m-0-0-0-0--wc--m hl-c-ffffff--ht hl-ff-roboto-sans-serif--ht hl-fs-16--ht hl-fw-600--ht hl-ta-start hl-tt-uppercase--ht" data-id="bf1c55b" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
							<div class="elementor-widget-container">
								<h3 class="elementor-heading-title elementor-size-default"><?php echo esc_html( harlow_menu_name( 'footer-1' ) ); ?></h3>
							</div>
						</div>
						<div class="elementor-element elementor-nav-menu__align-start elementor-nav-menu--dropdown-none elementor-widget elementor-widget-nav-menu hl-h-0--e-pointer-underl-0ee8a hl-padding-bottom-7--nav-menu-main-item hl-padding-left-0--nav-menu-main-item hl-padding-right-0--nav-menu-main-item hl-padding-top-7--nav-menu-main-item hl-fill-ffffff--nav-menu-main-item hl-fill-ffffff94--nav-menu-main-it-cb62e hl-fill-ffffff94--nav-menu-main-it-bc12a hl-fill-ffffff94--nav-menu-main-item-focus hl-fill-ffffff94--nav-menu-main-item-hover hl-c-ffffff--nav-menu-main-item hl-c-ffffff94--nav-menu-main-it-cb62e hl-c-ffffff94--nav-menu-main-it-bc12a hl-c-ffffff94--nav-menu-main-item-focus hl-c-ffffff94--nav-menu-main-item-hover hl-ff-plus-jakarta-san-4f7b99--nav-menu-item hl-fs-13--nav-menu-item hl-fw-600--nav-menu-item" data-id="826082a" data-element_type="widget" data-e-type="widget" data-settings='{"layout":"vertical","submenu_icon":{"value":"&lt;svg aria-hidden=\"true\" class=\"e-font-icon-svg e-fas-caret-down\" viewBox=\"0 0 320 512\" xmlns=\"http://www.w3.org/2000/svg\"&gt;&lt;path d=\"M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z\"&gt;&lt;/path&gt;&lt;/svg&gt;","library":"fa-solid"}}' data-widget_type="nav-menu.default">
							<div class="elementor-widget-container">
								<nav aria-label="Menu" class="elementor-nav-menu--main elementor-nav-menu__container elementor-nav-menu--layout-vertical e--pointer-underline e--animation-fade">
									<?php harlow_nav_menu( 'footer-1', '826082a', false, true ); ?>
								</nav>
								<nav class="elementor-nav-menu--dropdown elementor-nav-menu__container" aria-hidden="true">
									<?php harlow_nav_menu( 'footer-1', '826082a', true, true ); ?>
								</nav>
							</div>
						</div>
					</div>
				</div>
				<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="61b4b0b" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
						<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-0-0--wc hl-m-0-0-0-0--wc--m hl-c-ffffff--ht hl-ff-roboto-sans-serif--ht hl-fs-16--ht hl-fw-600--ht hl-ta-start hl-tt-uppercase--ht" data-id="dea2ac7" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
							<div class="elementor-widget-container">
								<h3 class="elementor-heading-title elementor-size-default"><?php echo esc_html( harlow_menu_name( 'footer-2' ) ); ?></h3>
							</div>
						</div>
						<div class="elementor-element elementor-nav-menu__align-start elementor-nav-menu--dropdown-none elementor-widget elementor-widget-nav-menu hl-h-0--e-pointer-underl-0ee8a hl-padding-bottom-7--nav-menu-main-item hl-padding-left-0--nav-menu-main-item hl-padding-right-0--nav-menu-main-item hl-padding-top-7--nav-menu-main-item hl-fill-ffffff--nav-menu-main-item hl-fill-ffffff94--nav-menu-main-it-cb62e hl-fill-ffffff94--nav-menu-main-it-bc12a hl-fill-ffffff94--nav-menu-main-item-focus hl-fill-ffffff94--nav-menu-main-item-hover hl-c-ffffff--nav-menu-main-item hl-c-ffffff94--nav-menu-main-it-cb62e hl-c-ffffff94--nav-menu-main-it-bc12a hl-c-ffffff94--nav-menu-main-item-focus hl-c-ffffff94--nav-menu-main-item-hover hl-ff-plus-jakarta-san-4f7b99--nav-menu-item hl-fs-13--nav-menu-item hl-fw-600--nav-menu-item" data-id="89c99db" data-element_type="widget" data-e-type="widget" data-settings='{"layout":"vertical","submenu_icon":{"value":"&lt;svg aria-hidden=\"true\" class=\"e-font-icon-svg e-fas-caret-down\" viewBox=\"0 0 320 512\" xmlns=\"http://www.w3.org/2000/svg\"&gt;&lt;path d=\"M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z\"&gt;&lt;/path&gt;&lt;/svg&gt;","library":"fa-solid"}}' data-widget_type="nav-menu.default">
							<div class="elementor-widget-container">
								<nav aria-label="Menu" class="elementor-nav-menu--main elementor-nav-menu__container elementor-nav-menu--layout-vertical e--pointer-underline e--animation-fade">
									<?php harlow_nav_menu( 'footer-2', '89c99db', false, true ); ?>
								</nav>
								<nav class="elementor-nav-menu--dropdown elementor-nav-menu__container" aria-hidden="true">
									<?php harlow_nav_menu( 'footer-2', '89c99db', true, true ); ?>
								</nav>
							</div>
						</div>
					</div>
				</div>
				<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="191a595" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
						<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-0-0--wc hl-m-0-0-0-0--wc--m hl-c-ffffff--ht hl-ff-roboto-sans-serif--ht hl-fs-16--ht hl-fw-600--ht hl-ta-start hl-tt-uppercase--ht" data-id="6134bc2" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
							<div class="elementor-widget-container">
								<h3 class="elementor-heading-title elementor-size-default"><?php echo esc_html( harlow_menu_name( 'footer-3' ) ); ?></h3>
							</div>
						</div>
						<div class="elementor-element elementor-nav-menu__align-start elementor-nav-menu--dropdown-none elementor-widget elementor-widget-nav-menu hl-h-0--e-pointer-underl-0ee8a hl-padding-bottom-7--nav-menu-main-item hl-padding-left-0--nav-menu-main-item hl-padding-right-0--nav-menu-main-item hl-padding-top-7--nav-menu-main-item hl-fill-ffffff--nav-menu-main-item hl-fill-ffffff94--nav-menu-main-it-cb62e hl-fill-ffffff94--nav-menu-main-it-bc12a hl-fill-ffffff94--nav-menu-main-item-focus hl-fill-ffffff94--nav-menu-main-item-hover hl-c-ffffff--nav-menu-main-item hl-c-ffffff94--nav-menu-main-it-cb62e hl-c-ffffff94--nav-menu-main-it-bc12a hl-c-ffffff94--nav-menu-main-item-focus hl-c-ffffff94--nav-menu-main-item-hover hl-ff-plus-jakarta-san-4f7b99--nav-menu-item hl-fs-13--nav-menu-item hl-fw-600--nav-menu-item" data-id="793f866" data-element_type="widget" data-e-type="widget" data-settings='{"layout":"vertical","submenu_icon":{"value":"&lt;svg aria-hidden=\"true\" class=\"e-font-icon-svg e-fas-caret-down\" viewBox=\"0 0 320 512\" xmlns=\"http://www.w3.org/2000/svg\"&gt;&lt;path d=\"M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z\"&gt;&lt;/path&gt;&lt;/svg&gt;","library":"fa-solid"}}' data-widget_type="nav-menu.default">
							<div class="elementor-widget-container">
								<nav aria-label="Menu" class="elementor-nav-menu--main elementor-nav-menu__container elementor-nav-menu--layout-vertical e--pointer-underline e--animation-fade">
									<?php harlow_nav_menu( 'footer-3', '793f866', false, true ); ?>
								</nav>
								<nav class="elementor-nav-menu--dropdown elementor-nav-menu__container" aria-hidden="true">
									<?php harlow_nav_menu( 'footer-3', '793f866', true, true ); ?>
								</nav>
							</div>
						</div>
					</div>
				</div>
				<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-display-flex hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0" data-id="9daf566" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
						<div class="elementor-element elementor-widget elementor-widget-heading hl-m-0-0-10-0--wc hl-m-0-0-0-0--wc--m hl-c-ffffff--ht hl-ff-roboto-sans-serif--ht hl-fs-16--ht hl-fw-600--ht hl-ta-start hl-tt-uppercase--ht" data-id="c14f552" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
							<div class="elementor-widget-container">
								<h3 class="elementor-heading-title elementor-size-default"><?php echo esc_html( harlow_setting( 'contact_heading' ) ); ?></h3>
							</div>
						</div>
						<div class="elementor-element elementor-icon-list--layout-inline e-transform elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list hl-transition-fill-0-3s--ili-svg hl-transition-color-0-3s--ilt hl-inset-inline-end-calc-20px-2--icon-list-items--d5ce9 hl-inset-inline-end-calc-20px-2--icon-list-items--d5ce9--t hl-v-e-icon-list-icon-size-24 hl-v-icon-vertical-offset-0 hl-margin-inline-calc-20px-2--icon-list-items--625e6 hl-margin-inline-calc-20px-2--icon-list-items--bf6b1 hl-margin-inline-calc-20px-2--icon-list-items--625e6--t hl-margin-inline-calc-20px-2--icon-list-items--bf6b1--t hl-padding-inline-end-1--icon-list-icon hl-fill-ffffff--ili-svg hl-fill-ffffff94--icon-list-item-h-e666d hl-c-ffffff--ilt hl-ff-roboto-sans-serif--icon-list-item-a hl-fs-15--icon-list-item-a hl-fw-500--icon-list-item-a" data-id="32fc50d" data-element_type="widget" data-e-type="widget" data-settings='{"_animation":"none"}' data-widget_type="icon-list.default">
							<div class="elementor-widget-container">
								<ul class="elementor-icon-list-items elementor-inline-items">
									<?php harlow_social_links(); ?>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="elementor-element e-grid e-con-boxed e-con e-child hl-v-align-items-center hl-v-content-width-1151--d hl-v-display-grid hl-v-e-con-grid-template-columns-repeat-3-1fr hl-v-e-con-grid-template-columns-repeat-1-1fr--m hl-v-e-con-grid-template-rows-repeat-1-1fr hl-v-grid-auto-flow-row hl-v-grid-auto-flow-row--t hl-v-grid-auto-flow-row--m hl-v-justify-items-start hl-v-justify-items-center--m hl-v-column-gap-5 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-5" data-id="77434b0" data-element_type="container" data-e-type="container">
			<div class="e-con-inner">
				<div class="elementor-element elementor-widget elementor-widget-heading hl-c-ffffff9c--ht hl-ff-roboto-sans-serif--ht hl-fs-15--ht hl-fw-600--ht hl-ta-center--m" data-id="f7645f6" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
					<div class="elementor-widget-container">
						<h2 class="elementor-heading-title elementor-size-default"><?php echo esc_html( harlow_setting( 'copyright' ) ); ?></h2>
					</div>
				</div>
				<div class="elementor-element e-flex e-con-boxed e-con e-child hl-v-align-items-center hl-v-container-widget-flex-grow-1 hl-v-container-widget-width-calc-1-var-conta-3baaee hl-v-display-flex hl-v-flex-direction-row hl-v-flex-wrap-mobile-wrap hl-v-justify-content-center hl-v-column-gap-1 hl-v-margin-bottom-0 hl-v-margin-left-0 hl-v-margin-right-0 hl-v-margin-top-0 hl-v-padding-bottom-0 hl-v-padding-left-0 hl-v-padding-right-0 hl-v-padding-top-0 hl-v-row-gap-1" data-id="bf9e9e7" data-element_type="container" data-e-type="container">
					<div class="e-con-inner">
						<div class="elementor-element elementor-widget elementor-widget-heading hl-c-ffffff9c--ht hl-ff-roboto-sans-serif--ht hl-fs-15--ht hl-fw-600--ht hl-ta-center" data-id="269488d" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
							<div class="elementor-widget-container">
								<h2 class="elementor-heading-title elementor-size-default"><?php echo esc_html( harlow_setting( 'credit_text' ) ); ?></h2>
							</div>
						</div>
						<div class="elementor-element elementor-widget elementor-widget-image hl-w-116--img" data-id="079d600" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
							<div class="elementor-widget-container">
								<a href="<?php echo esc_url( harlow_setting( 'credit_url' ) ); ?>">
									<?php harlow_the_image( 'credit_logo' ); ?>
								</a>
							</div>
						</div>
					</div>
				</div>
				<div class="elementor-element elementor-icon-list--layout-inline elementor-mobile-align-center elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list hl-transition-color-0-3s--ilt hl-inset-inline-end-calc-8px-2--icon-list-items--d5ce9 hl-v-e-icon-list-icon-size-14 hl-v-icon-vertical-offset-0 hl-content---icon-list-item-n-61a77 hl-h-16--icon-list-item-n-61a77 hl-margin-inline-calc-8px-2--icon-list-items--625e6 hl-margin-inline-calc-8px-2--icon-list-items--bf6b1 hl-bc-ffffff9c--icon-list-item-n-61a77 hl-border-inline-start-style-solid--icon-list-items--656ba hl-border-inline-start-width-2--inline-items-ico-da403 hl-c-ffffff9c--ilt hl-ff-roboto-sans-serif--icon-list-item-a hl-fs-15--icon-list-item-a hl-fw-400--icon-list-item-a" data-id="1992681" data-element_type="widget" data-e-type="widget" data-widget_type="icon-list.default">
					<div class="elementor-widget-container">
						<ul class="elementor-icon-list-items elementor-inline-items">
							<?php harlow_footer_links(); ?>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
