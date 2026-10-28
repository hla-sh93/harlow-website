<?php
/**
 * The cookie settings window, opened from the cookie bar's settings link.
 *
 * Live's GDPR Cookie Compliance markup, as the reference has it. Its two explanations and
 * its logo are Appearance → Customize → Cookie bar; its labels are the theme's strings.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<dialog id="moove_gdpr_cookie_modal" class="gdpr_lightbox-hide" open="" tabindex="-1" aria-modal="true" aria-label="<?php esc_attr_e( 'GDPR Settings Screen', 'harlow' ); ?>">
	<div class="moove-gdpr-modal-content moove-clearfix logo-position-left moove_gdpr_modal_theme_v1">
				<button class="moove-gdpr-modal-close" aria-label="<?php esc_attr_e( 'Close GDPR Cookie Settings', 'harlow' ); ?>">
			<span class="gdpr-sr-only"><?php esc_html_e( 'Close GDPR Cookie Settings', 'harlow' ); ?></span>
			<span class="gdpr-icon moovegdpr-arrow-close"></span>
		</button>
				<div class="moove-gdpr-modal-left-content">
		
<div class="moove-gdpr-company-logo-holder">
	<?php harlow_the_image( 'cookie_logo' ); ?>

</div>
<ul id="moove-gdpr-menu" role="tablist" aria-label="<?php esc_attr_e( 'Cookie categories', 'harlow' ); ?>">
			
<li class="menu-item-on menu-item-privacy_overview menu-item-selected" role="presentation">
	<button data-href="#privacy_overview" id="gdpr-tab-privacy_overview" class="moove-gdpr-tab-nav" role="tab" aria-selected="true" aria-controls="privacy_overview" aria-label="<?php esc_attr_e( 'Privacy Overview', 'harlow' ); ?>">
	<span class="gdpr-nav-tab-title"><?php esc_html_e( 'Privacy Overview', 'harlow' ); ?></span>
	</button>
</li>

	<li class="menu-item-strict-necessary-cookies menu-item-off" role="presentation">
	<button data-href="#strict-necessary-cookies" id="gdpr-tab-strict-necessary-cookies" class="moove-gdpr-tab-nav" role="tab" aria-selected="false" aria-controls="strict-necessary-cookies" tabindex="-1" aria-label="<?php esc_attr_e( 'Strictly Necessary Cookies', 'harlow' ); ?>">
		<span class="gdpr-nav-tab-title"><?php esc_html_e( 'Strictly Necessary Cookies', 'harlow' ); ?></span>
	</button>
	</li>





		</ul>
		
<div class="moove-gdpr-branding-cnt">
			<a href="https://wordpress.org/plugins/gdpr-cookie-compliance/" class="moove-gdpr-branding" rel="noopener noreferrer" target="_blank">Powered by  <span>GDPR Cookie Compliance</span><span class="gdpr-sr-only"> (opens in a new tab)</span></a>
		</div>
</div>
		<div class="moove-gdpr-modal-right-content">
		<div class="moove-gdpr-modal-title">
			 
		</div>
		<div class="main-modal-content">

			<div class="moove-gdpr-tab-content">
			
<div id="privacy_overview" class="moove-gdpr-tab-main">
			<div class="tab-title" role="heading" aria-level="2"><span class="gdpr-tab-title-text"><?php esc_html_e( 'Privacy Overview', 'harlow' ); ?></span></div>
		<div class="moove-gdpr-tab-main-content">
	<p><?php echo esc_html( harlow_setting( 'cookie_overview' ) ); ?></p>
		</div>
	</div>
<div id="strict-necessary-cookies" class="moove-gdpr-tab-main" style="display:none">
		<div class="tab-title" role="heading" aria-level="2"><span class="gdpr-tab-title-text"><?php esc_html_e( 'Strictly Necessary Cookies', 'harlow' ); ?></span></div>
	<div class="moove-gdpr-tab-main-content">
		<p><?php echo esc_html( harlow_setting( 'cookie_necessary' ) ); ?></p>
		<div class="moove-gdpr-status-bar ">
		<div class="gdpr-cc-form-wrap">
			<div class="gdpr-cc-form-fieldset">
			<label class="cookie-switch" for="moove_gdpr_strict_cookies">    
				<input type="checkbox" aria-label="<?php esc_attr_e( 'Strictly Necessary Cookies', 'harlow' ); ?>" value="check" name="moove_gdpr_strict_cookies" id="moove_gdpr_strict_cookies">
				<span class="cookie-slider cookie-round gdpr-sr" aria-hidden="true" data-text-enable="<?php esc_attr_e( 'Enabled', 'harlow' ); ?>" data-text-disabled="<?php esc_attr_e( 'Disabled', 'harlow' ); ?>">
				<span class="gdpr-sr-label">
					<span class="gdpr-sr-enable"><?php esc_html_e( 'Enabled', 'harlow' ); ?></span>
					<span class="gdpr-sr-disable"><?php esc_html_e( 'Disabled', 'harlow' ); ?></span>
				</span>
				</span>
			</label>
			</div>
			</div>
		</div>
		</div>
	</div>
	</div>
			</div>
		<div class="moove-gdpr-modal-footer-content">
			<div class="moove-gdpr-button-holder">
						<button class="mgbutton moove-gdpr-modal-allow-all button-visible" aria-label="<?php esc_attr_e( 'Enable All', 'harlow' ); ?>"><?php esc_html_e( 'Enable All', 'harlow' ); ?></button>
								<button class="mgbutton moove-gdpr-modal-save-settings button-visible" aria-label="<?php esc_attr_e( 'Save Settings', 'harlow' ); ?>"><?php esc_html_e( 'Save Settings', 'harlow' ); ?></button>
				</div>
</div>
		</div>
		<div class="moove-clearfix"></div>

	</div>
	</dialog>
