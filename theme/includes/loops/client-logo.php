<?php
/**
 * A client logo: Elementor's image widget as live's "major clients" section has it, ten
 * times; here once per logo of Client logos, in their order.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="elementor-element e-transform elementor-widget elementor-widget-image hl-v-e-transform-scale-1_2--wc-hover" data-id="<?php echo esc_attr( harlow_client_element() ); ?>" data-element_type="widget" data-e-type="widget" data-widget_type="image.default">
	<div class="elementor-widget-container">
		<?php echo harlow_card_image( get_post_thumbnail_id(), 'large' ); ?>
	</div>
</div>
