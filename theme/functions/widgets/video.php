<?php
/**
 * The video (harlow/video, includes/sections/video.php): a YouTube, Vimeo or Dailymotion
 * address made the player's embed address, with the player's settings, as Elementor's
 * Embed class makes it; a file's address with its start and end; the play icon.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The provider and the video's id of a video address.
 *
 * @param string $url The address.
 * @return array{provider:string,id:string}|null
 */
function harlow_video_properties( $url ) {
	$patterns = array(
		'youtube'     => '/^.*(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:(?:watch)?\?(?:.*&)?vi?=|(?:embed|v|vi|user|shorts)\/))([^\?&\"\'>]+)/',
		'vimeo'       => '/^.*vimeo\.com\/(?:[a-z]*\/)*([0-9]{6,11})[?]?.*/',
		'dailymotion' => '/^.*dailymotion.com\/(?:video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/',
	);
	foreach ( $patterns as $provider => $pattern ) {
		if ( preg_match( $pattern, (string) $url, $m ) ) {
			return array(
				'provider' => $provider,
				'id'       => isset( $m[3] ) && '' !== $m[3] ? $m[3] : $m[1],
			);
		}
	}
	return null;
}

/**
 * The player's embed address of a video address, with the player's settings.
 *
 * @param string               $url     The video's address.
 * @param array<string,string> $params  The player's settings (query arguments).
 * @param array<string,mixed>  $options privacy (YouTube's no-cookie address), start (Vimeo).
 * @return string '' when the address is not a known provider's.
 */
function harlow_video_embed_url( $url, $params = array(), $options = array() ) {
	$video = harlow_video_properties( $url );
	if ( ! $video ) {
		return '';
	}
	$patterns = array(
		'youtube'     => 'https://www.youtube{NO_COOKIE}.com/embed/{VIDEO_ID}?feature=oembed',
		'vimeo'       => 'https://player.vimeo.com/video/{VIDEO_ID}#t={TIME}',
		'dailymotion' => 'https://dailymotion.com/embed/video/{VIDEO_ID}',
	);

	$time = ! empty( $options['start'] ) ? gmdate( 'H\hi\ms\s', (int) $options['start'] ) : '';
	$base = str_replace(
		array( '{VIDEO_ID}', '{NO_COOKIE}', '{TIME}' ),
		array( $video['id'], ! empty( $options['privacy'] ) ? '-nocookie' : '', $time ),
		$patterns[ $video['provider'] ]
	);
	return add_query_arg( $params, $base );
}

/**
 * The embed's iframe, as Elementor's Embed::get_embed_html() writes it.
 *
 * @param string               $url      The video's address.
 * @param array<string,string> $params   The player's settings.
 * @param array<string,mixed>  $options  privacy, start, lazy_load.
 * @return string
 */
function harlow_video_embed_html( $url, $params, $options ) {
	$video = harlow_video_properties( $url );
	$src   = harlow_video_embed_url( $url, $params, $options );
	if ( ! $video || '' === $src ) {
		return '';
	}
	return '<iframe class="elementor-video-iframe" allowfullscreen allow="' . ( isset( $params['autoplay'] ) ? 'autoplay' : 'clipboard-write' ) . '"'
		. ' title="' . esc_attr( $video['provider'] . ' Video Player' ) . '"'
		. ( empty( $options['lazy_load'] ) ? ' src="' . esc_url( $src ) . '"' : ' data-lazy-load="' . esc_url( $src ) . '"' )
		. '></iframe>';
}

/**
 * The player's settings of a video block, as Elementor's video widget gives them to its
 * provider.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param bool                $overlay    Whether a picture covers the player until it is played.
 * @return array<string,string>
 */
