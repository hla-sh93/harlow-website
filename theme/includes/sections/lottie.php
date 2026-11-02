<?php
/**
 * A Lottie animation (harlow/lottie): Elementor Pro's Lottie widget, the animation's place
 * (which assets/js/widgets/lottie.js fills with the animation, played as the settings in
 * data-settings say), its caption, and its link.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_url      = harlow_lottie_source( $attributes );
$harlow_external = 'external_url' === $attributes['source'];
$harlow_link     = 'custom' === $attributes['linkTo'] && '' !== $attributes['link'];

// The settings the page's script reads, as Elementor keeps them.
$harlow_stored   = json_decode( (string) $attributes['settings'], true );
$harlow_settings = array_merge(
	is_array( $harlow_stored ) ? $harlow_stored : array(),
	array(
		'source'              => $harlow_external ? 'external_url' : 'media_file',
		'source_json'         => array(
			'url'    => $harlow_external ? '' : $harlow_url,
			'id'     => $harlow_external ? '' : (int) $attributes['sourceJson'],
			'source' => 'library',
		),
		'source_external_url' => array( 'url' => $harlow_external ? $harlow_url : '' ),
		'caption_source'      => $attributes['captionSource'],
		'link_to'             => $harlow_link ? 'custom' : 'none',
		'trigger'             => $attributes['trigger'],
		'viewport'            => array(
			'unit'  => '%',
			'size'  => '',
			'sizes' => array(
				'start' => max( 0, min( 100, (float) $attributes['viewportStart'] ) ),
				'end'   => max( 0, min( 100, (float) $attributes['viewportEnd'] ) ),
			),
		),
		'effects_relative_to' => 'page' === $attributes['effectsRelativeTo'] ? 'page' : 'viewport',
		'loop'                => $attributes['loop'] ? 'yes' : 'no',
		'number_of_times'     => is_numeric( $attributes['numberOfTimes'] ) ? (int) $attributes['numberOfTimes'] : '',
		'link_timeout'        => is_numeric( $attributes['linkTimeout'] ) ? (int) $attributes['linkTimeout'] : '',
		'on_hover_out'        => $attributes['onHoverOut'],
		'hover_area'          => $attributes['hoverArea'],
		'play_speed'          => array(
			'unit'  => 'px',
			'size'  => max( 0.1, min( 5, (float) $attributes['playSpeed'] ) ),
			'sizes' => array(),
		),
		'start_point'         => array(
			'unit'  => '%',
			'size'  => max( 0, min( 100, (float) $attributes['startPoint'] ) ),
			'sizes' => array(),
		),
		'end_point'           => array(
			'unit'  => '%',
			'size'  => max( 0, min( 100, (float) $attributes['endPoint'] ) ),
			'sizes' => array(),
		),
		'reverse_animation'   => $attributes['reverse'] ? 'yes' : '',
		'renderer'            => 'canvas' === $attributes['renderer'] ? 'canvas' : 'svg',
		'lazyload'            => $attributes['lazyload'] ? 'yes' : '',
	)
);

$harlow_element             = $attributes;
$harlow_element['settings'] = (string) wp_json_encode( $harlow_settings );

// The caption: the file's title or caption, or words of the owner's own.
$harlow_caption = '';
if ( 'custom' === $attributes['captionSource'] ) {
	$harlow_caption = (string) $attributes['caption'];
} elseif ( ! $harlow_external && $attributes['sourceJson'] && 'title' === $attributes['captionSource'] ) {
	$harlow_caption = (string) get_post_field( 'post_title', (int) $attributes['sourceJson'], 'raw' );
} elseif ( ! $harlow_external && $attributes['sourceJson'] && 'caption' === $attributes['captionSource'] ) {
	$harlow_caption = (string) wp_get_attachment_caption( (int) $attributes['sourceJson'] );
}

$harlow_inner = '<div class="e-lottie__container"><div class="e-lottie__animation"></div>'
	. ( '' !== $harlow_caption ? '<p class="e-lottie__caption">' . wp_kses_post( $harlow_caption ) . '</p>' : '' )
	. '</div>';
if ( $harlow_link ) {
	$harlow_inner = '<a class="e-lottie__container__link"' . harlow_link_attributes( $attributes ) . '>' . $harlow_inner . '</a>';
}

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'lottie.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. $harlow_inner . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
