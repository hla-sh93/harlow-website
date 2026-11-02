<?php
/**
 * The video playlist (harlow/video-playlist, includes/sections/video-playlist.php): a
 * video's player address and thumbnail, the icons the playlist draws.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * A YouTube or Vimeo address's provider and video id.
 *
 * @param string $url The address.
 * @return array{provider:string,id:string}|null
 */
function harlow_video_playlist_video( $url ) {
	if ( preg_match( '/^.*(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:(?:watch)?\?(?:.*&)?vi?=|(?:embed|v|vi|user|shorts)\/))([^\?&\"\'>]+)/', (string) $url, $m ) ) {
		return array(
			'provider' => 'youtube',
			'id'       => $m[1],
		);
	}
	if ( preg_match( '/^.*vimeo\.com\/(?:[a-z]*\/)*([0-9]{6,11})[?]?.*/', (string) $url, $m ) ) {
		return array(
			'provider' => 'vimeo',
			'id'       => $m[1],
		);
	}
	return null;
}

/**
 * The address a playlist item plays: an embed (the player's messages on, so the page knows
 * when the video ends) or a file.
 *
 * @param array<string,mixed> $item The playlist item.
 * @return string '' when it has none.
 */
function harlow_video_playlist_src( $item ) {
	$type = isset( $item['type'] ) ? $item['type'] : 'youtube';
	if ( 'hosted' === $type ) {
		if ( ! empty( $item['externalUrl'] ) ) {
			return harlow_link_url( (string) $item['externalUrl'] );
		}
		return ! empty( $item['hosted'] ) ? (string) wp_get_attachment_url( (int) $item['hosted'] ) : '';
	}
	$video = harlow_video_playlist_video( isset( $item['url'] ) ? $item['url'] : '' );
	if ( ! $video ) {
		return '';
	}
	if ( 'youtube' === $video['provider'] ) {
		return 'https://www.youtube.com/embed/' . rawurlencode( $video['id'] ) . '?feature=oembed&rel=0&enablejsapi=1';
	}
	return 'https://player.vimeo.com/video/' . rawurlencode( $video['id'] ) . '?api=1&autopause=0';
}

/**
 * A playlist item's thumbnail: the picture chosen, or YouTube's own.
 *
 * @param array<string,mixed> $item The playlist item.
 * @return string '' when it has none.
 */
function harlow_video_playlist_thumbnail( $item ) {
	if ( ! empty( $item['thumbnail'] ) ) {
		return (string) wp_get_attachment_image_url( (int) $item['thumbnail'], 'medium' );
	}
	$video = harlow_video_playlist_video( isset( $item['url'] ) ? $item['url'] : '' );
	if ( $video && 'youtube' === $video['provider'] && ( empty( $item['type'] ) || 'youtube' === $item['type'] ) ) {
		return 'https://i.ytimg.com/vi/' . rawurlencode( $video['id'] ) . '/hqdefault.jpg';
	}
	return '';
}

/**
 * The icons the playlist draws when none is chosen: a video to play (Font Awesome's play
 * circle), a video watched (check circle), the list's toggle on a phone (a chevron).
 *
 * @param string $which play, watched or toggle.
 * @return string
 */
function harlow_video_playlist_icon( $which ) {
	$icons = array(
		'play'    => '<svg aria-hidden="true" class="e-font-icon-svg e-far-play-circle" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M371.7 238l-176-107c-15.8-8.8-35.7 2.5-35.7 21v208c0 18.4 19.8 29.8 35.7 21l176-101c16.4-9.1 16.4-32.8 0-42zM504 256C504 119 393 8 256 8S8 119 8 256s111 248 248 248 248-111 248-248zm-448 0c0-110.5 89.5-200 200-200s200 89.5 200 200-89.5 200-200 200S56 366.5 56 256z"></path></svg>',
		'watched' => '<svg aria-hidden="true" class="e-font-icon-svg e-fas-check-circle" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>',
		'toggle'  => '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-down" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M500 696C483 696 471 692 458 679L138 358C112 333 112 292 138 267 163 242 204 242 229 267L500 538 771 267C796 242 837 242 862 267 888 292 888 333 862 358L542 679C529 692 517 696 500 696Z"></path></svg>',
	);
	return isset( $icons[ $which ] ) ? $icons[ $which ] : '';
}
