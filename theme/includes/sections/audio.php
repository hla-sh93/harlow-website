<?php
/**
 * SoundCloud (harlow/audio): Elementor's audio widget, SoundCloud's player for the track's
 * address with the player's settings, as Elementor writes them into the embed's address.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_link = trim( (string) $attributes['link'] );
if ( '' === $harlow_link || ! preg_match( '#^https?://(www\.|m\.)?(soundcloud\.com|on\.soundcloud\.com|snd\.sc)/#i', $harlow_link ) ) {
	return;
}

// The address SoundCloud's oEmbed answers with (WordPress's embed size: the content width,
// the height it allows), then Elementor's settings over it.
$harlow_bool   = static function ( $on ) {
	return $on ? 'true' : 'false';
};
$harlow_visual = $harlow_bool( $attributes['visual'] );
$harlow_width  = isset( $GLOBALS['content_width'] ) ? (int) $GLOBALS['content_width'] : 500;
$harlow_src    = 'https://w.soundcloud.com/player/?visual=' . $harlow_visual . '&url=' . rawurlencode( $harlow_link )
	. '&show_artwork=true&maxheight=' . min( (int) ceil( $harlow_width * 1.5 ), 1000 ) . '&maxwidth=' . $harlow_width;
$harlow_src    = add_query_arg(
	array(
		'auto_play'      => $harlow_bool( $attributes['autoplay'] ),
		'buying'         => $harlow_bool( $attributes['buying'] ),
		'liking'         => $harlow_bool( $attributes['liking'] ),
		'download'       => $harlow_bool( $attributes['download'] ),
		'sharing'        => $harlow_bool( $attributes['sharing'] ),
		'show_comments'  => $harlow_bool( $attributes['comments'] ),
		'show_playcount' => $harlow_bool( $attributes['playCount'] ),
		'show_user'      => $harlow_bool( $attributes['user'] ),
		'show_artwork'   => $harlow_bool( ! $attributes['visual'] && $attributes['artwork'] ),
		'color'          => str_replace( '#', '', (string) $attributes['color'] ),
	),
	$harlow_src
);
$harlow_height = is_numeric( $attributes['height'] ) && (int) $attributes['height'] > 0 ? (int) $attributes['height'] : ( $attributes['visual'] ? 400 : 200 );

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'audio.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="elementor-soundcloud-wrapper">' . "\n"
	. '<iframe title="' . esc_attr__( 'SoundCloud player', 'harlow' ) . '" width="100%" height="' . $harlow_height . '" scrolling="no" frameborder="no" src="' . esc_url( $harlow_src ) . '"></iframe>' . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
