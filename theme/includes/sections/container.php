<?php
/**
 * A container (harlow/container): Elementor's flex or grid box, with the blocks inside it.
 *
 * Boxed: the inner box (.e-con-inner) holds the blocks, as Elementor's boxed width does.
 * A background video (the home page's banner) comes first, playing by itself.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The blocks inside, already printed, with the white
 *                                      space the reference has between them.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_video = '';
if ( '' !== $attributes['video'] ) {
	$harlow_video = "\n" . '<div class="elementor-background-video-container">' . "\n"
		. '<video class="elementor-background-video-hosted" role="presentation" autoplay muted playsinline loop src="' . esc_url( harlow_link_url( $attributes['video'] ) ) . '"></video>' . "\n"
		. '</div>';
}
$harlow_inside = $attributes['boxed'] ? "\n" . '<div class="e-con-inner">' . $content . '</div>' . "\n" : $content;

echo '<div' . harlow_element_attributes( $attributes, 'container' ) . '>' . $harlow_video . $harlow_inside . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the video is escaped above; the inside is the inner blocks, printed by WordPress.
