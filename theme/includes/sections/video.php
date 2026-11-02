<?php
/**
 * A video (harlow/video): Elementor's video widget. A YouTube, Vimeo or Dailymotion video is
 * the provider's embed with the player's settings (functions/widgets/video.php); a file of
 * the site or anywhere is a video element. A picture may cover the player until it is
 * clicked, and then plays the video in place or in a lightbox
 * (assets/js/widgets/video.js).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_type    = in_array( $attributes['videoType'], array( 'youtube', 'vimeo', 'dailymotion', 'hosted' ), true ) ? $attributes['videoType'] : 'youtube';
$harlow_hosted  = 'hosted' === $harlow_type;
$harlow_overlay = $attributes['showImageOverlay'] && $attributes['imageOverlay'] && wp_attachment_is_image( (int) $attributes['imageOverlay'] );
$harlow_url     = $harlow_hosted ? harlow_video_hosted_url( $attributes ) : (string) $attributes[ $harlow_type . 'Url' ];
if ( '' === $harlow_url ) {
	return;
}

$harlow_params  = array();
$harlow_options = array();
if ( $harlow_hosted ) {
	$harlow_video = '<video class="elementor-video" src="' . esc_attr( $harlow_url ) . '"' . harlow_video_attributes( harlow_video_hosted_params( $attributes ) ) . '></video>';
} else {
	$harlow_params  = harlow_video_embed_params( $attributes, $harlow_overlay );
	$harlow_options = array(
		'privacy'   => 'youtube' === $harlow_type && $attributes['ytPrivacy'],
		'start'     => 'vimeo' === $harlow_type ? $attributes['start'] : '',
		'lazy_load' => $attributes['lazyLoad'],
	);
	$harlow_video   = harlow_video_embed_html( $harlow_url, $harlow_params, $harlow_options );
}
if ( '' === $harlow_video ) {
	echo esc_url( $harlow_url );
	return;
}

// The settings the page's script reads, as Elementor keeps them.
$harlow_stored   = json_decode( (string) $attributes['settings'], true );
$harlow_settings = array_merge(
	is_array( $harlow_stored ) ? $harlow_stored : array(),
	array_filter(
		array(
			'video_type'         => $harlow_type,
			'start'              => (string) $attributes['start'],
			'end'                => (string) $attributes['end'],
			'autoplay'           => $attributes['autoplay'] ? 'yes' : '',
			'play_on_mobile'     => $attributes['playOnMobile'] ? 'yes' : '',
			'mute'               => $attributes['mute'] ? 'yes' : '',
			'loop'               => $attributes['loop'] ? 'yes' : '',
			'lazy_load'          => $attributes['lazyLoad'] ? 'yes' : '',
			'show_image_overlay' => $harlow_overlay ? 'yes' : '',
			'lightbox'           => $harlow_overlay && $attributes['lightbox'] ? 'yes' : '',
		),
		'strlen'
	)
);

$harlow_element             = $attributes;
$harlow_element['settings'] = (string) wp_json_encode( $harlow_settings );

$harlow_lightbox = $harlow_overlay && $attributes['lightbox'];
$harlow_ratio    = harlow_video_ratio( $attributes['aspectRatio'] );
$harlow_classes  = 'elementor-wrapper'
	. ( $harlow_hosted ? ' e-hosted-video' : '' )
	. ( ! $harlow_lightbox && ! $harlow_hosted ? ' elementor-fit-aspect-ratio' : '' )
	. ' elementor-open-' . ( $harlow_lightbox ? 'lightbox' : 'inline' );

$harlow_inner = $harlow_lightbox ? '' : "\n" . $harlow_video;
if ( $harlow_overlay ) {
	$harlow_alt  = (string) get_post_meta( (int) $attributes['imageOverlay'], '_wp_attachment_image_alt', true );
	$harlow_a11y = '' === $harlow_alt ? __( 'Play Video', 'harlow' ) : __( 'Play Video about', 'harlow' ) . ' ' . $harlow_alt;
	$harlow_size = '' !== $attributes['imageOverlaySize'] ? $attributes['imageOverlaySize'] : 'full';
	if ( $harlow_lightbox ) {
		$harlow_box = array(
			'type'         => 'video',
			'videoType'    => $harlow_type,
			'url'          => $harlow_hosted ? $harlow_url : harlow_video_embed_url( $harlow_url, $harlow_params, $harlow_options ),
			'autoplay'     => $attributes['autoplay'] ? 'yes' : '',
			'modalOptions' => array(
				'id'                => 'elementor-lightbox-' . $attributes['element'],
				'entranceAnimation' => $attributes['lightboxAnimation'],
				'videoAspectRatio'  => '' !== $attributes['aspectRatio'] ? $attributes['aspectRatio'] : '169',
			),
		);
		if ( $harlow_hosted ) {
			$harlow_box['videoParams'] = harlow_video_hosted_params( $attributes );
		}
		$harlow_hash = '#' . rawurlencode(
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Elementor's lightbox reads its settings as base64 JSON.
			'elementor-action:action=lightbox&settings=' . base64_encode( (string) wp_json_encode( $harlow_box ) )
		);
		$harlow_cover_tag = '<div class="elementor-custom-embed-image-overlay" data-elementor-open-lightbox="yes" data-elementor-lightbox="' . esc_attr( (string) wp_json_encode( $harlow_box ) ) . '" data-e-action-hash="' . esc_attr( $harlow_hash ) . '">'
			. wp_get_attachment_image( (int) $attributes['imageOverlay'], $harlow_size, false, array( 'class' => 'attachment-' . $harlow_size . ' size-' . $harlow_size . ' wp-image-' . (int) $attributes['imageOverlay'] ) );
	} else {
		$harlow_src       = wp_get_attachment_image_url( (int) $attributes['imageOverlay'], $harlow_size );
		$harlow_cover_tag = '<div class="elementor-custom-embed-image-overlay" style="' . esc_attr( 'background-image: url(' . esc_url( (string) $harlow_src ) . ');' ) . '">';
	}
	$harlow_inner .= "\n" . $harlow_cover_tag;
	if ( $attributes['showPlayIcon'] ) {
		$harlow_inner .= "\n" . '<div class="elementor-custom-embed-play" role="button" aria-label="' . esc_attr( $harlow_a11y ) . '" tabindex="0">' . "\n"
			. ( '' !== $attributes['playIcon'] ? harlow_icon( $attributes['playIcon'] ) : harlow_video_play_icon() ) . "\n"
			. '<span class="elementor-screen-only">' . esc_html( $harlow_a11y ) . '</span>' . "\n"
			. '</div>';
	}
	$harlow_inner .= "\n" . '</div>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'video.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="' . esc_attr( $harlow_classes ) . '" style="' . esc_attr( '--video-aspect-ratio: ' . $harlow_ratio ) . '">'
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
