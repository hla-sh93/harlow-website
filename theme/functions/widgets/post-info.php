<?php
/**
 * The lines of the post info widget: what each kind of line shows of the item, where it
 * leads, and its icon, as Elementor Pro's post info widget gives them.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * One line of the post info widget.
 *
 * @param array<string,mixed> $item The line's settings: type, dateFormat, customDate,
 *                                  timeFormat, customTime, taxonomy, link, avatar,
 *                                  commentsCustom, noComments, oneComment, comments,
 *                                  customText, customUrl.
 * @param WP_Post             $post The item.
 * @return array{type:string,html:string,url:string,itemprop:string,avatar:string}|null
 *         Null for a line with nothing to show (comments closed, no terms).
 */
function harlow_post_info_item( $item, $post ) {
	$get  = static function ( $key, $fallback = '' ) use ( $item ) {
		return isset( $item[ $key ] ) && '' !== $item[ $key ] ? $item[ $key ] : $fallback;
	};
	$link = (bool) $get( 'link', true );
	$type = (string) $get( 'type', 'date' );
	$out  = array(
		'type'     => $type,
		'html'     => '',
		'url'      => '',
		'itemprop' => '',
		'avatar'   => '',
	);
	switch ( $type ) {
		case 'author':
			$author          = (int) $post->post_author;
			$out['html']     = esc_html( get_the_author_meta( 'display_name', $author ) );
			$out['itemprop'] = 'author';
			$out['url']      = $link ? get_author_posts_url( $author ) : '';
			$out['avatar']   = $get( 'avatar', false ) ? (string) get_avatar_url( $author, array( 'size' => 96 ) ) : '';
			break;
		case 'date':
			$formats         = array(
				'default' => 'F j, Y',
				'0'       => 'F j, Y',
				'1'       => 'Y-m-d',
				'2'       => 'm/d/Y',
				'3'       => 'd/m/Y',
				'custom'  => (string) $get( 'customDate', 'F j, Y' ),
			);
			$format          = (string) $get( 'dateFormat', 'default' );
			$out['html']     = esc_html( get_the_time( isset( $formats[ $format ] ) ? $formats[ $format ] : 'F j, Y', $post ) );
			$out['itemprop'] = 'datePublished';
			$out['url']      = $link ? get_day_link( (int) get_post_time( 'Y', false, $post ), (int) get_post_time( 'm', false, $post ), (int) get_post_time( 'j', false, $post ) ) : '';
			break;
		case 'time':
			$formats         = array(
				'default' => 'g:i a',
				'0'       => 'g:i a',
				'1'       => 'g:i A',
				'2'       => 'H:i',
				'custom'  => (string) $get( 'customTime', 'g:i a' ),
			);
			$format          = (string) $get( 'timeFormat', 'default' );
			$out['html']     = esc_html( get_the_time( isset( $formats[ $format ] ) ? $formats[ $format ] : 'g:i a', $post ) );
			$out['itemprop'] = 'datePublished';
			break;
		case 'comments':
			if ( ! comments_open( $post ) ) {
				return null;
			}
			$custom = (bool) $get( 'commentsCustom', false );
			$count  = (int) get_comments_number( $post );
			if ( 0 === $count ) {
				$words = $custom ? (string) $get( 'noComments', __( 'No Comments', 'harlow' ) ) : __( 'No Comments', 'harlow' );
			} elseif ( 1 === $count ) {
				$words = $custom ? (string) $get( 'oneComment', __( 'One Comment', 'harlow' ) ) : __( 'One Comment', 'harlow' );
			} else {
				/* translators: %s: how many comments. */
				$words = sprintf( $custom ? (string) $get( 'comments', __( '%s Comments', 'harlow' ) ) : __( '%s Comments', 'harlow' ), number_format_i18n( $count ) );
			}
			$out['html']     = esc_html( $words );
			$out['itemprop'] = 'commentCount';
			$out['url']      = $link ? get_comments_link( $post ) : '';
			break;
		case 'terms':
			$terms = get_the_terms( $post, sanitize_key( (string) $get( 'taxonomy', 'category' ) ) );
			if ( ! is_array( $terms ) || ! $terms ) {
				return null;
			}
			$list = array();
			foreach ( $terms as $term ) {
				$url    = $link ? get_term_link( $term ) : '';
				$list[] = is_string( $url ) && '' !== $url
					? '<a href="' . esc_url( $url ) . '" class="elementor-post-info__terms-list-item">' . esc_html( $term->name ) . '</a>'
					: '<span class="elementor-post-info__terms-list-item">' . esc_html( $term->name ) . '</span>';
			}
			$out['html']     = '<span class="elementor-post-info__terms-list">' . implode( ', ', $list ) . '</span>';
			$out['itemprop'] = 'about';
			break;
		default:
			$out['type'] = 'custom';
			$out['html'] = esc_html( (string) $get( 'customText' ) );
			$out['url']  = $link ? harlow_link_url( (string) $get( 'customUrl' ) ) : '';
	}
	return $out;
}

/**
 * A line's icon: the author's picture, the icon of its kind, the one chosen, or none.
 *
 * @param array<string,mixed>  $item The line's settings: icon (default, none, custom), svg.
 * @param array<string,string> $data The line (harlow_post_info_item()).
 * @return string
 */
function harlow_post_info_icon( $item, $data ) {
	if ( '' !== $data['avatar'] ) {
		return '<span class="elementor-icon-list-icon"><img class="elementor-avatar" src="' . esc_url( $data['avatar'] ) . '" alt="' . esc_attr( wp_strip_all_tags( $data['html'] ) ) . '" loading="lazy"></span>';
	}
	$choice = isset( $item['icon'] ) ? $item['icon'] : 'default';
	if ( 'none' === $choice ) {
		return '';
	}
	if ( 'custom' === $choice ) {
		$svg = isset( $item['svg'] ) ? harlow_icon( (string) $item['svg'] ) : '';
	} else {
		$icons = array(
			'author'   => 'user-circle',
			'date'     => 'calendar',
			'time'     => 'clock',
			'comments' => 'comment-dots',
			'terms'    => 'tags',
			'custom'   => 'tags',
		);
		$svg   = harlow_theme_builder_icon( isset( $icons[ $data['type'] ] ) ? $icons[ $data['type'] ] : 'tags' );
	}
	return '' !== $svg ? '<span class="elementor-icon-list-icon">' . "\n" . $svg . "\n" . '</span>' : '';
}
