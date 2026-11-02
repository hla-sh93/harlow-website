<?php
/**
 * A video playlist (harlow/video-playlist): Elementor Pro's video playlist widget. The
 * list (its top bar with the playlist's name and how many videos it has, then the videos
 * and the section titles between them) beside the player of the video chosen, and under
 * it that video's own tabs. assets/js/widgets/video-playlist.js plays a video when it is
 * chosen, marks the videos watched and plays the next one when one ends.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_items = array_values( array_filter( (array) $attributes['videos'], 'is_array' ) );
if ( ! $harlow_items ) {
	return;
}
$harlow_id     = preg_replace( '/[^a-z0-9]/i', '', (string) $attributes['element'] );
$harlow_videos = array_values(
	array_filter(
		$harlow_items,
		static function ( $item ) {
			return ! isset( $item['type'] ) || 'section' !== $item['type'];
		}
	)
);
$harlow_count  = count( $harlow_videos );
$harlow_play   = '' !== $attributes['playIcon'] ? harlow_icon( $attributes['playIcon'] ) : harlow_video_playlist_icon( 'play' );
$harlow_check  = '' !== $attributes['watchedIcon'] ? harlow_icon( $attributes['watchedIcon'] ) : harlow_video_playlist_icon( 'watched' );

// The settings the page's script reads.
$harlow_stored   = json_decode( (string) $attributes['settings'], true );
$harlow_settings = array_merge(
	is_array( $harlow_stored ) ? $harlow_stored : array(),
	array(
		'autoplay_on_load'                 => $attributes['autoplay'] ? 'yes' : '',
		'autoplay_next'                    => $attributes['playNext'] ? 'yes' : '',
		'show_watched_indicator'           => $attributes['showWatched'] ? 'yes' : '',
		'lazy_load'                        => $attributes['lazyLoad'] ? 'yes' : '',
		'inner_tab_is_content_collapsible' => $attributes['collapsible'] ? 'yes' : '',
		'inner_tab_label_show_more'        => (string) $attributes['showMoreLabel'],
		'inner_tab_label_show_less'        => (string) $attributes['showLessLabel'],
	)
);

$harlow_element             = $attributes;
$harlow_element['classes']  = trim( preg_replace( '/\s*\be-video-playlist-layout-\S+/', '', $attributes['classes'] ) . ' e-video-playlist-layout-' . ( 'right' === $attributes['layout'] ? 'right' : 'left' ) );
$harlow_element['settings'] = (string) wp_json_encode( $harlow_settings );

// The main area's height on each device; the collapsed tab's height.
$harlow_vars = '';
foreach ( array(
	'desktop' => 'height',
	'tablet'  => 'heightTablet',
	'mobile'  => 'heightMobile',
) as $harlow_device => $harlow_key ) {
	if ( is_numeric( $attributes[ $harlow_key ] ) ) {
		$harlow_vars .= '--e-video-playlist-height-' . $harlow_device . ': ' . max( 0, (float) $attributes[ $harlow_key ] ) . 'px; ';
	}
}
if ( is_numeric( $attributes['collapsedHeight'] ) ) {
	$harlow_vars .= '--e-video-playlist-collapsed: ' . max( 0, (float) $attributes['collapsedHeight'] ) . 'px;';
}

$harlow_titles   = '';
$harlow_contents = '';
$harlow_tabs     = '';
$harlow_number   = 0;
foreach ( $harlow_items as $harlow_item ) {
	$harlow_type = isset( $harlow_item['type'] ) ? $harlow_item['type'] : 'youtube';
	$harlow_name = isset( $harlow_item['title'] ) ? (string) $harlow_item['title'] : '';
	if ( 'section' === $harlow_type ) {
		$harlow_titles .= '<div class="e-section-title" role="heading" aria-level="3">' . esc_html( $harlow_name ) . '</div>';
		continue;
	}
	++$harlow_number;
	$harlow_first = 1 === $harlow_number;
	$harlow_key   = $harlow_id . $harlow_number;
	$harlow_src   = harlow_video_playlist_src( $harlow_item );
	$harlow_thumb = $attributes['showThumbnails'] ? harlow_video_playlist_thumbnail( $harlow_item ) : '';

	// The video's line in the list.
	$harlow_titles .= '<div id="e-tab-title-' . esc_attr( $harlow_key ) . '" class="e-tab-title' . ( $harlow_first ? ' e-active' : '' ) . '" data-tab="' . $harlow_number . '" data-tab-type="' . esc_attr( $harlow_type ) . '" role="tab" tabindex="0" aria-selected="' . ( $harlow_first ? 'true' : 'false' ) . '" aria-controls="e-tab-content-' . esc_attr( $harlow_key ) . '">'
		. ( '' !== $harlow_thumb ? '<div class="e-tab-thumbnail"><img src="' . esc_url( $harlow_thumb ) . '" alt="" loading="lazy"></div>' : '' )
		. '<div class="e-tab-title-text">'
		. '<span class="e-tab-icon"><span class="icon-play">' . $harlow_play . '</span>' . ( $attributes['showWatched'] ? '<span class="icon-watched">' . $harlow_check . '</span>' : '' ) . '</span>'
		. '<h4 class="e-tab-title-name">' . esc_html( $harlow_name ) . '</h4>'
		. ( $attributes['showDuration'] && ! empty( $harlow_item['duration'] ) ? '<span class="e-tab-duration">' . esc_html( (string) $harlow_item['duration'] ) . '</span>' : '' )
		. '</div>'
		. '</div>';

	// The video's player: loaded when it is chosen (the first at once, or when seen).
	$harlow_load   = $harlow_first && ! $attributes['lazyLoad'] ? ' src="' . esc_url( $harlow_src ) . '"' : ' data-src="' . esc_url( $harlow_src ) . '"';
	$harlow_player = 'hosted' === $harlow_type
		? '<video class="e-tab-video" controls playsinline preload="metadata"' . $harlow_load . '></video>'
		: '<iframe class="e-tab-video" title="' . esc_attr( $harlow_name ) . '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen' . $harlow_load . '></iframe>';

	$harlow_contents .= '<div id="e-tab-content-' . esc_attr( $harlow_key ) . '" class="e-tab-content' . ( $harlow_first ? ' e-active' : '' ) . '" data-tab="' . $harlow_number . '" role="tabpanel" aria-labelledby="e-tab-title-' . esc_attr( $harlow_key ) . '"' . ( $harlow_first ? '' : ' hidden' ) . '>'
		. ( '' !== $harlow_src ? $harlow_player : '' )
		. '</div>';

	// The video's own tabs.
	$harlow_heads = '';
	$harlow_texts = '';
	foreach ( array( 1, 2 ) as $harlow_tab ) {
		$harlow_label = isset( $harlow_item[ 'tab' . $harlow_tab . 'Title' ] ) ? (string) $harlow_item[ 'tab' . $harlow_tab . 'Title' ] : '';
		$harlow_text  = isset( $harlow_item[ 'tab' . $harlow_tab . 'Content' ] ) ? (string) $harlow_item[ 'tab' . $harlow_tab . 'Content' ] : '';
		if ( '' === $harlow_label && '' === $harlow_text ) {
			continue;
		}
		$harlow_on     = '' === $harlow_heads;
		$harlow_heads .= '<div class="e-inner-tab-title' . ( $harlow_on ? ' e-inner-tab-active' : '' ) . '" data-tab="' . $harlow_tab . '" role="tab" tabindex="0" aria-selected="' . ( $harlow_on ? 'true' : 'false' ) . '"><a href="#">' . esc_html( $harlow_label ) . '</a></div>';
		$harlow_texts .= '<div class="e-inner-tab-content' . ( $harlow_on ? ' e-inner-tab-active' : '' ) . '" data-tab="' . $harlow_tab . '" role="tabpanel">'
			. '<div class="e-inner-tab-text' . ( $attributes['collapsible'] ? ' e-inner-tab-text--collapsible' : '' ) . '"><div class="e-inner-tab-text-visible">' . wp_kses_post( $harlow_text ) . '</div></div>'
			. ( $attributes['collapsible'] ? '<button type="button" class="e-inner-tab-text-toggle" aria-expanded="false">' . esc_html( $attributes['showMoreLabel'] ) . '</button>' : '' )
			. '</div>';
	}
	if ( '' !== $harlow_heads ) {
		$harlow_tabs .= '<div class="e-inner-tabs-wrapper' . ( $harlow_first ? ' e-active' : '' ) . '" data-tab="' . $harlow_number . '"' . ( $harlow_first ? '' : ' hidden' ) . '>'
			. '<div class="e-inner-tabs-header" role="tablist">' . $harlow_heads . '</div>'
			. '<div class="e-inner-tabs-content-wrapper">' . $harlow_texts . '</div>'
			. '</div>';
	}
}

$harlow_count_text = sprintf(
	/* translators: %d: how many videos the playlist has. */
	_n( '%d Video', '%d Videos', $harlow_count, 'harlow' ),
	$harlow_count
);

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'video-playlist.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="e-tabs"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( trim( $harlow_vars ) ) . '"' : '' ) . '>' . "\n"
	. '<div class="e-tabs-main-area">' . "\n"
	. '<div class="e-tabs-wrapper">' . "\n"
	. '<div class="e-tabs-header">'
	. '<h2 class="e-tabs-title">' . esc_html( $attributes['playlistTitle'] ) . '</h2>'
	. '<div class="e-tabs-header-right-side">'
	. ( $attributes['showCount'] ? '<span class="e-tabs-videos-count">' . esc_html( $harlow_count_text ) . '</span>' : '' )
	. '<span class="e-tabs-toggle-videos-display-button" role="button" tabindex="0" aria-label="' . esc_attr__( 'Show or hide the videos', 'harlow' ) . '">' . harlow_video_playlist_icon( 'toggle' ) . '</span>'
	. '</div>'
	. '</div>' . "\n"
	. '<div class="e-tabs-items-wrapper"><div class="e-tabs-items" role="tablist">' . $harlow_titles . '</div></div>' . "\n"
	. '</div>' . "\n"
	. '<div class="e-tabs-content-wrapper">' . $harlow_contents . '</div>' . "\n"
	. '</div>' . "\n"
	. ( '' !== $harlow_tabs ? '<div class="e-tabs-inner-tabs">' . $harlow_tabs . '</div>' . "\n" : '' )
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part is escaped where it is built.