function harlow_video_embed_params( $attributes, $overlay ) {
	$params = array();
	if ( $attributes['autoplay'] && ! $overlay ) {
		$params['autoplay'] = '1';
	}
	$yes = static function ( $on ) {
		return $on ? '1' : '0';
	};
	if ( 'youtube' === $attributes['videoType'] ) {
		if ( $attributes['loop'] ) {
			$video              = harlow_video_properties( $attributes['youtubeUrl'] );
			$params['playlist'] = $video ? $video['id'] : '';
		}
		$params['start']          = (string) $attributes['start'];
		$params['end']            = (string) $attributes['end'];
		$params['wmode']          = 'opaque';
		$params['loop']           = $yes( $attributes['loop'] );
		$params['controls']       = $yes( $attributes['controls'] );
		$params['mute']           = $yes( $attributes['mute'] );
		$params['rel']            = $yes( 'yes' === $attributes['rel'] );
		$params['modestbranding'] = $yes( $attributes['modestbranding'] );
		if ( $attributes['playOnMobile'] ) {
			$params['playsinline'] = '1';
		}
	} elseif ( 'vimeo' === $attributes['videoType'] ) {
		$params['color']     = str_replace( '#', '', (string) $attributes['color'] );
		$params['autopause'] = '0';
		if ( $attributes['playOnMobile'] ) {
			$params['playsinline'] = '1';
		}
		$params['loop']     = $yes( $attributes['loop'] );
		$params['muted']    = $yes( $attributes['mute'] );
		$params['title']    = $yes( $attributes['vimeoTitle'] );
		$params['portrait'] = $yes( $attributes['vimeoPortrait'] );
		$params['byline']   = $yes( $attributes['vimeoByline'] );
	} elseif ( 'dailymotion' === $attributes['videoType'] ) {
		$params['ui-highlight']         = str_replace( '#', '', (string) $attributes['color'] );
		$params['start']                = (string) $attributes['start'];
		$params['endscreen-enable']     = '0';
		$params['controls']             = $yes( $attributes['controls'] );
		$params['mute']                 = $yes( $attributes['mute'] );
		$params['ui-start-screen-info'] = $yes( $attributes['showinfo'] );
		$params['ui-logo']              = $yes( $attributes['logo'] );
	}
	return $params;
}

/**
 * The address of a file of the site or anywhere, with its start and end (#t=start,end).
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return string
 */
function harlow_video_hosted_url( $attributes ) {
	$url = $attributes['insertUrl'] ? harlow_link_url( (string) $attributes['externalUrl'] ) : (string) wp_get_attachment_url( (int) $attributes['hostedVideo'] );
	if ( '' === $url ) {
		return '';
	}
	if ( is_numeric( $attributes['start'] ) || is_numeric( $attributes['end'] ) ) {
		$url .= '#t=' . ( is_numeric( $attributes['start'] ) ? (float) $attributes['start'] : '' );
		if ( is_numeric( $attributes['end'] ) ) {
			$url .= ',' . (float) $attributes['end'];
		}
	}
	return $url;
}

/**
 * The attributes of a file's player, as Elementor writes them.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return array<string,string>
 */
function harlow_video_hosted_params( $attributes ) {
	$params = array();
	foreach ( array( 'autoplay', 'loop', 'controls' ) as $name ) {
		if ( $attributes[ $name ] ) {
			$params[ $name ] = '';
		}
	}
	if ( '' !== $attributes['preload'] ) {
		$params['preload'] = $attributes['preload'];
	}
	if ( $attributes['mute'] ) {
		$params['muted'] = 'muted';
	}
	if ( $attributes['playOnMobile'] ) {
		$params['playsinline'] = '';
	}
	if ( ! $attributes['downloadButton'] ) {
		$params['controlsList'] = 'nodownload';
	}
	$poster = $attributes['poster'] ? wp_get_attachment_image_url( (int) $attributes['poster'], 'full' ) : '';
	if ( $poster ) {
		$params['poster'] = $poster;
	}
	return $params;
}

/**
 * HTML attributes, each with its leading space; an empty value is written alone.
 *
 * @param array<string,string> $attrs Names and values.
 * @return string
 */
function harlow_video_attributes( $attrs ) {
	$out = '';
	foreach ( $attrs as $name => $value ) {
		$out .= ' ' . $name . ( '' === $value ? '' : '="' . esc_attr( $value ) . '"' );
	}
	return $out;
}

/**
 * Elementor's play icon (eicons play), drawn when no icon is chosen.
 *
 * @return string
 */
function harlow_video_play_icon() {
	return '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-play" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M838 162C746 71 633 25 500 25 371 25 258 71 163 162 71 254 25 367 25 500 25 633 71 746 163 837 254 929 367 979 500 979 633 979 746 933 838 837 929 746 975 633 975 500 975 367 929 254 838 162M808 192C892 279 933 379 933 500 933 621 892 725 808 808 725 892 621 938 500 938 379 938 279 896 196 808 113 725 67 621 67 500 67 379 108 279 196 192 279 108 383 63 500 63 621 63 721 104 808 192M438 392V642L642 517 438 392Z"></path></svg>';
}

/**
 * The aspect ratios Elementor offers, as the number its stylesheet reads.
 *
 * @param string $ratio 169, 219, 43, 32, 11 or 916.
 * @return string
 */
function harlow_video_ratio( $ratio ) {
	$ratios = array(
		'169' => '1.77777',
		'219' => '2.33333',
		'43'  => '1.33333',
		'32'  => '1.5',
		'11'  => '1',
		'916' => '0.5625',
	);
	return isset( $ratios[ $ratio ] ) ? $ratios[ $ratio ] : $ratios['169'];
}
