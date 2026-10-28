<?php
/**
 * The language switcher under the footer, as WPML prints it on live: the Arabic version
 * of this page, then this page in English. With WPML (stage 11) it is WPML's own.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) || defined( 'ICL_SITEPRESS_VERSION' ) ) {
	return;
}

$harlow_label = (string) harlow_setting( 'language_label' );
/* translators: %s: the name of the language, in that language. */
$harlow_arabic = sprintf( __( 'Switch to Arabic (%s)', 'harlow' ), $harlow_label );
?>
<div role="navigation" aria-label="<?php esc_attr_e( 'Language Switcher', 'harlow' ); ?>" class="wpml-ls-statics-footer wpml-ls wpml-ls-legacy-list-horizontal">
	<ul><li class="wpml-ls-slot-footer wpml-ls-item wpml-ls-item-ar wpml-ls-first-item wpml-ls-item-legacy-list-horizontal">
			<a href="<?php echo esc_url( harlow_translation_url() ); ?>" hreflang="ar" lang="ar" class="wpml-ls-link" aria-label="<?php echo esc_attr( $harlow_arabic ); ?>" title="<?php echo esc_attr( $harlow_arabic ); ?>">
				<img class="wpml-ls-flag" src="<?php echo esc_url( get_theme_file_uri( 'assets/vendor/plugins/sitepress-multilingual-cms/res/flags/ar.svg' ) ); ?>" alt="" loading="lazy" width="18" height="12"><span class="wpml-ls-native"><?php echo esc_html( $harlow_label ); ?></span><span class="wpml-ls-display"><span class="wpml-ls-bracket"> (</span><?php esc_html_e( 'Arabic', 'harlow' ); ?><span class="wpml-ls-bracket">)</span></span></a>
		</li><li class="wpml-ls-slot-footer wpml-ls-item wpml-ls-item-en wpml-ls-current-language wpml-ls-last-item wpml-ls-item-legacy-list-horizontal">
			<a href="<?php echo esc_url( harlow_current_url() ); ?>" hreflang="en" lang="en" class="wpml-ls-link" aria-current="page" aria-label="<?php esc_attr_e( 'Switch to English (English)', 'harlow' ); ?>" title="<?php esc_attr_e( 'Switch to English (English)', 'harlow' ); ?>">
				<img class="wpml-ls-flag" src="<?php echo esc_url( get_theme_file_uri( 'assets/vendor/plugins/sitepress-multilingual-cms/res/flags/en.svg' ) ); ?>" alt="" loading="lazy" width="18" height="12"><span class="wpml-ls-native"><?php esc_html_e( 'English', 'harlow' ); ?></span></a>
		</li></ul>
</div>
