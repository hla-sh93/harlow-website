<?php
/**
 * The page transition: a white screen with a picture that covers the page while the next
 * one loads (assets/js/page-transition.js). Links into the dashboard are left out, as on
 * live. The picture is Appearance → Customize → Page transition.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<e-page-transition preloader-type="image" preloader-image-url="<?php echo esc_url( harlow_image_url( 'transition_image' ) ); ?>" class="e-page-transition--entering" exclude="<?php echo esc_attr( '^' . preg_quote( admin_url(), '/' ) ); ?>">
</e-page-transition>
