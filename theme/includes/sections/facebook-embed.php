<?php
/**
 * A Facebook embed (harlow/facebook-embed): Elementor Pro's Facebook embed widget, a post
 * (`fb-post`, the whole post or not), a video (`fb-video`: full screen, autoplay,
 * captions, its text) or a comment (`fb-comment-embed`, with the comment it answers) from
 * Facebook, in Facebook's plugin markup. Facebook's SDK draws it
 * (assets/js/widgets/facebook-embed.js).
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
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-facebook-embed';
}
$harlow_own                 = '' !== $attributes['settings'] ? json_decode( $attributes['settings'], true ) : array();
$harlow_element['settings'] = (string) wp_json_encode(
	array_merge(
		is_array( $harlow_own ) ? $harlow_own : array(),
		array(
			'facebook_sdk_lang' => get_locale(),
			'facebook_app_id'   => (string) apply_filters( 'harlow_facebook_app_id', (string) get_option( 'elementor_pro_facebook_app_id', '' ) ),
		)
	)
);

$harlow_type = in_array( $attributes['embedType'], array( 'post', 'video', 'comment' ), true ) ? $attributes['embedType'] : 'post';
$harlow_url  = trim( (string) $attributes[ $harlow_type . 'Url' ] );
$harlow_flag = static function ( $on ) {
	return $on ? 'true' : 'false';
};

if ( '' === $harlow_url ) {
	$harlow_inner = esc_html__( 'Please enter a valid URL', 'harlow' );
} else {
	// The style keeps the element from counting as empty before the SDK draws it, as on Elementor.
	$harlow_inner = '<div style="min-height: 1px" ';
	if ( 'comment' === $harlow_type ) {
		$harlow_inner .= 'class="elementor-facebook-widget fb-comment-embed" data-href="' . esc_url( $harlow_url ) . '"'
			. ' data-include-parent="' . $harlow_flag( $attributes['includeParent'] ) . '"';
	} elseif ( 'post' === $harlow_type ) {
		$harlow_inner .= 'class="elementor-facebook-widget fb-post" data-href="' . esc_url( $harlow_url ) . '"'
			. ' data-show-text="' . $harlow_flag( $attributes['showText'] ) . '"';
	} else {
		$harlow_inner .= 'class="elementor-facebook-widget fb-video" data-href="' . esc_url( $harlow_url ) . '"'
			. ' data-show-text="' . $harlow_flag( $attributes['showText'] ) . '"'
			. ' data-allowfullscreen="' . $harlow_flag( $attributes['allowFullscreen'] ) . '"'
			. ' data-autoplay="' . $harlow_flag( $attributes['autoplay'] ) . '"'
			. ' data-show-captions="' . $harlow_flag( $attributes['showCaptions'] ) . '"';
	}
	$harlow_inner .= '></div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'facebook-embed.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes and the address are escaped where they are built.
