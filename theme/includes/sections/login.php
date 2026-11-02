<?php
/**
 * A login form (harlow/login): Elementor Pro's login widget, the user and password fields
 * (their labels shown or not), remember me, the button, and the links to a lost password
 * and to register, posting to wp-login.php as Elementor's does; back to this page after
 * logging in, or to an address the owner gives. Whoever is logged in sees a message with a
 * link to log out instead (or nothing).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_element = $attributes;
if ( '' === trim( $harlow_element['classes'] ) ) {
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-login';
}
// The button's alignment, as a class of the element (its rules are in login.css).
if ( in_array( $attributes['buttonAlign'], array( 'start', 'center', 'end', 'stretch' ), true ) ) {
	$harlow_element['classes'] .= ' elementor-button-align-' . $attributes['buttonAlign'];
}

// This page's address (as Elementor takes it), and where to go after logging in and out.
$harlow_current = isset( $_SERVER['REQUEST_URI'] ) ? remove_query_arg( 'fake_arg' ) : home_url( '/' );
$harlow_login   = $attributes['redirectAfterLogin'] && '' !== trim( (string) $attributes['redirectUrl'] ) ? harlow_link_url( trim( (string) $attributes['redirectUrl'] ) ) : $harlow_current;
$harlow_logout  = $attributes['redirectAfterLogout'] && '' !== trim( (string) $attributes['redirectLogoutUrl'] ) ? harlow_link_url( trim( (string) $attributes['redirectLogoutUrl'] ) ) : $harlow_current;

$harlow_inner = '';
if ( is_user_logged_in() ) {
	if ( $attributes['showLoggedInMessage'] ) {
		$harlow_user   = wp_get_current_user();
		$harlow_inner .= '<div class="elementor-login elementor-login__logged-in-message">'
			. sprintf(
				/* translators: 1: the user's name, 2: the logout link's opening tag, 3: its closing tag. */
				esc_html__( 'You are Logged in as %1$s (%2$sLogout%3$s)', 'harlow' ),
				esc_html( $harlow_user->display_name ),
				'<a href="' . esc_url( wp_logout_url( $harlow_logout ) ) . '" target="_blank">',
				'</a>'
			)
			. '</div>' . "\n";
	}
} else {
	$harlow_id     = sanitize_html_class( $attributes['element'] );
	$harlow_input  = in_array( $attributes['inputSize'], array( 'xs', 'sm', 'md', 'lg', 'xl' ), true ) ? $attributes['inputSize'] : 'sm';
	$harlow_size   = in_array( $attributes['buttonSize'], array( 'xs', 'sm', 'md', 'lg', 'xl' ), true ) ? $attributes['buttonSize'] : 'sm';
	$harlow_group  = 'elementor-field-type-text elementor-field-group elementor-column elementor-col-100 elementor-field-required';
	$harlow_fields = array(
		array( 'user', 'text', 'log', $attributes['userLabel'], $attributes['userPlaceholder'] ),
		array( 'password', 'password', 'pwd', $attributes['passwordLabel'], $attributes['passwordPlaceholder'] ),
	);
	$harlow_rows   = '';
	foreach ( $harlow_fields as $harlow_field ) {
		list( $harlow_key, $harlow_type, $harlow_name, $harlow_label, $harlow_placeholder ) = $harlow_field;
		$harlow_rows .= '<div class="' . $harlow_group . '">' . "\n"
			. ( $attributes['showLabels'] ? '<label for="' . esc_attr( $harlow_key . '-' . $harlow_id ) . '" class="elementor-field-label">' . wp_kses_post( $harlow_label ) . '</label>' : '' )
			. '<input size="1" type="' . $harlow_type . '" name="' . $harlow_name . '" id="' . esc_attr( $harlow_key . '-' . $harlow_id ) . '" placeholder="' . esc_attr( wp_strip_all_tags( $harlow_placeholder ) ) . '" class="elementor-field elementor-field-textual elementor-size-' . $harlow_input . '">' . "\n"
			. '</div>' . "\n";
	}
	if ( $attributes['showRememberMe'] ) {
		$harlow_rows .= '<div class="elementor-field-type-checkbox elementor-field-group elementor-column elementor-col-100 elementor-remember-me">' . "\n"
			. '<label for="elementor-login-remember-me">' . "\n"
			. '<input type="checkbox" id="elementor-login-remember-me" name="rememberme" value="forever">' . "\n"
			. esc_html__( 'Remember Me', 'harlow' ) . "\n"
			. '</label>' . "\n"
			. '</div>' . "\n";
	}
	$harlow_button = trim( (string) $attributes['buttonText'] );
	$harlow_rows  .= '<div class="elementor-field-group elementor-column elementor-field-type-submit elementor-col-100">' . "\n"
		. '<button type="submit" class="elementor-size-' . $harlow_size . ' elementor-button" name="wp-submit">' . "\n"
		. ( '' !== $harlow_button ? '<span class="elementor-button-text">' . wp_kses_post( $harlow_button ) . '</span>' . "\n" : '' )
		. '</button>' . "\n"
		. '</div>' . "\n";

	$harlow_lost     = $attributes['showLostPassword'];
	$harlow_register = $attributes['showRegister'] && get_option( 'users_can_register' );
	if ( $harlow_lost || $harlow_register ) {
		$harlow_rows .= '<div class="elementor-field-group elementor-column elementor-col-100">' . "\n"
			. ( $harlow_lost ? '<a class="elementor-lost-password" href="' . esc_url( wp_lostpassword_url( $harlow_login ) ) . '">' . "\n" . esc_html__( 'Lost your password?', 'harlow' ) . "\n" . '</a>' . "\n" : '' )
			. ( $harlow_register && $harlow_lost ? '<span class="elementor-login-separator"> | </span>' . "\n" : '' )
			. ( $harlow_register ? '<a class="elementor-register" href="' . esc_url( wp_registration_url() ) . '">' . "\n" . esc_html__( 'Register', 'harlow' ) . "\n" . '</a>' . "\n" : '' )
			. '</div>' . "\n";
	}
	$harlow_inner .= '<form class="elementor-login elementor-form" method="post" action="' . esc_url( site_url( 'wp-login.php', 'login_post' ) ) . '" aria-label="' . esc_attr__( 'Login form', 'harlow' ) . '">' . "\n"
		. '<input type="hidden" name="redirect_to" value="' . esc_attr( $harlow_login ) . '">' . "\n"
		. '<div class="elementor-form-fields-wrapper">' . "\n"
		. $harlow_rows
		. '</div>' . "\n"
		. '</form>' . "\n";
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'login.default' ) . '>';
if ( '' !== $harlow_inner ) {
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n" . $harlow_inner . '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the addresses are escaped where they are built.
