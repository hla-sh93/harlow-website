<?php
/**
 * The cookie bar: shown at the bottom of a first visit until it is accepted (assets/js/cookie-bar.js).
 *
 * The markup is the one live's GDPR Cookie Compliance plugin prints, so the reference's CSS
 * styles it; the words are Appearance → Customize → Cookie bar.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<aside id="moove_gdpr_cookie_info_bar" class="moove-gdpr-info-bar-hidden moove-gdpr-align-center moove-gdpr-dark-scheme gdpr_infobar_postion_bottom" aria-labelledby="moove_gdpr_cookie_info_bar_title" tabindex="-1" style="display: none;">
	<div class="moove-gdpr-info-bar-container">
				<div id="moove_gdpr_cookie_info_bar_title" class="gdpr-sr-only" role="heading" aria-level="2"><?php esc_html_e( 'GDPR Cookie Banner', 'harlow' ); ?></div>
		<div class="moove-gdpr-info-bar-content">
		
<div class="moove-gdpr-cookie-notice">
	<p><?php echo esc_html( harlow_setting( 'cookie_message' ) ); ?></p><p><?php echo esc_html( harlow_setting( 'cookie_settings_text' ) ); ?> <button aria-haspopup="dialog" data-href="#moove_gdpr_cookie_modal" class="change-settings-button gdpr-settings-btn-style-2"><?php echo esc_html( harlow_setting( 'cookie_settings_label' ) ); ?></button>.</p></div>
<div class="moove-gdpr-button-holder">
			<button class="mgbutton moove-gdpr-infobar-allow-all gdpr-fbo-0" aria-label="<?php echo esc_attr( harlow_setting( 'cookie_accept' ) ); ?>"><?php echo esc_html( harlow_setting( 'cookie_accept' ) ); ?></button>
		</div>
</div>
		</div>
	</aside>
