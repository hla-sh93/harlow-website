<?php
/**
 * The forms: Contact Form 7's (live's two, laid down by the installer from install/
 * forms.json), printed as live prints them.
 *
 * Live prints Cloudflare Turnstile's widget in each form, right before the submit button;
 * Turnstile needs live's keys and comes with the live step. Until then the widget's empty
 * slot, live's own markup (stored with the form), stands where the widget would, so the
 * form keeps its layout. CF7's script (sending without leaving the page, the spinner, the
 * messages) is loaded where a form is.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The Turnstile widget's slot before the submit button, as the Turnstile plugin places it.
 *
 * @param string $html The form's fields, printed.
 * @return string
 */
function harlow_form_turnstile_slot( $html ) {
	$form = function_exists( 'wpcf7_get_current_contact_form' ) ? wpcf7_get_current_contact_form() : null;
	$slot = $form ? (string) get_post_meta( $form->id(), '_harlow_turnstile_slot', true ) : '';
	if ( '' === $slot ) {
		return $html;
	}
	$submit = '<input class="wpcf7-form-control wpcf7-submit';
	$at     = strpos( $html, $submit );
	return false === $at ? $html : substr_replace( $html, $slot . '<br/>', $at, 0 );
}
add_filter( 'wpcf7_form_elements', 'harlow_form_turnstile_slot', 20 );

/**
 * Does the page being printed hold a form? A job's page always does (its template); any
 * other page when one of its blocks prints a form.
 *
 * @return bool
 */
function harlow_page_has_form() {
	if ( is_singular( 'job' ) ) {
		return true;
	}
	return is_singular() && false !== strpos( (string) get_post_field( 'post_content', get_queried_object_id() ), '[contact-form-7 ' );
}

/**
 * CF7's script and stylesheet where a form is, as live loads them (the stylesheet first, so
 * the site's own rules, which hold the form's look at rest, come after it). The stylesheet
 * draws what the reference cannot show: a refused field's message, the answer's frame.
 *
 * @return bool
 */
function harlow_load_form_assets() {
	return harlow_page_has_form();
}
add_filter( 'wpcf7_load_js', 'harlow_load_form_assets' );
add_filter( 'wpcf7_load_css', 'harlow_load_form_assets' );
